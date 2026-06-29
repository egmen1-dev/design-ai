/**
 * Chapter 3.4 — Lifecycle Manager
 * Central orchestrator — no design decisions, no LLM, no direct blueprint mutation.
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { BlueprintLifecycle } from "./lifecycle-types";
import { SectionState } from "./lifecycle-types";
import {
  type AgentContractId,
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
  type BlueprintMutationResult,
  AgentContractError,
} from "./agent-contracts";
import { AGENT_STAGE_MATRIX, AGENT_WRITE_MATRIX } from "./agent-matrix";
import { advanceLifecycleStage } from "./lifecycle";
import { DecisionGraph } from "./decision-graph";
import { MutationEngine } from "./mutation-engine";
import { SnapshotManager } from "./snapshot-manager";
import { RetryEngine, RetryLimitExceededError } from "./retry-engine";
import { AgentRegistry } from "./agent-registry";
import { assertStagePreconditions } from "./stage-preconditions";
import { groupParallelAgents } from "./parallel-execution";
import { ValidationEngine, type ValidationReport } from "./validation-engine";
import {
  ConstraintEngine,
  ConstraintEngineError,
  type ConstraintReport,
} from "./constraint-engine";
import {
  LifecycleEventType,
  PipelineState,
  RetryKind,
  type LifecycleEvent,
  type LifecycleLogEntry,
  type PipelineStateId,
  type StageExecutionResult,
} from "./lifecycle-manager-types";
import type { LifecycleManagedSection } from "./lifecycle-types";
import {
  EventBus,
  DesignEventType,
  EventCategory,
  lifecycleEventToPublish,
  mutationEventPayload,
  validationEventPayload,
  type DesignEvent,
} from "./event-bus";

const MANAGED: LifecycleManagedSection[] = [
  "product",
  "creative",
  "story",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "constraints",
  "validation",
];

function isManagedSection(section: BlueprintSection): section is LifecycleManagedSection {
  return (MANAGED as string[]).includes(section);
}

const DESIGN_TO_LIFECYCLE: Partial<Record<string, LifecycleEvent["type"]>> = {
  [DesignEventType.StageStarted]: LifecycleEventType.StageStarted,
  [DesignEventType.StageCompleted]: LifecycleEventType.StageFinished,
  [DesignEventType.MutationApplied]: LifecycleEventType.MutationApplied,
  [DesignEventType.SnapshotCreated]: LifecycleEventType.SnapshotCreated,
  [DesignEventType.RetryStarted]: LifecycleEventType.RetryStarted,
  [DesignEventType.RollbackStarted]: LifecycleEventType.RollbackStarted,
  [DesignEventType.ValidationFailed]: LifecycleEventType.ValidationFailed,
  [DesignEventType.ConstraintFailed]: LifecycleEventType.ConstraintFailed,
  [DesignEventType.PipelineCompleted]: LifecycleEventType.PipelineFinished,
};

function designEventToLifecycle(event: DesignEvent): LifecycleEvent | null {
  const type = DESIGN_TO_LIFECYCLE[event.type];
  if (!type) return null;
  return {
    type,
    stage: event.metadata.stage,
    revision: event.revision,
    timestamp: event.timestamp,
    agentId: event.payload.agentId as AgentContractId | undefined,
    detail: event.payload.detail as string | undefined,
  };
}

export type LifecycleManagerOptions = {
  registry?: AgentRegistry;
  mutationEngine?: MutationEngine;
  snapshotManager?: SnapshotManager;
  retryEngine?: RetryEngine;
  validationEngine?: ValidationEngine;
  constraintEngine?: ConstraintEngine;
  eventBus?: EventBus;
};

export type ExecuteStageInput = Record<string, unknown>;

export class LifecycleManager {
  private readonly registry: AgentRegistry;
  private readonly mutationEngine: MutationEngine;
  private readonly snapshotManager: SnapshotManager;
  private readonly retryEngine: RetryEngine;
  private readonly validationEngine: ValidationEngine;
  private readonly constraintEngine: ConstraintEngine;
  private readonly eventBus: EventBus;

  private graph: DecisionGraph;
  private pipelineState: PipelineStateId = PipelineState.NEW;
  private readonly logs: LifecycleLogEntry[] = [];
  private eventListeners: Array<(event: LifecycleEvent) => void> = [];
  private blueprintId = "";
  private currentStage: BlueprintLifecycle = "NEW";

  constructor(
    blueprint?: RenderBlueprint,
    options: LifecycleManagerOptions = {},
  ) {
    this.registry = options.registry ?? new AgentRegistry();
    this.mutationEngine = options.mutationEngine ?? new MutationEngine();
    this.snapshotManager = options.snapshotManager ?? new SnapshotManager();
    this.retryEngine = options.retryEngine ?? new RetryEngine();
    this.validationEngine = options.validationEngine ?? new ValidationEngine();
    this.constraintEngine = options.constraintEngine ?? new ConstraintEngine();
    this.eventBus = options.eventBus ?? new EventBus();
    this.graph = blueprint
      ? DecisionGraph.fromBlueprint(blueprint)
      : new DecisionGraph();
    if (blueprint) {
      this.blueprintId = blueprint.meta.id;
      this.eventBus.bindContext({ blueprintId: blueprint.meta.id, stage: blueprint.lifecycle.stage });
    }
    this.mutationEngine.onMutationApplied((evt) => {
      this.eventBus.publish({
        type: DesignEventType.MutationApplied,
        category: EventCategory.MUTATION,
        revision: evt.revision,
        metadata: {
          blueprintId: this.blueprintId,
          stage: this.currentStage,
          producer: evt.producer,
        },
        payload: mutationEventPayload({
          section: evt.section,
          producer: evt.producer,
          revision: evt.revision,
          durationMs: evt.duration,
        }),
      });
      this.notifyLegacyListeners(LifecycleEventType.MutationApplied, this.currentStage, evt.revision, {
        agentId: evt.producer as AgentContractId,
      });
    });
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getDesignEvents(): readonly DesignEvent[] {
    return this.eventBus.getLog();
  }

  getPipelineState(): PipelineStateId {
    return this.pipelineState;
  }

  getGraph(): DecisionGraph {
    return this.graph;
  }

  getSnapshots() {
    return this.snapshotManager.getAll();
  }

  getEvents(): readonly LifecycleEvent[] {
    return this.eventBus
      .getLog()
      .map((e) => designEventToLifecycle(e))
      .filter((e): e is LifecycleEvent => e !== null);
  }

  getLogs(): readonly LifecycleLogEntry[] {
    return this.logs;
  }

  getValidationEngine(): ValidationEngine {
    return this.validationEngine;
  }

  getLastValidationReport(): ValidationReport | undefined {
    return this.lastValidationReport;
  }

  private lastValidationReport?: ValidationReport;
  private lastConstraintReport?: ConstraintReport;

  getConstraintEngine(): ConstraintEngine {
    return this.constraintEngine;
  }

  getLastConstraintReport(): ConstraintReport | undefined {
    return this.lastConstraintReport;
  }

  /** Ch 3.7 — mandatory before Render Adapter; never mutates blueprint */
  assertPreAdapterConstraints(blueprint: RenderBlueprint): ConstraintReport {
    this.constraintEngine.invalidateCache(blueprint.meta.revision ?? 0);
    const report = this.constraintEngine.assertReady(blueprint);
    this.lastConstraintReport = report;
    return report;
  }

  /** Ch 3.6 — mandatory after each mutation; never mutates blueprint */
  private assertPostMutationValidation(
    blueprint: RenderBlueprint,
    stage: BlueprintLifecycle,
    agentId?: AgentContractId,
  ): ValidationReport {
    this.eventBus.publish({
      type: DesignEventType.ValidationStarted,
      category: EventCategory.VALIDATION,
      revision: blueprint.meta.revision ?? 0,
      metadata: {
        blueprintId: blueprint.meta.id,
        stage,
        producer: agentId ?? "validation-engine",
      },
      payload: { revision: blueprint.meta.revision ?? 0 },
    });

    this.validationEngine.invalidateCache(blueprint.meta.revision ?? 0);
    const report = this.validationEngine.validate(blueprint, { graph: this.graph });
    this.lastValidationReport = report;

    if (report.hasFatal || report.hasError) {
      this.eventBus.publish({
        type: DesignEventType.ValidationFailed,
        category: EventCategory.VALIDATION,
        revision: report.revision,
        metadata: { blueprintId: blueprint.meta.id, stage, producer: "validation-engine" },
        payload: {
          ...validationEventPayload({
            revision: report.revision,
            passed: false,
            score: report.score,
            errorCount: report.errors.length,
            warningCount: report.warnings.length,
          }),
          agentId: agentId,
          detail: report.errors.map((e) => e.message).join("; "),
        },
      });
      this.notifyLegacyListeners(LifecycleEventType.ValidationFailed, stage, report.revision, {
        agentId,
        detail: report.errors.map((e) => e.message).join("; "),
      });
      throw new AgentContractError(
        report.hasFatal ? "fatal" : "recoverable",
        `Validation failed: ${report.errors.map((e) => e.message).join("; ")}`,
        "VALIDATION_FAILED",
      );
    }

    this.eventBus.publish({
      type: DesignEventType.ValidationPassed,
      category: EventCategory.VALIDATION,
      revision: report.revision,
      metadata: { blueprintId: blueprint.meta.id, stage, producer: "validation-engine" },
      payload: validationEventPayload({
        revision: report.revision,
        passed: true,
        score: report.score,
        errorCount: 0,
        warningCount: report.warnings.length,
      }),
    });
    if (report.warnings.length) {
      this.eventBus.publish({
        type: DesignEventType.ValidationWarning,
        category: EventCategory.VALIDATION,
        revision: report.revision,
        metadata: { blueprintId: blueprint.meta.id, stage, producer: "validation-engine" },
        payload: { warningCount: report.warnings.length },
      });
    }
    return report;
  }

  onEvent(listener: (event: LifecycleEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  registerAgent<TInput, TResult extends AgentResultBase>(
    agent: BlueprintAgent<TInput, TResult>,
  ): void {
    this.registry.register(agent);
  }

  private notifyLegacyListeners(
    type: LifecycleEvent["type"],
    stage: BlueprintLifecycle,
    revision: number,
    extra?: Partial<LifecycleEvent>,
  ): void {
    const legacy: LifecycleEvent = {
      type,
      stage,
      revision,
      timestamp: Date.now(),
      ...extra,
    };
    for (const listener of this.eventListeners) listener(legacy);
  }

  private publishLifecycle(
    type: LifecycleEvent["type"],
    stage: BlueprintLifecycle,
    revision: number,
    extra?: Partial<LifecycleEvent>,
  ): void {
    const blueprintId = this.blueprintId || "unknown";
    this.eventBus.publish(
      lifecycleEventToPublish(type, stage, revision, blueprintId, {
        agentId: extra?.agentId,
        detail: extra?.detail,
      }),
    );
    this.notifyLegacyListeners(type, stage, revision, extra);
  }

  private log(entry: LifecycleLogEntry): void {
    this.logs.push(entry);
  }

  /**
   * Chapter 3.4 execute algorithm:
   * agent → validate → dependency graph → mutation → snapshot
   */
  async executeStage(
    blueprint: RenderBlueprint,
    stage: BlueprintLifecycle,
    input: ExecuteStageInput = {},
  ): Promise<StageExecutionResult> {
    const startedAt = Date.now();
    this.pipelineState = PipelineState.RUNNING;
    const revision = blueprint.meta.revision ?? 0;
    this.blueprintId = blueprint.meta.id;
    this.currentStage = stage;
    this.eventBus.bindContext({ blueprintId: blueprint.meta.id, stage, producer: "lifecycle-manager" });
    this.eventBus.lock();
    this.eventBus.publish({
      type: DesignEventType.PipelineStarted,
      category: EventCategory.LIFECYCLE,
      revision,
      metadata: { blueprintId: blueprint.meta.id, stage, producer: "lifecycle-manager" },
      payload: { pipelineId: this.eventBus.getPipelineId() },
    });
    this.publishLifecycle(LifecycleEventType.StageStarted, stage, revision);

    assertStagePreconditions(blueprint, stage);

    const agents = this.registry.getByStage(stage);
    if (!agents.length) {
      throw new AgentContractError(
        "recoverable",
        `No agent registered for stage ${stage}`,
        "AGENT_NOT_REGISTERED",
      );
    }

    this.graph = DecisionGraph.fromBlueprint(blueprint);
    let current = blueprint;
    let lastSnapshotId: string | undefined;
    const stageEvents: LifecycleEvent[] = [];

    const groups = groupParallelAgents(agents);

    try {
      for (const group of groups) {
        const results = await Promise.all(
          group.map(async (agent) => {
            if (!agent.canExecute(current)) {
              throw new AgentContractError(
                "recoverable",
                `Agent ${agent.id} cannot execute at stage ${current.lifecycle.stage}`,
                "AGENT_NOT_READY",
              );
            }
            this.eventBus.publish({
              type: DesignEventType.AgentStarted,
              category: EventCategory.AGENT,
              revision: current.meta.revision ?? 0,
              metadata: {
                blueprintId: current.meta.id,
                stage,
                producer: agent.id,
              },
              payload: { agentId: agent.id },
            });
            const frozen = Object.freeze(structuredClone(current)) as RenderBlueprint;
            const agentResult = await agent.execute(frozen, input);
            this.eventBus.publish({
              type: DesignEventType.AgentCompleted,
              category: EventCategory.AGENT,
              revision: current.meta.revision ?? 0,
              metadata: { blueprintId: current.meta.id, stage, producer: agent.id },
              payload: {
                agentId: agent.id,
                confidence: agentResult.confidence,
              },
            });
            return { agent, agentResult };
          }),
        );

        this.pipelineState = PipelineState.VALIDATING;

        for (const { agent, agentResult } of results) {
          if (agentResult.errors?.some((e) => e.kind === "fatal")) {
            this.eventBus.publish({
              type: DesignEventType.AgentRejected,
              category: EventCategory.AGENT,
              revision: current.meta.revision ?? 0,
              metadata: { blueprintId: current.meta.id, stage, producer: agent.id },
              payload: { agentId: agent.id },
            });
            this.publishLifecycle(LifecycleEventType.ValidationFailed, stage, current.meta.revision ?? 0, {
              agentId: agent.id,
              detail: agentResult.errors!.map((e) => e.message).join("; "),
            });
            throw new AgentContractError("fatal", "Stage validation failed", "VALIDATION_FAILED");
          }

          this.eventBus.publish({
            type: DesignEventType.MutationReceived,
            category: EventCategory.MUTATION,
            revision: current.meta.revision ?? 0,
            metadata: { blueprintId: current.meta.id, stage, producer: agent.id },
            payload: { agentId: agent.id },
          });

          const updates = agent.toUpdates(agentResult);
          const mutation = this.mutationEngine.apply({
            blueprint: current,
            graph: this.graph,
            agent,
            result: { ...agentResult, updates },
            expectedRevision: current.meta.revision ?? 0,
          });

          this.eventBus.publish({
            type: DesignEventType.MutationValidated,
            category: EventCategory.MUTATION,
            revision: current.meta.revision ?? 0,
            metadata: { blueprintId: current.meta.id, stage, producer: agent.id },
            payload: { agentId: agent.id },
          });

          current = mutation.blueprint;

          this.assertPostMutationValidation(current, stage, agent.id);
          const validationReport = this.lastValidationReport!;

          const snapshot = this.snapshotManager.store({
            blueprint: current,
            graph: this.graph,
            stage,
            agentId: agent.id,
            agentResult,
            validated: true,
            validation: validationReport,
            durationMs: Date.now() - startedAt,
          });
          lastSnapshotId = snapshot.id;

          this.publishLifecycle(LifecycleEventType.SnapshotCreated, stage, current.meta.revision ?? 0, {
            agentId: agent.id,
            detail: snapshot.id,
          });
          this.eventBus.publish({
            type: DesignEventType.AgentApproved,
            category: EventCategory.AGENT,
            revision: current.meta.revision ?? 0,
            metadata: { blueprintId: current.meta.id, stage, producer: agent.id },
            payload: { agentId: agent.id, snapshotId: snapshot.id },
          });

          this.log({
            stage,
            agentId: agent.id,
            revision: current.meta.revision ?? 0,
            durationMs: Date.now() - startedAt,
            retryCount: this.retryEngine.getCount(RetryKind.Agent, stage, agent.id),
            success: true,
            at: Date.now(),
          });
        }
      }

      this.pipelineState = PipelineState.RUNNING;
      this.publishLifecycle(LifecycleEventType.StageFinished, stage, current.meta.revision ?? 0);
      this.eventBus.unlock();

      return {
        blueprint: current,
        graph: this.graph,
        revision: current.meta.revision ?? 0,
        snapshotId: lastSnapshotId,
        events: stageEvents,
      };
    } catch (error) {
      this.pipelineState = PipelineState.FAILED;
      this.eventBus.publish({
        type: DesignEventType.StageFailed,
        category: EventCategory.LIFECYCLE,
        revision: blueprint.meta.revision ?? 0,
        metadata: { blueprintId: blueprint.meta.id, stage, producer: "lifecycle-manager" },
        payload: { error: error instanceof Error ? error.message : "unknown" },
      });
      this.eventBus.publish({
        type: DesignEventType.PipelineFailed,
        category: EventCategory.LIFECYCLE,
        revision: blueprint.meta.revision ?? 0,
        metadata: { blueprintId: blueprint.meta.id, stage, producer: "lifecycle-manager" },
      });
      this.eventBus.unlock();
      throw error;
    }
  }

  /** Recovery — restore last VALIDATED snapshot + graph + revision (Ch 3.8) */
  recover(blueprint: RenderBlueprint): RenderBlueprint {
    const result = this.snapshotManager.rollbackToLastValidated(blueprint, this.graph);
    this.graph = DecisionGraph.fromBlueprint(result.blueprint);
    this.pipelineState = PipelineState.RUNNING;
    this.publishLifecycle(LifecycleEventType.RollbackStarted, result.blueprint.lifecycle.stage, result.blueprint.meta.revision ?? 0, {
      detail: result.snapshot.id,
    });
    this.eventBus.publish({
      type: DesignEventType.RollbackCompleted,
      category: EventCategory.RECOVERY,
      revision: result.blueprint.meta.revision ?? 0,
      metadata: {
        blueprintId: result.blueprint.meta.id,
        stage: result.resumeFrom,
        producer: "snapshot-manager",
      },
      payload: { snapshotId: result.snapshot.id },
    });
    return result.blueprint;
  }

  rollbackSection(
    section: import("./lifecycle-types").LifecycleManagedSection,
    blueprint: RenderBlueprint,
  ): RenderBlueprint {
    const result = this.snapshotManager.rollbackSection(section, blueprint, this.graph);
    this.graph = DecisionGraph.fromBlueprint(result.blueprint);
    return result.blueprint;
  }

  rollbackStage(stage: BlueprintLifecycle, blueprint: RenderBlueprint): RenderBlueprint {
    const result = this.snapshotManager.rollbackStage(stage, blueprint, this.graph);
    this.graph = DecisionGraph.fromBlueprint(result.blueprint);
    return result.blueprint;
  }

  compareSnapshots(a: string, b: string) {
    return this.snapshotManager.compare(a, b);
  }

  finishPipelineWithRetention(blueprint: RenderBlueprint, succeeded = true): RenderBlueprint {
    this.snapshotManager.applyRetention(succeeded, !succeeded);
    return this.finishPipeline(blueprint);
  }

  /**
   * Legacy API (Ch 3.2) — delegates to MutationEngine.
   * Golden Rule: Decision Graph first, RenderBlueprint second.
   */
  apply(
    agentId: AgentContractId,
    blueprint: RenderBlueprint,
    result: AgentResultBase & { updates: AgentSectionUpdates },
  ): BlueprintMutationResult {
    this.graph = DecisionGraph.fromBlueprint(blueprint);
    const agent = {
      id: agentId,
      version: "legacy",
      stage: AGENT_STAGE_MATRIX[agentId],
      canExecute: () => true,
      execute: async () => result,
      toUpdates: () => result.updates,
    } as BlueprintAgent<unknown, AgentResultBase>;

    const mutation = this.mutationEngine.apply({
      blueprint,
      graph: this.graph,
      agent,
      result,
      expectedRevision: blueprint.meta.revision ?? 0,
    });

    this.graph = DecisionGraph.fromBlueprint(mutation.blueprint);
    this.assertPostMutationValidation(mutation.blueprint, mutation.blueprint.lifecycle.stage, agentId);
    return mutation;
  }

  canExecuteAgent(agentId: AgentContractId, blueprint: RenderBlueprint): boolean {
    const expected = AGENT_STAGE_MATRIX[agentId];
    if (blueprint.lifecycle.stage !== expected) return false;
    const writes = AGENT_WRITE_MATRIX[agentId];
    if (writes.length === 0) return true;
    return writes.some((section) => {
      if (!isManagedSection(section)) return true;
      return blueprint.lifecycle.sections[section] !== SectionState.LOCKED;
    });
  }

  async runAgent<TInput, TResult extends AgentResultBase>(
    agent: BlueprintAgent<TInput, TResult>,
    blueprint: RenderBlueprint,
    input: TInput,
  ): Promise<{ blueprint: RenderBlueprint; mutation: BlueprintMutationResult; result: TResult }> {
    if (!agent.canExecute(blueprint)) {
      throw new AgentContractError(
        "recoverable",
        `Agent ${agent.id} cannot execute at stage ${blueprint.lifecycle.stage}`,
        "AGENT_NOT_READY",
      );
    }

    const expectedRevision = blueprint.meta.revision ?? 0;
    const frozen = Object.freeze(structuredClone(blueprint)) as RenderBlueprint;
    const result = await agent.execute(frozen, input);
    const updates = agent.toUpdates(result);

    try {
      const mutation = this.mutationEngine.apply({
        blueprint,
        graph: DecisionGraph.fromBlueprint(blueprint),
        agent: agent as BlueprintAgent<unknown, AgentResultBase>,
        result: { ...result, updates },
        expectedRevision,
      });
      this.graph = DecisionGraph.fromBlueprint(mutation.blueprint);
      this.assertPostMutationValidation(mutation.blueprint, mutation.blueprint.lifecycle.stage, agent.id);
      return { blueprint: mutation.blueprint, mutation, result };
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "OPTIMISTIC_LOCK"
      ) {
        throw new AgentContractError(
          "recoverable",
          error.message,
          "OPTIMISTIC_LOCK",
        );
      }
      throw error;
    }
  }

  async retryAgent<TInput, TResult extends AgentResultBase>(
    kind: (typeof RetryKind)[keyof typeof RetryKind],
    agent: BlueprintAgent<TInput, TResult>,
    blueprint: RenderBlueprint,
    input: TInput,
  ): Promise<{ blueprint: RenderBlueprint; mutation: BlueprintMutationResult; result: TResult }> {
    const stage = blueprint.lifecycle.stage;
    this.retryEngine.recordRetry(kind, stage, agent.id);
    this.publishLifecycle(LifecycleEventType.RetryStarted, stage, blueprint.meta.revision ?? 0, {
      agentId: agent.id,
      detail: kind,
    });
    return this.runAgent(agent, blueprint, input);
  }

  completeStage(blueprint: RenderBlueprint): RenderBlueprint {
    const next = advanceLifecycleStage(blueprint);
    if (next.lifecycle.stage === "FROZEN") {
      try {
        this.assertPreAdapterConstraints(next);
      } catch (error) {
        if (error instanceof ConstraintEngineError) {
          this.publishLifecycle(LifecycleEventType.ConstraintFailed, next.lifecycle.stage, next.meta.revision ?? 0, {
            detail: error.message,
          });
        }
        throw error;
      }
      this.graph.freezeAll();
      this.pipelineState = PipelineState.LOCKED;
    }
    return next;
  }

  finishPipeline(blueprint: RenderBlueprint): RenderBlueprint {
    this.pipelineState = PipelineState.FINISHED;
    this.publishLifecycle(LifecycleEventType.PipelineFinished, blueprint.lifecycle.stage, blueprint.meta.revision ?? 0);
    return blueprint;
  }
}

export { RetryLimitExceededError };

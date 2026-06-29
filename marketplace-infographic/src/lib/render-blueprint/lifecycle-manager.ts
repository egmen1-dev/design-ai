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

export type LifecycleManagerOptions = {
  registry?: AgentRegistry;
  mutationEngine?: MutationEngine;
  snapshotManager?: SnapshotManager;
  retryEngine?: RetryEngine;
  validationEngine?: ValidationEngine;
  constraintEngine?: ConstraintEngine;
};

export type ExecuteStageInput = Record<string, unknown>;

export class LifecycleManager {
  private readonly registry: AgentRegistry;
  private readonly mutationEngine: MutationEngine;
  private readonly snapshotManager: SnapshotManager;
  private readonly retryEngine: RetryEngine;
  private readonly validationEngine: ValidationEngine;
  private readonly constraintEngine: ConstraintEngine;

  private graph: DecisionGraph;
  private pipelineState: PipelineStateId = PipelineState.NEW;
  private readonly events: LifecycleEvent[] = [];
  private readonly logs: LifecycleLogEntry[] = [];
  private eventListeners: Array<(event: LifecycleEvent) => void> = [];

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
    this.graph = blueprint
      ? DecisionGraph.fromBlueprint(blueprint)
      : new DecisionGraph();
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
    return this.events;
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
    this.validationEngine.invalidateCache(blueprint.meta.revision ?? 0);
    const report = this.validationEngine.validate(blueprint, { graph: this.graph });
    this.lastValidationReport = report;

    if (report.hasFatal || report.hasError) {
      this.emit(LifecycleEventType.ValidationFailed, stage, report.revision, {
        agentId,
        detail: report.errors.map((e) => e.message).join("; "),
      });
      throw new AgentContractError(
        report.hasFatal ? "fatal" : "recoverable",
        `Validation failed: ${report.errors.map((e) => e.message).join("; ")}`,
        "VALIDATION_FAILED",
      );
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

  private emit(
    type: LifecycleEvent["type"],
    stage: BlueprintLifecycle,
    revision: number,
    extra?: Partial<LifecycleEvent>,
  ): void {
    const event: LifecycleEvent = {
      type,
      stage,
      revision,
      timestamp: Date.now(),
      ...extra,
    };
    this.events.push(event);
    for (const listener of this.eventListeners) listener(event);
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
    this.emit(LifecycleEventType.StageStarted, stage, revision);

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
            const frozen = Object.freeze(structuredClone(current)) as RenderBlueprint;
            const agentResult = await agent.execute(frozen, input);
            return { agent, agentResult };
          }),
        );

        this.pipelineState = PipelineState.VALIDATING;

        for (const { agent, agentResult } of results) {
          if (agentResult.errors?.some((e) => e.kind === "fatal")) {
            this.emit(LifecycleEventType.ValidationFailed, stage, current.meta.revision ?? 0, {
              agentId: agent.id,
              detail: agentResult.errors!.map((e) => e.message).join("; "),
            });
            throw new AgentContractError("fatal", "Stage validation failed", "VALIDATION_FAILED");
          }

          const updates = agent.toUpdates(agentResult);
          const mutation = this.mutationEngine.apply({
            blueprint: current,
            graph: this.graph,
            agent,
            result: { ...agentResult, updates },
            expectedRevision: current.meta.revision ?? 0,
          });

          current = mutation.blueprint;

          this.assertPostMutationValidation(current, stage, agent.id);

          const snapshot = this.snapshotManager.store({
            blueprint: current,
            graph: this.graph,
            stage,
            agentId: agent.id,
            agentResult,
            validated: true,
          });
          lastSnapshotId = snapshot.id;

          this.emit(LifecycleEventType.MutationApplied, stage, current.meta.revision ?? 0, {
            agentId: agent.id,
          });
          this.emit(LifecycleEventType.SnapshotCreated, stage, current.meta.revision ?? 0, {
            agentId: agent.id,
            detail: snapshot.id,
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
      this.emit(LifecycleEventType.StageFinished, stage, current.meta.revision ?? 0);

      return {
        blueprint: current,
        graph: this.graph,
        revision: current.meta.revision ?? 0,
        snapshotId: lastSnapshotId,
        events: stageEvents,
      };
    } catch (error) {
      this.pipelineState = PipelineState.FAILED;
      throw error;
    }
  }

  /** Recovery — restore last VALIDATED snapshot + graph + revision */
  recover(blueprint: RenderBlueprint): RenderBlueprint {
    const { blueprint: restored, graph } = this.snapshotManager.rollbackToLastValidated(
      blueprint,
      this.graph,
    );
    this.graph = graph;
    this.pipelineState = PipelineState.RUNNING;
    this.emit(LifecycleEventType.RollbackStarted, restored.lifecycle.stage, restored.meta.revision ?? 0);
    return restored;
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
    this.emit(LifecycleEventType.RetryStarted, stage, blueprint.meta.revision ?? 0, {
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
          this.emit(LifecycleEventType.ConstraintFailed, next.lifecycle.stage, next.meta.revision ?? 0, {
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
    this.emit(LifecycleEventType.PipelineFinished, blueprint.lifecycle.stage, blueprint.meta.revision ?? 0);
    return blueprint;
  }
}

export { RetryLimitExceededError };

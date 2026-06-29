/**
 * Chapter 4.2 — Agent Lifecycle orchestrator
 * All agents pass through 10 mandatory stages — LM-controlled only.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_STAGE_MATRIX } from "./agent-matrix";
import { AgentRegistry } from "./agent-registry";
import { DecisionGraph } from "./decision-graph";
import { MutationEngine } from "./mutation-engine";
import { ValidationEngine } from "./validation-engine";
import { EventBus, DesignEventType, EventCategory } from "./event-bus";
import { createAgentContext, preconditionsMet } from "./universal-agent-contract";
import {
  assertUniversalAgentContract,
  validateUniversalAgentContract,
} from "./universal-agent-contract-validator";
import { universalToLegacyConfidence } from "./universal-agent-bridge";
import type { RenderBlueprint } from "./types";
import {
  AGENT_LIFECYCLE_STAGE_ORDER,
  AgentLifecycleStage,
  assertStageOrder,
} from "./agent-lifecycle";
import type {
  AgentLifecycleFailure,
  AgentLifecycleOrchestratorOptions,
  AgentLifecycleResult,
  AgentLifecycleRunInput,
  AgentLifecycleStageRecord,
} from "./agent-lifecycle-types";
import type { AgentContext, UniversalAgentResult } from "./universal-agent-contract-types";

export class AgentLifecycleError extends Error {
  readonly failure: AgentLifecycleFailure;

  constructor(failure: AgentLifecycleFailure) {
    super(`[${failure.stage}] ${failure.message}`);
    this.name = "AgentLifecycleError";
    this.failure = failure;
  }
}

type OrchestratorDeps = {
  registry: AgentRegistry;
  mutationEngine: MutationEngine;
  validationEngine: ValidationEngine;
  eventBus: EventBus;
};

export class AgentLifecycleSession {
  private readonly executed = new Set<string>();

  assertOncePerStage(agentId: string, stage: string): void {
    const key = `${agentId}:${stage}`;
    if (this.executed.has(key)) {
      throw new AgentLifecycleError({
        stage: AgentLifecycleStage.EXECUTE,
        code: "DUPLICATE_STAGE_EXECUTION",
        message: `Agent ${agentId} already executed for stage ${stage}`,
      });
    }
    this.executed.add(key);
  }
}

export class AgentLifecycleOrchestrator {
  private readonly deps: OrchestratorDeps;
  private readonly options: AgentLifecycleOrchestratorOptions;
  private readonly session = new AgentLifecycleSession();

  constructor(
    deps: Partial<OrchestratorDeps> = {},
    options: AgentLifecycleOrchestratorOptions = {},
  ) {
    this.deps = {
      registry: deps.registry ?? new AgentRegistry(),
      mutationEngine: deps.mutationEngine ?? new MutationEngine(),
      validationEngine: deps.validationEngine ?? new ValidationEngine(),
      eventBus: deps.eventBus ?? new EventBus(),
    };
    this.options = options;
  }

  getRegistry(): AgentRegistry {
    return this.deps.registry;
  }

  /** Run full 10-stage agent lifecycle */
  async run(input: AgentLifecycleRunInput): Promise<AgentLifecycleResult> {
    const stages: AgentLifecycleStageRecord[] = [];
    const revisionBefore = input.blueprint.meta.revision ?? 0;
    let blueprint = input.blueprint;
    let agentResult: UniversalAgentResult | undefined;
    let context: AgentContext | undefined;
    let disposed = false;

    const record = (stage: typeof AgentLifecycleStage[keyof typeof AgentLifecycleStage], detail?: string) => {
      assertStageOrder(
        stages.map((s) => s.stage),
        stage,
      );
      stages.push({ stage, at: Date.now(), detail });
    };

    const fail = (
      stage: typeof AgentLifecycleStage[keyof typeof AgentLifecycleStage],
      code: string,
      message: string,
      recommendations?: UniversalAgentResult["recommendations"],
    ): AgentLifecycleResult => ({
      success: false,
      agentId: input.agent.id,
      blueprint,
      result: agentResult,
      stages,
      failure: { stage, code, message, recoveryRecommendations: recommendations },
      revisionBefore,
      revisionAfter: blueprint.meta.revision ?? 0,
      disposed,
    });

    try {
      // Stage 1 — Registered
      record(AgentLifecycleStage.REGISTERED);
      const registered = this.stageRegistered(input);
      if (!registered.ok) {
        return fail(AgentLifecycleStage.REGISTERED, registered.code!, registered.message!);
      }

      // Stage 2 — Discovered
      record(AgentLifecycleStage.DISCOVERED);
      const discovered = this.stageDiscovered(input);
      if (!discovered.ok && !input.force) {
        return {
          success: true,
          skipped: true,
          agentId: input.agent.id,
          blueprint,
          stages,
          revisionBefore,
          revisionAfter: revisionBefore,
          disposed: false,
        };
      }
      if (!discovered.ok && input.force) {
        return fail(AgentLifecycleStage.DISCOVERED, discovered.code!, discovered.message!);
      }

      // Stage 3 — Validated
      record(AgentLifecycleStage.VALIDATED);
      const validated = this.stageValidated(input);
      if (!validated.ok) {
        return fail(AgentLifecycleStage.VALIDATED, validated.code!, validated.message!);
      }

      // Stage 4 — Initialized
      record(AgentLifecycleStage.INITIALIZED);
      context = createAgentContext({
        blueprint,
        snapshot: input.snapshot,
        pipelineId: input.pipelineId,
        debug: input.debug,
      });

      // Stage 5 — Execute
      record(AgentLifecycleStage.EXECUTE);
      this.session.assertOncePerStage(input.agent.id, input.pipelineStage);
      this.deps.eventBus.publish({
        type: DesignEventType.AgentStarted,
        category: EventCategory.AGENT,
        revision: blueprint.meta.revision ?? 0,
        metadata: {
          blueprintId: blueprint.meta.id,
          stage: input.pipelineStage,
          producer: input.agent.id,
        },
        payload: { agentId: input.agent.id },
      });
      agentResult = await input.agent.execute(context);

      // Stage 6 — Decision
      record(AgentLifecycleStage.DECISION);
      const decision = this.stageDecision(input, agentResult);
      if (!decision.ok) {
        return fail(
          AgentLifecycleStage.DECISION,
          decision.code!,
          decision.message!,
          agentResult.recommendations,
        );
      }

      // Stage 7 — Mutation
      record(AgentLifecycleStage.MUTATION);
      const graph = DecisionGraph.fromBlueprint(blueprint);
      const preMutation = structuredClone(blueprint);
      const batch = this.deps.mutationEngine.applyBatch(
        blueprint,
        graph,
        { mutations: agentResult.mutations },
        universalToLegacyConfidence(agentResult),
      );
      blueprint = batch.blueprint;

      // Stage 8 — Validation
      record(AgentLifecycleStage.VALIDATION);
      const validation = this.deps.validationEngine.validate(blueprint, { graph });
      if (validation.hasFatal || validation.hasError) {
        blueprint = preMutation;
        return fail(
          AgentLifecycleStage.VALIDATION,
          "VALIDATION_FAILED",
          validation.errors.map((e) => e.message).join("; "),
          agentResult.recommendations,
        );
      }

      // Stage 9 — Completed
      record(AgentLifecycleStage.COMPLETED, `revision=${blueprint.meta.revision ?? 0}`);
      this.deps.registry.recordRunResult(input.agent.id as AgentContractId, {
        durationMs: agentResult.diagnostics.executionTimeMs,
        result: "success",
        confidence: universalToLegacyConfidence(agentResult),
      });
      this.deps.eventBus.publish({
        type: DesignEventType.AgentCompleted,
        category: EventCategory.AGENT,
        revision: blueprint.meta.revision ?? 0,
        metadata: {
          blueprintId: blueprint.meta.id,
          stage: input.pipelineStage,
          producer: input.agent.id,
        },
        payload: {
          agentId: input.agent.id,
          confidence: universalToLegacyConfidence(agentResult),
        },
      });

      // Stage 10 — Disposed
      record(AgentLifecycleStage.DISPOSED);
      this.stageDisposed(input);
      disposed = true;

      return {
        success: true,
        agentId: input.agent.id,
        blueprint,
        result: agentResult,
        stages,
        revisionBefore,
        revisionAfter: blueprint.meta.revision ?? 0,
        disposed,
      };
    } catch (error) {
      const stage =
        stages.length < AGENT_LIFECYCLE_STAGE_ORDER.length
          ? AGENT_LIFECYCLE_STAGE_ORDER[stages.length]!
          : AgentLifecycleStage.EXECUTE;
      return fail(
        stage,
        "LIFECYCLE_EXCEPTION",
        error instanceof Error ? error.message : String(error),
        agentResult?.recommendations,
      );
    }
  }

  private stageRegistered(input: AgentLifecycleRunInput): { ok: boolean; code?: string; message?: string } {
    const agent = input.agent;
    if (!agent.id?.trim()) {
      return { ok: false, code: "MISSING_ID", message: "Agent must be registered with stable id" };
    }
    if (!agent.version?.trim()) {
      return { ok: false, code: "MISSING_VERSION", message: "Agent must declare version" };
    }
    if (!agent.category) {
      return { ok: false, code: "MISSING_CATEGORY", message: "Agent must declare category" };
    }
    const descriptor = this.deps.registry.getDescriptor(input.agent.id as AgentContractId);
    if (descriptor && descriptor.version !== agent.version) {
      return {
        ok: false,
        code: "VERSION_MISMATCH",
        message: `Registry version ${descriptor.version} != agent version ${agent.version}`,
      };
    }
    return { ok: true };
  }

  private stageDiscovered(input: AgentLifecycleRunInput): { ok: boolean; code?: string; message?: string } {
    const matrixStage = AGENT_STAGE_MATRIX[input.agent.id as AgentContractId];
    if (matrixStage && matrixStage !== input.pipelineStage) {
      return {
        ok: false,
        code: "STAGE_NOT_REQUIRED",
        message: `Agent ${input.agent.id} not required at pipeline stage ${input.pipelineStage}`,
      };
    }
    const ctx = createAgentContext({ blueprint: input.blueprint, pipelineId: input.pipelineId });
    if (!input.agent.canExecute(ctx)) {
      return {
        ok: false,
        code: "NOT_READY",
        message: `Agent ${input.agent.id} cannot execute — preconditions not met`,
      };
    }
    if (!preconditionsMet(input.agent, ctx)) {
      return {
        ok: false,
        code: "CONSUMED_SECTIONS_MISSING",
        message: `Consumed sections not ready for ${input.agent.id}`,
      };
    }
    return { ok: true };
  }

  private stageValidated(input: AgentLifecycleRunInput): { ok: boolean; code?: string; message?: string } {
    const report = validateUniversalAgentContract(input.agent);
    if (!report.valid) {
      return {
        ok: false,
        code: "CONTRACT_INVALID",
        message: report.violations.map((v) => v.message).join("; "),
      };
    }
    const registration = this.deps.registry.getRegistration(input.agent.id as AgentContractId);
    if (registration && !registration.descriptor.enabled) {
      return { ok: false, code: "AGENT_DISABLED", message: `Agent ${input.agent.id} is disabled` };
    }
    return { ok: true };
  }

  private stageDecision(
    input: AgentLifecycleRunInput,
    result: UniversalAgentResult,
  ): { ok: boolean; code?: string; message?: string } {
    try {
      assertUniversalAgentContract(input.agent, result);
    } catch (e) {
      return {
        ok: false,
        code: "INVALID_RESULT",
        message: e instanceof Error ? e.message : "Invalid agent result",
      };
    }
    if (!result.approved) {
      return { ok: false, code: "NOT_APPROVED", message: "Agent result not approved" };
    }
    if (!result.mutations.length) {
      return { ok: false, code: "NO_MUTATIONS", message: "Decision incomplete — no mutations formed" };
    }
    return { ok: true };
  }

  private stageDisposed(input: AgentLifecycleRunInput): void {
    this.deps.registry.disposeInstances();
    void input;
  }
}

/** Convenience — run lifecycle with default orchestrator */
export async function runAgentLifecycle(
  input: AgentLifecycleRunInput,
  deps?: Partial<OrchestratorDeps>,
): Promise<AgentLifecycleResult> {
  return new AgentLifecycleOrchestrator(deps).run(input);
}

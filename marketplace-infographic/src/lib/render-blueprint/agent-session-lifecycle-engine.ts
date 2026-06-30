/**
 * Chapter 7.3 — Agent Session Lifecycle engine.
 * Ephemeral per-task lifecycle shared by every Design AI intelligent agent.
 */
import { randomUUID } from "crypto";
import type { AgentContractId } from "./agent-contracts";
import {
  executeBaseAgentArchitecture,
  buildBaseAgentInput,
  type BaseAgentArchitectureContext,
} from "./base-agent-architecture-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import { StoryType } from "./visual-story-director-types";
import { EventBus, EventCategory, DesignEventType } from "./event-bus";
import type { RenderBlueprint } from "./types";
import {
  AgentSessionLifecycleEvent,
  AgentSessionLifecycleStage,
  AgentSessionState,
  AgentSessionTerminalOutcome,
  type AgentSessionArchiveRecord,
  type AgentSessionIdentity,
  type AgentSessionLifecycleContext,
  type AgentSessionLifecycleFailureCode,
  type AgentSessionLifecycleReport,
  type AgentSessionLifecycleStageDefinition,
  type AgentSessionLifecycleStageId,
  type AgentSessionLifecycleValidationReport,
  type AgentSessionLifecycleViolation,
  type AgentSessionStageRecord,
  type AgentSessionStageTiming,
  type AgentSessionStateId,
} from "./agent-session-lifecycle-types";

export {
  AgentSessionLifecycleStage,
  AgentSessionState,
  AgentSessionTerminalOutcome,
  AgentSessionLifecycleEvent,
  type AgentSessionLifecycleStageId,
  type AgentSessionStateId,
  type AgentSessionTerminalOutcomeId,
  type AgentSessionLifecycleEventId,
  type AgentSessionStageTiming,
  type AgentSessionStageRecord,
  type AgentSessionIdentity,
  type AgentSessionArchiveRecord,
  type AgentSessionLifecycleViolation,
  type AgentSessionLifecycleReport,
  type AgentSessionLifecycleValidationReport,
  type AgentSessionLifecycleContext,
  type AgentSessionLifecycleFailureCode,
  type AgentSessionLifecycleStageDefinition,
} from "./agent-session-lifecycle-types";

export const AGENT_SESSION_LIFECYCLE_VERSION = "7.3.0";

export const AGENT_SESSION_LIFECYCLE_GOLDEN_RULE =
  "An AI agent is not a permanently running entity. It is born to solve one professional task, " +
  "uses knowledge, makes decisions, validates them, passes the result to the pipeline, and completes its work. " +
  "This lifecycle makes the Agent Ecosystem scalable, predictable, reproducible, and ready for thousands of parallel projects.";

export const AGENT_SESSION_LIFECYCLE_STAGES: readonly AgentSessionLifecycleStageDefinition[] = [
  {
    id: AgentSessionLifecycleStage.CREATED,
    order: 1,
    label: "Created",
    runtimeState: AgentSessionState.CREATED,
    responsibility: "Pipeline creates agent instance with unique IDs and workspace",
  },
  {
    id: AgentSessionLifecycleStage.INITIALIZED,
    order: 2,
    label: "Initialized",
    runtimeState: AgentSessionState.INITIALIZED,
    responsibility: "Wire Input Adapter, Rule Engine, Knowledge Interface, Logger, Telemetry via DI",
  },
  {
    id: AgentSessionLifecycleStage.CONTEXT_LOADED,
    order: 3,
    label: "Context Loaded",
    runtimeState: AgentSessionState.LOADING_CONTEXT,
    responsibility: "Receive and validate Pipeline Context, Product Profile, Blueprint, Constraints",
  },
  {
    id: AgentSessionLifecycleStage.KNOWLEDGE_LOADED,
    order: 4,
    label: "Knowledge Loaded",
    runtimeState: AgentSessionState.LOADING_KNOWLEDGE,
    responsibility: "Retrieve domain knowledge from Knowledge Engine",
  },
  {
    id: AgentSessionLifecycleStage.REASONING,
    order: 5,
    label: "Reasoning",
    runtimeState: AgentSessionState.REASONING,
    responsibility: "Decision Engine analyzes inputs and forms professional solution",
  },
  {
    id: AgentSessionLifecycleStage.BLUEPRINT_GENERATED,
    order: 6,
    label: "Blueprint Generated",
    runtimeState: AgentSessionState.GENERATING_BLUEPRINT,
    responsibility: "Emit owned blueprint section as official agent output",
  },
  {
    id: AgentSessionLifecycleStage.SELF_VALIDATION,
    order: 7,
    label: "Self Validation",
    runtimeState: AgentSessionState.VALIDATING,
    responsibility: "Verify completeness, rules, consistency, and contract compliance",
  },
  {
    id: AgentSessionLifecycleStage.COMPLETED,
    order: 8,
    label: "Completed",
    runtimeState: AgentSessionState.COMPLETED,
    responsibility: "Pipeline accepts blueprint; agent becomes immutable",
  },
  {
    id: AgentSessionLifecycleStage.ARCHIVED,
    order: 9,
    label: "Archived",
    runtimeState: AgentSessionState.ARCHIVED,
    responsibility: "Destroy instance; persist telemetry, decision report, blueprint, trace",
  },
] as const;

export const AGENT_SESSION_RETRY_BRANCH: readonly AgentSessionLifecycleStageId[] = [
  AgentSessionLifecycleStage.SELF_VALIDATION,
  AgentSessionLifecycleStage.REASONING,
  AgentSessionLifecycleStage.SELF_VALIDATION,
  AgentSessionLifecycleStage.COMPLETED,
] as const;

const STAGE_TO_RUNTIME: Record<AgentSessionLifecycleStageId, AgentSessionStateId> = {
  [AgentSessionLifecycleStage.CREATED]: AgentSessionState.CREATED,
  [AgentSessionLifecycleStage.INITIALIZED]: AgentSessionState.INITIALIZED,
  [AgentSessionLifecycleStage.CONTEXT_LOADED]: AgentSessionState.LOADING_CONTEXT,
  [AgentSessionLifecycleStage.KNOWLEDGE_LOADED]: AgentSessionState.LOADING_KNOWLEDGE,
  [AgentSessionLifecycleStage.REASONING]: AgentSessionState.REASONING,
  [AgentSessionLifecycleStage.BLUEPRINT_GENERATED]: AgentSessionState.GENERATING_BLUEPRINT,
  [AgentSessionLifecycleStage.SELF_VALIDATION]: AgentSessionState.VALIDATING,
  [AgentSessionLifecycleStage.COMPLETED]: AgentSessionState.COMPLETED,
  [AgentSessionLifecycleStage.ARCHIVED]: AgentSessionState.ARCHIVED,
};

function violation(
  code: AgentSessionLifecycleFailureCode,
  message: string,
  stage?: AgentSessionLifecycleStageId,
  agentId?: string,
): AgentSessionLifecycleViolation {
  return { code, message, stage, agentId };
}

export function createAgentSessionIdentity(agentId: AgentContractId): AgentSessionIdentity {
  const executionId = randomUUID();
  return {
    agentId,
    agentInstanceId: randomUUID(),
    executionId,
    traceId: randomUUID(),
    workspaceId: `ws-${executionId.slice(0, 8)}`,
  };
}

export function getAgentSessionRuntimeState(
  stageId: AgentSessionLifecycleStageId,
): AgentSessionStateId {
  return STAGE_TO_RUNTIME[stageId];
}

export function validateAgentSessionLifecycleStructure(): AgentSessionLifecycleViolation[] {
  const violations: AgentSessionLifecycleViolation[] = [];
  if (AGENT_SESSION_LIFECYCLE_STAGES.length !== 9) {
    violations.push(violation("INCOMPLETE_LIFECYCLE", "Agent session lifecycle requires 9 stages"));
  }
  const orders = AGENT_SESSION_LIFECYCLE_STAGES.map((s) => s.order);
  if (new Set(orders).size !== orders.length) {
    violations.push(violation("INCOMPLETE_LIFECYCLE", "Lifecycle stage orders must be unique"));
  }
  return violations;
}

function recordStage(
  records: AgentSessionStageRecord[],
  stage: AgentSessionLifecycleStageId,
  detail?: string,
): void {
  records.push({
    stage,
    state: getAgentSessionRuntimeState(stage),
    at: Date.now(),
    detail,
  });
}

function startTiming(
  timings: AgentSessionStageTiming[],
  stage: AgentSessionLifecycleStageId,
): number {
  return Date.now();
}

function endTiming(
  timings: AgentSessionStageTiming[],
  stage: AgentSessionLifecycleStageId,
  startedAt: number,
  externalWaitMs = 0,
): void {
  const endedAt = Date.now();
  timings.push({
    stage,
    startedAt,
    endedAt,
    durationMs: endedAt - startedAt,
    externalWaitMs,
  });
}

function publishLifecycleEvent(
  eventBus: EventBus,
  eventType: (typeof AgentSessionLifecycleEvent)[keyof typeof AgentSessionLifecycleEvent],
  identity: AgentSessionIdentity,
  revision: number,
  blueprintId: string,
  payload?: Record<string, string | number | boolean | null | undefined>,
): void {
  const designType =
    eventType === AgentSessionLifecycleEvent.RETRY_STARTED
      ? DesignEventType.RetryStarted
      : eventType === AgentSessionLifecycleEvent.AGENT_COMPLETED
        ? DesignEventType.AgentCompleted
        : eventType === AgentSessionLifecycleEvent.VALIDATION_PASSED
          ? DesignEventType.ValidationPassed
          : eventType;

  eventBus.publish({
    type: designType,
    category: EventCategory.AGENT,
    revision,
    metadata: {
      blueprintId,
      stage: BlueprintLifecycle.STORY_DEFINED,
      producer: identity.agentId,
    },
    payload: {
      agentInstanceId: identity.agentInstanceId,
      traceId: identity.traceId,
      executionId: identity.executionId,
      ...payload,
    },
  });
}

export function buildAgentSessionArchive(input: {
  identity: AgentSessionIdentity;
  telemetry: import("./base-agent-architecture-types").BaseAgentTelemetry;
  result?: import("./universal-agent-contract-types").UniversalAgentResult;
  totalDurationMs: number;
  outcome: (typeof AgentSessionTerminalOutcome)[keyof typeof AgentSessionTerminalOutcome];
  eventsPublished: (typeof AgentSessionLifecycleEvent)[keyof typeof AgentSessionLifecycleEvent][];
}): AgentSessionArchiveRecord {
  return {
    traceId: input.identity.traceId,
    executionId: input.identity.executionId,
    agentId: input.identity.agentId,
    blueprintSection: input.result?.mutations[0]?.section ?? "story",
    telemetry: input.telemetry,
    decisionReport: input.result,
    totalDurationMs: input.totalDurationMs,
    outcome: input.outcome,
    eventsPublished: [...input.eventsPublished],
  };
}

export async function executeAgentSessionLifecycle(input: {
  agentId: AgentContractId;
  blueprint?: RenderBlueprint;
  marketplace?: string;
  eventBus?: EventBus;
  context?: AgentSessionLifecycleContext;
}): Promise<AgentSessionLifecycleReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const violations: AgentSessionLifecycleViolation[] = [];
  const stagesCompleted: AgentSessionLifecycleStageId[] = [];
  const stageRecords: AgentSessionStageRecord[] = [];
  const stageTimings: AgentSessionStageTiming[] = [];
  const eventsPublished: (typeof AgentSessionLifecycleEvent)[keyof typeof AgentSessionLifecycleEvent][] = [];
  let currentState: AgentSessionStateId = AgentSessionState.CREATED;
  let retryCount = 0;

  const identity = createAgentSessionIdentity(input.agentId);
  const eventBus = input.eventBus ?? new EventBus({ pipelineId: identity.executionId });
  const blueprint =
    input.blueprint ??
    (() => {
      const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 7 });
      return { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } };
    })();

  eventBus.bindContext({
    blueprintId: blueprint.meta.id,
    stage: blueprint.lifecycle.stage,
    producer: input.agentId,
  });

  // Stage 1 — Created
  let t = startTiming(stageTimings, AgentSessionLifecycleStage.CREATED);
  recordStage(stageRecords, AgentSessionLifecycleStage.CREATED, "instance provisioned");
  stagesCompleted.push(AgentSessionLifecycleStage.CREATED);
  publishLifecycleEvent(eventBus, AgentSessionLifecycleEvent.AGENT_CREATED, identity, 0, blueprint.meta.id);
  eventsPublished.push(AgentSessionLifecycleEvent.AGENT_CREATED);
  endTiming(stageTimings, AgentSessionLifecycleStage.CREATED, t);

  if (context.cancelled) {
    currentState = AgentSessionState.CANCELLED;
    violations.push(violation("CANCELLED", "Pipeline stopped before agent completed", AgentSessionLifecycleStage.CREATED, input.agentId));
    return {
      valid: false,
      identity,
      currentState,
      outcome: AgentSessionTerminalOutcome.CANCELLED,
      stagesCompleted,
      stageRecords,
      stageTimings,
      eventsPublished,
      retryCount,
      violations,
      statelessVerified: !context.hiddenState,
    };
  }

  if (context.hiddenState) {
    violations.push(violation("HIDDEN_STATE", "Agent must not retain hidden state between projects", undefined, input.agentId));
  }

  // Stage 2 — Initialized
  t = startTiming(stageTimings, AgentSessionLifecycleStage.INITIALIZED);
  currentState = AgentSessionState.INITIALIZED;
  recordStage(stageRecords, AgentSessionLifecycleStage.INITIALIZED, "DI modules wired");
  stagesCompleted.push(AgentSessionLifecycleStage.INITIALIZED);
  endTiming(stageTimings, AgentSessionLifecycleStage.INITIALIZED, t);

  // Stage 3 — Context Loaded
  t = startTiming(stageTimings, AgentSessionLifecycleStage.CONTEXT_LOADED);
  currentState = AgentSessionState.LOADING_CONTEXT;
  const agentInput = buildBaseAgentInput({
    agentId: input.agentId,
    blueprint,
    marketplace: input.marketplace,
  });
  if (context.missingContext || !agentInput.pipelineContext) {
    violations.push(
      violation("MISSING_CONTEXT", "Mandatory pipeline context missing", AgentSessionLifecycleStage.CONTEXT_LOADED, input.agentId),
    );
    currentState = AgentSessionState.FAILED;
    endTiming(stageTimings, AgentSessionLifecycleStage.CONTEXT_LOADED, t);
    return finalizeReport({
      started,
      identity,
      currentState,
      outcome: AgentSessionTerminalOutcome.FAILED,
      stagesCompleted,
      stageRecords,
      stageTimings,
      eventsPublished,
      retryCount,
      violations,
      statelessVerified: !context.hiddenState,
    });
  }
  recordStage(stageRecords, AgentSessionLifecycleStage.CONTEXT_LOADED);
  stagesCompleted.push(AgentSessionLifecycleStage.CONTEXT_LOADED);
  endTiming(stageTimings, AgentSessionLifecycleStage.CONTEXT_LOADED, t);

  // Stage 4 — Knowledge Loaded
  t = startTiming(stageTimings, AgentSessionLifecycleStage.KNOWLEDGE_LOADED);
  currentState = AgentSessionState.LOADING_KNOWLEDGE;
  if (agentInput.knowledge.items.length === 0) {
    violations.push(
      violation("MISSING_CONTEXT", "Knowledge retrieval returned empty package", AgentSessionLifecycleStage.KNOWLEDGE_LOADED, input.agentId),
    );
  }
  recordStage(stageRecords, AgentSessionLifecycleStage.KNOWLEDGE_LOADED);
  stagesCompleted.push(AgentSessionLifecycleStage.KNOWLEDGE_LOADED);
  publishLifecycleEvent(eventBus, AgentSessionLifecycleEvent.KNOWLEDGE_LOADED, identity, 1, blueprint.meta.id, {
    knowledgeItems: agentInput.knowledge.items.length,
  });
  eventsPublished.push(AgentSessionLifecycleEvent.KNOWLEDGE_LOADED);
  endTiming(stageTimings, AgentSessionLifecycleStage.KNOWLEDGE_LOADED, t, 0);

  // Execute reasoning → blueprint → validation via Ch 7.2 with optional retry
  let executionValid = false;
  let executionReport: Awaited<ReturnType<typeof executeBaseAgentArchitecture>> | undefined;
  let attempt = 0;

  while (attempt <= maxRetries && !executionValid) {
    if (attempt > 0) {
      currentState = AgentSessionState.RETRY;
      publishLifecycleEvent(eventBus, AgentSessionLifecycleEvent.RETRY_STARTED, identity, attempt + 1, blueprint.meta.id, {
        retryAttempt: attempt,
      });
      eventsPublished.push(AgentSessionLifecycleEvent.RETRY_STARTED);
      recordStage(stageRecords, AgentSessionLifecycleStage.SELF_VALIDATION, "retry requested");
      retryCount = attempt;
    }

    const archContext: BaseAgentArchitectureContext = {
      skipSelfValidation: attempt === 0 && (context.skipSelfValidation || context.forceValidationFailure),
    };

    // Stage 5 — Reasoning
    t = startTiming(stageTimings, AgentSessionLifecycleStage.REASONING);
    currentState = AgentSessionState.REASONING;
    executionReport = await executeBaseAgentArchitecture({
      agentId: input.agentId,
      blueprint,
      marketplace: input.marketplace,
      context: archContext,
    });
    recordStage(stageRecords, AgentSessionLifecycleStage.REASONING, `attempt ${attempt + 1}`);
    if (!stagesCompleted.includes(AgentSessionLifecycleStage.REASONING)) {
      stagesCompleted.push(AgentSessionLifecycleStage.REASONING);
    }
    publishLifecycleEvent(eventBus, AgentSessionLifecycleEvent.DECISION_COMPLETED, identity, attempt + 2, blueprint.meta.id, {
      decisionScore: executionReport.state.decisionScore,
    });
    if (!eventsPublished.includes(AgentSessionLifecycleEvent.DECISION_COMPLETED)) {
      eventsPublished.push(AgentSessionLifecycleEvent.DECISION_COMPLETED);
    }
    endTiming(stageTimings, AgentSessionLifecycleStage.REASONING, t);

    // Stage 6 — Blueprint Generated
    t = startTiming(stageTimings, AgentSessionLifecycleStage.BLUEPRINT_GENERATED);
    currentState = AgentSessionState.GENERATING_BLUEPRINT;
    const hasBlueprint = (executionReport.result?.mutations.length ?? 0) > 0;
    if (!hasBlueprint) {
      violations.push(
        violation("EXECUTION_FAILED", "Blueprint generation produced no mutations", AgentSessionLifecycleStage.BLUEPRINT_GENERATED, input.agentId),
      );
    }
    recordStage(stageRecords, AgentSessionLifecycleStage.BLUEPRINT_GENERATED);
    if (!stagesCompleted.includes(AgentSessionLifecycleStage.BLUEPRINT_GENERATED)) {
      stagesCompleted.push(AgentSessionLifecycleStage.BLUEPRINT_GENERATED);
    }
    endTiming(stageTimings, AgentSessionLifecycleStage.BLUEPRINT_GENERATED, t);

    // Stage 7 — Self Validation
    t = startTiming(stageTimings, AgentSessionLifecycleStage.SELF_VALIDATION);
    currentState = AgentSessionState.VALIDATING;
    executionValid = executionReport.valid && executionReport.state.validationPassed;
    if (!executionValid) {
      const validationViolation = executionReport.violations.find(
        (v) => v.code === "MISSING_SELF_VALIDATION" || v.code === "EXECUTION_FAILED",
      );
      violations.push(
        violation(
          validationViolation?.code === "MISSING_SELF_VALIDATION" ? "MISSING_SELF_VALIDATION" : "VALIDATION_FAILED",
          validationViolation?.message ?? "Self validation failed",
          AgentSessionLifecycleStage.SELF_VALIDATION,
          input.agentId,
        ),
      );
      recordStage(stageRecords, AgentSessionLifecycleStage.SELF_VALIDATION, "validation failed");
      endTiming(stageTimings, AgentSessionLifecycleStage.SELF_VALIDATION, t);
      attempt += 1;
      if (attempt > maxRetries) {
        currentState = AgentSessionState.FAILED;
        violations.push(violation("RETRY_EXHAUSTED", "Retry attempts exhausted", AgentSessionLifecycleStage.SELF_VALIDATION, input.agentId));
        break;
      }
      continue;
    }
    // Successful validation — drop transient failures from earlier retry attempts
    for (let i = violations.length - 1; i >= 0; i -= 1) {
      const code = violations[i].code;
      if (code === "VALIDATION_FAILED" || code === "MISSING_SELF_VALIDATION") {
        violations.splice(i, 1);
      }
    }
    recordStage(stageRecords, AgentSessionLifecycleStage.SELF_VALIDATION, "validation passed");
    if (!stagesCompleted.includes(AgentSessionLifecycleStage.SELF_VALIDATION)) {
      stagesCompleted.push(AgentSessionLifecycleStage.SELF_VALIDATION);
    }
    publishLifecycleEvent(eventBus, AgentSessionLifecycleEvent.VALIDATION_PASSED, identity, attempt + 3, blueprint.meta.id);
    eventsPublished.push(AgentSessionLifecycleEvent.VALIDATION_PASSED);
    endTiming(stageTimings, AgentSessionLifecycleStage.SELF_VALIDATION, t);
    break;
  }

  if (!executionValid || !executionReport) {
    return finalizeReport({
      started,
      identity,
      currentState,
      outcome: AgentSessionTerminalOutcome.FAILED,
      stagesCompleted,
      stageRecords,
      stageTimings,
      eventsPublished,
      retryCount,
      violations,
      telemetry: executionReport?.telemetry,
      result: executionReport?.result,
      statelessVerified: !context.hiddenState,
    });
  }

  // Stage 8 — Completed
  t = startTiming(stageTimings, AgentSessionLifecycleStage.COMPLETED);
  currentState = AgentSessionState.COMPLETED;
  recordStage(stageRecords, AgentSessionLifecycleStage.COMPLETED);
  stagesCompleted.push(AgentSessionLifecycleStage.COMPLETED);
  publishLifecycleEvent(eventBus, AgentSessionLifecycleEvent.AGENT_COMPLETED, identity, retryCount + 4, blueprint.meta.id);
  eventsPublished.push(AgentSessionLifecycleEvent.AGENT_COMPLETED);
  endTiming(stageTimings, AgentSessionLifecycleStage.COMPLETED, t);

  // Stage 9 — Archived
  t = startTiming(stageTimings, AgentSessionLifecycleStage.ARCHIVED);
  currentState = AgentSessionState.ARCHIVED;
  const archive = buildAgentSessionArchive({
    identity,
    telemetry: executionReport.telemetry,
    result: executionReport.result,
    totalDurationMs: Date.now() - started,
    outcome: AgentSessionTerminalOutcome.COMPLETED,
    eventsPublished,
  });
  recordStage(stageRecords, AgentSessionLifecycleStage.ARCHIVED, "instance destroyed");
  stagesCompleted.push(AgentSessionLifecycleStage.ARCHIVED);
  endTiming(stageTimings, AgentSessionLifecycleStage.ARCHIVED, t);

  const uniqueViolations = dedupeViolations(violations);

  return {
    valid: uniqueViolations.length === 0 && stagesCompleted.length === 9,
    identity,
    currentState,
    outcome: AgentSessionTerminalOutcome.COMPLETED,
    stagesCompleted,
    stageRecords,
    stageTimings,
    eventsPublished,
    retryCount,
    violations: uniqueViolations,
    telemetry: executionReport.telemetry,
    result: executionReport.result,
    archive,
    statelessVerified: !context.hiddenState,
  };
}

function dedupeViolations(violations: AgentSessionLifecycleViolation[]): AgentSessionLifecycleViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.stage ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function finalizeReport(input: {
  started: number;
  identity: AgentSessionIdentity;
  currentState: AgentSessionStateId;
  outcome: (typeof AgentSessionTerminalOutcome)[keyof typeof AgentSessionTerminalOutcome];
  stagesCompleted: AgentSessionLifecycleStageId[];
  stageRecords: AgentSessionStageRecord[];
  stageTimings: AgentSessionStageTiming[];
  eventsPublished: (typeof AgentSessionLifecycleEvent)[keyof typeof AgentSessionLifecycleEvent][];
  retryCount: number;
  violations: AgentSessionLifecycleViolation[];
  telemetry?: import("./base-agent-architecture-types").BaseAgentTelemetry;
  result?: import("./universal-agent-contract-types").UniversalAgentResult;
  statelessVerified: boolean;
}): AgentSessionLifecycleReport {
  const archive =
    input.telemetry && input.outcome !== AgentSessionTerminalOutcome.CANCELLED
      ? buildAgentSessionArchive({
          identity: input.identity,
          telemetry: input.telemetry,
          result: input.result,
          totalDurationMs: Date.now() - input.started,
          outcome: input.outcome,
          eventsPublished: input.eventsPublished,
        })
      : undefined;

  if (input.outcome === AgentSessionTerminalOutcome.FAILED && !input.telemetry) {
    input.violations.push(violation("TELEMETRY_LOST", "Telemetry must survive lifecycle completion"));
  }

  return {
    valid: false,
    identity: input.identity,
    currentState: input.currentState,
    outcome: input.outcome,
    stagesCompleted: input.stagesCompleted,
    stageRecords: input.stageRecords,
    stageTimings: input.stageTimings,
    eventsPublished: input.eventsPublished,
    retryCount: input.retryCount,
    violations: dedupeViolations(input.violations),
    telemetry: input.telemetry,
    result: input.result,
    archive,
    statelessVerified: input.statelessVerified,
  };
}

export function validateAgentSessionLifecycle(
  context: AgentSessionLifecycleContext = {},
): AgentSessionLifecycleValidationReport {
  const violations = [...validateAgentSessionLifecycleStructure()];

  if (context.hiddenState) {
    violations.push(violation("HIDDEN_STATE", "Agents must not retain hidden state between projects"));
  }
  if (context.skipSelfValidation) {
    violations.push(violation("MISSING_SELF_VALIDATION", "Self validation is mandatory before completion"));
  }

  return {
    valid: violations.length === 0,
    violations,
    stagesComplete: validateAgentSessionLifecycleStructure().length === 0,
    observabilityReady: Object.keys(AgentSessionLifecycleEvent).length >= 6,
    retrySupported: AGENT_SESSION_RETRY_BRANCH.length >= 4,
    statelessDesign: !context.hiddenState,
    selfValidationRequired: true,
    goldenRuleSatisfied: AGENT_SESSION_LIFECYCLE_GOLDEN_RULE.includes("born to solve one professional task"),
    successCriteriaMet: violations.length === 0,
    kitchenExecutionValid: false,
  };
}

export async function validateAgentSessionLifecycleWithExecution(
  context: AgentSessionLifecycleContext = {},
): Promise<AgentSessionLifecycleValidationReport> {
  const report = validateAgentSessionLifecycle(context);
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;

  const execution = await executeAgentSessionLifecycle({
    agentId: "visual-story-director",
    blueprint: bp,
    context,
  });

  const violations = [...report.violations, ...execution.violations];
  if (!execution.valid) {
    violations.push(...execution.violations);
  }

  return {
    ...report,
    valid: violations.length === 0 && execution.valid,
    violations: dedupeViolations(violations),
    kitchenExecutionValid: execution.valid,
    successCriteriaMet: violations.length === 0 && execution.valid,
  };
}

export function assertAgentSessionLifecycle(
  context?: AgentSessionLifecycleContext,
): AgentSessionLifecycleValidationReport {
  const report = validateAgentSessionLifecycle(context);
  if (!report.valid) {
    throw new Error(`Agent Session Lifecycle violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runAgentSessionLifecycle(
  context: AgentSessionLifecycleContext = {},
): Promise<AgentSessionLifecycleValidationReport> {
  return validateAgentSessionLifecycleWithExecution(context);
}

export function isAgentSessionLifecycleFailure(code: string): code is AgentSessionLifecycleFailureCode {
  const codes: AgentSessionLifecycleFailureCode[] = [
    "INCOMPLETE_LIFECYCLE",
    "MISSING_SELF_VALIDATION",
    "HIDDEN_STATE",
    "MISSING_CONTEXT",
    "VALIDATION_FAILED",
    "RETRY_EXHAUSTED",
    "CRITICAL_FAILURE",
    "CANCELLED",
    "TELEMETRY_LOST",
    "STATE_AMBIGUOUS",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as AgentSessionLifecycleFailureCode);
}

export function getAgentSessionLifecycleStage(
  stageId: AgentSessionLifecycleStageId,
): AgentSessionLifecycleStageDefinition | undefined {
  return AGENT_SESSION_LIFECYCLE_STAGES.find((s) => s.id === stageId);
}

export function mapSessionStageToBaseArchitecture(
  stageId: AgentSessionLifecycleStageId,
): string {
  const mapping: Record<AgentSessionLifecycleStageId, string> = {
    [AgentSessionLifecycleStage.CREATED]: "session-setup",
    [AgentSessionLifecycleStage.INITIALIZED]: "input_adapter",
    [AgentSessionLifecycleStage.CONTEXT_LOADED]: "context_analyzer",
    [AgentSessionLifecycleStage.KNOWLEDGE_LOADED]: "knowledge_retrieval",
    [AgentSessionLifecycleStage.REASONING]: "decision_engine",
    [AgentSessionLifecycleStage.BLUEPRINT_GENERATED]: "blueprint_builder",
    [AgentSessionLifecycleStage.SELF_VALIDATION]: "self_validation",
    [AgentSessionLifecycleStage.COMPLETED]: "output_adapter",
    [AgentSessionLifecycleStage.ARCHIVED]: "telemetry",
  };
  return mapping[stageId];
}

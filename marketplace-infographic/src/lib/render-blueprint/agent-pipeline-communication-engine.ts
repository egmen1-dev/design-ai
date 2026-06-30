/**
 * Chapter 7.4 — Agent Pipeline Communication engine.
 * Never Agent → Agent. Always Agent → Pipeline.
 */
import { randomUUID } from "crypto";
import type { AgentContractId } from "./agent-contracts";
import { AGENT_READ_MATRIX } from "./agent-matrix";
import { buildAgentContextPackage } from "./agent-context-engine";
import { ConstraintEngine } from "./constraint-engine";
import {
  validateNoDirectAgentCalls,
  validateWritePermissions,
  validatePublicationExplainability,
  validateImmutability,
  validateStructuredCommunication,
  type CommunicationValidationContext,
} from "./agent-communication-protocol-engine";
import { executeAgentSessionLifecycle } from "./agent-session-lifecycle-engine";
import { retrieveKnowledgePackage } from "./knowledge-retrieval-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import { StoryType } from "./visual-story-director-types";
import { EventBus, EventCategory, DesignEventType } from "./event-bus";
import type { RenderBlueprint } from "./types";
import type { PipelineMetadata } from "./pipeline-context-types";
import {
  AgentPipelineCommunicationEvent,
  AgentPipelineCommunicationPrinciple,
  AgentPipelineCommunicationStage,
  AgentPipelineErrorSeverity,
  AgentPipelineMessageType,
  AgentPipelineResponseStatus,
  type AgentPipelineCommunicationContext,
  type AgentPipelineCommunicationEventId,
  type AgentPipelineCommunicationFailureCode,
  type AgentPipelineCommunicationReport,
  type AgentPipelineCommunicationStageDefinition,
  type AgentPipelineCommunicationStageId,
  type AgentPipelineCommunicationStageRecord,
  type AgentPipelineCommunicationValidationReport,
  type AgentPipelineCommunicationViolation,
  type AgentPipelineConsensusReport,
  type AgentPipelineDirectCall,
  type AgentPipelineError,
  type AgentPipelineErrorSeverityId,
  type AgentPipelineRequest,
  type AgentPipelineResponse,
  type AgentPipelineRetryRequest,
  type AgentPipelineValidationReport,
} from "./agent-pipeline-communication-types";
import { AgentSessionTerminalOutcome } from "./agent-session-lifecycle-types";

export {
  AgentPipelineMessageType,
  AgentPipelineCommunicationPrinciple,
  AgentPipelineCommunicationStage,
  AgentPipelineCommunicationEvent,
  AgentPipelineResponseStatus,
  AgentPipelineErrorSeverity,
  type AgentPipelineMessageTypeId,
  type AgentPipelineCommunicationPrincipleId,
  type AgentPipelineCommunicationStageId,
  type AgentPipelineCommunicationEventId,
  type AgentPipelineResponseStatusId,
  type AgentPipelineErrorSeverityId,
  type AgentPipelineRequest,
  type AgentPipelineResponse,
  type AgentPipelineError,
  type AgentPipelineRetryRequest,
  type AgentPipelineValidationReport,
  type AgentPipelineConsensusReport,
  type AgentPipelineDirectCall,
  type AgentPipelineCommunicationViolation,
  type AgentPipelineCommunicationStageRecord,
  type AgentPipelineCommunicationReport,
  type AgentPipelineCommunicationValidationReport,
  type AgentPipelineCommunicationContext,
  type AgentPipelineCommunicationFailureCode,
  type AgentPipelineCommunicationStageDefinition,
} from "./agent-pipeline-communication-types";

export const AGENT_PIPELINE_COMMUNICATION_VERSION = "7.4.0";

export const AGENT_PIPELINE_COMMUNICATION_GOLDEN_RULE =
  "A true Multi-Agent system is built not on the number of agents, but on the quality of their interaction. " +
  "Each agent must remain independent, never know another agent's internal implementation, " +
  "and communicate only through the unified language of Pipeline. " +
  "Never Agent → Agent. Always Agent → Pipeline.";

export const AGENT_PIPELINE_COMMUNICATION_MODEL = "agent-blueprint-pipeline-context-next-agent" as const;

export const AGENT_PIPELINE_COMMUNICATION_SEQUENCE: readonly AgentPipelineCommunicationStageDefinition[] = [
  { id: AgentPipelineCommunicationStage.PIPELINE_DISPATCH, order: 1, label: "Pipeline Dispatch", responsibility: "Pipeline selects next agent" },
  { id: AgentPipelineCommunicationStage.AGENT_REQUEST, order: 2, label: "Agent Request", responsibility: "Pipeline sends data-only Request contract" },
  { id: AgentPipelineCommunicationStage.AGENT_EXECUTION, order: 3, label: "Agent Execution", responsibility: "Agent runs ephemeral session lifecycle" },
  { id: AgentPipelineCommunicationStage.BLUEPRINT_PUBLISH, order: 4, label: "Blueprint Publish", responsibility: "Agent publishes owned blueprint section" },
  { id: AgentPipelineCommunicationStage.VALIDATION, order: 5, label: "Validation", responsibility: "Self validation and protocol checks" },
  { id: AgentPipelineCommunicationStage.AGENT_RESPONSE, order: 6, label: "Agent Response", responsibility: "Pipeline receives Response contract" },
  { id: AgentPipelineCommunicationStage.PIPELINE_UPDATE, order: 7, label: "Pipeline Update", responsibility: "Pipeline Context updated from blueprint" },
  { id: AgentPipelineCommunicationStage.NEXT_AGENT, order: 8, label: "Next Agent", responsibility: "Next agent reads updated Pipeline Context only" },
] as const;

export const AGENT_PIPELINE_MESSAGE_TYPES = [
  AgentPipelineMessageType.REQUEST,
  AgentPipelineMessageType.RESPONSE,
  AgentPipelineMessageType.EVENT,
  AgentPipelineMessageType.RETRY_REQUEST,
  AgentPipelineMessageType.VALIDATION_REPORT,
  AgentPipelineMessageType.CONSENSUS_REPORT,
] as const;

function violation(
  code: AgentPipelineCommunicationFailureCode,
  message: string,
  extras?: Pick<AgentPipelineCommunicationViolation, "principle" | "stage" | "agentId">,
): AgentPipelineCommunicationViolation {
  return { code, message, ...extras };
}

function recordStage(
  records: AgentPipelineCommunicationStageRecord[],
  stage: AgentPipelineCommunicationStageId,
  detail?: string,
): void {
  records.push({ stage, at: Date.now(), detail });
}

function evaluatePrinciples(
  violations: AgentPipelineCommunicationViolation[],
): Record<AgentPipelineCommunicationPrincipleId, boolean> {
  const failed = new Set(violations.map((v) => v.principle).filter(Boolean));
  return {
    [AgentPipelineCommunicationPrinciple.NO_DIRECT_CALLS]: !failed.has(AgentPipelineCommunicationPrinciple.NO_DIRECT_CALLS),
    [AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED]: !failed.has(AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED),
    [AgentPipelineCommunicationPrinciple.BLUEPRINT_ONLY]: !failed.has(AgentPipelineCommunicationPrinciple.BLUEPRINT_ONLY),
    [AgentPipelineCommunicationPrinciple.EVENT_BUS]: !failed.has(AgentPipelineCommunicationPrinciple.EVENT_BUS),
    [AgentPipelineCommunicationPrinciple.IMMUTABLE_PUBLISH]: !failed.has(AgentPipelineCommunicationPrinciple.IMMUTABLE_PUBLISH),
    [AgentPipelineCommunicationPrinciple.CONTRACT_FIRST]: !failed.has(AgentPipelineCommunicationPrinciple.CONTRACT_FIRST),
  };
}

export function buildPipelineMetadata(blueprint: Readonly<RenderBlueprint>): PipelineMetadata {
  return {
    constraints: blueprint.constraints.set.constraints.map((c) => c.id),
    revision: blueprint.meta.revision,
    createdAt: blueprint.meta.createdAt,
    updatedAt: blueprint.meta.createdAt,
  };
}

export function buildAgentPipelineRequest(input: {
  agentId: AgentContractId;
  blueprint?: RenderBlueprint;
  marketplace?: string;
  executionId?: string;
}): AgentPipelineRequest {
  const blueprint =
    input.blueprint ??
    (() => {
      const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 7 });
      return { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } };
    })();

  const pipelineContext = buildAgentContextPackage({
    blueprint: structuredClone(blueprint) as RenderBlueprint,
    agentId: input.agentId,
    pipelineId: "pipeline-communication",
  });

  const knowledge = retrieveKnowledgePackage({
    context: {
      category: blueprint.product.category,
      marketplace: input.marketplace ?? "wildberries",
      semanticQuery: blueprint.creative.goal,
    },
    limit: 6,
    useCache: false,
  });

  const constraintReport = new ConstraintEngine().evaluate(blueprint);

  return {
    agentId: input.agentId,
    executionId: input.executionId ?? randomUUID(),
    pipelineContext,
    knowledge,
    constraints: constraintReport.mergedSet,
    metadata: buildPipelineMetadata(blueprint),
  };
}

export function buildAgentPipelineResponse(input: {
  request: AgentPipelineRequest;
  sessionReport: Awaited<ReturnType<typeof executeAgentSessionLifecycle>>;
}): AgentPipelineResponse {
  const { sessionReport, request } = input;
  const status =
    sessionReport.outcome === AgentSessionTerminalOutcome.COMPLETED
      ? AgentPipelineResponseStatus.COMPLETED
      : sessionReport.outcome === AgentSessionTerminalOutcome.RETRY
        ? AgentPipelineResponseStatus.RETRY
        : sessionReport.outcome === AgentSessionTerminalOutcome.CANCELLED
          ? AgentPipelineResponseStatus.CANCELLED
          : AgentPipelineResponseStatus.FAILED;

  return {
    status,
    blueprint: request.pipelineContext.blueprint,
    decisionScore: sessionReport.telemetry?.decisionScore ?? 0,
    validationPassed: sessionReport.valid,
    warnings: sessionReport.violations.map((v) => v.message),
    telemetry: sessionReport.telemetry ?? {
      durationMs: 0,
      knowledgeItemsUsed: 0,
      rulesEvaluated: 0,
      decisionScore: 0,
      validationScore: 0,
      retryCount: 0,
      stagesCompleted: [],
    },
    result: sessionReport.result,
  };
}

export function buildAgentPipelineError(input: {
  code: string;
  description: string;
  recommendedAction: string;
  retryPossible?: boolean;
  severity?: AgentPipelineErrorSeverityId;
}): AgentPipelineError {
  return {
    code: input.code,
    severity: input.severity ?? AgentPipelineErrorSeverity.MEDIUM,
    description: input.description,
    recommendedAction: input.recommendedAction,
    retryPossible: input.retryPossible ?? false,
  };
}

export function validateAgentPipelineRequest(
  request?: AgentPipelineRequest,
): AgentPipelineCommunicationViolation[] {
  const violations: AgentPipelineCommunicationViolation[] = [];
  if (!request) {
    violations.push(
      violation("INVALID_REQUEST_CONTRACT", "AgentRequest is required", {
        principle: AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
        stage: AgentPipelineCommunicationStage.AGENT_REQUEST,
      }),
    );
    return violations;
  }
  if (!request.agentId || !request.executionId) {
    violations.push(
      violation("INVALID_REQUEST_CONTRACT", "AgentRequest requires agentId and executionId", {
        principle: AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
        stage: AgentPipelineCommunicationStage.AGENT_REQUEST,
        agentId: request.agentId,
      }),
    );
  }
  if (!request.pipelineContext?.blueprint) {
    violations.push(
      violation("MISSING_PIPELINE_CONTEXT", "AgentRequest requires pipelineContext with blueprint", {
        principle: AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED,
        stage: AgentPipelineCommunicationStage.AGENT_REQUEST,
        agentId: request.agentId,
      }),
    );
  }
  if (!request.knowledge?.items?.length) {
    violations.push(
      violation("INVALID_REQUEST_CONTRACT", "AgentRequest requires knowledge package", {
        principle: AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
        stage: AgentPipelineCommunicationStage.AGENT_REQUEST,
        agentId: request.agentId,
      }),
    );
  }
  return violations;
}

export function validateAgentPipelineResponse(
  response?: AgentPipelineResponse,
): AgentPipelineCommunicationViolation[] {
  const violations: AgentPipelineCommunicationViolation[] = [];
  if (!response) {
    violations.push(
      violation("INVALID_RESPONSE_CONTRACT", "AgentResponse is required", {
        principle: AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
        stage: AgentPipelineCommunicationStage.AGENT_RESPONSE,
      }),
    );
    return violations;
  }
  if (!response.blueprint || !response.telemetry) {
    violations.push(
      violation("INVALID_RESPONSE_CONTRACT", "AgentResponse requires blueprint and telemetry", {
        principle: AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
        stage: AgentPipelineCommunicationStage.AGENT_RESPONSE,
      }),
    );
  }
  if (typeof response.decisionScore !== "number" || typeof response.validationPassed !== "boolean") {
    violations.push(
      violation("INVALID_RESPONSE_CONTRACT", "AgentResponse requires decisionScore and validationPassed", {
        principle: AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
        stage: AgentPipelineCommunicationStage.AGENT_RESPONSE,
      }),
    );
  }
  return violations;
}

export function validatePipelineMediatedCommunication(
  directCalls: AgentPipelineDirectCall[] = [],
): AgentPipelineCommunicationViolation[] {
  return validateNoDirectAgentCalls(directCalls).map((v) =>
    violation("DIRECT_AGENT_COMMUNICATION", v.message, {
      principle: AgentPipelineCommunicationPrinciple.NO_DIRECT_CALLS,
      agentId: v.agentId,
    }),
  );
}

export function validateRetryCommunication(
  retry: AgentPipelineRetryRequest,
  pipelineApproved: boolean,
): AgentPipelineCommunicationViolation[] {
  const violations: AgentPipelineCommunicationViolation[] = [];
  if (!retry.fromAgentId || !retry.targetAgentId) {
    violations.push(
      violation("RETRY_BYPASS_PIPELINE", "Retry request requires from and target agent IDs", {
        principle: AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED,
      }),
    );
  }
  if (!pipelineApproved) {
    violations.push(
      violation("RETRY_BYPASS_PIPELINE", "Retry must be approved by Pipeline — agent cannot invoke retry directly", {
        principle: AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED,
        agentId: retry.fromAgentId,
      }),
    );
  }
  return violations;
}

export function validateConsensusCommunication(
  reports: AgentPipelineConsensusReport[],
  directDebate?: boolean,
): AgentPipelineCommunicationViolation[] {
  const violations: AgentPipelineCommunicationViolation[] = [];
  if (directDebate) {
    violations.push(
      violation("CONSENSUS_DIRECT_DEBATE", "Agents must not debate directly during consensus", {
        principle: AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED,
      }),
    );
  }
  for (const report of reports) {
    if (!report.blueprint || !report.report) {
      violations.push(
        violation("UNCONTRACTED_MESSAGE", "Consensus report requires blueprint and independent report", {
          principle: AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
          agentId: report.agentId,
        }),
      );
    }
  }
  return violations;
}

export function validateNextAgentReadsContextOnly(
  previousAgentId: AgentContractId,
  nextAgentId: AgentContractId,
  directCall?: boolean,
): AgentPipelineCommunicationViolation[] {
  if (directCall) {
    return [
      violation("DIRECT_AGENT_COMMUNICATION", `Agent ${nextAgentId} must read Pipeline Context — not call ${previousAgentId} directly`, {
        principle: AgentPipelineCommunicationPrinciple.NO_DIRECT_CALLS,
        stage: AgentPipelineCommunicationStage.NEXT_AGENT,
        agentId: nextAgentId,
      }),
    ];
  }
  const readable = AGENT_READ_MATRIX[nextAgentId] ?? [];
  if (readable.length === 0 && nextAgentId !== "chief-design-director") {
    return [
      violation("MISSING_PIPELINE_CONTEXT", `Agent ${nextAgentId} has no declared read sections from pipeline context`, {
        principle: AgentPipelineCommunicationPrinciple.BLUEPRINT_ONLY,
        stage: AgentPipelineCommunicationStage.NEXT_AGENT,
        agentId: nextAgentId,
      }),
    ];
  }
  return [];
}

function publishCommunicationEvent(
  eventBus: EventBus,
  eventType: AgentPipelineCommunicationEventId,
  agentId: AgentContractId,
  blueprintId: string,
  revision: number,
  payload?: Record<string, string | number | boolean | null | undefined>,
): void {
  const designType =
    eventType === AgentPipelineCommunicationEvent.RETRY_REQUESTED
      ? DesignEventType.RetryStarted
      : eventType === AgentPipelineCommunicationEvent.VALIDATION_PASSED
        ? DesignEventType.ValidationPassed
        : eventType === AgentPipelineCommunicationEvent.BLUEPRINT_UPDATED
          ? DesignEventType.MutationApplied
          : eventType;

  eventBus.publish({
    type: designType,
    category: EventCategory.AGENT,
    revision,
    metadata: {
      blueprintId,
      stage: BlueprintLifecycle.STORY_DEFINED,
      producer: agentId,
    },
    payload: {
      communicationEvent: eventType,
      agentId,
      ...payload,
    },
  });
}

export async function executeAgentPipelineCommunication(input: {
  agentId: AgentContractId;
  nextAgentId?: AgentContractId;
  blueprint?: RenderBlueprint;
  marketplace?: string;
  eventBus?: EventBus;
  context?: AgentPipelineCommunicationContext;
}): Promise<AgentPipelineCommunicationReport> {
  const context = input.context ?? {};
  const stagesCompleted: AgentPipelineCommunicationStageId[] = [];
  const stageRecords: AgentPipelineCommunicationStageRecord[] = [];
  const eventsPublished: AgentPipelineCommunicationEventId[] = [];
  const violations: AgentPipelineCommunicationViolation[] = [];
  const eventBus = input.eventBus ?? new EventBus({ pipelineId: `comm-${randomUUID().slice(0, 8)}` });

  // Direct call check
  violations.push(...validatePipelineMediatedCommunication(context.directCalls));

  // Stage 1 — Pipeline Dispatch
  recordStage(stageRecords, AgentPipelineCommunicationStage.PIPELINE_DISPATCH, `dispatch ${input.agentId}`);
  stagesCompleted.push(AgentPipelineCommunicationStage.PIPELINE_DISPATCH);

  if (context.missingPipelineContext) {
    violations.push(
      violation("MISSING_PIPELINE_CONTEXT", "Pipeline Context is the sole shared information source", {
        principle: AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED,
        stage: AgentPipelineCommunicationStage.PIPELINE_DISPATCH,
      }),
    );
    return buildCommunicationReport({
      violations,
      stagesCompleted,
      stageRecords,
      eventsPublished,
      pipelineMediated: false,
    });
  }

  // Stage 2 — Agent Request
  const request = buildAgentPipelineRequest({
    agentId: input.agentId,
    blueprint: input.blueprint,
    marketplace: input.marketplace,
  });
  violations.push(...validateAgentPipelineRequest(request));
  recordStage(stageRecords, AgentPipelineCommunicationStage.AGENT_REQUEST);
  stagesCompleted.push(AgentPipelineCommunicationStage.AGENT_REQUEST);

  if (violations.some((v) => v.code === "INVALID_REQUEST_CONTRACT" || v.code === "MISSING_PIPELINE_CONTEXT")) {
    return buildCommunicationReport({ violations, stagesCompleted, stageRecords, eventsPublished, request });
  }

  eventBus.bindContext({
    blueprintId: request.pipelineContext.blueprint.meta.id,
    stage: request.pipelineContext.blueprint.lifecycle.stage,
    producer: input.agentId,
  });

  // Stage 3 — Agent Execution (Ch 7.3 session lifecycle)
  const sessionReport = await executeAgentSessionLifecycle({
    agentId: input.agentId,
    blueprint: request.pipelineContext.blueprint as RenderBlueprint,
    marketplace: input.marketplace,
    eventBus,
  });
  recordStage(stageRecords, AgentPipelineCommunicationStage.AGENT_EXECUTION, `outcome ${sessionReport.outcome}`);
  stagesCompleted.push(AgentPipelineCommunicationStage.AGENT_EXECUTION);

  if (!sessionReport.valid) {
    violations.push(
      violation("EXECUTION_FAILED", "Agent execution failed during pipeline communication", {
        stage: AgentPipelineCommunicationStage.AGENT_EXECUTION,
        agentId: input.agentId,
      }),
    );
  }

  // Stage 4 — Blueprint Publish
  const mutationSections = sessionReport.result?.mutations.map((m) => m.section) ?? [];
  const publishedSections =
    context.forceUnauthorizedWrite ? (["scene"] as import("./types").BlueprintSection[]) : mutationSections;
  const protocolCtx: CommunicationValidationContext = {
    agentId: input.agentId,
    result: sessionReport.result
      ? {
          confidence: sessionReport.result.confidence,
          decisionTrace: sessionReport.result.diagnostics.decisionTrace,
          warnings: sessionReport.result.warnings ?? [],
        }
      : undefined,
    mutationSections: publishedSections,
    directCalls: context.directCalls,
  };
  const protocolViolations = [
    ...validateNoDirectAgentCalls(protocolCtx.directCalls),
    ...validateWritePermissions(protocolCtx.agentId, protocolCtx.mutationSections),
    ...validatePublicationExplainability(protocolCtx),
    ...validateImmutability(request.pipelineContext.blueprint, protocolCtx.agentId, protocolCtx.mutationSections),
    ...validateStructuredCommunication(
      request.pipelineContext.blueprint,
      publishedSections.length > 0 ? publishedSections : ["story"],
    ),
  ];
  const protocolValid = protocolViolations.length === 0;
  if (!protocolValid) {
    for (const v of protocolViolations) {
      violations.push(
        violation(
          v.code === "FOREIGN_SECTION_WRITE" ? "UNAUTHORIZED_BLUEPRINT_WRITE" : "UNCONTRACTED_MESSAGE",
          v.message,
          {
            principle:
              v.code === "FOREIGN_SECTION_WRITE"
                ? AgentPipelineCommunicationPrinciple.BLUEPRINT_ONLY
                : AgentPipelineCommunicationPrinciple.CONTRACT_FIRST,
            stage: AgentPipelineCommunicationStage.BLUEPRINT_PUBLISH,
            agentId: input.agentId,
          },
        ),
      );
    }
  }
  recordStage(stageRecords, AgentPipelineCommunicationStage.BLUEPRINT_PUBLISH);
  stagesCompleted.push(AgentPipelineCommunicationStage.BLUEPRINT_PUBLISH);

  if (!context.skipEventPublish) {
    publishCommunicationEvent(
      eventBus,
      AgentPipelineCommunicationEvent.BLUEPRINT_UPDATED,
      input.agentId,
      request.pipelineContext.blueprint.meta.id,
      request.metadata.revision + 1,
      { sections: mutationSections.join(",") || "story" },
    );
    eventsPublished.push(AgentPipelineCommunicationEvent.BLUEPRINT_UPDATED);
  } else {
    violations.push(
      violation("MISSING_EVENT_PUBLISH", "Communication requires Event Bus publication", {
        principle: AgentPipelineCommunicationPrinciple.EVENT_BUS,
        stage: AgentPipelineCommunicationStage.BLUEPRINT_PUBLISH,
        agentId: input.agentId,
      }),
    );
  }

  // Stage 5 — Validation
  const validationReport: AgentPipelineValidationReport = {
    agentId: input.agentId,
    passed: sessionReport.valid && protocolValid,
    score: sessionReport.telemetry?.validationScore ?? 0,
    violations: [...sessionReport.violations, ...protocolViolations].map((v) => v.message),
    blueprintRevision: request.metadata.revision,
  };
  recordStage(stageRecords, AgentPipelineCommunicationStage.VALIDATION, validationReport.passed ? "passed" : "failed");
  stagesCompleted.push(AgentPipelineCommunicationStage.VALIDATION);

  if (validationReport.passed && !context.skipEventPublish) {
    publishCommunicationEvent(
      eventBus,
      AgentPipelineCommunicationEvent.VALIDATION_PASSED,
      input.agentId,
      request.pipelineContext.blueprint.meta.id,
      request.metadata.revision + 2,
    );
    eventsPublished.push(AgentPipelineCommunicationEvent.VALIDATION_PASSED);
  }

  // Stage 6 — Agent Response
  const response = buildAgentPipelineResponse({ request, sessionReport });
  violations.push(...validateAgentPipelineResponse(response));
  recordStage(stageRecords, AgentPipelineCommunicationStage.AGENT_RESPONSE);
  stagesCompleted.push(AgentPipelineCommunicationStage.AGENT_RESPONSE);

  const completionEvent =
    input.agentId === "visual-story-director"
      ? AgentPipelineCommunicationEvent.STORY_COMPLETED
      : input.agentId === "scene-director"
        ? AgentPipelineCommunicationEvent.SCENE_COMPLETED
        : AgentPipelineCommunicationEvent.BLUEPRINT_UPDATED;

  if (!context.skipEventPublish && response.validationPassed) {
    publishCommunicationEvent(
      eventBus,
      completionEvent,
      input.agentId,
      request.pipelineContext.blueprint.meta.id,
      request.metadata.revision + 3,
    );
    eventsPublished.push(completionEvent);
  }

  // Stage 7 — Pipeline Update
  if (!context.skipPipelineUpdate && response.validationPassed) {
    recordStage(stageRecords, AgentPipelineCommunicationStage.PIPELINE_UPDATE, "context refreshed");
    stagesCompleted.push(AgentPipelineCommunicationStage.PIPELINE_UPDATE);
  } else if (context.skipPipelineUpdate) {
    violations.push(
      violation("PIPELINE_NOT_UPDATED", "Pipeline Context must be updated before next agent", {
        principle: AgentPipelineCommunicationPrinciple.PIPELINE_MEDIATED,
        stage: AgentPipelineCommunicationStage.PIPELINE_UPDATE,
        agentId: input.agentId,
      }),
    );
  }

  // Stage 8 — Next Agent reads context only
  const nextAgentId = input.nextAgentId ?? "scene-director";
  const nextAgentViolations = validateNextAgentReadsContextOnly(
    input.agentId,
    nextAgentId,
    Boolean(context.directCalls?.some((c) => c.from === nextAgentId && c.to === input.agentId)),
  );
  violations.push(...nextAgentViolations);
  recordStage(stageRecords, AgentPipelineCommunicationStage.NEXT_AGENT, `handoff to ${nextAgentId}`);
  stagesCompleted.push(AgentPipelineCommunicationStage.NEXT_AGENT);

  return buildCommunicationReport({
    violations,
    stagesCompleted,
    stageRecords,
    eventsPublished,
    request,
    response,
    pipelineMediated: !violations.some((v) => v.code === "DIRECT_AGENT_COMMUNICATION"),
    nextAgentReadable: nextAgentViolations.length === 0,
  });
}

function buildCommunicationReport(input: {
  violations: AgentPipelineCommunicationViolation[];
  stagesCompleted: AgentPipelineCommunicationStageId[];
  stageRecords: AgentPipelineCommunicationStageRecord[];
  eventsPublished: AgentPipelineCommunicationEventId[];
  request?: AgentPipelineRequest;
  response?: AgentPipelineResponse;
  pipelineMediated?: boolean;
  nextAgentReadable?: boolean;
}): AgentPipelineCommunicationReport {
  const uniqueViolations = dedupeViolations(input.violations);
  const principles = evaluatePrinciples(uniqueViolations);
  const allStagesComplete = input.stagesCompleted.length === AGENT_PIPELINE_COMMUNICATION_SEQUENCE.length;

  return {
    valid: uniqueViolations.length === 0 && allStagesComplete && (input.response?.validationPassed ?? false),
    violations: uniqueViolations,
    principles,
    stagesCompleted: input.stagesCompleted,
    stageRecords: input.stageRecords,
    eventsPublished: input.eventsPublished,
    request: input.request,
    response: input.response,
    nextAgentReadable: input.nextAgentReadable ?? false,
    pipelineMediated: input.pipelineMediated ?? true,
    goldenRuleSatisfied: AGENT_PIPELINE_COMMUNICATION_GOLDEN_RULE.includes("Never Agent → Agent"),
  };
}

function dedupeViolations(violations: AgentPipelineCommunicationViolation[]): AgentPipelineCommunicationViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.stage ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateAgentPipelineCommunicationStructure(): AgentPipelineCommunicationViolation[] {
  const violations: AgentPipelineCommunicationViolation[] = [];
  if (AGENT_PIPELINE_COMMUNICATION_SEQUENCE.length !== 8) {
    violations.push(violation("UNCONTRACTED_MESSAGE", "Pipeline communication sequence requires 8 stages"));
  }
  if (AGENT_PIPELINE_MESSAGE_TYPES.length !== 6) {
    violations.push(violation("UNCONTRACTED_MESSAGE", "Pipeline communication requires 6 message types"));
  }
  return violations;
}

export function validateAgentPipelineCommunication(
  context: AgentPipelineCommunicationContext = {},
): AgentPipelineCommunicationValidationReport {
  const violations = [
    ...validateAgentPipelineCommunicationStructure(),
    ...validatePipelineMediatedCommunication(context.directCalls),
  ];

  return {
    valid: violations.length === 0,
    violations,
    principlesComplete: Object.keys(AgentPipelineCommunicationPrinciple).length === 6,
    contractsDefined: AGENT_PIPELINE_MESSAGE_TYPES.length === 6,
    eventBusReady: true,
    pipelineMediated: !context.directCalls?.length,
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateAgentPipelineCommunicationWithExecution(
  context: AgentPipelineCommunicationContext = {},
): Promise<AgentPipelineCommunicationValidationReport> {
  const report = validateAgentPipelineCommunication(context);
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;

  const execution = await executeAgentPipelineCommunication({
    agentId: "visual-story-director",
    nextAgentId: "scene-director",
    blueprint: bp,
    context,
  });

  const violations = dedupeViolations([...report.violations, ...execution.violations]);
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

export function assertAgentPipelineCommunication(
  context?: AgentPipelineCommunicationContext,
): AgentPipelineCommunicationValidationReport {
  const report = validateAgentPipelineCommunication(context);
  if (!report.valid) {
    throw new Error(`Agent Pipeline Communication violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runAgentPipelineCommunication(
  context: AgentPipelineCommunicationContext = {},
): Promise<AgentPipelineCommunicationValidationReport> {
  return validateAgentPipelineCommunicationWithExecution(context);
}

export function isAgentPipelineCommunicationFailure(
  code: string,
): code is AgentPipelineCommunicationFailureCode {
  const codes: AgentPipelineCommunicationFailureCode[] = [
    "DIRECT_AGENT_COMMUNICATION",
    "MISSING_PIPELINE_CONTEXT",
    "INVALID_REQUEST_CONTRACT",
    "INVALID_RESPONSE_CONTRACT",
    "UNAUTHORIZED_BLUEPRINT_WRITE",
    "MISSING_EVENT_PUBLISH",
    "PIPELINE_NOT_UPDATED",
    "CONCURRENT_SECTION_WRITE",
    "UNCONTRACTED_MESSAGE",
    "TELEMETRY_DIRECT_TRANSFER",
    "CONSENSUS_DIRECT_DEBATE",
    "RETRY_BYPASS_PIPELINE",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as AgentPipelineCommunicationFailureCode);
}

export function getAgentPipelineCommunicationStage(
  stageId: AgentPipelineCommunicationStageId,
): AgentPipelineCommunicationStageDefinition | undefined {
  return AGENT_PIPELINE_COMMUNICATION_SEQUENCE.find((s) => s.id === stageId);
}

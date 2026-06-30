/**
 * Chapter 7.4 — Agent Pipeline Communication types
 * Pipeline-mediated message contracts — distinct from Ch 4.21 blueprint principles.
 */
import type { AgentContractId } from "./agent-contracts";
import type { AgentContextPackage } from "./agent-context-types";
import type { BaseAgentTelemetry } from "./base-agent-architecture-types";
import type { ConstraintSet } from "./constraint-types";
import type { KnowledgePackage } from "./knowledge-retrieval-types";
import type { PipelineMetadata } from "./pipeline-context-types";
import type { RenderBlueprint } from "./types";
import type { UniversalAgentResult } from "./universal-agent-contract-types";

/** Ch 7.4 message types — each has its own contract */
export const AgentPipelineMessageType = {
  REQUEST: "request",
  RESPONSE: "response",
  EVENT: "event",
  RETRY_REQUEST: "retry_request",
  VALIDATION_REPORT: "validation_report",
  CONSENSUS_REPORT: "consensus_report",
} as const;

export type AgentPipelineMessageTypeId =
  (typeof AgentPipelineMessageType)[keyof typeof AgentPipelineMessageType];

/** Ch 7.4 communication principles */
export const AgentPipelineCommunicationPrinciple = {
  NO_DIRECT_CALLS: "no_direct_calls",
  PIPELINE_MEDIATED: "pipeline_mediated",
  BLUEPRINT_ONLY: "blueprint_only",
  EVENT_BUS: "event_bus",
  IMMUTABLE_PUBLISH: "immutable_publish",
  CONTRACT_FIRST: "contract_first",
} as const;

export type AgentPipelineCommunicationPrincipleId =
  (typeof AgentPipelineCommunicationPrinciple)[keyof typeof AgentPipelineCommunicationPrinciple];

/** Ch 7.4 communication sequence stages */
export const AgentPipelineCommunicationStage = {
  PIPELINE_DISPATCH: "pipeline_dispatch",
  AGENT_REQUEST: "agent_request",
  AGENT_EXECUTION: "agent_execution",
  BLUEPRINT_PUBLISH: "blueprint_publish",
  VALIDATION: "validation",
  AGENT_RESPONSE: "agent_response",
  PIPELINE_UPDATE: "pipeline_update",
  NEXT_AGENT: "next_agent",
} as const;

export type AgentPipelineCommunicationStageId =
  (typeof AgentPipelineCommunicationStage)[keyof typeof AgentPipelineCommunicationStage];

export const AgentPipelineCommunicationEvent = {
  STORY_COMPLETED: "StoryCompleted",
  SCENE_COMPLETED: "SceneCompleted",
  BLUEPRINT_UPDATED: "BlueprintUpdated",
  RETRY_REQUESTED: "RetryRequested",
  VALIDATION_PASSED: "ValidationPassed",
} as const;

export type AgentPipelineCommunicationEventId =
  (typeof AgentPipelineCommunicationEvent)[keyof typeof AgentPipelineCommunicationEvent];

export const AgentPipelineResponseStatus = {
  COMPLETED: "completed",
  FAILED: "failed",
  RETRY: "retry",
  CANCELLED: "cancelled",
} as const;

export type AgentPipelineResponseStatusId =
  (typeof AgentPipelineResponseStatus)[keyof typeof AgentPipelineResponseStatus];

export const AgentPipelineErrorSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type AgentPipelineErrorSeverityId =
  (typeof AgentPipelineErrorSeverity)[keyof typeof AgentPipelineErrorSeverity];

/** Ch 7.4 AgentRequest — data only, no logic */
export type AgentPipelineRequest = {
  agentId: AgentContractId;
  executionId: string;
  pipelineContext: AgentContextPackage;
  knowledge: KnowledgePackage;
  constraints: ConstraintSet;
  metadata: PipelineMetadata;
};

/** Ch 7.4 AgentResponse */
export type AgentPipelineResponse = {
  status: AgentPipelineResponseStatusId;
  blueprint: Readonly<RenderBlueprint>;
  decisionScore: number;
  validationPassed: boolean;
  warnings: string[];
  telemetry: BaseAgentTelemetry;
  result?: UniversalAgentResult;
};

/** Ch 7.4 AgentError */
export type AgentPipelineError = {
  code: string;
  severity: AgentPipelineErrorSeverityId;
  description: string;
  recommendedAction: string;
  retryPossible: boolean;
};

export type AgentPipelineRetryRequest = {
  fromAgentId: AgentContractId;
  targetAgentId: AgentContractId;
  executionId: string;
  reason: string;
  blueprintRevision: number;
};

export type AgentPipelineValidationReport = {
  agentId: AgentContractId;
  passed: boolean;
  score: number;
  violations: string[];
  blueprintRevision: number;
};

export type AgentPipelineConsensusReport = {
  agentId: AgentContractId;
  blueprint: Readonly<RenderBlueprint>;
  report: Record<string, unknown>;
  constraints: string[];
  approved: boolean;
};

export type AgentPipelineDirectCall = {
  from: AgentContractId;
  to: AgentContractId;
  method?: string;
};

export type AgentPipelineCommunicationViolation = {
  code: AgentPipelineCommunicationFailureCode;
  principle?: AgentPipelineCommunicationPrincipleId;
  stage?: AgentPipelineCommunicationStageId;
  message: string;
  agentId?: AgentContractId;
};

export type AgentPipelineCommunicationStageRecord = {
  stage: AgentPipelineCommunicationStageId;
  at: number;
  detail?: string;
};

export type AgentPipelineCommunicationReport = {
  valid: boolean;
  violations: AgentPipelineCommunicationViolation[];
  principles: Record<AgentPipelineCommunicationPrincipleId, boolean>;
  stagesCompleted: AgentPipelineCommunicationStageId[];
  stageRecords: AgentPipelineCommunicationStageRecord[];
  eventsPublished: AgentPipelineCommunicationEventId[];
  request?: AgentPipelineRequest;
  response?: AgentPipelineResponse;
  nextAgentReadable: boolean;
  pipelineMediated: boolean;
  goldenRuleSatisfied: boolean;
};

export type AgentPipelineCommunicationValidationReport = {
  valid: boolean;
  violations: AgentPipelineCommunicationViolation[];
  principlesComplete: boolean;
  contractsDefined: boolean;
  eventBusReady: boolean;
  pipelineMediated: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type AgentPipelineCommunicationContext = {
  directCalls?: AgentPipelineDirectCall[];
  skipEventPublish?: boolean;
  skipPipelineUpdate?: boolean;
  forceUnauthorizedWrite?: boolean;
  missingPipelineContext?: boolean;
};

export type AgentPipelineCommunicationFailureCode =
  | "DIRECT_AGENT_COMMUNICATION"
  | "MISSING_PIPELINE_CONTEXT"
  | "INVALID_REQUEST_CONTRACT"
  | "INVALID_RESPONSE_CONTRACT"
  | "UNAUTHORIZED_BLUEPRINT_WRITE"
  | "MISSING_EVENT_PUBLISH"
  | "PIPELINE_NOT_UPDATED"
  | "CONCURRENT_SECTION_WRITE"
  | "UNCONTRACTED_MESSAGE"
  | "TELEMETRY_DIRECT_TRANSFER"
  | "CONSENSUS_DIRECT_DEBATE"
  | "RETRY_BYPASS_PIPELINE"
  | "EXECUTION_FAILED";

export type AgentPipelineCommunicationStageDefinition = {
  id: AgentPipelineCommunicationStageId;
  order: number;
  label: string;
  responsibility: string;
};

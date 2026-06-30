/**
 * Chapter 7.3 — Agent Session Lifecycle types
 * Ephemeral per-task agent lifecycle — distinct from Ch 4.2 LM orchestrator lifecycle.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BaseAgentTelemetry } from "./base-agent-architecture-types";
import type { UniversalAgentResult } from "./universal-agent-contract-types";

/** Ch 7.3 mandatory lifecycle stages (9) */
export const AgentSessionLifecycleStage = {
  CREATED: "created",
  INITIALIZED: "initialized",
  CONTEXT_LOADED: "context_loaded",
  KNOWLEDGE_LOADED: "knowledge_loaded",
  REASONING: "reasoning",
  BLUEPRINT_GENERATED: "blueprint_generated",
  SELF_VALIDATION: "self_validation",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

export type AgentSessionLifecycleStageId =
  (typeof AgentSessionLifecycleStage)[keyof typeof AgentSessionLifecycleStage];

/** Runtime state — agent is in exactly one at any moment */
export const AgentSessionState = {
  CREATED: "created",
  INITIALIZED: "initialized",
  LOADING_CONTEXT: "loading_context",
  LOADING_KNOWLEDGE: "loading_knowledge",
  REASONING: "reasoning",
  GENERATING_BLUEPRINT: "generating_blueprint",
  VALIDATING: "validating",
  COMPLETED: "completed",
  RETRY: "retry",
  FAILED: "failed",
  ARCHIVED: "archived",
  CANCELLED: "cancelled",
} as const;

export type AgentSessionStateId = (typeof AgentSessionState)[keyof typeof AgentSessionState];

/** Terminal outcomes for session lifecycle */
export const AgentSessionTerminalOutcome = {
  COMPLETED: "completed",
  RETRY: "retry",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type AgentSessionTerminalOutcomeId =
  (typeof AgentSessionTerminalOutcome)[keyof typeof AgentSessionTerminalOutcome];

/** Lifecycle events published to Event Bus */
export const AgentSessionLifecycleEvent = {
  AGENT_CREATED: "AgentCreated",
  KNOWLEDGE_LOADED: "KnowledgeLoaded",
  DECISION_COMPLETED: "DecisionCompleted",
  VALIDATION_PASSED: "ValidationPassed",
  RETRY_STARTED: "RetryStarted",
  AGENT_COMPLETED: "AgentCompleted",
} as const;

export type AgentSessionLifecycleEventId =
  (typeof AgentSessionLifecycleEvent)[keyof typeof AgentSessionLifecycleEvent];

export type AgentSessionStageTiming = {
  stage: AgentSessionLifecycleStageId;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  externalWaitMs?: number;
};

export type AgentSessionStageRecord = {
  stage: AgentSessionLifecycleStageId;
  state: AgentSessionStateId;
  at: number;
  detail?: string;
};

export type AgentSessionIdentity = {
  agentId: AgentContractId;
  agentInstanceId: string;
  executionId: string;
  traceId: string;
  workspaceId: string;
};

export type AgentSessionArchiveRecord = {
  traceId: string;
  executionId: string;
  agentId: AgentContractId;
  blueprintSection: string;
  telemetry: BaseAgentTelemetry;
  decisionReport?: UniversalAgentResult;
  totalDurationMs: number;
  outcome: AgentSessionTerminalOutcomeId;
  eventsPublished: AgentSessionLifecycleEventId[];
};

export type AgentSessionLifecycleViolation = {
  code: AgentSessionLifecycleFailureCode;
  stage?: AgentSessionLifecycleStageId;
  message: string;
  agentId?: string;
};

export type AgentSessionLifecycleReport = {
  valid: boolean;
  identity: AgentSessionIdentity;
  currentState: AgentSessionStateId;
  outcome: AgentSessionTerminalOutcomeId;
  stagesCompleted: AgentSessionLifecycleStageId[];
  stageRecords: AgentSessionStageRecord[];
  stageTimings: AgentSessionStageTiming[];
  eventsPublished: AgentSessionLifecycleEventId[];
  retryCount: number;
  violations: AgentSessionLifecycleViolation[];
  telemetry?: BaseAgentTelemetry;
  result?: UniversalAgentResult;
  archive?: AgentSessionArchiveRecord;
  statelessVerified: boolean;
};

export type AgentSessionLifecycleValidationReport = {
  valid: boolean;
  violations: AgentSessionLifecycleViolation[];
  stagesComplete: boolean;
  observabilityReady: boolean;
  retrySupported: boolean;
  statelessDesign: boolean;
  selfValidationRequired: boolean;
  goldenRuleSatisfied: boolean;
  successCriteriaMet: boolean;
  kitchenExecutionValid: boolean;
};

export type AgentSessionLifecycleContext = {
  /** Simulate missing mandatory context */
  missingContext?: boolean;
  /** Force validation failure on first attempt (retry path) */
  forceValidationFailure?: boolean;
  /** Pipeline cancelled before completion */
  cancelled?: boolean;
  /** Agent retains hidden state between runs — failure condition */
  hiddenState?: boolean;
  /** Skip self validation — failure condition */
  skipSelfValidation?: boolean;
  maxRetries?: number;
};

export type AgentSessionLifecycleFailureCode =
  | "INCOMPLETE_LIFECYCLE"
  | "MISSING_SELF_VALIDATION"
  | "HIDDEN_STATE"
  | "MISSING_CONTEXT"
  | "VALIDATION_FAILED"
  | "RETRY_EXHAUSTED"
  | "CRITICAL_FAILURE"
  | "CANCELLED"
  | "TELEMETRY_LOST"
  | "STATE_AMBIGUOUS"
  | "EXECUTION_FAILED";

export type AgentSessionLifecycleStageDefinition = {
  id: AgentSessionLifecycleStageId;
  order: number;
  label: string;
  runtimeState: AgentSessionStateId;
  responsibility: string;
};

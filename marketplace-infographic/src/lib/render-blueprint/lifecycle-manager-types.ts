/**
 * Chapter 3.4 — Lifecycle Manager types
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { AgentContractId, AgentResultBase } from "./agent-contracts";
import type { DecisionTypeId } from "./decision-graph-types";
import type { SectionState } from "./lifecycle-types";

export const PipelineState = {
  NEW: "NEW",
  RUNNING: "RUNNING",
  VALIDATING: "VALIDATING",
  LOCKED: "LOCKED",
  FINISHED: "FINISHED",
  FAILED: "FAILED",
} as const;

export type PipelineStateId = (typeof PipelineState)[keyof typeof PipelineState];

export const LifecycleEventType = {
  StageStarted: "StageStarted",
  StageFinished: "StageFinished",
  MutationApplied: "MutationApplied",
  SnapshotCreated: "SnapshotCreated",
  RetryStarted: "RetryStarted",
  RollbackStarted: "RollbackStarted",
  ValidationFailed: "ValidationFailed",
  PipelineFinished: "PipelineFinished",
} as const;

export type LifecycleEventTypeId = (typeof LifecycleEventType)[keyof typeof LifecycleEventType];

export type LifecycleEvent = {
  type: LifecycleEventTypeId;
  stage: BlueprintLifecycle;
  revision: number;
  timestamp: number;
  agentId?: AgentContractId;
  detail?: string;
};

export const RetryKind = {
  Agent: "Agent",
  Stage: "Stage",
  Pipeline: "Pipeline",
} as const;

export type RetryKindId = (typeof RetryKind)[keyof typeof RetryKind];

export type RetryLimits = {
  agent: number;
  stage: number;
  pipeline: number;
};

export const DEFAULT_RETRY_LIMITS: RetryLimits = {
  agent: 2,
  stage: 2,
  pipeline: 1,
};

export type StagePrecondition = {
  section: import("./lifecycle-types").LifecycleManagedSection;
  state: SectionState;
};

export type DecisionNodeSnapshot = {
  id: string;
  type: DecisionTypeId;
  state: SectionState;
  confidence: number;
  value: unknown;
};

export type StageSnapshot = {
  id: string;
  stage: BlueprintLifecycle;
  createdAt: number;
  revision: number;
  validated: boolean;
  blueprint: import("./types").RenderBlueprint;
  graph: DecisionNodeSnapshot[];
  agentId?: AgentContractId;
  agentResult?: AgentResultBase;
};

export type LifecycleLogEntry = {
  stage: BlueprintLifecycle;
  agentId: AgentContractId;
  revision: number;
  durationMs: number;
  retryCount: number;
  success: boolean;
  at: number;
};

export type StageExecutionResult = {
  blueprint: import("./types").RenderBlueprint;
  graph: import("./decision-graph").DecisionGraph;
  revision: number;
  snapshotId?: string;
  events: LifecycleEvent[];
};

export type OptimisticLockError = {
  code: "OPTIMISTIC_LOCK";
  expectedRevision: number;
  actualRevision: number;
};

/**
 * Chapter 3.16 — Error Handling & Recovery types
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { BlueprintSection } from "./types";
import type { ProviderId } from "./render-pipeline-types";

export const RecoveryErrorCategory = {
  VALIDATION: "validation",
  MUTATION: "mutation",
  AGENT: "agent",
  RENDER: "render",
  PROVIDER: "provider",
  NETWORK: "network",
  COMPOSITE: "composite",
  VISION: "vision",
  PIPELINE: "pipeline",
  SYSTEM: "system",
  UNKNOWN: "unknown",
} as const;

export type RecoveryErrorCategoryId =
  (typeof RecoveryErrorCategory)[keyof typeof RecoveryErrorCategory];

export const ErrorSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
  FATAL: "fatal",
} as const;

export type ErrorSeverityId = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

export const RecoveryStrategy = {
  CONTINUE: "continue",
  LOCAL_RETRY: "local_retry",
  STAGE_ROLLBACK: "stage_rollback",
  BLUEPRINT_ROLLBACK: "blueprint_rollback",
  PROVIDER_RETRY: "provider_retry",
  PROVIDER_SWITCH: "provider_switch",
  COMPOSITE_RETRY: "composite_retry",
  ABORT: "abort",
} as const;

export type RecoveryStrategyId = (typeof RecoveryStrategy)[keyof typeof RecoveryStrategy];

export type RetryPolicy = {
  providerRetry: number;
  layoutRetry: number;
  photoRetry: number;
  visionRetry: number;
  chiefRetry: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  providerRetry: 3,
  layoutRetry: 2,
  photoRetry: 2,
  visionRetry: 2,
  chiefRetry: 1,
};

export type RecoveryRecommendation = {
  strategy: RecoveryStrategyId;
  reason: string;
  confidence: number;
  affectedSections: BlueprintSection[];
};

export type ClassifiedError = {
  category: RecoveryErrorCategoryId;
  severity: ErrorSeverityId;
  message: string;
  code?: string;
  recoverable: boolean;
  httpStatus?: number;
  provider?: ProviderId;
};

export type RecoveryPlan = {
  strategy: RecoveryStrategyId;
  reason: string;
  category: RecoveryErrorCategoryId;
  severity: ErrorSeverityId;
  resumeStage?: BlueprintLifecycle;
  affectedSections: BlueprintSection[];
  provider?: ProviderId;
  waitMs?: number;
  escalationLevel: number;
};

export type RecoveryLog = {
  strategy: RecoveryStrategyId;
  reason: string;
  durationMs: number;
  success: boolean;
  category: RecoveryErrorCategoryId;
  timestamp: number;
};

export type RecoveryMetrics = {
  retryCount: number;
  rollbackCount: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTimeMs: number;
  finalStrategy?: RecoveryStrategyId;
};

export type ProviderRecoveryAction = {
  action: "wait" | "retry" | "switch";
  waitMs?: number;
  nextProvider?: ProviderId;
};

export type VisionProblemId =
  | "wrong_background"
  | "wrong_lighting"
  | "bad_integration"
  | "png_overlay_feel"
  | "product_too_small";

export type RecoveryInvariantViolation = {
  code:
    | "LIFECYCLE_VIOLATION"
    | "DECISION_HISTORY_MUTATED"
    | "SNAPSHOT_DELETED"
    | "VERSION_CHANGED"
    | "SEED_CHANGED";
  message: string;
};

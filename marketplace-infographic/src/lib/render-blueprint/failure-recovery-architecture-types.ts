/**
 * Chapter 4.27 — Failure Recovery Architecture types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { ClassifiedError, RecoveryStrategyId } from "./recovery-types";
import type { ProviderId } from "./render-pipeline-types";
import type { BlueprintSection, RenderBlueprint } from "./types";

export const FailureCategory = {
  AGENT: "agent",
  PROVIDER: "provider",
  VALIDATION: "validation",
  VISION: "vision",
  INFRASTRUCTURE: "infrastructure",
} as const;

export type FailureCategoryId = (typeof FailureCategory)[keyof typeof FailureCategory];

export const FailureRecoveryStrategy = {
  RETRY: "retry",
  FALLBACK: "fallback",
  ROLLBACK: "rollback",
  ESCALATION: "escalation",
} as const;

export type FailureRecoveryStrategyId =
  (typeof FailureRecoveryStrategy)[keyof typeof FailureRecoveryStrategy];

export type FailureDetection = {
  detectedAt: number;
  message: string;
  code?: string;
  category: FailureCategoryId;
  sourceAgent?: AgentContractId;
  sourceSection?: BlueprintSection;
  blueprintRevision: number;
};

export type FailureIsolation = {
  category: FailureCategoryId;
  failedAgent?: AgentContractId;
  failedSection?: BlueprintSection;
  preservedSections: BlueprintSection[];
  rebuildSections: BlueprintSection[];
  blueprintIntact: boolean;
  explanation: string;
};

export type SectionRollbackPlan = {
  section: BlueprintSection;
  fromVersion: number;
  toVersion: number;
  strategy: FailureRecoveryStrategyId;
  preservedSections: BlueprintSection[];
  reason: string;
};

export type ProviderFailoverPlan = {
  currentProvider: ProviderId;
  nextProvider: ProviderId;
  blueprintUnchanged: boolean;
  strategy: FailureRecoveryStrategyId;
  reason: string;
};

export type SafeDegradationPlan = {
  component: string;
  degradedCapability: string;
  pipelineContinues: boolean;
  reason: string;
};

export type FailureRecoveryPlan = {
  detection: FailureDetection;
  isolation: FailureIsolation;
  strategy: FailureRecoveryStrategyId;
  recoveryStrategy: RecoveryStrategyId;
  resumeStage?: BlueprintLifecycle;
  sectionRollback?: SectionRollbackPlan;
  providerFailover?: ProviderFailoverPlan;
  safeDegradation?: SafeDegradationPlan;
  escalateToChief: boolean;
  reason: string;
  explainability: string[];
};

export type RecoveryValidationResult = {
  recovered: boolean;
  errorResolved: boolean;
  noNewConflicts: boolean;
  blueprintValid: boolean;
  qualityMaintained: boolean;
  violations: string[];
};

export type FailureLogEntry = {
  failureType: FailureCategoryId;
  agent?: string;
  section?: BlueprintSection;
  reason: string;
  blueprintRevision: number;
  recoveryStrategy: FailureRecoveryStrategyId;
  recoveryOutcome: "success" | "failure" | "pending";
  durationMs: number;
  timestamp: number;
};

export type FailureRecoveryContext = {
  blueprint: RenderBlueprint;
  error?: ClassifiedError;
  failedAgent?: AgentContractId;
  failedSection?: BlueprintSection;
  currentProvider?: ProviderId;
  httpStatus?: number;
  unavailableComponents?: string[];
  sectionVersion?: number;
  previousSectionVersion?: number;
  recoveryHistory?: FailureLogEntry[];
};

export type FailureRecoveryReport = {
  resilient: boolean;
  violations: FailureRecoveryViolation[];
  plan?: FailureRecoveryPlan;
  validation?: RecoveryValidationResult;
  logs: FailureLogEntry[];
  goldenRuleSatisfied: boolean;
};

export type FailureRecoveryViolation = {
  code: FailureRecoveryFailureCode;
  message: string;
  section?: BlueprintSection;
  agentId?: string;
};

export type FailureRecoveryFailureCode =
  | "PIPELINE_HALTED"
  | "MISSING_ISOLATION"
  | "UNKNOWN_FAILURE_SOURCE"
  | "ROLLBACK_DAMAGED_BLUEPRINT"
  | "UNRECOVERABLE_TRANSIENT"
  | "FULL_RESTART_UNNECESSARY"
  | "MISSING_RECOVERY_VALIDATION"
  | "MISSING_FAILURE_LOG";

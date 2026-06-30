/**
 * Chapter 4.24 — Retry Architecture types
 */
import type { ChiefReview } from "./chief-design-director-types";
import type { ConsensusReport } from "./consensus-engine-types";
import type { BlueprintMutation } from "./mutation-types";
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { VisionQualityReport } from "./vision-quality-director-types";
import type { RenderBlueprint } from "./types";

export const RetryLevel = {
  NONE: 0,
  PROVIDER: 1,
  ADAPTER: 2,
  TECHNICAL: 3,
  CREATIVE: 4,
  FULL_PIPELINE: 5,
} as const;

export type RetryLevelId = (typeof RetryLevel)[keyof typeof RetryLevel];

export type PipelineStage = BlueprintLifecycle;

export type ProviderDiagnostics = {
  provider: string;
  httpStatus?: number;
  artifactDetected?: boolean;
  promptMappingError?: boolean;
  estimatedCostCents?: number;
  generationTimeMs?: number;
};

export type RetryBudget = {
  maxAttempts?: number;
  maxCostCents?: number;
  minImprovementScore?: number;
};

export type RetryHistoryEntry = {
  attempt: number;
  level: RetryLevelId;
  primarySection: string;
  reason: string;
  costCents?: number;
  scoreBefore?: number;
  scoreAfter?: number;
};

/** Chapter 4.24 — localized recovery plan for Lifecycle Manager */
export type RetryPlan = {
  retryLevel: RetryLevelId;
  restartFrom: PipelineStage;
  preserveSections: string[];
  rebuildSections: string[];
  mutationPlan: BlueprintMutation[];
  estimatedCost: number;
  estimatedImprovement: number;
  confidence: number;
  reason: string;
};

export type RetryArchitectureContext = {
  chiefReview: ChiefReview;
  consensusReport?: ConsensusReport;
  visionReport?: VisionQualityReport;
  retryHistory?: RetryHistoryEntry[];
  providerDiagnostics?: ProviderDiagnostics;
  budget?: RetryBudget;
};

export type RetryExplainabilityReport = {
  agentId: "retry-architecture";
  diagnosis: string;
  preservedDecisions: string[];
  adaptiveEscalation?: string;
  budgetDecision?: string;
  reasoning: string[];
};

export type RetryValidationReport = {
  valid: boolean;
  violations: string[];
  plan?: RetryPlan;
};

export type RetryFailureCode =
  | "FULL_RESTART_UNNECESSARY"
  | "GOOD_SECTIONS_DESTROYED"
  | "MISSING_RETRY_HISTORY"
  | "UNEXPLAINABLE_RETRY"
  | "COST_EXCEEDS_BENEFIT"
  | "MISSING_CHIEF_REVIEW";

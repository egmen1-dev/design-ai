/**
 * Chapter 4.19 — Chief Design Director types
 */
import type { BlueprintMutation } from "./mutation-types";
import type { VisionQualityReport } from "./vision-quality-director-types";

export const RetryStrategy = {
  NONE: "none",
  LIGHTING_RETRY: "lighting_retry",
  CAMERA_RETRY: "camera_retry",
  MATERIAL_RETRY: "material_retry",
  SCENE_RETRY: "scene_retry",
  PHOTOGRAPHY_RETRY: "photography_retry",
  RENDER_RETRY: "render_retry",
  FULL_PIPELINE_RETRY: "full_pipeline_retry",
} as const;

export type RetryStrategyId = (typeof RetryStrategy)[keyof typeof RetryStrategy];

export const FinalDecision = {
  APPROVE: "approve",
  RETRY: "retry",
  REJECT: "reject",
} as const;

export type FinalDecisionId = (typeof FinalDecision)[keyof typeof FinalDecision];

export const ChiefProblemSeverity = {
  CRITICAL: "critical",
  MAJOR: "major",
  MINOR: "minor",
} as const;

export type ChiefProblemSeverityId = (typeof ChiefProblemSeverity)[keyof typeof ChiefProblemSeverity];

export type ChiefProblem = {
  code: string;
  severity: ChiefProblemSeverityId;
  section: string;
  message: string;
  sourceAgent: string;
};

/** Minimal commercial photographer review for orchestration */
export type CommercialPhotographerReviewSummary = {
  score: number;
  realism: number;
  looksLikePhoto: boolean;
  problems: string[];
  scores: {
    lighting: number;
    shadows: number;
    perspective: number;
    integration: number;
    colorMatching: number;
    realism: number;
  };
};

export type RetryHistorySummary = {
  attempts: number;
  strategiesUsed: string[];
};

export type GenerationDiagnosticsSummary = {
  provider: string;
  generationTimeMs?: number;
  estimatedCostCents?: number;
};

/** Chapter 4.19 — final pipeline orchestration decision */
export type ChiefReview = {
  approved: boolean;
  overallScore: number;
  estimatedScoreAfterRetry: number;
  retryRequired: boolean;
  retryStrategy: RetryStrategyId;
  priorityProblems: ChiefProblem[];
  recommendedMutations: BlueprintMutation[];
  finalDecision: FinalDecisionId;
  confidence: number;
};

export type ChiefDesignDirectorContext = {
  visionReport: VisionQualityReport;
  photoReview?: CommercialPhotographerReviewSummary;
  agentConfidences?: Record<string, number>;
  retryHistory?: RetryHistorySummary;
  generationDiagnostics?: GenerationDiagnosticsSummary;
  maxRetryAttempts?: number;
  minAcceptableScore?: number;
};

export type ChiefExplainabilityReport = {
  agentId: "chief-design-director";
  agentContributions: { agentId: string; confidence: number; assessment: string }[];
  criticalProblems: string[];
  acceptableProblems: string[];
  crossAgentConflicts: string[];
  costDecision?: string;
  reasoning: string[];
};

export type ChiefValidationReport = {
  valid: boolean;
  violations: string[];
  review?: ChiefReview;
};

export type ChiefFailureCode =
  | "FULL_RETRY_UNNECESSARY"
  | "IGNORED_AGENT_REPORTS"
  | "MISSING_EXPLANATION"
  | "RETRY_WITHOUT_REASON"
  | "MISSING_VISION_REPORT"
  | "DIRECT_BLUEPRINT_MUTATION";

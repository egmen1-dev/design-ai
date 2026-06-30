/**
 * Chapter 4.18 — Vision Quality Director types
 */

export const RetryRecommendation = {
  ACCEPT: "accept",
  RETRY_LIGHTING: "retry_lighting",
  RETRY_SCENE: "retry_scene",
  RETRY_FULL_RENDER: "retry_full_render",
  REJECT: "reject",
} as const;

export type RetryRecommendationId = (typeof RetryRecommendation)[keyof typeof RetryRecommendation];

export const VisionProblemSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type VisionProblemSeverityId = (typeof VisionProblemSeverity)[keyof typeof VisionProblemSeverity];

export type VisionProblem = {
  code: string;
  severity: VisionProblemSeverityId;
  section: string;
  message: string;
  critical: boolean;
};

/** Chapter 4.18 — blueprint-aligned vision report (background stage, pre-composite) */
export type VisionQualityReport = {
  compositionScore: number;
  sceneAccuracy: number;
  lightingAccuracy: number;
  materialAccuracy: number;
  backgroundCleanliness: number;
  overlaySafety: number;
  providerArtifacts: number;
  overallScore: number;
  problems: VisionProblem[];
  retryRecommendation: RetryRecommendationId;
  confidence: number;
};

export type VisionQualityDirectorInput = {
  image: string;
  provider: string;
  providerMetadata?: {
    provider: string;
    model?: string;
    seed?: number;
    generationTimeMs?: number;
  };
  diagnostics?: Record<string, number | boolean>;
};

export type VisionQualityExplainabilityReport = {
  agentId: "vision-quality-director";
  blueprintSectionsChecked: string[];
  criticalProblems: string[];
  acceptableProblems: string[];
  retryReasoning: string;
  reasoning: string[];
};

export type VisionQualityValidationReport = {
  valid: boolean;
  violations: string[];
  report?: VisionQualityReport;
};

export type VisionQualityFailureCode =
  | "MISSING_BLUEPRINT"
  | "MISSING_IMAGE"
  | "AESTHETIC_ONLY_JUDGMENT"
  | "NO_RETRY_RECOMMENDATION"
  | "UNEXPLAINABLE_REPORT"
  | "OBVIOUS_ARTIFACT_MISSED";

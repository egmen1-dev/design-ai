/**
 * Chapter 6.16 — Chief Design Director Review Stage types
 * Distinct from Ch 4.19 ChiefReview and CommercialPhotographerReviewSummary.
 */
import type { PipelineAssemblyMetadata } from "./blueprint-assembly-stage-types";
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { PlannedConsensusReport } from "./consensus-validation-stage-types";
import type { PlannedCommercialReport } from "./commercial-validation-stage-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { PlannedVisionReport } from "./vision-validation-stage-types";
import type { RenderBlueprint } from "./types";

export const ChiefDesignDirectorReviewStage = {
  INPUT_ASSEMBLY: "input_assembly",
  BUSINESS_REVIEW: "business_review",
  CREATIVE_REVIEW: "creative_review",
  TECHNICAL_REVIEW: "technical_review",
  MARKETPLACE_REVIEW: "marketplace_review",
  COMMERCIAL_REVIEW: "commercial_review",
  PROFESSIONAL_SCORE: "professional_score",
  RETRY_DECISION: "retry_decision",
  ESCALATION_POLICY: "escalation_policy",
  FINAL_APPROVAL: "final_approval",
  LEARNING_FEEDBACK: "learning_feedback",
  EXPLAINABILITY: "explainability",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type ChiefDesignDirectorReviewStageId =
  (typeof ChiefDesignDirectorReviewStage)[keyof typeof ChiefDesignDirectorReviewStage];

export const DirectorApprovalStatus = {
  APPROVED: "approved",
  APPROVED_WITH_NOTES: "approved_with_notes",
  RETRY_REQUIRED: "retry_required",
  BLUEPRINT_REBUILD: "blueprint_rebuild",
} as const;

export type DirectorApprovalStatusId =
  (typeof DirectorApprovalStatus)[keyof typeof DirectorApprovalStatus];

export const DirectorFinalDecision = {
  APPROVED: "Approved",
  APPROVED_WITH_NOTES: "Approved With Notes",
  RETRY_REQUIRED: "Retry Required",
  BLUEPRINT_REBUILD: "Blueprint Rebuild",
} as const;

export type DirectorFinalDecisionId =
  (typeof DirectorFinalDecision)[keyof typeof DirectorFinalDecision];

/** Ch 6.16 PlannedDirectorIssue — spec Issue */
export type PlannedDirectorIssue = {
  id: string;
  category: string;
  description: string;
  severity: string;
  source: string;
};

/** Ch 6.16 PlannedDirectorRecommendation — spec Recommendation */
export type PlannedDirectorRecommendation = {
  target: string;
  action: string;
  reason: string;
};

/** Ch 6.16 PlannedDirectorReport — spec DirectorReport */
export type PlannedDirectorReport = {
  overallScore: number;
  professionalLevel: number;
  approvalStatus: string;
  retryRequired: boolean;
  retryTargets: string[];
  criticalIssues: PlannedDirectorIssue[];
  recommendations: PlannedDirectorRecommendation[];
  finalDecision: string;
};

export type DirectorDimensionScores = {
  business: number;
  creative: number;
  technical: number;
  marketplace: number;
  commercial: number;
};

export type DirectorLearningFeedback = {
  professionalScore: number;
  successes: string[];
  errors: string[];
  recommendations: string[];
};

export type ChiefDesignDirectorReviewInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  blueprint: RenderBlueprint;
  visionReport: PlannedVisionReport;
  commercialReport: PlannedCommercialReport;
  consensusReport: PlannedConsensusReport;
  metadata: PipelineAssemblyMetadata;
  imageRef: string;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
};

export type ChiefDesignDirectorReviewSection = {
  plannedReport: PlannedDirectorReport;
  dimensionScores: DirectorDimensionScores;
  learningFeedback: DirectorLearningFeedback;
  blueprint: RenderBlueprint;
  stagesCompleted: ChiefDesignDirectorReviewStageId[];
  confidence: number;
};

export type ChiefDesignDirectorReviewStageViolation = {
  code: ChiefDesignDirectorReviewStageFailureCode;
  message: string;
  stage?: ChiefDesignDirectorReviewStageId;
};

export type ChiefDesignDirectorReviewReport = {
  valid: boolean;
  violations: ChiefDesignDirectorReviewStageViolation[];
  section?: ChiefDesignDirectorReviewSection;
  stagesCompleted: ChiefDesignDirectorReviewStageId[];
  durationMs: number;
};

export type ChiefDesignDirectorReviewContext = {
  missingVisionReport?: boolean;
  missingCommercialReport?: boolean;
  missingConsensusReport?: boolean;
  injectWeakBusinessAlignment?: boolean;
  injectWeakCreative?: boolean;
  injectCriticalTechnical?: boolean;
  injectWeakCommercial?: boolean;
  injectBlueprintRebuild?: boolean;
  injectExhaustedRetries?: boolean;
  retryAttempts?: number;
  marketplace?: string;
  providerId?: string;
};

export type ChiefDesignDirectorReviewSystemReport = {
  valid: boolean;
  violations: ChiefDesignDirectorReviewStageViolation[];
  goldenRuleSatisfied: boolean;
  multiDimensionalReview: boolean;
  allReportsConsidered: boolean;
  explainabilityComplete: boolean;
  retryTargeted: boolean;
  downstreamReady: boolean;
};

export type ChiefDesignDirectorReviewStageFailureCode =
  | "MISSING_VISION_REPORT"
  | "MISSING_COMMERCIAL_REPORT"
  | "MISSING_CONSENSUS_REPORT"
  | "MISSING_DIRECTOR_REPORT"
  | "SINGLE_METRIC_DECISION"
  | "BUSINESS_GOAL_IGNORED"
  | "COMMERCIAL_SCORE_IGNORED"
  | "UNAPPROVED_WITH_LOW_SCORE"
  | "MISSING_EXPLAINABILITY"
  | "CHAOTIC_RETRY"
  | "WEAK_IMAGE_APPROVED";

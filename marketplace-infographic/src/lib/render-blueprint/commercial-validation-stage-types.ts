/**
 * Chapter 6.15 — Commercial Validation Stage types
 * Distinct from Ch 4.19 ChiefReview and CommercialPhotographerReviewSummary.
 */
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { PlannedVisionReport } from "./vision-validation-stage-types";
import type { RenderBlueprint } from "./types";

export const CommercialValidationStage = {
  INPUT_ASSEMBLY: "input_assembly",
  ATTENTION_ANALYSIS: "attention_analysis",
  CTR_PREDICTION: "ctr_prediction",
  TRUST_ANALYSIS: "trust_analysis",
  SELLING_POWER: "selling_power",
  MARKETPLACE_FIT: "marketplace_fit",
  PURCHASE_INTENT: "purchase_intent",
  BUSINESS_GOAL_ALIGNMENT: "business_goal_alignment",
  CLARITY_ANALYSIS: "clarity_analysis",
  COMMERCIAL_SCORE: "commercial_score",
  RECOMMENDATION_ENGINE: "recommendation_engine",
  EXPLAINABILITY: "explainability",
  APPROVAL_DECISION: "approval_decision",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type CommercialValidationStageId =
  (typeof CommercialValidationStage)[keyof typeof CommercialValidationStage];

/** Ch 6.15 PlannedCommercialRecommendation — spec Recommendation */
export type PlannedCommercialRecommendation = {
  target: string;
  action: string;
  reason: string;
};

/** Ch 6.15 PlannedCommercialReport — spec CommercialReport */
export type PlannedCommercialReport = {
  commercialScore: number;
  ctrPrediction: number;
  attentionScore: number;
  clarityScore: number;
  trustScore: number;
  sellingPower: number;
  marketplaceFit: number;
  purchaseIntent: number;
  recommendations: PlannedCommercialRecommendation[];
  approved: boolean;
};

export type CommercialLayerScores = {
  attention: number;
  trust: number;
  sellingPower: number;
  marketplaceFit: number;
  purchaseIntent: number;
  clarity: number;
};

export type CommercialValidationInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  blueprint: RenderBlueprint;
  visionReport: PlannedVisionReport;
  imageRef: string;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
};

export type CommercialValidationSection = {
  plannedReport: PlannedCommercialReport;
  layerScores: CommercialLayerScores;
  blueprint: RenderBlueprint;
  stagesCompleted: CommercialValidationStageId[];
  confidence: number;
};

export type CommercialValidationStageViolation = {
  code: CommercialValidationStageFailureCode;
  message: string;
  stage?: CommercialValidationStageId;
};

export type CommercialValidationReport = {
  valid: boolean;
  violations: CommercialValidationStageViolation[];
  section?: CommercialValidationSection;
  stagesCompleted: CommercialValidationStageId[];
  durationMs: number;
};

export type CommercialValidationContext = {
  missingVisionReport?: boolean;
  missingBusinessModel?: boolean;
  injectWeakValueProposition?: boolean;
  injectHeroNotDominant?: boolean;
  injectWeakStory?: boolean;
  injectLowMarketplaceFit?: boolean;
  injectLowTrust?: boolean;
  marketplace?: string;
  providerId?: string;
};

export type CommercialValidationSystemReport = {
  valid: boolean;
  violations: CommercialValidationStageViolation[];
  goldenRuleSatisfied: boolean;
  businessGoalConsidered: boolean;
  ctrPredicted: boolean;
  explainabilityComplete: boolean;
  differentiatedScores: boolean;
  downstreamReady: boolean;
};

export type CommercialValidationStageFailureCode =
  | "MISSING_VISION_REPORT"
  | "MISSING_BUSINESS_MODEL"
  | "MISSING_COMMERCIAL_REPORT"
  | "MISSING_CTR_PREDICTION"
  | "BUSINESS_GOAL_IGNORED"
  | "AESTHETIC_ONLY_JUDGMENT"
  | "UNAPPROVED_WITH_LOW_SCORE"
  | "MISSING_EXPLAINABILITY"
  | "IDENTICAL_SCORES";

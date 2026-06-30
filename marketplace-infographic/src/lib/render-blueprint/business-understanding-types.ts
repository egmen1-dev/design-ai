/**
 * Chapter 6.5 — Business Understanding Stage types
 * Distinct from generic business goal capture and Ch 5.x knowledge models.
 */
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const BusinessUnderstandingStage = {
  INPUT_ASSEMBLY: "input_assembly",
  COMMERCIAL_GOAL: "commercial_goal",
  FEATURE_TRANSFORMATION: "feature_transformation",
  PAIN_POINT_ANALYSIS: "pain_point_analysis",
  CUSTOMER_VALUE: "customer_value",
  PURCHASE_MOTIVATION: "purchase_motivation",
  EMOTIONAL_POSITIONING: "emotional_positioning",
  COMPETITIVE_POSITIONING: "competitive_positioning",
  STORY_STRATEGY: "story_strategy",
  PRIORITY_RANKING: "priority_ranking",
  BUSINESS_MODEL_ASSEMBLY: "business_model_assembly",
  VALIDATION: "validation",
} as const;

export type BusinessUnderstandingStageId =
  (typeof BusinessUnderstandingStage)[keyof typeof BusinessUnderstandingStage];

export const StoryStrategyArc = {
  PROBLEM_SOLUTION_BENEFIT_TRUST_ACTION: "problem_solution_benefit_trust_action",
  PREMIUM_QUALITY_MATERIALS_STATUS_PURCHASE: "premium_quality_materials_status_purchase",
  EFFICIENCY_COMFORT_RESULT_ACTION: "efficiency_comfort_result_action",
  TRUST_RELIABILITY_PROFESSIONAL_ACTION: "trust_reliability_professional_action",
} as const;

export type StoryStrategyArcId = (typeof StoryStrategyArc)[keyof typeof StoryStrategyArc];

export const CompetitivePositioningStrategy = {
  MOST_MODERN: "most_modern",
  MOST_RELIABLE: "most_reliable",
  SIMPLEST: "simplest",
  MOST_PROFESSIONAL: "most_professional",
  BEST_VALUE: "best_value",
  BEST_BUNDLE: "best_bundle",
  BEST_QUALITY: "best_quality",
} as const;

export type CompetitivePositioningStrategyId =
  (typeof CompetitivePositioningStrategy)[keyof typeof CompetitivePositioningStrategy];

export const PurchaseMotivationType = {
  SOLVE_PROBLEM: "solve_problem",
  EASE_WORK: "ease_work",
  RAISE_STATUS: "raise_status",
  ENJOYMENT: "enjoyment",
  SAFETY: "safety",
  REPLACE_OLD: "replace_old",
  INCREASE_EFFICIENCY: "increase_efficiency",
} as const;

export type PurchaseMotivationTypeId =
  (typeof PurchaseMotivationType)[keyof typeof PurchaseMotivationType];

/** Ch 6.5 Business Model — spec BusinessModel */
export type PipelineBusinessModel = {
  primaryValue: string;
  secondaryValues: string[];
  painPoints: string[];
  emotionalDrivers: string[];
  purchaseMotivations: string[];
  competitiveAdvantages: string[];
  storyStrategy: string;
  businessPriority: string;
};

export type FeatureBenefitChain = {
  feature: string;
  benefit: string;
  customerValue: string;
  priority: number;
};

export type RankedBusinessPriority = {
  rank: number;
  label: string;
  source: "value" | "benefit" | "pain_relief";
};

export type BusinessUnderstandingInput = {
  profile: AnalyzedProductProfile;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
  brand?: string;
  competitorHints?: string[];
};

export type BusinessUnderstandingSection = {
  model: PipelineBusinessModel;
  featureChains: FeatureBenefitChain[];
  rankedPriorities: RankedBusinessPriority[];
  competitiveStrategy: CompetitivePositioningStrategyId;
  storyStrategyArc: StoryStrategyArcId;
  stagesCompleted: BusinessUnderstandingStageId[];
  confidence: number;
};

export type BusinessUnderstandingViolation = {
  code: BusinessUnderstandingFailureCode;
  message: string;
  stage?: BusinessUnderstandingStageId;
};

export type BusinessUnderstandingReport = {
  valid: boolean;
  violations: BusinessUnderstandingViolation[];
  section?: BusinessUnderstandingSection;
  stagesCompleted: BusinessUnderstandingStageId[];
  durationMs: number;
};

export type BusinessUnderstandingContext = {
  skipFeatureTransform?: boolean;
  missingPrimaryValue?: boolean;
  conflictingStrategies?: boolean;
  unrankedPriorities?: boolean;
};

export type BusinessUnderstandingSystemReport = {
  valid: boolean;
  violations: BusinessUnderstandingViolation[];
  goldenRuleSatisfied: boolean;
  valueOverSpecs: boolean;
  singleStoryStrategy: boolean;
  prioritiesRanked: boolean;
  storyDirectorReady: boolean;
  modelComplete: boolean;
};

export type BusinessUnderstandingFailureCode =
  | "MISSING_PROFILE"
  | "MISSING_KNOWLEDGE"
  | "MISSING_PRIMARY_VALUE"
  | "NO_PAIN_POINTS"
  | "NO_CUSTOMER_VALUE"
  | "NO_PURCHASE_MOTIVATION"
  | "CONFLICTING_STRATEGIES"
  | "UNRANKED_PRIORITIES"
  | "MODEL_INCOMPLETE"
  | "SPECS_NOT_TRANSFORMED"
  | "DESIGN_DECISION_DETECTED";

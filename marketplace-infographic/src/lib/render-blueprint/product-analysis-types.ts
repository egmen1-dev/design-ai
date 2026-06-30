/**
 * Chapter 6.3 — Product Analysis Stage types
 * Distinct from @/lib/product-analysis ProductAnalysis and Ch 6.2 ProductContext stub.
 */
import type { AgentContractId } from "./agent-contracts";
import type { KnowledgeRetrievalRequest } from "./knowledge-retrieval-types";
import type { AudienceProfile } from "./pipeline-context-types";
import type { ProductBlueprint } from "./types";

export const ProductAnalysisStage = {
  INPUT_NORMALIZATION: "input_normalization",
  CATEGORY_RECOGNITION: "category_recognition",
  FEATURE_EXTRACTION: "feature_extraction",
  PAIN_POINT_DETECTION: "pain_point_detection",
  AUDIENCE_ANALYSIS: "audience_analysis",
  USE_CASE_DETECTION: "use_case_detection",
  COMMERCIAL_POSITIONING: "commercial_positioning",
  EMOTIONAL_MAPPING: "emotional_mapping",
  COMPETITIVE_ANALYSIS: "competitive_analysis",
  PROFILE_ASSEMBLY: "profile_assembly",
  KNOWLEDGE_REQUEST: "knowledge_request",
  VALIDATION: "validation",
} as const;

export type ProductAnalysisStageId =
  (typeof ProductAnalysisStage)[keyof typeof ProductAnalysisStage];

export const PriceSegment = {
  BUDGET: "budget",
  MASS_MARKET: "mass_market",
  PROFESSIONAL: "professional",
  PREMIUM: "premium",
} as const;

export type PriceSegmentId = (typeof PriceSegment)[keyof typeof PriceSegment];

export const MarketSegment = {
  CONSUMER: "consumer",
  PROSUMER: "prosumer",
  COMMERCIAL: "commercial",
  SEASONAL: "seasonal",
} as const;

export type MarketSegmentId = (typeof MarketSegment)[keyof typeof MarketSegment];

/** Ch 6.3 Product Profile — marketer-level product understanding (spec ProductProfile) */
export type AnalyzedProductProfile = {
  category: string;
  subcategory: string;
  productType: string;
  marketSegment: string;
  priceSegment: string;
  businessGoal: string;
  targetAudience: AudienceProfile;
  primaryBenefits: string[];
  secondaryBenefits: string[];
  painPoints: string[];
  useCases: string[];
  emotionalTriggers: string[];
  competitiveAdvantages: string[];
};

export type ProductAnalysisInput = {
  productImageRef: string;
  name?: string;
  description?: string;
  characteristics?: string[];
  brand?: string;
  marketplace: string;
  country?: string;
  locale?: string;
  businessGoal: string;
  category?: string;
  targetAudience?: string;
  userPreferences?: string[];
};

export type ProductFeature = {
  label: string;
  priority: number;
  isBenefit: boolean;
};

export type ProductKnowledgeRequest = {
  category: string;
  subcategory: string;
  marketplace: string;
  audience: string;
  positioning: string;
  businessGoal: string;
  retrievalRequest: KnowledgeRetrievalRequest;
};

export type ProductAnalysisSection = {
  profile: AnalyzedProductProfile;
  productBlueprint: ProductBlueprint;
  features: ProductFeature[];
  knowledgeRequest: ProductKnowledgeRequest;
  stagesCompleted: ProductAnalysisStageId[];
  confidence: number;
};

export type ProductAnalysisExplainability = {
  categoryReason: string;
  benefitRationale: string;
  painPointRationale: string;
  audienceRationale: string;
  positioningRationale: string;
  designExcluded: boolean;
};

export type ProductAnalysisViolation = {
  code: ProductAnalysisFailureCode;
  message: string;
  stage?: ProductAnalysisStageId;
};

export type ProductAnalysisReport = {
  valid: boolean;
  violations: ProductAnalysisViolation[];
  section?: ProductAnalysisSection;
  stagesCompleted: ProductAnalysisStageId[];
  durationMs: number;
};

export type ProductAnalysisContext = {
  skipKnowledgeRequest?: boolean;
  forceInvalidCategory?: boolean;
  missingBenefits?: boolean;
  missingPainPoints?: boolean;
  missingUseCases?: boolean;
};

export type ProductAnalysisSystemReport = {
  valid: boolean;
  violations: ProductAnalysisViolation[];
  goldenRuleSatisfied: boolean;
  marketerLevelUnderstanding: boolean;
  knowledgeRequestFormed: boolean;
  designExcluded: boolean;
  profileComplete: boolean;
};

export type ProductAnalysisFailureCode =
  | "MISSING_IMAGE"
  | "CATEGORY_UNKNOWN"
  | "PROFILE_INCOMPLETE"
  | "NO_PRIMARY_BENEFITS"
  | "NO_PAIN_POINTS"
  | "NO_USE_CASES"
  | "MISSING_BUSINESS_GOAL"
  | "PROFILE_CONTRADICTION"
  | "KNOWLEDGE_REQUEST_FAILED"
  | "DESIGN_DECISION_DETECTED";

export type ProductAnalyzerAgentId = Extract<AgentContractId, "product-analyzer">;

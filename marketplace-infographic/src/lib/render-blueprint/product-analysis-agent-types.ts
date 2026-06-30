/**
 * Chapter 7.7 — Product Analysis Agent types
 * First intelligent agent specification — distinct from Ch 6.3 pipeline stage API.
 */
import type { AgentContractId } from "./agent-contracts";
import type { AudienceProfile } from "./pipeline-context-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

/** Ch 7.7 internal agent modules (7) */
export const ProductAnalysisAgentModule = {
  CATEGORY_DETECTOR: "category_detector",
  FEATURE_EXTRACTOR: "feature_extractor",
  AUDIENCE_ANALYZER: "audience_analyzer",
  PAIN_POINT_DETECTOR: "pain_point_detector",
  USE_CASE_ANALYZER: "use_case_analyzer",
  BUSINESS_GOAL_BUILDER: "business_goal_builder",
  PRODUCT_PROFILE_BUILDER: "product_profile_builder",
} as const;

export type ProductAnalysisAgentModuleId =
  (typeof ProductAnalysisAgentModule)[keyof typeof ProductAnalysisAgentModule];

export type ProductSpecification = {
  key: string;
  value: string;
  unit?: string;
};

export type ProductImageRef = {
  id: string;
  url: string;
  role?: "hero" | "detail" | "packaging";
};

/** Ch 7.7 ProductAnalysisInput — agent contract */
export type ProductAnalysisAgentInput = {
  title: string;
  description: string;
  specifications: ProductSpecification[];
  productImages: ProductImageRef[];
  brand: string;
  marketplace: string;
  country: string;
  language: string;
  businessGoal?: string;
  categoryHint?: string;
};

/** Ch 7.7 ProductProfile — agent output contract */
export type ProductAnalysisAgentProfile = {
  category: string;
  subcategory: string;
  productType: string;
  priceSegment: string;
  marketSegment: string;
  targetAudience: AudienceProfile[];
  painPoints: string[];
  advantages: string[];
  useCases: string[];
  emotionalTriggers: string[];
  businessGoal: string;
};

export type AudienceConfidenceScore = {
  segment: string;
  confidence: number;
};

export type ProductAnalysisAgentModuleRecord = {
  module: ProductAnalysisAgentModuleId;
  at: number;
  detail?: string;
};

export type ProductAnalysisAgentKpi = {
  accuracyCategory: number;
  audiencePrecision: number;
  featureQuality: number;
  painPointAccuracy: number;
  businessGoalMatch: number;
  confidenceScore: number;
  retryRate: number;
};

export type ProductAnalysisAgentViolation = {
  code: ProductAnalysisAgentFailureCode;
  module?: ProductAnalysisAgentModuleId;
  message: string;
};

export type ProductAnalysisAgentExecutionReport = {
  valid: boolean;
  agentId: AgentContractId;
  violations: ProductAnalysisAgentViolation[];
  modulesCompleted: ProductAnalysisAgentModuleId[];
  moduleRecords: ProductAnalysisAgentModuleRecord[];
  input: ProductAnalysisAgentInput;
  profile?: ProductAnalysisAgentProfile;
  analyzedProfile?: AnalyzedProductProfile;
  confidence: number;
  retryCount: number;
  kpis: ProductAnalysisAgentKpi;
  pipelineMediated: boolean;
  designExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type ProductAnalysisAgentValidationReport = {
  valid: boolean;
  violations: ProductAnalysisAgentViolation[];
  modulesComplete: boolean;
  firstAgentInPipeline: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type ProductAnalysisAgentContext = {
  forceAmbiguousCategory?: boolean;
  lowConfidence?: boolean;
  missingSpecifications?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type ProductAnalysisAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "CATEGORY_AMBIGUOUS"
  | "PROFILE_INCOMPLETE"
  | "MISSING_AUDIENCE"
  | "MISSING_ADVANTAGES"
  | "MISSING_PAIN_POINTS"
  | "MISSING_USE_CASES"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type ProductAnalysisAgentModuleDefinition = {
  id: ProductAnalysisAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type ProductAnalysisAgentPipelineLink = {
  from: string;
  to: string;
};

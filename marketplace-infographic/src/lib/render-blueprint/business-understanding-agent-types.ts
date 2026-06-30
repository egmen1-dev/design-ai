/**
 * Chapter 7.8 — Business Understanding Agent types
 * Intelligent agent specification — distinct from Ch 6.5 pipeline stage API.
 */
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { MarketplaceProfile } from "./marketplace-knowledge-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const BUSINESS_UNDERSTANDING_AGENT_ID = "business-understanding" as const;

/** Ch 7.8 internal agent modules (7) */
export const BusinessUnderstandingAgentModule = {
  VALUE_ANALYZER: "value_analyzer",
  PAIN_POINT_ANALYZER: "pain_point_analyzer",
  MOTIVATION_ENGINE: "motivation_engine",
  EMOTIONAL_MAPPER: "emotional_mapper",
  COMPETITIVE_POSITIONING: "competitive_positioning",
  STRATEGY_BUILDER: "strategy_builder",
  BUSINESS_MODEL_BUILDER: "business_model_builder",
} as const;

export type BusinessUnderstandingAgentModuleId =
  (typeof BusinessUnderstandingAgentModule)[keyof typeof BusinessUnderstandingAgentModule];

export type BusinessUnderstandingAgentCompetitorKnowledge = {
  positioningHints: string[];
  competitorAdvantages: string[];
  categoryLeaders: string[];
};

/** Ch 7.8 BusinessUnderstandingInput — agent contract */
export type BusinessUnderstandingAgentInput = {
  productProfile: AnalyzedProductProfile;
  knowledgePackage: StagedKnowledgePackage;
  marketplaceProfile: MarketplaceProfile;
  competitorKnowledge?: BusinessUnderstandingAgentCompetitorKnowledge;
};

/** Ch 7.8 BusinessModel — agent output contract */
export type BusinessUnderstandingAgentModel = {
  primaryValue: string;
  secondaryValues: string[];
  painPoints: string[];
  customerGoals: string[];
  purchaseMotivations: string[];
  competitiveAdvantages: string[];
  businessStrategy: string;
  emotionalPositioning: string;
};

export type BusinessUnderstandingAgentModuleRecord = {
  module: BusinessUnderstandingAgentModuleId;
  at: number;
  detail?: string;
};

export type BusinessUnderstandingAgentKpi = {
  valuePropositionAccuracy: number;
  painPointPrecision: number;
  strategyConsistency: number;
  emotionalMappingScore: number;
  marketplaceAlignment: number;
  retryRate: number;
  confidenceScore: number;
};

export type BusinessUnderstandingAgentViolation = {
  code: BusinessUnderstandingAgentFailureCode;
  module?: BusinessUnderstandingAgentModuleId;
  message: string;
};

export type BusinessUnderstandingAgentRetryBranch =
  | "emotional_mapper"
  | "value_analyzer"
  | "full";

export type BusinessUnderstandingAgentExecutionReport = {
  valid: boolean;
  agentId: typeof BUSINESS_UNDERSTANDING_AGENT_ID;
  violations: BusinessUnderstandingAgentViolation[];
  modulesCompleted: BusinessUnderstandingAgentModuleId[];
  moduleRecords: BusinessUnderstandingAgentModuleRecord[];
  input: BusinessUnderstandingAgentInput;
  model?: BusinessUnderstandingAgentModel;
  pipelineSection?: import("./business-understanding-types").BusinessUnderstandingSection;
  confidence: number;
  retryCount: number;
  retryBranch?: BusinessUnderstandingAgentRetryBranch;
  kpis: BusinessUnderstandingAgentKpi;
  pipelineMediated: boolean;
  designExcluded: boolean;
  goldenRuleSatisfied: boolean;
  valueOverSpecs: boolean;
};

export type BusinessUnderstandingAgentValidationReport = {
  valid: boolean;
  violations: BusinessUnderstandingAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type BusinessUnderstandingAgentContext = {
  skipFeatureTransform?: boolean;
  missingPrimaryValue?: boolean;
  conflictingStrategies?: boolean;
  unrankedPriorities?: boolean;
  lowEmotionalConfidence?: boolean;
  lowValueConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type BusinessUnderstandingAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "MISSING_PRIMARY_VALUE"
  | "NO_PAIN_POINTS"
  | "NO_CUSTOMER_GOALS"
  | "NO_PURCHASE_MOTIVATION"
  | "CONFLICTING_STRATEGIES"
  | "EMOTIONAL_MAP_INCOMPLETE"
  | "STRATEGY_INCOMPLETE"
  | "MODEL_INCOMPLETE"
  | "SPECS_NOT_TRANSFORMED"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type BusinessUnderstandingAgentModuleDefinition = {
  id: BusinessUnderstandingAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type BusinessUnderstandingAgentPipelineLink = {
  from: string;
  to: string;
};

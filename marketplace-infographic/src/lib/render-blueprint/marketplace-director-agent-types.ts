/**
 * Chapter 7.18 — Marketplace Director Agent types
 * Intelligent agent specification — marketplace adaptation layer.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { MarketplaceProfile } from "./marketplace-knowledge-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const MARKETPLACE_DIRECTOR_AGENT_ID: AgentContractId = "marketplace-director";

/** Ch 7.18 internal agent modules (7) */
export const MarketplaceDirectorAgentModule = {
  MARKETPLACE_PROFILE_LOADER: "marketplace_profile_loader",
  MARKETPLACE_RULES_ENGINE: "marketplace_rules_engine",
  BEHAVIOR_ANALYZER: "behavior_analyzer",
  OVERLAY_OPTIMIZER: "overlay_optimizer",
  COMMERCIAL_ADAPTATION_ENGINE: "commercial_adaptation_engine",
  MARKETPLACE_VALIDATOR: "marketplace_validator",
  MARKETPLACE_BLUEPRINT_BUILDER: "marketplace_blueprint_builder",
} as const;

export type MarketplaceDirectorAgentModuleId =
  (typeof MarketplaceDirectorAgentModule)[keyof typeof MarketplaceDirectorAgentModule];

/** Ch 7.18 MarketplaceDirectorInput — agent contract */
export type MarketplaceDirectorAgentInput = {
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  typographyBlueprint: TypographyDirectorAgentBlueprint;
  marketplaceProfile: MarketplaceProfile;
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.18 MarketplaceBlueprint — agent output contract */
export type MarketplaceDirectorAgentBlueprint = {
  marketplace: string;
  overlayStrategy: string;
  informationDensity: string;
  badgePriority: string[];
  safeAreaRules: string[];
  marketplaceOptimizations: string[];
  commercialRecommendations: string[];
  confidence: number;
};

export type MarketplaceDirectorAgentModuleRecord = {
  module: MarketplaceDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type MarketplaceDirectorAgentKpi = {
  marketplaceMatch: number;
  ctrPrediction: number;
  overlayQuality: number;
  commercialAdaptationScore: number;
  informationDensity: number;
  buyerReadability: number;
  retryRate: number;
  confidenceScore: number;
};

export type MarketplaceDirectorAgentViolation = {
  code: MarketplaceDirectorAgentFailureCode;
  module?: MarketplaceDirectorAgentModuleId;
  message: string;
};

export type MarketplaceDirectorAgentRetryBranch = "behavior_overlay_commercial" | "full";

export type MarketplaceDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof MARKETPLACE_DIRECTOR_AGENT_ID;
  violations: MarketplaceDirectorAgentViolation[];
  modulesCompleted: MarketplaceDirectorAgentModuleId[];
  moduleRecords: MarketplaceDirectorAgentModuleRecord[];
  input: MarketplaceDirectorAgentInput;
  blueprint?: MarketplaceDirectorAgentBlueprint;
  confidence: number;
  retryCount: number;
  retryBranch?: MarketplaceDirectorAgentRetryBranch;
  durationMs: number;
  kpis: MarketplaceDirectorAgentKpi;
  pipelineMediated: boolean;
  designStructureExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type MarketplaceDirectorAgentValidationReport = {
  valid: boolean;
  violations: MarketplaceDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type MarketplaceDirectorAgentContext = {
  marketplaceRuleViolation?: boolean;
  overlayOverloaded?: boolean;
  lowCtrPrediction?: boolean;
  poorStoryAdaptation?: boolean;
  lowMarketplaceMatch?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type MarketplaceDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "MARKETPLACE_RULE_VIOLATION"
  | "OVERLAY_OVERLOADED"
  | "LOW_CTR_PREDICTION"
  | "POOR_STORY_ADAPTATION"
  | "LOW_MARKETPLACE_MATCH"
  | "HERO_NOT_DOMINANT"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type MarketplaceDirectorAgentModuleDefinition = {
  id: MarketplaceDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type MarketplaceDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

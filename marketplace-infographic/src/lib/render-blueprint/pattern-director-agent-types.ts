/**
 * Chapter 7.19 — Pattern Director Agent types
 * Intelligent agent specification — design pattern selection layer.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const PATTERN_DIRECTOR_AGENT_ID: AgentContractId = "pattern-director";

/** Ch 7.19 internal agent modules (7) */
export const PatternDirectorAgentModule = {
  PATTERN_SEARCH: "pattern_search",
  PATTERN_RANKING: "pattern_ranking",
  PATTERN_COMPATIBILITY: "pattern_compatibility",
  PATTERN_FUSION: "pattern_fusion",
  UNIQUENESS_CONTROLLER: "uniqueness_controller",
  PATTERN_VALIDATOR: "pattern_validator",
  PATTERN_BLUEPRINT_BUILDER: "pattern_blueprint_builder",
} as const;

export type PatternDirectorAgentModuleId =
  (typeof PatternDirectorAgentModule)[keyof typeof PatternDirectorAgentModule];

/** Selected pattern in Pattern Blueprint */
export type PatternDirectorAgentPattern = {
  id: string;
  name: string;
  category: string;
  score: number;
  layout: string;
};

/** Visual rule derived from pattern library */
export type PatternDirectorAgentRule = {
  id: string;
  rule: string;
};

/** Ch 7.19 PatternDirectorInput — agent contract */
export type PatternDirectorAgentInput = {
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  marketplaceBlueprint: MarketplaceDirectorAgentBlueprint;
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.19 PatternBlueprint — agent output contract */
export type PatternDirectorAgentBlueprint = {
  selectedPatterns: PatternDirectorAgentPattern[];
  visualRules: PatternDirectorAgentRule[];
  recommendedElements: string[];
  avoidElements: string[];
  innovationLevel: number;
  patternConfidence: number;
};

export type PatternDirectorAgentModuleRecord = {
  module: PatternDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type PatternDirectorAgentKpi = {
  patternMatch: number;
  patternSynergy: number;
  innovationScore: number;
  ctrPrediction: number;
  marketplaceFit: number;
  storyAlignment: number;
  retryRate: number;
  confidenceScore: number;
};

export type PatternDirectorAgentViolation = {
  code: PatternDirectorAgentFailureCode;
  module?: PatternDirectorAgentModuleId;
  message: string;
};

export type PatternDirectorAgentRetryBranch = "search_fusion_innovation" | "full";

export type PatternDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof PATTERN_DIRECTOR_AGENT_ID;
  violations: PatternDirectorAgentViolation[];
  modulesCompleted: PatternDirectorAgentModuleId[];
  moduleRecords: PatternDirectorAgentModuleRecord[];
  input: PatternDirectorAgentInput;
  blueprint?: PatternDirectorAgentBlueprint;
  confidence: number;
  retryCount: number;
  retryBranch?: PatternDirectorAgentRetryBranch;
  durationMs: number;
  kpis: PatternDirectorAgentKpi;
  pipelineMediated: boolean;
  imageCopyExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type PatternDirectorAgentValidationReport = {
  valid: boolean;
  violations: PatternDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type PatternDirectorAgentContext = {
  conflictingPatterns?: boolean;
  lowCtrPrediction?: boolean;
  tooSimilarToPrevious?: boolean;
  insufficientInnovation?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type PatternDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "CONFLICTING_PATTERNS"
  | "LOW_CTR_PREDICTION"
  | "TOO_SIMILAR_TO_PREVIOUS"
  | "INSUFFICIENT_INNOVATION"
  | "STORY_PATTERN_MISMATCH"
  | "MARKETPLACE_PATTERN_CONFLICT"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_IMAGE_TEMPLATE"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type PatternDirectorAgentModuleDefinition = {
  id: PatternDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type PatternDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

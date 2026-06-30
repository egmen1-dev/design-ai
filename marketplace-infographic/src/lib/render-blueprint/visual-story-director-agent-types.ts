/**
 * Chapter 7.10 — Visual Story Director Agent types
 * First creative agent specification — distinct from Ch 4.10 and Ch 6.6 pipeline APIs.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { MarketplaceProfile } from "./marketplace-knowledge-types";
import type { GenerationPipelineContext } from "./pipeline-context-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const VISUAL_STORY_DIRECTOR_AGENT_ID: AgentContractId = "visual-story-director";

/** Ch 7.10 internal agent modules (7) */
export const VisualStoryDirectorAgentModule = {
  STORY_PATTERN_SELECTOR: "story_pattern_selector",
  COMMERCIAL_STORY_ENGINE: "commercial_story_engine",
  EMOTION_DESIGNER: "emotion_designer",
  HERO_MOMENT_BUILDER: "hero_moment_builder",
  NARRATIVE_PLANNER: "narrative_planner",
  STORY_VALIDATOR: "story_validator",
  STORY_BLUEPRINT_BUILDER: "story_blueprint_builder",
} as const;

export type VisualStoryDirectorAgentModuleId =
  (typeof VisualStoryDirectorAgentModule)[keyof typeof VisualStoryDirectorAgentModule];

/** Ch 7.10 StoryDirectorInput — agent contract */
export type VisualStoryDirectorAgentInput = {
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  knowledgePackage: StagedKnowledgePackage;
  marketplaceProfile: MarketplaceProfile;
  pipelineContext: GenerationPipelineContext;
};

/** Ch 7.10 StoryBlueprint — agent output contract */
export type VisualStoryDirectorAgentBlueprint = {
  storyPattern: string;
  heroMoment: string;
  primaryMessage: string;
  secondaryMessage: string;
  emotionalDirection: string;
  visualPriority: string[];
  storyFlow: string[];
  commercialGoal: string;
  confidence: number;
};

export type VisualStoryDirectorAgentModuleRecord = {
  module: VisualStoryDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type VisualStoryDirectorAgentKpi = {
  storyQualityScore: number;
  emotionalImpact: number;
  commercialPrediction: number;
  marketplaceMatch: number;
  narrativeClarity: number;
  heroMomentStrength: number;
  retryRate: number;
  confidenceScore: number;
};

export type VisualStoryDirectorAgentViolation = {
  code: VisualStoryDirectorAgentFailureCode;
  module?: VisualStoryDirectorAgentModuleId;
  message: string;
};

export type VisualStoryDirectorAgentRetryBranch =
  | "pattern_emotion_decision"
  | "full";

export type VisualStoryDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof VISUAL_STORY_DIRECTOR_AGENT_ID;
  violations: VisualStoryDirectorAgentViolation[];
  modulesCompleted: VisualStoryDirectorAgentModuleId[];
  moduleRecords: VisualStoryDirectorAgentModuleRecord[];
  input: VisualStoryDirectorAgentInput;
  blueprint?: VisualStoryDirectorAgentBlueprint;
  planningSection?: import("./visual-story-planning-stage-types").VisualStoryPlanningSection;
  confidence: number;
  retryCount: number;
  retryBranch?: VisualStoryDirectorAgentRetryBranch;
  durationMs: number;
  kpis: VisualStoryDirectorAgentKpi;
  pipelineMediated: boolean;
  designExcluded: boolean;
  firstCreativeAgent: boolean;
  goldenRuleSatisfied: boolean;
};

export type VisualStoryDirectorAgentValidationReport = {
  valid: boolean;
  violations: VisualStoryDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type VisualStoryDirectorAgentContext = {
  missingHeroMoment?: boolean;
  missingPrimaryMessage?: boolean;
  lowCommercialScore?: boolean;
  lowConfidence?: boolean;
  tiedStoryScores?: boolean;
  businessStrategyConflict?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type VisualStoryDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "MISSING_COMMERCIAL_IDEA"
  | "MISSING_HERO_MOMENT"
  | "MISSING_PRIMARY_MESSAGE"
  | "EMOTION_PRODUCT_CONFLICT"
  | "BUSINESS_GOAL_MISMATCH"
  | "NARRATIVE_NOT_REALIZABLE"
  | "STORY_INCONSISTENT"
  | "LOW_COMMERCIAL_SCORE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_SCENE_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type VisualStoryDirectorAgentModuleDefinition = {
  id: VisualStoryDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type VisualStoryDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

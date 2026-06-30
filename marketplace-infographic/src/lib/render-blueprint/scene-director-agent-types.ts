/**
 * Chapter 7.11 — Scene Director Agent types
 * Intelligent agent specification — distinct from Ch 4.11 and Ch 6.7 pipeline APIs.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { MarketplaceProfile } from "./marketplace-knowledge-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const SCENE_DIRECTOR_AGENT_ID: AgentContractId = "scene-director";

/** Ch 7.11 internal agent modules (7) */
export const SceneDirectorAgentModule = {
  SCENE_SELECTOR: "scene_selector",
  ENVIRONMENT_BUILDER: "environment_builder",
  BACKGROUND_DESIGNER: "background_designer",
  ATMOSPHERE_ENGINE: "atmosphere_engine",
  PROP_PLANNER: "prop_planner",
  SCENE_VALIDATOR: "scene_validator",
  SCENE_BLUEPRINT_BUILDER: "scene_blueprint_builder",
} as const;

export type SceneDirectorAgentModuleId =
  (typeof SceneDirectorAgentModule)[keyof typeof SceneDirectorAgentModule];

/** Ch 7.11 SceneDirectorInput — agent contract */
export type SceneDirectorAgentInput = {
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  knowledgePackage: StagedKnowledgePackage;
  marketplaceProfile: MarketplaceProfile;
};

/** Ch 7.11 SceneBlueprint — agent output contract */
export type SceneDirectorAgentBlueprint = {
  sceneType: string;
  environment: string;
  backgroundStyle: string;
  surfaceType: string;
  depthLevel: string;
  atmosphere: string;
  supportObjects: string[];
  negativeObjects: string[];
  visualMood: string;
  confidence: number;
};

export type SceneDirectorAgentModuleRecord = {
  module: SceneDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type SceneDirectorAgentKpi = {
  sceneRelevance: number;
  storyAlignment: number;
  environmentQuality: number;
  visualSimplicity: number;
  heroVisibility: number;
  marketplaceMatch: number;
  retryRate: number;
  confidenceScore: number;
};

export type SceneDirectorAgentViolation = {
  code: SceneDirectorAgentFailureCode;
  module?: SceneDirectorAgentModuleId;
  message: string;
};

export type SceneDirectorAgentRetryBranch = "scene_environment_prop" | "full";

export type SceneDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof SCENE_DIRECTOR_AGENT_ID;
  violations: SceneDirectorAgentViolation[];
  modulesCompleted: SceneDirectorAgentModuleId[];
  moduleRecords: SceneDirectorAgentModuleRecord[];
  input: SceneDirectorAgentInput;
  blueprint?: SceneDirectorAgentBlueprint;
  planningSection?: import("./scene-planning-stage-types").ScenePlanningSection;
  confidence: number;
  retryCount: number;
  retryBranch?: SceneDirectorAgentRetryBranch;
  durationMs: number;
  kpis: SceneDirectorAgentKpi;
  pipelineMediated: boolean;
  compositionExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type SceneDirectorAgentValidationReport = {
  valid: boolean;
  violations: SceneDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type SceneDirectorAgentContext = {
  missingLocation?: boolean;
  decorativeOnlyScene?: boolean;
  storyConflict?: boolean;
  forbiddenObjectsPresent?: boolean;
  competingBackground?: boolean;
  lowConfidence?: boolean;
  heroLostOnBackground?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type SceneDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "STORY_CONFLICT"
  | "SCENE_BEAUTY_ONLY"
  | "MISSING_LOCATION"
  | "FORBIDDEN_OBJECTS"
  | "BACKGROUND_COMPETES"
  | "HERO_LOST"
  | "CATEGORY_MISMATCH"
  | "ATMOSPHERE_MISMATCH"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_COMPOSITION_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type SceneDirectorAgentModuleDefinition = {
  id: SceneDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type SceneDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

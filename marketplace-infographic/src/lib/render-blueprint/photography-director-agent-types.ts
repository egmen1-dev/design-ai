/**
 * Chapter 7.13 — Photography Director Agent types
 * Intelligent agent specification — distinct from Ch 4.13 and Ch 6.9 pipeline APIs.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

/** Uses existing commercial-photo-director contract (Ch 4.13 Photography Director) */
export const PHOTOGRAPHY_DIRECTOR_AGENT_ID: AgentContractId = "commercial-photo-director";

/** Ch 7.13 internal agent modules (7) */
export const PhotographyDirectorAgentModule = {
  PHOTOGRAPHY_STYLE_SELECTOR: "photography_style_selector",
  COMMERCIAL_SHOOTING_ENGINE: "commercial_shooting_engine",
  PERSPECTIVE_PLANNER: "perspective_planner",
  DEPTH_OF_FIELD_PLANNER: "depth_of_field_planner",
  REALISM_CONTROLLER: "realism_controller",
  PHOTOGRAPHY_VALIDATOR: "photography_validator",
  PHOTOGRAPHY_BLUEPRINT_BUILDER: "photography_blueprint_builder",
} as const;

export type PhotographyDirectorAgentModuleId =
  (typeof PhotographyDirectorAgentModule)[keyof typeof PhotographyDirectorAgentModule];

/** Ch 7.13 PhotographyDirectorInput — agent contract */
export type PhotographyDirectorAgentInput = {
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.13 PhotographyBlueprint — agent output contract */
export type PhotographyDirectorAgentBlueprint = {
  photoStyle: string;
  shootingType: string;
  framing: string;
  perspective: string;
  depthOfField: string;
  realismLevel: string;
  commercialMood: string;
  lensProfile: string;
  confidence: number;
};

export type PhotographyDirectorAgentModuleRecord = {
  module: PhotographyDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type PhotographyDirectorAgentKpi = {
  realismScore: number;
  commercialPhotographyScore: number;
  productTrustScore: number;
  perspectiveQuality: number;
  marketplaceFit: number;
  heroVisibility: number;
  retryRate: number;
  confidenceScore: number;
};

export type PhotographyDirectorAgentViolation = {
  code: PhotographyDirectorAgentFailureCode;
  module?: PhotographyDirectorAgentModuleId;
  message: string;
};

export type PhotographyDirectorAgentRetryBranch = "style_perspective_realism" | "full";

export type PhotographyDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof PHOTOGRAPHY_DIRECTOR_AGENT_ID;
  violations: PhotographyDirectorAgentViolation[];
  modulesCompleted: PhotographyDirectorAgentModuleId[];
  moduleRecords: PhotographyDirectorAgentModuleRecord[];
  input: PhotographyDirectorAgentInput;
  blueprint?: PhotographyDirectorAgentBlueprint;
  planningSection?: import("./photography-planning-stage-types").PhotographyPlanningSection;
  confidence: number;
  retryCount: number;
  retryBranch?: PhotographyDirectorAgentRetryBranch;
  durationMs: number;
  kpis: PhotographyDirectorAgentKpi;
  pipelineMediated: boolean;
  lightingExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type PhotographyDirectorAgentValidationReport = {
  valid: boolean;
  violations: PhotographyDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type PhotographyDirectorAgentContext = {
  randomCameraParams?: boolean;
  perspectiveCompositionConflict?: boolean;
  artificialPhotography?: boolean;
  missingLightingStrategy?: boolean;
  heroLosesAdvantage?: boolean;
  lowConfidence?: boolean;
  catalogShootingType?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type PhotographyDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "RANDOM_CAMERA_PARAMS"
  | "PERSPECTIVE_COMPOSITION_CONFLICT"
  | "ARTIFICIAL_PHOTOGRAPHY"
  | "MISSING_LIGHTING_STRATEGY"
  | "HERO_LOSES_ADVANTAGE"
  | "CATALOG_SHOOTING_MISMATCH"
  | "STORY_STYLE_MISMATCH"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "LOW_REALISM"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_COMPOSITION_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type PhotographyDirectorAgentModuleDefinition = {
  id: PhotographyDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type PhotographyDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

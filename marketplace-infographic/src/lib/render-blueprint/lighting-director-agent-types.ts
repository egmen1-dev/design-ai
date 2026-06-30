/**
 * Chapter 7.14 — Lighting Director Agent types
 * Intelligent agent specification — distinct from Ch 4.14 pipeline APIs.
 */
import type { AgentContractId } from "./agent-contracts";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const LIGHTING_DIRECTOR_AGENT_ID: AgentContractId = "lighting-director";

/** Ch 7.14 internal agent modules (7) */
export const LightingDirectorAgentModule = {
  LIGHTING_STRATEGY_SELECTOR: "lighting_strategy_selector",
  KEY_LIGHT_PLANNER: "key_light_planner",
  SHADOW_ENGINE: "shadow_engine",
  REFLECTION_CONTROLLER: "reflection_controller",
  COLOR_TEMPERATURE_ENGINE: "color_temperature_engine",
  LIGHTING_VALIDATOR: "lighting_validator",
  LIGHTING_BLUEPRINT_BUILDER: "lighting_blueprint_builder",
} as const;

export type LightingDirectorAgentModuleId =
  (typeof LightingDirectorAgentModule)[keyof typeof LightingDirectorAgentModule];

/** Ch 7.14 LightingDirectorInput — agent contract */
export type LightingDirectorAgentInput = {
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  photographyBlueprint: PhotographyDirectorAgentBlueprint;
  productProfile: AnalyzedProductProfile;
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.14 LightingBlueprint — agent output contract */
export type LightingDirectorAgentBlueprint = {
  lightingPreset: string;
  keyLight: string;
  fillLight: string;
  rimLight: string;
  backLight: string;
  shadowStyle: string;
  reflectionStyle: string;
  colorTemperature: number;
  contrastLevel: string;
  lightingMood: string;
  confidence: number;
};

export type LightingDirectorAgentModuleRecord = {
  module: LightingDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type LightingDirectorAgentKpi = {
  lightingRealism: number;
  productVisibility: number;
  shadowQuality: number;
  reflectionQuality: number;
  materialEnhancement: number;
  commercialTrust: number;
  retryRate: number;
  confidenceScore: number;
};

export type LightingDirectorAgentViolation = {
  code: LightingDirectorAgentFailureCode;
  module?: LightingDirectorAgentModuleId;
  message: string;
};

export type LightingDirectorAgentRetryBranch = "strategy_shadow_reflection" | "full";

export type LightingDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof LIGHTING_DIRECTOR_AGENT_ID;
  violations: LightingDirectorAgentViolation[];
  modulesCompleted: LightingDirectorAgentModuleId[];
  moduleRecords: LightingDirectorAgentModuleRecord[];
  input: LightingDirectorAgentInput;
  blueprint?: LightingDirectorAgentBlueprint;
  lightingSection?: import("./lighting-director-types").LightingSection;
  confidence: number;
  retryCount: number;
  retryBranch?: LightingDirectorAgentRetryBranch;
  durationMs: number;
  kpis: LightingDirectorAgentKpi;
  pipelineMediated: boolean;
  cameraExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type LightingDirectorAgentValidationReport = {
  valid: boolean;
  violations: LightingDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type LightingDirectorAgentContext = {
  artificialLighting?: boolean;
  missingContactShadow?: boolean;
  flatProduct?: boolean;
  storyConflict?: boolean;
  heroLostOnBackground?: boolean;
  lowConfidence?: boolean;
  reflectionQualityLow?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type LightingDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "MISSING_LIGHT_SOURCE"
  | "SHADOW_DIRECTION_CONFLICT"
  | "ARTIFICIAL_LIGHTING"
  | "PRODUCT_COMPOSITE_INCOMPATIBLE"
  | "FLAT_PRODUCT"
  | "STORY_LIGHTING_MISMATCH"
  | "HERO_LOST"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "LOW_REFLECTION_QUALITY"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_COMPOSITION_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type LightingDirectorAgentModuleDefinition = {
  id: LightingDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type LightingDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

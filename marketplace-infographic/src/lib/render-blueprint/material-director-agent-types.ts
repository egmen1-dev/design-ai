/**
 * Chapter 7.16 — Material Director Agent types
 * Intelligent agent specification — distinct from Ch 4.16 pipeline APIs.
 */
import type { AgentContractId } from "./agent-contracts";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const MATERIAL_DIRECTOR_AGENT_ID: AgentContractId = "material-director";

/** Ch 7.16 internal agent modules (7) */
export const MaterialDirectorAgentModule = {
  MATERIAL_DETECTOR: "material_detector",
  SURFACE_ANALYZER: "surface_analyzer",
  REFLECTION_PLANNER: "reflection_planner",
  TEXTURE_CONTROLLER: "texture_controller",
  WEAR_SIMULATOR: "wear_simulator",
  MATERIAL_VALIDATOR: "material_validator",
  MATERIAL_BLUEPRINT_BUILDER: "material_blueprint_builder",
} as const;

export type MaterialDirectorAgentModuleId =
  (typeof MaterialDirectorAgentModule)[keyof typeof MaterialDirectorAgentModule];

/** Product surface material definition */
export type MaterialDirectorAgentMaterialDefinition = {
  id: string;
  name: string;
  role: string;
  reflection: string;
  roughness: string;
  microTexture: string;
};

/** Ch 7.16 MaterialDirectorInput — agent contract */
export type MaterialDirectorAgentInput = {
  productProfile: AnalyzedProductProfile;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  photographyBlueprint: PhotographyDirectorAgentBlueprint;
  lightingBlueprint: LightingDirectorAgentBlueprint;
  cameraBlueprint: CameraDirectorAgentBlueprint;
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.16 MaterialBlueprint — agent output contract */
export type MaterialDirectorAgentBlueprint = {
  materials: MaterialDirectorAgentMaterialDefinition[];
  surfaceQuality: string;
  roughnessProfile: string;
  reflectionProfile: string;
  microTexture: string;
  cleanlinessLevel: string;
  wearLevel: string;
  realismScore: number;
  confidence: number;
};

export type MaterialDirectorAgentModuleRecord = {
  module: MaterialDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type MaterialDirectorAgentKpi = {
  materialRealism: number;
  reflectionAccuracy: number;
  textureQuality: number;
  surfaceConsistency: number;
  productTrust: number;
  marketplaceFit: number;
  retryRate: number;
  confidenceScore: number;
};

export type MaterialDirectorAgentViolation = {
  code: MaterialDirectorAgentFailureCode;
  module?: MaterialDirectorAgentModuleId;
  message: string;
};

export type MaterialDirectorAgentRetryBranch = "detector_reflection_texture" | "full";

export type MaterialDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof MATERIAL_DIRECTOR_AGENT_ID;
  violations: MaterialDirectorAgentViolation[];
  modulesCompleted: MaterialDirectorAgentModuleId[];
  moduleRecords: MaterialDirectorAgentModuleRecord[];
  input: MaterialDirectorAgentInput;
  blueprint?: MaterialDirectorAgentBlueprint;
  materialSection?: import("./material-director-types").MaterialSection;
  confidence: number;
  retryCount: number;
  retryBranch?: MaterialDirectorAgentRetryBranch;
  durationMs: number;
  kpis: MaterialDirectorAgentKpi;
  pipelineMediated: boolean;
  lightingExcluded: boolean;
  cameraExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type MaterialDirectorAgentValidationReport = {
  valid: boolean;
  violations: MaterialDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type MaterialDirectorAgentContext = {
  artificialMaterials?: boolean;
  lightingReflectionConflict?: boolean;
  plasticLooksMetallic?: boolean;
  metalLooksPlastic?: boolean;
  lowRealismScore?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type MaterialDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "ARTIFICIAL_MATERIALS"
  | "LIGHTING_REFLECTION_CONFLICT"
  | "PLASTIC_LOOKS_METALLIC"
  | "METAL_LOOKS_PLASTIC"
  | "LOW_REALISM_SCORE"
  | "STORY_CONFLICT"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_LIGHTING_DECISION"
  | "CONTAINS_CAMERA_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type MaterialDirectorAgentModuleDefinition = {
  id: MaterialDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type MaterialDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

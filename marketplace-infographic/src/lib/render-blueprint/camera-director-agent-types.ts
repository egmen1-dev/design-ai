/**
 * Chapter 7.15 — Camera Director Agent types
 * Intelligent agent specification — distinct from Ch 4.15 pipeline APIs.
 */
import type { AgentContractId } from "./agent-contracts";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const CAMERA_DIRECTOR_AGENT_ID: AgentContractId = "camera-director";

/** Ch 7.15 internal agent modules (7) */
export const CameraDirectorAgentModule = {
  CAMERA_STRATEGY_SELECTOR: "camera_strategy_selector",
  ANGLE_PLANNER: "angle_planner",
  LENS_SELECTOR: "lens_selector",
  PERSPECTIVE_CONTROLLER: "perspective_controller",
  FRAMING_OPTIMIZER: "framing_optimizer",
  CAMERA_VALIDATOR: "camera_validator",
  CAMERA_BLUEPRINT_BUILDER: "camera_blueprint_builder",
} as const;

export type CameraDirectorAgentModuleId =
  (typeof CameraDirectorAgentModule)[keyof typeof CameraDirectorAgentModule];

/** Normalized 3D vector for camera blueprint */
export type CameraDirectorAgentVector3 = {
  x: number;
  y: number;
  z: number;
};

/** Ch 7.15 CameraDirectorInput — agent contract */
export type CameraDirectorAgentInput = {
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  photographyBlueprint: PhotographyDirectorAgentBlueprint;
  lightingBlueprint: LightingDirectorAgentBlueprint;
  productProfile: AnalyzedProductProfile;
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.15 CameraBlueprint — agent output contract */
export type CameraDirectorAgentBlueprint = {
  cameraType: string;
  cameraPosition: CameraDirectorAgentVector3;
  cameraAngle: number;
  cameraHeight: number;
  lensFocalLength: number;
  fieldOfView: number;
  focusPoint: CameraDirectorAgentVector3;
  framing: string;
  perspectiveType: string;
  confidence: number;
};

export type CameraDirectorAgentModuleRecord = {
  module: CameraDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type CameraDirectorAgentKpi = {
  perspectiveAccuracy: number;
  productReadability: number;
  lensSuitability: number;
  commercialTrust: number;
  marketplaceFit: number;
  heroVisibility: number;
  retryRate: number;
  confidenceScore: number;
};

export type CameraDirectorAgentViolation = {
  code: CameraDirectorAgentFailureCode;
  module?: CameraDirectorAgentModuleId;
  message: string;
};

export type CameraDirectorAgentRetryBranch = "strategy_lens_perspective" | "full";

export type CameraDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof CAMERA_DIRECTOR_AGENT_ID;
  violations: CameraDirectorAgentViolation[];
  modulesCompleted: CameraDirectorAgentModuleId[];
  moduleRecords: CameraDirectorAgentModuleRecord[];
  input: CameraDirectorAgentInput;
  blueprint?: CameraDirectorAgentBlueprint;
  cameraSection?: import("./camera-director-types").CameraSection;
  confidence: number;
  retryCount: number;
  retryBranch?: CameraDirectorAgentRetryBranch;
  durationMs: number;
  kpis: CameraDirectorAgentKpi;
  pipelineMediated: boolean;
  materialExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type CameraDirectorAgentValidationReport = {
  valid: boolean;
  violations: CameraDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type CameraDirectorAgentContext = {
  topDownAngle?: boolean;
  perspectiveDistortion?: boolean;
  heroTooSmall?: boolean;
  awkwardLens?: boolean;
  storyConflict?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type CameraDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "PERSPECTIVE_DISTORTION"
  | "HERO_TOO_SMALL"
  | "STORY_CONFLICT"
  | "AWKWARD_ANGLE"
  | "TOP_VIEW_MISMATCH"
  | "LENS_MISMATCH"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_LIGHTING_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type CameraDirectorAgentModuleDefinition = {
  id: CameraDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type CameraDirectorAgentPipelineLink = {
  from: string;
  to: string;
};

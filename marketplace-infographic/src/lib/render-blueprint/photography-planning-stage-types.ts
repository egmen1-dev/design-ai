/**
 * Chapter 6.9 — Photography Planning Stage types
 * Distinct from Ch 4.13 PhotographySection and types.ts PhotographyBlueprint.
 */
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { PhotographySection } from "./commercial-photo-director-types";
import type { PhotographyBlueprint } from "./types";
import type { PlannedCompositionBlueprint } from "./composition-planning-stage-types";
import type { PlannedSceneBlueprint } from "./scene-planning-stage-types";
import type { PlannedStoryBlueprint } from "./visual-story-planning-stage-types";

export const PhotographyPlanningStage = {
  INPUT_ASSEMBLY: "input_assembly",
  PHOTOGRAPHY_OBJECTIVE: "photography_objective",
  CAMERA_SELECTION: "camera_selection",
  LENS_SELECTION: "lens_selection",
  CAMERA_ANGLE: "camera_angle",
  CAMERA_DISTANCE: "camera_distance",
  DEPTH_OF_FIELD: "depth_of_field",
  LIGHTING_STRATEGY: "lighting_strategy",
  EXPOSURE_PLANNING: "exposure_planning",
  REFLECTION_STRATEGY: "reflection_strategy",
  PHOTOGRAPHY_STYLE: "photography_style",
  BLUEPRINT_ASSEMBLY: "blueprint_assembly",
  PHYSICAL_REALISM: "physical_realism",
  VALIDATION: "validation",
  AGENT_HANDOFF: "agent_handoff",
} as const;

export type PhotographyPlanningStageId =
  (typeof PhotographyPlanningStage)[keyof typeof PhotographyPlanningStage];

export const CameraPreset = {
  STUDIO_PRODUCT: "studio_product_camera",
  COMMERCIAL_LIFESTYLE: "commercial_lifestyle_camera",
  TECHNICAL_DOCUMENTATION: "technical_documentation_camera",
} as const;

export type CameraPresetId = (typeof CameraPreset)[keyof typeof CameraPreset];

export const LensPreset = {
  LENS_35MM: "35mm",
  LENS_50MM: "50mm",
  LENS_85MM: "85mm",
  LENS_100MM_MACRO: "100mm_macro",
} as const;

export type LensPresetId = (typeof LensPreset)[keyof typeof LensPreset];

export const LightingPreset = {
  STUDIO_SOFTBOX: "studio_softbox",
  WINDOW_LIGHT: "window_light",
  GOLDEN_HOUR: "golden_hour",
  THREE_POINT: "three_point_lighting",
  PRODUCT_RIM_LIGHT: "product_rim_light",
  SOFT_DIFFUSED: "soft_diffused_lighting",
} as const;

export type LightingPresetId = (typeof LightingPreset)[keyof typeof LightingPreset];

export const ExposurePreset = {
  HIGH_KEY: "high_key",
  BALANCED: "balanced",
  LOW_KEY: "low_key",
} as const;

export type ExposurePresetId = (typeof ExposurePreset)[keyof typeof ExposurePreset];

export const PlannedPhotographyStyle = {
  STUDIO_COMMERCIAL: "studio_commercial",
  PREMIUM_LIFESTYLE: "premium_lifestyle",
  EDITORIAL_PRODUCT: "editorial_product",
  TECHNICAL_CATALOG: "technical_catalog",
  MINIMAL_PRODUCT: "minimal_product_photography",
  MODERN_MARKETPLACE: "modern_marketplace",
} as const;

export type PlannedPhotographyStyleId =
  (typeof PlannedPhotographyStyle)[keyof typeof PlannedPhotographyStyle];

export const PhotographyObjective = {
  SHOW_PRODUCT_QUALITY: "show_product_quality",
  SUPPORT_STORY: "support_story",
  BUILD_TRUST: "build_trust",
} as const;

export type PhotographyObjectiveId = (typeof PhotographyObjective)[keyof typeof PhotographyObjective];

/** Ch 6.9 Photography Blueprint — spec PhotographyBlueprint */
export type PlannedPhotographyBlueprint = {
  cameraPreset: string;
  lens: string;
  cameraAngle: string;
  cameraHeight: string;
  depthOfField: string;
  lightingPreset: string;
  exposure: string;
  whiteBalance: string;
  shadowStyle: string;
  reflectionStyle: string;
};

export type PhotographyPlanningInput = {
  profile: AnalyzedProductProfile;
  story: PlannedStoryBlueprint;
  scene: PlannedSceneBlueprint;
  composition: PlannedCompositionBlueprint;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
  brand?: string;
};

export type PhotographyPlanningSection = {
  plannedBlueprint: PlannedPhotographyBlueprint;
  photographyStyle: PlannedPhotographyStyleId;
  cameraPreset: CameraPresetId;
  objectives: PhotographyObjectiveId[];
  directorSection: PhotographySection;
  renderPhotography: PhotographyBlueprint;
  stagesCompleted: PhotographyPlanningStageId[];
  confidence: number;
};

export type PhotographyPlanningViolation = {
  code: PhotographyPlanningFailureCode;
  message: string;
  stage?: PhotographyPlanningStageId;
};

export type PhotographyPlanningReport = {
  valid: boolean;
  violations: PhotographyPlanningViolation[];
  section?: PhotographyPlanningSection;
  stagesCompleted: PhotographyPlanningStageId[];
  durationMs: number;
};

export type PhotographyPlanningContext = {
  randomCameraParams?: boolean;
  perspectiveCompositionConflict?: boolean;
  artificialPhotography?: boolean;
  missingLightingStrategy?: boolean;
  heroLosesAdvantage?: boolean;
};

export type PhotographyPlanningSystemReport = {
  valid: boolean;
  violations: PhotographyPlanningViolation[];
  goldenRuleSatisfied: boolean;
  storySupported: boolean;
  physicallyPlausible: boolean;
  lightingStrategyDefined: boolean;
  heroAdvantageMaintained: boolean;
  downstreamReady: boolean;
};

export type PhotographyPlanningFailureCode =
  | "MISSING_PROFILE"
  | "MISSING_STORY"
  | "MISSING_SCENE"
  | "MISSING_COMPOSITION"
  | "RANDOM_CAMERA_PARAMS"
  | "PERSPECTIVE_COMPOSITION_CONFLICT"
  | "ARTIFICIAL_PHOTOGRAPHY"
  | "MISSING_LIGHTING_STRATEGY"
  | "HERO_LOSES_ADVANTAGE"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECTOR_VALIDATION_FAILED";

/**
 * Chapter 6.7 — Scene Planning Stage types
 * Distinct from Ch 4.11 SceneSection and types.ts SceneBlueprint.
 */
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { SceneSection } from "./scene-director-types";
import type { SceneBlueprint } from "./types";
import type { PlannedStoryBlueprint } from "./visual-story-planning-stage-types";

export const ScenePlanningStage = {
  INPUT_ASSEMBLY: "input_assembly",
  SCENE_OBJECTIVE: "scene_objective",
  CATEGORY_SELECTION: "category_selection",
  ENVIRONMENT_SELECTION: "environment_selection",
  LOCATION_DEFINITION: "location_definition",
  REALISM_LEVEL: "realism_level",
  SUPPORTING_OBJECTS: "supporting_objects",
  TIME_OF_DAY: "time_of_day",
  WEATHER_CONDITIONS: "weather_conditions",
  BACKGROUND_STRATEGY: "background_strategy",
  NEGATIVE_RULES: "negative_rules",
  BLUEPRINT_ASSEMBLY: "blueprint_assembly",
  CONSISTENCY_CHECK: "consistency_check",
  VALIDATION: "validation",
  AGENT_HANDOFF: "agent_handoff",
} as const;

export type ScenePlanningStageId = (typeof ScenePlanningStage)[keyof typeof ScenePlanningStage];

export const SceneCategory = {
  STUDIO: "studio",
  LIFESTYLE: "lifestyle",
  PROFESSIONAL_WORKSPACE: "professional_workspace",
  OUTDOOR: "outdoor",
  HOME_INTERIOR: "home_interior",
  INDUSTRIAL: "industrial",
  TECHNICAL: "technical",
} as const;

export type SceneCategoryId = (typeof SceneCategory)[keyof typeof SceneCategory];

export const SceneObjective = {
  SHOW_USAGE: "show_usage",
  EMPHASIZE_QUALITY: "emphasize_quality",
  EMOTIONAL_PERCEPTION: "emotional_perception",
  EXPLAIN_BENEFITS: "explain_benefits",
  BUILD_TRUST: "build_trust",
} as const;

export type SceneObjectiveId = (typeof SceneObjective)[keyof typeof SceneObjective];

export const BackgroundStyle = {
  MINIMAL: "minimal",
  BLURRED: "blurred",
  DETAILED: "detailed",
  NEUTRAL: "neutral",
  ATMOSPHERIC: "atmospheric",
} as const;

export type BackgroundStyleId = (typeof BackgroundStyle)[keyof typeof BackgroundStyle];

/** Ch 6.7 Scene Blueprint — spec SceneBlueprint */
export type PlannedSceneBlueprint = {
  sceneType: string;
  environment: string;
  location: string;
  timeOfDay: string;
  weather: string;
  backgroundStyle: string;
  supportObjects: string[];
  realismLevel: string;
  negativeObjects: string[];
};

export type ScenePlanningInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  story: PlannedStoryBlueprint;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
  brand?: string;
};

export type ScenePlanningSection = {
  plannedBlueprint: PlannedSceneBlueprint;
  sceneObjective: SceneObjectiveId;
  sceneCategory: SceneCategoryId;
  directorSection: SceneSection;
  renderScene: SceneBlueprint;
  stagesCompleted: ScenePlanningStageId[];
  confidence: number;
};

export type ScenePlanningViolation = {
  code: ScenePlanningFailureCode;
  message: string;
  stage?: ScenePlanningStageId;
};

export type ScenePlanningReport = {
  valid: boolean;
  violations: ScenePlanningViolation[];
  section?: ScenePlanningSection;
  stagesCompleted: ScenePlanningStageId[];
  durationMs: number;
};

export type ScenePlanningContext = {
  missingLocation?: boolean;
  decorativeOnlyScene?: boolean;
  storyConflict?: boolean;
  forbiddenObjectsPresent?: boolean;
  competingBackground?: boolean;
};

export type ScenePlanningSystemReport = {
  valid: boolean;
  violations: ScenePlanningViolation[];
  goldenRuleSatisfied: boolean;
  storyAligned: boolean;
  productContextClear: boolean;
  realismMaintained: boolean;
  heroSpaceReserved: boolean;
  downstreamReady: boolean;
};

export type ScenePlanningFailureCode =
  | "MISSING_PROFILE"
  | "MISSING_STORY"
  | "MISSING_BUSINESS_MODEL"
  | "SCENE_BEAUTY_ONLY"
  | "STORY_CONFLICT"
  | "CATEGORY_MISMATCH"
  | "FORBIDDEN_OBJECTS"
  | "MISSING_LOCATION"
  | "BACKGROUND_COMPETES"
  | "MISSING_REALISM"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECTOR_VALIDATION_FAILED";

/**
 * Chapter 4.11 — Scene Director types
 */
import type { SceneBlueprint } from "./types";

export const SceneType = {
  LIFESTYLE: "lifestyle",
  COMMERCIAL_STUDIO: "commercial_studio",
  PREMIUM_SHOWCASE: "premium_showcase",
  EDITORIAL: "editorial",
  MINIMAL: "minimal",
  ARCHITECTURAL: "architectural",
  TECHNOLOGY: "technology",
  MEDICAL: "medical",
  INDUSTRIAL: "industrial",
  LUXURY: "luxury",
  MACRO: "macro",
  NATURAL: "natural",
  FLOATING_COMPOSITION: "floating_composition",
} as const;

export type SceneTypeId = (typeof SceneType)[keyof typeof SceneType];

export const EnvironmentType = {
  PREMIUM_STUDIO: "premium_studio",
  MINIMAL_STUDIO: "minimal_studio",
  LUXURY_INTERIOR: "luxury_interior",
  MODERN_KITCHEN: "modern_kitchen",
  LIVING_ROOM: "living_room",
  BATHROOM: "bathroom",
  OFFICE: "office",
  WORKSHOP: "workshop",
  NATURE: "nature",
  OUTDOOR: "outdoor",
  GYM: "gym",
  CHILDREN_ROOM: "children_room",
  TECHNOLOGY_LAB: "technology_lab",
} as const;

export type EnvironmentTypeId = (typeof EnvironmentType)[keyof typeof EnvironmentType];

export const DepthProfile = {
  OPEN_SPACE: "open_space",
  COMPACT_SPACE: "compact_space",
  INTIMATE_SPACE: "intimate_space",
  WIDE_PERSPECTIVE: "wide_perspective",
  DEEP_PERSPECTIVE: "deep_perspective",
  INFINITE_BACKGROUND: "infinite_background",
  INTERIOR_VOLUME: "interior_volume",
} as const;

export type DepthProfileId = (typeof DepthProfile)[keyof typeof DepthProfile];

export type SceneTypeDefinition = {
  id: SceneTypeId;
  name: string;
  summary: string;
};

export type EnvironmentDefinition = {
  id: EnvironmentTypeId;
  name: string;
  summary: string;
};

/** Chapter 4.11 — enriched scene section (world model, not composition/prompt) */
export type SceneSection = {
  sceneType: SceneTypeId;
  environment: EnvironmentTypeId;
  backgroundNarrative: string;
  lightingMood: string;
  materialPalette: string[];
  depthProfile: DepthProfileId;
  cameraEnvironment: string;
  realismProfile: string;
  providerHints: string[];
  sceneBlueprint: SceneBlueprint;
  /** Normalized 0.0..1.0 */
  confidence: number;
};

export type SceneDirectorContext = {
  productCategory: string;
  subCategory?: string;
  creativeGoal: string;
  marketplace: string;
  priceSegment: string;
  audience: string;
  storyType?: string;
  primaryEmotion?: string;
  commercialGoal?: string;
  storyNarrative?: string;
  storyHook?: string;
  providerId?: string;
};

export type SceneExplainabilityReport = {
  agentId: "scene-director";
  selectedSceneType: SceneTypeId;
  selectedEnvironment: EnvironmentTypeId;
  alternativesConsidered: EnvironmentTypeId[];
  rejectedAlternatives: { id: EnvironmentTypeId; reason: string }[];
  storyInfluences: string[];
  sectionsUsed: string[];
  commercialValue: string;
  reasoning: string[];
};

export type SceneValidationReport = {
  valid: boolean;
  violations: string[];
  section?: SceneSection;
};

export type SceneFailureCode =
  | "STORY_CONFLICT"
  | "MISSING_BACKGROUND_NARRATIVE"
  | "OVERLOADED_SCENE"
  | "NOT_PHYSICALLY_PLAUSIBLE"
  | "CONTAINS_COMPOSITION_DECISION"
  | "CONTAINS_PROMPT"
  | "AI_BACKGROUND_RANDOM"
  | "PROVIDER_INCOMPATIBLE";

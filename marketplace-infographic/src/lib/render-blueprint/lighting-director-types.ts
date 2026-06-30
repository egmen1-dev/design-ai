/**
 * Chapter 4.14 — Lighting Director types
 */
import type { LightingBlueprint } from "./types";

export const LightingStyle = {
  COMMERCIAL_CLEAN: "commercial_clean",
  STUDIO_CONTROLLED: "studio_controlled",
  NATURAL_WINDOW: "natural_window",
  LUXURY_WARM: "luxury_warm",
  TECHNOLOGY_COOL: "technology_cool",
  EDITORIAL_SOFT: "editorial_soft",
  MARKETPLACE_HIGH_KEY: "marketplace_high_key",
} as const;

export type LightingStyleId = (typeof LightingStyle)[keyof typeof LightingStyle];

export const LightingScheme = {
  SINGLE_SOFT_LIGHT: "single_soft_light",
  TWO_POINT_STUDIO: "two_point_studio",
  THREE_POINT_STUDIO: "three_point_studio",
  NATURAL_WINDOW_LIGHT: "natural_window_light",
  TOP_SOFTBOX: "top_softbox",
  LUXURY_SIDE_LIGHT: "luxury_side_light",
  EDITORIAL_SOFT_LIGHT: "editorial_soft_light",
  HIGH_KEY: "high_key",
  LOW_KEY: "low_key",
  DIFFUSED_AMBIENT: "diffused_ambient",
} as const;

export type LightingSchemeId = (typeof LightingScheme)[keyof typeof LightingScheme];

export const ColorTemperature = {
  WARM_DAYLIGHT: "warm_daylight",
  NEUTRAL_STUDIO: "neutral_studio",
  COOL_TECHNOLOGY: "cool_technology",
  MORNING_SUN: "morning_sun",
  EVENING_WARM: "evening_warm",
  OVERCAST_SOFT: "overcast_soft",
} as const;

export type ColorTemperatureId = (typeof ColorTemperature)[keyof typeof ColorTemperature];

export type LightProfile = {
  direction: string;
  height: string;
  angle: string;
  intensity: number;
  sourceSize: string;
};

export type AmbientProfile = {
  level: number;
  quality: string;
};

export type ShadowProfile = {
  softness: number;
  length: string;
  density: string;
  direction: string;
  contactShadow: boolean;
};

export type ContrastProfile = {
  level: "low" | "medium" | "high";
  ratio: number;
};

export type LightingSchemeDefinition = {
  id: LightingSchemeId;
  name: string;
  summary: string;
};

/** Chapter 4.14 — lighting section (physics model, not prompt/render) */
export type LightingSection = {
  lightingStyle: LightingStyleId;
  lightingScheme: LightingSchemeId;
  keyLight: LightProfile;
  fillLight: LightProfile;
  rimLight?: LightProfile;
  ambientLight: AmbientProfile;
  shadowProfile: ShadowProfile;
  contrastProfile: ContrastProfile;
  colorTemperature: number;
  lightingMood: string;
  providerHints: string[];
  lightingBlueprint: LightingBlueprint;
  /** Normalized 0.0..1.0 */
  confidence: number;
};

export type LightingDirectorContext = {
  productCategory: string;
  marketplace: string;
  productCutout: boolean;
  storyType?: string;
  primaryEmotion?: string;
  sceneType?: string;
  sceneLightingMood?: string;
  photographyStyle?: string;
  photoMood?: string;
  lightingIntent?: string;
  materialPalette?: string[];
  providerId?: string;
};

export type LightingExplainabilityReport = {
  agentId: "lighting-director";
  selectedScheme: LightingSchemeId;
  alternativesConsidered: LightingSchemeId[];
  rejectedAlternatives: { id: LightingSchemeId; reason: string }[];
  storyInfluences: string[];
  photographyInfluences: string[];
  productFidelityNotes: string[];
  commercialValue: string;
  reasoning: string[];
};

export type LightingValidationReport = {
  valid: boolean;
  violations: string[];
  section?: LightingSection;
};

export type LightingFailureCode =
  | "MISSING_LIGHT_SOURCE"
  | "SHADOW_DIRECTION_CONFLICT"
  | "PRODUCT_COMPOSITE_INCOMPATIBLE"
  | "ARTIFICIAL_LIGHTING"
  | "TOO_MANY_EFFECTS"
  | "MISSING_PHOTOGRAPHY_INPUT"
  | "CONTAINS_COMPOSITION_DECISION"
  | "CONTAINS_PROMPT";

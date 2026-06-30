/**
 * Chapter 4.13 — Commercial Photo Director types
 */
import type { PhotographyBlueprint } from "./types";

export const PhotographyStyle = {
  COMMERCIAL_PRODUCT: "commercial_product",
  LUXURY_ADVERTISING: "luxury_advertising",
  EDITORIAL: "editorial",
  LIFESTYLE_COMMERCIAL: "lifestyle_commercial",
  STUDIO_PREMIUM: "studio_premium",
  MINIMAL_SHOWCASE: "minimal_showcase",
  MODERN_MARKETPLACE: "modern_marketplace",
  TECHNOLOGY_PRODUCT: "technology_product",
  MEDICAL_PRODUCT: "medical_product",
  COSMETIC_BEAUTY: "cosmetic_beauty",
  MACRO_DETAIL: "macro_detail",
} as const;

export type PhotographyStyleId = (typeof PhotographyStyle)[keyof typeof PhotographyStyle];

export const PhotoMood = {
  CLEAN_DAYLIGHT: "clean_daylight",
  WARM_MORNING: "warm_morning",
  SOFT_STUDIO: "soft_studio",
  CRISP_NEUTRAL: "crisp_neutral",
  CALM_DOMESTIC: "calm_domestic",
  BRIGHT_CLINICAL: "bright_clinical",
} as const;

export type PhotoMoodId = (typeof PhotoMood)[keyof typeof PhotoMood];

export const PhotoDepthProfile = {
  SHALLOW: "shallow",
  MEDIUM: "medium",
  DEEP: "deep",
  INFINITE: "infinite",
} as const;

export type PhotoDepthProfileId = (typeof PhotoDepthProfile)[keyof typeof PhotoDepthProfile];

export const FocusStrategy = {
  ENTIRE_PRODUCT_SHARP: "entire_product_sharp",
  FRONT_FOCUS: "front_focus",
  CENTER_FOCUS: "center_focus",
  HERO_DETAIL: "hero_detail",
  UNIFORM_FOCUS: "uniform_focus",
} as const;

export type FocusStrategyId = (typeof FocusStrategy)[keyof typeof FocusStrategy];

export const ProductInteraction = {
  ON_SURFACE: "on_surface",
  INTEGRATED_INTERIOR: "integrated_interior",
  HUMAN_USE: "human_use",
  ISOLATED_HERO: "isolated_hero",
} as const;

export type ProductInteractionId = (typeof ProductInteraction)[keyof typeof ProductInteraction];

export type PhotographyStyleDefinition = {
  id: PhotographyStyleId;
  name: string;
  summary: string;
};

/** Chapter 4.13 — photography shoot plan (not render/prompt) */
export type PhotographySection = {
  photographyStyle: PhotographyStyleId;
  photoMood: PhotoMoodId;
  depthProfile: PhotoDepthProfileId;
  focusStrategy: FocusStrategyId;
  backgroundBlur: number;
  productInteraction: ProductInteractionId;
  shootingNarrative: string;
  lightingIntent: string;
  cameraIntent: string;
  materialIntent: string;
  providerHints: string[];
  photographyBlueprint: PhotographyBlueprint;
  /** Normalized 0.0..1.0 */
  confidence: number;
};

export type CommercialPhotoDirectorContext = {
  productCategory: string;
  subCategory?: string;
  marketplace: string;
  creativeGoal: string;
  priceSegment: string;
  productCutout: boolean;
  providerId?: string;
  storyType?: string;
  primaryEmotion?: string;
  commercialGoal?: string;
  storyHook?: string;
  sceneType?: string;
  environment?: string;
  sceneLightingMood?: string;
  layoutTemplateId?: string;
  compositionTemplate?: string;
};

export type PhotographyExplainabilityReport = {
  agentId: "commercial-photo-director";
  selectedStyle: PhotographyStyleId;
  alternativesConsidered: PhotographyStyleId[];
  rejectedAlternatives: { id: PhotographyStyleId; reason: string }[];
  storyInfluences: string[];
  sceneInfluences: string[];
  layoutInfluences: string[];
  productFidelityNotes: string[];
  commercialValue: string;
  reasoning: string[];
};

export type PhotographyValidationReport = {
  valid: boolean;
  violations: string[];
  section?: PhotographySection;
};

export type PhotographyFailureCode =
  | "STORY_CONFLICT"
  | "MISSING_PHOTO_STYLE"
  | "PNG_INSERT_LOOK"
  | "AI_ART_NOT_COMMERCIAL"
  | "MISSING_SHOOTING_NARRATIVE"
  | "CONTAINS_LAYOUT_DECISION"
  | "CONTAINS_PROMPT"
  | "PROVIDER_INCOMPATIBLE";

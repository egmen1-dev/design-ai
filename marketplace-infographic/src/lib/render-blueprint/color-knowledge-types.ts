/**
 * Chapter 5.10 — Color Knowledge types
 */

export const ColorName = {
  BLUE: "blue",
  GREEN: "green",
  BLACK: "black",
  WHITE: "white",
  RED: "red",
  GOLD: "gold",
  CREAM: "cream",
  GRAY: "gray",
  BROWN: "brown",
} as const;

export type ColorNameId = (typeof ColorName)[keyof typeof ColorName];

export const ColorHarmony = {
  MONOCHROMATIC: "monochromatic",
  ANALOGOUS: "analogous",
  COMPLEMENTARY: "complementary",
  SPLIT_COMPLEMENTARY: "split_complementary",
  TRIADIC: "triadic",
  TETRADIC: "tetradic",
} as const;

export type ColorHarmonyId = (typeof ColorHarmony)[keyof typeof ColorHarmony];

export const PaletteColorTemperature = {
  WARM: "warm",
  COLD: "cold",
  NEUTRAL: "neutral",
} as const;

export type PaletteColorTemperatureId =
  (typeof PaletteColorTemperature)[keyof typeof PaletteColorTemperature];

export const ContrastType = {
  COLOR: "color_contrast",
  LUMINANCE: "luminance_contrast",
  SATURATION: "saturation_contrast",
  LOCAL: "local_contrast",
  GLOBAL: "global_contrast",
} as const;

export type ContrastTypeId = (typeof ContrastType)[keyof typeof ContrastType];

export const CategoryColorProfile = {
  MEDICAL: "medical",
  LUXURY_COSMETICS: "luxury_cosmetics",
  ECO: "eco",
  ELECTRONICS: "electronics",
} as const;

export type CategoryColorProfileId =
  (typeof CategoryColorProfile)[keyof typeof CategoryColorProfile];

export type ColorKnowledge = {
  id: string;
  palette: string;
  purpose: string;
  psychologicalEffects: string[];
  recommendedCategories: string[];
  forbiddenCategories: string[];
  confidence: number;
  harmony?: ColorHarmonyId;
  temperature?: PaletteColorTemperatureId;
};

export type ColorPsychologyProfile = {
  color: ColorNameId;
  effects: string[];
  commercialUse: string;
};

export type AccentColorPolicy = {
  primary: number;
  secondary: number;
  accent: number;
  maxTotal: number;
};

export type ColorSelectionContext = {
  category?: string;
  styleId?: string;
  businessGoal?: string;
  storyType?: string;
  brandPalette?: string[];
  audience?: string;
};

export type ColorBlueprintCheck = {
  palette?: string[];
  backgroundColor?: string;
  heroProductColor?: string;
  accentCount?: number;
  contrastRatio?: number;
  styleId?: string;
  brandColors?: string[];
  storyEmotion?: string;
  lightingColor?: string;
  materialColor?: string;
  overlayColor?: string;
  textContrastRatio?: number;
};

export type ColorValidationViolation = {
  code: ColorKnowledgeFailureCode;
  aspect: string;
  message: string;
};

export type ColorBlueprintValidation = {
  valid: boolean;
  violations: ColorValidationViolation[];
  retryRecommended: boolean;
  explainable: boolean;
};

export type ColorKnowledgeContext = {
  randomColorSelection?: boolean;
  noBusinessGoalLink?: boolean;
  storyContradiction?: boolean;
  insufficientContrast?: boolean;
  inconsistentAgentPalette?: boolean;
};

export type ColorKnowledgeViolation = {
  code: ColorKnowledgeFailureCode;
  message: string;
  knowledgeId?: string;
};

export type ColorKnowledgeReport = {
  valid: boolean;
  violations: ColorKnowledgeViolation[];
  knowledge: ColorKnowledge[];
  psychology: ColorPsychologyProfile[];
  harmonies: ColorHarmonyId[];
  goldenRuleSatisfied: boolean;
  contrastAware: boolean;
  consistencyEnforced: boolean;
  evolutionReady: boolean;
};

export type ColorKnowledgeFailureCode =
  | "RANDOM_COLOR_SELECTION"
  | "NO_BUSINESS_GOAL_LINK"
  | "STORY_CONTRADICTION"
  | "INSUFFICIENT_CONTRAST"
  | "INCONSISTENT_AGENT_PALETTE"
  | "HERO_LOST_ON_BACKGROUND"
  | "EXCESSIVE_ACCENT_COLORS"
  | "BRAND_READABILITY_CONFLICT"
  | "ACCESSIBILITY_CONTRAST_FAIL";

import type {
  BackgroundContrastDirection,
  EnvironmentDirection,
  HeroDominance,
  VisualHierarchyOrder,
} from "../types";

export const CATEGORY_INTELLIGENCE_FLAG = "DAOS_CATEGORY_INTELLIGENCE";
export const CATEGORY_INTELLIGENCE_VERSION = "1.1.0-home-wave1";

/** Harvest-aligned keys — match BV2 benchmark category ids */
export type CategoryIntelligenceKey = "home" | "kitchen" | "humidifier" | "pressure-wash";

export type CommercialLawRef =
  | "LAW_001"
  | "LAW_002"
  | "LAW_003"
  | "LAW_005"
  | "LAW_101"
  | "LAW_201";

export type CategoryAttentionRules = {
  headlineFactor: number;
  barOpacity: number;
  sidebarOpacity: number;
  dominanceFloor: number;
  focusRatioFloor: number;
  /** Optional — caps headline width (% of canvas) for LAW_003 compliance */
  headlineMaxWidthPct?: number;
  /** Optional — de-emphasizes full sidebar wrap */
  sidebarWrapOpacity?: number;
};

export type CategoryCompositionRules = {
  productAreaTarget: number;
  maxCharacteristics: number;
  badgeLimit: number;
  visualHierarchy: VisualHierarchyOrder[];
};

export type CategoryLightingRules = {
  contrastBoost: number;
  environmentDirection?: EnvironmentDirection;
};

export type CategoryHeroRules = {
  heroDominance: HeroDominance;
  mainMessageSuffix: string;
};

export type CategoryTypographyRules = {
  direction: string;
  defaultOverlayMode: "standard" | "relaxed";
};

export type CategoryBackgroundRules = {
  contrastDirection: BackgroundContrastDirection;
};

export type CategoryIntelligenceProfile = {
  key: CategoryIntelligenceKey;
  label: string;
  marketGroup: string;
  commercialLaws: CommercialLawRef[];
  visualPattern: string;
  attentionRules: CategoryAttentionRules;
  compositionRules: CategoryCompositionRules;
  lightingRules: CategoryLightingRules;
  heroRules: CategoryHeroRules;
  typographyRules: CategoryTypographyRules;
  backgroundRules: CategoryBackgroundRules;
  antiRules: string[];
};

export type CategoryIntelligenceResult = {
  version: string;
  enabled: boolean;
  key: CategoryIntelligenceKey | null;
  label: string | null;
  profile: CategoryIntelligenceProfile | null;
  appliedOverrides: string[];
  trace: string[];
};

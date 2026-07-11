import type { CategoryIntelligenceKey, CategoryIntelligenceProfile } from "./types";
import { HOME_PROFILE_V11 } from "./home-category-knowledge";

/**
 * Wave 1 Category Intelligence profiles — calibrated from BV2 failure analysis.
 * Дом v1.1: LAW_003 headline suppression + mass priority (home wave 1 sprint)
 */
export const CATEGORY_INTELLIGENCE_PROFILES: Record<CategoryIntelligenceKey, CategoryIntelligenceProfile> = {
  home: HOME_PROFILE_V11,

  kitchen: {
    key: "kitchen",
    label: "Кухня",
    marketGroup: "kitchen",
    commercialLaws: ["LAW_002", "LAW_003", "LAW_101"],
    visualPattern: "warm_studio_appliance_hero_compact_specs",
    attentionRules: {
      headlineFactor: 0.54,
      barOpacity: 0.32,
      sidebarOpacity: 0.8,
      dominanceFloor: 51,
      focusRatioFloor: 0.35,
    },
    compositionRules: {
      productAreaTarget: 0.44,
      maxCharacteristics: 3,
      badgeLimit: 1,
      visualHierarchy: ["product", "headline", "characteristics", "logo"],
    },
    lightingRules: {
      contrastBoost: 0.11,
      environmentDirection: "light_modern_clean",
    },
    heroRules: {
      heroDominance: "product_first",
      mainMessageSuffix: "удобство и результат на кухне",
    },
    typographyRules: {
      direction: "warm studio headline, stainless/white product contrast priority",
      defaultOverlayMode: "relaxed",
    },
    backgroundRules: {
      contrastDirection: "medium_contrast_background",
    },
    antiRules: [
      "Не использовать industrial lighting для кухонной техники",
      "Не допускать конкуренции боковой панели с корпусом прибора",
    ],
  },

  humidifier: {
    key: "humidifier",
    label: "Климат",
    marketGroup: "climate",
    commercialLaws: ["LAW_001", "LAW_003", "LAW_201"],
    visualPattern: "vertical_appliance_center_minimal_clutter",
    attentionRules: {
      headlineFactor: 0.5,
      barOpacity: 0.28,
      sidebarOpacity: 0.74,
      dominanceFloor: 49,
      focusRatioFloor: 0.33,
    },
    compositionRules: {
      productAreaTarget: 0.43,
      maxCharacteristics: 2,
      badgeLimit: 1,
      visualHierarchy: ["product", "headline", "logo", "characteristics"],
    },
    lightingRules: {
      contrastBoost: 0.09,
      environmentDirection: "light_modern_clean",
    },
    heroRules: {
      heroDominance: "product_first",
      mainMessageSuffix: "комфортный микроклимат",
    },
    typographyRules: {
      direction: "benefit-first compact, vertical product emphasis",
      defaultOverlayMode: "relaxed",
    },
    backgroundRules: {
      contrastDirection: "cool_neutral_separation",
    },
    antiRules: [
      "Не масштабировать мелкую бытовую технику ниже 43% площади",
      "Избегать боковых характеристик, конкурирующих с корпусом",
    ],
  },

  "pressure-wash": {
    key: "pressure-wash",
    label: "Мойка",
    marketGroup: "cleaning",
    commercialLaws: ["LAW_002", "LAW_003", "LAW_005"],
    visualPattern: "industrial_hero_high_contrast_outdoor_tool",
    attentionRules: {
      headlineFactor: 0.58,
      barOpacity: 0.35,
      sidebarOpacity: 0.85,
      dominanceFloor: 52,
      focusRatioFloor: 0.36,
    },
    compositionRules: {
      productAreaTarget: 0.44,
      maxCharacteristics: 3,
      badgeLimit: 2,
      visualHierarchy: ["product", "headline", "characteristics", "logo"],
    },
    lightingRules: {
      contrastBoost: 0.14,
      environmentDirection: "clean_industrial_technical",
    },
    heroRules: {
      heroDominance: "product_first",
      mainMessageSuffix: "мощная очистка без усилий",
    },
    typographyRules: {
      direction: "bold industrial headline, high product mass",
      defaultOverlayMode: "standard",
    },
    backgroundRules: {
      contrastDirection: "cool_neutral_separation",
    },
    antiRules: [
      "Не использовать lifestyle/home background для инструмента высокого давления",
      "Избегать зелёного или жёлтого фона без контрастного разделения",
    ],
  },
};

export const WAVE1_CATEGORY_KEYS: CategoryIntelligenceKey[] = [
  "home",
  "kitchen",
  "humidifier",
  "pressure-wash",
];

export function getCategoryProfile(
  key: CategoryIntelligenceKey,
): CategoryIntelligenceProfile {
  return CATEGORY_INTELLIGENCE_PROFILES[key];
}

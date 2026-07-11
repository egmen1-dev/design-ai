/**
 * Home Category Knowledge — extracted from BV2 analysis, WB leaders, Commercial KB.
 * Measurable rules compatible with EKB; auto-selected when category key = home.
 */
import type { CategoryIntelligenceProfile } from "./types";

/** Dominance statistics from BV2 home cohort (n=14) */
export const HOME_BV2_BASELINE = {
  winRate: 57.1,
  avgDominance: 49.4,
  avgFidelity: 35.4,
  avgAttention: 33.7,
  losses: 5,
  lossReasonDominance: 5,
  avgHeadlineDeltaOnLoss: 12.4,
  avgDominanceDeltaOnLoss: -18.6,
} as const;

/** Tier A reference (avg of Электроинструмент, Авто, Строительство) */
export const TIER_A_REFERENCE = {
  winRate: 76.2,
  avgDominance: 55.4,
} as const;

/**
 * Category Knowledge Extraction — Дом
 * Sources: BV2 product-057..070 metrics, LAW_003 (-0.723), LAW_002 (+0.332)
 */
export const HOME_CATEGORY_KNOWLEDGE = {
  utp: [
    "Порядок и экономия пространства",
    "Быстрый доступ к вещам",
    "Эстетика интерьера",
    "Компактное хранение",
  ],
  visualPatterns: [
    "flat_wide_organizer_fills_lower_two_thirds",
    "single_product_center_mass_no_props",
    "soft_neutral_gradient_background",
    "minimal_or_no_sidebar_on_storage_items",
  ],
  competitorErrors: [
    "Слишком мелкий товар на lifestyle-фоне (productVW <15)",
    "Заголовок конкурирует с товаром (headlineVW >20 при LAW_003)",
    "Боковые характеристики отвлекают от массы товара",
    "Тёмный фон снижает контраст светлых органайзеров",
  ],
  composition: {
    heroShape: "flat_rectangular_wide",
    visualMass: "product_fills_45pct_canvas_minimum",
    productPlacement: "center_lower_bias",
    whitespaceTarget: "28-32pct",
  },
  colorAndLight: {
    palette: "warm_neutral_cream_white",
    lighting: "soft_diffused_studio",
    background: "light_gradient_neutral",
  },
  typography: {
    style: "single_line_benefit_compact",
    headlineWeight: "subordinate_to_product",
    maxHeadlineWidthPct: 42,
  },
  attention: {
    hierarchy: "product > headline > logo > specs",
    primaryFocusTarget: 0.36,
    headlineFactorTarget: 0.36,
  },
} as const;

/** Wave 1.1 Home profile — LAW_003-driven calibration (headline suppression + mass priority) */
export const HOME_PROFILE_V11: CategoryIntelligenceProfile = {
  key: "home",
  label: "Дом",
  marketGroup: "home",
  commercialLaws: ["LAW_002", "LAW_003", "LAW_005", "LAW_101"],
  visualPattern: HOME_CATEGORY_KNOWLEDGE.visualPatterns[0],
  attentionRules: {
    headlineFactor: HOME_CATEGORY_KNOWLEDGE.attention.headlineFactorTarget,
    barOpacity: 0.18,
    sidebarOpacity: 0.55,
    dominanceFloor: 52,
    focusRatioFloor: HOME_CATEGORY_KNOWLEDGE.attention.primaryFocusTarget,
    headlineMaxWidthPct: HOME_CATEGORY_KNOWLEDGE.typography.maxHeadlineWidthPct,
    sidebarWrapOpacity: 0.62,
  },
  compositionRules: {
    productAreaTarget: 0.45,
    maxCharacteristics: 1,
    badgeLimit: 0,
    visualHierarchy: ["product", "headline", "logo", "characteristics"],
  },
  lightingRules: {
    contrastBoost: 0.12,
    environmentDirection: "light_modern_clean",
  },
  heroRules: {
    heroDominance: "product_first",
    mainMessageSuffix: HOME_CATEGORY_KNOWLEDGE.utp[0].toLowerCase(),
  },
  typographyRules: {
    direction: "single-line benefit, headline subordinate — LAW_003 compliance",
    defaultOverlayMode: "relaxed",
  },
  backgroundRules: {
    contrastDirection: "light_background",
  },
  antiRules: [
    ...HOME_CATEGORY_KNOWLEDGE.competitorErrors,
    "Не допускать headlineVW ≥ productVW на карточках хранения",
    "Органайзеры: товар должен занимать нижние 2/3 кадра",
  ],
};

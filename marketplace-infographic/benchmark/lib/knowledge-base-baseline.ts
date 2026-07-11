/**
 * Frozen Commercial Knowledge Base v1 — benchmark-only SSOT for law validation.
 * Source: Knowledge Freeze v1 (Quality Cycles 1–5).
 * Do not import into production runtime.
 */

export type LawProductionStatus = "PROVEN" | "LIKELY" | "HYPOTHESIS" | "REJECTED";

export type BaselineLaw = {
  id: string;
  name: string;
  description: string;
  status: LawProductionStatus;
  /** Primary measurable feature (if applicable) */
  feature?: string;
  /** Expected correlation sign with productDominanceScore */
  expectedDirection?: "positive" | "negative" | "negligible";
  /** Baseline Pearson r from Knowledge Freeze (WB n=120) */
  baselineCorrelation?: number;
  /** Baseline confidence from Council */
  baselineConfidence: "high" | "medium" | "low";
  source: string;
  /** Laws without a single feature use validationType */
  validationType?: "correlation" | "qualitative" | "daos_only";
};

/** Thresholds for law drift detection */
export const VALIDATION_THRESHOLDS = {
  /** |r| below this → law considered weakened */
  negligibleCorrelation: 0.1,
  /** Sign flip or drop below this when baseline was strong → Contradicted */
  contradictionDrop: 0.15,
  /** Current |r| exceeds baseline by this → Confidence Increased */
  confidenceIncreaseDelta: 0.08,
  /** Current |r| below baseline by this → Confidence Decreased */
  confidenceDecreaseDelta: 0.12,
  /** Minimum |r| for Candidate Law discovery */
  candidateLawMinR: 0.28,
  candidateLawMinN: 30,
} as const;

/**
 * Commercial Knowledge Base v1 — frozen at Knowledge Freeze (2026-07-11).
 * Baseline correlations from quality-cycle-2 and quality-cycle-4.
 */
export const KNOWLEDGE_BASE_V1: BaselineLaw[] = [
  {
    id: "LAW_001",
    name: "Product Area Does Not Drive Dominance",
    description: "Product Area % has negligible correlation with Product Dominance.",
    status: "PROVEN",
    feature: "productAreaPct",
    expectedDirection: "negligible",
    baselineCorrelation: -0.099,
    baselineConfidence: "high",
    source: "Quality Cycle 2",
  },
  {
    id: "LAW_002",
    name: "Foreground Isolation Increases Dominance",
    description: "Higher Foreground Isolation predicts higher Product Dominance.",
    status: "PROVEN",
    feature: "foregroundIsolation",
    expectedDirection: "positive",
    baselineCorrelation: 0.332,
    baselineConfidence: "high",
    source: "Quality Cycle 2",
  },
  {
    id: "LAW_003",
    name: "Headline Steals Attention",
    description: "Headline Visual Weight negatively predicts Product Dominance.",
    status: "PROVEN",
    feature: "headlineVisualWeight",
    expectedDirection: "negative",
    baselineCorrelation: -0.723,
    baselineConfidence: "high",
    source: "Quality Cycle 4",
  },
  {
    id: "LAW_004",
    name: "Badge Competition Not Bottleneck",
    description: "Badge overlay does not measurably compete with product dominance.",
    status: "PROVEN",
    feature: "badgeCompetition",
    expectedDirection: "negligible",
    baselineCorrelation: 0.05,
    baselineConfidence: "high",
    source: "Quality Cycle 4 (DAOS layer delta = 0)",
    validationType: "qualitative",
  },
  {
    id: "LAW_005",
    name: "Attention Hierarchy > Product Area",
    description: "Primary Focus Ratio and hierarchy govern final-card dominance more than area.",
    status: "PROVEN",
    feature: "primaryFocusRatio",
    expectedDirection: "positive",
    baselineCorrelation: 0.744,
    baselineConfidence: "high",
    source: "Quality Cycle 4–5",
  },
  {
    id: "LAW_006",
    name: "Compositor Sufficient; Overlay Dilutes FI",
    description: "Compositor achieves high FI; HTML overlay collapses hero/global ratio.",
    status: "PROVEN",
    validationType: "daos_only",
    baselineConfidence: "high",
    source: "Quality Cycle 3–4 (layer delta)",
  },
  {
    id: "LAW_007",
    name: "Hero Visual Weight Drives Dominance",
    description: "Edge energy in hero zone predicts Product Dominance.",
    status: "PROVEN",
    feature: "visualWeightHero",
    expectedDirection: "positive",
    baselineCorrelation: 0.35,
    baselineConfidence: "high",
    source: "Quality Cycle 1",
  },
  {
    id: "LAW_008",
    name: "Sharpness Cluster Explains Visual Weight",
    description: "Object Sharpness, Local Contrast, Object Contrast explain ~87% of Visual Weight.",
    status: "PROVEN",
    feature: "objectSharpness",
    expectedDirection: "positive",
    baselineCorrelation: 0.326,
    baselineConfidence: "high",
    source: "Quality Cycle 2",
  },
  {
    id: "LAW_009",
    name: "Texture Competition Reduces Dominance",
    description: "Headline-zone texture competition negatively correlates with dominance.",
    status: "PROVEN",
    feature: "textureCompetition",
    expectedDirection: "negative",
    baselineCorrelation: -0.289,
    baselineConfidence: "medium",
    source: "Quality Cycle 2",
  },
  {
    id: "LAW_014",
    name: "Object Sharpness Correlates With Dominance",
    description: "Object Sharpness cluster member correlates with dominance.",
    status: "LIKELY",
    feature: "objectSharpness",
    expectedDirection: "positive",
    baselineCorrelation: 0.326,
    baselineConfidence: "medium",
    source: "Quality Cycle 2",
  },
  {
    id: "LAW_015",
    name: "Perspective Cues Correlate With Dominance",
    description: "Perspective proxy weakly correlates; large DAOS gap.",
    status: "LIKELY",
    feature: "perspective",
    expectedDirection: "positive",
    baselineCorrelation: 0.173,
    baselineConfidence: "low",
    source: "Quality Cycle 2",
  },
  {
    id: "LAW_021",
    name: "Product Area 55% as Dominance Lever — REJECTED",
    description: "Increasing product area to 55% will not increase dominance.",
    status: "REJECTED",
    feature: "productAreaPct",
    expectedDirection: "negligible",
    baselineCorrelation: -0.099,
    baselineConfidence: "high",
    source: "Quality Cycle 1–2",
  },
  {
    id: "LAW_022",
    name: "Badge Competition Fix — REJECTED",
    description: "Badge visual weight is not a post-overlay competitor.",
    status: "REJECTED",
    feature: "badgeCompetition",
    expectedDirection: "negligible",
    baselineCorrelation: 0.05,
    baselineConfidence: "high",
    source: "Quality Cycle 4",
  },
  {
    id: "LAW_024",
    name: "Heavier Headline Improves Dominance — REJECTED",
    description: "Increasing headline weight decreases dominance.",
    status: "REJECTED",
    feature: "headlineVisualWeight",
    expectedDirection: "negative",
    baselineCorrelation: -0.723,
    baselineConfidence: "high",
    source: "Quality Cycle 4",
  },
];

/** Feature keys measured in marketplace learning loop */
export const VISUAL_WEIGHT_FEATURES = [
  "productAreaPct",
  "objectContrast",
  "edgeContrast",
  "brightnessSeparation",
  "colorSeparation",
  "objectSharpness",
  "objectSaturation",
  "objectLighting",
  "objectDepth",
  "shadowPresence",
  "perspective",
  "foregroundIsolation",
  "negativeSpace",
  "objectSymmetry",
  "visualCenterOffset",
  "dominantColorBalance",
  "backgroundNoise",
  "textureCompetition",
  "highlightStrength",
  "localContrast",
] as const;

export const ATTENTION_FEATURES = [
  "headlineVisualWeight",
  "badgeVisualWeight",
  "typographyDensity",
  "typographyContrast",
  "primaryFocusRatio",
  "secondaryFocusRatio",
  "typographyCompetition",
  "attentionCompetitionIndex",
  "productAttention",
  "productVisualWeight",
  "badgeCompetition",
  "textCompetition",
  "visualClutter",
  "eyePathScore",
] as const;

export const LEARNING_CATEGORIES = [
  { id: "power-tools", label: "Электроинструмент", topN: 14 },
  { id: "garden", label: "Сад", topN: 14 },
  { id: "home-appliances", label: "Бытовая техника", topN: 14 },
  { id: "construction", label: "Строительство", topN: 14 },
  { id: "home", label: "Дом", topN: 14 },
  { id: "auto", label: "Авто", topN: 14 },
  { id: "kitchen", label: "Кухня", topN: 14 },
  { id: "pressure-wash", label: "Мойка", topN: 14 },
  { id: "humidifier", label: "Климат", topN: 8 },
] as const;

/** Features that are sub-components of proven cluster laws — not promoted as separate Candidate Laws */
export const CLUSTER_SUB_FEATURES = new Set([
  "localContrast",
  "objectContrast",
  "objectSaturation",
  "edgeContrast",
  "negativeSpace",
]);

export function getLawByFeature(feature: string): BaselineLaw | undefined {
  return KNOWLEDGE_BASE_V1.find((l) => l.feature === feature && l.status !== "REJECTED");
}

export function getBaselineCorrelation(feature: string): number | undefined {
  const law = KNOWLEDGE_BASE_V1.find((l) => l.feature === feature);
  return law?.baselineCorrelation;
}

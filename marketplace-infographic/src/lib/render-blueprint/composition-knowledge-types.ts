/**
 * Chapter 5.8 — Composition Knowledge types
 */

export const CompositionPrinciple = {
  HIERARCHY: "visual_hierarchy",
  FOCAL_POINT: "focal_point",
  NEGATIVE_SPACE: "negative_space",
  BALANCE: "balance",
  VISUAL_WEIGHT: "visual_weight",
  READING_FLOW: "reading_flow",
  RULE_OF_THIRDS: "rule_of_thirds",
  GRID: "grid_system",
  GOLDEN_RATIO: "golden_ratio",
} as const;

export type CompositionPrincipleId =
  (typeof CompositionPrinciple)[keyof typeof CompositionPrinciple];

export const CompositionBalance = {
  SYMMETRICAL: "symmetrical",
  ASYMMETRICAL: "asymmetrical",
} as const;

export type CompositionBalanceId =
  (typeof CompositionBalance)[keyof typeof CompositionBalance];

export const CompositionGrid = {
  GRID_2X2: "2x2",
  GRID_3X3: "3x3",
  GOLDEN_RATIO: "golden_ratio_grid",
  MODULAR: "modular_grid",
  OVERLAY: "overlay_grid",
} as const;

export type CompositionGridId = (typeof CompositionGrid)[keyof typeof CompositionGrid];

export const CompositionPatternId = {
  CENTERED_HERO: "centered_hero",
  DIAGONAL_FLOW: "diagonal_flow",
  SPLIT_LAYOUT: "split_layout",
  LIFESTYLE_FOCUS: "lifestyle_focus",
  FEATURE_COMPARISON: "feature_comparison",
  EXPLODED_VIEW: "exploded_view",
} as const;

export type CompositionPatternKind =
  (typeof CompositionPatternId)[keyof typeof CompositionPatternId];

export type CompositionCondition = {
  field: string;
  operator: "eq" | "in" | "gte" | "lte";
  value: string | number | string[];
};

export type CompositionRule = {
  id: string;
  name: string;
  principle: CompositionPrincipleId;
  conditions: CompositionCondition[];
  recommendation: string;
  confidence: number;
  examples: string[];
};

export type CompositionPattern = {
  id: CompositionPatternKind;
  name: string;
  description: string;
  recommendedFor: string[];
  heroProductRatio: { min: number; max: number };
  negativeSpace: "low" | "medium" | "high";
  balance: CompositionBalanceId;
  grid?: CompositionGridId;
};

export type CompositionAntiPattern = {
  id: string;
  name: string;
  description: string;
  detectionHints: string[];
};

export type VisualHierarchyLevel = {
  rank: number;
  role: string;
  examples: string[];
};

export type ReadingFlow = {
  id: string;
  name: string;
  path: string[];
  regions: string[];
};

export type CompositionSelectionContext = {
  category?: string;
  productSize?: "small" | "medium" | "large";
  infographicType?: string;
  marketplace?: string;
  styleId?: string;
  storyHook?: string;
  informationDensity?: "low" | "medium" | "high";
};

export type CompositionBlueprintCheck = {
  patternId?: string;
  hasHeroObject: boolean;
  hierarchyOrder?: string[];
  balance?: CompositionBalanceId;
  negativeSpaceRatio?: number;
  visualWeights?: Record<string, number>;
  readingFlowId?: string;
  heroProductRatio?: number;
  styleId?: string;
  storyPrimaryFocus?: string;
  firstAttentionTarget?: string;
  overcrowded?: boolean;
  competingFoci?: number;
};

export type CompositionValidationViolation = {
  code: CompositionKnowledgeFailureCode;
  aspect: string;
  message: string;
};

export type CompositionBlueprintValidation = {
  valid: boolean;
  violations: CompositionValidationViolation[];
  retryRecommended: boolean;
  explainable: boolean;
};

export type CompositionKnowledgeContext = {
  randomPlacement?: boolean;
  missingHeroObject?: boolean;
  illogicalReadingFlow?: boolean;
  storyContradiction?: boolean;
  missingQualityRules?: boolean;
};

export type CompositionKnowledgeViolation = {
  code: CompositionKnowledgeFailureCode;
  message: string;
  ruleId?: string;
};

export type CompositionKnowledgeReport = {
  valid: boolean;
  violations: CompositionKnowledgeViolation[];
  rules: CompositionRule[];
  patterns: CompositionPattern[];
  antiPatterns: CompositionAntiPattern[];
  goldenRuleSatisfied: boolean;
  hierarchyDefined: boolean;
  patternsSupported: boolean;
  evolutionReady: boolean;
};

export type CompositionKnowledgeFailureCode =
  | "RANDOM_OBJECT_PLACEMENT"
  | "MISSING_HERO_OBJECT"
  | "ILLOGICAL_READING_FLOW"
  | "STORY_CONTRADICTION"
  | "MISSING_QUALITY_RULES"
  | "HIERARCHY_VIOLATED"
  | "NEGATIVE_SPACE_VIOLATED"
  | "ANTI_PATTERN_DETECTED"
  | "UNKNOWN_PATTERN";

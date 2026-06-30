/**
 * Chapter 5.14 — Pattern Library types
 */

export const PatternLibraryCategory = {
  BUSINESS: "business",
  STORY: "story",
  COMPOSITION: "composition",
  PHOTOGRAPHY: "photography",
  TYPOGRAPHY: "typography",
  MARKETPLACE: "marketplace",
} as const;

export type PatternLibraryCategoryId =
  (typeof PatternLibraryCategory)[keyof typeof PatternLibraryCategory];

export const BusinessPatternGoal = {
  ATTENTION: "attention",
  TRUST: "trust",
  BENEFITS: "benefits_demo",
  EXPLANATION: "product_explanation",
  VALUE: "value_perception",
  OBJECTIONS: "objection_handling",
} as const;

export type BusinessPatternGoalId =
  (typeof BusinessPatternGoal)[keyof typeof BusinessPatternGoal];

export const StoryPatternKind = {
  PRODUCT_HERO: "product_hero",
  BEFORE_AFTER: "before_after",
  PROBLEM_SOLUTION: "problem_solution",
  LIFESTYLE: "lifestyle",
  PREMIUM_SHOWCASE: "premium_showcase",
  TECHNICAL_EXPLANATION: "technical_explanation",
  FEATURE_FOCUS: "feature_focus",
  EMOTIONAL_STORY: "emotional_story",
} as const;

export type StoryPatternKindId = (typeof StoryPatternKind)[keyof typeof StoryPatternKind];

export type PatternCondition = {
  field: string;
  operator: "eq" | "in" | "gte" | "lte";
  value: string | number | string[];
};

export type PatternConstraint = {
  id: string;
  rule: string;
  blockedWhen: PatternCondition[];
};

/** Unified pattern library entry — distinct from Ch 5.8 CompositionPattern */
export type DesignPattern = {
  id: string;
  name: string;
  category: PatternLibraryCategoryId;
  purpose: string;
  conditions: PatternCondition[];
  layout: string;
  confidence: number;
  usageCount: number;
  successRate: number;
  constraints?: PatternConstraint[];
  blendableWith?: string[];
  explainable: string;
  businessGoal?: BusinessPatternGoalId;
  storyKind?: StoryPatternKindId;
  marketplaceId?: string;
};

export type PatternHierarchyLevel = {
  rank: number;
  category: PatternLibraryCategoryId;
  description: string;
  drives: string;
};

export type PatternSelectionContext = {
  category?: string;
  marketplace?: string;
  businessGoal?: BusinessPatternGoalId;
  storyKind?: StoryPatternKindId;
  styleId?: string;
  imageContext?: string;
  audience?: string;
  featureCount?: number;
  priceTier?: "budget" | "mid" | "premium";
  designMemoryHint?: string;
};

export type PatternBlendResult = {
  patternIds: string[];
  blendedLayout: string;
  compatible: boolean;
  warnings: string[];
};

export type PatternScoreFeedback = {
  patternId: string;
  visionScore?: number;
  ctrPrediction?: number;
  commercialScore?: number;
  retryCount?: number;
  userRating?: number;
};

export type PatternPublicationCheck = {
  pattern: DesignPattern;
  existingPatterns?: DesignPattern[];
  businessGoalAligned?: boolean;
  compatibleWithLibrary?: boolean;
};

export type PatternBlueprintCheck = {
  selectedPatternIds?: string[];
  category?: string;
  marketplace?: string;
  imageContext?: string;
  businessGoal?: BusinessPatternGoalId;
  priceTier?: "budget" | "mid" | "premium";
  featureCount?: number;
  containsImageTemplate?: boolean;
  explainable?: boolean;
};

export type PatternValidationViolation = {
  code: PatternLibraryFailureCode;
  aspect: string;
  message: string;
};

export type PatternBlueprintValidation = {
  valid: boolean;
  violations: PatternValidationViolation[];
  retryRecommended: boolean;
  explainable: boolean;
  recommendedPatterns?: DesignPattern[];
};

export type PatternLibraryContext = {
  storesImageTemplates?: boolean;
  duplicatePatterns?: boolean;
  missingStatistics?: boolean;
  unexplainablePatterns?: boolean;
  ignoresCommercialEffectiveness?: boolean;
};

export type PatternLibraryViolation = {
  code: PatternLibraryFailureCode;
  message: string;
  patternId?: string;
};

export type PatternLibraryReport = {
  valid: boolean;
  violations: PatternLibraryViolation[];
  patterns: DesignPattern[];
  hierarchy: PatternHierarchyLevel[];
  goldenRuleSatisfied: boolean;
  reusableKnowledge: boolean;
  blendCapable: boolean;
  evolutionReady: boolean;
};

export type PatternLibraryFailureCode =
  | "DUPLICATE_PATTERN"
  | "IMAGE_TEMPLATE_STORED"
  | "MISSING_USAGE_STATISTICS"
  | "UNEXPLAINABLE_PATTERN"
  | "PATTERN_CONSTRAINT_VIOLATION"
  | "INCOMPATIBLE_PATTERN_BLEND"
  | "MISSING_BUSINESS_GOAL_ALIGNMENT"
  | "LOW_SUCCESS_RATE"
  | "UNPUBLISHED_PATTERN";

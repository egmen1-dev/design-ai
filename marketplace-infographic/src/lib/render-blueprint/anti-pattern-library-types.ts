/**
 * Chapter 5.15 — Anti-Pattern Library types
 */

export const AntiPatternCategory = {
  BUSINESS: "business",
  COMPOSITION: "composition",
  PHOTOGRAPHY: "photography",
  TYPOGRAPHY: "typography",
  MARKETPLACE: "marketplace",
  PSYCHOLOGY: "psychology",
  RENDERING: "rendering",
} as const;

export type AntiPatternCategoryId =
  (typeof AntiPatternCategory)[keyof typeof AntiPatternCategory];

export const AntiPatternSeverity = {
  CRITICAL: "critical",
  MAJOR: "major",
  MINOR: "minor",
  INFO: "info",
} as const;

export type AntiPatternSeverityId =
  (typeof AntiPatternSeverity)[keyof typeof AntiPatternSeverity];

export type AntiPatternDetectionRule = {
  field: string;
  operator: "eq" | "in" | "gte" | "lte" | "gt" | "lt";
  value: string | number | boolean | string[];
};

/** Unified anti-pattern entry — distinct from Ch 5.8 CompositionAntiPattern */
export type DesignAntiPattern = {
  id: string;
  name: string;
  category: AntiPatternCategoryId;
  description: string;
  severity: AntiPatternSeverityId;
  severityScore: number;
  detectionRules: AntiPatternDetectionRule[];
  recommendedFixes: string[];
  examples: string[];
  confidence: number;
  agentScope?: string[];
};

export type AntiPatternSeverityAction = {
  severity: AntiPatternSeverityId;
  score: number;
  action: "reject" | "retry" | "correct" | "recommend";
  description: string;
};

export type AntiPatternDetectionContext = {
  category?: string;
  marketplace?: string;
  imageContext?: string;
};

export type AntiPatternBlueprintCheck = {
  heroProductRatio?: number;
  hasHeroProduct?: boolean;
  competingFocalPoints?: number;
  overcrowded?: boolean;
  negativeSpaceRatio?: number;
  chaoticEyeFlow?: boolean;
  textContrastRatio?: number;
  textDensity?: number;
  fontSizeCount?: number;
  alignmentChaotic?: boolean;
  headlineTooLong?: boolean;
  marketplaceRuleViolation?: boolean;
  thumbnailReadable?: boolean;
  safeZoneViolation?: boolean;
  cognitiveLoad?: number;
  visualNoise?: boolean;
  emotionalConflict?: boolean;
  missingUsp?: boolean;
  tellEverythingAtOnce?: boolean;
  noCommercialFocus?: boolean;
  impossibleLighting?: boolean;
  wrongShadows?: boolean;
  plasticMaterials?: boolean;
  aiArtifacts?: boolean;
  deformedGeometry?: boolean;
  duplicateObjects?: boolean;
  renderNoise?: boolean;
};

export type AntiPatternDetectionResult = {
  antiPattern: DesignAntiPattern;
  matchedRules: string[];
};

export type AntiPatternValidationViolation = {
  code: AntiPatternLibraryFailureCode;
  aspect: string;
  message: string;
  antiPatternId: string;
  severity: AntiPatternSeverityId;
};

export type AntiPatternBlueprintValidation = {
  valid: boolean;
  violations: AntiPatternValidationViolation[];
  detected: AntiPatternDetectionResult[];
  rejectRecommended: boolean;
  retryRecommended: boolean;
  correctionRecommended: boolean;
  recommendedFixes: string[];
  explainable: boolean;
  highestSeverity?: AntiPatternSeverityId;
};

export type AntiPatternLearningFeedback = {
  antiPatternId: string;
  detected: boolean;
  fixed?: boolean;
  ledToRetry?: boolean;
  commercialScoreImpact?: number;
};

export type AntiPatternLibraryContext = {
  postGenerationOnly?: boolean;
  missingSeverityClassification?: boolean;
  noAutoFix?: boolean;
  repeatingErrors?: boolean;
  noDesignMemoryLink?: boolean;
};

export type AntiPatternLibraryViolation = {
  code: AntiPatternLibraryFailureCode;
  message: string;
  antiPatternId?: string;
};

export type AntiPatternLibraryReport = {
  valid: boolean;
  violations: AntiPatternLibraryViolation[];
  antiPatterns: DesignAntiPattern[];
  severityActions: AntiPatternSeverityAction[];
  goldenRuleSatisfied: boolean;
  preGenerationDetection: boolean;
  autoRecoveryReady: boolean;
  evolutionReady: boolean;
};

export type AntiPatternLibraryFailureCode =
  | "CRITICAL_ANTI_PATTERN"
  | "MAJOR_ANTI_PATTERN"
  | "UNEXPLAINABLE_ANTI_PATTERN"
  | "MISSING_DETECTION_RULES"
  | "MISSING_AUTO_FIX"
  | "POST_GENERATION_ONLY"
  | "DUPLICATE_ANTI_PATTERN"
  | "SEVERITY_NOT_CLASSIFIED"
  | "REPEATING_ERROR";

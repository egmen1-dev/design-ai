/**
 * Chapter 5.11 — Typography Knowledge types
 */

export const FontCharacter = {
  SANS_SERIF: "sans_serif",
  SERIF: "serif",
  GEOMETRIC: "geometric",
  HUMANIST: "humanist",
  TECHNICAL: "technical",
  DISPLAY: "display",
} as const;

export type FontCharacterId = (typeof FontCharacter)[keyof typeof FontCharacter];

export const FontWeightRole = {
  HEADLINE: "bold",
  PRIMARY: "medium",
  SUPPORTING: "regular",
} as const;

export type FontWeightRoleId = (typeof FontWeightRole)[keyof typeof FontWeightRole];

export const TextAlignment = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
  COMBINED: "combined",
} as const;

export type TextAlignmentId = (typeof TextAlignment)[keyof typeof TextAlignment];

export type TypographyCondition = {
  field: string;
  operator: "eq" | "in" | "gte" | "lte";
  value: string | number | string[];
};

export type TypographyKnowledge = {
  id: string;
  rule: string;
  purpose: string;
  conditions: TypographyCondition[];
  recommendation: string;
  confidence: number;
  styleId?: string;
};

export type TextHierarchyLevel = {
  rank: number;
  role: string;
  weight: FontWeightRoleId;
  examples: string[];
};

export type TypographySelectionContext = {
  styleId?: string;
  category?: string;
  marketplace?: string;
  imageContext?: string;
  informationDensity?: "low" | "medium" | "high";
  storyType?: string;
};

export type TypographyBlueprintCheck = {
  hierarchyOrder?: string[];
  contrastRatio?: number;
  alignment?: TextAlignmentId[];
  boldCount?: number;
  lineSpacing?: number;
  letterSpacing?: number;
  textDensity?: number;
  styleId?: string;
  fontCharacters?: FontCharacterId[];
  headlineReadable?: boolean;
  productObscured?: boolean;
  sizeScaleConsistent?: boolean;
};

export type TypographyValidationViolation = {
  code: TypographyKnowledgeFailureCode;
  aspect: string;
  message: string;
};

export type TypographyBlueprintValidation = {
  valid: boolean;
  violations: TypographyValidationViolation[];
  retryRecommended: boolean;
  explainable: boolean;
};

export type TypographyKnowledgeContext = {
  unreadableText?: boolean;
  missingHierarchy?: boolean;
  randomSizes?: boolean;
  inconsistentBlocks?: boolean;
  textDistractsFromProduct?: boolean;
};

export type TypographyKnowledgeViolation = {
  code: TypographyKnowledgeFailureCode;
  message: string;
  knowledgeId?: string;
};

export type TypographyKnowledgeReport = {
  valid: boolean;
  violations: TypographyKnowledgeViolation[];
  knowledge: TypographyKnowledge[];
  hierarchy: TextHierarchyLevel[];
  goldenRuleSatisfied: boolean;
  readabilityFirst: boolean;
  styleAware: boolean;
  evolutionReady: boolean;
};

export type TypographyKnowledgeFailureCode =
  | "UNREADABLE_TEXT"
  | "MISSING_TEXT_HIERARCHY"
  | "RANDOM_FONT_SIZES"
  | "INCONSISTENT_TYPOGRAPHY"
  | "TEXT_DISTRACTS_FROM_PRODUCT"
  | "INSUFFICIENT_TEXT_CONTRAST"
  | "EXCESSIVE_TEXT_DENSITY"
  | "ALIGNMENT_CHAOS"
  | "STYLE_TYPOGRAPHY_MISMATCH";

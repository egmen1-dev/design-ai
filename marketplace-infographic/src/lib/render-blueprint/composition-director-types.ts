/**
 * Chapter 4.12 — Composition Director types
 */
import type { CompositionBlueprint, LayoutRect } from "./types";

export type { LayoutRect };

export const LayoutTemplate = {
  MINIMAL_LEFT_HERO: "minimal_left_hero",
  CENTERED_PREMIUM: "centered_premium",
  DIAGONAL_FLOW: "diagonal_flow",
  EDITORIAL_SPLIT: "editorial_split",
  MODERN_MARKETPLACE: "modern_marketplace",
  LUXURY_SHOWCASE: "luxury_showcase",
  FEATURE_GRID: "feature_grid",
} as const;

export type LayoutTemplateId = (typeof LayoutTemplate)[keyof typeof LayoutTemplate];

export const EyeFlowProfile = {
  HERO_FIRST: "hero_first",
  HEADLINE_FIRST: "headline_first",
  DIAGONAL: "diagonal",
  VERTICAL_STACK: "vertical_stack",
} as const;

export type EyeFlowProfileId = (typeof EyeFlowProfile)[keyof typeof EyeFlowProfile];

export const HierarchyLevel = {
  HERO: "hero",
  HEADLINE: "headline",
  BENEFITS: "benefits",
  BADGE: "badge",
  CTA: "cta",
  BACKGROUND: "background",
} as const;

export type HierarchyLevelId = (typeof HierarchyLevel)[keyof typeof HierarchyLevel];

export type LayoutTemplateDefinition = {
  id: LayoutTemplateId;
  name: string;
  summary: string;
};

/** Chapter 4.12 — layout section (geometry owner, not scene/story/prompt) */
export type LayoutSection = {
  templateId: LayoutTemplateId;
  heroArea: LayoutRect;
  headlineArea: LayoutRect;
  benefitsArea: LayoutRect;
  badgeArea: LayoutRect;
  ctaArea: LayoutRect;
  safeZones: LayoutRect[];
  visualHierarchy: HierarchyLevelId[];
  whiteSpace: number;
  eyeFlow: EyeFlowProfileId;
  compositionBlueprint: CompositionBlueprint;
  /** Normalized 0.0..1.0 */
  confidence: number;
};

export type CompositionDirectorContext = {
  productCategory: string;
  marketplace: string;
  creativeGoal: string;
  priceSegment: string;
  productCutout: boolean;
  aspectRatio: string;
  storyType?: string;
  commercialGoal?: string;
  primaryEmotion?: string;
  sceneType?: string;
  environment?: string;
  mustLeaveHeadlineSpace: boolean;
  mustLeaveBadgeSpace: boolean;
  mustLeaveBenefitsSpace: boolean;
  mustAvoidHeroOverlap: boolean;
};

export type CompositionExplainabilityReport = {
  agentId: "composition-director";
  selectedTemplate: LayoutTemplateId;
  alternativesConsidered: LayoutTemplateId[];
  rejectedAlternatives: { id: LayoutTemplateId; reason: string }[];
  storyInfluences: string[];
  sceneInfluences: string[];
  constraintsApplied: string[];
  commercialValue: string;
  reasoning: string[];
};

export type CompositionValidationReport = {
  valid: boolean;
  violations: string[];
  section?: LayoutSection;
};

export type CompositionFailureCode =
  | "HERO_OVERLAY_CONFLICT"
  | "MISSING_EYE_FLOW"
  | "INSUFFICIENT_WHITE_SPACE"
  | "OVERLOADED_LAYOUT"
  | "NO_VISUAL_HIERARCHY"
  | "CONTAINS_SCENE_DECISION"
  | "CONTAINS_PROMPT";

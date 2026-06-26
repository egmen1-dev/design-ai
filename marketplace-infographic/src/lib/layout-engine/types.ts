import type { ProductCategory } from "@/lib/product-analysis";
import type { CompositionLayout } from "@/lib/composition/types";

/** Смысл карточки — только текст и идея, без координат */
export type CardMeaning = {
  title: string;
  subtitle: string;
  feature: string;
  badge: string;
  emotion: string;
  style: string;
  priority: "product" | "text" | "balanced";
};

export type LayoutTemplateId =
  | "hero_left"
  | "hero_right"
  | "premium"
  | "magazine"
  | "minimal"
  | "poster"
  | "lifestyle"
  | "studio"
  | "technical"
  | "luxury"
  | "diagonal"
  | "floating"
  | "split"
  | "focus"
  | "grid"
  | "asymmetric"
  | "editorial"
  | "modern"
  | "glass"
  | "commercial";

export type ProductShapeHint = "wide" | "tall" | "standard";

export type LayoutTemplate = {
  id: LayoutTemplateId;
  label: string;
  textSide: "left" | "right" | "top";
  productScale: number;
  productCenterX: number;
  productCenterY: number;
  productCenterYWide: number;
  rotationDeg: number;
  headlineTop: number;
  headlineWidth: number;
  headlineMaxHeightPct: number;
  featureSide: "left" | "right" | "bottom";
  suitsWide: boolean;
  suitsTall: boolean;
  suitsPriority: CardMeaning["priority"][];
};

export type LayoutEngineInput = {
  meaning: CardMeaning;
  category: ProductCategory;
  productShape?: ProductShapeHint;
  seed?: string;
  templateId?: LayoutTemplateId;
};

export type LayoutQualityIssue = {
  id: string;
  message: string;
};

export type LayoutQualityResult = {
  passed: boolean;
  issues: LayoutQualityIssue[];
};

export type DesignScoreDimension = {
  id: string;
  label: string;
  score: number;
};

export type DesignScoreResult = {
  total: number;
  passed: boolean;
  dimensions: DesignScoreDimension[];
};

export type ProfessionalLayoutResult = {
  layout: CompositionLayout;
  templateId: LayoutTemplateId;
  designScore: DesignScoreResult;
  quality: LayoutQualityResult;
  headlineFontPx: number;
  attempts: number;
  seed: string;
};

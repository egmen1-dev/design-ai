import type { ProductCategory } from "@/lib/product-analysis";

/** Главный визуальный хук — почему покупатель остановит взгляд */
export type VisualHookType =
  | "oversized_product"
  | "premium_badge"
  | "emotional_background"
  | "dynamic_diagonal"
  | "spec_highlight"
  | "luxury_minimal"
  | "lifestyle_scene"
  | "tech_showcase"
  | "gift_bundle"
  | "contrast_pop"
  | "editorial_typography"
  | "power_number";

export type VisualHook = {
  type: VisualHookType | string;
  reason: string;
  confidence: number;
};

export type Stage1ProductAnalysis = {
  category: string;
  dimensions?: string;
  shape?: string;
  materials?: string[];
  color?: string;
  purpose?: string;
  priceSegment?: string;
  emotionalPerception?: string;
  targetAudience?: string;
};

export type Stage2ArtisticConcept = {
  concept: string;
  creativeDirection: string;
  mood: string;
  references?: string[];
  whyThisConcept: string;
};

export type Stage3Composition = {
  mainSubject: string;
  eyeFlow: string;
  textPlacement: string;
  plaquePlacement: string;
  negativeSpace: string;
  balance: string;
  depth: string;
  perspective: string;
};

export type Stage4Typography = {
  fontStyle: string;
  weight: string;
  sizeStrategy: string;
  spacing: string;
  textColor: string;
  contrastLevel: string;
  accents: string;
  rationale: string;
};

export type Stage5ColorSystem = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  textColor: string;
  plaqueColor: string;
  contrastLevel: string;
  systemRationale: string;
};

export type Stage6Decorations = {
  useDecorations: boolean;
  elements: string[];
  rationale: string;
};

export type Stage7SelfReview = {
  visualBalance: number;
  readability: number;
  professionalism: number;
  categoryFit: number;
  premiumFeel: number;
  conversionPotential: number;
  overallScore: number;
  revisions?: string[];
};

export type DesignProcessFoundation = {
  stage1: Stage1ProductAnalysis;
  visualHook: VisualHook;
  stage2: Stage2ArtisticConcept;
};

export type DesignProcess = {
  stage1: Stage1ProductAnalysis;
  visualHook: VisualHook;
  stage2: Stage2ArtisticConcept;
  stage3?: Stage3Composition;
  stage4?: Stage4Typography;
  stage5?: Stage5ColorSystem;
  stage6?: Stage6Decorations;
  stage7?: Stage7SelfReview;
};

export type FoundationPromptInput = {
  productPrompt: string;
  category: ProductCategory;
  priceSegment: string;
  style: string;
};

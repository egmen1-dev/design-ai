import type { ProductCategory } from "@/lib/product-analysis";
import type { InfographicStyle } from "@/lib/design-trends";
import type { CompositionLayout } from "@/lib/composition/types";

/** Независимые параметры вместо фиксированного style="premium" */
export type DesignDNA = {
  productDominance: number;
  negativeSpace: number;
  symmetry: number;
  visualEnergy: number;
  minimalism: number;
  luxury: number;
  decorDensity: number;
  textDensity: number;
  lightingDrama: number;
  depth: number;
  contrast: number;
  colorMood: number;
  typographyWeight: number;
};

export type CompositionScenarioId =
  | "hero_product"
  | "editorial"
  | "dynamic_diagonal"
  | "minimal_premium"
  | "asymmetric"
  | "floating_product"
  | "split_layout"
  | "focus_frame"
  | "luxury_advertising"
  | "commercial_studio"
  | "lifestyle"
  | "tech_showcase";

export type ScenarioBiases = {
  productCenterX: [number, number];
  productCenterY: [number, number];
  productWidth: [number, number];
  productHeight: [number, number];
  rotationDeg: [number, number];
  textSide: "left" | "right" | "auto";
  headlineTop: [number, number];
  headlineWidth: [number, number];
  panelSpread: [number, number];
};

export type CompositionScenario = {
  id: CompositionScenarioId;
  label: string;
  biases: ScenarioBiases;
  /** Вес при выборе сценария по DNA */
  dnaAffinity: (dna: DesignDNA, category: ProductCategory) => number;
};

export type CompositionEngineInput = {
  category: ProductCategory;
  layout: "marketplace" | "hero" | "cards" | "split" | "minimal";
  bulletCount: number;
  hasLeftPanel: boolean;
  hasRightSidebar: boolean;
  hasLogo?: boolean;
  objectScale?: number;
  styleHint?: InfographicStyle;
  seed?: string;
};

export type CompositionScore = {
  total: number;
  balance: number;
  productSize: number;
  whitespace: number;
  textDensity: number;
  readability: number;
  contrast: number;
  overlap: number;
  safeArea: number;
};

export type CompositionResult = {
  layout: CompositionLayout;
  dna: DesignDNA;
  scenarioId: CompositionScenarioId;
  score: CompositionScore;
  seed: string;
  attempts: number;
};

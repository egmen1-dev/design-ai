import type { ProductCategory } from "@/lib/product-analysis";

export type CompositionZone = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ProductPlacement = CompositionZone & {
  centerX: number;
  centerY: number;
  maxWidthPct: number;
  maxHeightPct: number;
  areaPct: number;
  rotationDeg: number;
};

export type TextZone = CompositionZone & {
  fontSizePct: number;
};

export type PlaqueSizes = {
  smallWidthPct: number;
  mediumWidthPct: number;
  largeWidthPct: number;
  heightPct: number;
  maxTotalAreaPct: number;
};

export type CompositionMetrics = {
  productAreaPct: number;
  textAreaPct: number;
  plaqueAreaPct: number;
  whitespacePct: number;
  overlapPct: number;
  visualCenterX: number;
  visualCenterY: number;
  minEdgeInsetPct: number;
};

export type CompositionLayout = {
  canvas: { width: number; height: number };
  safeInsetPct: number;
  product: ProductPlacement;
  headline: TextZone;
  subtitle: TextZone;
  leftPanel: CompositionZone;
  rightSidebar: CompositionZone;
  bullets: CompositionZone & { itemHeightPct: number; gapPct: number; maxCount: number };
  plaques: PlaqueSizes;
  icon: { sizePct: number; textGapPct: number };
  logo?: CompositionZone;
  textSide: "left" | "right";
  metrics: CompositionMetrics;
  valid: boolean;
  issues: string[];
  adjustments: string[];
  /** Design DNA и сценарий этой генерации */
  scenarioId?: string;
  dna?: import("@/lib/design/types").DesignDNA;
  seed?: string;
  score?: number;
};

export type CompositionInput = {
  category: ProductCategory;
  layout: "marketplace" | "hero" | "cards" | "split" | "minimal";
  bulletCount: number;
  hasLeftPanel: boolean;
  hasRightSidebar: boolean;
  hasLogo?: boolean;
  objectScale?: number;
  styleHint?: import("@/lib/design-trends").InfographicStyle;
  seed?: string;
};

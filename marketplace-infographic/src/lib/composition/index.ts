export { WB_COVER, xPct, yPct, zoneAreaPct, clampPct } from "./canvas";
export { computeComposition } from "./engine";
export { validateAndAdjustComposition } from "./validate";
export { compositionToCssBlock } from "./css-vars";
export { getCategoryRules, resolveProductDimensions } from "./category-rules";
export type {
  CompositionInput,
  CompositionLayout,
  CompositionMetrics,
  CompositionZone,
  ProductPlacement,
  TextZone,
} from "./types";

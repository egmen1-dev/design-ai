import type { ProductCategory } from "@/lib/product-analysis";
import { clampPct } from "./canvas";

export type CategoryProductRules = {
  areaPct: [number, number];
  heightPct: [number, number];
  widthPct: [number, number];
  defaultCenterX: number;
  defaultCenterY: number;
};

const RULES: Record<ProductCategory, CategoryProductRules> = {
  cosmetics: {
    areaPct: [70, 80],
    heightPct: [74, 82],
    widthPct: [38, 52],
    defaultCenterX: 52,
    defaultCenterY: 54,
  },
  electronics: {
    areaPct: [60, 70],
    heightPct: [68, 76],
    widthPct: [48, 62],
    defaultCenterX: 54,
    defaultCenterY: 53,
  },
  fashion: {
    areaPct: [50, 65],
    heightPct: [62, 72],
    widthPct: [42, 58],
    defaultCenterX: 52,
    defaultCenterY: 52,
  },
  home_appliances: {
    areaPct: [50, 60],
    heightPct: [60, 70],
    widthPct: [50, 65],
    defaultCenterX: 53,
    defaultCenterY: 51,
  },
  kids: {
    areaPct: [60, 72],
    heightPct: [66, 76],
    widthPct: [44, 58],
    defaultCenterX: 52,
    defaultCenterY: 54,
  },
  sport: {
    areaPct: [55, 68],
    heightPct: [64, 74],
    widthPct: [44, 58],
    defaultCenterX: 54,
    defaultCenterY: 53,
  },
  auto: {
    areaPct: [50, 65],
    heightPct: [62, 72],
    widthPct: [48, 62],
    defaultCenterX: 53,
    defaultCenterY: 52,
  },
  garden_tools: {
    areaPct: [58, 68],
    heightPct: [78, 88],
    widthPct: [36, 48],
    defaultCenterX: 55,
    defaultCenterY: 56,
  },
  food: {
    areaPct: [62, 75],
    heightPct: [68, 78],
    widthPct: [40, 55],
    defaultCenterX: 52,
    defaultCenterY: 54,
  },
  premium: {
    areaPct: [65, 78],
    heightPct: [70, 80],
    widthPct: [40, 54],
    defaultCenterX: 52,
    defaultCenterY: 54,
  },
  generic: {
    areaPct: [55, 72],
    heightPct: [68, 82],
    widthPct: [38, 58],
    defaultCenterX: 52,
    defaultCenterY: 54,
  },
};

export function getCategoryRules(category: ProductCategory): CategoryProductRules {
  return RULES[category] ?? RULES.generic;
}

export function resolveProductDimensions(
  category: ProductCategory,
  objectScale = 0.78,
): { maxWidthPct: number; maxHeightPct: number; areaPct: number; centerX: number; centerY: number } {
  const rules = getCategoryRules(category);
  const scaleBias = (objectScale - 0.5) * 12;

  const maxHeightPct = clampPct(
    (rules.heightPct[0] + rules.heightPct[1]) / 2 + scaleBias,
    rules.heightPct[0],
    rules.heightPct[1],
  );
  const maxWidthPct = clampPct(
    (rules.widthPct[0] + rules.widthPct[1]) / 2 + scaleBias * 0.6,
    rules.widthPct[0],
    rules.widthPct[1],
  );
  const areaPct = (maxWidthPct / 100) * (maxHeightPct / 100) * 100;

  return {
    maxWidthPct,
    maxHeightPct,
    areaPct,
    centerX: rules.defaultCenterX,
    centerY: rules.defaultCenterY,
  };
}

import type { CompositionLayout, CompositionZone } from "@/lib/composition/types";
import { xPct, yPct } from "@/lib/composition/canvas";

export type SceneGraphProductActualRef = {
  x: number;
  y: number;
  width: number;
  height: number;
  areaRatio: number;
  widthRatio: number;
  heightRatio: number;
  visibleArea?: number;
  source: string;
  confidence: number;
};

export type OverlayActualGateDecision = "actual" | "planned";

export type OverlayActualGateInput = {
  productPrompt?: string;
  productCategory?: string;
  aspectRatio?: number;
  wideHeroStrategyApplied?: boolean;
  /** Signed compositor drift: actual area ratio − planned area ratio. */
  productAreaDrift?: number;
  sceneGraphProductActual?: SceneGraphProductActualRef;
  compositionLayout?: CompositionLayout;
  plannedOverlapRisk?: number;
  actualOverlapRisk?: number;
  law003RegressionWithActual?: boolean;
};

export type OverlayActualGateResult = {
  decision: OverlayActualGateDecision;
  reasons: string[];
  confidence: number;
};

const WIDE_FURNITURE_PATTERN =
  /матрас|mattress|диван|sofa|couch|кровать|bed|ковёр|ковер|rug|carpet|стол|table/i;
const TOY_PATTERN = /игрушк|toy|children|детск|kids/i;

const HIGH_OVERLAP_RISK = 0.25;
const OVERLAP_RISK_DELTA_BLOCK = 0.08;
const AREA_DRIFT_ENABLE = 0.08;
const WIDE_ASPECT_THRESHOLD = 1.8;
const LOW_ASPECT_UNKNOWN_THRESHOLD = 1.5;
const SMALL_BBOX_AREA_RATIO = 0.25;

type OverlayProductBbox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function zoneLooksLikePercent(zone: CompositionZone): boolean {
  return zone.left <= 100 && zone.top <= 100 && zone.width <= 100 && zone.height <= 100;
}

function compositionZoneToPixels(
  zone: CompositionZone,
  canvas: { width: number; height: number },
): OverlayProductBbox {
  if (zoneLooksLikePercent(zone)) {
    return {
      left: xPct(zone.left, canvas),
      top: yPct(zone.top, canvas),
      width: xPct(zone.width, canvas),
      height: yPct(zone.height, canvas),
    };
  }
  return { left: zone.left, top: zone.top, width: zone.width, height: zone.height };
}

function zonesOverlap(a: OverlayProductBbox, b: OverlayProductBbox): boolean {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

function countTextZoneOverlapsWithProduct(
  compositionLayout: CompositionLayout,
  productBbox: OverlayProductBbox,
): number {
  const canvas = compositionLayout.canvas;
  const textZones = [
    compositionLayout.headline,
    compositionLayout.subtitle,
    compositionLayout.leftPanel,
    compositionLayout.bullets,
  ];
  let overlaps = 0;
  for (const zone of textZones) {
    const px = compositionZoneToPixels(zone, canvas);
    if (zonesOverlap(px, productBbox)) overlaps += 1;
  }
  return overlaps;
}

function productActualToOverlayBbox(actual: SceneGraphProductActualRef): OverlayProductBbox {
  return { left: actual.x, top: actual.y, width: actual.width, height: actual.height };
}

function resolvePlannedProductBbox(input: OverlayActualGateInput): OverlayProductBbox | undefined {
  const layout = input.compositionLayout;
  if (!layout?.product || layout.product.width <= 0 || layout.product.height <= 0) return undefined;
  return compositionZoneToPixels(layout.product, layout.canvas);
}

function normalizeText(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function isToyProduct(input: OverlayActualGateInput): boolean {
  const category = normalizeText(input.productCategory);
  const prompt = normalizeText(input.productPrompt);
  return category === "toys" || TOY_PATTERN.test(prompt) || TOY_PATTERN.test(category);
}

function isWideFurnitureProduct(input: OverlayActualGateInput): boolean {
  const category = normalizeText(input.productCategory);
  const prompt = normalizeText(input.productPrompt);
  return (
    category === "home" ||
    category === "furniture" ||
    WIDE_FURNITURE_PATTERN.test(prompt) ||
    WIDE_FURNITURE_PATTERN.test(category)
  );
}

function isUnknownCategoryLowAspect(input: OverlayActualGateInput): boolean {
  const category = normalizeText(input.productCategory);
  const aspect = input.aspectRatio ?? 0;
  const unknown =
    !category || category === "generic" || category === "unknown" || category === "other";
  return unknown && aspect > 0 && aspect < LOW_ASPECT_UNKNOWN_THRESHOLD;
}

function isSmallCenteredActualBbox(
  actual: SceneGraphProductActualRef,
  canvas: { width: number; height: number },
): boolean {
  if (actual.areaRatio > SMALL_BBOX_AREA_RATIO) return false;
  const aspect = actual.width / Math.max(actual.height, 1);
  if (aspect >= 1.5) return false;
  const centerX = (actual.x + actual.width / 2) / canvas.width;
  const centerY = (actual.y + actual.height / 2) / canvas.height;
  return centerX >= 0.35 && centerX <= 0.65 && centerY >= 0.35 && centerY <= 0.65;
}

export function estimateOverlayOverlapRisk(
  compositionLayout: CompositionLayout | undefined,
  productBbox: { left: number; top: number; width: number; height: number } | undefined,
): number {
  if (!compositionLayout || !productBbox) return 0;
  const overlaps = countTextZoneOverlapsWithProduct(compositionLayout, productBbox);
  const overlapPct = compositionLayout.metrics?.overlapPct ?? 0;
  return clamp01(overlaps * 0.25 + (overlapPct / 100) * 0.5);
}

function resolveActualProductBbox(input: OverlayActualGateInput): OverlayProductBbox | undefined {
  if (!input.sceneGraphProductActual) return undefined;
  return productActualToOverlayBbox(input.sceneGraphProductActual);
}

export function estimateLaw003RegressionWithActual(input: OverlayActualGateInput): boolean {
  if (input.law003RegressionWithActual != null) return input.law003RegressionWithActual;
  const layout = input.compositionLayout;
  const actual = input.sceneGraphProductActual;
  if (!layout || !actual) return false;

  const plannedZone = layout.product;
  if (!plannedZone?.width || !plannedZone.height) return false;

  const canvas = layout.canvas;
  const plannedPx = compositionZoneToPixels(plannedZone, canvas);
  const plannedAreaRatio = (plannedPx.width * plannedPx.height) / (canvas.width * canvas.height);
  const whitespacePct = layout.metrics?.whitespacePct ?? 100;
  return actual.areaRatio > plannedAreaRatio + 0.05 && whitespacePct < 38;
}

function resolveOverlapRisks(input: OverlayActualGateInput): {
  planned: number;
  actual: number;
} {
  const planned =
    input.plannedOverlapRisk ??
    estimateOverlayOverlapRisk(input.compositionLayout, resolvePlannedProductBbox(input));
  const actual =
    input.actualOverlapRisk ??
    estimateOverlayOverlapRisk(input.compositionLayout, resolveActualProductBbox(input));
  return { planned, actual };
}

/** Explain why overlay should read planned vs compositor actual geometry. */
export function explainSceneGraphActualOverlayDecision(
  input: OverlayActualGateInput,
): OverlayActualGateResult {
  const reasons: string[] = [];

  if (!input.sceneGraphProductActual) {
    return { decision: "planned", reasons: ["no_product_actual"], confidence: 1 };
  }

  if (isToyProduct(input)) {
    return { decision: "planned", reasons: ["toy_category"], confidence: 0.92 };
  }

  const canvas = input.compositionLayout?.canvas;
  if (canvas && isSmallCenteredActualBbox(input.sceneGraphProductActual, canvas)) {
    return {
      decision: "planned",
      reasons: ["small_centered_actual_bbox"],
      confidence: 0.85,
    };
  }

  const overlap = resolveOverlapRisks(input);
  if (overlap.actual > overlap.planned + OVERLAP_RISK_DELTA_BLOCK) {
    return {
      decision: "planned",
      reasons: ["actual_overlap_risk_elevated"],
      confidence: 0.88,
    };
  }

  if (estimateLaw003RegressionWithActual(input)) {
    return {
      decision: "planned",
      reasons: ["law003_regression_risk"],
      confidence: 0.86,
    };
  }

  if (isUnknownCategoryLowAspect(input)) {
    return {
      decision: "planned",
      reasons: ["unknown_category_low_aspect"],
      confidence: 0.8,
    };
  }

  if ((input.aspectRatio ?? 0) >= WIDE_ASPECT_THRESHOLD) {
    reasons.push("wide_aspect_ratio");
  }
  if (isWideFurnitureProduct(input)) {
    reasons.push("wide_furniture_category");
  }
  if (input.wideHeroStrategyApplied) {
    reasons.push("wide_hero_strategy");
  }

  const drift = Math.abs(input.productAreaDrift ?? 0);
  if (drift > AREA_DRIFT_ENABLE && overlap.actual < HIGH_OVERLAP_RISK) {
    reasons.push("significant_area_drift");
  }

  if (reasons.length > 0) {
    const confidence = Math.min(0.95, 0.78 + reasons.length * 0.05);
    return { decision: "actual", reasons, confidence };
  }

  return { decision: "planned", reasons: ["default_planned"], confidence: 0.7 };
}

export function shouldUseSceneGraphActualForOverlay(input: OverlayActualGateInput): boolean {
  return explainSceneGraphActualOverlayDecision(input).decision === "actual";
}

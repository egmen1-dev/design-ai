import type { SceneGraph } from "./SceneGraph";
import { evaluateSceneGraphLaw003 } from "./SceneGraphConstitutionMirror";

export const SCENE_GRAPH_LAW003_V2_VERSION = "scenegraph-law003-v2" as const;

export type SceneGraphLaw003V2Metrics = {
  productAreaRatio: number;
  overlayDensity: number;
  heroTextRatio: number;
  backgroundEmptyAreaEstimate: number;
  productDominanceScore: number;
  aspectRatio: number;
};

export type SceneGraphLaw003V2Result = {
  passed: boolean;
  score: number;
  version: typeof SCENE_GRAPH_LAW003_V2_VERSION;
  oldPassed: boolean;
  disagreement: boolean;
  reason: string;
  metrics: SceneGraphLaw003V2Metrics;
};

const PRODUCT_PASS_MIN = 0.32;
const PRODUCT_FAIL_MAX = 0.25;
const HERO_TEXT_PASS_MIN = 2;
const HERO_TEXT_FAIL_MAX = 1.6;
const OVERLAY_MIN = 0.07;
const OVERLAY_MAX = 0.3;
const OVERLAY_FAIL_MAX = 0.45;
const BACKGROUND_EMPTY_MAX = 0.5;
const WIDE_ASPECT_THRESHOLD = 2.0;
const DOMINANCE_WARN = 0.45;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveCanvas(graph: SceneGraph) {
  return graph.canvas.actual ?? graph.canvas.planned;
}

function resolveProductAreaRatio(graph: SceneGraph): number {
  const actual = graph.product.actual;
  if (actual?.areaRatio != null && actual.areaRatio > 0) return actual.areaRatio;
  if (actual?.visibleAreaRatio != null && actual.visibleAreaRatio > 0) return actual.visibleAreaRatio;
  if (actual?.width && actual.height) {
    const canvas = resolveCanvas(graph);
    const area = canvas.width * canvas.height;
    return area > 0 ? (actual.width * actual.height) / area : 0;
  }
  const productAreaPct = graph.composition.actual?.productAreaPct;
  if (productAreaPct != null) return productAreaPct / 100;
  return 0;
}

function resolveOverlayDensity(graph: SceneGraph): number {
  const actualDensity =
    graph.overlay.actual?.density ?? graph.whitespace.actual?.overlayDensity ?? undefined;
  if (actualDensity != null) return clamp01(actualDensity);
  const overlayArea = graph.overlay.actual?.actualArea;
  if (overlayArea != null && overlayArea > 0) return clamp01(overlayArea);
  const textAreaPct = graph.typography.actual?.textAreaPct ?? 0;
  if (textAreaPct > 0) return clamp01(textAreaPct / 100);
  return 0;
}

function resolveTextAreaRatio(graph: SceneGraph): number {
  const textAreaPct = graph.typography.actual?.textAreaPct;
  if (textAreaPct != null) return clamp01(textAreaPct / 100);
  const canvas = resolveCanvas(graph);
  const typography = graph.typography.actual ?? graph.typography.planned;
  if (typography?.width && typography.height && canvas.width && canvas.height) {
    return clamp01((typography.width * typography.height) / (canvas.width * canvas.height));
  }
  const productAreaPct = graph.composition.actual?.productAreaPct ?? 0;
  return clamp01(Math.max(productAreaPct * 0.2, 1) / 100);
}

function resolveBadgeAreaRatio(graph: SceneGraph): number {
  const overlayArea = graph.overlay.actual?.actualArea;
  const textAreaRatio = resolveTextAreaRatio(graph);
  if (overlayArea != null && overlayArea > 0) {
    return clamp01(Math.max(0, overlayArea - textAreaRatio));
  }
  const badgeCount = graph.badges.actual?.count ?? 0;
  return badgeCount > 0 ? clamp01(badgeCount * 0.02) : 0;
}

function resolveAspectRatio(graph: SceneGraph): number {
  const actual = graph.product.actual;
  const canvas = resolveCanvas(graph);
  if (actual?.width && actual.height && actual.height > 0) {
    return actual.width / actual.height;
  }
  if (actual?.widthRatio && actual.heightRatio && actual.heightRatio > 0) {
    const w = actual.widthRatio * canvas.width;
    const h = actual.heightRatio * canvas.height;
    return h > 0 ? w / h : 1;
  }
  const planned = graph.product.planned;
  if (planned?.width && planned.height && planned.height > 0) {
    return planned.width / planned.height;
  }
  return 1;
}

function resolveWidthHeightRatios(graph: SceneGraph): { widthRatio: number; heightRatio: number } {
  const actual = graph.product.actual;
  const canvas = resolveCanvas(graph);
  return {
    widthRatio: actual?.widthRatio ?? (actual?.width && canvas.width ? actual.width / canvas.width : 0),
    heightRatio:
      actual?.heightRatio ?? (actual?.height && canvas.height ? actual.height / canvas.height : 0),
  };
}

function estimateProductDominanceScore(
  productAreaRatio: number,
  backgroundEmptyAreaEstimate: number,
  widthRatio: number,
  heightRatio: number,
): number {
  let score = 100;
  if (productAreaRatio < DOMINANCE_WARN) {
    score -= (DOMINANCE_WARN - productAreaRatio) * 120;
  } else {
    score += Math.min(8, (productAreaRatio - DOMINANCE_WARN) * 20);
  }
  if (widthRatio > 0 && widthRatio < DOMINANCE_WARN) {
    score -= (DOMINANCE_WARN - widthRatio) * 60;
  }
  if (heightRatio > 0 && heightRatio < DOMINANCE_WARN) {
    score -= (DOMINANCE_WARN - heightRatio) * 60;
  }
  if (backgroundEmptyAreaEstimate > DOMINANCE_WARN) {
    score -= (backgroundEmptyAreaEstimate - DOMINANCE_WARN) * 90;
  }
  return clampScore(score);
}

function estimateBackgroundEmptyArea(
  productAreaRatio: number,
  overlayDensity: number,
  textAreaRatio: number,
  badgeAreaRatio: number,
): number {
  return clamp01(1 - productAreaRatio - overlayDensity - textAreaRatio - badgeAreaRatio);
}

function isWideCategory(graph: SceneGraph): boolean {
  const category = (graph.metadata.productCategory ?? "").toLowerCase();
  return /mattress|матрас|диван|кровать|ковёр|ковер|стол|furniture|мебель/.test(category);
}

function hasWideTemplate(graph: SceneGraph): boolean {
  const mode = (graph.metadata.layoutMode ?? "").toLowerCase();
  if (/wide|mattress|furniture|fit-width|bottom_hero/.test(mode)) return true;
  return graph.metadata.sources.some((source) => /wide/i.test(source));
}

function isWideGeometryLimit(graph: SceneGraph, productAreaRatio: number, aspectRatio: number): boolean {
  const isWide = aspectRatio >= WIDE_ASPECT_THRESHOLD || isWideCategory(graph);
  return isWide && productAreaRatio < PRODUCT_FAIL_MAX;
}

function collectMetrics(graph: SceneGraph): SceneGraphLaw003V2Metrics {
  const productAreaRatio = resolveProductAreaRatio(graph);
  const overlayDensity = resolveOverlayDensity(graph);
  const textAreaRatio = resolveTextAreaRatio(graph);
  const badgeAreaRatio = resolveBadgeAreaRatio(graph);
  const aspectRatio = resolveAspectRatio(graph);
  const productAreaPct =
    graph.composition.actual?.productAreaPct ?? productAreaRatio * 100;
  const textAreaPct = graph.typography.actual?.textAreaPct ?? Math.max(productAreaPct * 0.2, 1);
  const heroTextRatio = productAreaPct / Math.max(textAreaPct, 1);
  const backgroundEmptyAreaEstimate = estimateBackgroundEmptyArea(
    productAreaRatio,
    overlayDensity,
    textAreaRatio,
    badgeAreaRatio,
  );
  const { widthRatio, heightRatio } = resolveWidthHeightRatios(graph);
  const productDominanceScore = estimateProductDominanceScore(
    productAreaRatio,
    backgroundEmptyAreaEstimate,
    widthRatio,
    heightRatio,
  );

  return {
    productAreaRatio,
    overlayDensity,
    heroTextRatio,
    backgroundEmptyAreaEstimate,
    productDominanceScore,
    aspectRatio,
  };
}

function law003V2Score(metrics: SceneGraphLaw003V2Metrics): number {
  let score = 100;
  if (metrics.productAreaRatio < PRODUCT_PASS_MIN) {
    score -= (PRODUCT_PASS_MIN - metrics.productAreaRatio) * 90;
  }
  if (metrics.heroTextRatio < HERO_TEXT_PASS_MIN) {
    score -= (HERO_TEXT_PASS_MIN - metrics.heroTextRatio) * 18;
  }
  if (metrics.overlayDensity < OVERLAY_MIN) {
    score -= (OVERLAY_MIN - metrics.overlayDensity) * 70;
  }
  if (metrics.overlayDensity > OVERLAY_MAX) {
    score -= (metrics.overlayDensity - OVERLAY_MAX) * 70;
  }
  if (metrics.backgroundEmptyAreaEstimate > BACKGROUND_EMPTY_MAX) {
    score -= (metrics.backgroundEmptyAreaEstimate - BACKGROUND_EMPTY_MAX) * 110;
  }
  if (metrics.productDominanceScore < 60) {
    score -= (60 - metrics.productDominanceScore) * 0.4;
  }
  return clampScore(score);
}

function evaluatePassFail(
  graph: SceneGraph,
  metrics: SceneGraphLaw003V2Metrics,
): { passed: boolean; reason: string } {
  if (metrics.heroTextRatio < HERO_TEXT_FAIL_MAX) {
    return {
      passed: false,
      reason: `Hero/text ratio ${metrics.heroTextRatio.toFixed(2)} below fail threshold ${HERO_TEXT_FAIL_MAX}`,
    };
  }
  if (metrics.overlayDensity > OVERLAY_FAIL_MAX) {
    return {
      passed: false,
      reason: `Overlay density ${metrics.overlayDensity.toFixed(2)} above fail threshold ${OVERLAY_FAIL_MAX}`,
    };
  }
  if (isWideGeometryLimit(graph, metrics.productAreaRatio, metrics.aspectRatio) && !hasWideTemplate(graph)) {
    return {
      passed: false,
      reason: "Wide product geometry limit without wide layout template",
    };
  }
  if (metrics.productAreaRatio < PRODUCT_FAIL_MAX) {
    return {
      passed: false,
      reason: `Product area ratio ${metrics.productAreaRatio.toFixed(2)} below fail threshold ${PRODUCT_FAIL_MAX}`,
    };
  }

  const passChecks = [
    metrics.productAreaRatio >= PRODUCT_PASS_MIN,
    metrics.heroTextRatio >= HERO_TEXT_PASS_MIN,
    metrics.overlayDensity >= OVERLAY_MIN && metrics.overlayDensity <= OVERLAY_MAX,
    metrics.backgroundEmptyAreaEstimate <= BACKGROUND_EMPTY_MAX,
  ];

  if (passChecks.every(Boolean)) {
    return {
      passed: true,
      reason: "Scene fill, hero/text balance, overlay density, and background empty area within V2 bounds",
    };
  }

  const misses: string[] = [];
  if (metrics.productAreaRatio < PRODUCT_PASS_MIN) {
    misses.push(`product area ${metrics.productAreaRatio.toFixed(2)} < ${PRODUCT_PASS_MIN}`);
  }
  if (metrics.heroTextRatio < HERO_TEXT_PASS_MIN) {
    misses.push(`hero/text ${metrics.heroTextRatio.toFixed(2)} < ${HERO_TEXT_PASS_MIN}`);
  }
  if (metrics.overlayDensity < OVERLAY_MIN || metrics.overlayDensity > OVERLAY_MAX) {
    misses.push(`overlay density ${metrics.overlayDensity.toFixed(2)} outside ${OVERLAY_MIN}-${OVERLAY_MAX}`);
  }
  if (metrics.backgroundEmptyAreaEstimate > BACKGROUND_EMPTY_MAX) {
    misses.push(
      `background empty ${metrics.backgroundEmptyAreaEstimate.toFixed(2)} > ${BACKGROUND_EMPTY_MAX}`,
    );
  }

  return {
    passed: false,
    reason: misses.join("; ") || "SceneGraph LAW_003 V2 bounds not met",
  };
}

/** SceneGraph-based LAW_003 formula v2 (geometry-first, non-blocking). */
export function evaluateSceneGraphLaw003V2(graph: SceneGraph): SceneGraphLaw003V2Result {
  const v1 = evaluateSceneGraphLaw003(graph);
  const metrics = collectMetrics(graph);
  const { passed, reason } = evaluatePassFail(graph, metrics);

  return {
    passed,
    score: law003V2Score(metrics),
    version: SCENE_GRAPH_LAW003_V2_VERSION,
    oldPassed: v1.passed,
    disagreement: v1.passed !== passed,
    reason,
    metrics,
  };
}

/** Compare SceneGraph LAW_003 mirror V1 vs V2 on the same graph. */
export function compareLaw003V1V2(graph: SceneGraph): SceneGraphLaw003V2Result {
  return evaluateSceneGraphLaw003V2(graph);
}

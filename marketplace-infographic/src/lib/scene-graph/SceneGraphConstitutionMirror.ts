import type { SceneGraph } from "./SceneGraph";
import {
  LAW003_MAX_WHITESPACE_PCT,
  LAW003_MIN_WHITESPACE_PCT,
  LAW003_OVERLAY_DENSITY_SAFE,
  LAW003_PRODUCT_AREA_GOOD,
} from "@/lib/daos/governance/law003-recalibration";
import {
  isMetricRegistryEnabled,
  isMetricRegistryShadowEnabled,
  METRIC_PRODUCT_AREA_RATIO,
  MetricRegistry,
  recordMetricShadowDiagnostic,
} from "@/lib/daos/metric-registry";
import { compareLaw003V1V2, type SceneGraphLaw003V2Result } from "./SceneGraphLaw003V2";

export type SceneGraphConstitutionSource = "actual" | "planned" | "mixed";

export type SceneGraphLaw003MirrorResult = {
  lawId: "LAW_003";
  passed: boolean;
  score: number;
  source: SceneGraphConstitutionSource;
  productAreaRatio: number;
  overlayDensity: number;
  estimatedWhitespace: number;
  reasons: string[];
};

export type SceneGraphLaw014MirrorResult = {
  lawId: "LAW_014";
  passed: boolean;
  score: number;
  overlapCount: number;
  overlapAreaRatio: number;
  contrastRatio: number;
  source: SceneGraphConstitutionSource;
  reasons: string[];
};

export type SceneGraphConstitutionMirrorResult = {
  evaluatedAt: string;
  graphStage: SceneGraph["stage"];
  law003: SceneGraphLaw003MirrorResult;
  law003V2: SceneGraphLaw003V2Result;
  law014: SceneGraphLaw014MirrorResult;
  sceneGraphConstitutionSource: SceneGraphConstitutionSource;
  passed: boolean;
  score: number;
};

type Bbox = { left: number; top: number; width: number; height: number };

const LAW014_MAX_OVERLAP_PCT = 2;
const LAW014_MIN_HERO_TEXT_RATIO = 2;
const LAW014_MAX_OVERLAP_AREA_RATIO = 0.02;

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toRatio(value?: number): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : value;
}

function geometryToBbox(geom?: { x: number; y: number; width: number; height: number }): Bbox | undefined {
  if (!geom?.width || !geom.height) return undefined;
  return { left: geom.x, top: geom.y, width: geom.width, height: geom.height };
}

function bboxArea(bbox: Bbox): number {
  return bbox.width * bbox.height;
}

function intersectionArea(a: Bbox, b: Bbox): number {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

function zonesOverlap(a: Bbox, b: Bbox): boolean {
  return intersectionArea(a, b) > 0;
}

function resolveCanvas(graph: SceneGraph) {
  return graph.canvas.actual ?? graph.canvas.planned;
}

function legacyResolveProductArea(graph: SceneGraph): {
  ratio: number;
  source: "actual" | "planned";
} {
  const actual = graph.product.actual;
  if (actual?.areaRatio != null && actual.areaRatio > 0) {
    return { ratio: actual.areaRatio, source: "actual" };
  }
  if (actual?.visibleAreaRatio != null && actual.visibleAreaRatio > 0) {
    return { ratio: actual.visibleAreaRatio, source: "actual" };
  }
  if (actual?.width && actual.height) {
    const canvas = resolveCanvas(graph);
    const area = canvas.width * canvas.height;
    return { ratio: area > 0 ? (actual.width * actual.height) / area : 0, source: "actual" };
  }

  const planned = graph.product.planned;
  const canvas = resolveCanvas(graph);
  if (planned?.width && planned.height && canvas.width && canvas.height) {
    return {
      ratio: (planned.width * planned.height) / (canvas.width * canvas.height),
      source: "planned",
    };
  }

  const productAreaPct = graph.composition.actual?.productAreaPct;
  if (productAreaPct != null) {
    return { ratio: productAreaPct / 100, source: "planned" };
  }

  return { ratio: 0, source: "planned" };
}

function resolveProductArea(graph: SceneGraph): {
  ratio: number;
  source: "actual" | "planned";
} {
  const legacy = legacyResolveProductArea(graph);
  const registryEnabled = isMetricRegistryEnabled();
  const shadowEnabled = isMetricRegistryShadowEnabled();

  if (shadowEnabled) {
    const metric = MetricRegistry.compute(METRIC_PRODUCT_AREA_RATIO, {
      kind: "scene_graph",
      graph,
      mode: "mirror",
    });
    const registryResolutionKind = metric.provenance.includes(":planned:")
      ? ("planned" as const)
      : metric.provenance.includes(":actual:")
        ? ("actual" as const)
        : legacy.source;
    recordMetricShadowDiagnostic({
      metricId: METRIC_PRODUCT_AREA_RATIO,
      mode: "mirror",
      legacyValue: legacy.ratio,
      registryValue: metric.value,
    });
    if (!registryEnabled) {
      return legacy;
    }
    return { ratio: metric.value, source: registryResolutionKind };
  }

  if (registryEnabled) {
    const metric = MetricRegistry.compute(METRIC_PRODUCT_AREA_RATIO, {
      kind: "scene_graph",
      graph,
      mode: "mirror",
    });
    const resolutionKind = metric.provenance.includes(":planned:")
      ? ("planned" as const)
      : metric.provenance.includes(":actual:")
        ? ("actual" as const)
        : legacy.source;
    return { ratio: metric.value, source: resolutionKind };
  }

  return legacy;
}

function resolvePlannedProductArea(graph: SceneGraph): number {
  const planned = graph.product.planned;
  const canvas = resolveCanvas(graph);
  if (planned?.width && planned.height && canvas.width && canvas.height) {
    return (planned.width * planned.height) / (canvas.width * canvas.height);
  }
  const productAreaPct = graph.composition.actual?.productAreaPct;
  if (productAreaPct != null) return productAreaPct / 100;
  return resolveProductArea(graph).ratio;
}

function resolveOverlayDensity(graph: SceneGraph): {
  density: number;
  source: "actual" | "planned";
} {
  const actualDensity =
    graph.overlay.actual?.density ?? graph.whitespace.actual?.overlayDensity ?? undefined;
  if (actualDensity != null) {
    return { density: clamp01(actualDensity), source: "actual" };
  }

  const textAreaPct = graph.typography.actual?.textAreaPct ?? 0;
  const plaqueAreaPct = graph.composition.actual?.overlapPct != null ? 0 : 0;
  const overlayArea = graph.overlay.actual?.actualArea;
  if (overlayArea != null && overlayArea > 0) {
    return { density: clamp01(overlayArea), source: "planned" };
  }
  if (textAreaPct > 0) {
    return { density: clamp01(textAreaPct / 100), source: "planned" };
  }
  return { density: 0, source: "planned" };
}

function estimateWhitespaceFromGraph(graph: SceneGraph): number {
  const base =
    graph.whitespace.actual?.whitespacePct ??
    graph.whitespace.planned?.whitespacePct ??
    28;

  const { ratio: factualProduct, source: productSource } = resolveProductArea(graph);
  const plannedProduct = resolvePlannedProductArea(graph);
  const productDeltaPct = factualProduct * 100 - plannedProduct * 100;

  let adjusted = base;
  if (productSource === "actual") {
    if (factualProduct >= LAW003_PRODUCT_AREA_GOOD) {
      adjusted = clampPct(base - productDeltaPct);
    } else if (productDeltaPct > 0) {
      adjusted = clampPct(base - productDeltaPct * 0.5);
    }
  }

  const { density: overlayDensity } = resolveOverlayDensity(graph);
  if (overlayDensity > LAW003_OVERLAY_DENSITY_SAFE) {
    adjusted = clampPct(adjusted + (overlayDensity - LAW003_OVERLAY_DENSITY_SAFE) * 20);
  }

  return adjusted;
}

function law003Score(whitespacePct: number, productAreaRatio: number): number {
  const wsPenalty =
    whitespacePct < LAW003_MIN_WHITESPACE_PCT
      ? (LAW003_MIN_WHITESPACE_PCT - whitespacePct) * 3
      : whitespacePct > LAW003_MAX_WHITESPACE_PCT
        ? (whitespacePct - LAW003_MAX_WHITESPACE_PCT) * 3
        : Math.abs(whitespacePct - 28) * 0.5;
  const fillPenalty = productAreaRatio < 0.15 ? (0.15 - productAreaRatio) * 120 : 0;
  return Math.max(0, Math.round(100 - wsPenalty - fillPenalty));
}

function combineSources(
  parts: Array<"actual" | "planned" | undefined>,
): SceneGraphConstitutionSource {
  const used = parts.filter((p): p is "actual" | "planned" => p === "actual" || p === "planned");
  if (!used.length) return "planned";
  if (used.every((p) => p === "actual")) return "actual";
  if (used.every((p) => p === "planned")) return "planned";
  return "mixed";
}

/** Mirror LAW_003 using SceneGraph product/overlay/whitespace nodes. */
export function evaluateSceneGraphLaw003(graph: SceneGraph): SceneGraphLaw003MirrorResult {
  const { ratio: productAreaRatio, source: productSource } = resolveProductArea(graph);
  const { density: overlayDensity, source: overlaySource } = resolveOverlayDensity(graph);
  const estimatedWhitespace = estimateWhitespaceFromGraph(graph);
  const whitespaceSource =
    graph.whitespace.actual?.whitespacePct != null ? ("actual" as const) : ("planned" as const);

  const reasons: string[] = [];
  let passed = true;

  if (estimatedWhitespace < LAW003_MIN_WHITESPACE_PCT) {
    passed = false;
    reasons.push(
      `Whitespace ${estimatedWhitespace.toFixed(1)}% below minimum ${LAW003_MIN_WHITESPACE_PCT}%`,
    );
  }
  if (estimatedWhitespace > LAW003_MAX_WHITESPACE_PCT) {
    passed = false;
    reasons.push(
      `Whitespace ${estimatedWhitespace.toFixed(1)}% above maximum ${LAW003_MAX_WHITESPACE_PCT}%`,
    );
  }
  if (productAreaRatio < 0.15) {
    passed = false;
    reasons.push(`Product area ratio ${productAreaRatio.toFixed(2)} below minimum 0.15`);
  }
  if (overlayDensity > LAW003_OVERLAY_DENSITY_SAFE + 0.1) {
    reasons.push(`Overlay density ${overlayDensity.toFixed(2)} above safe ${LAW003_OVERLAY_DENSITY_SAFE}`);
  }
  if (passed && reasons.length === 0) {
    reasons.push("Whitespace and product fill within SceneGraph mirror bounds");
  }

  const source = combineSources([productSource, overlaySource, whitespaceSource]);

  return {
    lawId: "LAW_003",
    passed,
    score: law003Score(estimatedWhitespace, productAreaRatio),
    source,
    productAreaRatio,
    overlayDensity,
    estimatedWhitespace,
    reasons,
  };
}

function collectOverlayBboxes(graph: SceneGraph): Array<{ bbox: Bbox; source: "actual" | "planned" }> {
  const zones: Array<{ bbox: Bbox; source: "actual" | "planned" }> = [];

  const typographyActual = geometryToBbox(graph.typography.actual);
  if (typographyActual) {
    zones.push({ bbox: typographyActual, source: "actual" });
  } else {
    const typographyPlanned = geometryToBbox(graph.typography.planned);
    if (typographyPlanned) zones.push({ bbox: typographyPlanned, source: "planned" });
  }

  const badgeActual = geometryToBbox(graph.badges.actual);
  if (badgeActual && badgeActual.width > 0 && badgeActual.height > 0) {
    zones.push({ bbox: badgeActual, source: "actual" });
  } else if ((graph.badges.actual?.count ?? 0) > 0) {
    const typographyPlanned = geometryToBbox(graph.typography.planned);
    if (typographyPlanned) {
      zones.push({ bbox: typographyPlanned, source: "planned" });
    }
  }

  const overlayActualBbox = geometryToBbox(graph.overlay.actual);
  const hasOverlayElementBbox =
    overlayActualBbox &&
    overlayActualBbox.width > 0 &&
    overlayActualBbox.height > 0 &&
    overlayActualBbox.width < (resolveCanvas(graph).width ?? 1) * 0.95;

  if (hasOverlayElementBbox && overlayActualBbox) {
    zones.push({ bbox: overlayActualBbox, source: "actual" });
  } else if (!typographyActual) {
    const overlayPlanned = geometryToBbox(graph.overlay.planned);
    if (overlayPlanned && overlayPlanned.width > 0) {
      zones.push({ bbox: overlayPlanned, source: "planned" });
    }
  }

  return zones;
}

function resolveProductBbox(graph: SceneGraph): { bbox?: Bbox; source: "actual" | "planned" } {
  const actual = geometryToBbox(graph.product.actual);
  if (actual) return { bbox: actual, source: "actual" };
  const planned = geometryToBbox(graph.product.planned);
  if (planned) return { bbox: planned, source: "planned" };
  return { source: "planned" };
}

function law014Score(contrastRatio: number, overlapPct: number, overlapAreaRatio: number): number {
  let score = 100;
  if (contrastRatio < LAW014_MIN_HERO_TEXT_RATIO) {
    score -= (LAW014_MIN_HERO_TEXT_RATIO - contrastRatio) * 25;
  }
  if (overlapPct > LAW014_MAX_OVERLAP_PCT) {
    score -= (overlapPct - LAW014_MAX_OVERLAP_PCT) * 8;
  }
  if (overlapAreaRatio > LAW014_MAX_OVERLAP_AREA_RATIO) {
    score -= (overlapAreaRatio - LAW014_MAX_OVERLAP_AREA_RATIO) * 400;
  }
  return Math.max(0, Math.round(score));
}

/** Mirror LAW_014 using SceneGraph product + overlay/typography/badge bboxes. */
export function evaluateSceneGraphLaw014(graph: SceneGraph): SceneGraphLaw014MirrorResult {
  const canvas = resolveCanvas(graph);
  const canvasArea = Math.max(1, canvas.width * canvas.height);
  const { bbox: productBbox, source: productSource } = resolveProductBbox(graph);
  const overlayZones = collectOverlayBboxes(graph);

  const productAreaPct =
    graph.composition.actual?.productAreaPct ??
    resolveProductArea(graph).ratio * 100;
  const textAreaPct = graph.typography.actual?.textAreaPct ?? Math.max(productAreaPct * 0.2, 1);
  const contrastRatio = productAreaPct / Math.max(textAreaPct, 1);

  let overlapCount = 0;
  let overlapArea = 0;
  if (productBbox) {
    for (const zone of overlayZones) {
      if (zonesOverlap(productBbox, zone.bbox)) {
        overlapCount += 1;
        overlapArea += intersectionArea(productBbox, zone.bbox);
      }
    }
  }

  const overlapAreaRatio = clamp01(overlapArea / canvasArea);
  const overlapPct = graph.composition.actual?.overlapPct ?? overlapCount * 0.5;

  const overlaySources = overlayZones.map((z) => z.source);
  let source: SceneGraphConstitutionSource;
  if (!overlayZones.length) {
    source = productSource;
  } else if (productSource === "actual" && overlaySources.every((s) => s === "actual")) {
    source = "actual";
  } else if (productSource === "planned" && overlaySources.every((s) => s === "planned")) {
    source = "planned";
  } else {
    source = "mixed";
  }

  const reasons: string[] = [];
  let passed = true;

  if (contrastRatio < LAW014_MIN_HERO_TEXT_RATIO) {
    passed = false;
    reasons.push(
      `Hero/text area ratio ${contrastRatio.toFixed(2)} below minimum ${LAW014_MIN_HERO_TEXT_RATIO}`,
    );
  }
  if (overlapPct > LAW014_MAX_OVERLAP_PCT) {
    passed = false;
    reasons.push(`Overlap ${overlapPct.toFixed(1)}% hurts contrast`);
  }
  if (overlapCount > 0) {
    reasons.push(`Product overlaps ${overlapCount} overlay zone(s)`);
    if (overlapAreaRatio > LAW014_MAX_OVERLAP_AREA_RATIO) {
      passed = false;
      reasons.push(`Overlap area ratio ${overlapAreaRatio.toFixed(3)} exceeds safe bound`);
    }
  }
  if (source === "mixed") {
    reasons.push("Overlay geometry uses planned bboxes (no actual overlay element bboxes)");
  }
  if (passed && reasons.length === 0) {
    reasons.push("Contrast hierarchy and overlap within SceneGraph mirror bounds");
  }

  return {
    lawId: "LAW_014",
    passed,
    score: law014Score(contrastRatio, overlapPct, overlapAreaRatio),
    overlapCount,
    overlapAreaRatio,
    contrastRatio,
    source,
    reasons,
  };
}

/** Evaluate SceneGraph constitution mirror (non-blocking). */
export function evaluateSceneGraphConstitutionMirror(
  graph: SceneGraph,
): SceneGraphConstitutionMirrorResult {
  const law003 = evaluateSceneGraphLaw003(graph);
  const law003V2 = compareLaw003V1V2(graph);
  const law014 = evaluateSceneGraphLaw014(graph);
  const sceneGraphConstitutionSource = combineSources([law003.source, law014.source]);
  const passed = law003.passed && law014.passed;
  const score = Math.round((law003.score + law014.score) / 2);

  return {
    evaluatedAt: new Date().toISOString(),
    graphStage: graph.stage,
    law003,
    law003V2,
    law014,
    sceneGraphConstitutionSource,
    passed,
    score,
  };
}

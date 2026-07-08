import type { SceneGraph } from "@/lib/scene-graph/SceneGraph";
import type {
  MetricContext,
  MetricValue,
  ProductAreaResolutionSource,
  SceneGraphMetricMode,
} from "./types";
import { METRIC_PRODUCT_AREA_RATIO } from "./types";

export const PRODUCT_AREA_RATIO_FORMULA_VERSION = "1.0.0" as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resolveCanvas(graph: SceneGraph) {
  return graph.canvas.actual ?? graph.canvas.planned;
}

type MirrorResolution = {
  value: number;
  source: ProductAreaResolutionSource;
  provenance: string;
  resolutionKind: "actual" | "planned";
};

/** Canonical law003_v2 product area resolution (matches SceneGraphLaw003V2 legacy). */
export function computeProductAreaRatioLaw003V2(graph: SceneGraph): MetricValue {
  if (graph.metadata.wideProductTemplateApplied) {
    const plannedPct = graph.composition.actual?.productAreaPct;
    if (plannedPct != null && plannedPct > 0) {
      return buildMetricValue(
        plannedPct / 100,
        "scene_graph.wide_template.composition.productAreaPct",
        "law003_v2:wide_template:composition.actual.productAreaPct",
      );
    }
  }

  const actual = graph.product.actual;
  if (actual?.areaRatio != null && actual.areaRatio > 0) {
    return buildMetricValue(
      actual.areaRatio,
      "scene_graph.product.actual.areaRatio",
      "law003_v2:product.actual.areaRatio",
    );
  }
  if (actual?.visibleAreaRatio != null && actual.visibleAreaRatio > 0) {
    return buildMetricValue(
      actual.visibleAreaRatio,
      "scene_graph.product.actual.visibleAreaRatio",
      "law003_v2:product.actual.visibleAreaRatio",
    );
  }
  if (actual?.width && actual.height) {
    const canvas = resolveCanvas(graph);
    const area = canvas.width * canvas.height;
    const value = area > 0 ? (actual.width * actual.height) / area : 0;
    return buildMetricValue(
      value,
      "scene_graph.product.actual.bounds",
      "law003_v2:product.actual.bounds",
    );
  }

  const productAreaPct = graph.composition.actual?.productAreaPct;
  if (productAreaPct != null) {
    return buildMetricValue(
      productAreaPct / 100,
      "scene_graph.composition.actual.productAreaPct",
      "law003_v2:composition.actual.productAreaPct",
    );
  }

  return buildMetricValue(0, "unknown", "law003_v2:fallback:zero");
}

/** Canonical mirror product area resolution (matches SceneGraphConstitutionMirror legacy). */
export function computeProductAreaRatioMirror(graph: SceneGraph): MetricValue & {
  resolutionKind: "actual" | "planned";
} {
  const resolved = resolveMirrorProductArea(graph);
  return {
    ...buildMetricValue(resolved.value, resolved.source, resolved.provenance),
    resolutionKind: resolved.resolutionKind,
  };
}

function resolveMirrorProductArea(graph: SceneGraph): MirrorResolution {
  const actual = graph.product.actual;
  if (actual?.areaRatio != null && actual.areaRatio > 0) {
    return {
      value: actual.areaRatio,
      source: "scene_graph.product.actual.areaRatio",
      provenance: "mirror:actual:product.actual.areaRatio",
      resolutionKind: "actual",
    };
  }
  if (actual?.visibleAreaRatio != null && actual.visibleAreaRatio > 0) {
    return {
      value: actual.visibleAreaRatio,
      source: "scene_graph.product.actual.visibleAreaRatio",
      provenance: "mirror:actual:product.actual.visibleAreaRatio",
      resolutionKind: "actual",
    };
  }
  if (actual?.width && actual.height) {
    const canvas = resolveCanvas(graph);
    const area = canvas.width * canvas.height;
    return {
      value: area > 0 ? (actual.width * actual.height) / area : 0,
      source: "scene_graph.product.actual.bounds",
      provenance: "mirror:actual:product.actual.bounds",
      resolutionKind: "actual",
    };
  }

  const planned = graph.product.planned;
  const canvas = resolveCanvas(graph);
  if (planned?.width && planned.height && canvas.width && canvas.height) {
    return {
      value: (planned.width * planned.height) / (canvas.width * canvas.height),
      source: "scene_graph.product.planned.bounds",
      provenance: "mirror:planned:product.planned.bounds",
      resolutionKind: "planned",
    };
  }

  const productAreaPct = graph.composition.actual?.productAreaPct;
  if (productAreaPct != null) {
    return {
      value: productAreaPct / 100,
      source: "scene_graph.composition.actual.productAreaPct",
      provenance: "mirror:planned:composition.actual.productAreaPct",
      resolutionKind: "planned",
    };
  }

  return {
    value: 0,
    source: "unknown",
    provenance: "mirror:planned:fallback:zero",
    resolutionKind: "planned",
  };
}

function buildMetricValue(
  value: number,
  source: ProductAreaResolutionSource,
  provenance: string,
): MetricValue {
  return {
    metricId: METRIC_PRODUCT_AREA_RATIO,
    value: clamp01(value),
    unit: "ratio",
    source,
    owner: "SceneGraph",
    formulaVersion: PRODUCT_AREA_RATIO_FORMULA_VERSION,
    provenance,
    createdAt: new Date().toISOString(),
  };
}

export function computeProductAreaRatioMetric(context: MetricContext): MetricValue {
  if (context.mode === "mirror") {
    return computeProductAreaRatioMirror(context.graph);
  }
  return computeProductAreaRatioLaw003V2(context.graph);
}

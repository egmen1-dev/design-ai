import type { SceneGraph } from "@/lib/scene-graph/SceneGraph";

export const METRIC_PRODUCT_AREA_RATIO = "METRIC_PRODUCT_AREA_RATIO" as const;

export type MetricId = typeof METRIC_PRODUCT_AREA_RATIO;

export type MetricUnit = "ratio";

export type MetricOwner = "SceneGraph";

export type ProductAreaResolutionSource =
  | "scene_graph.wide_template.composition.productAreaPct"
  | "scene_graph.product.actual.areaRatio"
  | "scene_graph.product.actual.visibleAreaRatio"
  | "scene_graph.product.actual.bounds"
  | "scene_graph.composition.actual.productAreaPct"
  | "scene_graph.product.planned.bounds"
  | "unknown";

export type MetricValue = {
  metricId: MetricId;
  value: number;
  unit: MetricUnit;
  source: ProductAreaResolutionSource;
  owner: MetricOwner;
  formulaVersion: string;
  provenance: string;
  createdAt: string;
};

export type SceneGraphMetricMode = "law003_v2" | "mirror";

export type MetricContext = {
  kind: "scene_graph";
  graph: SceneGraph;
  mode: SceneGraphMetricMode;
};

export type MetricShadowDiagnostic = {
  metricId: MetricId;
  mode: SceneGraphMetricMode;
  legacyValue: number;
  registryValue: number;
  delta: number;
  diverged: boolean;
  recordedAt: string;
};

export {
  MetricRegistry,
  clearMetricShadowDiagnostics,
  getLastMetricShadowDiagnostic,
  isMetricRegistryEnabled,
  isMetricRegistryShadowEnabled,
  recordMetricShadowDiagnostic,
} from "./metric-registry";

export {
  computeProductAreaRatioLaw003V2,
  computeProductAreaRatioMirror,
  computeProductAreaRatioMetric,
  PRODUCT_AREA_RATIO_FORMULA_VERSION,
} from "./product-area-ratio";

export {
  METRIC_PRODUCT_AREA_RATIO,
  type MetricContext,
  type MetricId,
  type MetricOwner,
  type MetricShadowDiagnostic,
  type MetricUnit,
  type MetricValue,
  type ProductAreaResolutionSource,
  type SceneGraphMetricMode,
} from "./types";

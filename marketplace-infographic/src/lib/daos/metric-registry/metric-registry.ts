import { computeProductAreaRatioMetric } from "./product-area-ratio";
import type { MetricContext, MetricId, MetricShadowDiagnostic, MetricValue } from "./types";
import { METRIC_PRODUCT_AREA_RATIO } from "./types";

const EPSILON = 1e-9;

let lastShadowDiagnostic: MetricShadowDiagnostic | null = null;

function isEnabledFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function isMetricRegistryEnabled(): boolean {
  return isEnabledFlag(process.env.DAOS_METRIC_REGISTRY);
}

export function isMetricRegistryShadowEnabled(): boolean {
  return isEnabledFlag(process.env.DAOS_METRIC_REGISTRY_SHADOW);
}

export function getLastMetricShadowDiagnostic(): MetricShadowDiagnostic | null {
  return lastShadowDiagnostic;
}

export function clearMetricShadowDiagnostics(): void {
  lastShadowDiagnostic = null;
}

export function recordMetricShadowDiagnostic(input: {
  metricId: MetricId;
  mode: MetricContext["mode"];
  legacyValue: number;
  registryValue: number;
}): MetricShadowDiagnostic {
  const delta = Math.abs(input.legacyValue - input.registryValue);
  const diagnostic: MetricShadowDiagnostic = {
    metricId: input.metricId,
    mode: input.mode,
    legacyValue: input.legacyValue,
    registryValue: input.registryValue,
    delta,
    diverged: delta > EPSILON,
    recordedAt: new Date().toISOString(),
  };
  lastShadowDiagnostic = diagnostic;
  return diagnostic;
}

export const MetricRegistry = {
  compute(metricId: MetricId, context: MetricContext): MetricValue {
    if (metricId !== METRIC_PRODUCT_AREA_RATIO) {
      throw new Error(`Unsupported metricId: ${metricId}`);
    }
    if (context.kind !== "scene_graph") {
      throw new Error(`Unsupported metric context kind for ${metricId}`);
    }
    return computeProductAreaRatioMetric(context);
  },
};

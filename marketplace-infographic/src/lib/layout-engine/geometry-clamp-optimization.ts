import { xPct, yPct } from "@/lib/composition/canvas";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";
import { computeMaxProductSize } from "@/lib/compositing/commercial-calibration";
import {
  PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT,
  PRODUCT_FINAL_HEIGHT_MAX_PCT,
} from "./constants";

export const GEOMETRY_CLAMP_VERSION = "1.0.0-sprint8b";

export type GeometryHeightBinding = "height_binding" | "width_binding" | "balanced";

export type GeometryClampDiagnostics = {
  geometryClampVersion: string;
  geometryClampSource: "sprint8b_finalH_58";
  geometryFinalHBefore: number;
  geometryFinalHAfter: number;
  geometryHeightBindingBefore: GeometryHeightBinding;
  geometryHeightBindingAfter: GeometryHeightBinding;
  geometryPolicyCeilingReachable: boolean;
  geometryOptimizationWarnings: string[];
};

function clampPct(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Reconstruct pre-8B finalH from template productScale (read-only regression model) */
export function legacyFinalHeightPct(productScale: number): number {
  const productH = clampPct(productScale * 100 * 1.05, 62, 88);
  return clampPct(productH, 60, PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT);
}

function heightBindingForZone(maxWidthPct: number, maxHeightPct: number): GeometryHeightBinding {
  const zoneW = Math.round(xPct(maxWidthPct));
  const zoneH = Math.round(yPct(maxHeightPct));
  const boostH = PRODUCT_TARGET_MAX_HEIGHT_PX / Math.max(zoneH, 1);
  const boostW = PRODUCT_MAX_WIDTH_PX / Math.max(zoneW, 1);
  if (boostH < boostW - 0.02) return "height_binding";
  if (boostW < boostH - 0.02) return "width_binding";
  return "balanced";
}

function patchZoneHeight(layout: CompositionLayout, maxHeightPct: number): CompositionLayout {
  return {
    ...layout,
    product: {
      ...layout.product,
      height: maxHeightPct,
      maxHeightPct,
      areaPct: (layout.product.maxWidthPct / 100) * (maxHeightPct / 100) * 100,
    },
  };
}

export function buildGeometryClampDiagnostics(input: {
  layout: CompositionLayout;
  productScale?: number;
  objectScale?: number;
}): GeometryClampDiagnostics {
  const warnings: string[] = [];
  const afterH = input.layout.product.maxHeightPct;
  const beforeH =
    input.productScale != null
      ? legacyFinalHeightPct(input.productScale)
      : afterH > PRODUCT_FINAL_HEIGHT_MAX_PCT
        ? PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT
        : afterH;

  const legacyLayout = patchZoneHeight(input.layout, beforeH);
  const bindingBefore = heightBindingForZone(
    legacyLayout.product.maxWidthPct,
    legacyLayout.product.maxHeightPct,
  );
  const bindingAfter = heightBindingForZone(
    input.layout.product.maxWidthPct,
    input.layout.product.maxHeightPct,
  );

  const runtimeScale = input.objectScale ?? 1.0;
  const allowedAtRuntime = computeMaxProductSize(input.layout, runtimeScale, "calibrated")
    .placementAreaPct;
  const allowedAtCeiling = computeMaxProductSize(input.layout, 1.0, "calibrated").placementAreaPct;
  const allowedBeforeAtCeiling = computeMaxProductSize(legacyLayout, 1.0, "calibrated")
    .placementAreaPct;
  /** Geometry ceiling — evaluated at objectScale=1 where Sprint 8A height_binding saturated */
  const policyCeilingReachable = allowedAtCeiling >= 35;

  if (input.layout.metrics.overlapPct > 5) {
    warnings.push(`layout overlapPct=${input.layout.metrics.overlapPct} — verify typography/badge zones`);
  }
  if (afterH > PRODUCT_FINAL_HEIGHT_MAX_PCT + 0.5) {
    warnings.push(`finalH ${afterH}% exceeds sprint8b clamp ${PRODUCT_FINAL_HEIGHT_MAX_PCT}%`);
  }
  if (!policyCeilingReachable) {
    warnings.push(
      `geometry ceiling ${allowedAtCeiling}% @ objectScale=1 below policy target — width or zone may still bind`,
    );
  }
  if (runtimeScale >= 0.95 && allowedAtRuntime < allowedBeforeAtCeiling) {
    warnings.push("optimized allowed area lower than legacy at objectScale=1 — unexpected regression");
  }
  if (runtimeScale < 0.95 && allowedAtCeiling > allowedBeforeAtCeiling + 3) {
    warnings.push(
      `geometry ceiling improved +${Math.round((allowedAtCeiling - allowedBeforeAtCeiling) * 10) / 10}pp @ objectScale=1; commercial objectScale=${runtimeScale} unchanged`,
    );
  }

  return {
    geometryClampVersion: GEOMETRY_CLAMP_VERSION,
    geometryClampSource: "sprint8b_finalH_58",
    geometryFinalHBefore: Math.round(beforeH * 10) / 10,
    geometryFinalHAfter: Math.round(afterH * 10) / 10,
    geometryHeightBindingBefore: bindingBefore,
    geometryHeightBindingAfter: bindingAfter,
    geometryPolicyCeilingReachable: policyCeilingReachable,
    geometryOptimizationWarnings: warnings,
  };
}

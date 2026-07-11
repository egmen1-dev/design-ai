import {
  clampReachableTarget,
  PRODUCT_AREA_RECALIBRATION_VERSION,
} from "@/lib/daos/commercial-genome-beta/product-area-targets";

/**
 * Post-8B calibrated path: objectScale ≥ 0.75 harvests geometry ceiling (~37%)
 * without pursuing unreachable aspirational 55%.
 */
export const GEOMETRY_CEILING_OBJECT_SCALE = 0.75;

export type CommercialPropagationMode =
  | "geometry_ceiling_harvest"
  | "template"
  | "legacy";

export function productionObjectScaleFromReachable(reachableFraction: number): {
  objectScale: number;
  reachableTargetPct: number;
  propagationMode: CommercialPropagationMode;
} {
  const reachableTargetPct = Math.round(clampReachableTarget(reachableFraction) * 100);
  return {
    objectScale: GEOMETRY_CEILING_OBJECT_SCALE,
    reachableTargetPct,
    propagationMode: "geometry_ceiling_harvest",
  };
}

export { PRODUCT_AREA_RECALIBRATION_VERSION };

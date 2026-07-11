/**
 * Sprint 8C — reachable vs aspirational product area targets.
 * Post-8B geometry ceiling ~36.6–37.4%; compositor policy max ~39.4%.
 */

/** Production reachable target for current hero layout (39–45% band) */
export const REACHABLE_PRODUCT_AREA_TARGET = 0.42;

/** EKB aspirational target — retained for roadmap, not applied to current layout */
export const ASPIRATIONAL_PRODUCT_AREA_TARGET = 0.55;

/** Future ultra-dominant hero layout target */
export const ULTRA_DOMINANT_PRODUCT_AREA_TARGET = 0.6;

/** Compositor policy ceiling after Sprint 7B (reference) */
export const COMPOSITOR_POLICY_CEILING = 0.394;

export const PRODUCT_AREA_RECALIBRATION_VERSION = "1.0.0-sprint8c";

export function clampReachableTarget(value: number): number {
  return Math.min(0.45, Math.max(0.39, value));
}

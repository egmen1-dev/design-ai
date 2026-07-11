import { xPct, yPct, zoneAreaPct, WB_COVER } from "@/lib/composition/canvas";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_SIDE_MARGIN_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";

export const COMMERCIAL_CALIBRATION_VERSION = "1.0.0-sprint6c";

/** Legacy coefficients — Sprint 6A/6B production path */
export const LEGACY_SCALE_BOOST_BASE = 0.58;
export const LEGACY_SCALE_BOOST_SLOPE = 0.05;
export const LEGACY_FALLBACK_SCALE_BASE = 0.55;
export const LEGACY_FALLBACK_SCALE_SLOPE = 0.18;

/** Calibrated ceiling — prevents runaway bbox past canvas policy */
export const CALIBRATED_SCALE_BOOST_MAX = 1.18;

export type CommercialCalibrationMode = "legacy" | "calibrated";

export type CommercialCalibrationDiagnostics = {
  commercialCalibrationVersion: string;
  commercialCalibrationFormula: string;
  commercialTargetArea: number;
  commercialMeasuredArea: number;
  commercialAreaError: number;
  commercialCalibrationWarnings: string[];
};

export type ScaleBoostResolution = {
  scaleBoost: number;
  formula: string;
  targetAreaPct: number;
  zoneAreaPct: number;
};

export type MaxProductSizeEstimate = {
  maxW: number;
  maxH: number;
  placementAreaPct: number;
};

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const HEADER_RESERVE_PX = Math.round(CANVAS_H * 0.2);

function legacyScaleBoost(objectScale: number): number {
  return LEGACY_SCALE_BOOST_BASE + objectScale * LEGACY_SCALE_BOOST_SLOPE;
}

function legacyFallbackScale(objectScale: number): number {
  return LEGACY_FALLBACK_SCALE_BASE + objectScale * LEGACY_FALLBACK_SCALE_SLOPE;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Commercial objectScale domain used for calibration interpolation */
export const CALIBRATION_OBJECT_SCALE_MIN = 0.5;
export const CALIBRATION_OBJECT_SCALE_MAX = 0.75;

function canvasCaps(): { canvasMaxW: number; canvasMaxH: number } {
  return {
    canvasMaxW: Math.min(PRODUCT_MAX_WIDTH_PX, CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2),
    canvasMaxH: Math.min(
      PRODUCT_TARGET_MAX_HEIGHT_PX,
      CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX,
    ),
  };
}

function maxScaleBoostForZone(zoneW: number, zoneH: number): number {
  const { canvasMaxW, canvasMaxH } = canvasCaps();
  return Math.min(
    canvasMaxW / Math.max(zoneW, 1),
    canvasMaxH / Math.max(zoneH, 1),
    CALIBRATED_SCALE_BOOST_MAX,
  );
}

function calibratedScaleBoostFromZone(
  objectScale: number,
  zoneW: number,
  zoneH: number,
  zoneArea: number,
): { scaleBoost: number; formula: string } {
  const legacy = legacyScaleBoost(objectScale);
  const anchorBoost = legacyScaleBoost(CALIBRATION_OBJECT_SCALE_MIN);
  const maxBoost = maxScaleBoostForZone(zoneW, zoneH);
  const t = clamp01(
    (objectScale - CALIBRATION_OBJECT_SCALE_MIN) /
      (CALIBRATION_OBJECT_SCALE_MAX - CALIBRATION_OBJECT_SCALE_MIN),
  );

  const interpolated = anchorBoost + t * (maxBoost - anchorBoost);
  const scaleBoost = Math.min(maxBoost, Math.max(legacy, interpolated));

  return {
    scaleBoost,
    formula: `calibrated:lerp(${anchorBoost.toFixed(3)}..${maxBoost.toFixed(3)},t=${t.toFixed(2)})`,
  };
}

function placementAreaPct(width: number, height: number): number {
  return Math.round(((width * height) / (CANVAS_W * CANVAS_H)) * 1000) / 10;
}

function resolveZoneAreaPct(compositionLayout?: CompositionLayout): number | undefined {
  const comp = compositionLayout?.product;
  if (!comp) return undefined;
  return zoneAreaPct(comp.maxWidthPct, comp.maxHeightPct);
}

/**
 * Maps objectScale → scaleBoost.
 * Calibrated mode: sqrt(targetArea / zoneArea) — empirically derived in Sprint 6C.
 * Legacy mode: 0.58 + objectScale * 0.05 (low sensitivity, preserved for backward compat).
 */
export function resolveScaleBoost(input: {
  objectScale: number;
  zoneAreaPct?: number;
  zoneW?: number;
  zoneH?: number;
  mode?: CommercialCalibrationMode;
}): ScaleBoostResolution {
  const mode = input.mode ?? "legacy";
  const targetAreaPct = Math.round(input.objectScale * 1000) / 10;
  const zone = input.zoneAreaPct ?? 0;

  if (mode === "legacy" || zone <= 0) {
    return {
      scaleBoost: legacyScaleBoost(input.objectScale),
      formula: `legacy:${LEGACY_SCALE_BOOST_BASE}+objectScale*${LEGACY_SCALE_BOOST_SLOPE}`,
      targetAreaPct,
      zoneAreaPct: zone,
    };
  }

  const zoneW = input.zoneW ?? Math.round(CANVAS_W * 0.65);
  const zoneH = input.zoneH ?? Math.round(CANVAS_H * 0.75);
  const calibrated = calibratedScaleBoostFromZone(input.objectScale, zoneW, zoneH, zone);

  return {
    scaleBoost: calibrated.scaleBoost,
    formula: calibrated.formula,
    targetAreaPct,
    zoneAreaPct: zone,
  };
}

export function resolveFallbackCanvasScale(input: {
  objectScale: number;
  mode?: CommercialCalibrationMode;
}): { scale: number; formula: string; targetAreaPct: number } {
  const mode = input.mode ?? "legacy";
  const targetAreaPct = Math.round(input.objectScale * 1000) / 10;

  if (mode === "legacy") {
    return {
      scale: legacyFallbackScale(input.objectScale),
      formula: `legacy:${LEGACY_FALLBACK_SCALE_BASE}+objectScale*${LEGACY_FALLBACK_SCALE_SLOPE}`,
      targetAreaPct,
    };
  }

  const legacy = legacyFallbackScale(input.objectScale);
  const canvasMaxW = Math.min(PRODUCT_MAX_WIDTH_PX, CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2);
  const canvasMaxH = Math.min(
    PRODUCT_TARGET_MAX_HEIGHT_PX,
    CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX,
  );
  const maxAchievableAreaPct = placementAreaPct(canvasMaxW, canvasMaxH);
  const ideal = Math.sqrt(Math.max(0.01, targetAreaPct / maxAchievableAreaPct));
  const scale = Math.min(0.95, Math.max(legacy, ideal * legacy));

  return {
    scale,
    formula: `calibrated:fallback:sqrt(${targetAreaPct}/${maxAchievableAreaPct.toFixed(2)})`,
    targetAreaPct,
  };
}

/**
 * Production max-product-size estimate — same math as scene-compositor, with calibration mode.
 */
export function computeMaxProductSize(
  compositionLayout: CompositionLayout | undefined,
  objectScale: number,
  mode: CommercialCalibrationMode = "legacy",
): MaxProductSizeEstimate {
  const canvasMaxW = Math.min(PRODUCT_MAX_WIDTH_PX, CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2);
  const canvasMaxH = Math.min(
    PRODUCT_TARGET_MAX_HEIGHT_PX,
    CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX,
  );

  const comp = compositionLayout?.product;
  if (comp) {
    const zoneW = Math.round(xPct(comp.maxWidthPct));
    const zoneH = Math.round(yPct(comp.maxHeightPct));
    const zone = zoneAreaPct(comp.maxWidthPct, comp.maxHeightPct);
    const { scaleBoost } = resolveScaleBoost({
      objectScale,
      zoneAreaPct: zone,
      zoneW,
      zoneH,
      mode,
    });
    const maxW = Math.min(canvasMaxW, PRODUCT_MAX_WIDTH_PX, Math.round(zoneW * scaleBoost));
    const maxH = Math.min(canvasMaxH, PRODUCT_TARGET_MAX_HEIGHT_PX, Math.round(zoneH * scaleBoost));
    return {
      maxW,
      maxH,
      placementAreaPct: placementAreaPct(maxW, maxH),
    };
  }

  const { scale } = resolveFallbackCanvasScale({ objectScale, mode });
  const maxW = Math.min(canvasMaxW, Math.round(canvasMaxW * scale));
  const maxH = Math.min(canvasMaxH, Math.round(canvasMaxH * scale));
  return {
    maxW,
    maxH,
    placementAreaPct: placementAreaPct(maxW, maxH),
  };
}

export function buildCommercialCalibrationDiagnostics(input: {
  objectScale: number;
  compositionLayout?: CompositionLayout;
  mode: CommercialCalibrationMode;
  measuredAreaPct: number;
}): CommercialCalibrationDiagnostics {
  const warnings: string[] = [];
  const zone = resolveZoneAreaPct(input.compositionLayout);
  const resolution = resolveScaleBoost({
    objectScale: input.objectScale,
    zoneAreaPct: zone,
    mode: input.mode,
  });

  const error = Math.round((input.measuredAreaPct - resolution.targetAreaPct) * 10) / 10;

  if (input.mode === "calibrated" && Math.abs(error) > 20) {
    warnings.push(
      `Measured area ${input.measuredAreaPct}% deviates from target ${resolution.targetAreaPct}% — canvas caps may limit materialization`,
    );
  }

  if (input.mode === "legacy" && zone != null) {
    const legacyEstimate = computeMaxProductSize(
      input.compositionLayout,
      input.objectScale,
      "legacy",
    ).placementAreaPct;
    const calibratedEstimate = computeMaxProductSize(
      input.compositionLayout,
      input.objectScale,
      "calibrated",
    ).placementAreaPct;
    if (calibratedEstimate - legacyEstimate < 1) {
      warnings.push("Calibration delta under 1% — zone or caps may constrain sensitivity");
    }
  }

  return {
    commercialCalibrationVersion: COMMERCIAL_CALIBRATION_VERSION,
    commercialCalibrationFormula: resolution.formula,
    commercialTargetArea: resolution.targetAreaPct,
    commercialMeasuredArea: input.measuredAreaPct,
    commercialAreaError: error,
    commercialCalibrationWarnings: warnings,
  };
}

/** Sensitivity sweep for benchmarks — objectScale → bbox without I/O */
export function sensitivitySweep(
  compositionLayout: CompositionLayout,
  objectScales: number[],
  mode: CommercialCalibrationMode,
): Array<{
  objectScale: number;
  scaleBoost: number;
  maxW: number;
  maxH: number;
  placementAreaPct: number;
  formula: string;
}> {
  const zone = zoneAreaPct(
    compositionLayout.product.maxWidthPct,
    compositionLayout.product.maxHeightPct,
  );

  return objectScales.map((objectScale) => {
    const zoneW = Math.round(xPct(compositionLayout.product.maxWidthPct));
    const zoneH = Math.round(yPct(compositionLayout.product.maxHeightPct));
    const { scaleBoost, formula } = resolveScaleBoost({
      objectScale,
      zoneAreaPct: zone,
      zoneW,
      zoneH,
      mode,
    });
    const size = computeMaxProductSize(compositionLayout, objectScale, mode);
    return {
      objectScale,
      scaleBoost,
      maxW: size.maxW,
      maxH: size.maxH,
      placementAreaPct: size.placementAreaPct,
      formula,
    };
  });
}

import type { OverlayQualityAudit } from "../audit/overlay-quality-audit";
import type { ProductScaleAudit } from "../audit/product-scale-audit";
import type { NormalizedCompositePlacement } from "../compositor/composite-result-bridge";
import type { ConstitutionReport } from "@/lib/design/design-constitution";

export const LAW003_MIN_WHITESPACE_PCT = 20;
export const LAW003_MAX_WHITESPACE_PCT = 35;
export const LAW003_PRODUCT_AREA_GOOD = 0.3;
export const LAW003_OVERLAY_DENSITY_SAFE = 0.25;

export type Law003RecalibrationInput = {
  originalWhitespace?: number;
  canvas?: { width: number; height: number };
  compositePlacement?: NormalizedCompositePlacement;
  productAreaRatio?: number;
  plannedProductAreaRatio?: number;
  overlayDensity?: number;
  overlayQualityAudit?: OverlayQualityAudit;
  productScaleAudit?: ProductScaleAudit;
  constitutionLaw003Violation?: boolean;
  constitutionWhitespacePct?: number;
  productAreaBeforeRatio?: number;
};

export type Law003RecalibrationReport = {
  originalWhitespace: number;
  recalibratedWhitespace: number;
  productAdjustedWhitespace: number;
  overlayAdjustedWhitespace: number;
  law003Before: boolean;
  law003After: boolean;
  confidence: number;
  reason: string;
  warnings: string[];
  staleMetricDetected: boolean;
};

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toRatio(value?: number): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  return value > 1 ? value / 100 : value;
}

function toWhitespacePct(value?: number): number {
  if (value == null || !Number.isFinite(value)) return 28;
  return value <= 1 ? value * 100 : value;
}

function law003Fails(whitespacePct: number): boolean {
  return whitespacePct < LAW003_MIN_WHITESPACE_PCT || whitespacePct > LAW003_MAX_WHITESPACE_PCT;
}

function resolveFactualProductRatio(input: Law003RecalibrationInput): number | undefined {
  if (input.compositePlacement?.areaRatio != null) {
    return input.compositePlacement.areaRatio;
  }
  if (input.productAreaRatio != null) {
    return toRatio(input.productAreaRatio);
  }
  if (input.productScaleAudit?.productAreaRatio != null) {
    return input.productScaleAudit.productAreaRatio;
  }
  return undefined;
}

function resolvePlannedProductRatio(input: Law003RecalibrationInput): number | undefined {
  if (input.productAreaBeforeRatio != null) {
    return toRatio(input.productAreaBeforeRatio);
  }
  if (input.plannedProductAreaRatio != null) {
    return toRatio(input.plannedProductAreaRatio);
  }
  return undefined;
}

function resolveOverlayDensity(input: Law003RecalibrationInput): number {
  if (input.overlayDensity != null) return Math.max(0, input.overlayDensity);
  return input.overlayQualityAudit?.estimatedOverlayDensity ?? 0;
}

function resolveOriginalWhitespace(input: Law003RecalibrationInput): number {
  const layoutPct =
    input.originalWhitespace != null ? toWhitespacePct(input.originalWhitespace) : undefined;
  const constitutionPct = input.constitutionWhitespacePct;
  if (layoutPct != null && constitutionPct != null) {
    return Math.max(layoutPct, constitutionPct);
  }
  if (constitutionPct != null) return constitutionPct;
  if (layoutPct != null) return layoutPct;
  return 28;
}

/** Recompute whitespace using factual composite product area instead of planned layout only. */
export function recalculateLaw003Whitespace(input: Law003RecalibrationInput): {
  productAdjustedWhitespace: number;
  overlayAdjustedWhitespace: number;
  recalibratedWhitespace: number;
} {
  const originalPct = resolveOriginalWhitespace(input);
  const factualProduct = resolveFactualProductRatio(input) ?? 0;
  const plannedProduct = resolvePlannedProductRatio(input) ?? factualProduct;
  const productDeltaPct = factualProduct * 100 - plannedProduct * 100;

  let productAdjustedWhitespace = originalPct;
  if (factualProduct >= LAW003_PRODUCT_AREA_GOOD) {
    productAdjustedWhitespace = clampPct(originalPct - productDeltaPct);
  } else if (productDeltaPct > 0) {
    productAdjustedWhitespace = clampPct(originalPct - productDeltaPct * 0.5);
  }

  const overlayDensity = resolveOverlayDensity(input);
  let overlayAdjustedWhitespace = productAdjustedWhitespace;
  if (overlayDensity > LAW003_OVERLAY_DENSITY_SAFE) {
    overlayAdjustedWhitespace = clampPct(
      productAdjustedWhitespace + (overlayDensity - LAW003_OVERLAY_DENSITY_SAFE) * 100 * 0.35,
    );
  }

  return {
    productAdjustedWhitespace,
    overlayAdjustedWhitespace,
    recalibratedWhitespace: overlayAdjustedWhitespace,
  };
}

function resolveLaw003After(input: {
  law003Before: boolean;
  recalibratedWhitespace: number;
  factualRatio: number;
  overlayDensity: number;
}): boolean {
  const recalibratedFails = law003Fails(input.recalibratedWhitespace);

  if (input.factualRatio < LAW003_PRODUCT_AREA_GOOD) {
    return input.law003Before ? true : recalibratedFails;
  }

  if (input.overlayDensity > LAW003_OVERLAY_DENSITY_SAFE) {
    return input.law003Before ? true : recalibratedFails;
  }

  return recalibratedFails;
}

/** Parse rendered_critique LAW_003 whitespace percentage from constitution reports. */
export function extractConstitutionLaw003Whitespace(
  reports?: ConstitutionReport[],
): number | undefined {
  if (!reports?.length) return undefined;
  for (const report of reports) {
    for (const entry of report.entries ?? []) {
      if (entry.lawId === "LAW_003" && entry.reason) {
        const match = entry.reason.match(/Whitespace\s+([\d.]+)%/i);
        if (match) return parseFloat(match[1]);
      }
    }
    for (const violation of report.violations ?? []) {
      if (violation.lawId === "LAW_003" && violation.reason) {
        const match = violation.reason.match(/Whitespace\s+([\d.]+)%/i);
        if (match) return parseFloat(match[1]);
      }
    }
  }
  return undefined;
}

/** Build DAOS LAW_003 recalibration report for diagnostics and soft overlay gate. */
export function createLaw003RecalibrationReport(
  input: Law003RecalibrationInput,
): Law003RecalibrationReport {
  const warnings: string[] = [];
  const originalPct = resolveOriginalWhitespace(input);
  const factualProduct = resolveFactualProductRatio(input);
  const plannedProduct = resolvePlannedProductRatio(input);
  const overlayDensity = resolveOverlayDensity(input);
  const factualRatio = factualProduct ?? 0;
  const { productAdjustedWhitespace, overlayAdjustedWhitespace, recalibratedWhitespace } =
    recalculateLaw003Whitespace(input);

  const law003Before =
    input.constitutionLaw003Violation ??
    input.overlayQualityAudit?.law003WhitespaceViolation ??
    law003Fails(originalPct);
  const law003After = resolveLaw003After({
    law003Before,
    recalibratedWhitespace,
    factualRatio,
    overlayDensity,
  });

  const plannedRatio = plannedProduct ?? 0;
  const staleMetricDetected =
    factualRatio > plannedRatio + 0.08 &&
    originalPct > LAW003_MAX_WHITESPACE_PCT &&
    factualRatio * 100 - plannedRatio * 100 > 5 &&
    Boolean(input.constitutionLaw003Violation);

  if (staleMetricDetected) {
    warnings.push("STALE_WHITESPACE_METRIC");
  }
  if (factualRatio >= LAW003_PRODUCT_AREA_GOOD && originalPct > LAW003_MAX_WHITESPACE_PCT) {
    warnings.push("PLANNED_WHITESPACE_EXCEEDS_FACTUAL_FILL");
  }
  if (overlayDensity > LAW003_OVERLAY_DENSITY_SAFE && law003Before) {
    warnings.push("OVERLAY_DENSITY_BLOCKS_RECALIBRATION");
  }

  let confidence = 0.45;
  if (input.compositePlacement) {
    confidence = Math.max(confidence, input.compositePlacement.confidence);
  } else if (factualProduct != null) {
    confidence = 0.7;
  }
  if (plannedProduct == null) {
    confidence *= 0.85;
    warnings.push("PLANNED_PRODUCT_AREA_MISSING");
  }

  const canRecalibrate =
    factualRatio >= LAW003_PRODUCT_AREA_GOOD && overlayDensity <= LAW003_OVERLAY_DENSITY_SAFE;
  const reason = canRecalibrate
    ? `Factual product area ${(factualRatio * 100).toFixed(1)}% adjusted whitespace ${originalPct.toFixed(1)}% → ${recalibratedWhitespace.toFixed(1)}%`
    : factualRatio < LAW003_PRODUCT_AREA_GOOD
      ? `Product area ${(factualRatio * 100).toFixed(1)}% below ${LAW003_PRODUCT_AREA_GOOD * 100}% threshold — LAW_003 unchanged`
      : `Overlay density ${overlayDensity.toFixed(2)} above ${LAW003_OVERLAY_DENSITY_SAFE} — LAW_003 recalibration blocked`;

  return {
    originalWhitespace: originalPct,
    recalibratedWhitespace,
    productAdjustedWhitespace,
    overlayAdjustedWhitespace,
    law003Before,
    law003After,
    confidence: clamp01(confidence),
    reason,
    warnings,
    staleMetricDetected,
  };
}

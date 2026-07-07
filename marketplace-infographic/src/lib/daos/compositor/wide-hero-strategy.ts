import type { CompositionLayout } from "@/lib/composition/types";
import { WB_COVER, xPct, yPct } from "@/lib/composition/canvas";
import type { SceneCompositeOptions } from "@/lib/compositing/scene-compositor";
import {
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_SIDE_MARGIN_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";
import type { AspectRatioPlacementPatch } from "./aspect-ratio-placement-patch";
import { isDaosCompositorAsymmetricLimitsEnabled } from "./asymmetric-limits";
import type { AsymmetricLimits } from "./asymmetric-limits";
import type { ProductScaleBounds } from "./product-scale-patch";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const HEADER_RESERVE_PX = Math.round(CANVAS_H * 0.2);
const BOTTOM_PAD = PRODUCT_BOTTOM_PAD_PX;
const SIDE_MARGIN = PRODUCT_SIDE_MARGIN_PX;

export const DAOS_WIDE_HERO_MIN_CANDIDATE_ASPECT = 1.8;
export const DAOS_WIDE_HERO_TRIGGER_ASPECT = 2.0;
export const DAOS_WIDE_HERO_WIDTH_MIN_PCT = 85;
export const DAOS_WIDE_HERO_WIDTH_MAX_PCT = 96;
export const DAOS_WIDE_HERO_CROP_SAFE_MAX_PCT = 6;
export const DAOS_WIDE_HERO_FULL_BLEED_SIDE_MARGIN_PCT = 2;
export const DAOS_WIDE_HERO_DIAGONAL_ROTATION_DEG = 2.5;

export type WideHeroStrategyKind =
  | "standard"
  | "wide_full_bleed"
  | "wide_diagonal"
  | "wide_crop_safe";

export type WideHeroCandidateInput = {
  productAspectRatio?: number;
  aspectRatioPlacementPatch?: AspectRatioPlacementPatch;
  productCategory?: string;
  productHint?: string;
  productBounds?: ProductScaleBounds;
  compositionLayout?: CompositionLayout;
  law014RiskHigh?: boolean;
  law014ContrastViolation?: boolean;
  overlapPct?: number;
  extractAreaWarnings?: string[];
};

export type WideHeroCandidate = {
  candidate: boolean;
  aspectRatio: number;
  reason: string;
};

export type WideHeroStrategyInput = WideHeroCandidateInput & {
  objectScale?: number;
  productScaleMultiplier?: number;
  canvas?: { width: number; height: number };
};

export type WideHeroStrategy = {
  enabled: boolean;
  applied: boolean;
  strategy: WideHeroStrategyKind;
  reason: string;
  widthTargetPct: number;
  cropSafeHorizontalPct: number;
  maxWidthPct: number;
  maxHeightPct: number;
  maxWidthPx: number;
  maxHeightPx: number;
  maxAlphaWidthPx: number;
  maxAlphaHeightPx: number;
  sideMarginPx: number;
  rotationDeg: number;
  allowHorizontalBleed: boolean;
  noVerticalCrop: boolean;
  warnings: Array<{ code: string; message: string }>;
};

export type WideHeroStrategyApplyResult = {
  options: SceneCompositeOptions;
  strategy: WideHeroStrategy;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isDaosWideHeroStrategyEnabled(): boolean {
  return (
    process.env.DAOS_WIDE_HERO_STRATEGY === "1" &&
    isDaosCompositorAsymmetricLimitsEnabled()
  );
}

function isMattressSignal(input: { productHint?: string; productCategory?: string }): boolean {
  const hint = input.productHint?.toLowerCase() ?? "";
  const category = input.productCategory?.toLowerCase() ?? "";
  return /матрас|mattress|\b160x200\b|\b200x160\b/.test(hint) || category === "mattress";
}

function isWideCategory(category?: string): boolean {
  const normalized = category?.toLowerCase() ?? "";
  return normalized === "home" || normalized === "mattress" || normalized === "furniture";
}

function resolveAspectRatio(input: WideHeroCandidateInput): number {
  if (input.aspectRatioPlacementPatch?.productAspectRatio != null) {
    return input.aspectRatioPlacementPatch.productAspectRatio;
  }
  if (input.productAspectRatio != null && input.productAspectRatio > 0) {
    return input.productAspectRatio;
  }
  if (input.productBounds && input.productBounds.height > 0) {
    return input.productBounds.width / input.productBounds.height;
  }
  const product = input.compositionLayout?.product;
  if (product && product.maxHeightPct > 0) {
    return product.maxWidthPct / product.maxHeightPct;
  }
  if (isMattressSignal(input)) return 2.6;
  if (isWideCategory(input.productCategory)) return 2.0;
  return 1;
}

function resolveWidthTargetPct(aspectRatio: number): number {
  const t = clamp((aspectRatio - DAOS_WIDE_HERO_TRIGGER_ASPECT) / 1.0, 0, 1);
  return DAOS_WIDE_HERO_WIDTH_MIN_PCT + t * (DAOS_WIDE_HERO_WIDTH_MAX_PCT - DAOS_WIDE_HERO_WIDTH_MIN_PCT);
}

function resolveCropSafePct(input: WideHeroStrategyInput, widthTargetPct: number): number {
  const heightOverflow =
    input.extractAreaWarnings?.includes("HEIGHT_OVERFLOW") === true ||
    input.aspectRatioPlacementPatch?.heightOverflowPrevented === true;
  if (heightOverflow || widthTargetPct >= DAOS_WIDE_HERO_WIDTH_MAX_PCT - 1) {
    return DAOS_WIDE_HERO_CROP_SAFE_MAX_PCT;
  }
  return Math.min(3, DAOS_WIDE_HERO_CROP_SAFE_MAX_PCT);
}

function pickStrategy(input: WideHeroStrategyInput, widthTargetPct: number, cropSafePct: number): WideHeroStrategyKind {
  const heightOverflow = input.extractAreaWarnings?.includes("HEIGHT_OVERFLOW") === true;
  if (cropSafePct >= DAOS_WIDE_HERO_CROP_SAFE_MAX_PCT - 0.5 || heightOverflow) {
    return "wide_crop_safe";
  }
  if (widthTargetPct >= 92 && input.aspectRatioPlacementPatch?.fitStrategy === "fit-width") {
    return "wide_diagonal";
  }
  return "wide_full_bleed";
}

/** Detect whether a product should use wide hero placement. */
export function detectWideHeroCandidate(input: WideHeroCandidateInput): WideHeroCandidate {
  const aspectRatio = resolveAspectRatio(input);
  const mattress = isMattressSignal(input);
  const wideCategory = isWideCategory(input.productCategory);

  if (aspectRatio < DAOS_WIDE_HERO_MIN_CANDIDATE_ASPECT) {
    return { candidate: false, aspectRatio, reason: "aspect_below_wide_threshold" };
  }

  const hasWideSignal =
    aspectRatio >= DAOS_WIDE_HERO_TRIGGER_ASPECT ||
    mattress ||
    (wideCategory && aspectRatio >= DAOS_WIDE_HERO_MIN_CANDIDATE_ASPECT);

  if (!hasWideSignal) {
    return { candidate: false, aspectRatio, reason: "no_wide_product_signal" };
  }

  const boundsKnown =
    Boolean(input.productBounds && input.productBounds.height > 0) ||
    Boolean(input.aspectRatioPlacementPatch?.productAspectRatio) ||
    Boolean(input.productAspectRatio != null && input.productAspectRatio >= DAOS_WIDE_HERO_MIN_CANDIDATE_ASPECT) ||
    mattress ||
    wideCategory;

  if (!boundsKnown) {
    return { candidate: false, aspectRatio, reason: "bounds_unknown_without_wide_signal" };
  }

  const overlapPct = input.overlapPct ?? input.compositionLayout?.metrics?.overlapPct ?? 0;
  if (input.law014ContrastViolation && overlapPct > 8) {
    return { candidate: false, aspectRatio, reason: "law014_overlap_risk_high" };
  }

  return {
    candidate: true,
    aspectRatio,
    reason: mattress ? "mattress_wide_product" : `wide_aspect_${aspectRatio.toFixed(2)}`,
  };
}

/** Build wide hero sizing strategy for compositor placement. */
export function createWideHeroStrategy(input: WideHeroStrategyInput): WideHeroStrategy {
  const enabled = isDaosWideHeroStrategyEnabled();
  const detection = detectWideHeroCandidate(input);
  const base: WideHeroStrategy = {
    enabled,
    applied: false,
    strategy: "standard",
    reason: enabled ? detection.reason : "wide_hero_disabled",
    widthTargetPct: 0,
    cropSafeHorizontalPct: 0,
    maxWidthPct: 0,
    maxHeightPct: 0,
    maxWidthPx: 0,
    maxHeightPx: 0,
    maxAlphaWidthPx: 0,
    maxAlphaHeightPx: 0,
    sideMarginPx: SIDE_MARGIN,
    rotationDeg: 0,
    allowHorizontalBleed: false,
    noVerticalCrop: true,
    warnings: [],
  };

  if (!enabled || !detection.candidate) {
    return { ...base, reason: enabled ? detection.reason : "wide_hero_disabled" };
  }

  const canvas = input.canvas ?? input.compositionLayout?.canvas ?? { width: CANVAS_W, height: CANVAS_H };
  const aspectRatio = detection.aspectRatio;
  const widthTargetPct = resolveWidthTargetPct(aspectRatio);
  const cropSafeHorizontalPct = resolveCropSafePct(input, widthTargetPct);
  const strategy = pickStrategy(input, widthTargetPct, cropSafeHorizontalPct);

  const heightCap = Math.min(
    canvas.height - HEADER_RESERVE_PX - BOTTOM_PAD,
    PRODUCT_TARGET_MAX_HEIGHT_PX,
  );
  const fullBleedMarginPx = Math.round(xPct(DAOS_WIDE_HERO_FULL_BLEED_SIDE_MARGIN_PCT, canvas));
  const bleedPx = Math.round(xPct(cropSafeHorizontalPct, canvas) / 2);
  const sideMarginPx =
    strategy === "wide_crop_safe"
      ? Math.max(0, fullBleedMarginPx - bleedPx)
      : fullBleedMarginPx;

  let maxWidthPx = Math.round(xPct(widthTargetPct, canvas));
  const maxCanvasWidth = canvas.width - sideMarginPx * 2;
  maxWidthPx = clamp(maxWidthPx, 80, maxCanvasWidth);

  let maxHeightPx = aspectRatio > 0 ? Math.round(maxWidthPx / aspectRatio) : heightCap;
  maxHeightPx = clamp(maxHeightPx, 80, heightCap);

  const maxAlphaWidthPx = maxWidthPx;
  const maxAlphaHeightPx = maxHeightPx;
  const rotationDeg = strategy === "wide_diagonal" ? DAOS_WIDE_HERO_DIAGONAL_ROTATION_DEG : 0;

  const maxWidthPct = (maxWidthPx / canvas.width) * 100;
  const maxHeightPct = (maxHeightPx / canvas.height) * 100;

  const warnings: WideHeroStrategy["warnings"] = [];
  if (maxHeightPx >= heightCap * 0.95) {
    warnings.push({
      code: "HEIGHT_AT_SAFE_CAP",
      message: `Height capped to ${maxHeightPx}px — vertical crop avoided`,
    });
  }

  return {
    enabled,
    applied: true,
    strategy,
    reason: `wide_hero_${strategy}`,
    widthTargetPct,
    cropSafeHorizontalPct,
    maxWidthPct,
    maxHeightPct,
    maxWidthPx,
    maxHeightPx,
    maxAlphaWidthPx,
    maxAlphaHeightPx,
    sideMarginPx,
    rotationDeg,
    allowHorizontalBleed: strategy === "wide_crop_safe",
    noVerticalCrop: true,
    warnings,
  };
}

function mergeWideHeroIntoAsymmetricLimits(
  limits: AsymmetricLimits | undefined,
  strategy: WideHeroStrategy,
): AsymmetricLimits {
  return {
    enabled: limits?.enabled ?? true,
    applied: true,
    fitStrategy: "fit-width",
    maxWidthPct: strategy.maxWidthPct,
    maxHeightPct: strategy.maxHeightPct,
    maxWidthPx: strategy.maxWidthPx,
    maxHeightPx: strategy.maxHeightPx,
    maxAlphaWidthPx: strategy.maxAlphaWidthPx,
    maxAlphaHeightPx: strategy.maxAlphaHeightPx,
    reason: strategy.reason,
    warnings: [...(limits?.warnings ?? []), ...strategy.warnings],
  };
}

function applyLayoutRotation(
  layout: CompositionLayout | undefined,
  rotationDeg: number,
): CompositionLayout | undefined {
  if (!layout || rotationDeg === 0) return layout;
  return {
    ...layout,
    product: {
      ...layout.product,
      rotationDeg,
    },
  };
}

/** Attach wide hero strategy to scene composite options. */
export function applyWideHeroStrategy(
  options: SceneCompositeOptions,
  input: WideHeroStrategyInput,
): WideHeroStrategyApplyResult {
  const strategy = createWideHeroStrategy({
    ...input,
    compositionLayout: input.compositionLayout ?? options.compositionLayout,
    objectScale: input.objectScale ?? options.objectScale,
    productScaleMultiplier: input.productScaleMultiplier ?? options.productScaleMultiplier,
  });

  if (!strategy.applied) {
    return { options, strategy };
  }

  const compositionLayout = applyLayoutRotation(
    input.compositionLayout ?? options.compositionLayout,
    strategy.rotationDeg,
  );

  return {
    options: {
      ...options,
      compositionLayout,
      wideHeroStrategy: strategy,
      asymmetricLimits: mergeWideHeroIntoAsymmetricLimits(options.asymmetricLimits, strategy),
    },
    strategy,
  };
}

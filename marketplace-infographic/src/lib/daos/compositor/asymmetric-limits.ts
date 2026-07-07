import type { CompositionLayout } from "@/lib/composition/types";
import { xPct, yPct } from "@/lib/composition/canvas";
import type { SceneCompositeOptions } from "@/lib/compositing/scene-compositor";
import {
  PRODUCT_ALPHA_MAX_HEIGHT_PX,
  PRODUCT_ALPHA_MAX_WIDTH_PX,
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_SIDE_MARGIN_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";
import { WB_COVER } from "@/lib/composition/canvas";
import type { AspectRatioPlacementPatch, FitStrategy } from "./aspect-ratio-placement-patch";
import { isDaosAspectRatioPlacementPatchEnabled } from "./aspect-ratio-placement-patch";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const HEADER_RESERVE_PX = Math.round(CANVAS_H * 0.2);
const BOTTOM_PAD = PRODUCT_BOTTOM_PAD_PX;
const SIDE_MARGIN = PRODUCT_SIDE_MARGIN_PX;

export type AsymmetricLimitsWarning = {
  code: string;
  message: string;
};

export type AsymmetricLimitsInput = {
  compositionLayout?: CompositionLayout;
  aspectRatioPlacementPatch?: AspectRatioPlacementPatch;
  objectScale?: number;
  productScaleMultiplier?: number;
  canvas?: { width: number; height: number };
};

export type AsymmetricLimits = {
  enabled: boolean;
  applied: boolean;
  fitStrategy: FitStrategy;
  maxWidthPct: number;
  maxHeightPct: number;
  maxWidthPx: number;
  maxHeightPx: number;
  maxAlphaWidthPx: number;
  maxAlphaHeightPx: number;
  reason: string;
  warnings: AsymmetricLimitsWarning[];
};

export type AsymmetricLimitsCompositeResult = {
  options: SceneCompositeOptions;
  limits: AsymmetricLimits;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isDaosCompositorAsymmetricLimitsEnabled(): boolean {
  return (
    process.env.DAOS_COMPOSITOR_ASYMMETRIC_LIMITS === "1" &&
    isDaosAspectRatioPlacementPatchEnabled()
  );
}

function resolveCanvas(input: AsymmetricLimitsInput): { width: number; height: number } {
  return input.canvas ?? input.compositionLayout?.canvas ?? { width: CANVAS_W, height: CANVAS_H };
}

function resolveFitStrategy(input: AsymmetricLimitsInput): FitStrategy {
  if (input.aspectRatioPlacementPatch?.patchApplied) {
    return input.aspectRatioPlacementPatch.fitStrategy;
  }
  const product = input.compositionLayout?.product;
  if (!product) return "balanced-fit";
  const aspect = product.maxWidthPct / Math.max(product.maxHeightPct, 1);
  if (aspect >= 1.35) return "fit-width";
  if (aspect <= 0.75) return "fit-height";
  return "balanced-fit";
}

function resolvePctLimits(input: AsymmetricLimitsInput): { maxWidthPct: number; maxHeightPct: number } {
  const product = input.compositionLayout?.product;
  const patch = input.aspectRatioPlacementPatch;
  if (patch?.patchApplied) {
    return {
      maxWidthPct: patch.afterMaxWidthPct,
      maxHeightPct: patch.afterMaxHeightPct,
    };
  }
  return {
    maxWidthPct: product?.maxWidthPct ?? 42,
    maxHeightPct: product?.maxHeightPct ?? 52,
  };
}

function widthScaleBoost(objectScale: number, multiplier: number, fitStrategy: FitStrategy): number {
  const base = 0.58 + objectScale * 0.05;
  if (fitStrategy === "fit-width") {
    return base * multiplier;
  }
  if (fitStrategy === "fit-height") {
    return base;
  }
  return base * Math.sqrt(multiplier);
}

function heightScaleBoost(objectScale: number, multiplier: number, fitStrategy: FitStrategy): number {
  const base = 0.58 + objectScale * 0.05;
  if (fitStrategy === "fit-height") {
    return base * multiplier;
  }
  if (fitStrategy === "fit-width") {
    return base;
  }
  return base * Math.sqrt(multiplier);
}

/** Build compositor asymmetric size limits from DAOS placement patch. */
export function createAsymmetricLimits(input: AsymmetricLimitsInput): AsymmetricLimits {
  const enabled = isDaosCompositorAsymmetricLimitsEnabled();
  const fitStrategy = resolveFitStrategy(input);
  const { maxWidthPct, maxHeightPct } = resolvePctLimits(input);
  const objectScale = input.objectScale ?? 0.78;
  const multiplier = Math.max(1, input.productScaleMultiplier ?? 1);
  const canvas = resolveCanvas(input);
  const aspectRatio = input.aspectRatioPlacementPatch?.productAspectRatio ?? maxWidthPct / Math.max(maxHeightPct, 1);

  const base: AsymmetricLimits = {
    enabled,
    applied: false,
    fitStrategy,
    maxWidthPct,
    maxHeightPct,
    maxWidthPx: 0,
    maxHeightPx: 0,
    maxAlphaWidthPx: 0,
    maxAlphaHeightPx: 0,
    reason: "asymmetric_limits_disabled",
    warnings: [],
  };

  if (!enabled || !input.compositionLayout) {
    return base;
  }

  const patchApplied = input.aspectRatioPlacementPatch?.patchApplied === true;
  const asymmetricLayout =
    patchApplied ||
    (fitStrategy === "fit-width" && maxHeightPct < maxWidthPct * 0.55) ||
    (fitStrategy === "fit-height" && maxWidthPct < maxHeightPct * 0.55);

  if (!asymmetricLayout) {
    return {
      ...base,
      enabled,
      fitStrategy,
      maxWidthPct,
      maxHeightPct,
      reason: "asymmetric_layout_not_detected",
    };
  }

  const widthCap = Math.min(
    CANVAS_W - SIDE_MARGIN * 2,
    Math.round(PRODUCT_MAX_WIDTH_PX * multiplier),
    PRODUCT_MAX_WIDTH_PX,
  );
  const heightCap = Math.min(
    CANVAS_H - HEADER_RESERVE_PX - BOTTOM_PAD,
    Math.round(PRODUCT_TARGET_MAX_HEIGHT_PX * multiplier),
    PRODUCT_TARGET_MAX_HEIGHT_PX,
  );
  const alphaWidthCap = Math.min(
    CANVAS_W - SIDE_MARGIN * 2,
    Math.round(PRODUCT_ALPHA_MAX_WIDTH_PX * multiplier),
  );
  const alphaHeightCap = Math.min(
    CANVAS_H - HEADER_RESERVE_PX - BOTTOM_PAD,
    Math.round(PRODUCT_ALPHA_MAX_HEIGHT_PX * multiplier),
  );

  let maxWidthPx = Math.round(xPct(maxWidthPct) * widthScaleBoost(objectScale, multiplier, fitStrategy));
  let maxHeightPx = Math.round(yPct(maxHeightPct) * heightScaleBoost(objectScale, multiplier, fitStrategy));

  if (fitStrategy === "fit-width" && aspectRatio > 0) {
    maxWidthPx = Math.min(
      widthCap,
      PRODUCT_MAX_WIDTH_PX,
      Math.round(xPct(maxWidthPct) * widthScaleBoost(objectScale, multiplier, fitStrategy)),
    );
    maxHeightPx = Math.min(Math.round(maxWidthPx / aspectRatio), heightCap);
  } else if (fitStrategy === "fit-height" && aspectRatio > 0) {
    maxHeightPx = Math.min(
      heightCap,
      PRODUCT_TARGET_MAX_HEIGHT_PX,
      Math.round(yPct(maxHeightPct) * heightScaleBoost(objectScale, multiplier, fitStrategy)),
    );
    maxWidthPx = Math.min(Math.round(maxHeightPx * aspectRatio), widthCap);
  } else if (fitStrategy === "balanced-fit") {
    const widthLimitedHeight = Math.round(maxWidthPx / Math.max(aspectRatio, 0.01));
    const heightLimitedWidth = Math.round(maxHeightPx * Math.max(aspectRatio, 0.01));
    if (widthLimitedHeight < maxHeightPx) {
      maxHeightPx = widthLimitedHeight;
    }
    if (heightLimitedWidth < maxWidthPx) {
      maxWidthPx = heightLimitedWidth;
    }
  }

  maxWidthPx = clamp(maxWidthPx, 80, widthCap);
  maxHeightPx = clamp(maxHeightPx, 80, heightCap);

  const maxAlphaWidthPx = clamp(
    Math.min(maxWidthPx, alphaWidthCap),
    80,
    CANVAS_W - SIDE_MARGIN * 2,
  );
  const aspectHeightPx =
    aspectRatio > 0 ? Math.round(maxAlphaWidthPx / aspectRatio) : maxHeightPx;
  const maxAlphaHeightPx = clamp(
    Math.min(
      fitStrategy === "fit-width"
        ? Math.max(maxHeightPx, aspectHeightPx)
        : maxHeightPx,
      alphaHeightCap,
    ),
    80,
    CANVAS_H - HEADER_RESERVE_PX - BOTTOM_PAD,
  );

  const warnings: AsymmetricLimitsWarning[] = [];
  if (maxHeightPx < Math.round(yPct(maxHeightPct) * 0.5)) {
    warnings.push({
      code: "HEIGHT_CAPPED_FOR_ASPECT",
      message: `Height capped to ${maxHeightPx}px for ${fitStrategy}`,
    });
  }

  return {
    enabled,
    applied: true,
    fitStrategy,
    maxWidthPct,
    maxHeightPct,
    maxWidthPx,
    maxHeightPx,
    maxAlphaWidthPx,
    maxAlphaHeightPx,
    reason: `asymmetric_${fitStrategy}`,
    warnings,
  };
}

/** Attach asymmetric compositor limits to scene composite options. */
export function applyAsymmetricLimitsToCompositeOptions(
  options: SceneCompositeOptions,
  input: Omit<AsymmetricLimitsInput, "compositionLayout"> & {
    compositionLayout?: CompositionLayout;
    aspectRatioPlacementPatch?: AspectRatioPlacementPatch;
  },
): AsymmetricLimitsCompositeResult {
  const limits = createAsymmetricLimits({
    compositionLayout: input.compositionLayout ?? options.compositionLayout,
    aspectRatioPlacementPatch: input.aspectRatioPlacementPatch,
    objectScale: options.objectScale,
    productScaleMultiplier: options.productScaleMultiplier,
    canvas: input.canvas,
  });

  if (!limits.applied) {
    return { options, limits };
  }

  return {
    options: {
      ...options,
      asymmetricLimits: limits,
    },
    limits,
  };
}

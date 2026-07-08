import type { CompositionLayout } from "@/lib/composition/types";
import { zoneAreaPct } from "@/lib/composition/canvas";
import type { ProductScaleBounds } from "./product-scale-patch";

export const DAOS_ASPECT_RATIO_WIDE_THRESHOLD = 1.35;
export const DAOS_ASPECT_RATIO_TALL_THRESHOLD = 0.75;
export const DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT = 78;
export const DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT = 20;
export const DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT = 82;
export const DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT = 24;

export type FitStrategy = "fit-width" | "fit-height" | "balanced-fit";

export type AspectRatioPlacementPatchAction = {
  code: string;
  message: string;
};

export type AspectRatioPlacementPatchInput = {
  canvas?: { width: number; height: number };
  compositionLayout?: CompositionLayout;
  targetProductAreaRatio: number;
  currentProductAreaRatio?: number;
  productAspectRatio?: number;
  productBounds?: ProductScaleBounds;
  productCategory?: string;
  productHint?: string;
  heightOverflowDetected?: boolean;
  extractAreaWarnings?: string[];
  objectScale?: number;
};

export type AspectRatioPlacementPatch = {
  enabled: boolean;
  patchApplied: boolean;
  productAspectRatio: number;
  fitStrategy: FitStrategy;
  targetUnreachable: boolean;
  heightOverflowPrevented: boolean;
  widthOverflowPrevented: boolean;
  beforeMaxWidthPct: number;
  beforeMaxHeightPct: number;
  afterMaxWidthPct: number;
  afterMaxHeightPct: number;
  estimatedVisibleAreaRatio: number;
  actions: AspectRatioPlacementPatchAction[];
};

export type AspectRatioPlacementPatchResult = {
  patch: AspectRatioPlacementPatch;
  compositionLayout?: CompositionLayout;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function resolveCanvas(input: AspectRatioPlacementPatchInput): { width: number; height: number } {
  return (
    input.canvas ??
    input.compositionLayout?.canvas ?? { width: 900, height: 1200 }
  );
}

export function isDaosAspectRatioPlacementPatchEnabled(): boolean {
  return process.env.DAOS_ASPECT_RATIO_PLACEMENT_PATCH === "1";
}

function inferCategoryFromHint(hint?: string): string | undefined {
  const normalized = hint?.toLowerCase() ?? "";
  if (/матрас|mattress|\b160x200\b|\b200x160\b/.test(normalized)) return "home";
  if (/коврик|rug\b|\bmat\b/.test(normalized)) return "home";
  return undefined;
}

function resolveProductCategory(input: AspectRatioPlacementPatchInput): string | undefined {
  const fromHint = inferCategoryFromHint(input.productHint);
  const raw = input.productCategory?.toLowerCase();
  if (fromHint && (!raw || raw === "generic")) return fromHint;
  return input.productCategory ?? fromHint;
}

function isWideProductCategory(category?: string): boolean {
  const normalized = category?.toLowerCase() ?? "";
  return normalized === "furniture" || normalized === "home" || normalized === "mattress";
}

function defaultAspectForCategory(category?: string): number | undefined {
  const normalized = category?.toLowerCase() ?? "";
  if (normalized === "home" || normalized === "mattress") return 2.6;
  if (normalized === "furniture") return 1.4;
  return undefined;
}

function resolveProductAspectRatio(input: AspectRatioPlacementPatchInput): number {
  if (input.productAspectRatio != null && input.productAspectRatio > 0) {
    return input.productAspectRatio;
  }

  const category = resolveProductCategory(input);
  const categoryDefault = defaultAspectForCategory(category);
  if (categoryDefault != null && isWideProductCategory(category)) {
    return categoryDefault;
  }

  if (input.productBounds && input.productBounds.height > 0) {
    const boundsAspect = input.productBounds.width / input.productBounds.height;
    if (categoryDefault != null && boundsAspect < DAOS_ASPECT_RATIO_WIDE_THRESHOLD) {
      return categoryDefault;
    }
    return boundsAspect;
  }

  if (categoryDefault != null) return categoryDefault;

  const product = input.compositionLayout?.product;
  if (product && product.height > 0) {
    const zoneAspect = product.width / product.height;
    if (zoneAspect >= DAOS_ASPECT_RATIO_WIDE_THRESHOLD || zoneAspect <= DAOS_ASPECT_RATIO_TALL_THRESHOLD) {
      return zoneAspect;
    }
  }
  if (product && product.maxHeightPct > 0) {
    const canvas = resolveCanvas(input);
    const widthPx = (product.maxWidthPct / 100) * canvas.width;
    const heightPx = (product.maxHeightPct / 100) * canvas.height;
    if (heightPx > 0) return widthPx / heightPx;
  }
  return 1;
}

function hasHeightOverflowSignal(input: AspectRatioPlacementPatchInput): boolean {
  if (input.heightOverflowDetected === true) return true;
  return (input.extractAreaWarnings ?? []).some((warning) => warning === "HEIGHT_OVERFLOW");
}

function chooseFitStrategy(
  aspectRatio: number,
  input: AspectRatioPlacementPatchInput,
): FitStrategy {
  if (hasHeightOverflowSignal(input) || isWideProductCategory(resolveProductCategory(input))) {
    return aspectRatio >= 1 ? "fit-width" : "balanced-fit";
  }
  if (aspectRatio >= DAOS_ASPECT_RATIO_WIDE_THRESHOLD) return "fit-width";
  if (aspectRatio <= DAOS_ASPECT_RATIO_TALL_THRESHOLD) return "fit-height";
  return "balanced-fit";
}

function heightPctForWidth(maxWidthPct: number, aspectRatio: number, canvas: { width: number; height: number }): number {
  if (aspectRatio <= 0) return DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT;
  return (maxWidthPct * canvas.width) / (aspectRatio * canvas.height);
}

function widthPctForHeight(maxHeightPct: number, aspectRatio: number, canvas: { width: number; height: number }): number {
  if (aspectRatio <= 0) return DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT;
  return (maxHeightPct * canvas.height * aspectRatio) / canvas.width;
}

function estimateVisibleAreaRatio(
  maxWidthPct: number,
  maxHeightPct: number,
  objectScale = 0.78,
  aspectRatio = 1,
  fitStrategy?: FitStrategy,
): number {
  const scaleBoost = 0.58 + objectScale * 0.05;
  let effectiveW = (maxWidthPct / 100) * scaleBoost;
  let effectiveH = (maxHeightPct / 100) * scaleBoost;

  if (fitStrategy === "fit-width" || aspectRatio >= DAOS_ASPECT_RATIO_WIDE_THRESHOLD) {
    effectiveH = Math.min(effectiveH, effectiveW / Math.max(aspectRatio, 0.01));
  } else if (fitStrategy === "fit-height" || aspectRatio <= DAOS_ASPECT_RATIO_TALL_THRESHOLD) {
    effectiveW = Math.min(effectiveW, effectiveH * Math.max(aspectRatio, 0.01));
  }

  return clamp01(effectiveW * effectiveH);
}

function computeFitDimensions(
  strategy: FitStrategy,
  aspectRatio: number,
  targetAreaRatio: number,
  canvas: { width: number; height: number },
  beforeWidthPct: number,
  beforeHeightPct: number,
): {
  maxWidthPct: number;
  maxHeightPct: number;
  heightOverflowPrevented: boolean;
  widthOverflowPrevented: boolean;
  targetUnreachable: boolean;
} {
  let maxWidthPct = beforeWidthPct;
  let maxHeightPct = beforeHeightPct;
  let heightOverflowPrevented = false;
  let widthOverflowPrevented = false;
  let targetUnreachable = false;

  const targetWidthFromArea = Math.sqrt(targetAreaRatio * aspectRatio * (canvas.height / canvas.width)) * 100;
  const targetHeightFromArea = Math.sqrt(targetAreaRatio / aspectRatio * (canvas.width / canvas.height)) * 100;

  if (strategy === "fit-width") {
    maxWidthPct = clamp(
      Math.max(beforeWidthPct, targetWidthFromArea),
      DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT,
      DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT,
    );
    const naturalHeightPct = heightPctForWidth(maxWidthPct, aspectRatio, canvas);
    if (naturalHeightPct > DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT) {
      heightOverflowPrevented = true;
      maxHeightPct = DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT;
      const adjustedWidthPct = widthPctForHeight(maxHeightPct, aspectRatio, canvas);
      if (adjustedWidthPct < maxWidthPct) {
        maxWidthPct = clamp(
          adjustedWidthPct,
          DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT,
          DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT,
        );
      }
    } else {
      maxHeightPct = clamp(
        naturalHeightPct,
        DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT,
        DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT,
      );
    }
  } else if (strategy === "fit-height") {
    maxHeightPct = clamp(
      Math.max(beforeHeightPct, targetHeightFromArea),
      DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT,
      DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT,
    );
    const naturalWidthPct = widthPctForHeight(maxHeightPct, aspectRatio, canvas);
    if (naturalWidthPct > DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT) {
      widthOverflowPrevented = true;
      maxWidthPct = DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT;
      const adjustedHeightPct = heightPctForWidth(maxWidthPct, aspectRatio, canvas);
      maxHeightPct = clamp(
        adjustedHeightPct,
        DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT,
        DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT,
      );
    } else {
      maxWidthPct = clamp(
        naturalWidthPct,
        DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT,
        DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT,
      );
    }
  } else {
    maxWidthPct = clamp(
      Math.max(beforeWidthPct, targetWidthFromArea),
      DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT,
      DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT,
    );
    maxHeightPct = clamp(
      Math.max(beforeHeightPct, targetHeightFromArea),
      DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT,
      DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT,
    );
    const widthLimitedHeight = heightPctForWidth(maxWidthPct, aspectRatio, canvas);
    const heightLimitedWidth = widthPctForHeight(maxHeightPct, aspectRatio, canvas);
    if (widthLimitedHeight < maxHeightPct) {
      heightOverflowPrevented = true;
      maxHeightPct = clamp(
        widthLimitedHeight,
        DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT,
        DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT,
      );
    }
    if (heightLimitedWidth < maxWidthPct) {
      widthOverflowPrevented = true;
      maxWidthPct = clamp(
        heightLimitedWidth,
        DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT,
        DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT,
      );
      maxHeightPct = clamp(
        heightPctForWidth(maxWidthPct, aspectRatio, canvas),
        DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT,
        DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT,
      );
    }
  }

  maxWidthPct = clamp(maxWidthPct, DAOS_ASPECT_RATIO_SAFE_MIN_WIDTH_PCT, DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT);
  maxHeightPct = clamp(maxHeightPct, DAOS_ASPECT_RATIO_SAFE_MIN_HEIGHT_PCT, DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT);

  const estimatedVisible = estimateVisibleAreaRatio(maxWidthPct, maxHeightPct);
  if (estimatedVisible + 0.005 < targetAreaRatio) {
    targetUnreachable = true;
  }

  return {
    maxWidthPct,
    maxHeightPct,
    heightOverflowPrevented,
    widthOverflowPrevented,
    targetUnreachable,
  };
}

function cloneCompositionLayout(layout: CompositionLayout): CompositionLayout {
  return {
    ...layout,
    canvas: { ...layout.canvas },
    product: { ...layout.product },
    headline: { ...layout.headline },
    subtitle: { ...layout.subtitle },
    leftPanel: { ...layout.leftPanel },
    rightSidebar: { ...layout.rightSidebar },
    bullets: { ...layout.bullets },
    plaques: { ...layout.plaques },
    icon: { ...layout.icon },
    logo: layout.logo ? { ...layout.logo } : undefined,
    metrics: { ...layout.metrics },
    issues: [...layout.issues],
    adjustments: [...layout.adjustments],
    dna: layout.dna,
  };
}

function safeInsetPct(layout: CompositionLayout): number {
  return layout.safeInsetPct > 1 ? layout.safeInsetPct : layout.safeInsetPct * 100;
}

function shouldApplyPatch(input: AspectRatioPlacementPatchInput, aspectRatio: number): boolean {
  if (!input.compositionLayout) return false;
  if (isWideProductCategory(resolveProductCategory(input))) return true;
  const extreme =
    aspectRatio >= DAOS_ASPECT_RATIO_WIDE_THRESHOLD ||
    aspectRatio <= DAOS_ASPECT_RATIO_TALL_THRESHOLD ||
    hasHeightOverflowSignal(input);
  const lowArea = (input.currentProductAreaRatio ?? 1) < input.targetProductAreaRatio - 0.02;
  return extreme || lowArea;
}

/** Build aspect-ratio placement correction plan after product fill target is known. */
export function createAspectRatioPlacementPatch(
  input: AspectRatioPlacementPatchInput,
): AspectRatioPlacementPatch {
  const enabled = isDaosAspectRatioPlacementPatchEnabled();
  const compositionLayout = input.compositionLayout;
  const aspectRatio = resolveProductAspectRatio(input);
  const beforeMaxWidthPct = compositionLayout?.product.maxWidthPct ?? 42;
  const beforeMaxHeightPct = compositionLayout?.product.maxHeightPct ?? 52;
  const objectScale = input.objectScale ?? 0.78;
  const fitStrategy = chooseFitStrategy(aspectRatio, input);
  const beforeVisible = estimateVisibleAreaRatio(
    beforeMaxWidthPct,
    beforeMaxHeightPct,
    objectScale,
    aspectRatio,
    fitStrategy,
  );

  const basePatch: AspectRatioPlacementPatch = {
    enabled,
    patchApplied: false,
    productAspectRatio: aspectRatio,
    fitStrategy,
    targetUnreachable: false,
    heightOverflowPrevented: false,
    widthOverflowPrevented: false,
    beforeMaxWidthPct,
    beforeMaxHeightPct,
    afterMaxWidthPct: beforeMaxWidthPct,
    afterMaxHeightPct: beforeMaxHeightPct,
    estimatedVisibleAreaRatio: beforeVisible,
    actions: [],
  };

  if (!enabled || !compositionLayout || !shouldApplyPatch(input, aspectRatio)) {
    return basePatch;
  }

  const canvas = resolveCanvas(input);
  const fit = computeFitDimensions(
    fitStrategy,
    aspectRatio,
    input.targetProductAreaRatio,
    canvas,
    beforeMaxWidthPct,
    beforeMaxHeightPct,
  );

  const afterVisible = estimateVisibleAreaRatio(
    fit.maxWidthPct,
    fit.maxHeightPct,
    objectScale,
    aspectRatio,
    fitStrategy,
  );
  if (afterVisible + 0.001 < beforeVisible) {
    const overflowFix =
      (isWideProductCategory(resolveProductCategory(input)) ||
        aspectRatio >= DAOS_ASPECT_RATIO_WIDE_THRESHOLD ||
        hasHeightOverflowSignal(input)) &&
      fit.maxHeightPct < beforeMaxHeightPct - 0.5;
    if (!overflowFix) {
      return {
        ...basePatch,
        fitStrategy,
        targetUnreachable: true,
        heightOverflowPrevented: fit.heightOverflowPrevented,
        widthOverflowPrevented: fit.widthOverflowPrevented,
        actions: [
          {
            code: "ASPECT_RATIO_SKIP_REGRESSION",
            message: "Skipped aspect-ratio correction — would reduce visible area",
          },
        ],
      };
    }
  }

  const actions: AspectRatioPlacementPatchAction[] = [
    {
      code: "ASPECT_RATIO_FIT_STRATEGY",
      message: `Fit strategy ${fitStrategy} for aspect ${aspectRatio.toFixed(2)}`,
    },
  ];
  if (fit.heightOverflowPrevented) {
    actions.push({
      code: "HEIGHT_OVERFLOW_PREVENTED",
      message: "Constrained height to stay within safe canvas bounds",
    });
  }
  if (fit.widthOverflowPrevented) {
    actions.push({
      code: "WIDTH_OVERFLOW_PREVENTED",
      message: "Constrained width to stay within safe canvas bounds",
    });
  }
  if (fit.targetUnreachable) {
    actions.push({
      code: "TARGET_UNREACHABLE",
      message: `Target ${input.targetProductAreaRatio.toFixed(2)} exceeds safe visible area ${afterVisible.toFixed(2)}`,
    });
  }

  const changed =
    Math.abs(fit.maxWidthPct - beforeMaxWidthPct) > 0.05 ||
    Math.abs(fit.maxHeightPct - beforeMaxHeightPct) > 0.05;

  if (changed) {
    actions.push({
      code: "ASPECT_RATIO_PLACEMENT_CORRECTED",
      message: `Placement ${beforeMaxWidthPct.toFixed(1)}×${beforeMaxHeightPct.toFixed(1)}% → ${fit.maxWidthPct.toFixed(1)}×${fit.maxHeightPct.toFixed(1)}%`,
    });
  }

  return {
    enabled,
    patchApplied: changed,
    productAspectRatio: aspectRatio,
    fitStrategy,
    targetUnreachable: fit.targetUnreachable,
    heightOverflowPrevented: fit.heightOverflowPrevented,
    widthOverflowPrevented: fit.widthOverflowPrevented,
    beforeMaxWidthPct,
    beforeMaxHeightPct,
    afterMaxWidthPct: fit.maxWidthPct,
    afterMaxHeightPct: fit.maxHeightPct,
    estimatedVisibleAreaRatio: afterVisible,
    actions,
  };
}

/** Apply aspect-ratio placement correction to composition layout without mutating the input. */
export function applyAspectRatioPlacementPatch(
  input: AspectRatioPlacementPatchInput,
): AspectRatioPlacementPatchResult {
  const plan = createAspectRatioPlacementPatch(input);

  if (!plan.enabled || !plan.patchApplied || !input.compositionLayout) {
    return { patch: plan };
  }

  const compositionLayout = cloneCompositionLayout(input.compositionLayout);
  const margin = Math.max(5, safeInsetPct(compositionLayout));
  const heroCenterX = compositionLayout.product.left + compositionLayout.product.width / 2;
  const heroCenterY = compositionLayout.product.top + compositionLayout.product.height / 2;

  compositionLayout.product.maxWidthPct = plan.afterMaxWidthPct;
  compositionLayout.product.maxHeightPct = plan.afterMaxHeightPct;

  const zoneWidthPct = clamp(
    widthPctForHeight(plan.afterMaxHeightPct, plan.productAspectRatio, resolveCanvas(input)),
    24,
    80,
  );
  const zoneHeightPct = clamp(
    heightPctForWidth(plan.afterMaxWidthPct, plan.productAspectRatio, resolveCanvas(input)),
    28,
    85,
  );

  compositionLayout.product.width = zoneWidthPct;
  compositionLayout.product.height = zoneHeightPct;
  compositionLayout.product.left = clamp(
    heroCenterX - zoneWidthPct / 2,
    margin,
    100 - margin - zoneWidthPct,
  );
  compositionLayout.product.top = clamp(
    heroCenterY - zoneHeightPct / 2,
    12,
    88 - zoneHeightPct,
  );
  compositionLayout.product.areaPct = clamp(
    zoneAreaPct(plan.afterMaxWidthPct, plan.afterMaxHeightPct),
    compositionLayout.product.areaPct,
    78,
  );
  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    productAreaPct: Math.max(
      compositionLayout.metrics.productAreaPct,
      Math.round(plan.estimatedVisibleAreaRatio * 100),
    ),
  };
  compositionLayout.adjustments = [
    ...compositionLayout.adjustments,
    "daos_aspect_ratio_placement_patch",
  ];

  return {
    patch: {
      ...plan,
      patchApplied: true,
      actions: [
        ...plan.actions,
        {
          code: "CENTER_IN_HERO_ZONE",
          message: "Centered aspect-corrected product in hero zone",
        },
      ],
    },
    compositionLayout,
  };
}

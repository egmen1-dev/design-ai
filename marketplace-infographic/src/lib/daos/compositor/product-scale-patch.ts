import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { SceneCompositeOptions } from "@/lib/compositing/scene-compositor";
import { zoneAreaPct } from "@/lib/composition/canvas";

export const DAOS_PRODUCT_SCALE_TRIGGER = 0.35;
export const DAOS_PRODUCT_SCALE_TARGET_MIN = 0.42;
export const DAOS_PRODUCT_SCALE_TARGET_MAX = 0.55;
export const DAOS_PRODUCT_SCALE_MULTIPLIER_MIN = 1;
export const DAOS_PRODUCT_SCALE_MULTIPLIER_MAX = 3.5;
export const DAOS_PRODUCT_FILL_V2_MULTIPLIER_MAX = 4.2;
export const DAOS_PRODUCT_FILL_V2_LAW003_BOOST = 0.05;
export const DAOS_PRODUCT_FILL_V2_OVERLAY_DENSITY_SAFE = 0.25;
export const DAOS_PRODUCT_FILL_V2_LAW014_OVERLAP_PCT = 2;

export type ProductComplexity = "low" | "medium" | "high";

const PRODUCT_FILL_V2_COMPLEXITY_BANDS: Record<
  ProductComplexity,
  { min: number; max: number }
> = {
  low: { min: 0.38, max: 0.44 },
  medium: { min: 0.42, max: 0.5 },
  high: { min: 0.46, max: 0.55 },
};

export type ProductScaleBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ProductScalePatchWarning = {
  code: string;
  message: string;
};

export type ProductScalePatchAction = {
  code: string;
  message: string;
};

export type ProductScalePatchInput = {
  canvas?: { width: number; height: number };
  productBounds?: ProductScaleBounds;
  plannedProductAreaPct?: number;
  compositionLayout?: CompositionLayout;
  layoutSpec?: LayoutSpec;
  compositeInput?: Partial<SceneCompositeOptions>;
  productComplexity?: ProductComplexity;
  overlayDensity?: number;
  law003AfterStillFailing?: boolean;
  law014RiskHigh?: boolean;
  law014ContrastViolation?: boolean;
};

export type ProductScalePatch = {
  enabled: boolean;
  patchApplied: boolean;
  scaleMultiplier: number;
  beforeProductAreaRatio: number;
  targetProductAreaRatio: number;
  estimatedAfterProductAreaRatio: number;
  placementPatch?: ProductScaleBounds;
  warnings: ProductScalePatchWarning[];
  actions: ProductScalePatchAction[];
  productFillV2Enabled?: boolean;
  productFillTargetReason?: string;
  productFillV2Target?: number;
  productFillV2Applied?: boolean;
};

export type ProductScalePatchResult = {
  patch: ProductScalePatch;
  compositionLayout?: CompositionLayout;
  objectScale?: number;
  productScaleMultiplier?: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function resolveCanvas(input: ProductScalePatchInput): { width: number; height: number } {
  return (
    input.canvas ??
    input.compositionLayout?.canvas ??
    input.layoutSpec?.geometry?.canvas ?? { width: 900, height: 1200 }
  );
}

function boundsAreaRatio(bounds: ProductScaleBounds, canvas: { width: number; height: number }): number {
  const canvasArea = canvas.width * canvas.height;
  if (canvasArea <= 0) return 0;
  return clamp01((bounds.width * bounds.height) / canvasArea);
}

function estimateCompositorAreaRatio(input: ProductScalePatchInput): number | undefined {
  const canvas = resolveCanvas(input);
  const objectScale = input.compositeInput?.objectScale ?? 0.78;
  const scaleBoost = 0.58 + objectScale * 0.05;
  const comp = input.compositionLayout?.product;
  if (!comp) return undefined;

  const zoneW = (comp.maxWidthPct / 100) * canvas.width;
  const zoneH = (comp.maxHeightPct / 100) * canvas.height;
  const maxW = Math.min(canvas.width * 0.68, zoneW * scaleBoost);
  const maxH = Math.min(canvas.height * 0.58, zoneH * scaleBoost);
  return clamp01((maxW * maxH) / (canvas.width * canvas.height));
}

function resolveActualProductAreaRatio(input: ProductScalePatchInput): number | undefined {
  const canvas = resolveCanvas(input);

  if (input.productBounds) {
    return boundsAreaRatio(input.productBounds, canvas);
  }

  const comp = input.compositionLayout?.product;
  if (comp) {
    const fromCompositor = estimateCompositorAreaRatio(input);
    if (fromCompositor != null) return fromCompositor;
    return clamp01(zoneAreaPct(comp.width, comp.height) / 100);
  }

  if (typeof input.plannedProductAreaPct === "number") {
    return clamp01(input.plannedProductAreaPct / 100);
  }

  if (typeof input.layoutSpec?.heroScale === "number") {
    return clamp01(input.layoutSpec.heroScale / 100);
  }

  return undefined;
}

function resolvePlannedProductAreaPct(input: ProductScalePatchInput): number | undefined {
  if (typeof input.plannedProductAreaPct === "number") return input.plannedProductAreaPct;
  if (typeof input.compositionLayout?.metrics?.productAreaPct === "number") {
    return input.compositionLayout.metrics.productAreaPct;
  }
  if (typeof input.layoutSpec?.heroScale === "number") return input.layoutSpec.heroScale;
  return undefined;
}

function resolveTargetProductAreaRatio(actual: number): number {
  const deficit = clamp01((DAOS_PRODUCT_SCALE_TRIGGER - actual) / DAOS_PRODUCT_SCALE_TRIGGER);
  return clamp(
    DAOS_PRODUCT_SCALE_TARGET_MIN + deficit * (DAOS_PRODUCT_SCALE_TARGET_MAX - DAOS_PRODUCT_SCALE_TARGET_MIN),
    DAOS_PRODUCT_SCALE_TARGET_MIN,
    DAOS_PRODUCT_SCALE_TARGET_MAX,
  );
}

export function isDaosProductFillV2Enabled(): boolean {
  return process.env.DAOS_PRODUCT_FILL_V2 === "1";
}

export function inferProductComplexity(category?: string): ProductComplexity {
  const normalized = category?.toLowerCase() ?? "";
  if (normalized === "furniture") return "high";
  if (normalized === "toys" || normalized === "kitchen") return "low";
  return "medium";
}

function resolveOverlayDensity(input: ProductScalePatchInput): number {
  if (typeof input.overlayDensity === "number") return clamp01(input.overlayDensity);
  const metrics = input.compositionLayout?.metrics;
  if (!metrics) return 0;
  return clamp01(
    (metrics.textAreaPct ?? 0) / 100 +
      (metrics.plaqueAreaPct ?? 0) / 100 +
      ((metrics.overlapPct ?? 0) / 100) * 0.5,
  );
}

function resolveLaw014RiskHigh(input: ProductScalePatchInput): boolean {
  if (input.law014RiskHigh != null) return input.law014RiskHigh;
  if (input.law014ContrastViolation === true) return true;
  const overlap = input.compositionLayout?.metrics?.overlapPct ?? 0;
  return overlap > DAOS_PRODUCT_FILL_V2_LAW014_OVERLAP_PCT;
}

function estimateLaw003AfterStillFailing(
  input: ProductScalePatchInput,
  actual: number,
  target: number,
): boolean {
  if (input.law003AfterStillFailing != null) return input.law003AfterStillFailing;
  const whitespacePct = input.compositionLayout?.metrics?.whitespacePct ?? 28;
  const overlayDensity = resolveOverlayDensity(input);
  return (
    whitespacePct > 35 &&
    actual < target &&
    overlayDensity <= DAOS_PRODUCT_FILL_V2_OVERLAY_DENSITY_SAFE
  );
}

function resolveV2TargetProductAreaRatio(
  input: ProductScalePatchInput,
  actual: number,
): { target: number; reason: string; applied: boolean } {
  const complexity = input.productComplexity ?? "medium";
  const band = PRODUCT_FILL_V2_COMPLEXITY_BANDS[complexity];
  const deficit = clamp01((band.max - actual) / Math.max(band.max - band.min, 0.01));
  let target = band.min + deficit * (band.max - band.min);
  let reason = `v2_${complexity}_band`;

  const overlayDensity = resolveOverlayDensity(input);
  const law014High = resolveLaw014RiskHigh(input);
  const law003Still = estimateLaw003AfterStillFailing(input, actual, target);

  if (law003Still && overlayDensity <= DAOS_PRODUCT_FILL_V2_OVERLAY_DENSITY_SAFE && !law014High) {
    target = Math.min(band.max, target + DAOS_PRODUCT_FILL_V2_LAW003_BOOST);
    reason += "+law003_boost";
  } else if (law014High) {
    target = Math.min(target, band.min);
    reason += "+law014_cap";
  }

  target = clamp(target, band.min, band.max);
  const applied = actual < target - 0.005;

  return { target, reason, applied };
}

function shouldApplyProductScalePatch(
  actual: number,
  target: number,
  input: ProductScalePatchInput,
): boolean {
  if (isDaosProductFillV2Enabled()) {
    const law003Still = estimateLaw003AfterStillFailing(input, actual, target);
    if (resolveLaw014RiskHigh(input) && actual >= DAOS_PRODUCT_SCALE_TRIGGER) {
      return false;
    }
    return actual < DAOS_PRODUCT_SCALE_TRIGGER || (law003Still && actual < target);
  }
  return actual < DAOS_PRODUCT_SCALE_TRIGGER;
}

function computeScaleMultiplier(actual: number, target: number, maxMultiplier: number): number {
  if (actual <= 0) return maxMultiplier;
  const raw = Math.sqrt(target / actual);
  return clamp(raw, DAOS_PRODUCT_SCALE_MULTIPLIER_MIN, maxMultiplier);
}

function safeInsetPct(layout: CompositionLayout): number {
  return layout.safeInsetPct > 1 ? layout.safeInsetPct : layout.safeInsetPct * 100;
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

function buildPlacementPatch(
  layout: CompositionLayout,
  widthPct: number,
  heightPct: number,
): ProductScaleBounds {
  const margin = Math.max(5, safeInsetPct(layout));
  const heroCenterX = layout.product.left + layout.product.width / 2;
  const heroCenterY = layout.product.top + layout.product.height / 2;
  const leftPct = clamp(heroCenterX - widthPct / 2, margin, 100 - margin - widthPct);
  const topPct = clamp(heroCenterY - heightPct / 2, 12, 88 - heightPct);
  const canvas = layout.canvas;

  return {
    left: Math.round((leftPct / 100) * canvas.width),
    top: Math.round((topPct / 100) * canvas.height),
    width: Math.round((widthPct / 100) * canvas.width),
    height: Math.round((heightPct / 100) * canvas.height),
  };
}

export function isDaosProductScalePatchEnabled(): boolean {
  return process.env.DAOS_PRODUCT_SCALE_PATCH === "1";
}

/** Build deterministic compositor product scale patch plan. */
export function createProductScalePatch(input: ProductScalePatchInput): ProductScalePatch {
  const warnings: ProductScalePatchWarning[] = [];
  const actions: ProductScalePatchAction[] = [];
  const actual = resolveActualProductAreaRatio(input);
  const beforeProductAreaRatio = actual ?? 0;
  const v2Enabled = isDaosProductFillV2Enabled() && isDaosProductScalePatchEnabled();

  if (actual == null) {
    warnings.push({
      code: "PRODUCT_BOUNDS_MISSING",
      message: "Product bounds unavailable — using planned layout/composition metadata",
    });
  }

  let targetProductAreaRatio = beforeProductAreaRatio;
  let productFillTargetReason: string | undefined;
  let productFillV2Target: number | undefined;
  let productFillV2Applied = false;

  if (v2Enabled && actual != null) {
    const v2Target = resolveV2TargetProductAreaRatio(input, actual);
    targetProductAreaRatio = v2Target.target;
    productFillTargetReason = v2Target.reason;
    productFillV2Target = v2Target.target;
    productFillV2Applied = v2Target.applied;
  } else if (actual != null) {
    targetProductAreaRatio = resolveTargetProductAreaRatio(actual);
  }

  const multiplierMax = v2Enabled
    ? DAOS_PRODUCT_FILL_V2_MULTIPLIER_MAX
    : DAOS_PRODUCT_SCALE_MULTIPLIER_MAX;

  if (actual == null || !shouldApplyProductScalePatch(actual, targetProductAreaRatio, input)) {
    return {
      enabled: isDaosProductScalePatchEnabled(),
      patchApplied: false,
      scaleMultiplier: 1,
      beforeProductAreaRatio,
      targetProductAreaRatio: beforeProductAreaRatio,
      estimatedAfterProductAreaRatio: beforeProductAreaRatio,
      warnings,
      actions,
      productFillV2Enabled: v2Enabled,
      productFillTargetReason,
      productFillV2Target,
      productFillV2Applied: false,
    };
  }

  const scaleMultiplier = computeScaleMultiplier(actual, targetProductAreaRatio, multiplierMax);
  const estimatedAfterProductAreaRatio = clamp01(actual * scaleMultiplier * scaleMultiplier);

  actions.push({
    code: v2Enabled ? "BOOST_PRODUCT_SCALE_V2" : "BOOST_PRODUCT_SCALE",
    message: `Scale product from ${actual.toFixed(2)} toward ${targetProductAreaRatio.toFixed(2)} area ratio`,
  });
  if (v2Enabled && productFillV2Applied) {
    actions.push({
      code: "PRODUCT_FILL_V2_TARGET",
      message: `Product fill v2 target ${targetProductAreaRatio.toFixed(2)} (${productFillTargetReason})`,
    });
  }
  actions.push({
    code: "CENTER_IN_HERO_ZONE",
    message: "Center scaled product inside hero safe zone",
  });

  let placementPatch: ProductScaleBounds | undefined;
  if (input.compositionLayout) {
    const widthPct = clamp(
      input.compositionLayout.product.maxWidthPct * scaleMultiplier,
      20,
      78,
    );
    const heightPct = clamp(
      input.compositionLayout.product.maxHeightPct * scaleMultiplier,
      24,
      82,
    );
    placementPatch = buildPlacementPatch(input.compositionLayout, widthPct, heightPct);
    actions.push({
      code: "APPLY_PLACEMENT_PATCH",
      message: `Placement patch ${placementPatch.width}×${placementPatch.height}px`,
    });
  }

  return {
    enabled: isDaosProductScalePatchEnabled(),
    patchApplied: false,
    scaleMultiplier,
    beforeProductAreaRatio,
    targetProductAreaRatio,
    estimatedAfterProductAreaRatio,
    placementPatch,
    warnings,
    actions,
    productFillV2Enabled: v2Enabled,
    productFillTargetReason,
    productFillV2Target,
    productFillV2Applied,
  };
}

/** Clone composite inputs and apply product scale patch without mutating originals. */
export function applyProductScalePatch(input: ProductScalePatchInput): ProductScalePatchResult {
  const plan = createProductScalePatch(input);

  if (!isDaosProductScalePatchEnabled() || !plan.actions.length) {
    return { patch: { ...plan, enabled: isDaosProductScalePatchEnabled(), patchApplied: false } };
  }

  const appliedActions = [...plan.actions];
  const baseComposite = input.compositeInput ?? {};
  const compositionLayout = input.compositionLayout
    ? cloneCompositionLayout(input.compositionLayout)
    : undefined;

  if (!compositionLayout) {
    return {
      patch: {
        ...plan,
        enabled: true,
        patchApplied: false,
        warnings: [
          ...plan.warnings,
          {
            code: "PRODUCT_BOUNDS_MISSING",
            message: "compositionLayout missing — patch not applied",
          },
        ],
      },
    };
  }

  const widthPct = clamp(
    compositionLayout.product.maxWidthPct * plan.scaleMultiplier,
    20,
    78,
  );
  const heightPct = clamp(
    compositionLayout.product.maxHeightPct * plan.scaleMultiplier,
    24,
    82,
  );
  const zoneWidthPct = clamp(compositionLayout.product.width * Math.min(plan.scaleMultiplier, 1.6), 24, 80);
  const zoneHeightPct = clamp(
    compositionLayout.product.height * Math.min(plan.scaleMultiplier, 1.6),
    28,
    85,
  );
  const margin = Math.max(5, safeInsetPct(compositionLayout));
  const heroCenterX = compositionLayout.product.left + compositionLayout.product.width / 2;
  const heroCenterY = compositionLayout.product.top + compositionLayout.product.height / 2;

  compositionLayout.product.maxWidthPct = widthPct;
  compositionLayout.product.maxHeightPct = heightPct;
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
    zoneAreaPct(widthPct, heightPct),
    compositionLayout.product.areaPct,
    78,
  );
  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    productAreaPct: Math.max(
      compositionLayout.metrics.productAreaPct,
      Math.round(plan.targetProductAreaRatio * 100),
    ),
  };
  compositionLayout.adjustments = [
    ...compositionLayout.adjustments,
    plan.productFillV2Enabled ? "daos_product_fill_v2_patch" : "daos_product_scale_patch",
  ];

  const placementPatch = buildPlacementPatch(compositionLayout, widthPct, heightPct);
  const boostedObjectScale = clamp(
    (baseComposite.objectScale ?? 0.78) * (1 + (plan.scaleMultiplier - 1) * 0.18),
    0.55,
    1.15,
  );

  appliedActions.push({
    code: "UPDATE_COMPOSITOR_LIMITS",
    message: `objectScale ${boostedObjectScale.toFixed(2)}, multiplier ${plan.scaleMultiplier.toFixed(2)}`,
  });

  return {
    patch: {
      ...plan,
      enabled: true,
      patchApplied: true,
      actions: appliedActions,
      placementPatch,
      estimatedAfterProductAreaRatio: clamp01(
        plan.beforeProductAreaRatio * plan.scaleMultiplier * plan.scaleMultiplier,
      ),
      productFillV2Applied: plan.productFillV2Enabled ? true : plan.productFillV2Applied,
    },
    compositionLayout,
    objectScale: boostedObjectScale,
    productScaleMultiplier: plan.scaleMultiplier,
  };
}

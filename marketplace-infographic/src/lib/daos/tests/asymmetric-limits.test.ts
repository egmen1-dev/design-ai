/**
 * DAOS Wave 32 — compositor asymmetric limits tests
 * Run: npx tsx src/lib/daos/tests/asymmetric-limits.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import type { AspectRatioPlacementPatch } from "../compositor/aspect-ratio-placement-patch";
import {
  applyAsymmetricLimitsToCompositeOptions,
  createAsymmetricLimits,
  isDaosCompositorAsymmetricLimitsEnabled,
} from "../compositor/asymmetric-limits";

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const compositionLayout: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 6,
  product: {
    left: 46,
    top: 22,
    width: 48,
    height: 58,
    centerX: 0.68,
    centerY: 0.52,
    maxWidthPct: 78,
    maxHeightPct: 24,
    areaPct: 30,
    rotationDeg: 0,
  },
  headline: { left: 40, top: 60, width: 320, height: 90, fontSizePct: 8 },
  subtitle: { left: 40, top: 150, width: 300, height: 50, fontSizePct: 4 },
  leftPanel: { left: 30, top: 220, width: 340, height: 420 },
  rightSidebar: { left: 700, top: 220, width: 160, height: 420 },
  bullets: { left: 40, top: 240, width: 300, height: 180, itemHeightPct: 6, gapPct: 2, maxCount: 2 },
  plaques: {
    smallWidthPct: 18,
    mediumWidthPct: 24,
    largeWidthPct: 30,
    heightPct: 8,
    maxTotalAreaPct: 12,
  },
  icon: { sizePct: 4, textGapPct: 2 },
  textSide: "left",
  metrics: {
    productAreaPct: 22,
    textAreaPct: 14,
    plaqueAreaPct: 8,
    whitespacePct: 56,
    overlapPct: 1,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

const widePatch: AspectRatioPlacementPatch = {
  enabled: true,
  patchApplied: true,
  productAspectRatio: 2.6,
  fitStrategy: "fit-width",
  targetUnreachable: true,
  heightOverflowPrevented: false,
  widthOverflowPrevented: false,
  beforeMaxWidthPct: 75,
  beforeMaxHeightPct: 75,
  afterMaxWidthPct: 78,
  afterMaxHeightPct: 24,
  estimatedVisibleAreaRatio: 0.08,
  actions: [],
};

const tallPatch: AspectRatioPlacementPatch = {
  ...widePatch,
  productAspectRatio: 0.55,
  fitStrategy: "fit-height",
  afterMaxWidthPct: 40,
  afterMaxHeightPct: 75,
};

withEnv(
  {
    DAOS_ASPECT_RATIO_PLACEMENT_PATCH: "1",
    DAOS_COMPOSITOR_ASYMMETRIC_LIMITS: "1",
  },
  () => {
    assert.equal(isDaosCompositorAsymmetricLimitsEnabled(), true);

    const wide = createAsymmetricLimits({
      compositionLayout,
      aspectRatioPlacementPatch: widePatch,
      objectScale: 0.78,
      productScaleMultiplier: 1.8,
    });
    assert.equal(wide.fitStrategy, "fit-width");
    assert.equal(wide.applied, true);
    assert.ok(wide.maxWidthPx > wide.maxHeightPx);
    assert.ok(wide.maxAlphaHeightPx <= wide.maxHeightPx);
    console.log("✓ wide product → fit-width");

    const tall = createAsymmetricLimits({
      compositionLayout: {
        ...compositionLayout,
        product: { ...compositionLayout.product, maxWidthPct: 40, maxHeightPct: 75 },
      },
      aspectRatioPlacementPatch: tallPatch,
      objectScale: 0.78,
      productScaleMultiplier: 1.5,
    });
    assert.equal(tall.fitStrategy, "fit-height");
    assert.ok(tall.maxHeightPx >= tall.maxWidthPx);
    console.log("✓ tall product → fit-height");

    const applied = applyAsymmetricLimitsToCompositeOptions(
      {
        layout: "marketplace",
        scene: { seed: "test" } as never,
        compositionLayout,
        objectScale: 0.78,
        productScaleMultiplier: 1.8,
      },
      { compositionLayout, aspectRatioPlacementPatch: widePatch },
    );
    assert.equal(applied.limits.applied, true);
    assert.ok(applied.options.asymmetricLimits?.maxWidthPx);
    console.log("✓ limits attached to composite options");

    const original = compositionLayout;
    applyAsymmetricLimitsToCompositeOptions(
      {
        layout: "marketplace",
        scene: { seed: "test" } as never,
        compositionLayout: original,
      },
      { compositionLayout: original, aspectRatioPlacementPatch: widePatch },
    );
    assert.equal(original.product.maxWidthPct, 78);
    console.log("✓ composition layout immutable");
  },
);

withEnv(
  {
    DAOS_ASPECT_RATIO_PLACEMENT_PATCH: "1",
    DAOS_COMPOSITOR_ASYMMETRIC_LIMITS: undefined,
  },
  () => {
    const off = createAsymmetricLimits({
      compositionLayout,
      aspectRatioPlacementPatch: widePatch,
    });
    assert.equal(off.applied, false);
    console.log("✓ disabled flag → no apply");
  },
);

console.log("\nAll asymmetric-limits tests passed.");

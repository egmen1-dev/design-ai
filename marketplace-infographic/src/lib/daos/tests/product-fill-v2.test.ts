/**
 * DAOS Wave 30 — product fill v2 tests
 * Run: npx tsx src/lib/daos/tests/product-fill-v2.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  createProductScalePatch,
  DAOS_PRODUCT_FILL_V2_MULTIPLIER_MAX,
  DAOS_PRODUCT_SCALE_MULTIPLIER_MAX,
  isDaosProductFillV2Enabled,
} from "../compositor/product-scale-patch";

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
  safeInsetPct: 0.06,
  product: {
    left: 46,
    top: 22,
    width: 48,
    height: 58,
    centerX: 0.68,
    centerY: 0.52,
    maxWidthPct: 42,
    maxHeightPct: 52,
    areaPct: 22,
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

withEnv({ DAOS_PRODUCT_SCALE_PATCH: "1", DAOS_PRODUCT_FILL_V2: "1" }, () => {
  assert.equal(isDaosProductFillV2Enabled(), true);

  const high = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 220, top: 260, width: 180, height: 220 },
    productComplexity: "high",
    overlayDensity: 0.12,
    compositeInput: { objectScale: 0.78 },
  });
  const low = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 220, top: 260, width: 180, height: 220 },
    productComplexity: "low",
    overlayDensity: 0.12,
    compositeInput: { objectScale: 0.78 },
  });
  assert.ok((high.productFillV2Target ?? 0) > (low.productFillV2Target ?? 0));
  console.log("✓ target higher for high complexity");

  const boosted = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 220, top: 260, width: 180, height: 220 },
    productComplexity: "medium",
    overlayDensity: 0.12,
    law003AfterStillFailing: true,
    compositeInput: { objectScale: 0.78 },
  });
  const baseline = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 220, top: 260, width: 180, height: 220 },
    productComplexity: "medium",
    overlayDensity: 0.12,
    law003AfterStillFailing: false,
    compositeInput: { objectScale: 0.78 },
  });
  assert.ok((boosted.productFillV2Target ?? 0) >= (baseline.productFillV2Target ?? 0));
  assert.match(boosted.productFillTargetReason ?? "", /law003_boost/);
  console.log("✓ stillFail + low density raises target");

  const law014Blocked = createProductScalePatch({
    canvas: {
      ...compositionLayout.canvas,
    },
    compositionLayout: {
      ...compositionLayout,
      metrics: { ...compositionLayout.metrics, overlapPct: 6 },
    },
    productBounds: { left: 220, top: 260, width: 180, height: 220 },
    productComplexity: "medium",
    overlayDensity: 0.12,
    law003AfterStillFailing: true,
    law014RiskHigh: true,
    compositeInput: { objectScale: 0.78 },
  });
  assert.match(law014Blocked.productFillTargetReason ?? "", /law014_cap/);
  console.log("✓ high LAW_014 risk prevents increase");

  const tiny = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 300, top: 400, width: 30, height: 36 },
    productComplexity: "high",
    overlayDensity: 0.1,
    compositeInput: { objectScale: 0.78 },
  });
  assert.equal(tiny.scaleMultiplier, DAOS_PRODUCT_FILL_V2_MULTIPLIER_MAX);
  assert.ok(DAOS_PRODUCT_FILL_V2_MULTIPLIER_MAX > DAOS_PRODUCT_SCALE_MULTIPLIER_MAX);
  console.log("✓ multiplier capped at v2 max");
});

withEnv({ DAOS_PRODUCT_SCALE_PATCH: "1", DAOS_PRODUCT_FILL_V2: undefined }, () => {
  const v1 = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 300, top: 400, width: 30, height: 36 },
    compositeInput: { objectScale: 0.78 },
  });
  assert.equal(v1.scaleMultiplier, DAOS_PRODUCT_SCALE_MULTIPLIER_MAX);
  assert.equal(v1.productFillV2Enabled, false);
  console.log("✓ v2 flag off keeps v1 multiplier cap");
});

console.log("\nAll product-fill-v2 tests passed.");

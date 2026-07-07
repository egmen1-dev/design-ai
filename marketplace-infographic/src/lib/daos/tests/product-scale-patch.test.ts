/**
 * DAOS Wave 24 — compositor product scale patch tests
 * Run: npx tsx src/lib/daos/tests/product-scale-patch.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  applyProductScalePatch,
  createProductScalePatch,
  DAOS_PRODUCT_SCALE_MULTIPLIER_MAX,
  isDaosProductScalePatchEnabled,
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
    overlapPct: 4,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

withEnv({ DAOS_PRODUCT_SCALE_PATCH: "1" }, () => {
  assert.equal(isDaosProductScalePatchEnabled(), true);

  const tinyPlan = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 300, top: 400, width: 30, height: 36 },
    plannedProductAreaPct: 22,
    compositeInput: { objectScale: 0.78 },
  });
  assert.ok(tinyPlan.beforeProductAreaRatio < 0.35);
  assert.equal(tinyPlan.scaleMultiplier, DAOS_PRODUCT_SCALE_MULTIPLIER_MAX);
  console.log("✓ area 0.01 → scaleMultiplier capped");

  const medium = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 220, top: 260, width: 280, height: 340 },
    compositeInput: { objectScale: 0.78 },
  });
  assert.ok(medium.beforeProductAreaRatio < 0.35);
  assert.ok(medium.scaleMultiplier > 1 && medium.scaleMultiplier < DAOS_PRODUCT_SCALE_MULTIPLIER_MAX);
  console.log("✓ area 0.20 → multiplier reasonable");

  const ok = createProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 100, top: 120, width: 620, height: 780 },
    compositeInput: { objectScale: 0.9 },
  });
  assert.equal(ok.actions.length, 0);
  assert.equal(ok.patchApplied, false);
  console.log("✓ area 0.45 → no patch");

  const applied = applyProductScalePatch({
    canvas: compositionLayout.canvas,
    compositionLayout,
    productBounds: { left: 220, top: 260, width: 180, height: 220 },
    compositeInput: { objectScale: 0.78 },
  });
  assert.equal(applied.patch.patchApplied, true);
  assert.ok((applied.compositionLayout?.product.maxWidthPct ?? 0) > compositionLayout.product.maxWidthPct);
  assert.equal(compositionLayout.product.maxWidthPct, 42);
  console.log("✓ original not mutated");
});

withEnv({ DAOS_PRODUCT_SCALE_PATCH: undefined }, () => {
  const passthrough = applyProductScalePatch({
    plannedProductAreaPct: 22,
    compositeInput: { objectScale: 0.78 },
  });
  assert.equal(passthrough.patch.patchApplied, false);
  console.log("✓ flag off does not apply patch");
});

withEnv({ DAOS_PRODUCT_SCALE_PATCH: "1" }, () => {
  const missing = applyProductScalePatch({
    plannedProductAreaPct: 22,
    compositeInput: { objectScale: 0.78 },
  });
  assert.equal(missing.patch.patchApplied, false);
  assert.ok(missing.patch.warnings.some((warning) => warning.code === "PRODUCT_BOUNDS_MISSING"));
  console.log("✓ missing bounds safe");
});

console.log("\nAll product-scale-patch tests passed.");

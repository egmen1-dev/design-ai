/**
 * DAOS Wave 31 — aspect ratio placement patch tests
 * Run: npx tsx src/lib/daos/tests/aspect-ratio-placement-patch.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  applyAspectRatioPlacementPatch,
  createAspectRatioPlacementPatch,
  DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT,
  DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT,
  isDaosAspectRatioPlacementPatchEnabled,
} from "../compositor/aspect-ratio-placement-patch";

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

const baseLayout: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 0.06,
  product: {
    left: 46,
    top: 22,
    width: 48,
    height: 58,
    centerX: 0.68,
    centerY: 0.52,
    maxWidthPct: 70,
    maxHeightPct: 70,
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

withEnv({ DAOS_ASPECT_RATIO_PLACEMENT_PATCH: "1" }, () => {
  assert.equal(isDaosAspectRatioPlacementPatchEnabled(), true);

  const wide = createAspectRatioPlacementPatch({
    compositionLayout: baseLayout,
    targetProductAreaRatio: 0.5,
    currentProductAreaRatio: 0.15,
    productAspectRatio: 2.8,
    productCategory: "home",
    extractAreaWarnings: ["HEIGHT_OVERFLOW"],
  });
  assert.equal(wide.fitStrategy, "fit-width");
  assert.ok(wide.afterMaxHeightPct <= DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT);
  assert.ok(wide.afterMaxWidthPct >= wide.beforeMaxWidthPct || wide.heightOverflowPrevented);
  console.log("✓ wide product chooses fit-width");

  const tall = createAspectRatioPlacementPatch({
    compositionLayout: {
      ...baseLayout,
      product: { ...baseLayout.product, maxWidthPct: 40, maxHeightPct: 75 },
    },
    targetProductAreaRatio: 0.45,
    currentProductAreaRatio: 0.18,
    productAspectRatio: 0.55,
  });
  assert.equal(tall.fitStrategy, "fit-height");
  assert.ok(tall.afterMaxWidthPct <= DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT);
  console.log("✓ tall product chooses fit-height");

  const unreachable = createAspectRatioPlacementPatch({
    compositionLayout: baseLayout,
    targetProductAreaRatio: 0.9,
    currentProductAreaRatio: 0.12,
    productAspectRatio: 3.2,
    productCategory: "home",
  });
  assert.equal(unreachable.targetUnreachable, true);
  console.log("✓ target unreachable detected");

  const applied = applyAspectRatioPlacementPatch({
    compositionLayout: baseLayout,
    targetProductAreaRatio: 0.5,
    currentProductAreaRatio: 0.15,
    productAspectRatio: 2.8,
    productCategory: "home",
    extractAreaWarnings: ["HEIGHT_OVERFLOW"],
  });
  assert.ok(applied.patch.afterMaxWidthPct > 0);
  assert.ok(applied.patch.afterMaxHeightPct > 0);
  assert.ok(applied.patch.afterMaxWidthPct <= DAOS_ASPECT_RATIO_SAFE_MAX_WIDTH_PCT);
  assert.ok(applied.patch.afterMaxHeightPct <= DAOS_ASPECT_RATIO_SAFE_MAX_HEIGHT_PCT);
  console.log("✓ no overflow");

  const original = baseLayout;
  const mutated = applyAspectRatioPlacementPatch({
    compositionLayout: original,
    targetProductAreaRatio: 0.5,
    currentProductAreaRatio: 0.15,
    productAspectRatio: 2.8,
    productCategory: "home",
  });
  assert.notEqual(mutated.compositionLayout, original);
  assert.equal(original.product.maxWidthPct, 70);
  assert.equal(original.product.maxHeightPct, 70);
  console.log("✓ original not mutated");

  const mattressPrompt = createAspectRatioPlacementPatch({
    compositionLayout: baseLayout,
    targetProductAreaRatio: 0.49,
    currentProductAreaRatio: 0.15,
    productHint: "Ортопедический матрас 160x200",
  });
  assert.equal(mattressPrompt.fitStrategy, "fit-width");
  assert.equal(mattressPrompt.patchApplied, true);
  console.log("✓ mattress prompt infers fit-width");
});

withEnv({ DAOS_ASPECT_RATIO_PLACEMENT_PATCH: undefined }, () => {
  const off = createAspectRatioPlacementPatch({
    compositionLayout: baseLayout,
    targetProductAreaRatio: 0.5,
    productAspectRatio: 2.8,
  });
  assert.equal(off.enabled, false);
  assert.equal(off.patchApplied, false);
  console.log("✓ flag off does not apply patch");
});

console.log("\nAll aspect-ratio-placement-patch tests passed.");

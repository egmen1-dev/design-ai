/**
 * DAOS Wave 33 — wide hero strategy tests
 * Run: npx tsx src/lib/daos/tests/wide-hero-strategy.test.ts
 */
import assert from "node:assert/strict";
import {
  DAOS_WIDE_HERO_CROP_SAFE_MAX_PCT,
  applyWideHeroStrategy,
  createWideHeroStrategy,
  detectWideHeroCandidate,
  isDaosWideHeroStrategyEnabled,
} from "../compositor/wide-hero-strategy";

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

const enabledEnv = {
  DAOS_WIDE_HERO_STRATEGY: "1",
  DAOS_COMPOSITOR_ASYMMETRIC_LIMITS: "1",
  DAOS_ASPECT_RATIO_PLACEMENT_PATCH: "1",
};

withEnv(enabledEnv, () => {
  const wide = detectWideHeroCandidate({ productAspectRatio: 2.6 });
  assert.equal(wide.candidate, true);
  assert.ok(wide.aspectRatio >= 2.6);
  console.log("✓ aspect 2.6 → wide candidate");

  const mattress = detectWideHeroCandidate({
    productHint: "Ортопедический матрас 160x200",
    productCategory: "home",
  });
  assert.equal(mattress.candidate, true);
  console.log("✓ mattress prompt → wide candidate");

  const moderate = detectWideHeroCandidate({ productAspectRatio: 1.4 });
  assert.equal(moderate.candidate, false);
  console.log("✓ aspect 1.4 → standard (not candidate)");

  const strategy = createWideHeroStrategy({
    productAspectRatio: 2.6,
    productHint: "матрас 160x200",
    aspectRatioPlacementPatch: {
      enabled: true,
      patchApplied: true,
      productAspectRatio: 2.6,
      fitStrategy: "fit-width",
      targetUnreachable: true,
      heightOverflowPrevented: false,
      widthOverflowPrevented: false,
      beforeMaxWidthPct: 78,
      beforeMaxHeightPct: 52,
      afterMaxWidthPct: 78,
      afterMaxHeightPct: 24,
      estimatedVisibleAreaRatio: 0.13,
      actions: [],
    },
    extractAreaWarnings: ["HEIGHT_OVERFLOW"],
  });
  assert.equal(strategy.applied, true);
  assert.ok(
    strategy.strategy === "wide_full_bleed" ||
      strategy.strategy === "wide_crop_safe" ||
      strategy.strategy === "wide_diagonal",
  );
  assert.ok(strategy.widthTargetPct >= 85 && strategy.widthTargetPct <= 96);
  assert.ok(strategy.cropSafeHorizontalPct <= DAOS_WIDE_HERO_CROP_SAFE_MAX_PCT);
  assert.equal(strategy.noVerticalCrop, true);
  assert.ok(strategy.maxHeightPx <= 696);
  console.log(`✓ wide strategy ${strategy.strategy} width target ${strategy.widthTargetPct}%`);

  assert.ok(strategy.cropSafeHorizontalPct <= 6);
  console.log("✓ crop safe max 6%");

  assert.ok(strategy.maxHeightPx >= Math.round(strategy.maxWidthPx / 2.6) - 2);
  console.log("✓ no vertical crop — height derived from aspect");

  const before = { objectScale: 0.78, layout: "marketplace" as const, scene: { seed: "x" } as never };
  const applied = applyWideHeroStrategy(before, { productAspectRatio: 2.6, productHint: "матрас" });
  assert.equal(applied.strategy.applied, true);
  assert.ok(applied.options.wideHeroStrategy?.maxWidthPx);
  assert.ok(applied.options.asymmetricLimits?.applied);
  console.log("✓ applyWideHeroStrategy wires compositor options");
});

withEnv({ DAOS_WIDE_HERO_STRATEGY: "0" }, () => {
  assert.equal(isDaosWideHeroStrategyEnabled(), false);
  const strategy = createWideHeroStrategy({ productAspectRatio: 2.6 });
  assert.equal(strategy.applied, false);
  console.log("✓ disabled flag → no apply");
});

console.log("\nAll wide-hero-strategy tests passed.");

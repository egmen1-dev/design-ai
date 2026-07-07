/**
 * DAOS v2 Stage 5.1 — wide template compositor hook tests
 * Run: npx tsx src/lib/daos/tests/wide-template-compositor-hook.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  applyWideProductTemplate,
  buildWideTemplateCompositorHook,
  computeWideTemplateHeroLimits,
  createWideProductTemplate,
  heroZoneToPx,
  isDaosWideTemplateCompositorHookEnabled,
} from "../templates/wide-product-template";

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
  bullets: { left: 40, top: 240, width: 300, height: 180, itemHeightPct: 6, gapPct: 2, maxCount: 4 },
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
    overlapPct: 5,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

const templateEnv = {
  DAOS_WIDE_PRODUCT_TEMPLATE: "1",
  DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK: "1",
};

withEnv(templateEnv, () => {
  const plan = createWideProductTemplate({
    compositionLayout,
    productAspectRatio: 2.6,
    productHint: "матрас 160x200",
  });
  assert.equal(plan.strategy, "wide_bottom_hero_text_top");

  const applied = applyWideProductTemplate({
    compositionLayout,
    productAspectRatio: 2.6,
    productHint: "матрас 160x200",
  });
  assert.equal(applied.template.applied, true);
  assert.ok(applied.compositorHook, "hero zone hook should be built when flag on");
  assert.equal(applied.compositorHook?.applied, true);
  assert.ok(applied.compositorHook?.heroZoneLabel.includes("top:"));
  console.log("✓ hero zone passed via compositorHook");

  const limits = computeWideTemplateHeroLimits(applied.compositorHook!, compositionLayout.canvas, 2.6);
  const heroPx = heroZoneToPx(applied.template.heroZone, compositionLayout.canvas);
  assert.ok(limits.maxWidthPx >= heroPx.width);
  assert.ok(limits.maxHeightPx <= heroPx.height + 2);
  assert.ok(limits.maxHeightPx >= Math.round(limits.maxWidthPx / 2.6) - 2);
  console.log("✓ no vertical crop — height capped to hero zone");

  assert.ok(applied.compositionLayout);
  assert.ok(applied.compositionLayout.product.maxWidthPct >= 90);
  console.log("✓ hook on changes preferred product zone");
});

withEnv({ DAOS_WIDE_PRODUCT_TEMPLATE: "1", DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK: "0" }, () => {
  assert.equal(isDaosWideTemplateCompositorHookEnabled(), false);
  const applied = applyWideProductTemplate({
    compositionLayout,
    productAspectRatio: 2.6,
    productHint: "матрас 160x200",
  });
  assert.equal(applied.template.applied, true);
  assert.equal(applied.compositorHook, undefined);
  console.log("✓ hook off does not attach compositorHook");
});

withEnv(templateEnv, () => {
  const hook = buildWideTemplateCompositorHook(
    {
      enabled: true,
      applied: true,
      strategy: "wide_bottom_hero_text_top",
      reason: "test",
      textZone: { topPct: 4, heightPct: 40, widthPct: 92, leftPct: 4 },
      heroZone: { topPct: 54, heightPct: 42, widthPct: 94, leftPct: 3 },
      maxBadges: 2,
      targetHeroTextRatio: 2,
      targetOverlayDensityMin: 0.1,
      targetOverlayDensityMax: 0.25,
      cropSafeHorizontalPct: 6,
      actions: [],
    },
    "hero-zone-label",
  );
  assert.ok(hook?.heroZone);
  assert.equal(hook?.noVerticalCrop, true);
  assert.equal(hook?.horizontalBleedMaxPct, 6);
  console.log("✓ buildWideTemplateCompositorHook respects bleed + vertical-safe flags");
});

console.log("\nAll wide-template-compositor-hook tests passed.");

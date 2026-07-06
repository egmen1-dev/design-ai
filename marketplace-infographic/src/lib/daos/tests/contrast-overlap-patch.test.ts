/**
 * DAOS Wave 28 — contrast/overlap patch tests
 * Run: npx tsx src/lib/daos/tests/contrast-overlap-patch.test.ts
 */
import assert from "node:assert/strict";
import type { InfographicData } from "@/lib/infographic-template";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  applyContrastOverlapPatch,
  createContrastOverlapPatch,
  DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES,
  isDaosContrastOverlapPatchEnabled,
} from "../overlay/contrast-overlap-patch";

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

const layoutSpec: LayoutSpec = {
  heroPosition: "right",
  heroScale: 62,
  headlineArea: "left",
  benefitsArea: "left_panel",
  ctaArea: "badge_under_title",
  whitespaceTarget: 30,
  maxIcons: 4,
  maxSecondaryObjects: 3,
  maxDecorativeObjects: 2,
  maxColors: 4,
  palette: ["#111111", "#ffffff"],
  backgroundStyle: "soft_gradient",
  lightingStyle: "soft_key_top_left",
  visualWeightMap: { hero: 62, headline: 12, benefits: 14, cta: 8, background: 4 },
  hierarchy: {
    headline: "primary",
    hero: "primary",
    benefits: "secondary",
    cta: "tertiary",
    decorative: "tertiary",
  },
};

const infographicData: InfographicData = {
  headline: "ДРЕЛЬ",
  productName: "Cordless drill",
  backgroundScene: "studio",
  specBlocks: [
    { value: "65", label: "Нм крутящий момент", hint: "для дома" },
    { value: "18V", label: "Аккумулятор", hint: "быстрая зарядка" },
    { value: "2", label: "АКБ", hint: "в комплекте" },
  ],
  callouts: [
    { text: "Premium", position: "bottom-left" },
    { text: "New", position: "bottom-right" },
    { text: "Sale", position: "middle-left" },
  ],
  mainBanner: {
    title: "Хит продаж",
    description: "Описание баннера",
  },
  marketplaceGift: "Подарок",
  marketplaceFooter: "Доставка",
};

const compositionLayout: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 0.06,
  product: {
    left: 380,
    top: 200,
    width: 460,
    height: 520,
    centerX: 0.68,
    centerY: 0.52,
    maxWidthPct: 48,
    maxHeightPct: 58,
    areaPct: 62,
    rotationDeg: 0,
  },
  headline: { left: 40, top: 220, width: 360, height: 90, fontSizePct: 8 },
  subtitle: { left: 40, top: 150, width: 300, height: 50, fontSizePct: 4 },
  leftPanel: { left: 30, top: 220, width: 380, height: 420 },
  rightSidebar: { left: 700, top: 220, width: 160, height: 420 },
  bullets: { left: 40, top: 320, width: 340, height: 180, itemHeightPct: 6, gapPct: 2, maxCount: 4 },
  plaques: {
    smallWidthPct: 18,
    mediumWidthPct: 28,
    largeWidthPct: 36,
    heightPct: 6,
    maxTotalAreaPct: 14,
  },
  icon: { sizePct: 5, textGapPct: 2 },
  textSide: "left",
  metrics: {
    productAreaPct: 42,
    textAreaPct: 24,
    plaqueAreaPct: 10,
    whitespacePct: 28,
    overlapPct: 6,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

withEnv({ DAOS_CONTRAST_OVERLAP_PATCH: "1" }, () => {
  assert.equal(isDaosContrastOverlapPatchEnabled(), true);

  const plan = createContrastOverlapPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law014ContrastViolation: true,
    pngOverlayFeelRisk: 0.4,
  });
  assert.ok(plan.actions.length > 0);
  assert.ok(plan.actions.some((action) => action.code === "MOVE_TEXT_FROM_PRODUCT"));
  assert.ok(plan.actions.some((action) => action.code === "FORCE_HIGH_CONTRAST_TOKEN"));
  console.log("✓ LAW_014 creates actions");

  const pngPlan = createContrastOverlapPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law014ContrastViolation: false,
    pngOverlayFeelRisk: 0.82,
  });
  assert.ok(pngPlan.actions.some((action) => action.code === "SIMPLE_SOLID_PLAQUES"));
  assert.ok(pngPlan.actions.some((action) => action.code === "CAP_ACCENT_PLAQUES"));
  console.log("✓ high pngOverlayFeelRisk chooses simple plaque");

  const originalElements = infographicData.callouts?.length ?? 0;
  const result = applyContrastOverlapPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law014ContrastViolation: true,
    pngOverlayFeelRisk: 0.82,
    compositePlacement: {
      x: 0.42,
      y: 0.16,
      width: 0.51,
      height: 0.43,
      areaRatio: 0.22,
      widthRatio: 0.51,
      heightRatio: 0.43,
      source: "productPlacement",
      confidence: 0.95,
    },
  });

  assert.equal(result.patch.applied, true);
  const afterElements =
    (result.infographicData?.callouts?.length ?? 0) +
    (result.infographicData?.specBlocks.length ?? 0);
  assert.ok(afterElements <= originalElements + (result.infographicData?.specBlocks.length ?? 0));
  assert.ok((result.infographicData?.callouts?.length ?? 0) <= DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES);
  console.log("✓ does not increase element count");

  assert.equal(infographicData.marketplaceGift, "Подарок");
  assert.equal(compositionLayout.metrics.overlapPct, 6);
  assert.equal(layoutSpec.maxDecorativeObjects, 2);
  console.log("✓ original not mutated");

  assert.ok(result.patch.contrastOverlapAfterEstimate < result.patch.contrastOverlapBefore);
  assert.ok(result.patch.overlayDensityAfterEstimate <= result.patch.overlayDensityBefore);
});

withEnv({ DAOS_CONTRAST_OVERLAP_PATCH: undefined }, () => {
  const disabled = applyContrastOverlapPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law014ContrastViolation: true,
  });
  assert.equal(disabled.patch.applied, false);
  console.log("✓ flag off does not apply patch");
});

console.log("\nAll contrast-overlap-patch tests passed.");

/**
 * DAOS Wave 21 — overlay layout patch tests
 * Run: npx tsx src/lib/daos/tests/overlay-layout-patch.test.ts
 */
import assert from "node:assert/strict";
import type { InfographicData } from "@/lib/infographic-template";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  applyOverlayLayoutPatch,
  createOverlayLayoutPatch,
  isDaosOverlayPatchEnabled,
} from "../overlay/overlay-layout-patch";

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
  backgroundStyle: "clean_studio",
  lightingStyle: "soft_key_top_left",
  visualWeightMap: { hero: 62, headline: 12, benefits: 14, cta: 8, background: 4 },
  hierarchy: {
    headline: "primary",
    hero: "primary",
    benefits: "secondary",
    cta: "secondary",
    decorative: "tertiary",
  },
};

const infographicData: InfographicData = {
  headline: "ДРЕЛЬ",
  productName: "Cordless drill",
  backgroundScene: "studio",
  specBlocks: [
    { value: "65", label: "Нм крутящий момент professional series", hint: "для дома и дачи" },
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
    description: "Очень длинное описание баннера для вторичного текста overlay блока",
  },
  marketplaceGift: "Подарок",
  marketplaceFooter: "Доставка",
};

const compositionLayout: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 0.06,
  product: {
    left: 420,
    top: 180,
    width: 420,
    height: 520,
    centerX: 0.68,
    centerY: 0.52,
    maxWidthPct: 48,
    maxHeightPct: 58,
    areaPct: 62,
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
    maxTotalAreaPct: 18,
  },
  icon: { sizePct: 4, textGapPct: 2 },
  textSide: "left",
  metrics: {
    productAreaPct: 62,
    textAreaPct: 22,
    plaqueAreaPct: 14,
    whitespacePct: 56,
    overlapPct: 6,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

withEnv({ DAOS_OVERLAY_PATCH: "1" }, () => {
  assert.equal(isDaosOverlayPatchEnabled(), true);

  const highDensityPlan = createOverlayLayoutPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law003WhitespaceViolation: true,
    overlayDensity: 0.42,
  });
  assert.ok(highDensityPlan.actions.some((action) => action.code === "REDUCE_OVERLAY_DENSITY"));

  const applied = applyOverlayLayoutPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law003WhitespaceViolation: true,
    overlayDensity: 0.42,
  });
  assert.equal(applied.patch.applied, true);
  assert.ok((applied.infographicData?.callouts?.length ?? 0) <= 2);
  assert.ok((applied.infographicData?.specBlocks.length ?? 0) <= 2);
  assert.equal(infographicData.callouts?.length, 3);
  assert.equal(infographicData.specBlocks.length, 3);
  console.log("✓ high density reduces elements without mutating original");

  const law003 = applyOverlayLayoutPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law003WhitespaceViolation: true,
    overlayDensity: 0.4,
  });
  assert.ok(law003.patch.actions.some((action) => action.code === "HIDE_DECORATIVE_ELEMENTS"));
  assert.equal(law003.infographicData?.marketplaceGift, undefined);
  console.log("✓ LAW_003 triggers whitespace actions");

  const law014 = applyOverlayLayoutPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law014ContrastViolation: true,
    contrastRisk: 0.62,
  });
  assert.ok(law014.patch.actions.some((action) => action.code === "INCREASE_TEXT_CONTRAST"));
  assert.ok(
    (law014.compositionLayout?.metrics.overlapPct ?? 99) <
      compositionLayout.metrics.overlapPct,
  );
  console.log("✓ LAW_014 triggers contrast actions");

  const png = applyOverlayLayoutPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    pngOverlayFeelRisk: 0.82,
  });
  assert.ok(png.patch.suppressParametricBadge);
  assert.ok(png.patch.actions.some((action) => action.code === "MINIMAL_OVERLAY_MODE"));
  console.log("✓ pngOverlayFeelRisk triggers minimal overlay actions");
});

withEnv({ DAOS_OVERLAY_PATCH: undefined }, () => {
  const passthrough = applyOverlayLayoutPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law003WhitespaceViolation: true,
  });
  assert.equal(passthrough.patch.applied, false);
  console.log("✓ flag off does not apply patch");
});

console.log("\nAll overlay-layout-patch tests passed.");

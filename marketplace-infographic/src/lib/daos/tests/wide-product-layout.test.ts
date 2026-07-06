/**
 * DAOS Wave 34 — wide product layout tests
 * Run: npx tsx src/lib/daos/tests/wide-product-layout.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { InfographicData } from "@/lib/infographic-template";
import {
  applyWideProductLayoutPatch,
  createWideProductLayoutPatch,
  detectWideProductLayoutCandidate,
  isDaosWideProductLayoutEnabled,
} from "../overlay/wide-product-layout";

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
};

const infographicData: InfographicData = {
  headline: "МАТРАС",
  specBlocks: [
    { label: "160x200", hint: "размер" },
    { label: "пружины", hint: "тип" },
    { label: "лишний", hint: "третий" },
  ],
  callouts: [{ text: "A" }, { text: "B" }, { text: "C" }],
};

const originalLayout = JSON.stringify(compositionLayout);
const originalData = JSON.stringify(infographicData);

withEnv({ DAOS_WIDE_PRODUCT_LAYOUT: "1" }, () => {
  const candidate = detectWideProductLayoutCandidate({
    productAspectRatio: 2.6,
    productHint: "матрас 160x200",
  });
  assert.equal(candidate.candidate, true);
  console.log("✓ aspect 2.6 applies");

  const mattress = detectWideProductLayoutCandidate({
    productHint: "Ортопедический матрас 160x200",
    productCategory: "home",
  });
  assert.equal(mattress.candidate, true);
  console.log("✓ mattress prompt applies");

  const plan = createWideProductLayoutPatch({
    compositionLayout,
    productAspectRatio: 2.6,
    productHint: "матрас",
  });
  assert.equal(plan.strategy, "wide_bottom_hero_text_top");
  assert.ok(plan.textZone.topPct < plan.heroZone.topPct);
  console.log("✓ text zone top, hero zone bottom");

  const applied = applyWideProductLayoutPatch({
    compositionLayout,
    layoutSpec,
    infographicData,
    productAspectRatio: 2.6,
    productHint: "матрас",
  });
  assert.equal(applied.patch.applied, true);
  assert.ok(applied.compositionLayout!.product.top >= 52);
  assert.ok(applied.compositionLayout!.headline.top <= 10);
  assert.equal(applied.compositionLayout!.bullets.maxCount, 2);
  assert.ok((applied.infographicData?.specBlocks.length ?? 0) <= 2);
  assert.ok((applied.infographicData?.callouts?.length ?? 0) <= 2);
  console.log("✓ max badges 2");

  assert.equal(JSON.stringify(compositionLayout), originalLayout);
  assert.equal(JSON.stringify(infographicData), originalData);
  console.log("✓ no mutation");
});

withEnv({ DAOS_WIDE_PRODUCT_LAYOUT: "0" }, () => {
  assert.equal(isDaosWideProductLayoutEnabled(), false);
  const applied = applyWideProductLayoutPatch({
    compositionLayout,
    productAspectRatio: 2.6,
  });
  assert.equal(applied.patch.applied, false);
  console.log("✓ disabled flag → no apply");
});

console.log("\nAll wide-product-layout tests passed.");

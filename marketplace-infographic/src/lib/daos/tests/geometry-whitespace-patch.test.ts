/**
 * DAOS Wave 22 — geometry whitespace patch tests
 * Run: npx tsx src/lib/daos/tests/geometry-whitespace-patch.test.ts
 */
import assert from "node:assert/strict";
import type { InfographicData } from "@/lib/infographic-template";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  applyGeometryWhitespacePatch,
  createGeometryWhitespacePatch,
  isDaosGeometryWhitespacePatchEnabled,
} from "../overlay/geometry-whitespace-patch";

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
  heroScale: 58,
  headlineArea: "left",
  benefitsArea: "left_panel",
  ctaArea: "badge_under_title",
  whitespaceTarget: 32,
  maxIcons: 2,
  maxSecondaryObjects: 1,
  maxDecorativeObjects: 1,
  maxColors: 4,
  palette: ["#111111", "#ffffff"],
  backgroundStyle: "clean_studio",
  lightingStyle: "soft_key_top_left",
  visualWeightMap: { hero: 48, headline: 14, benefits: 12, cta: 8, background: 18 },
  hierarchy: {
    headline: "primary",
    hero: "primary",
    benefits: "secondary",
    cta: "secondary",
    decorative: "tertiary",
  },
  geometry: {
    canvas: { width: 900, height: 1200 },
    grid: { columns: 12, margin: 48, gutter: 16 },
    hero: { x: 0.5, y: 0.32, width: 0.42, height: 0.48 },
    headline: { x: 0.08, y: 0.09, width: 0.34, height: 0.1 },
    benefits: { x: 0.08, y: 0.22, width: 0.36, height: 0.14 },
    cta: { x: 0.08, y: 0.83, width: 0.22, height: 0.06 },
  },
};

const infographicData: InfographicData = {
  headline: "МАТРАС",
  productName: "Mattress",
  backgroundScene: "studio",
  specBlocks: [{ value: "20", label: "см", hint: "высота" }],
};

const compositionLayout: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 0.06,
  product: {
    left: 430,
    top: 200,
    width: 380,
    height: 480,
    centerX: 0.66,
    centerY: 0.5,
    maxWidthPct: 42,
    maxHeightPct: 52,
    areaPct: 38,
    rotationDeg: 0,
  },
  headline: { left: 40, top: 60, width: 340, height: 90, fontSizePct: 8 },
  subtitle: { left: 40, top: 150, width: 320, height: 50, fontSizePct: 4 },
  leftPanel: { left: 30, top: 220, width: 360, height: 420 },
  rightSidebar: { left: 700, top: 220, width: 160, height: 420 },
  bullets: { left: 40, top: 240, width: 320, height: 180, itemHeightPct: 6, gapPct: 2, maxCount: 2 },
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
    productAreaPct: 38,
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

withEnv({ DAOS_GEOMETRY_WHITESPACE_PATCH: "1" }, () => {
  assert.equal(isDaosGeometryWhitespacePatchEnabled(), true);

  const plan = createGeometryWhitespacePatch({
    layoutSpec,
    compositionLayout,
    law003WhitespaceViolation: true,
    whitespace: 0.56,
    productAreaRatio: 0.38,
    overlayDensity: 0.1,
  });
  assert.ok(plan.actions.some((action) => action.code === "ENLARGE_HERO_TARGET"));
  assert.ok(plan.actions.some((action) => action.code === "LAYOUT_GEOMETRY_DIAGNOSIS"));
  console.log("✓ LAW_003 creates patch actions");

  const lowProduct = createGeometryWhitespacePatch({
    layoutSpec,
    compositionLayout,
    law003WhitespaceViolation: true,
    productAreaRatio: 0.38,
  });
  assert.ok(lowProduct.actions.some((action) => action.code === "ENLARGE_PRODUCT_TARGET"));
  console.log("✓ productAreaRatio low → hero enlargement action");

  const applied = applyGeometryWhitespacePatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law003WhitespaceViolation: true,
    whitespace: 0.56,
    productAreaRatio: 0.38,
    overlayDensity: 0.1,
  });
  assert.equal(applied.patch.applied, true);
  assert.ok((applied.layoutSpec?.heroScale ?? 0) > layoutSpec.heroScale);
  assert.ok((applied.compositionLayout?.product.areaPct ?? 0) > compositionLayout.product.areaPct);
  assert.equal(layoutSpec.heroScale, 58);
  assert.equal(compositionLayout.product.areaPct, 38);
  console.log("✓ original not mutated");
});

withEnv({ DAOS_GEOMETRY_WHITESPACE_PATCH: undefined }, () => {
  const passthrough = applyGeometryWhitespacePatch({
    law003WhitespaceViolation: true,
    whitespace: 0.56,
  });
  assert.equal(passthrough.patch.applied, false);
  assert.equal(passthrough.layoutSpec, undefined);
  console.log("✓ safe fallback on unknown input");
});

console.log("\nAll geometry-whitespace-patch tests passed.");

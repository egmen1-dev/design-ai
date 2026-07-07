/**
 * DAOS RFC-001 — SceneGraphBuilder tests
 * Run: npx tsx src/lib/scene-graph/tests/scene-graph-builder.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import type { InfographicData } from "@/lib/infographic-template";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { buildSceneGraph, advanceSceneGraph } from "../SceneGraphBuilder";

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
  specBlocks: [{ label: "160x200", hint: "размер" }],
  callouts: [{ label: "пружины", hint: "тип" }],
};

const plannerGraph = buildSceneGraph({
  id: "builder-test",
  stage: "planner",
  compositionLayout,
  layoutSpec,
  infographicData,
  productCategory: "mattress",
  layoutMode: "marketplace",
});

assert.equal(plannerGraph.stage, "planner");
assert.equal(plannerGraph.version, 2);
assert.ok(plannerGraph.product.planned);
assert.ok(plannerGraph.product.planned!.width > 0);
assert.equal(plannerGraph.whitespace.planned?.whitespacePct, 56);
assert.equal(plannerGraph.badges.actual?.count, 2);
assert.equal(plannerGraph.metadata.mirrorMode, true);
console.log("✓ buildSceneGraph from planner inputs");

const compositorGraph = advanceSceneGraph(plannerGraph, {
  stage: "after_compositor",
  compositionLayout,
  compositePlacement: {
    x: 120,
    y: 180,
    width: 520,
    height: 640,
    areaRatio: 0.18,
    widthRatio: 0.58,
    heightRatio: 0.53,
    source: "productPlacement",
    confidence: 0.95,
  },
});

assert.equal(compositorGraph.stage, "after_compositor");
assert.equal(compositorGraph.product.actual?.width, 520);
assert.equal(compositorGraph.product.actual?.visibleAreaRatio, 0.18);
assert.ok(compositorGraph.product.history.length > 0);
console.log("✓ advanceSceneGraph merges compositor placement");

console.log("\n✅ scene-graph-builder.test.ts passed");

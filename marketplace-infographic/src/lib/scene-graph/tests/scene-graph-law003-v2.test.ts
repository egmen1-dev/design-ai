/**
 * DAOS v2 Stage 4.2 — SceneGraph LAW_003 V2 tests
 * Run: npx tsx src/lib/scene-graph/tests/scene-graph-law003-v2.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import { buildSceneGraph } from "../SceneGraphBuilder";
import {
  evaluateSceneGraphLaw003V2,
  compareLaw003V1V2,
  SCENE_GRAPH_LAW003_V2_VERSION,
} from "../SceneGraphLaw003V2";
import { evaluateSceneGraphLaw003 } from "../SceneGraphConstitutionMirror";

const compositionLayout: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 6,
  product: {
    left: 10,
    top: 20,
    width: 35,
    height: 45,
    centerX: 0.3,
    centerY: 0.45,
    maxWidthPct: 78,
    maxHeightPct: 24,
    areaPct: 22,
    rotationDeg: 0,
  },
  headline: { left: 4, top: 8, width: 38, height: 12, fontSizePct: 8 },
  subtitle: { left: 4, top: 15, width: 34, height: 5, fontSizePct: 4 },
  leftPanel: { left: 3, top: 22, width: 38, height: 42 },
  rightSidebar: { left: 70, top: 22, width: 16, height: 42 },
  bullets: { left: 4, top: 24, width: 34, height: 18, itemHeightPct: 6, gapPct: 2, maxCount: 4 },
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
    whitespacePct: 28,
    overlapPct: 1,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

function buildFilledGraph(input: {
  id: string;
  productPlacement: { left: number; top: number; width: number; height: number };
  overlayDensity: number;
  textAreaPct?: number;
  productCategory?: string;
  layoutMode?: string;
}) {
  return buildSceneGraph({
    id: input.id,
    stage: "final",
    compositionLayout: {
      ...compositionLayout,
      metrics: {
        ...compositionLayout.metrics,
        whitespacePct: 55,
        textAreaPct: input.textAreaPct ?? 5,
      },
    },
    productPlacement: input.productPlacement,
    productCategory: input.productCategory,
    layoutMode: input.layoutMode,
    overlayAudit: {
      overlayElementCount: 3,
      estimatedOverlayDensity: input.overlayDensity,
      whitespaceRisk: 0.5,
      contrastRisk: 0.2,
      hierarchyRisk: 0.2,
      readabilityRisk: 0.2,
      pngOverlayFeelRisk: 0.2,
      law003WhitespaceViolation: true,
      law014ContrastViolation: false,
      law003Before: true,
      law003After: false,
      law003GovernanceSource: "constitution",
      law003SoftResolved: false,
      warnings: [],
      recommendations: [],
      score: 70,
    },
  });
}

const drillGraph = buildFilledGraph({
  id: "law003-v2-drill",
  productPlacement: { left: 120, top: 180, width: 610, height: 700 },
  overlayDensity: 0.12,
  textAreaPct: 5,
});
drillGraph.whitespace = {
  ...drillGraph.whitespace,
  actual: {
    ...drillGraph.whitespace.actual!,
    whitespacePct: 65,
    plannedWhitespacePct: 55,
  },
};
const drillV1 = evaluateSceneGraphLaw003(drillGraph);
const drillV2 = evaluateSceneGraphLaw003V2(drillGraph);
assert.equal(drillV1.passed, false, "V1 should fail drill-like case with stale whitespace");
assert.equal(drillV2.passed, true, "V2 should pass drill-like case");
assert.equal(drillV2.disagreement, true);
console.log("✓ drill-like metrics pass V2");

const kettleGraph = buildFilledGraph({
  id: "law003-v2-kettle",
  productPlacement: { left: 100, top: 160, width: 650, height: 730 },
  overlayDensity: 0.11,
  textAreaPct: 6,
});
const kettleV2 = evaluateSceneGraphLaw003V2(kettleGraph);
assert.equal(kettleV2.passed, true);
console.log("✓ kettle-like metrics pass V2");

const toyGraph = buildFilledGraph({
  id: "law003-v2-toy",
  productPlacement: { left: 140, top: 200, width: 560, height: 620 },
  overlayDensity: 0.09,
  textAreaPct: 4,
});
const toyV2 = evaluateSceneGraphLaw003V2(toyGraph);
assert.equal(toyV2.passed, true);
console.log("✓ toy-like metrics pass V2");

const mattressGraph = buildFilledGraph({
  id: "law003-v2-mattress",
  productPlacement: { left: 40, top: 520, width: 820, height: 180 },
  overlayDensity: 0.39,
  textAreaPct: 8,
  productCategory: "mattress",
});
const mattressV2 = evaluateSceneGraphLaw003V2(mattressGraph);
assert.equal(mattressV2.passed, false);
assert.ok(mattressV2.reason.includes("Wide product geometry"));
console.log("✓ mattress-like wide geometry fail");

const highOverlayGraph = buildFilledGraph({
  id: "law003-v2-high-overlay",
  productPlacement: { left: 120, top: 180, width: 500, height: 600 },
  overlayDensity: 0.48,
  textAreaPct: 8,
});
const highOverlayV2 = evaluateSceneGraphLaw003V2(highOverlayGraph);
assert.equal(highOverlayV2.passed, false);
assert.ok(highOverlayV2.reason.includes("Overlay density"));
console.log("✓ high overlay density fail");

const lowProductGraph = buildSceneGraph({
  id: "law003-v2-low-product",
  stage: "final",
  compositionLayout: {
    ...compositionLayout,
    metrics: { ...compositionLayout.metrics, whitespacePct: 55, productAreaPct: 12 },
  },
  productPlacement: { left: 220, top: 420, width: 120, height: 90 },
});
const lowProductV2 = evaluateSceneGraphLaw003V2(lowProductGraph);
assert.equal(lowProductV2.passed, false);
assert.ok(
  lowProductV2.reason.includes("Product area") ||
    lowProductV2.reason.includes("Hero/text ratio"),
);
console.log("✓ low product area fail");

const compare = compareLaw003V1V2(drillGraph);
assert.equal(compare.version, SCENE_GRAPH_LAW003_V2_VERSION);
assert.equal(compare.oldPassed, drillV1.passed);
assert.equal(compare.disagreement, drillV1.passed !== compare.passed);
assert.ok(compare.metrics.productAreaRatio >= 0.32);
console.log("✓ compareLaw003V1V2 exposes V1/V2 disagreement");

console.log("\n✅ scene-graph-law003-v2.test.ts passed");

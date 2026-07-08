/**
 * DAOS v2 Stage 4 — SceneGraph constitution mirror tests
 * Run: npx tsx src/lib/scene-graph/tests/scene-graph-constitution-mirror.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import { buildSceneGraph, writeCompositorProductActual } from "../SceneGraphBuilder";
import {
  evaluateSceneGraphLaw003,
  evaluateSceneGraphLaw014,
  evaluateSceneGraphConstitutionMirror,
} from "../SceneGraphConstitutionMirror";

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

const productPlacement = { left: 480, top: 180, width: 360, height: 520 };

const plannerGraph = buildSceneGraph({
  id: "constitution-mirror-test",
  stage: "planner",
  compositionLayout,
});

const compositorGraph = writeCompositorProductActual(plannerGraph, productPlacement);
const highFillGraph = buildSceneGraph({
  id: "constitution-mirror-high-fill",
  stage: "final",
  compositionLayout: {
    ...compositionLayout,
    metrics: { ...compositionLayout.metrics, whitespacePct: 28, overlapPct: 1 },
  },
  productPlacement,
  overlayAudit: {
    overlayElementCount: 3,
    estimatedOverlayDensity: 0.12,
    whitespaceRisk: 0.2,
    contrastRisk: 0.2,
    hierarchyRisk: 0.2,
    readabilityRisk: 0.2,
    pngOverlayFeelRisk: 0.2,
    law003WhitespaceViolation: false,
    law014ContrastViolation: false,
    law003Before: false,
    law003After: false,
    law003GovernanceSource: "constitution",
    law003SoftResolved: false,
    warnings: [],
    recommendations: [],
    score: 80,
  },
  law003Recalibration: {
    originalWhitespace: 56,
    recalibratedWhitespace: 28,
    productAdjustedWhitespace: 30,
    overlayAdjustedWhitespace: 28,
    law003Before: true,
    law003After: false,
    confidence: 0.9,
    reason: "recalibrated",
    warnings: [],
    staleMetricDetected: true,
  },
});

const law003HighFill = evaluateSceneGraphLaw003(highFillGraph);
assert.equal(law003HighFill.passed, true);
assert.ok(law003HighFill.productAreaRatio >= 0.15);
assert.equal(law003HighFill.source, "actual");
console.log("✓ actual product area passes LAW_003 when enough fill");

const lowFillGraph = buildSceneGraph({
  id: "constitution-mirror-low-fill",
  stage: "final",
  compositionLayout: {
    ...compositionLayout,
    metrics: { ...compositionLayout.metrics, whitespacePct: 55, productAreaPct: 8, overlapPct: 1 },
  },
  productPlacement: { left: 200, top: 400, width: 120, height: 80 },
});

const law003LowFill = evaluateSceneGraphLaw003(lowFillGraph);
assert.equal(law003LowFill.passed, false);
assert.ok(law003LowFill.reasons.some((r) => r.includes("Whitespace") || r.includes("Product area")));
console.log("✓ low product area fails LAW_003");

const overlapLayout: CompositionLayout = {
  ...compositionLayout,
  headline: { left: 480, top: 180, width: 200, height: 90, fontSizePct: 8 },
  metrics: { ...compositionLayout.metrics, overlapPct: 6 },
};

const overlapGraph = buildSceneGraph({
  id: "overlap-final",
  stage: "final",
  compositionLayout: overlapLayout,
  productPlacement,
});
const law014Overlap = evaluateSceneGraphLaw014(overlapGraph);
assert.equal(law014Overlap.passed, false);
assert.ok(
  law014Overlap.overlapCount >= 1 ||
    overlapLayout.metrics.overlapPct > 2 ||
    law014Overlap.reasons.some((r) => r.includes("Overlap")),
);
console.log("✓ overlapping overlay fails LAW_014");

const plannedOnlyGraph = buildSceneGraph({
  id: "constitution-mirror-planned-only",
  stage: "planner",
  compositionLayout,
});
plannedOnlyGraph.typography = {
  ...plannedOnlyGraph.typography,
  actual: undefined,
};
plannedOnlyGraph.product = { ...plannedOnlyGraph.product, actual: undefined };
const law014Planned = evaluateSceneGraphLaw014(plannedOnlyGraph);
assert.equal(law014Planned.source, "planned");
console.log("✓ no overlay actual → planned source");

const mixedGraph = buildSceneGraph({
  id: "constitution-mirror-mixed",
  stage: "final",
  compositionLayout,
  productPlacement,
});
mixedGraph.typography = { ...mixedGraph.typography, actual: undefined };
const law014Mixed = evaluateSceneGraphLaw014(mixedGraph);
assert.equal(law014Mixed.source, "mixed");
assert.ok(law014Mixed.reasons.some((r) => r.includes("planned bboxes")));
console.log("✓ product actual + planned typography → mixed source");

const first = evaluateSceneGraphConstitutionMirror(compositorGraph);
const second = evaluateSceneGraphConstitutionMirror(compositorGraph);
assert.deepEqual(
  { law003: first.law003.passed, law014: first.law014.passed, score: first.score },
  { law003: second.law003.passed, law014: second.law014.passed, score: second.score },
);
console.log("✓ deterministic results");

const mirror = evaluateSceneGraphConstitutionMirror(highFillGraph);
assert.equal(mirror.law003.lawId, "LAW_003");
assert.equal(mirror.law014.lawId, "LAW_014");
assert.ok(["actual", "planned", "mixed"].includes(mirror.sceneGraphConstitutionSource));
console.log("✓ evaluateSceneGraphConstitutionMirror aggregates laws");

console.log("\n✅ scene-graph-constitution-mirror.test.ts passed");

/**
 * DAOS RFC-001 — SceneGraphValidator tests
 * Run: npx tsx src/lib/scene-graph/tests/scene-graph-validator.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import { buildSceneGraph, advanceSceneGraph } from "../SceneGraphBuilder";
import {
  validateSceneGraph,
  computeSceneGraphDrift,
  validateSceneGraphPipeline,
} from "../SceneGraphValidator";

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

const planner = buildSceneGraph({
  id: "validator-test",
  stage: "planner",
  compositionLayout,
});

const validation = validateSceneGraph(planner);
assert.equal(validation.valid, true);
assert.ok(validation.issues.length >= 0);
console.log("✓ validateSceneGraph passes for planner graph");

const compositor = advanceSceneGraph(planner, {
  stage: "after_compositor",
  compositionLayout,
  compositePlacement: {
    x: 100,
    y: 150,
    width: 200,
    height: 250,
    areaRatio: 0.13,
    widthRatio: 0.22,
    heightRatio: 0.21,
    source: "test",
    confidence: 0.9,
  },
});

const drift = computeSceneGraphDrift(planner, compositor);
assert.equal(drift.fromStage, "planner");
assert.equal(drift.toStage, "after_compositor");
assert.ok(typeof drift.drift.productAreaDrift === "number");
console.log("✓ computeSceneGraphDrift measures product drift");

const pipeline = validateSceneGraphPipeline({
  planner,
  after_compositor: compositor,
});
assert.deepEqual(pipeline.stages, ["planner", "after_compositor"]);
assert.equal(pipeline.drifts.length, 1);
console.log("✓ validateSceneGraphPipeline chains stages");

console.log("\n✅ scene-graph-validator.test.ts passed");

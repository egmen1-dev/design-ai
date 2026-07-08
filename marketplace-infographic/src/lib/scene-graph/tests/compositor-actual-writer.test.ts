/**
 * DAOS v2 Stage 2 — compositor actual geometry writer tests
 * Run: npx tsx src/lib/scene-graph/tests/compositor-actual-writer.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  buildSceneGraph,
  writeCompositorProductActual,
} from "../SceneGraphBuilder";
import { computeSceneGraphDrift } from "../SceneGraphValidator";

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

const productPlacement = {
  left: 120,
  top: 180,
  width: 520,
  height: 640,
};

const plannerGraph = buildSceneGraph({
  id: "compositor-writer-test",
  stage: "planner",
  compositionLayout,
});

const compositorGraph = writeCompositorProductActual(
  plannerGraph,
  productPlacement,
  "after_compositor",
);

const actual = compositorGraph.product.actual!;
assert.equal(actual.x, 120);
assert.equal(actual.y, 180);
assert.equal(actual.width, 520);
assert.equal(actual.height, 640);
assert.equal(actual.visibleArea, 520 * 640);
assert.equal(compositorGraph.product.source, "scene-compositor");
assert.equal(compositorGraph.product.confidence, 0.95);

const canvasArea = 900 * 1200;
const expectedAreaRatio = (520 * 640) / canvasArea;
assert.ok(Math.abs((actual.areaRatio ?? 0) - expectedAreaRatio) < 0.0001);
assert.ok(Math.abs((actual.visibleAreaRatio ?? 0) - expectedAreaRatio) < 0.0001);
assert.ok(Math.abs((actual.widthRatio ?? 0) - 520 / 900) < 0.0001);
assert.ok(Math.abs((actual.heightRatio ?? 0) - 640 / 1200) < 0.0001);
console.log("✓ ProductNode.actual filled from productPlacement");

const viaBuilder = buildSceneGraph({
  id: "compositor-writer-test",
  stage: "after_compositor",
  compositionLayout,
  productPlacement,
});
assert.equal(viaBuilder.product.source, "scene-compositor");
assert.equal(viaBuilder.product.confidence, 0.95);
assert.equal(viaBuilder.product.actual?.x, 120);
console.log("✓ buildSceneGraph uses productPlacement as source of truth");

const drift = computeSceneGraphDrift(plannerGraph, compositorGraph);
assert.ok(typeof drift.drift.productAreaDrift === "number");
assert.ok(drift.drift.productPositionDrift > 0, "position drift should be non-zero");
assert.ok(drift.drift.productSizeDrift > 0, "size drift should be non-zero");
assert.equal(drift.fromStage, "planner");
assert.equal(drift.toStage, "after_compositor");
console.log("✓ drift includes productAreaDrift, productPositionDrift, productSizeDrift");
console.log("  productAreaDrift:", drift.drift.productAreaDrift.toFixed(4));
console.log("  productPositionDrift:", drift.drift.productPositionDrift.toFixed(4));
console.log("  productSizeDrift:", drift.drift.productSizeDrift.toFixed(4));

console.log("\n✅ compositor-actual-writer.test.ts passed");

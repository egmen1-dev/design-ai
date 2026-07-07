/**
 * DAOS v2 Stage 3.2 — overlay actual gate tests
 * Run: npx tsx src/lib/scene-graph/tests/overlay-actual-gate.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  explainSceneGraphActualOverlayDecision,
  shouldUseSceneGraphActualForOverlay,
} from "../overlay-actual-gate";
import { resolveOverlayProductBbox } from "../product-actual-bridge";

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
  headline: { left: 420, top: 200, width: 200, height: 90, fontSizePct: 8 },
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
    overlapPct: 6,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

const wideActual = {
  x: 80,
  y: 420,
  width: 720,
  height: 260,
  areaRatio: 0.201,
  widthRatio: 0.8,
  heightRatio: 0.22,
  source: "scene-compositor",
  confidence: 0.95,
};

const toyActual = {
  x: 360,
  y: 480,
  width: 180,
  height: 180,
  areaRatio: 0.03,
  widthRatio: 0.2,
  heightRatio: 0.15,
  source: "scene-compositor",
  confidence: 0.95,
};

const mattressDecision = explainSceneGraphActualOverlayDecision({
  productPrompt: "Ортопедический матрас 160x200 для Wildberries",
  productCategory: "home",
  aspectRatio: 2.6,
  wideHeroStrategyApplied: true,
  productAreaDrift: -0.22,
  sceneGraphProductActual: wideActual,
  compositionLayout,
});
assert.equal(mattressDecision.decision, "actual");
assert.ok(mattressDecision.reasons.includes("wide_furniture_category"));
console.log("✓ mattress → actual");

const toyDecision = explainSceneGraphActualOverlayDecision({
  productPrompt: "Развивающая игрушка для детей 3+",
  productCategory: "toys",
  aspectRatio: 1.1,
  sceneGraphProductActual: toyActual,
  compositionLayout,
});
assert.equal(toyDecision.decision, "planned");
assert.equal(toyDecision.reasons[0], "toy_category");
console.log("✓ toy → planned");

const highOverlapDecision = explainSceneGraphActualOverlayDecision({
  productPrompt: "Профессиональная дрель",
  productCategory: "electronics",
  aspectRatio: 1.2,
  sceneGraphProductActual: wideActual,
  compositionLayout,
  plannedOverlapRisk: 0.05,
  actualOverlapRisk: 0.2,
});
assert.equal(highOverlapDecision.decision, "planned");
assert.equal(highOverlapDecision.reasons[0], "actual_overlap_risk_elevated");
console.log("✓ high overlap risk → planned");

const wideAspectDecision = explainSceneGraphActualOverlayDecision({
  productPrompt: "Широкий товар",
  productCategory: "generic",
  aspectRatio: 2.0,
  sceneGraphProductActual: wideActual,
  compositionLayout,
  plannedOverlapRisk: 0.05,
  actualOverlapRisk: 0.08,
});
assert.equal(wideAspectDecision.decision, "actual");
assert.ok(wideAspectDecision.reasons.includes("wide_aspect_ratio"));
console.log("✓ wide aspect → actual");

withEnv(
  {
    DAOS_SCENE_GRAPH_V2: "1",
    DAOS_SCENE_GRAPH_OVERLAY_FORCE_ACTUAL: "1",
    DAOS_SCENE_GRAPH_OVERLAY_PLANNED: undefined,
  },
  () => {
    const forced = resolveOverlayProductBbox({
      canvas: compositionLayout.canvas,
      sceneGraphProductActual: wideActual,
      compositionLayout,
    });
    assert.equal(forced?.left, wideActual.x);
  },
);
console.log("✓ force actual flag overrides gate");

withEnv(
  {
    DAOS_SCENE_GRAPH_V2: "1",
    DAOS_SCENE_GRAPH_OVERLAY_PLANNED: "1",
    DAOS_SCENE_GRAPH_OVERLAY_FORCE_ACTUAL: undefined,
  },
  () => {
    const forcedPlanned = resolveOverlayProductBbox({
      canvas: compositionLayout.canvas,
      sceneGraphProductActual: wideActual,
      compositionLayout,
    });
    assert.ok(forcedPlanned);
    assert.notEqual(forcedPlanned!.left, wideActual.x);
  },
);
console.log("✓ force planned flag overrides gate");

assert.equal(
  shouldUseSceneGraphActualForOverlay({
    productPrompt: "матрас",
    productCategory: "home",
    aspectRatio: 2.4,
    sceneGraphProductActual: wideActual,
    compositionLayout,
  }),
  true,
);
console.log("✓ shouldUseSceneGraphActualForOverlay helper");

console.log("\n✅ overlay-actual-gate.test.ts passed");

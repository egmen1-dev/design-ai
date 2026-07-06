/**
 * DAOS v2 Stage 3 — overlay reads ProductNode.actual tests
 * Run: npx tsx src/lib/scene-graph/tests/overlay-reads-product-actual.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import type { InfographicData } from "@/lib/infographic-template";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { buildSceneGraph, writeCompositorProductActual } from "../SceneGraphBuilder";
import {
  isDaosSceneGraphOverlayUsesActual,
  resolveOverlayProductBbox,
  countTextZoneOverlapsWithProduct,
  buildOverlaySceneGraphDiagnostics,
} from "../product-actual-bridge";
import { applyOverlayLayoutPatch } from "@/lib/daos/overlay/overlay-layout-patch";
import { applyContrastOverlapPatch } from "@/lib/daos/overlay/contrast-overlap-patch";
import { analyzeOverlayQuality } from "@/lib/daos/audit/overlay-quality-audit";

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

const productPlacement = { left: 480, top: 180, width: 360, height: 520 };
const plannerGraph = buildSceneGraph({
  id: "overlay-actual-test",
  stage: "planner",
  compositionLayout,
});
const compositorGraph = writeCompositorProductActual(plannerGraph, productPlacement);
const sceneGraphProductActual = {
  x: productPlacement.left,
  y: productPlacement.top,
  width: productPlacement.width,
  height: productPlacement.height,
  areaRatio: (productPlacement.width * productPlacement.height) / (900 * 1200),
  widthRatio: productPlacement.width / 900,
  heightRatio: productPlacement.height / 1200,
  visibleArea: productPlacement.width * productPlacement.height,
  source: "scene-compositor",
  confidence: 0.95,
};

withEnv({ DAOS_SCENE_GRAPH_V2: undefined }, () => {
  assert.equal(isDaosSceneGraphOverlayUsesActual(), false);
});
withEnv({ DAOS_SCENE_GRAPH_V2: "1", DAOS_SCENE_GRAPH_OVERLAY_PLANNED: "1" }, () => {
  assert.equal(isDaosSceneGraphOverlayUsesActual(), false);
});
withEnv({ DAOS_SCENE_GRAPH_V2: "1" }, () => {
  assert.equal(isDaosSceneGraphOverlayUsesActual(), true);
});
console.log("✓ overlay actual flag gating");

const plannedBbox = resolveOverlayProductBbox({
  canvas: compositionLayout.canvas,
  compositionLayout,
  preferSceneGraphActual: false,
});
const actualBbox = resolveOverlayProductBbox({
  canvas: compositionLayout.canvas,
  sceneGraphProductActual,
  preferSceneGraphActual: true,
});
assert.ok(plannedBbox);
assert.ok(actualBbox);
assert.notEqual(plannedBbox!.left, actualBbox!.left);
assert.equal(actualBbox!.left, 480);
console.log("✓ resolveOverlayProductBbox prefers scene graph actual");

const overlapsPlanned = countTextZoneOverlapsWithProduct(compositionLayout, plannedBbox);
const overlapsActual = countTextZoneOverlapsWithProduct(compositionLayout, actualBbox);
assert.ok(overlapsActual >= 0);
console.log("✓ factual overlap count", { overlapsPlanned, overlapsActual });

withEnv({ DAOS_SCENE_GRAPH_V2: "1", DAOS_OVERLAY_PATCH: "1" }, () => {
  const overlayResult = applyOverlayLayoutPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law014ContrastViolation: true,
    contrastRisk: 0.8,
    sceneGraphProductActual,
  });
  assert.equal(overlayResult.patch.overlayUsedSceneGraphActual, true);
  assert.equal(overlayResult.patch.overlayProductActualSource, "scene-compositor");
  assert.ok(overlayResult.patch.overlayProductActualAreaRatio! > 0);
  const expectedAreaPct = sceneGraphProductActual.areaRatio * 100;
  assert.ok(
    Math.abs(overlayResult.compositionLayout!.metrics.productAreaPct - expectedAreaPct) < 0.5,
  );
});
console.log("✓ overlay-layout-patch uses ProductNode.actual");

withEnv({ DAOS_SCENE_GRAPH_V2: "1", DAOS_CONTRAST_OVERLAP_PATCH: "1" }, () => {
  const contrastResult = applyContrastOverlapPatch({
    layoutSpec,
    infographicData,
    compositionLayout,
    law014ContrastViolation: true,
    sceneGraphProductActual,
  });
  assert.equal(contrastResult.patch.overlayUsedSceneGraphActual, true);
  assert.equal(contrastResult.patch.overlayProductActualSource, "scene-compositor");
});
console.log("✓ contrast-overlap-patch uses ProductNode.actual");

withEnv({ DAOS_SCENE_GRAPH_V2: "1" }, () => {
  const auditWithActual = analyzeOverlayQuality({
    canvas: compositionLayout.canvas,
    layoutSpec,
    compositionLayout,
    sceneGraphProductActual,
    compositionMetrics: compositionLayout.metrics,
    governanceReport: [
      {
        passed: false,
        entries: [{ lawId: "LAW_014", passed: false, message: "overlap" }],
        violations: [],
      },
    ],
  });
  assert.equal(auditWithActual.overlayUsedSceneGraphActual, true);
  assert.equal(auditWithActual.overlayProductActualSource, "scene-compositor");

  const auditPlannedOnly = analyzeOverlayQuality({
    canvas: compositionLayout.canvas,
    layoutSpec,
    compositionLayout,
    compositionMetrics: compositionLayout.metrics,
    governanceReport: [
      {
        passed: false,
        entries: [{ lawId: "LAW_014", passed: false, message: "overlap" }],
        violations: [],
      },
    ],
  });
  assert.equal(auditPlannedOnly.overlayUsedSceneGraphActual, false);

  const diagnostics = buildOverlaySceneGraphDiagnostics({
    sceneGraphProductActual,
    compositionLayout,
    avoidedOverlap: true,
  });
  assert.equal(diagnostics.overlayUsedSceneGraphActual, true);
  assert.equal(diagnostics.overlayAvoidedActualProductOverlap, true);
});
console.log("✓ overlay-quality-audit reads scene graph actual for LAW_014/png risk");

assert.equal(compositorGraph.product.actual?.x, 480);
assert.equal(compositorGraph.product.source, "scene-compositor");
console.log("✓ compositor graph provides ProductNode.actual for overlay stage");

console.log("\n✅ overlay-reads-product-actual.test.ts passed");

/**
 * DAOS Wave 35 — Metric Registry productAreaRatio tests
 * Run: npx tsx src/lib/daos/tests/metric-registry-product-area-ratio.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import { buildSceneGraph, writeCompositorProductActual } from "@/lib/scene-graph/SceneGraphBuilder";
import { evaluateSceneGraphLaw003 } from "@/lib/scene-graph/SceneGraphConstitutionMirror";
import { evaluateSceneGraphLaw003V2 } from "@/lib/scene-graph/SceneGraphLaw003V2";
import {
  clearMetricShadowDiagnostics,
  computeProductAreaRatioLaw003V2,
  computeProductAreaRatioMirror,
  getLastMetricShadowDiagnostic,
  METRIC_PRODUCT_AREA_RATIO,
  MetricRegistry,
  PRODUCT_AREA_RATIO_FORMULA_VERSION,
} from "../metric-registry";

const EPSILON = 1e-9;

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

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

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
  id: "metric-registry-drill",
  productPlacement: { left: 120, top: 180, width: 610, height: 700 },
  overlayDensity: 0.12,
  textAreaPct: 5,
});

const plannerGraph = buildSceneGraph({
  id: "metric-registry-planner",
  stage: "planner",
  compositionLayout,
});
const compositorGraph = writeCompositorProductActual(plannerGraph, {
  left: 480,
  top: 180,
  width: 360,
  height: 520,
});

function assertEquivalence(registryValue: number, legacyValue: number, label: string): void {
  assert.ok(
    Math.abs(registryValue - legacyValue) < EPSILON,
    `${label}: registry=${registryValue} legacy=${legacyValue}`,
  );
}

const registryLaw003 = computeProductAreaRatioLaw003V2(drillGraph);
withEnv({ DAOS_METRIC_REGISTRY: undefined, DAOS_METRIC_REGISTRY_SHADOW: undefined }, () => {
  const legacyV2 = evaluateSceneGraphLaw003V2(drillGraph).metrics.productAreaRatio;
  assertEquivalence(registryLaw003.value, legacyV2, "law003_v2 drill graph");
});
console.log("✓ registry law003_v2 matches legacy SceneGraphLaw003V2");

const registryMirror = computeProductAreaRatioMirror(compositorGraph);
withEnv({ DAOS_METRIC_REGISTRY: undefined, DAOS_METRIC_REGISTRY_SHADOW: undefined }, () => {
  const legacyMirror = evaluateSceneGraphLaw003(compositorGraph).productAreaRatio;
  assertEquivalence(registryMirror.value, legacyMirror, "mirror compositor graph");
});
console.log("✓ registry mirror matches legacy SceneGraphConstitutionMirror");

assert.equal(registryLaw003.metricId, METRIC_PRODUCT_AREA_RATIO);
assert.equal(registryLaw003.unit, "ratio");
assert.equal(registryLaw003.owner, "SceneGraph");
assert.equal(registryLaw003.formulaVersion, PRODUCT_AREA_RATIO_FORMULA_VERSION);
assert.ok(registryLaw003.provenance.length > 0);
assert.ok(registryLaw003.createdAt.length > 0);
console.log("✓ MetricValue provenance fields populated");

const metricViaRegistry = MetricRegistry.compute(METRIC_PRODUCT_AREA_RATIO, {
  kind: "scene_graph",
  graph: drillGraph,
  mode: "law003_v2",
});
assert.equal(metricViaRegistry.value, registryLaw003.value);
console.log("✓ MetricRegistry.compute dispatches productAreaRatio");

withEnv({ DAOS_METRIC_REGISTRY: "0", DAOS_METRIC_REGISTRY_SHADOW: "0" }, () => {
  const v2 = evaluateSceneGraphLaw003V2(drillGraph);
  const mirror = evaluateSceneGraphLaw003(compositorGraph);
  assert.equal(v2.metrics.productAreaRatio, registryLaw003.value);
  assert.equal(mirror.productAreaRatio, registryMirror.value);
});
console.log("✓ DAOS_METRIC_REGISTRY=0 keeps legacy SceneGraph behavior");

withEnv({ DAOS_METRIC_REGISTRY: "1", DAOS_METRIC_REGISTRY_SHADOW: "0" }, () => {
  const v2 = evaluateSceneGraphLaw003V2(drillGraph);
  assert.equal(v2.metrics.productAreaRatio, registryLaw003.value);
});
console.log("✓ DAOS_METRIC_REGISTRY=1 delegates to registry");

clearMetricShadowDiagnostics();
let shadowV2Passed: boolean | undefined;
let shadowV2Score: number | undefined;
withEnv({ DAOS_METRIC_REGISTRY: "0", DAOS_METRIC_REGISTRY_SHADOW: "1" }, () => {
  const before = evaluateSceneGraphLaw003V2(drillGraph);
  shadowV2Passed = before.passed;
  shadowV2Score = before.score;
  const diagnostic = getLastMetricShadowDiagnostic();
  assert.ok(diagnostic);
  assert.equal(diagnostic?.metricId, METRIC_PRODUCT_AREA_RATIO);
  assert.equal(diagnostic?.mode, "law003_v2");
  assert.ok(diagnostic!.delta < EPSILON);
  assert.equal(diagnostic?.diverged, false);
});
withEnv({ DAOS_METRIC_REGISTRY: "0", DAOS_METRIC_REGISTRY_SHADOW: "1" }, () => {
  const after = evaluateSceneGraphLaw003V2(drillGraph);
  assert.equal(after.passed, shadowV2Passed);
  assert.equal(after.score, shadowV2Score);
  assert.equal(after.metrics.productAreaRatio, registryLaw003.value);
});
console.log("✓ shadow mode does not change returned law003_v2 result");

clearMetricShadowDiagnostics();
withEnv({ DAOS_METRIC_REGISTRY: "1", DAOS_METRIC_REGISTRY_SHADOW: "1" }, () => {
  const v2 = evaluateSceneGraphLaw003V2(drillGraph);
  const diagnostic = getLastMetricShadowDiagnostic();
  assert.ok(diagnostic);
  assert.equal(v2.metrics.productAreaRatio, registryLaw003.value);
  assert.ok(diagnostic!.delta < EPSILON);
});
console.log("✓ shadow mode with registry enabled records zero divergence");

const plannedOnlyGraph = buildSceneGraph({
  id: "metric-registry-planned-only",
  stage: "planner",
  compositionLayout,
});
const plannedRegistry = computeProductAreaRatioMirror(plannedOnlyGraph);
withEnv({ DAOS_METRIC_REGISTRY: undefined }, () => {
  const plannedLegacy = evaluateSceneGraphLaw003(plannedOnlyGraph).productAreaRatio;
  assertEquivalence(plannedRegistry.value, plannedLegacy, "mirror planned fallback");
  assert.equal(plannedRegistry.resolutionKind, "planned");
});
console.log("✓ mirror planned fallback equivalence");

console.log("\nDAOS Wave 35 metric-registry productAreaRatio: all tests passed");

/**
 * DAOS v2 Stage 4.1 — SceneGraph whitespace attribution tests
 * Run: npx tsx src/lib/scene-graph/tests/scene-graph-whitespace-attribution.test.ts
 */
import assert from "node:assert/strict";
import type { CompositionLayout } from "@/lib/composition/types";
import { buildSceneGraph } from "../SceneGraphBuilder";
import {
  analyzeSceneGraphWhitespaceAttribution,
  summarizeSceneGraphWhitespaceAttribution,
} from "../SceneGraphWhitespaceAttribution";

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

const smallProductGraph = buildSceneGraph({
  id: "ws-attr-small-product",
  stage: "final",
  compositionLayout: {
    ...compositionLayout,
    metrics: { ...compositionLayout.metrics, whitespacePct: 52, productAreaPct: 18 },
  },
  productPlacement: { left: 200, top: 400, width: 140, height: 100 },
});

const smallProduct = analyzeSceneGraphWhitespaceAttribution(smallProductGraph);
assert.equal(smallProduct.law003Failed, true);
assert.equal(smallProduct.primaryCause, "product_too_small");
assert.ok(smallProduct.productAreaRatio < 0.25);
console.log("✓ small product → product_too_small");

const wideLayout: CompositionLayout = {
  ...compositionLayout,
  metrics: { ...compositionLayout.metrics, whitespacePct: 58, productAreaPct: 18 },
};
const wideProductGraph = buildSceneGraph({
  id: "ws-attr-wide-product",
  stage: "final",
  compositionLayout: wideLayout,
  productPlacement: { left: 40, top: 520, width: 820, height: 180 },
  productCategory: "mattress",
});
const wideProduct = analyzeSceneGraphWhitespaceAttribution(wideProductGraph);
assert.equal(wideProduct.law003Failed, true);
assert.equal(wideProduct.primaryCause, "wide_product_geometry_limit");
assert.ok(wideProduct.aspectRatio >= 2 || wideProductGraph.metadata.productCategory === "mattress");
assert.ok(
  wideProduct.recommendations.some((r) => r.includes("wide-product")),
  "wide product should recommend template not scale patch",
);
console.log("✓ wide product low area → wide_product_geometry_limit");

const emptyBackgroundGraph = buildSceneGraph({
  id: "ws-attr-empty-bg",
  stage: "final",
  compositionLayout: {
    ...compositionLayout,
    metrics: { ...compositionLayout.metrics, whitespacePct: 58, productAreaPct: 30, textAreaPct: 6 },
  },
  productPlacement: { left: 120, top: 200, width: 500, height: 600 },
  overlayAudit: {
    overlayElementCount: 1,
    estimatedOverlayDensity: 0.06,
    whitespaceRisk: 0.8,
    contrastRisk: 0.2,
    hierarchyRisk: 0.2,
    readabilityRisk: 0.2,
    pngOverlayFeelRisk: 0.2,
    law003WhitespaceViolation: true,
    law014ContrastViolation: false,
    law003Before: true,
    law003After: true,
    law003GovernanceSource: "constitution",
    law003SoftResolved: false,
    warnings: [],
    recommendations: [],
    score: 60,
  },
});
const emptyBackground = analyzeSceneGraphWhitespaceAttribution(emptyBackgroundGraph);
assert.equal(emptyBackground.law003Failed, true);
assert.ok(emptyBackground.overlayDensity < 0.12);
assert.ok(emptyBackground.estimatedWhitespace > 45);
assert.ok(
  ["overlay_too_small", "background_too_empty", "metric_mismatch"].includes(
    emptyBackground.primaryCause,
  ) ||
    emptyBackground.secondaryCauses.includes("overlay_too_small") ||
    emptyBackground.secondaryCauses.includes("background_too_empty"),
);
console.log("✓ low overlay + high whitespace → background_too_empty / overlay_too_small");

const lowHeroTextGraph = buildSceneGraph({
  id: "ws-attr-low-hero-text",
  stage: "final",
  compositionLayout: {
    ...compositionLayout,
    metrics: {
      ...compositionLayout.metrics,
      whitespacePct: 50,
      productAreaPct: 22,
      textAreaPct: 18,
    },
  },
  productPlacement: { left: 480, top: 180, width: 360, height: 520 },
});
lowHeroTextGraph.typography = {
  ...lowHeroTextGraph.typography,
  actual: {
    ...lowHeroTextGraph.typography.actual!,
    textAreaPct: 18,
  },
};
const lowHeroText = analyzeSceneGraphWhitespaceAttribution(lowHeroTextGraph);
assert.equal(lowHeroText.law003Failed, true);
assert.ok(lowHeroText.heroTextRatio < 2);
assert.ok(
  lowHeroText.primaryCause === "hero_text_ratio_low" ||
    lowHeroText.secondaryCauses.includes("hero_text_ratio_low"),
);
console.log("✓ low heroTextRatio → hero_text_ratio_low");

const metricMismatchGraph = buildSceneGraph({
  id: "ws-attr-metric-mismatch",
  stage: "final",
  compositionLayout: {
    ...compositionLayout,
    metrics: { ...compositionLayout.metrics, whitespacePct: 58, productAreaPct: 22, textAreaPct: 10 },
  },
  productPlacement: { left: 120, top: 180, width: 480, height: 720 },
  overlayAudit: {
    overlayElementCount: 4,
    estimatedOverlayDensity: 0.18,
    whitespaceRisk: 0.7,
    contrastRisk: 0.2,
    hierarchyRisk: 0.2,
    readabilityRisk: 0.2,
    pngOverlayFeelRisk: 0.2,
    law003WhitespaceViolation: true,
    law014ContrastViolation: false,
    law003Before: true,
    law003After: true,
    law003GovernanceSource: "daos_recalibrated",
    law003SoftResolved: false,
    warnings: [],
    recommendations: [],
    score: 70,
  },
  law003Recalibration: {
    originalWhitespace: 58,
    recalibratedWhitespace: 58,
    productAdjustedWhitespace: 58,
    overlayAdjustedWhitespace: 58,
    law003Before: true,
    law003After: true,
    confidence: 0.85,
    reason: "stale",
    warnings: [],
    staleMetricDetected: true,
  },
});
const metricMismatch = analyzeSceneGraphWhitespaceAttribution(metricMismatchGraph);
assert.equal(metricMismatch.law003Failed, true);
assert.ok(metricMismatch.productAreaRatio >= 0.3);
assert.ok(metricMismatch.overlayDensity <= 0.25);
assert.equal(metricMismatch.primaryCause, "metric_mismatch");
assert.ok(metricMismatch.recommendations.some((r) => r.includes("formula")));
console.log("✓ metric mismatch case");

const first = analyzeSceneGraphWhitespaceAttribution(wideProductGraph);
const second = analyzeSceneGraphWhitespaceAttribution(wideProductGraph);
assert.deepEqual(
  { primary: first.primaryCause, ws: first.estimatedWhitespace },
  { primary: second.primaryCause, ws: second.estimatedWhitespace },
);
const summary = summarizeSceneGraphWhitespaceAttribution(first);
assert.ok(summary.summary.includes(first.primaryCause));
assert.equal(summary.primaryCause, first.primaryCause);
console.log("✓ deterministic results + summarize");

console.log("\n✅ scene-graph-whitespace-attribution.test.ts passed");

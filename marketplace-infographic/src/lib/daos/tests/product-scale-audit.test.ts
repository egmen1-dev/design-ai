/**
 * DAOS Wave 23 — product scale / scene fill audit tests
 * Run: npx tsx src/lib/daos/tests/product-scale-audit.test.ts
 */
import assert from "node:assert/strict";
import {
  analyzeProductScale,
  summarizeProductScaleAudit,
} from "../audit/product-scale-audit";

const canvas = { width: 900, height: 1200 };

const smallProduct = analyzeProductScale({
  canvas,
  placement: { left: 320, top: 400, width: 180, height: 220 },
  productCutoutPath: "/generated/cutout.png",
  finalImagePath: "/generated/final.png",
});
assert.ok((smallProduct.productAreaRatio ?? 1) < 0.45);
assert.ok(smallProduct.warnings.some((warning) => warning.code === "PRODUCT_SCALE_AREA_LOW"));
assert.ok(smallProduct.warnings.some((warning) => warning.code === "PRODUCT_SCALE_WIDTH_LOW"));
assert.ok(smallProduct.warnings.some((warning) => warning.code === "PRODUCT_SCALE_HEIGHT_LOW"));
console.log("✓ small product → warning");

const highEmpty = analyzeProductScale({
  canvas,
  placement: { left: 280, top: 320, width: 340, height: 420 },
  compositionLayout: {
    canvas,
    safeInsetPct: 0.06,
    product: {
      left: 280,
      top: 320,
      width: 340,
      height: 420,
      centerX: 0.55,
      centerY: 0.5,
      maxWidthPct: 42,
      maxHeightPct: 52,
      areaPct: 62,
      rotationDeg: 0,
    },
    headline: { left: 40, top: 60, width: 280, height: 90, fontSizePct: 8 },
    subtitle: { left: 40, top: 150, width: 260, height: 50, fontSizePct: 4 },
    leftPanel: { left: 30, top: 220, width: 300, height: 420 },
    rightSidebar: { left: 700, top: 220, width: 160, height: 420 },
    bullets: {
      left: 40,
      top: 240,
      width: 260,
      height: 180,
      itemHeightPct: 6,
      gapPct: 2,
      maxCount: 2,
    },
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
      productAreaPct: 62,
      textAreaPct: 10,
      plaqueAreaPct: 6,
      whitespacePct: 58,
      overlapPct: 3,
      visualCenterX: 0.55,
      visualCenterY: 0.5,
      minEdgeInsetPct: 4,
    },
    valid: true,
    issues: [],
    adjustments: [],
  },
  productCutoutPath: "/generated/cutout.png",
  finalImagePath: "/generated/final.png",
});
assert.ok(highEmpty.emptySpaceEstimate > 0.45);
assert.ok(highEmpty.warnings.some((warning) => warning.code === "SCENE_FILL_EMPTY_HIGH"));
assert.ok(highEmpty.warnings.some((warning) => warning.code === "COMPOSITOR_VS_LAYOUT_GAP"));
console.log("✓ high emptySpace → warning");

const missing = analyzeProductScale({});
assert.ok(missing.warnings.some((warning) => warning.code === "PRODUCT_SCALE_INPUT_MISSING"));
assert.ok(missing.warnings.some((warning) => warning.code === "PRODUCT_SCALE_PLACEMENT_MISSING"));
assert.equal(missing.productAreaRatio, undefined);
assert.ok(missing.score >= 0 && missing.score <= 100);
console.log("✓ safe fallback on missing input");

const deterministicInput = {
  canvas,
  placement: { left: 220, top: 260, width: 420, height: 520 },
  productCutoutPath: "/generated/cutout.png",
  finalImagePath: "/generated/final.png",
  overlayQualityAudit: {
    overlayElementCount: 4,
    estimatedOverlayDensity: 0.12,
    whitespaceRisk: 0.52,
    contrastRisk: 0.2,
    hierarchyRisk: 0.1,
    readabilityRisk: 0.1,
    pngOverlayFeelRisk: 0.8,
    law003WhitespaceViolation: true,
    law014ContrastViolation: false,
    warnings: [],
    recommendations: [],
    score: 20,
  },
};
const first = summarizeProductScaleAudit(analyzeProductScale(deterministicInput));
const second = summarizeProductScaleAudit(analyzeProductScale(deterministicInput));
assert.deepEqual(first, second);
assert.ok(first.score >= 0 && first.score <= 100);
assert.ok(
  analyzeProductScale(deterministicInput).warnings.some(
    (warning) => warning.code === "LAW_003_COMPOSITOR_SCALE_RECOMMENDED",
  ),
);
console.log("✓ deterministic score");

const compositePreferred = analyzeProductScale({
  canvas,
  compositePlacement: {
    x: 100,
    y: 150,
    width: 600,
    height: 700,
    areaRatio: (600 * 700) / (900 * 1200),
    widthRatio: 600 / 900,
    heightRatio: 700 / 1200,
    source: "productPlacement",
    confidence: 0.95,
  },
  productBounds: { left: 280, top: 320, width: 340, height: 420 },
  compositionLayout: {
    canvas,
    safeInsetPct: 0.06,
    product: {
      left: 280,
      top: 320,
      width: 340,
      height: 420,
      centerX: 0.55,
      centerY: 0.5,
      maxWidthPct: 42,
      maxHeightPct: 52,
      areaPct: 62,
      rotationDeg: 0,
    },
    headline: { left: 40, top: 60, width: 280, height: 90, fontSizePct: 8 },
    subtitle: { left: 40, top: 150, width: 260, height: 50, fontSizePct: 4 },
    leftPanel: { left: 30, top: 220, width: 300, height: 420 },
    rightSidebar: { left: 700, top: 220, width: 160, height: 420 },
    bullets: {
      left: 40,
      top: 240,
      width: 260,
      height: 180,
      itemHeightPct: 6,
      gapPct: 2,
      maxCount: 2,
    },
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
      productAreaPct: 62,
      textAreaPct: 10,
      plaqueAreaPct: 6,
      whitespacePct: 58,
      overlapPct: 3,
      visualCenterX: 0.55,
      visualCenterY: 0.5,
      minEdgeInsetPct: 4,
    },
    valid: true,
    issues: [],
    adjustments: [],
  },
  productCutoutPath: "/generated/cutout.png",
  finalImagePath: "/generated/final.png",
});
assert.ok(Math.abs((compositePreferred.productAreaRatio ?? 0) - (600 * 700) / (900 * 1200)) < 0.0001);
const layoutOnlyRatio = (340 * 420) / (900 * 1200);
assert.ok(Math.abs((compositePreferred.productAreaRatio ?? 0) - layoutOnlyRatio) > 0.05);
console.log("✓ compositePlacement preferred over layout bounds");

console.log("\nAll product-scale-audit tests passed.");

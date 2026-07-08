/**
 * DAOS Wave 27 — LAW_003 whitespace recalibration tests
 * Run: npx tsx src/lib/daos/tests/law003-recalibration.test.ts
 */
import assert from "node:assert/strict";
import { createLaw003RecalibrationReport } from "../governance/law003-recalibration";

const lowProduct = createLaw003RecalibrationReport({
  originalWhitespace: 58,
  plannedProductAreaRatio: 0.15,
  productAreaRatio: 0.09,
  overlayDensity: 0.12,
  constitutionLaw003Violation: true,
});
assert.equal(lowProduct.law003Before, true);
assert.equal(lowProduct.law003After, true);
console.log("✓ productArea 0.09 → still fail");

const improved = createLaw003RecalibrationReport({
  originalWhitespace: 58,
  plannedProductAreaRatio: 0.15,
  productAreaRatio: 0.38,
  overlayDensity: 0.12,
  constitutionLaw003Violation: true,
  compositePlacement: {
    x: 100,
    y: 150,
    width: 600,
    height: 700,
    areaRatio: 0.38,
    widthRatio: 0.67,
    heightRatio: 0.58,
    source: "productPlacement",
    confidence: 0.95,
  },
});
assert.equal(improved.law003Before, true);
assert.equal(improved.law003After, false);
assert.ok(improved.recalibratedWhitespace <= 35);
console.log("✓ factual product area + low overlayDensity → improves");

const highOverlay = createLaw003RecalibrationReport({
  originalWhitespace: 58,
  plannedProductAreaRatio: 0.15,
  productAreaRatio: 0.33,
  overlayDensity: 0.42,
  constitutionLaw003Violation: true,
});
assert.equal(highOverlay.law003Before, true);
assert.equal(highOverlay.law003After, true);
assert.ok(highOverlay.warnings.includes("OVERLAY_DENSITY_BLOCKS_RECALIBRATION"));
console.log("✓ high overlayDensity → still fail");

const stale = createLaw003RecalibrationReport({
  originalWhitespace: 56,
  plannedProductAreaRatio: 0.12,
  productAreaRatio: 0.38,
  overlayDensity: 0.11,
  constitutionLaw003Violation: true,
});
assert.equal(stale.staleMetricDetected, true);
assert.ok(stale.warnings.includes("STALE_WHITESPACE_METRIC"));
console.log("✓ stale metric detected");

console.log("\nAll law003-recalibration tests passed.");

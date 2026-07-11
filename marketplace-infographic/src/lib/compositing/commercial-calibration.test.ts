import assert from "node:assert/strict";
import {
  COMMERCIAL_CALIBRATION_VERSION,
  computeMaxProductSize,
  LEGACY_SCALE_BOOST_BASE,
  LEGACY_SCALE_BOOST_SLOPE,
  resolveScaleBoost,
  sensitivitySweep,
} from "./commercial-calibration";
import type { CompositionLayout } from "@/lib/composition/types";

const SAMPLE_LAYOUT: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 6,
  product: {
    left: 18,
    top: 12,
    width: 65,
    height: 75,
    centerX: 50,
    centerY: 48,
    maxWidthPct: 65,
    maxHeightPct: 75,
    areaPct: 48.75,
    rotationDeg: 0,
  },
  headline: { left: 6, top: 5, width: 36, height: 12, fontSizePct: 4 },
  subtitle: { left: 0, top: 0, width: 0, height: 0, fontSizePct: 0 },
  leftPanel: { left: 0, top: 0, width: 0, height: 0 },
  rightSidebar: { left: 0, top: 0, width: 0, height: 0 },
  bullets: { left: 0, top: 0, width: 0, height: 0, itemHeightPct: 0, gapPct: 0, maxCount: 0 },
  plaques: {
    smallWidthPct: 10,
    mediumWidthPct: 12,
    largeWidthPct: 14,
    heightPct: 4,
    maxTotalAreaPct: 10,
  },
  icon: { sizePct: 3.5, textGapPct: 1.2 },
  textSide: "left",
  scenarioId: "test",
  seed: "test",
  metrics: {
    productAreaPct: 48.75,
    textAreaPct: 4.32,
    plaqueAreaPct: 0,
    whitespacePct: 46.93,
    overlapPct: 0,
    visualCenterX: 50,
    visualCenterY: 48,
    minEdgeInsetPct: 12,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

function testLegacyFormulaUnchanged() {
  const legacy = resolveScaleBoost({ objectScale: 0.5, zoneAreaPct: 48.75, mode: "legacy" });
  assert.equal(legacy.scaleBoost, LEGACY_SCALE_BOOST_BASE + 0.5 * LEGACY_SCALE_BOOST_SLOPE);
  assert.equal(legacy.formula, `legacy:${LEGACY_SCALE_BOOST_BASE}+objectScale*${LEGACY_SCALE_BOOST_SLOPE}`);
}

function testCalibratedIncreasesSensitivity() {
  const legacy50 = computeMaxProductSize(SAMPLE_LAYOUT, 0.5, "legacy");
  const legacy55 = computeMaxProductSize(SAMPLE_LAYOUT, 0.55, "legacy");
  const cal50 = computeMaxProductSize(SAMPLE_LAYOUT, 0.5, "calibrated");
  const cal55 = computeMaxProductSize(SAMPLE_LAYOUT, 0.55, "calibrated");

  const legacyDelta = legacy55.placementAreaPct - legacy50.placementAreaPct;
  const calibratedDelta = cal55.placementAreaPct - cal50.placementAreaPct;

  assert.ok(legacyDelta < 1, `legacy delta too large: ${legacyDelta}`);
  assert.ok(calibratedDelta >= 2, `calibrated delta too small: ${calibratedDelta}`);
  assert.ok(cal55.placementAreaPct > legacy55.placementAreaPct);
}

function testSensitivitySweepMonotonic() {
  const scales = [0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75];
  const sweep = sensitivitySweep(SAMPLE_LAYOUT, scales, "calibrated");
  let prev = 0;
  for (const row of sweep) {
    assert.ok(row.placementAreaPct >= prev, `non-monotonic at ${row.objectScale}`);
    prev = row.placementAreaPct;
  }
}

function testDiagnosticsShape() {
  const size = computeMaxProductSize(SAMPLE_LAYOUT, 0.55, "calibrated");
  assert.equal(COMMERCIAL_CALIBRATION_VERSION, "1.0.0-sprint6c");
  assert.ok(size.placementAreaPct > 18);
}

testLegacyFormulaUnchanged();
testCalibratedIncreasesSensitivity();
testSensitivitySweepMonotonic();
testDiagnosticsShape();
console.log("commercial-calibration OK");

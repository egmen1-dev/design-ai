/**
 * DAOS Wave 20 — overlay gate tests
 * Run: npx tsx src/lib/daos/tests/overlay-gate.test.ts
 */
import assert from "node:assert/strict";
import type { OverlayQualityAudit } from "../audit/overlay-quality-audit";
import { evaluateDaosOverlayGate } from "../gates/overlay-gate";

function makeAudit(partial: Partial<OverlayQualityAudit>): OverlayQualityAudit {
  return {
    overlayElementCount: 4,
    estimatedOverlayDensity: 0.25,
    whitespaceRisk: 0.2,
    contrastRisk: 0.2,
    hierarchyRisk: 0.15,
    readabilityRisk: 0.15,
    pngOverlayFeelRisk: 0.2,
    law003WhitespaceViolation: false,
    law014ContrastViolation: false,
    warnings: [],
    recommendations: [],
    score: 85,
    ...partial,
  };
}

const passed = evaluateDaosOverlayGate(makeAudit({ score: 85 }));
assert.equal(passed.status, "passed");
assert.equal(passed.blocking, false);
console.log("✓ overlay gate passed");

const warning = evaluateDaosOverlayGate(
  makeAudit({
    score: 72,
    law003WhitespaceViolation: true,
    warnings: [{ code: "LAW_003_WHITESPACE_VIOLATION", message: "whitespace" }],
    recommendations: ["fix whitespace"],
  }),
);
assert.equal(warning.status, "warning");
assert.equal(warning.blocking, false);
console.log("✓ overlay gate warning");

const failedScore = evaluateDaosOverlayGate(makeAudit({ score: 55 }));
assert.equal(failedScore.status, "failed");
assert.equal(failedScore.blocking, false);
console.log("✓ overlay gate failed on low score");

const failedLaws = evaluateDaosOverlayGate(
  makeAudit({
    score: 70,
    law003WhitespaceViolation: true,
    law014ContrastViolation: true,
  }),
);
assert.equal(failedLaws.status, "failed");
assert.equal(failedLaws.blocking, false);
console.log("✓ overlay gate failed on dual law violations");

const failedPng = evaluateDaosOverlayGate(
  makeAudit({
    score: 65,
    pngOverlayFeelRisk: 0.82,
    warnings: [{ code: "PNG_OVERLAY_FEEL_RISK", message: "overlay feel" }],
  }),
);
assert.equal(failedPng.status, "failed");
assert.equal(failedPng.blocking, false);
console.log("✓ overlay gate failed on png overlay feel risk");

console.log("\nAll overlay-gate tests passed.");

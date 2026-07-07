/**
 * DAOS Wave 29 — LAW_003 soft governance tests
 * Run: npx tsx src/lib/daos/tests/law003-soft-governance.test.ts
 */
import assert from "node:assert/strict";
import { analyzeOverlayQuality } from "../audit/overlay-quality-audit";
import { evaluateDaosOverlayGate } from "../gates/overlay-gate";
import {
  isDaosLaw003SoftGovernanceEnabled,
  resolveLaw003SoftGovernance,
} from "../governance/law003-soft-governance";

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

const recalibration = {
  law003Before: true,
  law003After: false,
  reason: "Factual product area 33.0% adjusted whitespace 56.0% → 28.0%",
  warnings: ["STALE_WHITESPACE_METRIC"],
  staleMetricDetected: true,
};

withEnv({ DAOS_LAW003_SOFT_GOVERNANCE: "0" }, () => {
  const constitutionOnly = resolveLaw003SoftGovernance({
    constitutionViolation: true,
    recalibration,
    factualProductAreaRatio: 0.33,
    overlayDensity: 0.12,
  });
  assert.equal(constitutionOnly.law003GovernanceSource, "constitution");
  assert.equal(constitutionOnly.softViolation, true);
  assert.equal(constitutionOnly.law003Before, true);
  assert.equal(constitutionOnly.law003After, false);
  assert.equal(constitutionOnly.law003SoftResolved, false);
  console.log("✓ soft OFF keeps constitution violation");
});

withEnv({ DAOS_LAW003_SOFT_GOVERNANCE: "1" }, () => {
  assert.equal(isDaosLaw003SoftGovernanceEnabled(), true);

  const soft = resolveLaw003SoftGovernance({
    constitutionViolation: true,
    recalibration,
    factualProductAreaRatio: 0.33,
    overlayDensity: 0.12,
  });
  assert.equal(soft.law003GovernanceSource, "daos_recalibrated");
  assert.equal(soft.softViolation, false);
  assert.equal(soft.law003SoftResolved, true);
  console.log("✓ soft ON uses law003After");
});

const constitutionAudit = analyzeOverlayQuality({
  governanceReport: [
    {
      constitutionId: "marketplace_v1",
      constitutionVersion: "1.2",
      stage: "rendered_critique",
      passed: false,
      overallDesignScore: 70,
      scores: {
        compositionScore: 70,
        hierarchyScore: 70,
        whitespaceScore: 50,
        luxuryScore: 70,
        typographyScore: 70,
        contrastScore: 70,
        marketplaceScore: 70,
        brandScore: 70,
        visualNoiseScore: 70,
        overallDesignScore: 70,
      },
      entries: [
        {
          lawId: "LAW_003",
          lawName: "Whitespace",
          passed: false,
          severity: "error",
          reason: "Whitespace 56.0% above maximum 35%",
        },
      ],
      violations: [{ lawId: "LAW_003", message: "Whitespace violation", severity: "error" }],
      patchesApplied: [],
      attempts: 1,
    },
  ],
  compositionMetrics: { whitespacePct: 56, textAreaPct: 12, plaqueAreaPct: 8, overlapPct: 1 },
  law003Recalibration: recalibration,
  law003SoftGovernanceEnabled: false,
  factualProductAreaRatio: 0.33,
});

const softAudit = analyzeOverlayQuality({
  governanceReport: constitutionAudit.warnings.length
    ? [
        {
          constitutionId: "marketplace_v1",
          constitutionVersion: "1.2",
          stage: "rendered_critique",
          passed: false,
          overallDesignScore: 70,
          scores: {
            compositionScore: 70,
            hierarchyScore: 70,
            whitespaceScore: 50,
            luxuryScore: 70,
            typographyScore: 70,
            contrastScore: 70,
            marketplaceScore: 70,
            brandScore: 70,
            visualNoiseScore: 70,
            overallDesignScore: 70,
          },
          entries: [
            {
              lawId: "LAW_003",
              lawName: "Whitespace",
              passed: false,
              severity: "error",
              reason: "Whitespace 56.0% above maximum 35%",
            },
          ],
          violations: [{ lawId: "LAW_003", message: "Whitespace violation", severity: "error" }],
          patchesApplied: [],
          attempts: 1,
        },
      ]
    : [],
  compositionMetrics: { whitespacePct: 56, textAreaPct: 12, plaqueAreaPct: 8, overlapPct: 1 },
  law003Recalibration: recalibration,
  law003SoftGovernanceEnabled: true,
  factualProductAreaRatio: 0.33,
});

assert.equal(constitutionAudit.law003Before, true);
assert.equal(softAudit.law003Before, true);
assert.equal(constitutionAudit.law003WhitespaceViolation, true);
assert.equal(softAudit.law003WhitespaceViolation, false);
assert.ok(softAudit.score > constitutionAudit.score);
console.log("✓ law003After=false improves overlay score");

const constitutionGate = evaluateDaosOverlayGate(constitutionAudit);
const softGate = evaluateDaosOverlayGate(softAudit);
assert.equal(constitutionGate.blocking, false);
assert.equal(softGate.blocking, false);
assert.ok(softGate.score >= constitutionGate.score);
assert.notEqual(softGate.status, "failed");
console.log("✓ blocking remains false / overlay gate improves");

assert.ok(softAudit.warnings.some((warning) => warning.code === "STALE_WHITESPACE_METRIC"));
console.log("✓ stale metric gets marked");

console.log("\nAll law003-soft-governance tests passed.");

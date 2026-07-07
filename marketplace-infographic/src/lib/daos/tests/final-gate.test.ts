/**
 * DAOS Wave 7 — soft final gate tests
 * Run: npx tsx src/lib/daos/tests/final-gate.test.ts
 */
import assert from "node:assert/strict";
import { evaluateDaosFinalGate } from "../gates/final-gate";

const okSummary = {
  status: "ok",
  score: 92,
  generationMode: "balanced",
  criticalCount: 0,
  specsMissing: [],
  render: { fallbackUsed: false, modulesIgnored: [], promptCaptured: true },
  recommendations: [],
};

const okGate = evaluateDaosFinalGate({ summary: okSummary, generationMode: "balanced" });
assert.equal(okGate.status, "passed");
assert.equal(okGate.blocking, false);
console.log("✓ ok summary → passed");

const warningGate = evaluateDaosFinalGate({
  summary: { ...okSummary, status: "warning", score: 70, warningCount: 1 },
  generationMode: "balanced",
});
assert.equal(warningGate.status, "warning");
console.log("✓ warning summary → warning");

const criticalGate = evaluateDaosFinalGate({
  summary: { ...okSummary, status: "critical", score: 40, criticalCount: 2 },
  generationMode: "premium",
});
assert.equal(criticalGate.status, "failed");
console.log("✓ critical summary → failed");

const premiumLowScore = evaluateDaosFinalGate({
  summary: { ...okSummary, status: "ok", score: 75 },
  generationMode: "premium",
});
assert.equal(premiumLowScore.status, "failed");
assert.ok(premiumLowScore.reasons.some((r) => r.includes("premium")));
console.log("✓ premium score < 80 → failed");

const enterpriseLowScore = evaluateDaosFinalGate({
  summary: { ...okSummary, status: "ok", score: 79 },
  generationMode: "enterprise",
});
assert.equal(enterpriseLowScore.status, "failed");
console.log("✓ enterprise score < 80 → failed");

const balancedLowScore = evaluateDaosFinalGate({
  summary: { ...okSummary, status: "ok", score: 60 },
  generationMode: "balanced",
});
assert.equal(balancedLowScore.status, "warning");
console.log("✓ balanced score < 65 → warning");

const draftLowScore = evaluateDaosFinalGate({
  summary: { ...okSummary, status: "ok", score: 45 },
  generationMode: "draft",
});
assert.equal(draftLowScore.status, "warning");
console.log("✓ draft score < 50 → warning");

assert.equal(evaluateDaosFinalGate({ summary: okSummary }).blocking, false);
assert.equal(criticalGate.blocking, false);
console.log("✓ blocking always false");

const recGate = evaluateDaosFinalGate({
  summary: {
    status: "critical",
    score: 30,
    criticalCount: 1,
    specsMissing: ["knowledgeSpec"],
    render: { fallbackUsed: true, modulesIgnored: ["layout_coordinates"], promptCaptured: false },
    recommendations: [],
  },
  generationMode: "premium",
});
assert.ok(recGate.recommendations.includes("Review DAOS debug bundle before trusting output."));
assert.ok(recGate.recommendations.includes("Investigate render fallback path."));
assert.ok(recGate.recommendations.includes("Review ignored render modules."));
assert.ok(recGate.recommendations.includes("Improve spec adapter coverage."));
console.log("✓ recommendations created");

console.log("\nDAOS Wave 7 final-gate: all tests passed");

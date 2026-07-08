/**
 * DAOS Wave 12 — context effect audit tests
 * Run: npx tsx src/lib/daos/tests/context-effect-audit.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState } from "../core/project-state";
import { createDaosDebugBundle } from "../debug/daos-debug-bundle";
import { createDaosDebugSummary } from "../debug/daos-debug-summary";
import { evaluateDaosFinalGate } from "../gates/final-gate";
import {
  createDaosContextEffectAudit,
  summarizeDaosContextEffectAudit,
} from "../audit/context-effect-audit";

const baseState = createProjectState({ projectId: "proj-wave12", runId: "run-audit" });

const renderDebug = {
  provider: "pollinations",
  model: "flux",
  finalPrompt: "short prompt",
  promptLength: 120,
  fallbackUsed: false,
  modulesIgnored: ["lighting"],
  createdAt: new Date().toISOString(),
};

const afterBundle = createDaosDebugBundle(baseState, {
  renderDebug,
  promptContextInjected: true,
  promptContextEnabled: true,
  renderContextAttached: true,
  renderContextEnabled: true,
  useRenderEngineV17: true,
});
const afterSummary = createDaosDebugSummary(afterBundle);
const afterGate = evaluateDaosFinalGate({ summary: afterSummary, generationMode: "balanced" });

const insufficient = createDaosContextEffectAudit(null, undefined);
assert.equal(insufficient.status, "insufficient_data");
assert.ok(insufficient.notes.some((note) => note.includes("insufficient_data")));
console.log("✓ insufficient data when before/after missing");

const beforeBundle = createDaosDebugBundle(baseState, {
  renderDebug,
  promptContextInjected: false,
  promptContextEnabled: false,
  renderContextAttached: false,
  renderContextEnabled: false,
  useRenderEngineV17: true,
});
const beforeSummary = createDaosDebugSummary(beforeBundle);
const beforeGate = evaluateDaosFinalGate({ summary: beforeSummary, generationMode: "balanced" });

const audit = createDaosContextEffectAudit(
  {
    bundle: beforeBundle,
    summary: beforeSummary,
    finalGate: beforeGate,
    promptLength: 100,
    containsDaosContextBlock: false,
    promptContextInjected: false,
    renderContextAttached: false,
  },
  {
    bundle: afterBundle,
    summary: afterSummary,
    finalGate: afterGate,
    promptLength: 220,
    containsDaosContextBlock: true,
    promptContextInjected: true,
    renderContextAttached: true,
  },
);

assert.equal(audit.prompt.lengthBefore, 100);
assert.equal(audit.prompt.lengthAfter, 220);
assert.equal(audit.prompt.delta, 120);
assert.equal(audit.prompt.containsDaosBlockBefore, false);
assert.equal(audit.prompt.containsDaosBlockAfter, true);
console.log("✓ prompt delta");

assert.deepEqual(audit.modulesIgnored.before, ["lighting"]);
assert.deepEqual(audit.modulesIgnored.after, ["lighting"]);
assert.deepEqual(audit.modulesIgnored.added, []);
assert.deepEqual(audit.modulesIgnored.removed, []);
console.log("✓ modulesIgnored delta stable on single render");

const fallbackAudit = createDaosContextEffectAudit(
  {
    bundle: beforeBundle,
    summary: beforeSummary,
    finalGate: beforeGate,
    fallbackUsed: false,
  },
  {
    bundle: afterBundle,
    summary: afterSummary,
    finalGate: afterGate,
    fallbackUsed: true,
  },
);
assert.equal(fallbackAudit.fallback.before, false);
assert.equal(fallbackAudit.fallback.after, true);
assert.equal(fallbackAudit.fallback.changed, true);
console.log("✓ fallback delta");

const scoreBeforeSummary = { ...afterSummary, score: 90 };
const scoreAfterSummary = { ...afterSummary, score: 84 };
const scoreAudit = createDaosContextEffectAudit(
  { bundle: beforeBundle, summary: scoreBeforeSummary, finalGate: beforeGate },
  { bundle: afterBundle, summary: scoreAfterSummary, finalGate: afterGate },
);
assert.equal(scoreAudit.summaryScore.before, 90);
assert.equal(scoreAudit.summaryScore.after, 84);
assert.equal(scoreAudit.summaryScore.delta, -6);
console.log("✓ score delta");

const summary = summarizeDaosContextEffectAudit(audit);
assert.equal(summary.promptDelta, 120);
assert.ok(summary.notes.length > 0);
console.log("✓ summarize audit");

console.log("\nAll context-effect-audit tests passed.");

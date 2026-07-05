/**
 * DAOS Wave 6 — debug summary tests
 * Run: npx tsx src/lib/daos/tests/debug-summary.test.ts
 */
import assert from "node:assert/strict";
import { createDaosDebugSummary, renderDaosDebugSummaryMarkdown } from "../debug/daos-debug-summary";
import { writeDaosDebugSummary } from "../debug/daos-debug-summary-writer";

const emptySummary = createDaosDebugSummary({});
assert.equal(emptySummary.projectId, "unknown-project");
assert.equal(emptySummary.runId, "unknown-run");
assert.ok(typeof emptySummary.score === "number");
assert.ok(Array.isArray(emptySummary.recommendations));
console.log("✓ summary creates on empty bundle");

const criticalBundle = {
  projectId: "proj-crit",
  runId: "run-crit",
  generationMode: "premium",
  specs: { renderBlueprint: { id: "rb" } },
  diagnostics: {
    missingSpecs: ["knowledgeSpec", "commercialSpec"],
    promptCaptured: false,
    fallbackUsed: false,
  },
  meaningLossReport: {
    warnings: [
      { severity: "critical", message: "PROMPT_MISSING", code: "PROMPT_MISSING" },
      { severity: "critical", message: "RENDER_PROMPT_CONTRACT_VIOLATION", code: "RENDER_PROMPT_CONTRACT_VIOLATION" },
    ],
  },
};

const criticalSummary = createDaosDebugSummary(criticalBundle);
assert.equal(criticalSummary.criticalCount, 2);
assert.ok(criticalSummary.score < 100);
assert.equal(criticalSummary.status, "critical");
console.log("✓ criticalCount reduces score");

const fallbackBundle = {
  projectId: "proj-fb",
  runId: "run-fb",
  generationMode: "balanced",
  diagnostics: { fallbackUsed: true, missingSpecs: [] },
  renderDebug: { fallbackUsed: true, modulesIgnored: ["layout_coordinates"] },
  meaningLossReport: { warnings: [{ severity: "warning", message: "FALLBACK_USED" }] },
};

const fallbackSummary = createDaosDebugSummary(fallbackBundle);
assert.equal(fallbackSummary.render.fallbackUsed, true);
assert.ok(fallbackSummary.score <= 75);
console.log("✓ fallback reduces score");

const markdown = renderDaosDebugSummaryMarkdown({
  ...criticalSummary,
  projectId: "proj-md",
  runId: "run-md",
  status: "warning",
});
assert.ok(markdown.includes("proj-md"));
assert.ok(markdown.includes("run-md"));
assert.ok(markdown.includes("warning"));
console.log("✓ markdown contains projectId/runId/status");

async function runWriterTests() {
  const writeOk = await writeDaosDebugSummary({
    bundle: fallbackBundle,
    bundlePath: undefined,
  });
  assert.equal(writeOk.ok, true);
  assert.equal(writeOk.summaryPath, undefined);

  const writeFail = await writeDaosDebugSummary({
    bundle: fallbackBundle,
    bundlePath: "/\0invalid/daos-debug-bundle.json",
  });
  assert.equal(writeFail.ok, false);
  assert.ok(writeFail.error?.includes("DAOS debug summary write failed"));
  console.log("✓ writer does not throw on errors");
}

runWriterTests()
  .then(() => {
    console.log("\nDAOS Wave 6 debug-summary: all tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * DAOS Wave 3 — debug bundle tests
 * Run: npx tsx src/lib/daos/tests/debug-bundle.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState } from "../core/project-state";
import { updateProjectState } from "../core/project-state";
import { createDaosDebugBundle } from "../debug/daos-debug-bundle";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import { writeDaosDebugBundle } from "../debug/daos-debug-writer";
import type { CommercialSpec, CreativeSpec, RenderBlueprint } from "../contracts/specs";

const PROJECT_ID = "proj-wave3";
const RUN_ID = "run-wave3";

function makeSpec<T extends { id: string; projectId: string; decisionTrace: unknown[]; confidence?: { score: number } }>(
  partial: Partial<T> & Pick<T, "id">,
): T {
  return {
    projectId: PROJECT_ID,
    version: 1,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "test",
    decisionTrace: [{ id: "t1", source: "test", decision: "d", reason: "r", confidence: 0.8, createdAt: new Date().toISOString() }],
    ...partial,
  } as T;
}

const baseState = createProjectState({ projectId: PROJECT_ID, runId: RUN_ID });
const bundle = createDaosDebugBundle(baseState);

assert.equal(bundle.projectId, PROJECT_ID);
assert.equal(bundle.runId, RUN_ID);
assert.ok(bundle.createdAt);
assert.ok(bundle.meaningLossReport);
assert.ok(Array.isArray(bundle.diagnostics.missingSpecs));
assert.equal(bundle.diagnostics.missingSpecs.length, 6);
console.log("✓ bundle creates from ProjectState");

const missingReport = analyzeDaosMeaningLoss(baseState);
assert.ok(missingReport.missingSpecs.includes("commercialSpec"));
assert.ok(missingReport.missingSpecs.includes("renderBlueprint"));
console.log("✓ meaningLossReport finds missing specs");

const lowConfidenceCommercial = makeSpec<CommercialSpec>({
  id: "commercial-low",
  mainMessage: "Buy now",
  usp: ["fast delivery"],
  buyerPainPoints: [],
  trustDrivers: [],
  hierarchy: [],
  confidence: { score: 0.4, reason: "partial" },
});

const lowState = updateProjectState(baseState, { commercialSpec: lowConfidenceCommercial });
const lowReport = analyzeDaosMeaningLoss(lowState);
assert.ok(lowReport.lowConfidenceSpecs.includes("commercialSpec"));
assert.ok(lowReport.warnings.some((w) => w.code === "LOW_CONFIDENCE"));
console.log("✓ confidence warning works");

const commercial = makeSpec<CommercialSpec>({
  id: "commercial-1",
  mainMessage: "Premium drill",
  usp: ["titanium gearbox", "professional torque"],
  buyerPainPoints: [],
  trustDrivers: [],
  hierarchy: [],
  confidence: { score: 0.9 },
});

const creative = makeSpec<CreativeSpec>({
  id: "creative-1",
  concept: "Unrelated summer picnic",
  visualHook: "beach sunset",
  mood: "relaxed",
  confidence: { score: 0.9 },
});

const lossState = updateProjectState(baseState, { commercialSpec: commercial, creativeSpec: creative });
const lossReport = analyzeDaosMeaningLoss(lossState);
assert.ok(lossReport.commercialToCreativeLoss.length > 0);
console.log("✓ commercialToCreativeLoss detects word mismatch");

const badRender = makeSpec<RenderBlueprint>({
  id: "render-bad",
  renderStrategy: "hybrid_shadow_scene",
  promptAllowedOnlyInAdapter: false as unknown as true,
});

const criticalState = updateProjectState(baseState, { renderBlueprint: badRender });
const criticalReport = analyzeDaosMeaningLoss(criticalState);
assert.ok(criticalReport.renderPromptRisk.some((w) => w.severity === "critical"));
console.log("✓ renderPromptRisk critical when prompt contract violated");

async function runWriterTests() {
  const writeOk = await writeDaosDebugBundle(createDaosDebugBundle(baseState));
  assert.equal(writeOk.ok, true);
  if (writeOk.ok) {
    assert.ok(writeOk.path.endsWith("daos-debug-bundle.json"));
    assert.ok(writeOk.relativePath.includes(PROJECT_ID));
  }

  const writeFail = await writeDaosDebugBundle(createDaosDebugBundle(baseState), {
    baseDir: "/\0invalid-path",
  });
  assert.equal(writeFail.ok, false);
  if (!writeFail.ok) {
    assert.ok(writeFail.warning.includes("DAOS debug bundle write failed"));
  }
  console.log("✓ writer does not throw on errors");
}

runWriterTests()
  .then(() => {
    console.log("\nDAOS Wave 3 debug-bundle: all tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

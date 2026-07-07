/**
 * DAOS Wave 4 — render debug bridge tests
 * Run: npx tsx src/lib/daos/tests/render-debug-bridge.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState, updateProjectState } from "../core/project-state";
import { createDaosDebugBundle } from "../debug/daos-debug-bundle";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import { extractDaosRenderDebug } from "../debug/render-debug-bridge";
import type { RenderBlueprint } from "../contracts/specs";

const PROJECT_ID = "proj-wave4";

const emptyArtifact = extractDaosRenderDebug(null);
assert.ok(emptyArtifact.createdAt);
assert.equal(emptyArtifact.finalPrompt, undefined);
console.log("✓ empty input does not throw");

const nested = extractDaosRenderDebug({
  renderEngineResult: {
    backgroundSource: "provider",
    request: { providerId: "pollinations", modelId: "flux", profileId: "industrial" },
    selectedAttempt: {
      providerId: "pollinations",
      modelId: "flux",
      result: {
        providerId: "pollinations",
        modelId: "flux",
        latencyMs: 1200,
        compiled: {
          model: "flux",
          prompt: "A".repeat(200),
          negativePrompt: "text, watermark",
          modulesIgnored: ["layout_coordinates", "hero_zone"],
          modulesUsed: ["scene", "lighting"],
          width: 1024,
          height: 1024,
        },
      },
    },
  },
});

assert.equal(nested.provider, "pollinations");
assert.equal(nested.model, "flux");
assert.equal(nested.finalPrompt?.length, 200);
assert.equal(nested.promptLength, 200);
assert.equal(nested.modulesIgnored?.length, 2);
assert.ok(nested.renderRequestSummary);
assert.ok(nested.providerPayloadSummary);
console.log("✓ finalPrompt extracted from nested object");

assert.equal(nested.modulesIgnored?.includes("layout_coordinates"), true);
console.log("✓ modulesIgnored counted");

const fallbackArtifact = extractDaosRenderDebug({
  backgroundSource: "fallback",
  renderEngineResult: {
    attempts: [{ error: "provider timeout" }],
    request: { providerId: "pollinations" },
  },
});
assert.equal(fallbackArtifact.fallbackUsed, true);
assert.ok(fallbackArtifact.fallbackReason);
console.log("✓ fallbackUsed detected");

const renderBlueprint = {
  id: "rb-1",
  projectId: PROJECT_ID,
  version: 1,
  status: "validated" as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  source: "test",
  renderStrategy: "hybrid_shadow_scene" as const,
  provider: "pollinations",
  promptAllowedOnlyInAdapter: true as const,
  decisionTrace: [
    {
      id: "t1",
      source: "test",
      decision: "adapt",
      reason: "test",
      confidence: 0.9,
      createdAt: new Date().toISOString(),
    },
  ],
} satisfies RenderBlueprint;

const state = updateProjectState(createProjectState({ projectId: PROJECT_ID, runId: "run-1" }), {
  renderBlueprint,
});

const missingPromptReport = analyzeDaosMeaningLoss(state, {
  renderDebug: { createdAt: new Date().toISOString() },
});
assert.ok(missingPromptReport.renderDebugLoss.some((w) => w.code === "PROMPT_MISSING"));
console.log("✓ meaning-loss catches PROMPT_MISSING");

const modulesReport = analyzeDaosMeaningLoss(state, {
  renderDebug: {
    createdAt: new Date().toISOString(),
    provider: "pollinations",
    finalPrompt: "x".repeat(150),
    promptLength: 150,
    modulesIgnored: ["layout_coordinates"],
  },
});
assert.ok(modulesReport.renderDebugLoss.some((w) => w.code === "MODULES_IGNORED"));
console.log("✓ meaning-loss catches MODULES_IGNORED");

const fallbackReport = analyzeDaosMeaningLoss(state, {
  renderDebug: {
    createdAt: new Date().toISOString(),
    provider: "pollinations",
    finalPrompt: "x".repeat(150),
    promptLength: 150,
    fallbackUsed: true,
    fallbackReason: "pipeline backgroundSource=fallback",
  },
});
assert.ok(fallbackReport.renderDebugLoss.some((w) => w.code === "FALLBACK_USED"));
console.log("✓ meaning-loss catches FALLBACK_USED");

const bundle = createDaosDebugBundle(state, {
  renderDebug: {
    createdAt: new Date().toISOString(),
    provider: "pollinations",
    finalPrompt: "x".repeat(150),
    promptLength: 150,
    modulesIgnored: ["layout_coordinates"],
  },
});
assert.ok(bundle.renderDebug);
assert.equal(bundle.diagnostics.promptCaptured, true);
assert.equal(bundle.diagnostics.modulesIgnoredCount, 1);
console.log("✓ bundle includes renderDebug section");

console.log("\nDAOS Wave 4 render-debug-bridge: all tests passed");

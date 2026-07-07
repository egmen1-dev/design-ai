/**
 * DAOS Wave 5 — generation mode tests
 * Run: npx tsx src/lib/daos/tests/generation-mode.test.ts
 */
import assert from "node:assert/strict";
import { updateProjectState } from "../core/project-state";
import { createLegacyDAOSState } from "../adapters/legacy-generation-adapter";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import {
  getDaosGenerationPolicy,
  resolveDaosGenerationMode,
} from "../config/generation-mode";
import type { RenderBlueprint } from "../contracts/specs";

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => void,
): void {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

withEnv({ DAOS_GENERATION_MODE: "premium", FAST_GENERATION: "1" }, () => {
  assert.equal(resolveDaosGenerationMode(), "premium");
});
console.log("✓ DAOS_GENERATION_MODE=premium wins over FAST_GENERATION");

withEnv({ DAOS_GENERATION_MODE: undefined, FAST_GENERATION: "0" }, () => {
  assert.equal(resolveDaosGenerationMode(), "premium");
});
console.log("✓ FAST_GENERATION=0 maps to premium");

withEnv({ DAOS_GENERATION_MODE: undefined, FAST_GENERATION: undefined }, () => {
  assert.equal(resolveDaosGenerationMode(), "balanced");
});
console.log("✓ default without env maps to balanced");

const premiumPolicy = getDaosGenerationPolicy("premium");
assert.equal(premiumPolicy.allowFastShortcuts, false);
assert.equal(premiumPolicy.requireRenderDebug, true);
assert.equal(premiumPolicy.enableVisionRequired, true);
console.log("✓ premium policy disables fast shortcuts");

const draftPolicy = getDaosGenerationPolicy("draft");
assert.equal(draftPolicy.allowFastShortcuts, true);
assert.equal(draftPolicy.maxRetries, 1);
console.log("✓ draft policy allows fast shortcuts");

const renderBlueprint = {
  id: "rb-premium",
  projectId: "proj",
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

const premiumState = updateProjectState(
  createLegacyDAOSState({ prompt: "premium test", generationMode: "premium" }),
  { renderBlueprint },
);

const premiumMissingPrompt = analyzeDaosMeaningLoss(premiumState, {
  generationMode: "premium",
  renderDebug: { createdAt: new Date().toISOString(), provider: "pollinations" },
});
assert.ok(
  premiumMissingPrompt.renderDebugLoss.some(
    (w) => w.code === "PROMPT_MISSING" && w.severity === "critical",
  ),
);

const premiumFallback = analyzeDaosMeaningLoss(premiumState, {
  generationMode: "premium",
  renderDebug: {
    createdAt: new Date().toISOString(),
    provider: "pollinations",
    finalPrompt: "x".repeat(150),
    promptLength: 150,
    fallbackUsed: true,
  },
});
assert.ok(
  premiumFallback.renderDebugLoss.some(
    (w) => w.code === "FALLBACK_USED" && w.severity === "critical",
  ),
);
console.log("✓ premium escalates PROMPT_MISSING and FALLBACK_USED to critical");

console.log("\nDAOS Wave 5 generation-mode: all tests passed");

/**
 * DAOS Wave 36 — GenerationContext build tests
 * Run: npx tsx src/lib/daos/tests/generation-context-build.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState } from "../core/project-state";
import { getDaosGenerationPolicy } from "../config/generation-mode";
import { createDaosDebugBundle } from "../debug/daos-debug-bundle";
import {
  buildGenerationContext,
  computeGenerationContextCompleteness,
  isDaosGenerationContextEnabled,
  resolveGenerationContextOperatingMode,
  serializeGenerationContextSnapshot,
  type GenerationContextBuildInput,
} from "../generation-context";

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
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

function baseInput(overrides?: Partial<GenerationContextBuildInput>): GenerationContextBuildInput {
  return {
    projectId: "proj-wave36",
    runId: "run-wave36",
    createdAt: "2026-07-08T10:30:00.000Z",
    productAnalysis: {
      category: "power_tools",
      title: "Drill",
      aspectRatio: 1.2,
    },
    layout: "marketplace",
    knowledgeCategory: "tools",
    genomeKey: "genome-drill",
    marketIntelligenceActive: true,
    generationMode: "balanced",
    generationPolicy: getDaosGenerationPolicy("balanced"),
    productImage: "/uploads/product.png",
    finalImagePath: "/generated/final.png",
    backgroundUrl: "/backgrounds/bg.png",
    backgroundSource: "provider",
    aiSource: "sd",
    renderProvider: "pollinations",
    pipelineContextCompleteness: 80,
    ...overrides,
  };
}

const context = buildGenerationContext(baseInput());

assert.equal(context.metadata.projectId, "proj-wave36");
assert.equal(context.metadata.runId, "run-wave36");
assert.equal(context.metadata.generationId, "proj-wave36:run-wave36");
assert.equal(context.product.analysisCategory, "power_tools");
assert.equal(context.generationMode.mode, "balanced");
assert.equal(context.marketplace.layout, "marketplace");
assert.equal(context.marketplace.intelligenceActive, true);
console.log("✓ creates context with metadata/product/mode");

withEnv({ DAOS_OPERATING_MODE: undefined }, () => {
  const mode = resolveGenerationContextOperatingMode();
  assert.equal(mode.mode, "production");
  assert.deepEqual(mode.explorationFlags, []);
});
assert.equal(context.operatingMode.mode, "production");
console.log("✓ default operatingMode=production");

withEnv({ DAOS_OPERATING_MODE: "exploration" }, () => {
  const mode = resolveGenerationContextOperatingMode();
  assert.equal(mode.mode, "exploration");
  assert.ok(mode.explorationFlags.includes("DAOS_OPERATING_MODE=exploration"));
  const explorationContext = buildGenerationContext(baseInput());
  assert.equal(explorationContext.operatingMode.mode, "exploration");
});
console.log("✓ DAOS_OPERATING_MODE=exploration works");

withEnv({ DAOS_OPERATING_MODE: "staging" }, () => {
  const mode = resolveGenerationContextOperatingMode();
  assert.equal(mode.mode, "production");
  assert.ok(mode.warnings.some((warning) => warning.includes("Unknown DAOS_OPERATING_MODE")));
  const warnedContext = buildGenerationContext(baseInput());
  assert.equal(warnedContext.operatingMode.mode, "production");
  assert.ok(warnedContext.operatingMode.warnings.length > 0);
});
console.log("✓ unknown mode fallback production + warning");

const incomplete = buildGenerationContext(
  baseInput({
    productAnalysis: undefined,
    layout: undefined,
    generationMode: undefined as unknown as GenerationContextBuildInput["generationMode"],
  }),
);
assert.ok(incomplete.diagnostics.missingFields.length > 0);
assert.ok(incomplete.diagnostics.completenessScore < 100);
const completeness = computeGenerationContextCompleteness(incomplete);
assert.equal(completeness.missingFields.length, incomplete.diagnostics.missingFields.length);
console.log("✓ completeness detects missing fields");

const mutableInput = baseInput();
const frozen = buildGenerationContext(mutableInput);
mutableInput.projectId = "mutated";
assert.equal(frozen.metadata.projectId, "proj-wave36");
assert.ok(Object.isFrozen(frozen));
assert.ok(Object.isFrozen(frozen.metadata));
console.log("✓ input is not mutated / context is frozen");

const snapshot = serializeGenerationContextSnapshot(context);
assert.equal(typeof JSON.stringify(snapshot), "string");
assert.equal(snapshot.metadata.generationId, context.metadata.generationId);
const dataUrlSnapshot = serializeGenerationContextSnapshot(
  buildGenerationContext(baseInput({ productImage: "data:image/png;base64,abc" })),
);
assert.equal(dataUrlSnapshot.assets.productImageInput, "[data-url:omitted]");
console.log("✓ snapshot serializable without raw image data");

withEnv({ DAOS_GENERATION_CONTEXT: "0" }, () => {
  assert.equal(isDaosGenerationContextEnabled(), false);
});
withEnv({ DAOS_GENERATION_CONTEXT: undefined }, () => {
  assert.equal(isDaosGenerationContextEnabled(), false);
});
console.log("✓ flag off keeps generation context disabled");

assert.equal(context.diagnostics.completenessScore, 100);
assert.equal(context.diagnostics.missingFields.length, 0);
assert.equal(context.product.verified, true);
assert.equal(context.diagnostics.pipelineContextCompleteness, 80);
console.log("✓ full context completeness is 100");

const state = createProjectState({ projectId: "proj-wave36", runId: "run-wave36" });
const bundleWithout = createDaosDebugBundle(state);
assert.equal(bundleWithout.generationContext, undefined);
assert.equal(bundleWithout.diagnostics.generationContextCreated, undefined);

const bundleWith = createDaosDebugBundle(state, { generationContext: snapshot });
assert.ok(bundleWith.generationContext);
assert.equal(bundleWith.diagnostics.generationContextCreated, true);
assert.equal(bundleWith.diagnostics.generationContextCompleteness, 100);
assert.ok(bundleWith.diagnostics.generationContextPath?.includes("generation-context.json"));
console.log("✓ debug bundle attaches generationContext additively");

console.log("\nDAOS Wave 36 generation-context: all tests passed");

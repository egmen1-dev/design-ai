import assert from "node:assert/strict";
import {
  RenderPipeline,
  RenderPipelineError,
  compileFluxAdapterOutput,
  createEmptyRenderBlueprint,
  ConstitutionV18Error,
  FluxRenderAdapter,
  GptImageRenderAdapter,
  extractRenderIntent,
  validateCompiledPrompt,
  validateNegativePrompt,
  compileNegativePrompt,
  negotiateCapabilities,
  BlueprintLifecycle,
  frozenTestBlueprint,
} from "./index";

function testBlueprintHasNoPrompt() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
  assert.equal((bp as { prompt?: string }).prompt, undefined);
  assert.equal((bp.render as { compiledPrompt?: string }).compiledPrompt, undefined);
  console.log("✔ RenderBlueprint contains no prompt");
}

function testCompileBlockedWhenNotFrozen() {
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "x" });
  assert.throws(() => compileFluxAdapterOutput(bp), ConstitutionV18Error);
  console.log("✔ compile blocked when lifecycle not FROZEN");
}

function testFluxCompileProducesPhotographicPrompt() {
  const bp = frozenTestBlueprint();
  const out = compileFluxAdapterOutput(bp);
  assert.ok(out.prompt.length > 40);
  assert.ok(out.prompt.includes("kitchen") || out.prompt.includes("Kitchen"));
  assert.ok(!/\bctr\b/i.test(out.prompt));
  assert.ok(!/\bhero coverage\b/i.test(out.prompt));
  assert.ok(out.negativePrompt.includes("text"));
  assert.equal(out.generator, "flux");
  console.log("✔ flux adapter compiles photographic prompt");
}

function testGptImageNoNegativePrompt() {
  const bp = frozenTestBlueprint();
  bp.meta.generator = "gpt-image";
  const adapter = new GptImageRenderAdapter();
  const req = adapter.compile(bp);
  assert.equal(req.negativePrompt, "");
  assert.equal(req.cfg, 0);
  assert.equal(req.steps, 0);
  assert.ok(req.prompt.length > 50);
  console.log("✔ gpt-image adapter excludes negative prompt and cfg");
}

function testCapabilityNegotiationExcludesInternalFields() {
  const intent = extractRenderIntent(frozenTestBlueprint());
  const { negotiated } = negotiateCapabilities(intent, "flux");
  assert.ok(negotiated.excluded.includes("coordinates"));
  console.log("✔ capability negotiation excludes provider-internal fields");
}

function testNegativePromptContract() {
  const bp = frozenTestBlueprint();
  const neg = compileNegativePrompt(bp);
  const validation = validateNegativePrompt(neg);
  assert.equal(validation.ok, true);
  const bad = validateNegativePrompt("improve CTR, make composition cleaner");
  assert.equal(bad.ok, false);
  console.log("✔ negative prompt follows contract");
}

function testPromptValidationRejectsBannedTerms() {
  const result = validateCompiledPrompt("beautiful kitchen with hero coverage and CTR boost");
  assert.equal(result.ok, false);
  console.log("✔ banned Design AI terms rejected in prompt");
}

function testRenderIntentUniversal() {
  const bp = frozenTestBlueprint();
  const intent = extractRenderIntent(bp);
  assert.equal(intent.scene.environment, "kitchen");
  assert.equal(intent.camera.lens, 50);
  assert.ok(intent.mood);
  console.log("✔ render intent extracted without prompt");
}

async function testFallbackChain() {
  const bp = frozenTestBlueprint();
  let call = 0;
  const pipeline = new RenderPipeline({
    renderFn: async (req) => {
      call += 1;
      if (req.provider === "flux") {
        return {
          success: false,
          image: "",
          provider: req.provider,
          seed: req.seed,
          metadata: {
            provider: req.provider,
            model: "flux",
            seed: req.seed,
            seedSupported: true,
            generationTimeMs: 10,
            promptTokens: 50,
            adapterVersion: "3.11.0",
          },
        };
      }
      return {
        success: true,
        image: "base64mock",
        provider: req.provider,
        seed: req.seed,
        metadata: {
          provider: req.provider,
          model: req.provider,
          seed: req.seed,
          seedSupported: true,
          generationTimeMs: 20,
          promptTokens: 60,
          adapterVersion: "3.11.0",
        },
      };
    },
  });
  const result = await pipeline.renderWithFallback(bp, "flux");
  assert.ok(call >= 2);
  assert.notEqual(result.provider, "flux");
  assert.equal(result.response?.success, true);
  console.log("✔ provider fallback chain works without changing blueprint");
}

function testAdapterNeverMutatesBlueprint() {
  const bp = frozenTestBlueprint();
  const frozen = structuredClone(bp);
  compileFluxAdapterOutput(bp);
  assert.deepEqual(frozen.meta.revision, bp.meta.revision);
  assert.deepEqual(frozen.scene, bp.scene);
  console.log("✔ render adapter never mutates blueprint");
}

function testDeterministicCompile() {
  const bp = frozenTestBlueprint();
  const a = compileFluxAdapterOutput(bp);
  const b = compileFluxAdapterOutput(bp);
  assert.equal(a.prompt, b.prompt);
  assert.equal(a.negativePrompt, b.negativePrompt);
  console.log("✔ compile is deterministic for same blueprint");
}

async function run() {
  testBlueprintHasNoPrompt();
  testCompileBlockedWhenNotFrozen();
  testFluxCompileProducesPhotographicPrompt();
  testGptImageNoNegativePrompt();
  testCapabilityNegotiationExcludesInternalFields();
  testNegativePromptContract();
  testPromptValidationRejectsBannedTerms();
  testRenderIntentUniversal();
  await testFallbackChain();
  testAdapterNeverMutatesBlueprint();
  testDeterministicCompile();
}

run().then(() => {
  console.log("\nAll render pipeline Chapter 3.11 specs passed.");
});

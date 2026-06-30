/**
 * DESIGN AI v18 — Provider Independence tests (Chapter 4.25)
 */
import assert from "node:assert/strict";
import {
  PROVIDER_INDEPENDENCE_GOLDEN_RULE,
  PROVIDER_INDEPENDENCE_VERSION,
  PROVIDER_ARCHITECTURE_STACK,
  buildCapabilityProfile,
  validateBlueprintAsSourceOfTruth,
  validateNoProviderVocabularyInAgents,
  validateSemanticIndependence,
  compileAcrossProviders,
  benchmarkProviders,
  validateAdapterIsolation,
  buildExplainabilityChain,
  validateProviderIndependence,
  runProviderIndependence,
  providerMigrationRequiresAdapterOnly,
  isProviderIndependenceFailure,
  LightingStyle,
  StoryType,
  SceneType,
  EnvironmentType,
  frozenTestBlueprint,
  BlueprintLifecycle,
} from "./index";

function independentBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.photography.photographyStyle = "premium_hero";
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  return bp;
}

function testGoldenRule() {
  assert.ok(PROVIDER_INDEPENDENCE_GOLDEN_RULE.includes("not prompts"));
  assert.equal(PROVIDER_INDEPENDENCE_VERSION, "4.25.0");
  console.log("✔ golden rule — blueprint is truth, prompt is temporary translation");
}

function testArchitectureStack() {
  assert.deepEqual(PROVIDER_ARCHITECTURE_STACK, [
    "creative-directors",
    "technical-directors",
    "render-blueprint",
    "render-adapter",
    "provider",
  ]);
  console.log("✔ architecture — agents → blueprint → adapter → provider");
}

function testBlueprintHasNoPrompt() {
  const bp = independentBlueprint();
  const violations = validateBlueprintAsSourceOfTruth(bp);
  assert.equal(violations.length, 0);
  console.log("✔ render blueprint is source of truth — no stored prompt");
}

function testProviderVocabularyBannedInAgents() {
  const bp = independentBlueprint();
  const violations = validateNoProviderVocabularyInAgents(bp, {
    agentOutputs: [
      {
        agentId: "visual-story-director",
        texts: ["8k hyper realistic masterpiece award winning product photo"],
      },
    ],
  });
  assert.ok(violations.some((v) => v.code === "PROVIDER_VOCABULARY_IN_AGENT"));
  console.log("✔ creative agents cannot use provider prompt vocabulary");
}

function testFluxVocabularyBanned() {
  const bp = independentBlueprint();
  bp.story.narrative = "flux photorealistic 8k render";
  const violations = validateNoProviderVocabularyInAgents(bp);
  assert.ok(violations.length >= 1);
  console.log("✔ flux-specific vocabulary forbidden in blueprint sections");
}

function testMultiProviderCompile() {
  const bp = independentBlueprint();
  const results = compileAcrossProviders(bp, ["flux", "gpt-image", "imagen"]);
  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.success));
  assert.equal(new Set(results.map((r) => r.blueprintChecksum)).size, 1);
  console.log("✔ one blueprint compiles for flux, gpt-image, and imagen");
}

function testBlueprintUnchangedAfterCompile() {
  const bp = independentBlueprint();
  const frozen = structuredClone(bp);
  compileAcrossProviders(bp);
  assert.deepEqual(frozen, bp);
  console.log("✔ adapter compilation never mutates blueprint");
}

function testCapabilityProfilesDiffer() {
  const flux = buildCapabilityProfile("flux");
  const gpt = buildCapabilityProfile("gpt-image");
  assert.equal(flux.supportsNegativePrompt, true);
  assert.equal(gpt.supportsNegativePrompt, false);
  assert.notEqual(flux.maxPromptLength, gpt.maxPromptLength);
  console.log("✔ each provider has isolated capability profile for adapter only");
}

function testSemanticLightingPreserved() {
  const bp = independentBlueprint();
  const violations = validateSemanticIndependence(bp, ["flux", "gpt-image"]);
  assert.equal(violations.length, 0);
  console.log("✔ soft luxury lighting semantics preserved across providers");
}

function testProviderBenchmark() {
  const bp = independentBlueprint();
  const benchmark = benchmarkProviders(bp, ["flux", "gpt-image", "imagen"]);
  assert.equal(benchmark.length, 3);
  assert.ok(benchmark.every((b) => b.score >= 0 && b.score <= 100));
  assert.ok(benchmark.every((b) => b.compileSuccess));
  console.log("✔ provider benchmarking scores compile without changing blueprint");
}

function testExplainabilityChain() {
  const bp = independentBlueprint();
  bp.meta.audit = [{ agentId: "scene-director", section: "scene", action: "set", at: Date.now() }];
  const chain = buildExplainabilityChain(bp);
  assert.equal(chain.renderIntent, true);
  assert.equal(chain.blueprint, true);
  assert.equal(chain.agentDecisions, true);
  assert.equal(chain.providerIsExecutorOnly, true);
  console.log("✔ explainability chain — image → intent → blueprint → agent decisions");
}

function testProviderIndependenceReport() {
  const bp = independentBlueprint();
  const report = validateProviderIndependence(bp);
  assert.equal(report.independent, true);
  assert.equal(report.blueprintUnchanged, true);
  assert.equal(report.violations.length, 0);
  assert.ok(report.capabilityProfiles.length >= 3);
  console.log("✔ provider independence report passes for coherent blueprint");
}

function testMigrationAdapterOnly() {
  assert.equal(providerMigrationRequiresAdapterOnly("flux", "gpt-image"), true);
  assert.equal(providerMigrationRequiresAdapterOnly("flux", "flux"), false);
  console.log("✔ provider migration requires only new adapter and capability profile");
}

function testAdapterIsolationValidation() {
  const bp = independentBlueprint();
  const mutated = structuredClone(bp);
  mutated.story.hook = "changed by adapter";
  const violations = validateAdapterIsolation(bp, mutated);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "BLUEPRINT_MUTATED_BY_ADAPTER");
  console.log("✔ adapter isolation detects blueprint mutation");
}

function testRunProviderIndependence() {
  const report = runProviderIndependence({ blueprint: independentBlueprint() });
  assert.equal(report.independent, true);
  console.log("✔ runProviderIndependence entry point works");
}

function testFailureCodes() {
  assert.equal(isProviderIndependenceFailure("PROMPT_AS_SOURCE_OF_TRUTH"), true);
  assert.equal(isProviderIndependenceFailure("UNKNOWN"), false);
  console.log("✔ provider independence failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testArchitectureStack();
  testBlueprintHasNoPrompt();
  testProviderVocabularyBannedInAgents();
  testFluxVocabularyBanned();
  testMultiProviderCompile();
  testBlueprintUnchangedAfterCompile();
  testCapabilityProfilesDiffer();
  testSemanticLightingPreserved();
  testProviderBenchmark();
  testExplainabilityChain();
  testProviderIndependenceReport();
  testMigrationAdapterOnly();
  testAdapterIsolationValidation();
  testRunProviderIndependence();
  testFailureCodes();
  console.log("\nprovider-independence.spec.ts — all passed");
}

run();

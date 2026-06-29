/**
 * DESIGN AI v18 — Testing Architecture tests (Chapter 3.17)
 */

import assert from "node:assert/strict";
import {
  V18_TEST_REGISTRY,
  TestCategory,
  GOLDEN_DATASET,
  MockLLMProvider,
  deterministicMockKey,
  RegressionStore,
  createEmptyRenderBlueprint,
  captureBlueprintBaseline,
  testBlueprintAgentContract,
  testRenderAdapterContract,
  FluxRenderAdapter,
  storyDirectorAgent,
  runAllChaosScenarios,
  assertChaosRecoveryOrThrow,
  buildDeterministicContext,
  assertDeterministic,
  specsWithoutLlm,
  prRequiredCategories,
  COVERAGE_TARGETS,
  RELEASE_QUALITY_GATES,
  simulateStressConcurrency,
  visionScoreFromBlueprint,
  formatTestReport,
  runCategory,
} from "./index";

function testRegistryCategories() {
  assert.ok(V18_TEST_REGISTRY.length >= 19);
  assert.ok(V18_TEST_REGISTRY.every((e) => !e.usesLlm));
  const cats = new Set(V18_TEST_REGISTRY.map((e) => e.category));
  assert.ok(cats.has(TestCategory.UNIT));
  assert.ok(cats.has(TestCategory.BLUEPRINT));
  assert.ok(cats.has(TestCategory.PIPELINE));
  console.log("✔ test registry maps specs to categories without LLM");
}

function testGoldenDataset() {
  assert.equal(GOLDEN_DATASET.length, 7);
  assert.ok(GOLDEN_DATASET.some((p) => p.id === "coffee-machine"));
  console.log("✔ golden dataset contains etalon products");
}

function testMockLlmDeterministic() {
  const mock = new MockLLMProvider();
  const key = deterministicMockKey(42, "story-director", "abc");
  mock.register(key, { text: '{"hook":"test"}', confidence: 90, tokens: 10 });
  const r1 = mock.complete(key);
  const r2 = mock.complete(key);
  assert.deepEqual(r1, r2);
  console.log("✔ mock LLM returns deterministic responses");
}

function testRegressionStore() {
  const store = new RegressionStore();
  const bp = createEmptyRenderBlueprint({ seed: 10, category: "electronics" });
  const baseline = captureBlueprintBaseline("speaker", bp, {
    designScore: 85,
    visionScore: 80,
    retryCount: 0,
  });
  store.setBaseline(baseline);
  const ok = store.compare({
    productId: "speaker",
    blueprint: bp,
    designScore: 86,
    visionScore: 82,
    retryCount: 0,
  });
  assert.equal(ok.passed, true);
  const bad = store.compare({
    productId: "speaker",
    blueprint: bp,
    designScore: 70,
    visionScore: 60,
    retryCount: 5,
  });
  assert.equal(bad.passed, false);
  console.log("✔ regression store detects quality regression");
}

function testAgentContract() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
  const result = testBlueprintAgentContract(storyDirectorAgent, bp);
  assert.equal(result.passed, true);
  console.log("✔ blueprint agent contract validated");
}

function testAdapterContract() {
  const adapter = new FluxRenderAdapter();
  const result = testRenderAdapterContract(adapter);
  assert.equal(result.passed, true);
  console.log("✔ render adapter contract validated");
}

function testChaosScenarios() {
  const results = runAllChaosScenarios();
  assert.equal(results.length, 5);
  assert.doesNotThrow(() => assertChaosRecoveryOrThrow());
  console.log("✔ chaos scenarios verify recovery behavior");
}

function testDeterministicContext() {
  const bp = createEmptyRenderBlueprint({ seed: 99, category: "garden" });
  const a = buildDeterministicContext({
    blueprint: bp,
    seed: 99,
    agentVersion: "1.0.0",
    mockProvider: "mock",
  });
  const b = buildDeterministicContext({
    blueprint: bp,
    seed: 99,
    agentVersion: "1.0.0",
    mockProvider: "mock",
  });
  assert.doesNotThrow(() => assertDeterministic(a, b));
  console.log("✔ deterministic test context is reproducible");
}

function testPrRequiredCategories() {
  const required = prRequiredCategories();
  assert.ok(required.includes(TestCategory.INTEGRATION));
  assert.ok(required.includes(TestCategory.PIPELINE));
  console.log("✔ PR quality gate categories defined");
}

function testCoverageTargets() {
  const core = COVERAGE_TARGETS.find((c) => c.component === "core");
  assert.ok(core && core.minimumPercent >= 95);
  console.log("✔ coverage targets meet chapter minimums");
}

function testReleaseGates() {
  assert.ok(RELEASE_QUALITY_GATES.length >= 7);
  assert.ok(RELEASE_QUALITY_GATES.every((g) => g.required));
  console.log("✔ release candidate quality gates defined");
}

function testStressSimulation() {
  const result = simulateStressConcurrency(100);
  assert.equal(result.passed, true);
  assert.equal(result.contextsCreated, 50);
  console.log("✔ stress simulation creates and releases isolated contexts");
}

function testVisionScoreIntegration() {
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "cosmetics" });
  const score = visionScoreFromBlueprint(bp);
  assert.ok(score > 0 && score <= 100);
  console.log("✔ vision score integrates with golden blueprint fixtures");
}

function testRunCategoryUnit() {
  const suite = runCategory(TestCategory.UNIT, process.cwd());
  assert.ok(suite.total > 0);
  assert.equal(suite.failed, 0, suite.results.filter((r) => !r.passed).map((r) => r.error).join("\n"));
  const report = {
    startedAt: Date.now(),
    finishedAt: Date.now(),
    durationMs: suite.durationMs,
    suites: [suite],
    passed: suite.passed,
    failed: suite.failed,
    total: suite.total,
    qualityGatePassed: suite.failed === 0,
  };
  assert.ok(formatTestReport(report).includes("Quality Gate"));
  console.log("✔ test runner executes unit category specs");
}

function testNoLlmInSpecs() {
  assert.equal(specsWithoutLlm().length, V18_TEST_REGISTRY.length);
  console.log("✔ all registered specs avoid live LLM");
}

function main() {
  testRegistryCategories();
  testGoldenDataset();
  testMockLlmDeterministic();
  testRegressionStore();
  testAgentContract();
  testAdapterContract();
  testChaosScenarios();
  testDeterministicContext();
  testPrRequiredCategories();
  testCoverageTargets();
  testReleaseGates();
  testStressSimulation();
  testVisionScoreIntegration();
  testRunCategoryUnit();
  testNoLlmInSpecs();
  console.log("\ntesting-architecture.spec.ts — all passed");
}

main();

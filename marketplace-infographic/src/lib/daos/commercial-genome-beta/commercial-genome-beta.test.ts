import assert from "node:assert/strict";
import {
  buildCommercialDecisionBeta,
  createCommercialGenomeBetaDecision,
  getCommercialGenomeBeta,
  isCommercialGenomeBetaEnabled,
  resolveCommercialRulesBeta,
  WILDBERRIES_HERO_RULES,
} from "./commercial-genome-beta";

function testGenomeContainsAtLeast30Rules() {
  const genome = getCommercialGenomeBeta();
  assert.ok(genome.ruleCount >= 30, `expected >= 30 rules, got ${genome.ruleCount}`);
  assert.equal(WILDBERRIES_HERO_RULES.length, genome.ruleCount);
  console.log("✔ genome contains at least 30 rules");
}

function testWbMarketplaceSelectsCoreRules() {
  const result = resolveCommercialRulesBeta({
    marketplace: "wildberries",
    category: "electronics",
    productTitle: "Test Product",
    mode: "generation",
  });

  const categories = new Set(result.selectedRules.map((r) => r.category));
  assert.ok(categories.has("hero"), "hero rules missing");
  assert.ok(categories.has("hierarchy"), "hierarchy rules missing");
  assert.ok(categories.has("psychology"), "psychology rules missing");
  assert.ok(result.antiRules.length >= 6, "anti rules missing");
  console.log("✔ WB marketplace selects hero/hierarchy/psychology rules");
}

function testYellowProductCoolNeutralContrast() {
  const result = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: "tools",
    productColor: "yellow",
    productTitle: "Жёлтый инструмент",
    mode: "generation",
  });
  assert.equal(result.decision.backgroundContrastDirection, "cool_neutral_separation");
  console.log("✔ yellow product creates cool/neutral contrast direction");
}

function testProfessionalToolIndustrialEnvironment() {
  const result = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: "professional tool",
    productType: "instrument",
    mode: "generation",
  });
  assert.equal(result.decision.environmentDirection, "clean_industrial_technical");
  console.log("✔ professional tool selects technical/industrial environment");
}

function testRefinementModeRuleOfOneChange() {
  const gen = resolveCommercialRulesBeta({
    marketplace: "wildberries",
    mode: "generation",
  });
  const ref = resolveCommercialRulesBeta({
    marketplace: "wildberries",
    mode: "refinement",
  });
  const genRefinement = gen.selectedRules.filter((r) => r.category === "refinement").length;
  const refRefinement = ref.selectedRules.filter((r) => r.category === "refinement").length;
  assert.equal(genRefinement, 0, "refinement rules should not apply in generation mode");
  assert.ok(refRefinement >= 4, "refinement rules expected in refinement mode");
  assert.ok(
    ref.selectedRules.some((r) => r.id === "WB-REF-004"),
    "Rule of One Change expected",
  );
  console.log("✔ refinement mode selects Rule of One Change");
}

function testAntiRulesAlwaysSelected() {
  const result = resolveCommercialRulesBeta({
    marketplace: "ozon",
    mode: "generation",
  });
  assert.equal(result.antiRules.length, 6);
  assert.ok(result.selectedRules.every((r) => r.category !== "anti_rule" || result.antiRules.includes(r)));
  console.log("✔ antiRules always selected");
}

function testBuildCommercialDecisionBetaDeterministic() {
  const input = {
    marketplace: "wildberries",
    category: "home",
    productTitle: "Пылесос",
    mode: "generation" as const,
  };
  const resolved = resolveCommercialRulesBeta(input);
  const a = buildCommercialDecisionBeta({
    selectedRules: resolved.selectedRules,
    antiRules: resolved.antiRules,
    resolveInput: input,
    decisionTrace: resolved.decisionTrace,
  });
  const b = buildCommercialDecisionBeta({
    selectedRules: resolved.selectedRules,
    antiRules: resolved.antiRules,
    resolveInput: input,
    decisionTrace: resolved.decisionTrace,
  });
  assert.deepEqual(a, b);
  console.log("✔ buildCommercialDecisionBeta returns deterministic result");
}

function testFlagOffDoesNotAffectLegacyPath() {
  const env = { DAOS_COMMERCIAL_GENOME_BETA: "0" } as NodeJS.ProcessEnv;
  assert.equal(isCommercialGenomeBetaEnabled(env), false);
  const envUnset = {} as NodeJS.ProcessEnv;
  assert.equal(isCommercialGenomeBetaEnabled(envUnset), false);
  console.log("✔ DAOS_COMMERCIAL_GENOME_BETA=0 does not affect legacy path");
}

function testExperimentalKnowledgeBaseSource() {
  const result = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: "garden",
    mode: "generation",
  });
  assert.ok(
    result.rules.selected.every((r) => r.source === "experimental_knowledge_base_v1"),
    "all selected rules should be from EKB v1",
  );
  assert.ok(
    (result.diagnostics.sourceBreakdown.experimental_knowledge_base_v1 ?? 0) > 0,
    "source breakdown should include experimental_knowledge_base_v1",
  );
  console.log("✔ selectedRules include Experimental Knowledge Base v1 source");
}

function main() {
  testGenomeContainsAtLeast30Rules();
  testWbMarketplaceSelectsCoreRules();
  testYellowProductCoolNeutralContrast();
  testProfessionalToolIndustrialEnvironment();
  testRefinementModeRuleOfOneChange();
  testAntiRulesAlwaysSelected();
  testBuildCommercialDecisionBetaDeterministic();
  const decision = buildCommercialDecisionBeta({
    selectedRules: [],
    antiRules: [],
    resolveInput: { marketplace: "wildberries" },
    decisionTrace: [],
  });
  assert.equal(decision.productAreaTarget, 0.42);
  assert.equal(decision.productAreaAspirationalTarget, 0.55);
  console.log("✔ reachable vs aspirational product area targets (Sprint 8C)");
  testFlagOffDoesNotAffectLegacyPath();
  testExperimentalKnowledgeBaseSource();
  console.log("==> commercial-genome-beta tests OK");
}

main();

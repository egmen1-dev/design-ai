/**
 * DESIGN AI v18 — Golden Rules of Design Knowledge tests (Chapter 5.20)
 */
import assert from "node:assert/strict";
import {
  DESIGN_KNOWLEDGE_GOLDEN_RULES_VERSION,
  FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE,
  DESIGN_KNOWLEDGE_ARCHITECTURE_STATEMENT,
  DESIGN_KNOWLEDGE_CONSTITUTION_RULES,
  DesignKnowledgeGoldenRuleId,
  getDesignKnowledgeGoldenRule,
  validateGoldenRuleKnowledgeBeforeGeneration,
  validateGoldenRuleKnowledgeIsIndependent,
  validateGoldenRuleEveryRuleNeedsEvidence,
  validateGoldenRuleEverythingMustBeExplainable,
  validateGoldenRuleKnowledgeNeverDisappears,
  validateGoldenRuleValidationBeforeUsage,
  validateGoldenRuleLearningNeverStops,
  validateGoldenRuleKnowledgeIsShared,
  validateGoldenRuleKnowledgeOverPrompt,
  validateGoldenRuleBusinessBeforeBeauty,
  validateGoldenRuleConsistencyBeforeCreativity,
  validateGoldenRulePatternAndAntiPatternTogether,
  validateGoldenRuleHumanKnowledgeComesFirst,
  validateGoldenRuleKnowledgeMustEvolveSafely,
  validateGoldenRuleKnowledgeIsTheCoreAsset,
  validateDesignKnowledgeGoldenRule,
  validateDesignKnowledgeConstitution,
  assertDesignKnowledgeConstitution,
  runDesignKnowledgeGoldenRules,
  isDesignKnowledgeGoldenRuleFailure,
} from "./index";

function testConstitutionCatalog() {
  assert.equal(DESIGN_KNOWLEDGE_CONSTITUTION_RULES.length, 15);
  assert.equal(DESIGN_KNOWLEDGE_GOLDEN_RULES_VERSION, "5.20.0");
  assert.ok(FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE.includes("true intelligence"));
  assert.ok(DESIGN_KNOWLEDGE_ARCHITECTURE_STATEMENT.includes("engineering knowledge base"));
  console.log("✔ constitution — 15 immutable golden rules defined");
}

function testFinalGoldenRule() {
  assert.ok(FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE.includes("Design Knowledge Engine"));
  assert.ok(FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE.includes("after every generation"));
  console.log("✔ final golden rule — knowledge is true intelligence of Design AI");
}

function testRule1KnowledgeBeforeGeneration() {
  const passed = validateGoldenRuleKnowledgeBeforeGeneration();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleKnowledgeBeforeGeneration({ agentDecisionWithoutKnowledge: true });
  assert.equal(failed.passed, false);
  assert.ok(failed.violations.some((v) => v.code === "LLM_INTUITION_OVERRIDE"));
  console.log("✔ rule 1 — knowledge before generation, no LLM intuition override");
}

function testRule2KnowledgeIsIndependent() {
  const passed = validateGoldenRuleKnowledgeIsIndependent();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleKnowledgeIsIndependent({ promptOnlyKnowledge: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 2 — knowledge independent of LLM, prompt, provider, marketplace");
}

function testRule3EveryRuleNeedsEvidence() {
  const result = validateGoldenRuleEveryRuleNeedsEvidence();
  assert.equal(result.passed, true);
  console.log("✔ rule 3 — every rule has provenance and evidence sources");
}

function testRule4EverythingMustBeExplainable() {
  const result = validateGoldenRuleEverythingMustBeExplainable();
  assert.equal(result.passed, true);
  console.log("✔ rule 4 — why, where, problem, proof required for all knowledge");
}

function testRule5KnowledgeNeverDisappears() {
  const passed = validateGoldenRuleKnowledgeNeverDisappears();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleKnowledgeNeverDisappears({ deletePublishedKnowledge: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 5 — published knowledge never deleted, history preserved");
}

function testRule6ValidationBeforeUsage() {
  const passed = validateGoldenRuleValidationBeforeUsage();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleValidationBeforeUsage({ skipValidation: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 6 — validation before any knowledge enters usage");
}

function testRule7LearningNeverStops() {
  const passed = validateGoldenRuleLearningNeverStops();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleLearningNeverStops({ stopLearning: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 7 — learning never stops, continuous evolution");
}

function testRule8KnowledgeIsShared() {
  const passed = validateGoldenRuleKnowledgeIsShared();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleKnowledgeIsShared({ localHiddenRules: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 8 — unified knowledge base for all agents");
}

function testRule9KnowledgeOverPrompt() {
  const passed = validateGoldenRuleKnowledgeOverPrompt();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleKnowledgeOverPrompt({ promptOnlyKnowledge: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 9 — prompt conveys decisions, never replaces knowledge");
}

function testRule10BusinessBeforeBeauty() {
  const passed = validateGoldenRuleBusinessBeforeBeauty();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleBusinessBeforeBeauty({ beautyWithoutBusiness: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 10 — commercial effectiveness before aesthetics alone");
}

function testRule11ConsistencyBeforeCreativity() {
  const passed = validateGoldenRuleConsistencyBeforeCreativity();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleConsistencyBeforeCreativity({ incompatibleCreativity: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 11 — creativity must remain architecturally consistent");
}

function testRule12PatternAndAntiPatternTogether() {
  const passed = validateGoldenRulePatternAndAntiPatternTogether();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRulePatternAndAntiPatternTogether({ patternsWithoutAntiPatterns: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 12 — patterns and anti-patterns maintained together");
}

function testRule13HumanKnowledgeComesFirst() {
  const passed = validateGoldenRuleHumanKnowledgeComesFirst();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleHumanKnowledgeComesFirst({ replaceExpertWithoutReview: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 13 — expert knowledge is foundation, learning enhances");
}

function testRule14KnowledgeMustEvolveSafely() {
  const passed = validateGoldenRuleKnowledgeMustEvolveSafely();
  assert.equal(passed.passed, true);
  const failed = validateGoldenRuleKnowledgeMustEvolveSafely({ unsafeEvolution: true });
  assert.equal(failed.passed, false);
  console.log("✔ rule 14 — verified, explainable, compatible, reversible evolution");
}

function testRule15KnowledgeIsTheCoreAsset() {
  const result = validateGoldenRuleKnowledgeIsTheCoreAsset();
  assert.equal(result.passed, true);
  console.log("✔ rule 15 — Design Knowledge Engine is primary intellectual asset");
}

function testValidateConstitution() {
  const report = validateDesignKnowledgeConstitution();
  assert.equal(report.valid, true);
  assert.equal(report.rulesPassed, 15);
  assert.equal(report.rulesTotal, 15);
  assert.equal(report.constitutionSatisfied, true);
  assert.equal(report.finalGoldenRuleSatisfied, true);
  assert.equal(report.architectureStatementValid, true);
  assertDesignKnowledgeConstitution();
  console.log("✔ full constitution — all 15 golden rules satisfied");
}

function testGetGoldenRule() {
  const rule = getDesignKnowledgeGoldenRule(DesignKnowledgeGoldenRuleId.KNOWLEDGE_BEFORE_GENERATION)!;
  assert.equal(rule.number, 1);
  assert.equal(rule.immutable, true);
  const check = validateDesignKnowledgeGoldenRule(DesignKnowledgeGoldenRuleId.KNOWLEDGE_BEFORE_GENERATION);
  assert.equal(check.passed, true);
  console.log("✔ individual rule lookup and validation works");
}

function testRunDesignKnowledgeGoldenRules() {
  const report = runDesignKnowledgeGoldenRules();
  assert.equal(report.valid, true);
  console.log("✔ runDesignKnowledgeGoldenRules entry point works");
}

function testFailureCodes() {
  assert.equal(isDesignKnowledgeGoldenRuleFailure("LLM_INTUITION_OVERRIDE"), true);
  assert.equal(isDesignKnowledgeGoldenRuleFailure("UNKNOWN"), false);
  console.log("✔ golden rule failure codes are catalogued");
}

function run() {
  testConstitutionCatalog();
  testFinalGoldenRule();
  testRule1KnowledgeBeforeGeneration();
  testRule2KnowledgeIsIndependent();
  testRule3EveryRuleNeedsEvidence();
  testRule4EverythingMustBeExplainable();
  testRule5KnowledgeNeverDisappears();
  testRule6ValidationBeforeUsage();
  testRule7LearningNeverStops();
  testRule8KnowledgeIsShared();
  testRule9KnowledgeOverPrompt();
  testRule10BusinessBeforeBeauty();
  testRule11ConsistencyBeforeCreativity();
  testRule12PatternAndAntiPatternTogether();
  testRule13HumanKnowledgeComesFirst();
  testRule14KnowledgeMustEvolveSafely();
  testRule15KnowledgeIsTheCoreAsset();
  testValidateConstitution();
  testGetGoldenRule();
  testRunDesignKnowledgeGoldenRules();
  testFailureCodes();
  console.log("\ndesign-knowledge-golden-rules.spec.ts — all passed");
}

run();

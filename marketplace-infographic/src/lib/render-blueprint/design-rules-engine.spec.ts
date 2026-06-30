/**
 * DESIGN AI v18 — Design Rules Engine tests (Chapter 5.6)
 */
import assert from "node:assert/strict";
import {
  DESIGN_RULES_ENGINE_VERSION,
  DESIGN_RULES_ENGINE_GOLDEN_RULE,
  RuleKind,
  RuleDomain,
  RULE_SCORE_WEIGHTS,
  SEED_DESIGN_RULES,
  RULES_ENGINE_AGENT_SCOPE,
  evaluateCondition,
  computeContextMatch,
  computeRuleScore,
  matchRule,
  matchRules,
  prioritizeRules,
  resolveRuleConflicts,
  composeRules,
  selectRulesForAgent,
  applyRuleLearningFeedback,
  buildDesignRuleCatalog,
  executeDesignRules,
  validateDesignRulesEngine,
  assertDesignRulesEngine,
  runDesignRulesEngine,
  isDesignRulesEngineFailure,
} from "./index";
import {
  MarketplaceImageContext,
  MarketplaceKnowledgeId,
  ProductCategoryKnowledge,
} from "./marketplace-knowledge-types";

function testGoldenRule() {
  assert.ok(DESIGN_RULES_ENGINE_GOLDEN_RULE.includes("what should be done right now"));
  assert.equal(DESIGN_RULES_ENGINE_VERSION, "5.6.0");
  console.log("✔ golden rule — knowledge vs actionable recommendations");
}

function testRuleStructure() {
  const sample = SEED_DESIGN_RULES[0];
  assert.ok(sample.id);
  assert.ok(sample.domain);
  assert.ok(sample.conditions.length > 0);
  assert.ok(sample.recommendation.reason);
  assert.ok(sample.sources.length > 0);
  assert.ok(sample.priority > 0);
  assert.ok(sample.confidence > 0);
  console.log("✔ design rule structure — conditions, recommendation, sources, priority");
}

function testMandatoryVsAdvisory() {
  const mandatory = SEED_DESIGN_RULES.filter((r) => r.kind === RuleKind.MANDATORY);
  const advisory = SEED_DESIGN_RULES.filter((r) => r.kind === RuleKind.ADVISORY);
  assert.ok(mandatory.length > 0);
  assert.ok(advisory.length > 0);
  console.log("✔ mandatory vs advisory rules — marketplace mandatory, lighting advisory");
}

function testContextMatching() {
  const ctx = {
    product: "Kitchen Knife",
    category: ProductCategoryKnowledge.KITCHEN,
    marketplace: MarketplaceKnowledgeId.AMAZON,
    audience: "Professional Chef",
    businessGoal: "Luxury",
  };
  const warmRule = SEED_DESIGN_RULES.find((r) => r.id === "luxury-kitchen-warm-lighting")!;
  const match = matchRule(warmRule, ctx);
  assert.equal(match.matched, true);
  assert.ok(match.contextMatch >= 50);
  console.log("✔ context matching — luxury kitchen warm lighting rule matches");
}

function testContextSensitivity() {
  const kitchen = matchRules(SEED_DESIGN_RULES, {
    category: ProductCategoryKnowledge.KITCHEN,
    businessGoal: "Luxury",
  });
  const electronics = matchRules(SEED_DESIGN_RULES, {
    category: ProductCategoryKnowledge.ELECTRONICS,
  });
  const kitchenIds = kitchen.map((m) => m.rule.id);
  const electronicsIds = electronics.map((m) => m.rule.id);
  assert.notDeepEqual(kitchenIds, electronicsIds);
  console.log("✔ context sensitivity — different categories produce different rules");
}

function testRuleScoring() {
  const rule = SEED_DESIGN_RULES.find((r) => r.id === "luxury-kitchen-warm-lighting")!;
  const contextMatch = 96;
  const score = computeRuleScore(rule, contextMatch);
  assert.ok(score >= 70);
  assert.equal(RULE_SCORE_WEIGHTS.priority, 0.4);
  assert.equal(RULE_SCORE_WEIGHTS.confidence, 0.3);
  assert.equal(RULE_SCORE_WEIGHTS.contextMatch, 0.2);
  assert.equal(RULE_SCORE_WEIGHTS.historicalSuccess, 0.1);
  console.log("✔ rule scoring — priority 40%, confidence 30%, context 20%, history 10%");
}

function testRulePrioritization() {
  const ctx = {
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    businessGoal: "Luxury",
  };
  const matches = matchRules(SEED_DESIGN_RULES, ctx);
  const prioritized = prioritizeRules(matches);
  assert.ok(prioritized[0].mandatory);
  console.log("✔ rule prioritization — mandatory rules precede advisory");
}

function testConflictResolution() {
  const ctx = {
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    businessGoal: "Luxury",
  };
  const result = selectRulesForAgent("composition-director", SEED_DESIGN_RULES, ctx);
  assert.ok(result.conflictsResolved.length > 0);
  assert.ok(result.recommendation.ruleIds.includes("marketplace-large-product"));
  console.log("✔ conflict resolution — marketplace large product wins over negative space");
}

function testRuleComposition() {
  const ctx = {
    category: ProductCategoryKnowledge.KITCHEN,
    businessGoal: "Luxury",
    marketplace: MarketplaceKnowledgeId.AMAZON,
  };
  const result = selectRulesForAgent("lighting-director", SEED_DESIGN_RULES, ctx);
  assert.ok(result.recommendation.actions.length >= 1);
  assert.ok(result.recommendation.summary.includes("+") || result.recommendation.actions.length === 1);
  assert.equal(result.recommendation.explainable, true);
  console.log("✔ rule composition — multiple rules merge into unified recommendation");
}

function testExplainability() {
  const ctx = { category: ProductCategoryKnowledge.BEAUTY };
  const result = selectRulesForAgent("lighting-director", SEED_DESIGN_RULES, ctx);
  assert.ok(result.recommendation.reasons.length > 0);
  assert.ok(result.recommendation.reasons.every((r) => r.length > 10));
  console.log("✔ explainability — every recommendation includes reason");
}

function testAgentScoping() {
  const ctx = { category: ProductCategoryKnowledge.ELECTRONICS };
  const lighting = selectRulesForAgent("lighting-director", buildDesignRuleCatalog(), ctx);
  const composition = selectRulesForAgent("composition-director", buildDesignRuleCatalog(), ctx);
  assert.notDeepEqual(
    lighting.recommendation.ruleIds,
    composition.recommendation.ruleIds,
  );
  console.log("✔ agent scoping — agents receive relevant subset, not full catalog");
}

function testAmazonMandatoryRule() {
  const ctx = {
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
  };
  const result = selectRulesForAgent("composition-director", SEED_DESIGN_RULES, ctx);
  assert.ok(result.mandatoryRules.some((r) => r.id === "amazon-main-white-background"));
  console.log("✔ mandatory rules — Amazon main image white background always applies");
}

function testStatelessExecution() {
  const ctx = { category: ProductCategoryKnowledge.SPORTS };
  const first = executeDesignRules({ context: ctx, agentIds: ["visual-story-director"] });
  const second = executeDesignRules({ context: ctx, agentIds: ["visual-story-director"] });
  assert.deepEqual(first, second);
  assert.equal(first.stateless, true);
  console.log("✔ stateless execution — identical inputs produce identical outputs");
}

function testRuleLearning() {
  const rule = SEED_DESIGN_RULES.find((r) => r.id === "luxury-kitchen-warm-lighting")!;
  const updated = applyRuleLearningFeedback([rule], [
    { ruleId: rule.id, commercialScore: 0.95, userRating: "positive" },
  ]);
  assert.ok((updated[0].historicalSuccess ?? 0) > (rule.historicalSuccess ?? 0));
  console.log("✔ rule learning — feedback adjusts confidence and historical success");
}

function testKnowledgeIntegration() {
  const catalog = buildDesignRuleCatalog();
  assert.ok(catalog.length > SEED_DESIGN_RULES.length);
  console.log("✔ knowledge integration — rules derived from Ch 5.1 knowledge objects");
}

function testIdenticalApplicationFails() {
  const report = validateDesignRulesEngine({ identicalApplication: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "ALL_RULES_APPLIED_IDENTICALLY"));
  console.log("✔ identical rule application is architecturally invalid");
}

function testValidateDesignRulesEngine() {
  const report = validateDesignRulesEngine();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.contextAware, true);
  assert.equal(report.conflictResolvable, true);
  assert.equal(report.explainable, true);
  assert.equal(report.stateless, true);
  console.log("✔ design rules engine validation passes");
}

function testRunDesignRulesEngine() {
  const report = runDesignRulesEngine({});
  assert.equal(report.valid, true);
  assertDesignRulesEngine();
  console.log("✔ runDesignRulesEngine entry point works");
}

function testFailureCodes() {
  assert.equal(isDesignRulesEngineFailure("UNEXPLAINABLE_RECOMMENDATION"), true);
  assert.equal(isDesignRulesEngineFailure("UNKNOWN"), false);
  console.log("✔ design rules engine failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testRuleStructure();
  testMandatoryVsAdvisory();
  testContextMatching();
  testContextSensitivity();
  testRuleScoring();
  testRulePrioritization();
  testConflictResolution();
  testRuleComposition();
  testExplainability();
  testAgentScoping();
  testAmazonMandatoryRule();
  testStatelessExecution();
  testRuleLearning();
  testKnowledgeIntegration();
  testIdenticalApplicationFails();
  testValidateDesignRulesEngine();
  testRunDesignRulesEngine();
  testFailureCodes();
  console.log("\ndesign-rules-engine.spec.ts — all passed");
}

run();

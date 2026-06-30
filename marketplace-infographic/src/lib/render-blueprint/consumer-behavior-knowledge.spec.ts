/**
 * DESIGN AI v18 — Consumer Behavior Knowledge tests (Chapter 5.13)
 */
import assert from "node:assert/strict";
import {
  CONSUMER_BEHAVIOR_KNOWLEDGE_VERSION,
  CONSUMER_BEHAVIOR_KNOWLEDGE_GOLDEN_RULE,
  MIN_TRUST_SCORE,
  MIN_PERCEIVED_VALUE,
  MAX_DECISION_TIME_MS,
  DECISION_JOURNEY_STEPS,
  RISK_REDUCTION_SIGNALS,
  SOCIAL_PROOF_SIGNALS,
  PURCHASE_MOTIVATION_GUIDANCE,
  BUYING_MODE_GUIDANCE,
  SEED_CONSUMER_BEHAVIOR_RULES,
  DecisionJourneyStage,
  PurchaseMotivation,
  BuyingMode,
  getConsumerBehaviorRule,
  getDecisionJourney,
  getRiskReductionSignals,
  getSocialProofSignals,
  matchConsumerBehaviorRules,
  recommendConsumerBehaviorRules,
  selectBuyingMode,
  selectPurchaseMotivation,
  estimateTrustScore,
  estimatePerceivedValue,
  validateRiskReduction,
  validateConsumerBehaviorBlueprint,
  applyConsumerBehaviorLearningFeedback,
  validateConsumerBehaviorKnowledge,
  assertConsumerBehaviorKnowledge,
  runConsumerBehaviorKnowledge,
  isConsumerBehaviorKnowledgeFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(CONSUMER_BEHAVIOR_KNOWLEDGE_GOLDEN_RULE.includes("I saw"));
  assert.equal(CONSUMER_BEHAVIOR_KNOWLEDGE_VERSION, "5.13.0");
  console.log("✔ golden rule — saw → understood → trust → open → buy");
}

function testRuleStructure() {
  const sample = SEED_CONSUMER_BEHAVIOR_RULES[0];
  assert.ok(sample.behavior);
  assert.ok(sample.trigger);
  assert.ok(sample.expectedReaction);
  assert.ok(sample.confidence > 0);
  assert.ok(sample.references.length > 0);
  console.log("✔ consumer behavior rule structure — behavior, trigger, expectedReaction, references");
}

function testDecisionJourney() {
  const journey = getDecisionJourney();
  assert.equal(journey.length, 6);
  assert.equal(journey[0].stage, DecisionJourneyStage.ATTENTION);
  assert.equal(journey[5].stage, DecisionJourneyStage.PURCHASE);
  assert.deepEqual(DECISION_JOURNEY_STEPS, journey);
  console.log("✔ decision journey — attention → interest → evaluation → trust → click → purchase");
}

function testAttentionStage() {
  const rule = getConsumerBehaviorRule("attention-stage-hook")!;
  assert.ok(rule.expectedReaction.includes("attention"));
  const missing = validateConsumerBehaviorBlueprint({ heroProductPresent: false });
  assert.ok(missing.violations.some((v) => v.code === "MISSING_ATTENTION_HOOK"));
  console.log("✔ attention stage — hero product wins scroll attention");
}

function testInterestStage() {
  const rules = matchConsumerBehaviorRules({ decisionStage: DecisionJourneyStage.INTEREST });
  assert.ok(rules.some((r) => r.id === "interest-stage-story"));
  const noBenefit = validateConsumerBehaviorBlueprint({ primaryBenefitPresent: false });
  assert.ok(noBenefit.violations.some((v) => v.code === "NO_INTEREST_SIGNAL"));
  console.log("✔ interest stage — primary benefit and visual story");
}

function testEvaluationStage() {
  const rules = matchConsumerBehaviorRules({ decisionStage: DecisionJourneyStage.EVALUATION });
  assert.ok(rules.some((r) => r.id === "evaluation-stage-compare"));
  const weak = validateConsumerBehaviorBlueprint({
    decisionStage: DecisionJourneyStage.EVALUATION,
    comparativeAdvantage: false,
    heroProductPresent: true,
    primaryBenefitPresent: true,
    visualCleanliness: true,
  });
  assert.ok(weak.violations.some((v) => v.code === "WEAK_EVALUATION_SUPPORT"));
  console.log("✔ evaluation stage — differentiation and quality comparison");
}

function testTrustFormation() {
  const rule = getConsumerBehaviorRule("trust-measurable-signals")!;
  assert.ok(rule.behavior.includes("Trust"));
  const lowTrust = validateConsumerBehaviorBlueprint({
    heroProductPresent: false,
    visualCleanliness: false,
    trustScore: 0.3,
  });
  assert.ok(lowTrust.violations.some((v) => v.code === "INSUFFICIENT_TRUST"));
  assert.equal(MIN_TRUST_SCORE, 0.6);
  console.log("✔ trust formation — measurable visual trust signals");
}

function testRiskReduction() {
  assert.equal(RISK_REDUCTION_SIGNALS.length, 5);
  assert.equal(validateRiskReduction(["usage_scenario", "material_quality"]), true);
  assert.equal(validateRiskReduction([]), false);
  const highRisk = validateConsumerBehaviorBlueprint({ riskReductionSignals: ["real_size"] });
  assert.ok(highRisk.violations.some((v) => v.code === "HIGH_PERCEIVED_RISK"));
  console.log("✔ risk reduction — usage scenario and material quality lower risk");
}

function testComparativeBehavior() {
  const rules = matchConsumerBehaviorRules({ marketplace: "marketplace" });
  assert.ok(rules.some((r) => r.id === "comparative-behavior-grid"));
  const weak = validateConsumerBehaviorBlueprint({
    heroProductPresent: true,
    primaryBenefitPresent: true,
    comparativeAdvantage: false,
    decisionStage: DecisionJourneyStage.INTEREST,
  });
  assert.ok(weak.violations.some((v) => v.code === "WEAK_COMPARATIVE_ADVANTAGE"));
  console.log("✔ comparative behavior — must outperform neighboring cards");
}

function testBuyingModes() {
  assert.ok(BUYING_MODE_GUIDANCE[BuyingMode.IMPULSE].includes("Emotional"));
  const impulse = selectBuyingMode({ category: "beauty" });
  const rational = selectBuyingMode({ category: "electronics" });
  assert.equal(impulse, BuyingMode.IMPULSE);
  assert.equal(rational, BuyingMode.RATIONAL);
  const impulseRules = recommendConsumerBehaviorRules({ buyingMode: BuyingMode.IMPULSE });
  assert.ok(impulseRules.some((r) => r.id === "impulse-buying-mode"));
  console.log("✔ buying modes — impulse vs rational comparison scenarios");
}

function testPurchaseMotivation() {
  assert.ok(PURCHASE_MOTIVATION_GUIDANCE[PurchaseMotivation.FUNCTIONAL].includes("problem"));
  const functional = selectPurchaseMotivation({ category: "tools" });
  const emotional = selectPurchaseMotivation({ category: "beauty" });
  assert.equal(functional, PurchaseMotivation.FUNCTIONAL);
  assert.equal(emotional, PurchaseMotivation.EMOTIONAL);
  console.log("✔ purchase motivation — functional vs emotional drivers");
}

function testValuePerception() {
  const value = estimatePerceivedValue({
    trustScore: 0.8,
    visualCleanliness: true,
    comparativeAdvantage: true,
    primaryBenefitPresent: true,
  });
  assert.ok(value >= MIN_PERCEIVED_VALUE);
  const low = validateConsumerBehaviorBlueprint({
    heroProductPresent: false,
    visualCleanliness: false,
    comparativeAdvantage: false,
    primaryBenefitPresent: false,
    perceivedValue: 0.3,
  });
  assert.ok(low.violations.some((v) => v.code === "MISSING_VALUE_PERCEPTION"));
  console.log("✔ value perception — visual quality increases perceived value");
}

function testSocialProof() {
  const signals = getSocialProofSignals();
  assert.equal(signals.length, 3);
  const trust = estimateTrustScore({
    heroProductPresent: true,
    visualCleanliness: true,
    socialProofSignals: ["photo_quality", "layout_polish"],
    riskReductionSignals: ["usage_scenario", "material_quality"],
  });
  assert.ok(trust >= MIN_TRUST_SCORE);
  console.log("✔ social proof — visual quality substitutes for on-image reviews");
}

function testDecisionSpeed() {
  assert.equal(MAX_DECISION_TIME_MS, 2000);
  const slow = validateConsumerBehaviorBlueprint({ decisionTimeMs: 3500 });
  assert.ok(slow.violations.some((v) => v.code === "SLOW_DECISION_PATH"));
  const fast = matchConsumerBehaviorRules({ marketplace: "marketplace" });
  assert.ok(fast.some((r) => r.id === "decision-speed-marketplace"));
  console.log("✔ decision speed — marketplace requires fast click decisions");
}

function testValidateCompliantBlueprint() {
  const result = validateConsumerBehaviorBlueprint({
    heroProductPresent: true,
    primaryBenefitPresent: true,
    usageScenarioPresent: true,
    visualCleanliness: true,
    comparativeAdvantage: true,
    decisionTimeMs: 1500,
    riskReductionSignals: ["usage_scenario", "material_quality"],
    socialProofSignals: ["photo_quality", "layout_polish"],
    segmentationMatched: true,
    impulseOptimized: true,
    clickIntentLikely: true,
    decisionStage: DecisionJourneyStage.CLICK,
    buyingMode: BuyingMode.IMPULSE,
    purchaseMotivation: PurchaseMotivation.EMOTIONAL,
  });
  assert.equal(result.valid, true);
  assert.equal(result.retryRecommended, false);
  assert.ok((result.estimatedTrustScore ?? 0) >= MIN_TRUST_SCORE);
  console.log("✔ compliant consumer behavior blueprint passes validation");
}

function testValidateViolatingBlueprint() {
  const result = validateConsumerBehaviorBlueprint({
    heroProductPresent: false,
    primaryBenefitPresent: false,
    visualCleanliness: false,
    comparativeAdvantage: false,
    decisionTimeMs: 4000,
    riskReductionSignals: [],
    aestheticOnly: true,
    segmentationMatched: false,
    impulseOptimized: false,
    clickIntentLikely: false,
    decisionStage: DecisionJourneyStage.EVALUATION,
    buyingMode: BuyingMode.IMPULSE,
    perceivedValue: 0.2,
    trustScore: 0.2,
  });
  assert.equal(result.valid, false);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.length >= 5);
  console.log("✔ violating consumer blueprint triggers local retry");
}

function testConsumerLearning() {
  const rule = getConsumerBehaviorRule("trust-measurable-signals")!;
  const updated = applyConsumerBehaviorLearningFeedback([rule], {
    ruleId: rule.id,
    commercialScore: 0.95,
  });
  assert.ok(updated[0].confidence > rule.confidence);
  console.log("✔ consumer evolution — commercial metrics adjust confidence");
}

function testAestheticOnlyFails() {
  const report = validateConsumerBehaviorKnowledge({ aestheticOnlyDesign: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "AESTHETIC_ONLY_DESIGN"));
  console.log("✔ aesthetic-only design is architecturally invalid");
}

function testValidateConsumerBehaviorKnowledge() {
  const report = validateConsumerBehaviorKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.journeyAware, true);
  assert.equal(report.trustMeasurable, true);
  assert.equal(SEED_CONSUMER_BEHAVIOR_RULES.length, 14);
  console.log("✔ consumer behavior knowledge validation passes");
}

function testRunConsumerBehaviorKnowledge() {
  const report = runConsumerBehaviorKnowledge({});
  assert.equal(report.valid, true);
  assertConsumerBehaviorKnowledge();
  console.log("✔ runConsumerBehaviorKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isConsumerBehaviorKnowledgeFailure("HIGH_PERCEIVED_RISK"), true);
  assert.equal(isConsumerBehaviorKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ consumer behavior failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testRuleStructure();
  testDecisionJourney();
  testAttentionStage();
  testInterestStage();
  testEvaluationStage();
  testTrustFormation();
  testRiskReduction();
  testComparativeBehavior();
  testBuyingModes();
  testPurchaseMotivation();
  testValuePerception();
  testSocialProof();
  testDecisionSpeed();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testConsumerLearning();
  testAestheticOnlyFails();
  testValidateConsumerBehaviorKnowledge();
  testRunConsumerBehaviorKnowledge();
  testFailureCodes();
  console.log("\nconsumer-behavior-knowledge.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Knowledge Learning tests (Chapter 5.19)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_LEARNING_VERSION,
  KNOWLEDGE_LEARNING_GOLDEN_RULE,
  LEARNING_PIPELINE,
  SOURCE_TRUST_WEIGHTS,
  MIN_FEEDBACK_SAMPLES,
  STABILITY_CONFIDENCE_THRESHOLD,
  MIN_PATTERN_DISCOVERY_SAMPLES,
  MAX_CONFIDENCE_DELTA_PER_CYCLE,
  KnowledgeLearningSource,
  KnowledgeLearningStage,
  KnowledgeProposalKind,
  KnowledgeProposalStatus,
  buildSeedLearningFeedback,
  getLearningSourceTrust,
  evaluateLearningOutcome,
  collectLearningFeedback,
  adjustKnowledgeConfidenceFromOutcomes,
  detectKnowledgePatternProposals,
  detectKnowledgeAntiPatternProposals,
  analyzeMarketplaceAdaptation,
  requiresExpertReview,
  validateKnowledgeProposal,
  applyKnowledgeProposalValidation,
  computeLearningMetrics,
  updateKnowledgeFromLearning,
  runKnowledgeLearningPipeline,
  validateKnowledgeLearning,
  assertKnowledgeLearning,
  runKnowledgeLearning,
  isKnowledgeLearningFailure,
} from "./index";
import { buildValidatableKnowledgeCatalog } from "./index";

function testGoldenRule() {
  assert.ok(KNOWLEDGE_LEARNING_GOLDEN_RULE.includes("better after every generation"));
  assert.equal(KNOWLEDGE_LEARNING_VERSION, "5.19.0");
  console.log("✔ golden rule — platform improves after every generation");
}

function testLearningPipeline() {
  assert.equal(LEARNING_PIPELINE.length, 8);
  assert.equal(LEARNING_PIPELINE[0], KnowledgeLearningStage.GENERATION);
  assert.equal(LEARNING_PIPELINE[7], KnowledgeLearningStage.KNOWLEDGE_ENGINE);
  console.log("✔ learning pipeline — generation to evaluation to knowledge engine");
}

function testLearningSources() {
  assert.ok(getLearningSourceTrust(KnowledgeLearningSource.EXPERT_REVIEW) > 0.9);
  assert.ok(
    getLearningSourceTrust(KnowledgeLearningSource.USER_FEEDBACK) <
      getLearningSourceTrust(KnowledgeLearningSource.COMMERCIAL_SCORE),
  );
  assert.equal(SOURCE_TRUST_WEIGHTS[KnowledgeLearningSource.DESIGN_MEMORY], 0.88);
  console.log("✔ learning sources — independent trust levels per source");
}

function testReinforcementLearning() {
  const catalog = buildValidatableKnowledgeCatalog();
  const warm = catalog.find((e) => e.id === "photo-warm-lighting-rule")!;
  const feedback = buildSeedLearningFeedback().filter((f) => f.ruleId === "photo-warm-lighting-rule");
  const adjustment = adjustKnowledgeConfidenceFromOutcomes(warm, feedback);
  assert.ok(adjustment.sampleCount >= MIN_FEEDBACK_SAMPLES);
  assert.ok(adjustment.newConfidence >= warm.confidence || adjustment.stable);
  assert.ok(Math.abs(adjustment.delta) <= MAX_CONFIDENCE_DELTA_PER_CYCLE);
  console.log("✔ reinforcement learning — confidence adjusts from vision and commercial scores");
}

function testKnowledgeStability() {
  const catalog = buildValidatableKnowledgeCatalog();
  const warm = catalog.find((e) => e.id === "photo-warm-lighting-rule")!;
  assert.ok(warm.confidence >= STABILITY_CONFIDENCE_THRESHOLD - 0.05);
  const feedback = buildSeedLearningFeedback()
    .filter((f) => f.ruleId === "photo-warm-lighting-rule")
    .map((f) => ({
      ...f,
      outcome: { ...f.outcome, visionScore: 0.85, commercialScore: 0.82, retryCount: 0 },
    }));
  const adjustment = adjustKnowledgeConfidenceFromOutcomes(warm, feedback);
  assert.equal(adjustment.stable, true);
  assert.equal(adjustment.delta, 0);
  console.log("✔ knowledge stability — high-performing rules resist unnecessary change");
}

function testPatternDiscovery() {
  const feedback = buildSeedLearningFeedback();
  const proposals = detectKnowledgePatternProposals(feedback);
  assert.ok(proposals.length > 0);
  assert.equal(proposals[0].kind, KnowledgeProposalKind.PATTERN);
  assert.equal(proposals[0].status, KnowledgeProposalStatus.PROPOSED);
  assert.ok(proposals[0].sampleCount >= MIN_PATTERN_DISCOVERY_SAMPLES);
  assert.equal(proposals[0].requiresExpertReview, true);
  console.log("✔ pattern discovery — recurring successes propose new patterns");
}

function testAntiPatternDiscovery() {
  const feedback = buildSeedLearningFeedback();
  const proposals = detectKnowledgeAntiPatternProposals(feedback);
  assert.ok(proposals.length > 0);
  assert.equal(proposals[0].kind, KnowledgeProposalKind.ANTI_PATTERN);
  assert.ok(proposals[0].title.includes("anti-pattern"));
  console.log("✔ anti-pattern discovery — recurring failures propose anti-patterns");
}

function testHumanFeedbackIntegration() {
  const single = buildSeedLearningFeedback().slice(0, 1);
  const { violations } = collectLearningFeedback(single, { singleFeedbackOverride: true });
  assert.ok(violations.some((v) => v.code === "SINGLE_FEEDBACK_OVERRIDE"));
  console.log("✔ human feedback — single review never changes rules alone");
}

function testExpertReviewRequired() {
  const feedback = buildSeedLearningFeedback();
  const proposal = detectKnowledgePatternProposals(feedback)[0];
  assert.equal(requiresExpertReview(proposal), true);
  const violations = validateKnowledgeProposal(proposal);
  assert.ok(violations.some((v) => v.code === "MISSING_EXPERT_REVIEW"));
  const approved = applyKnowledgeProposalValidation(proposal, true);
  assert.equal(approved.status, KnowledgeProposalStatus.PENDING_VALIDATION);
  console.log("✔ expert review — new patterns require validation before publication");
}

function testMarketplaceAdaptation() {
  const feedback = buildSeedLearningFeedback();
  const adaptation = analyzeMarketplaceAdaptation(feedback, "amazon");
  assert.ok(adaptation.improving.length > 0 || adaptation.declining.length > 0);
  console.log("✔ marketplace adaptation — tracks improving and declining decisions");
}

function testLearningMetrics() {
  const feedback = buildSeedLearningFeedback();
  const catalog = buildValidatableKnowledgeCatalog();
  const warm = catalog.find((e) => e.id === "photo-warm-lighting-rule")!;
  const adjustment = adjustKnowledgeConfidenceFromOutcomes(warm, feedback);
  const metrics = computeLearningMetrics(feedback, [adjustment]);
  assert.ok(metrics.visionScoreAvg > 0.5);
  assert.ok(metrics.commercialScoreAvg > 0.5);
  assert.ok(metrics.patternSuccessRate > 0);
  console.log("✔ learning metrics — vision, commercial, CTR, retry, confidence growth");
}

function testSafetyMechanisms() {
  const catalog = buildValidatableKnowledgeCatalog();
  const warm = catalog.find((e) => e.id === "photo-warm-lighting-rule")!;
  const chaotic = {
    ruleId: warm.id,
    previousConfidence: warm.confidence,
    newConfidence: 0.2,
    delta: -0.68,
    reason: "chaotic",
    stable: false,
    sampleCount: 10,
  };
  const { violations } = updateKnowledgeFromLearning(warm, chaotic);
  assert.ok(violations.some((v) => v.code === "CHAOTIC_CONFIDENCE"));
  console.log("✔ safety mechanisms — chaotic confidence changes blocked");
}

function testUnvalidatedProposalBlocked() {
  const report = validateKnowledgeLearning({ allowUnvalidatedProposal: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "UNVALIDATED_PROPOSAL"));
  console.log("✔ safety — unvalidated proposals cannot enter knowledge base");
}

function testRunLearningPipeline() {
  const feedback = buildSeedLearningFeedback();
  const cycle = runKnowledgeLearningPipeline("gen-kitchen-premium-001", feedback, {
    skipValidation: true,
  });
  assert.equal(cycle.stages.length, 8);
  assert.ok(cycle.confidenceAdjustments.length > 0);
  assert.ok(cycle.patternProposals.length > 0 || cycle.antiPatternProposals.length > 0);
  assert.ok(cycle.metrics.commercialScoreAvg > 0);
  console.log("✔ learning pipeline — full cycle from generation to knowledge update");
}

function testEvaluateOutcome() {
  const good = evaluateLearningOutcome({
    visionScore: 0.9,
    commercialScore: 0.88,
    ctrPrediction: 0.75,
    retryCount: 0,
  });
  const bad = evaluateLearningOutcome({
    visionScore: 0.4,
    commercialScore: 0.35,
    retryCount: 3,
  });
  assert.equal(good.success, true);
  assert.equal(bad.success, false);
  console.log("✔ evaluation — outcomes scored from vision, commercial, CTR, retry");
}

function testValidateKnowledgeLearning() {
  const report = validateKnowledgeLearning();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.safetyMechanismsActive, true);
  assert.ok(report.proposalCount > 0);
  assertKnowledgeLearning();
  console.log("✔ knowledge learning system validation passes");
}

function testRunKnowledgeLearning() {
  const report = runKnowledgeLearning();
  assert.equal(report.valid, true);
  assert.equal(report.continuousLearningReady, true);
  console.log("✔ runKnowledgeLearning entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeLearningFailure("CHAOTIC_CONFIDENCE"), true);
  assert.equal(isKnowledgeLearningFailure("UNKNOWN"), false);
  console.log("✔ knowledge learning failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testLearningPipeline();
  testLearningSources();
  testReinforcementLearning();
  testKnowledgeStability();
  testPatternDiscovery();
  testAntiPatternDiscovery();
  testHumanFeedbackIntegration();
  testExpertReviewRequired();
  testMarketplaceAdaptation();
  testLearningMetrics();
  testSafetyMechanisms();
  testUnvalidatedProposalBlocked();
  testRunLearningPipeline();
  testEvaluateOutcome();
  testValidateKnowledgeLearning();
  testRunKnowledgeLearning();
  testFailureCodes();
  console.log("\nknowledge-learning.spec.ts — all passed");
}

run();

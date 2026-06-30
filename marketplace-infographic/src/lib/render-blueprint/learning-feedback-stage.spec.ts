/**
 * DESIGN AI v18 — Learning & Feedback Stage tests (Chapter 6.17)
 */
import assert from "node:assert/strict";
import {
  LEARNING_FEEDBACK_VERSION,
  LEARNING_FEEDBACK_GOLDEN_RULE,
  LEARNING_FEEDBACK_PIPELINE,
  LEARNING_FEEDBACK_POSITION,
  LearningFeedbackStage,
  resolvePatternIdsFromBlueprint,
  buildPlannedLearningPackage,
  buildPlannedFinalScores,
  updatePatternStatistics,
  updateAntiPatternStatistics,
  buildKnowledgeFeedbackProposals,
  buildMarketplaceLearningInsights,
  buildKnowledgeLearningFeedbackFromPackage,
  runLearningFeedbackStage,
  runLearningFeedbackStageFromPipeline,
  enrichPipelineContextWithLearningFeedback,
  validateLearningFeedbackStage,
  assertLearningFeedbackStage,
  runLearningFeedbackStageSystem,
  isLearningFeedbackStageFailure,
  runChiefDesignDirectorReviewStageFromPipeline,
  runCommercialValidationStageFromPipeline,
  runVisionValidationStageFromPipeline,
  runBlueprintAssemblyStageFromPipeline,
  buildDefaultPipelineInput,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  executeDesignPipelineStage,
} from "./index";

function learningPackageInput() {
  const chief = runChiefDesignDirectorReviewStageFromPipeline();
  const commercial = runCommercialValidationStageFromPipeline();
  const vision = runVisionValidationStageFromPipeline();
  const assembly = runBlueprintAssemblyStageFromPipeline();
  const pipelineInput = buildDefaultPipelineInput();

  return buildPlannedLearningPackage({
    projectId: "gen-kitchen-test-001",
    blueprint: chief.section!.blueprint,
    vision: vision.section!.plannedReport,
    commercial: commercial.section!.plannedReport,
    director: chief.section!.plannedReport,
    metadata: assembly.section!.metadata,
    imageRef: "render/test.png",
    marketplace: pipelineInput.marketplace,
  });
}

function testGoldenRule() {
  assert.ok(LEARNING_FEEDBACK_GOLDEN_RULE.toLowerCase().includes("generation"));
  assert.ok(
    LEARNING_FEEDBACK_GOLDEN_RULE.includes("collective intelligence") ||
      LEARNING_FEEDBACK_GOLDEN_RULE.includes("smarter"),
  );
  console.log("✔ golden rule — every generation becomes platform experience");
}

function testVersionAndPipeline() {
  assert.equal(LEARNING_FEEDBACK_VERSION, "6.17.0");
  assert.equal(LEARNING_FEEDBACK_PIPELINE.length, 14);
  assert.equal(LEARNING_FEEDBACK_PIPELINE[0], LearningFeedbackStage.INPUT_ASSEMBLY);
  assert.equal(LEARNING_FEEDBACK_PIPELINE[13], LearningFeedbackStage.STAGE_COMPLETE);
  assert.deepEqual(LEARNING_FEEDBACK_POSITION, [
    "chief-design-review",
    "learning-feedback",
    "next-generation",
  ]);
  console.log("✔ learning feedback stage pipeline has 14 internal stages");
}

function testHighLevelPipelinePosition() {
  const learning = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.KNOWLEDGE_LEARNING)!;
  assert.equal(learning.order, 18);
  assert.equal(learning.makesDesignDecision, false);
  assert.ok(learning.agentIds?.includes("design-memory"));
  console.log("✔ learning feedback is stage 18 in design pipeline");
}

function testPlannedLearningPackageShape() {
  const report = runLearningFeedbackStageFromPipeline();
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  const pkg = report.section!.learningPackage;
  assert.ok(pkg.projectId.length > 0);
  assert.ok(pkg.blueprint);
  assert.ok(pkg.vision.overallScore > 0);
  assert.ok(pkg.commercial.commercialScore > 0);
  assert.ok(pkg.director.professionalLevel > 0);
  assert.ok(pkg.retryHistory);
  assert.ok(pkg.finalScores.professionalScore > 0);
  assert.ok(pkg.metadata.pipelineVersion);
  console.log("✔ planned learning package matches Chapter 6.17 contract");
}

function testPatternStatisticsUpdate() {
  const pkg = learningPackageInput();
  const { updates } = updatePatternStatistics(pkg);
  assert.ok(updates.length > 0);
  assert.ok(updates[0].usageCount > 0);
  assert.ok(updates[0].successRate > 0);
  console.log("✔ pattern library statistics updated after generation");
}

function testAntiPatternStatisticsUpdate() {
  const pkg = learningPackageInput();
  const { updates } = updateAntiPatternStatistics(pkg, { injectRepeatingAntiPattern: true });
  assert.ok(updates.length > 0);
  assert.ok(updates.some((u) => u.antiPatternId.includes("hero")));
  console.log("✔ anti-pattern statistics updated when issues detected");
}

function testKnowledgeProposals() {
  const pkg = learningPackageInput();
  const { updates } = updatePatternStatistics(pkg);
  const proposals = buildKnowledgeFeedbackProposals(pkg, updates);
  assert.ok(proposals.length > 0);
  assert.ok(proposals.every((p) => p.status === "proposed" || p.status === "pending_validation"));
  console.log("✔ knowledge feedback proposals prepared for validation");
}

function testMarketplaceLearning() {
  const pkg = learningPackageInput();
  const insights = buildMarketplaceLearningInsights(pkg);
  assert.ok(insights.length > 0);
  assert.ok(insights[0].insight.length > 10);
  console.log("✔ marketplace-specific learning insights generated");
}

function testUserFeedbackIncluded() {
  const report = runLearningFeedbackStageFromPipeline({
    injectUserFeedback: { rating: "positive", comment: "Great card", timestamp: Date.now() },
  });
  assert.equal(report.section!.learningPackage.userFeedback?.rating, "positive");
  const feedback = buildKnowledgeLearningFeedbackFromPackage(report.section!.learningPackage);
  assert.ok(feedback.some((f) => f.source === "user_feedback"));
  console.log("✔ user feedback included in learning sources");
}

function testDoesNotMutateBlueprint() {
  const pkg = learningPackageInput();
  const blueprintJson = JSON.stringify(pkg.blueprint);
  const report = runLearningFeedbackStage({ learningPackage: pkg });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(JSON.stringify(pkg.blueprint), blueprintJson);
  console.log("✔ learning stage does not mutate blueprint");
}

function testPipelineChain() {
  const report = runLearningFeedbackStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.stagesCompleted.includes(LearningFeedbackStage.KNOWLEDGE_HANDOFF));
  assert.ok(report.section!.learningPackageId.startsWith("learning-"));
  console.log("✔ chief review → learning feedback chain completes");
}

function testContextEnrichment() {
  resetPipelineContextStores();
  const report = runLearningFeedbackStageFromPipeline();
  const ctx = createGenerationPipelineContext();
  const enriched = enrichPipelineContextWithLearningFeedback(ctx, report.section!);
  assert.equal(enriched.context.learning.feedbackCollected, true);
  assert.equal(enriched.context.learning.designMemoryUpdated, true);
  console.log("✔ pipeline context enriched with learning outcomes");
}

function testDesignPipelineStageExecution() {
  const result = executeDesignPipelineStage(
    DesignPipelineStage.KNOWLEDGE_LEARNING,
    buildDefaultPipelineInput(),
  );
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(KNOWLEDGE_LEARNING) passes default kitchen pipeline");
}

function testSystemValidation() {
  const report = validateLearningFeedbackStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.learningPackageBuilt, true);
  assert.equal(report.patternStatisticsUpdated, true);
  assert.equal(report.antiPatternStatisticsUpdated, true);
  assert.equal(report.designMemoryUpdated, true);
  assert.equal(report.knowledgeHandoffComplete, true);
  assert.equal(report.downstreamReady, true);
  assert.doesNotThrow(() => assertLearningFeedbackStage());
  assert.equal(runLearningFeedbackStageSystem().valid, true);
  assert.equal(isLearningFeedbackStageFailure("USER_FEEDBACK_IGNORED"), true);
  console.log("✔ system validation confirms learning feedback stage contract");
}

function testPatternResolution() {
  const pkg = learningPackageInput();
  const ids = resolvePatternIdsFromBlueprint(pkg.blueprint);
  assert.ok(ids.length > 0);
  console.log("✔ blueprint composition resolves to pattern library ids");
}

function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testPlannedLearningPackageShape();
  testPatternStatisticsUpdate();
  testAntiPatternStatisticsUpdate();
  testKnowledgeProposals();
  testMarketplaceLearning();
  testUserFeedbackIncluded();
  testDoesNotMutateBlueprint();
  testPipelineChain();
  testContextEnrichment();
  testDesignPipelineStageExecution();
  testSystemValidation();
  testPatternResolution();
  console.log("\nlearning-feedback-stage.spec.ts — all passed");
}

run();

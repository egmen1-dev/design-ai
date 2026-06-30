/**
 * DESIGN AI v18 — Chief Design Director Review Stage tests (Chapter 6.16)
 */
import assert from "node:assert/strict";
import {
  CHIEF_DESIGN_DIRECTOR_REVIEW_VERSION,
  CHIEF_DESIGN_DIRECTOR_REVIEW_GOLDEN_RULE,
  CHIEF_DESIGN_DIRECTOR_REVIEW_PIPELINE,
  CHIEF_DESIGN_DIRECTOR_REVIEW_POSITION,
  ChiefDesignDirectorReviewStage,
  DirectorApprovalStatus,
  DirectorFinalDecision,
  CHIEF_MIN_PROFESSIONAL_SCORE,
  scoreBusinessReview,
  scoreCreativeReview,
  scoreTechnicalReview,
  scoreMarketplaceReview,
  scoreCommercialDimension,
  computeProfessionalLevel,
  buildPlannedDirectorReport,
  runChiefDesignDirectorReviewStage,
  runChiefDesignDirectorReviewStageFromPipeline,
  enrichPipelineContextWithChiefDesignDirectorReview,
  validateChiefDesignDirectorReviewStage,
  assertChiefDesignDirectorReviewStage,
  runChiefDesignDirectorReviewStageSystem,
  isChiefDesignDirectorReviewStageFailure,
  runCommercialValidationStageFromPipeline,
  runConsensusValidationStageFromPipeline,
  runVisionValidationStageFromPipeline,
  runBusinessUnderstandingStage,
  runKnowledgeRetrievalStage,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildDefaultPipelineInput,
  runBlueprintAssemblyStageFromPipeline,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  executeDesignPipelineStage,
} from "./index";

function chiefReviewInput() {
  const commercial = runCommercialValidationStageFromPipeline();
  const vision = runVisionValidationStageFromPipeline();
  const consensus = runConsensusValidationStageFromPipeline();
  const assembly = runBlueprintAssemblyStageFromPipeline();
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildDefaultProductAnalysisInput());
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section!.profile,
    marketplace: pipelineInput.marketplace,
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section!.profile,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  return {
    profile: analysis.section!.profile,
    business: business.section!,
    blueprint: commercial.section!.blueprint,
    visionReport: vision.section!.plannedReport,
    commercialReport: commercial.section!.plannedReport,
    consensusReport: consensus.section!.plannedReport,
    metadata: assembly.section!.metadata,
    imageRef: "render/test.png",
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
  };
}

function testGoldenRule() {
  assert.ok(CHIEF_DESIGN_DIRECTOR_REVIEW_GOLDEN_RULE.toLowerCase().includes("whole"));
  assert.ok(
    CHIEF_DESIGN_DIRECTOR_REVIEW_GOLDEN_RULE.includes("chief guardian") ||
      CHIEF_DESIGN_DIRECTOR_REVIEW_GOLDEN_RULE.includes("Chief Design Director"),
  );
  console.log("✔ golden rule — chief sees the whole project, not isolated metrics");
}

function testVersionAndPipeline() {
  assert.equal(CHIEF_DESIGN_DIRECTOR_REVIEW_VERSION, "6.16.0");
  assert.equal(CHIEF_DESIGN_DIRECTOR_REVIEW_PIPELINE.length, 14);
  assert.equal(
    CHIEF_DESIGN_DIRECTOR_REVIEW_PIPELINE[0],
    ChiefDesignDirectorReviewStage.INPUT_ASSEMBLY,
  );
  assert.equal(
    CHIEF_DESIGN_DIRECTOR_REVIEW_PIPELINE[13],
    ChiefDesignDirectorReviewStage.STAGE_COMPLETE,
  );
  assert.deepEqual(CHIEF_DESIGN_DIRECTOR_REVIEW_POSITION, [
    "commercial-validation",
    "chief-design-review",
    "retry",
  ]);
  console.log("✔ chief design director review stage pipeline has 14 internal stages");
}

function testHighLevelPipelinePosition() {
  const chief = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.CHIEF_DESIGN_REVIEW)!;
  assert.equal(chief.order, 15);
  assert.equal(chief.makesDesignDecision, false);
  assert.ok(chief.agentIds?.includes("chief-design-director"));
  console.log("✔ chief design review is stage 15 in design pipeline");
}

function testPlannedDirectorReportShape() {
  const report = runChiefDesignDirectorReviewStageFromPipeline();
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  const planned = report.section!.plannedReport;
  assert.ok(planned.overallScore > 0);
  assert.ok(planned.professionalLevel > 0);
  assert.ok(typeof planned.approvalStatus === "string");
  assert.equal(typeof planned.retryRequired, "boolean");
  assert.ok(Array.isArray(planned.retryTargets));
  assert.ok(Array.isArray(planned.criticalIssues));
  assert.ok(Array.isArray(planned.recommendations));
  assert.ok(planned.finalDecision.length > 0);
  console.log("✔ planned director report matches Chapter 6.16 contract");
}

function testMultiDimensionalScoring() {
  const input = chiefReviewInput();
  const business = scoreBusinessReview(input.business, input.commercialReport, input.consensusReport);
  const creative = scoreCreativeReview(input.blueprint, input.consensusReport);
  const technical = scoreTechnicalReview(input.visionReport);
  const marketplace = scoreMarketplaceReview(
    input.commercialReport,
    input.consensusReport,
    input.marketplace,
  );
  const commercial = scoreCommercialDimension(input.commercialReport);
  const professional = computeProfessionalLevel({ business, creative, technical, marketplace, commercial });
  assert.ok(business > 0 && creative > 0 && technical > 0 && marketplace > 0 && commercial > 0);
  assert.ok(professional > 0);
  console.log("✔ multi-dimensional review produces differentiated dimension scores");
}

function testWeakCommercialBlocksApproval() {
  const report = runChiefDesignDirectorReviewStageFromPipeline({ injectWeakCommercial: true });
  assert.equal(report.section!.plannedReport.retryRequired, true);
  assert.notEqual(report.section!.plannedReport.approvalStatus, DirectorApprovalStatus.APPROVED);
  assert.notEqual(
    report.section!.plannedReport.finalDecision,
    DirectorFinalDecision.APPROVED,
  );
  console.log("✔ weak commercial potential blocks chief approval");
}

function testCriticalTechnicalRequiresRetry() {
  const report = runChiefDesignDirectorReviewStageFromPipeline({ injectCriticalTechnical: true });
  assert.equal(report.section!.plannedReport.retryRequired, true);
  assert.ok(report.section!.plannedReport.retryTargets.length > 0);
  assert.ok(
    report.section!.plannedReport.recommendations.length > 0 ||
      report.section!.plannedReport.criticalIssues.length > 0,
  );
  console.log("✔ critical technical issues trigger targeted retry");
}

function testBlueprintRebuildEscalation() {
  const report = runChiefDesignDirectorReviewStageFromPipeline({
    injectBlueprintRebuild: true,
    injectExhaustedRetries: true,
  });
  assert.equal(report.section!.plannedReport.approvalStatus, DirectorApprovalStatus.BLUEPRINT_REBUILD);
  assert.equal(report.section!.plannedReport.finalDecision, DirectorFinalDecision.BLUEPRINT_REBUILD);
  console.log("✔ exhausted retries escalate to blueprint rebuild");
}

function testApprovedMeetsProfessionalThreshold() {
  const report = runChiefDesignDirectorReviewStageFromPipeline();
  const planned = report.section!.plannedReport;
  const approved =
    planned.approvalStatus === DirectorApprovalStatus.APPROVED ||
    planned.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES;
  if (approved) {
    assert.ok(planned.professionalLevel >= CHIEF_MIN_PROFESSIONAL_SCORE);
  }
  console.log("✔ approved work meets professional score threshold");
}

function testLearningFeedbackCollected() {
  const report = runChiefDesignDirectorReviewStageFromPipeline();
  const feedback = report.section!.learningFeedback;
  assert.ok(feedback.professionalScore > 0);
  assert.ok(Array.isArray(feedback.successes));
  assert.ok(Array.isArray(feedback.errors));
  assert.ok(Array.isArray(feedback.recommendations));
  console.log("✔ learning feedback prepared for knowledge engine");
}

function testPipelineChain() {
  const report = runChiefDesignDirectorReviewStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(
    report.section!.stagesCompleted.includes(ChiefDesignDirectorReviewStage.PROFESSIONAL_SCORE),
  );
  assert.ok(report.section!.stagesCompleted.includes(ChiefDesignDirectorReviewStage.FINAL_APPROVAL));
  console.log("✔ commercial → chief design director review chain completes");
}

function testContextEnrichment() {
  resetPipelineContextStores();
  const report = runChiefDesignDirectorReviewStageFromPipeline();
  const ctx = createGenerationPipelineContext();
  const enriched = enrichPipelineContextWithChiefDesignDirectorReview(ctx, report.section!);
  assert.equal(
    enriched.context.validation.professionalScore,
    report.section!.plannedReport.professionalLevel,
  );
  assert.equal(enriched.context.learning.feedbackCollected, true);
  console.log("✔ pipeline context enriched with chief decision");
}

function testDesignPipelineStageExecution() {
  const result = executeDesignPipelineStage(
    DesignPipelineStage.CHIEF_DESIGN_REVIEW,
    buildDefaultPipelineInput(),
  );
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(CHIEF_DESIGN_REVIEW) passes default kitchen pipeline");
}

function testSystemValidation() {
  const report = validateChiefDesignDirectorReviewStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.multiDimensionalReview, true);
  assert.equal(report.allReportsConsidered, true);
  assert.equal(report.explainabilityComplete, true);
  assert.equal(report.retryTargeted, true);
  assert.equal(report.downstreamReady, true);
  assert.doesNotThrow(() => assertChiefDesignDirectorReviewStage());
  assert.equal(runChiefDesignDirectorReviewStageSystem().valid, true);
  assert.equal(isChiefDesignDirectorReviewStageFailure("WEAK_IMAGE_APPROVED"), true);
  console.log("✔ system validation confirms chief design director review stage contract");
}

function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testPlannedDirectorReportShape();
  testMultiDimensionalScoring();
  testWeakCommercialBlocksApproval();
  testCriticalTechnicalRequiresRetry();
  testBlueprintRebuildEscalation();
  testApprovedMeetsProfessionalThreshold();
  testLearningFeedbackCollected();
  testPipelineChain();
  testContextEnrichment();
  testDesignPipelineStageExecution();
  testSystemValidation();
  console.log("\nchief-design-director-review-stage.spec.ts — all passed");
}

run();

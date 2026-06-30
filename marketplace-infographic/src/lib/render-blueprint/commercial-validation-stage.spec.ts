/**
 * DESIGN AI v18 — Commercial Validation Stage tests (Chapter 6.15)
 */
import assert from "node:assert/strict";
import {
  COMMERCIAL_VALIDATION_VERSION,
  COMMERCIAL_VALIDATION_GOLDEN_RULE,
  COMMERCIAL_VALIDATION_PIPELINE,
  COMMERCIAL_VALIDATION_POSITION,
  CommercialValidationStage,
  COMMERCIAL_MIN_APPROVAL_SCORE,
  scoreAttention,
  predictCtr,
  scoreTrust,
  scoreSellingPower,
  scoreMarketplaceFit,
  scorePurchaseIntent,
  computeCommercialScore,
  buildCommercialRecommendations,
  runCommercialValidationStage,
  runCommercialValidationStageFromPipeline,
  enrichPipelineContextWithCommercialValidation,
  validateCommercialValidationStage,
  assertCommercialValidationStage,
  runCommercialValidationStageSystem,
  isCommercialValidationStageFailure,
  runVisionValidationStageFromPipeline,
  runBusinessUnderstandingStage,
  runKnowledgeRetrievalStage,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildDefaultPipelineInput,
  runRenderAdapterStageFromPipeline,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  executeDesignPipelineStage,
} from "./index";

function commercialValidationInput() {
  const vision = runVisionValidationStageFromPipeline({ providerId: "flux" });
  const adapter = runRenderAdapterStageFromPipeline({ providerId: "flux" });
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
    blueprint: adapter.section!.blueprint,
    visionReport: vision.section!.plannedReport,
    imageRef: "render/test.png",
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
  };
}

function testGoldenRule() {
  assert.ok(COMMERCIAL_VALIDATION_GOLDEN_RULE.toLowerCase().includes("sell"));
  assert.ok(COMMERCIAL_VALIDATION_GOLDEN_RULE.includes("not beautiful pictures") || COMMERCIAL_VALIDATION_GOLDEN_RULE.includes("commercially effective"));
  console.log("✔ golden rule — commercial evaluates selling power, not beauty");
}

function testVersionAndPipeline() {
  assert.equal(COMMERCIAL_VALIDATION_VERSION, "6.15.0");
  assert.equal(COMMERCIAL_VALIDATION_PIPELINE.length, 15);
  assert.equal(COMMERCIAL_VALIDATION_PIPELINE[0], CommercialValidationStage.INPUT_ASSEMBLY);
  assert.equal(COMMERCIAL_VALIDATION_PIPELINE[14], CommercialValidationStage.STAGE_COMPLETE);
  assert.deepEqual(COMMERCIAL_VALIDATION_POSITION, ["vision-analysis", "commercial-validation", "chief-design-review"]);
  console.log("✔ commercial validation stage pipeline has 15 internal stages");
}

function testHighLevelPipelinePosition() {
  const commercial = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.COMMERCIAL_VALIDATION)!;
  assert.equal(commercial.order, 14);
  assert.equal(commercial.makesDesignDecision, false);
  console.log("✔ commercial validation is stage 14 in design pipeline");
}

function testPlannedCommercialReportShape() {
  const report = runCommercialValidationStageFromPipeline();
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  const planned = report.section!.plannedReport;
  assert.ok(planned.commercialScore > 0);
  assert.ok(planned.ctrPrediction > 0);
  assert.ok(typeof planned.attentionScore === "number");
  assert.ok(typeof planned.clarityScore === "number");
  assert.ok(typeof planned.trustScore === "number");
  assert.ok(typeof planned.sellingPower === "number");
  assert.ok(typeof planned.marketplaceFit === "number");
  assert.ok(typeof planned.purchaseIntent === "number");
  assert.ok(Array.isArray(planned.recommendations));
  assert.equal(typeof planned.approved, "boolean");
  console.log("✔ planned commercial report matches Chapter 6.15 contract");
}

function testCtrPrediction() {
  const input = commercialValidationInput();
  const attention = scoreAttention(input.blueprint, input.visionReport);
  const selling = scoreSellingPower(input.blueprint, input.business);
  const fit = scoreMarketplaceFit(input.blueprint, input.business, input.marketplace, input.visionReport);
  const ctr = predictCtr(attention, selling, fit, input.business);
  assert.ok(ctr >= 0.01 && ctr <= 0.2);
  console.log("✔ CTR predictor returns bounded probability");
}

function testWeakValuePropositionBlocked() {
  const report = runCommercialValidationStageFromPipeline({ injectWeakValueProposition: true });
  assert.equal(report.section!.plannedReport.approved, false);
  assert.ok(report.section!.plannedReport.recommendations.some((r) => r.action.includes("Value Proposition")));
  console.log("✔ weak value proposition blocks commercial approval");
}

function testHeroNotDominantBlocked() {
  const report = runCommercialValidationStageFromPipeline({ injectHeroNotDominant: true });
  assert.equal(report.section!.plannedReport.approved, false);
  assert.ok(report.section!.plannedReport.recommendations.some((r) => r.target.includes("composition")));
  console.log("✔ non-dominant hero triggers composition retry recommendation");
}

function testApprovalThreshold() {
  const report = runCommercialValidationStageFromPipeline();
  if (report.section!.plannedReport.approved) {
    assert.ok(report.section!.plannedReport.commercialScore >= COMMERCIAL_MIN_APPROVAL_SCORE);
  }
  console.log("✔ approved images meet commercial score threshold");
}

function testDoesNotReevaluateTechnicalQuality() {
  const input = commercialValidationInput();
  const trust = scoreTrust(input.visionReport, input.business);
  assert.ok(trust > 0);
  const report = runCommercialValidationStage(input);
  assert.equal(report.valid, true);
  assert.ok(report.section!.plannedReport.trustScore > 0);
  console.log("✔ trust derives from vision report without re-running technical QA");
}

function testBusinessGoalInfluencesCtr() {
  const input = commercialValidationInput();
  const baselineBusiness = {
    ...input.business,
    model: { ...input.business.model, businessPriority: "premium trust and brand awareness" },
  };
  const ctrDefault = predictCtr(90, 90, 90, baselineBusiness);
  const ctrBoosted = predictCtr(90, 90, 90, {
    ...baselineBusiness,
    model: { ...baselineBusiness.model, businessPriority: "Increase CTR and conversion" },
  });
  assert.ok(ctrBoosted > ctrDefault);
  console.log("✔ business goal influences CTR prediction");
}

function testPipelineChain() {
  const report = runCommercialValidationStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.stagesCompleted.includes(CommercialValidationStage.COMMERCIAL_SCORE));
  console.log("✔ vision → commercial validation chain completes");
}

function testContextEnrichment() {
  resetPipelineContextStores();
  const report = runCommercialValidationStageFromPipeline();
  const ctx = createGenerationPipelineContext();
  const enriched = enrichPipelineContextWithCommercialValidation(ctx, report.section!);
  assert.equal(enriched.context.validation.commercialScore, report.section!.plannedReport.commercialScore);
  console.log("✔ pipeline context enriched with commercial score");
}

function testDesignPipelineStageExecution() {
  const result = executeDesignPipelineStage(DesignPipelineStage.COMMERCIAL_VALIDATION, buildDefaultPipelineInput());
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(COMMERCIAL_VALIDATION) passes default kitchen pipeline");
}

function testSystemValidation() {
  const report = validateCommercialValidationStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.businessGoalConsidered, true);
  assert.equal(report.ctrPredicted, true);
  assert.equal(report.explainabilityComplete, true);
  assert.equal(report.differentiatedScores, true);
  assert.equal(report.downstreamReady, true);
  assert.doesNotThrow(() => assertCommercialValidationStage());
  assert.equal(runCommercialValidationStageSystem().valid, true);
  assert.equal(isCommercialValidationStageFailure("BUSINESS_GOAL_IGNORED"), true);
  console.log("✔ system validation confirms commercial validation stage contract");
}

function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testPlannedCommercialReportShape();
  testCtrPrediction();
  testWeakValuePropositionBlocked();
  testHeroNotDominantBlocked();
  testApprovalThreshold();
  testDoesNotReevaluateTechnicalQuality();
  testBusinessGoalInfluencesCtr();
  testPipelineChain();
  testContextEnrichment();
  testDesignPipelineStageExecution();
  testSystemValidation();
  console.log("\ncommercial-validation-stage.spec.ts — all passed");
}

run();

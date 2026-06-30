/**
 * DESIGN AI v18 — Vision Validation Stage tests (Chapter 6.14)
 */
import assert from "node:assert/strict";
import {
  VISION_VALIDATION_VERSION,
  VISION_VALIDATION_GOLDEN_RULE,
  VISION_VALIDATION_PIPELINE,
  VISION_VALIDATION_POSITION,
  VisionValidationStage,
  VISION_MIN_APPROVAL_SCORE,
  HERO_PRODUCT_CRITICAL_RATIO,
  validateHeroProduct,
  buildPlannedVisionReport,
  computeVisionLayerScores,
  planVisionRetryTargets,
  runVisionValidationStage,
  runVisionValidationStageFromPipeline,
  enrichPipelineContextWithVisionValidation,
  validateVisionValidationStage,
  assertVisionValidationStage,
  runVisionValidationStageSystem,
  isVisionValidationStageFailure,
  runRenderAdapterStageFromPipeline,
  runRenderingStageSyncFromPipeline,
  runBlueprintAssemblyStageFromPipeline,
  analyzeProduct,
  buildDefaultPipelineInput,
  runKnowledgeRetrievalStage,
  deriveVisionSignals,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  buildDefaultProductAnalysisInput,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  executeDesignPipelineStage,
} from "./index";

function visionValidationInput() {
  const adapter = runRenderAdapterStageFromPipeline({ providerId: "flux" });
  const rendering = runRenderingStageSyncFromPipeline({ providerId: "flux" });
  const assembly = runBlueprintAssemblyStageFromPipeline();
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildDefaultProductAnalysisInput());
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section!.profile,
    marketplace: pipelineInput.marketplace,
  });
  return {
    profile: analysis.section!.profile,
    blueprint: adapter.section!.blueprint,
    renderResult: rendering.section!.plannedResult,
    imageRef: rendering.section!.imageRef,
    constraintSet: assembly.section!.constraintSet,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
  };
}

function testGoldenRule() {
  assert.ok(VISION_VALIDATION_GOLDEN_RULE.toLowerCase().includes("blueprint"));
  assert.ok(VISION_VALIDATION_GOLDEN_RULE.includes("without visual defects"));
  console.log("✔ golden rule — vision compares image to blueprint, not beauty");
}

function testVersionAndPipeline() {
  assert.equal(VISION_VALIDATION_VERSION, "6.14.0");
  assert.equal(VISION_VALIDATION_PIPELINE.length, 15);
  assert.equal(VISION_VALIDATION_PIPELINE[0], VisionValidationStage.INPUT_ASSEMBLY);
  assert.equal(VISION_VALIDATION_PIPELINE[14], VisionValidationStage.STAGE_COMPLETE);
  assert.deepEqual(VISION_VALIDATION_POSITION, ["render-provider", "vision-analysis", "commercial-validation"]);
  console.log("✔ vision validation stage pipeline has 15 internal stages");
}

function testHighLevelPipelinePosition() {
  const vision = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.VISION_ANALYSIS)!;
  assert.equal(vision.order, 13);
  assert.equal(vision.makesDesignDecision, false);
  assert.ok(vision.agentIds?.includes("vision-quality-director"));
  console.log("✔ vision analysis is stage 13 in design pipeline");
}

function testHeroProductValidation() {
  const signals = deriveVisionSignals("data:image/png;base64,mock");
  const critical = validateHeroProduct({ ...signals, productAreaRatio: 0.2 }, {
    composition: { heroArea: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 } },
  } as never);
  assert.ok(critical.some((v) => v.severity === "critical"));
  assert.ok(critical[0]!.actual === "20%");
  console.log("✔ hero product validation flags critical undersized product");
}

function testPlannedVisionReportShape() {
  const report = runVisionValidationStageFromPipeline();
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  const planned = report.section!.plannedReport;
  assert.ok(planned.overallScore > 0);
  assert.ok(typeof planned.technicalScore === "number");
  assert.ok(typeof planned.compositionScore === "number");
  assert.ok(typeof planned.photographyScore === "number");
  assert.ok(typeof planned.renderAccuracy === "number");
  assert.ok(typeof planned.artifactScore === "number");
  assert.ok(Array.isArray(planned.violations));
  assert.ok(Array.isArray(planned.recommendations));
  assert.equal(typeof planned.approved, "boolean");
  console.log("✔ planned vision report matches Chapter 6.14 contract");
}

function testBlueprintMatching() {
  const report = runVisionValidationStageFromPipeline();
  assert.ok(report.section!.explainability.blueprintSectionsChecked.includes("scene"));
  assert.ok(report.section!.explainability.blueprintSectionsChecked.includes("lighting"));
  assert.ok(report.section!.layerScores.blueprintMatching > 0);
  console.log("✔ blueprint matching compares image against director sections");
}

function testArtifactDetection() {
  const report = runVisionValidationStageFromPipeline({ injectCriticalArtifact: true });
  assert.equal(report.section!.plannedReport.approved, false);
  assert.ok(report.section!.plannedReport.violations.length > 0);
  assert.ok(report.section!.plannedReport.recommendations.length > 0);
  console.log("✔ artifact detection blocks approval and plans retry");
}

function testHeroTooSmallBlocksApproval() {
  const report = runVisionValidationStageFromPipeline({ injectHeroTooSmall: true });
  assert.equal(report.section!.plannedReport.approved, false);
  assert.ok(report.section!.plannedReport.violations.some((v) => v.id === "hero-product-too-small"));
  console.log("✔ hero product too small triggers critical violation");
}

function testVisionScoreThreshold() {
  const report = runVisionValidationStageFromPipeline();
  if (report.section!.plannedReport.approved) {
    assert.ok(report.section!.plannedReport.overallScore >= VISION_MIN_APPROVAL_SCORE);
  }
  console.log("✔ approved images meet minimum vision score threshold");
}

function testRetryRecommendations() {
  const input = visionValidationInput();
  const report = runVisionValidationStage(input, { injectLightingDrift: true });
  const targets = report.section!.plannedReport.recommendations.map((r) => r.target);
  assert.ok(targets.length > 0);
  console.log("✔ vision validation produces targeted retry recommendations");
}

function testPipelineFromRendering() {
  const report = runVisionValidationStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.stagesCompleted.includes(VisionValidationStage.VISION_SCORE));
  assert.ok(report.section!.stagesCompleted.includes(VisionValidationStage.STAGE_COMPLETE));
  console.log("✔ rendering → vision validation chain completes");
}

function testContextEnrichment() {
  resetPipelineContextStores();
  const report = runVisionValidationStageFromPipeline();
  const ctx = createGenerationPipelineContext();
  const enriched = enrichPipelineContextWithVisionValidation(ctx, report.section!);
  assert.equal(enriched.context.validation.visionScore, report.section!.plannedReport.overallScore);
  console.log("✔ pipeline context enriched with vision score");
}

function testDesignPipelineStageExecution() {
  const result = executeDesignPipelineStage(DesignPipelineStage.VISION_ANALYSIS, buildDefaultPipelineInput());
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(VISION_ANALYSIS) passes default kitchen pipeline");
}

function testSystemValidation() {
  const report = validateVisionValidationStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.blueprintCompared, true);
  assert.equal(report.artifactsDetected, true);
  assert.equal(report.explainabilityComplete, true);
  assert.equal(report.downstreamReady, true);
  assert.doesNotThrow(() => assertVisionValidationStage());
  assert.equal(runVisionValidationStageSystem().valid, true);
  assert.equal(isVisionValidationStageFailure("HERO_PRODUCT_LOST"), true);
  console.log("✔ system validation confirms vision validation stage contract");
}

function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testHeroProductValidation();
  testPlannedVisionReportShape();
  testBlueprintMatching();
  testArtifactDetection();
  testHeroTooSmallBlocksApproval();
  testVisionScoreThreshold();
  testRetryRecommendations();
  testPipelineFromRendering();
  testContextEnrichment();
  testDesignPipelineStageExecution();
  testSystemValidation();
  console.log("\nvision-validation-stage.spec.ts — all passed");
}

run();

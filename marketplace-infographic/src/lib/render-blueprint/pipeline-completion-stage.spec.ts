/**
 * DESIGN AI v18 — Pipeline Completion & Delivery Stage tests (Chapter 6.18)
 */
import assert from "node:assert/strict";
import {
  PIPELINE_COMPLETION_VERSION,
  PIPELINE_COMPLETION_GOLDEN_RULE,
  PIPELINE_COMPLETION_PIPELINE,
  PIPELINE_COMPLETION_POSITION,
  PipelineCompletionStage,
  ProjectCompletionStatus,
  PipelineFinalizationState,
  buildPlannedFinalProject,
  buildArtifactStorage,
  buildDeliveryPackage,
  registerProjectMetrics,
  updatePlatformAnalytics,
  buildReproducibilityRecord,
  determineProjectStatus,
  runPipelineCompletionStage,
  runPipelineCompletionStageFromPipeline,
  enrichPipelineContextWithPipelineCompletion,
  validatePipelineCompletionStage,
  assertPipelineCompletionStage,
  runPipelineCompletionStageSystem,
  isPipelineCompletionStageFailure,
  getRegisteredProject,
  getStoredArtifacts,
  resetPipelineCompletionStores,
  runLearningFeedbackStageFromPipeline,
  runRenderAdapterStageFromPipeline,
  runRenderingStageSyncFromPipeline,
  runConsensusValidationStageFromPipeline,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  executeDesignPipelineStage,
  buildDefaultPipelineInput,
} from "./index";

function completionInput() {
  const learning = runLearningFeedbackStageFromPipeline();
  const adapter = runRenderAdapterStageFromPipeline();
  const rendering = runRenderingStageSyncFromPipeline();
  const consensus = runConsensusValidationStageFromPipeline();

  return {
    learningPackage: learning.section!.learningPackage,
    renderPrompt: adapter.section!.plannedRequest.positivePrompt,
    negativePrompt: adapter.section!.plannedRequest.negativePrompt,
    providerParameters: {
      provider: rendering.section!.plannedResult.provider,
      seed: rendering.section!.renderRequest.seed,
      width: rendering.section!.renderRequest.width,
      height: rendering.section!.renderRequest.height,
    },
    generationTimeMs: rendering.section!.plannedResult.generationTime,
    consensusReportId: `consensus-${learning.section!.learningPackage.projectId}`,
    pipelineSnapshots: [`snapshot-${learning.section!.learningPackage.projectId}`],
  };
}

function testGoldenRule() {
  assert.ok(PIPELINE_COMPLETION_GOLDEN_RULE.toLowerCase().includes("iceberg"));
  assert.ok(
    PIPELINE_COMPLETION_GOLDEN_RULE.includes("reproducible") ||
      PIPELINE_COMPLETION_GOLDEN_RULE.includes("intellectual history"),
  );
  console.log("✔ golden rule — completion preserves full project history");
}

function testVersionAndPipeline() {
  assert.equal(PIPELINE_COMPLETION_VERSION, "6.18.0");
  assert.equal(PIPELINE_COMPLETION_PIPELINE.length, 15);
  assert.equal(PIPELINE_COMPLETION_PIPELINE[0], PipelineCompletionStage.INPUT_ASSEMBLY);
  assert.equal(PIPELINE_COMPLETION_PIPELINE[14], PipelineCompletionStage.STAGE_COMPLETE);
  assert.deepEqual(PIPELINE_COMPLETION_POSITION, [
    "learning-feedback",
    "pipeline-completion",
    "user-delivery",
  ]);
  console.log("✔ pipeline completion stage has 15 internal stages");
}

function testHighLevelPipelinePosition() {
  const completion = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.PIPELINE_COMPLETION)!;
  assert.equal(completion.order, 19);
  assert.equal(completion.makesDesignDecision, false);
  assert.equal(HIGH_LEVEL_PIPELINE.length, 20);
  console.log("✔ pipeline completion is stage 19 in design pipeline");
}

function testPlannedFinalProjectShape() {
  resetPipelineCompletionStores();
  const report = runPipelineCompletionStageFromPipeline();
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  const project = report.section!.finalProject;
  assert.ok(project.projectId);
  assert.ok(project.image.ref);
  assert.equal(project.image.format, "png");
  assert.ok(project.blueprint);
  assert.ok(project.vision.overallScore > 0);
  assert.ok(project.commercial.commercialScore > 0);
  assert.ok(project.director.professionalLevel > 0);
  assert.ok(project.learning.projectId);
  assert.ok(project.metadata.patternsUsed.length > 0);
  console.log("✔ planned final project matches Chapter 6.18 contract");
}

function testArtifactStorage() {
  const input = completionInput();
  const artifacts = buildArtifactStorage(input);
  assert.ok(artifacts.renderPrompt.length > 0);
  assert.ok(artifacts.blueprint.meta.id);
  assert.ok(artifacts.pipelineSnapshots.length > 0);
  assert.ok(artifacts.finalScores.professionalScore > 0);
  console.log("✔ all engineering artifacts stored for reproducibility");
}

function testDeliveryPackage() {
  const input = completionInput();
  const image = { ref: input.learningPackage.imageRef, format: "png", width: 1024, height: 1024 };
  const project = buildPlannedFinalProject(input.learningPackage, image, input.generationTimeMs);
  const artifacts = buildArtifactStorage(input);
  const delivery = buildDeliveryPackage(project, artifacts);
  assert.ok(delivery.imagePng);
  assert.ok(delivery.blueprintRef.includes("blueprint://"));
  assert.ok(delivery.commercialReportRef.includes("commercial"));
  assert.ok(delivery.artifacts.some((a) => a.type === "image"));
  assert.ok(delivery.artifacts.some((a) => a.type === "blueprint"));
  console.log("✔ delivery package includes image, blueprint, and reports");
}

function testProjectRegistration() {
  resetPipelineCompletionStores();
  const report = runPipelineCompletionStageFromPipeline();
  const projectId = report.section!.finalProject.projectId;
  assert.ok(getRegisteredProject(projectId));
  assert.ok(getStoredArtifacts(projectId));
  console.log("✔ project registered with artifacts in completion store");
}

function testMetricsAndAnalytics() {
  const input = completionInput();
  const metrics = registerProjectMetrics(input.learningPackage, input.generationTimeMs);
  const analytics = updatePlatformAnalytics(input.learningPackage);
  assert.ok(metrics.visionScore > 0);
  assert.ok(metrics.commercialScore > 0);
  assert.ok(metrics.professionalScore > 0);
  assert.ok(analytics.patternEffectiveness > 0);
  assert.ok(analytics.sampleCount > 0);
  console.log("✔ metrics and analytics updated after completion");
}

function testReproducibilityRecord() {
  const input = completionInput();
  const record = buildReproducibilityRecord(input);
  assert.ok(record.pipelineVersion);
  assert.ok(record.knowledgeEngineVersion);
  assert.ok(record.blueprintChecksum.startsWith("bp-"));
  console.log("✔ reproducibility record captures versions and blueprint checksum");
}

function testProjectStatusCompleted() {
  const input = completionInput();
  const status = determineProjectStatus(input.learningPackage);
  assert.ok(
    status === ProjectCompletionStatus.COMPLETED ||
      status === ProjectCompletionStatus.COMPLETED_WITH_NOTES,
  );
  console.log("✔ successful kitchen pipeline receives completed status");
}

function testLearningOnlyStatus() {
  const report = runPipelineCompletionStageFromPipeline({ injectLearningOnly: true });
  assert.equal(report.section!.projectStatus, ProjectCompletionStatus.LEARNING_ONLY);
  console.log("✔ learning-only projects receive learning_only status");
}

function testCorruptedExportBlocked() {
  const report = runPipelineCompletionStage(completionInput(), { injectCorruptedExport: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "DELIVERY_FAILED"));
  console.log("✔ corrupted export blocks user delivery");
}

function testDoesNotMutateBlueprint() {
  const input = completionInput();
  const before = JSON.stringify(input.learningPackage.blueprint);
  const report = runPipelineCompletionStage(input);
  assert.equal(report.valid, true);
  assert.equal(JSON.stringify(input.learningPackage.blueprint), before);
  console.log("✔ completion stage does not mutate blueprint");
}

function testPipelineChain() {
  const report = runPipelineCompletionStageFromPipeline();
  assert.equal(report.valid, true);
  assert.equal(report.section!.pipelineState, PipelineFinalizationState.COMPLETED);
  assert.ok(report.section!.stagesCompleted.includes(PipelineCompletionStage.PIPELINE_FINALIZATION));
  console.log("✔ learning → pipeline completion chain completes");
}

function testContextEnrichment() {
  resetPipelineContextStores();
  const report = runPipelineCompletionStageFromPipeline();
  const ctx = createGenerationPipelineContext();
  const enriched = enrichPipelineContextWithPipelineCompletion(ctx, report.section!);
  assert.equal(enriched.context.learning.feedbackCollected, true);
  assert.ok(enriched.context.validation.professionalScore > 0);
  console.log("✔ pipeline context enriched with completion state");
}

function testDesignPipelineStageExecution() {
  const result = executeDesignPipelineStage(
    DesignPipelineStage.PIPELINE_COMPLETION,
    buildDefaultPipelineInput(),
  );
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(PIPELINE_COMPLETION) passes default kitchen pipeline");
}

function testSystemValidation() {
  resetPipelineCompletionStores();
  const report = validatePipelineCompletionStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.finalProjectBuilt, true);
  assert.equal(report.artifactsStored, true);
  assert.equal(report.analyticsUpdated, true);
  assert.equal(report.deliveryReady, true);
  assert.equal(report.reproducibilityRecorded, true);
  assert.equal(report.downstreamReady, true);
  assert.doesNotThrow(() => assertPipelineCompletionStage());
  assert.equal(runPipelineCompletionStageSystem().valid, true);
  assert.equal(isPipelineCompletionStageFailure("BLUEPRINT_LOST"), true);
  console.log("✔ system validation confirms pipeline completion stage contract");
}

function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testPlannedFinalProjectShape();
  testArtifactStorage();
  testDeliveryPackage();
  testProjectRegistration();
  testMetricsAndAnalytics();
  testReproducibilityRecord();
  testProjectStatusCompleted();
  testLearningOnlyStatus();
  testCorruptedExportBlocked();
  testDoesNotMutateBlueprint();
  testPipelineChain();
  testContextEnrichment();
  testDesignPipelineStageExecution();
  testSystemValidation();
  console.log("\npipeline-completion-stage.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Design Pipeline tests (Chapter 6)
 */
import assert from "node:assert/strict";
import {
  DESIGN_PIPELINE_VERSION,
  DESIGN_PIPELINE_GOLDEN_RULE,
  LEGACY_GENERIC_AI_PIPELINE,
  HIGH_LEVEL_PIPELINE,
  PIPELINE_LAYERS,
  PIPELINE_PRINCIPLES,
  DesignPipelineStage,
  DesignPipelineLayer,
  DesignPipelinePrinciple,
  getDesignPipelineStage,
  getPipelineLayer,
  mapStageToLayer,
  validatePipelineStageOrder,
  validatePipelineLayerCoverage,
  validatePipelineInput,
  validatePipelineOutputContract,
  validatePipelineOrchestrationOnly,
  validatePipelineStageContracts,
  canRetryStageIndependently,
  validatePipelineIndependentRetry,
  validatePipelineIncrementalBlueprint,
  validatePipelineDeterminism,
  buildDefaultPipelineInput,
  executeDesignPipelineStage,
  runDesignPipeline,
  validateDesignPipeline,
  assertDesignPipeline,
  runDesignPipelineValidation,
  isDesignPipelineFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(DESIGN_PIPELINE_GOLDEN_RULE.includes("does not create images"));
  assert.equal(DESIGN_PIPELINE_VERSION, "6.0.0");
  console.log("✔ golden rule — pipeline organizes specialists, not images");
}

function testHighLevelPipeline() {
  assert.equal(HIGH_LEVEL_PIPELINE.length, 19);
  assert.equal(HIGH_LEVEL_PIPELINE[16].id, DesignPipelineStage.APPROVED_BLUEPRINT);
  assert.equal(HIGH_LEVEL_PIPELINE[17].id, DesignPipelineStage.KNOWLEDGE_LEARNING);
  assert.equal(HIGH_LEVEL_PIPELINE[18].id, DesignPipelineStage.PIPELINE_COMPLETION);
  console.log("✔ high-level pipeline — business goal to pipeline completion");
}

function testPipelineLayers() {
  assert.equal(PIPELINE_LAYERS.length, 7);
  assert.equal(PIPELINE_LAYERS[0].id, DesignPipelineLayer.INPUT);
  assert.equal(PIPELINE_LAYERS[6].id, DesignPipelineLayer.LEARNING);
  console.log("✔ pipeline layers — input to knowledge to creative to learning");
}

function testGenericAiContrast() {
  assert.deepEqual(LEGACY_GENERIC_AI_PIPELINE, ["user", "prompt", "llm", "image"]);
  assert.ok(!LEGACY_GENERIC_AI_PIPELINE.includes("business_goal"));
  console.log("✔ design philosophy — not user prompt llm image");
}

function testPipelinePrinciples() {
  assert.equal(PIPELINE_PRINCIPLES.length, 6);
  assert.ok(PIPELINE_PRINCIPLES.includes(DesignPipelinePrinciple.DETERMINISTIC));
  assert.ok(PIPELINE_PRINCIPLES.includes(DesignPipelinePrinciple.INCREMENTAL_BLUEPRINT));
  console.log("✔ pipeline principles — deterministic, contracts, incremental blueprint");
}

function testStageOrder() {
  assert.equal(validatePipelineStageOrder().length, 0);
  const knowledge = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.KNOWLEDGE_RETRIEVAL)!;
  const business = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.BUSINESS_UNDERSTANDING)!;
  const story = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.VISUAL_STORY_PLANNING)!;
  assert.ok(knowledge.order < business.order);
  assert.ok(business.order < story.order);
  console.log("✔ stage order — knowledge retrieval and business understanding before creative planning");
}

function testLayerCoverage() {
  assert.equal(validatePipelineLayerCoverage().length, 0);
  for (const stage of HIGH_LEVEL_PIPELINE) {
    assert.ok(mapStageToLayer(stage.id));
  }
  console.log("✔ layer coverage — every stage mapped to a layer");
}

function testPipelineInput() {
  const input = buildDefaultPipelineInput();
  assert.equal(validatePipelineInput(input).length, 0);
  assert.ok(input.businessGoal.length > 3);
  const bad = validatePipelineInput(input, { promptOnlyInput: true });
  assert.ok(bad.some((v) => v.code === "PROMPT_ONLY_INPUT"));
  console.log("✔ pipeline input — business goal not prompt");
}

function testPipelineOutput() {
  const output = {
    blueprintId: "bp-1",
    renderPrompt: "prompt",
    imageRef: "img.png",
    visionReportId: "vision-1",
    commercialReportId: "commercial-1",
    learningPackageId: "learning-1",
    designMemoryUpdated: true,
  };
  assert.equal(validatePipelineOutputContract(output).length, 0);
  console.log("✔ pipeline output — blueprint, image, reports, learning package");
}

function testOrchestrationOnly() {
  assert.equal(validatePipelineOrchestrationOnly().length, 0);
  const bad = validatePipelineOrchestrationOnly({ pipelineMakesDesignDecision: true });
  assert.ok(bad.some((v) => v.code === "PIPELINE_MAKES_DESIGN_DECISION"));
  const orchestration = HIGH_LEVEL_PIPELINE.filter((s) => !s.makesDesignDecision);
  assert.ok(orchestration.length >= 10);
  console.log("✔ pipeline responsibility — orchestration only, agents decide design");
}

function testStageContracts() {
  assert.equal(validatePipelineStageContracts().length, 0);
  const stage = getDesignPipelineStage(DesignPipelineStage.COMPOSITION_PLANNING)!;
  assert.ok(stage.agentIds?.includes("composition-director"));
  console.log("✔ stage contracts — each stage has responsibility and agent ownership");
}

function testIndependentRetry() {
  assert.equal(validatePipelineIndependentRetry().length, 0);
  assert.equal(canRetryStageIndependently(DesignPipelineStage.COMPOSITION_PLANNING), true);
  const retry = getDesignPipelineStage(DesignPipelineStage.RETRY)!;
  assert.equal(retry.optional, true);
  console.log("✔ independent retry — localized recovery without full restart");
}

function testIncrementalBlueprint() {
  assert.equal(validatePipelineIncrementalBlueprint().length, 0);
  const bad = validatePipelineIncrementalBlueprint({ fullBlueprintRewrite: true });
  assert.ok(bad.some((v) => v.code === "BLUEPRINT_REWRITE"));
  console.log("✔ incremental blueprint — extend not rewrite");
}

function testDeterminism() {
  assert.equal(validatePipelineDeterminism().length, 0);
  const bad = validatePipelineDeterminism({ nonDeterministic: true });
  assert.ok(bad.some((v) => v.code === "NON_DETERMINISTIC"));
  console.log("✔ deterministic pipeline — repeatable execution");
}

function testKnowledgeRetrievalStage() {
  const input = buildDefaultPipelineInput();
  const result = executeDesignPipelineStage(DesignPipelineStage.KNOWLEDGE_RETRIEVAL, input);
  assert.equal(result.passed, true);
  console.log("✔ knowledge layer — retrieval integrated before creative stages");
}

function testRunDesignPipeline() {
  const run = runDesignPipeline();
  assert.ok(run.stages.length >= 15);
  assert.ok(run.output?.blueprintId);
  assert.equal(run.learningExecuted, true);
  console.log("✔ run design pipeline — full lifecycle execution");
}

function testValidateDesignPipeline() {
  const report = validateDesignPipeline();
  assert.equal(report.valid, true);
  assert.equal(report.stageCount, 19);
  assert.equal(report.layerCount, 7);
  assert.equal(report.principlesSatisfied, true);
  assert.equal(report.learningIntegrated, true);
  assertDesignPipeline();
  console.log("✔ design pipeline system validation passes");
}

function testRunDesignPipelineValidation() {
  const report = runDesignPipelineValidation();
  assert.equal(report.valid, true);
  assert.equal(report.scalable, true);
  console.log("✔ runDesignPipelineValidation entry point works");
}

function testFailureCodes() {
  assert.equal(isDesignPipelineFailure("PROMPT_ONLY_INPUT"), true);
  assert.equal(isDesignPipelineFailure("UNKNOWN"), false);
  console.log("✔ design pipeline failure codes are catalogued");
}

function testLayerLookup() {
  const creative = getPipelineLayer(DesignPipelineLayer.CREATIVE)!;
  assert.ok(creative.stages.includes(DesignPipelineStage.VISUAL_STORY_PLANNING));
  assert.equal(mapStageToLayer(DesignPipelineStage.RENDER_ADAPTER), DesignPipelineLayer.RENDERING);
  console.log("✔ layer lookup — creative and rendering stages resolved");
}

function run() {
  testGoldenRule();
  testHighLevelPipeline();
  testPipelineLayers();
  testGenericAiContrast();
  testPipelinePrinciples();
  testStageOrder();
  testLayerCoverage();
  testPipelineInput();
  testPipelineOutput();
  testOrchestrationOnly();
  testStageContracts();
  testIndependentRetry();
  testIncrementalBlueprint();
  testDeterminism();
  testKnowledgeRetrievalStage();
  testRunDesignPipeline();
  testValidateDesignPipeline();
  testRunDesignPipelineValidation();
  testFailureCodes();
  testLayerLookup();
  console.log("\ndesign-pipeline.spec.ts — all passed");
}

run();

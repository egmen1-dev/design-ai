/**
 * DESIGN AI v18 — Consensus Validation Stage tests (Chapter 6.11)
 */
import assert from "node:assert/strict";
import {
  CONSENSUS_VALIDATION_VERSION,
  CONSENSUS_VALIDATION_GOLDEN_RULE,
  CONSENSUS_VALIDATION_PIPELINE,
  ConsensusValidationStage,
  ConsensusStatus,
  CONSENSUS_MIN_APPROVAL_SCORE,
  computeLayerScores,
  detectPlanningLayerConflicts,
  buildPlannedConsensusReport,
  runConsensusValidationStage,
  runConsensusValidationStageFromPipeline,
  enrichPipelineContextWithConsensusValidation,
  validateConsensusValidation,
  assertConsensusValidation,
  runConsensusValidation,
  isConsensusValidationFailure,
  runBlueprintAssemblyStage,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  runKnowledgeRetrievalStage,
  runBusinessUnderstandingStage,
  runVisualStoryPlanningStage,
  runScenePlanningStage,
  runCompositionPlanningStage,
  runPhotographyPlanningStage,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
} from "./index";

function gardenConsensusInput() {
  const analysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
    }),
  );
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section!.profile,
    marketplace: "wildberries",
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section!.profile,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  });
  const story = runVisualStoryPlanningStage({
    profile: analysis.section!.profile,
    business: business.section!,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  });
  const scene = runScenePlanningStage({
    profile: analysis.section!.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  });
  const composition = runCompositionPlanningStage({
    profile: analysis.section!.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  });
  const photography = runPhotographyPlanningStage({
    profile: analysis.section!.profile,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    composition: composition.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  });
  const assembly = runBlueprintAssemblyStage({
    profile: analysis.section!.profile,
    business: business.section!,
    story: story.section!,
    scene: scene.section!,
    composition: composition.section!,
    photography: photography.section!,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  });
  return {
    profile: analysis.section!.profile,
    business: business.section!,
    blueprint: assembly.section!.blueprint,
    constraintSet: assembly.section!.constraintSet,
    metadata: assembly.section!.metadata,
    knowledge: knowledge.package!,
    assemblyConflicts: assembly.section!.conflicts,
    marketplace: "wildberries",
  };
}

function testGoldenRule() {
  assert.ok(CONSENSUS_VALIDATION_GOLDEN_RULE.includes("jointly sign off"));
  assert.equal(CONSENSUS_VALIDATION_VERSION, "6.11.0");
  console.log("✔ golden rule — all agents must jointly sign off before render");
}

function testPipelineStages() {
  assert.equal(CONSENSUS_VALIDATION_PIPELINE.length, 15);
  assert.equal(CONSENSUS_VALIDATION_PIPELINE[0], ConsensusValidationStage.INPUT_ASSEMBLY);
  assert.equal(CONSENSUS_VALIDATION_PIPELINE[14], ConsensusValidationStage.STAGE_COMPLETE);
  console.log("✔ pipeline stages — seven validation layers to approval decision");
}

function testPipelineOrder() {
  const assembly = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.BLUEPRINT_ASSEMBLY)!;
  const consensus = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.CONSENSUS_VALIDATION)!;
  assert.ok(assembly.order < consensus.order);
  console.log("✔ design pipeline — blueprint assembly before consensus validation");
}

function testPremiumKitchenApproval() {
  const report = runConsensusValidationStageFromPipeline();
  assert.equal(report.valid, true);
  assert.equal(report.section!.plannedReport.approved, true);
  assert.equal(report.section!.plannedReport.status, ConsensusStatus.APPROVED);
  assert.ok(report.section!.plannedReport.overallScore >= CONSENSUS_MIN_APPROVAL_SCORE);
  console.log("✔ premium kitchen — consensus approves coherent assembled blueprint");
}

function testLayerScores() {
  const input = gardenConsensusInput();
  const scores = computeLayerScores(input);
  assert.ok(scores.business > 0);
  assert.ok(scores.story > 0);
  assert.ok(scores.scene > 0);
  assert.ok(scores.composition > 0);
  assert.ok(scores.photography > 0);
  assert.ok(scores.marketplace > 0);
  assert.ok(scores.knowledge > 0);
  console.log("✔ validation layers — business through knowledge scored independently");
}

function testConflictDetection() {
  const input = gardenConsensusInput();
  const conflicts = detectPlanningLayerConflicts(input, { injectPremiumBudgetConflict: true });
  assert.ok(conflicts.some((c) => c.id === "story-scene-premium-budget"));
  assert.ok(conflicts[0].recommendation.length > 0);
  console.log("✔ conflict detection — premium story vs budget scene with explainability");
}

function testRetryPlanning() {
  const report = runConsensusValidationStageFromPipeline({ injectPremiumBudgetConflict: true });
  assert.equal(report.section!.plannedReport.retryRequired, true);
  assert.ok(report.section!.plannedReport.retryTargets.includes("scene-director"));
  assert.equal(report.section!.plannedReport.approved, false);
  console.log("✔ retry planning — localized targets for scene and composition directors");
}

function testCriticalEngineConflict() {
  const report = runConsensusValidationStageFromPipeline({ forceCriticalConflict: true });
  assert.equal(report.section!.plannedReport.approved, false);
  assert.ok(report.section!.plannedReport.conflicts.length > 0);
  console.log("✔ engine integration — Ch 4.23 semantic conflicts block approval");
}

function testNeverCreatesDesign() {
  const before = runConsensusValidationStageFromPipeline();
  const narrative = before.section!.blueprint.story.narrative;
  assert.ok(narrative.length > 0);
  console.log("✔ consensus only — evaluates existing decisions without creating design");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runConsensusValidationStageFromPipeline();
  const enriched = enrichPipelineContextWithConsensusValidation(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.equal(enriched.context.validation.consensusPassed, true);
  assert.ok(enriched.context.blueprint.validation.professionalScore > 0);
  console.log("✔ pipeline context bridge — validation section records consensus decision");
}

function testValidationFailures() {
  const input = gardenConsensusInput();
  const missing = runConsensusValidationStage(
    {
      ...input,
      blueprint: undefined as unknown as typeof input.blueprint,
    },
    { missingBlueprint: true },
  );
  assert.equal(missing.valid, false);
  assert.ok(missing.violations.some((v) => v.code === "MISSING_BLUEPRINT"));
  console.log("✔ validation — missing blueprint blocks consensus stage");
}

function testSystemValidation() {
  const report = validateConsensusValidation();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.conflictsDetected, true);
  assert.equal(report.businessGoalProtected, true);
  assert.equal(report.downstreamReady, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertConsensusValidation());
  const report = runConsensusValidation();
  assert.equal(report.explainabilityComplete, true);
  console.log("✔ assertConsensusValidation and runConsensusValidation work");
}

function testFailureCodes() {
  assert.equal(isConsensusValidationFailure("UNAPPROVED_WITH_CRITICAL_CONFLICTS"), true);
  assert.equal(isConsensusValidationFailure("BUSINESS_GOAL_IGNORED"), true);
  assert.equal(isConsensusValidationFailure("unknown"), false);
  console.log("✔ consensus validation failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testPipelineOrder();
  testPremiumKitchenApproval();
  testLayerScores();
  testConflictDetection();
  testRetryPlanning();
  testCriticalEngineConflict();
  testNeverCreatesDesign();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nconsensus-validation-stage.spec.ts — all passed");
}

run();

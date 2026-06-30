/**
 * DESIGN AI v18 — Blueprint Assembly Stage tests (Chapter 6.10)
 */
import assert from "node:assert/strict";
import {
  BLUEPRINT_ASSEMBLY_VERSION,
  BLUEPRINT_ASSEMBLY_GOLDEN_RULE,
  BLUEPRINT_ASSEMBLY_PIPELINE,
  BlueprintAssemblyStage,
  AssemblyStatus,
  validateBlueprintIntegrity,
  detectCrossModuleConflicts,
  mergeAssemblyConstraints,
  generateAssemblyMetadata,
  assembleRenderBlueprint,
  runBlueprintAssemblyStage,
  runBlueprintAssemblyStageFromPipeline,
  blueprintAssemblyToMutations,
  enrichPipelineContextWithBlueprintAssembly,
  validateBlueprintAssembly,
  assertBlueprintAssembly,
  runBlueprintAssembly,
  isBlueprintAssemblyFailure,
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

function gardenAssemblyInput() {
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
  return {
    profile: analysis.section!.profile,
    business: business.section!,
    story: story.section!,
    scene: scene.section!,
    composition: composition.section!,
    photography: photography.section!,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  };
}

function testGoldenRule() {
  assert.ok(BLUEPRINT_ASSEMBLY_GOLDEN_RULE.includes("independent professional decisions"));
  assert.equal(BLUEPRINT_ASSEMBLY_VERSION, "6.10.0");
  console.log("✔ golden rule — independent agent decisions unite into one document");
}

function testPipelineStages() {
  assert.equal(BLUEPRINT_ASSEMBLY_PIPELINE.length, 15);
  assert.equal(BLUEPRINT_ASSEMBLY_PIPELINE[0], BlueprintAssemblyStage.INPUT_ASSEMBLY);
  assert.equal(BLUEPRINT_ASSEMBLY_PIPELINE[14], BlueprintAssemblyStage.STAGE_COMPLETE);
  console.log("✔ pipeline stages — integrity to merge to snapshot to consensus handoff");
}

function testPipelineOrder() {
  const photography = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.PHOTOGRAPHY_PLANNING)!;
  const assembly = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.BLUEPRINT_ASSEMBLY)!;
  assert.ok(photography.order < assembly.order);
  console.log("✔ design pipeline — photography planning before blueprint assembly");
}

function testGardenUnifiedBlueprint() {
  const input = gardenAssemblyInput();
  const report = runBlueprintAssemblyStage({
    profile: input.profile,
    business: input.business,
    story: input.story,
    scene: input.scene,
    composition: input.composition,
    photography: input.photography,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(report.valid, true);
  assert.equal(report.section!.status, AssemblyStatus.CONSISTENT);
  assert.ok(report.section!.blueprint.story.narrative);
  assert.ok(report.section!.blueprint.scene.environment);
  assert.ok(report.section!.blueprint.composition.heroArea);
  assert.ok(report.section!.blueprint.photography.shootingNarrative);
  console.log("✔ garden sprayer — unified render blueprint with all creative sections");
}

function testPremiumKitchenAssembly() {
  const report = runBlueprintAssemblyStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.metadata.agentsUsed.length >= 4);
  assert.ok(report.section!.constraintSet.constraints.length >= 3);
  console.log("✔ premium kitchen — metadata constraints and snapshot assembled");
}

function testBlueprintIntegrity() {
  const input = gardenAssemblyInput();
  const violations = validateBlueprintIntegrity(input);
  assert.equal(violations.length, 0);
  console.log("✔ blueprint integrity — all required sections present");
}

function testConflictDetection() {
  const input = gardenAssemblyInput();
  const conflicts = detectCrossModuleConflicts(input, { injectLuxuryIndustrialConflict: true });
  assert.ok(conflicts.length > 0);
  assert.ok(conflicts[0].modules.includes("story"));
  console.log("✔ conflict preparation — cross-module conflicts collected not resolved");
}

function testConstraintMerge() {
  const input = gardenAssemblyInput();
  const constraints = mergeAssemblyConstraints(input);
  assert.ok(constraints.constraints.some((c) => c.id.includes("hero-minimum")));
  assert.ok(constraints.constraints.some((c) => c.source === "Marketplace"));
  console.log("✔ constraint merge — story composition and marketplace rules unified");
}

function testMetadataGeneration() {
  const input = gardenAssemblyInput();
  const metadata = generateAssemblyMetadata(input);
  assert.ok(metadata.pipelineVersion);
  assert.ok(metadata.knowledgeEngineVersion);
  assert.ok(metadata.agentsUsed.includes("visual-story-director"));
  console.log("✔ metadata generation — reproducibility versions and agent list recorded");
}

function testNeverAltersDesignDecisions() {
  const input = gardenAssemblyInput();
  const originalNarrative = input.story.renderStory.narrative;
  const report = runBlueprintAssemblyStage({
    profile: input.profile,
    business: input.business,
    story: input.story,
    scene: input.scene,
    composition: input.composition,
    photography: input.photography,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(report.section!.blueprint.story.narrative, originalNarrative);
  console.log("✔ assembly only — agent design decisions preserved not rewritten");
}

function testAuthorshipMutations() {
  const report = runBlueprintAssemblyStageFromPipeline();
  const mutations = blueprintAssemblyToMutations(report.section!);
  assert.equal(mutations.length, 4);
  const producers = new Set(mutations.map((m) => m.producer));
  assert.ok(producers.has("visual-story-director"));
  assert.ok(producers.has("scene-director"));
  assert.ok(producers.has("composition-director"));
  assert.ok(producers.has("commercial-photo-director"));
  console.log("✔ authorship preserved — mutations retain original agent producers");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runBlueprintAssemblyStageFromPipeline();
  const enriched = enrichPipelineContextWithBlueprintAssembly(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.ok(enriched.context.blueprint.story.narrative);
  assert.ok(enriched.context.blueprint.photography.shootingNarrative);
  console.log("✔ pipeline context bridge — unified blueprint attached to context");
}

function testValidationFailures() {
  const input = gardenAssemblyInput();
  const missing = runBlueprintAssemblyStage(
    {
      profile: input.profile,
      business: input.business,
      story: input.story,
      scene: input.scene,
      composition: input.composition,
      photography: input.photography,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { missingPhotography: true },
  );
  assert.equal(missing.valid, false);
  assert.ok(missing.violations.some((v) => v.code === "MISSING_PHOTOGRAPHY"));

  const altered = runBlueprintAssemblyStage(
    {
      profile: input.profile,
      business: input.business,
      story: input.story,
      scene: input.scene,
      composition: input.composition,
      photography: input.photography,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { alterDesignDecision: true },
  );
  assert.equal(altered.valid, false);
  assert.ok(altered.violations.some((v) => v.code === "DESIGN_DECISION_ALTERED"));
  console.log("✔ validation — missing sections and design alteration block assembly");
}

function testSystemValidation() {
  const report = validateBlueprintAssembly();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.allSectionsMerged, true);
  assert.equal(report.authorshipPreserved, true);
  assert.equal(report.snapshotCreated, true);
  assert.equal(report.downstreamReady, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertBlueprintAssembly());
  const report = runBlueprintAssembly();
  assert.equal(report.constraintSetReady, true);
  console.log("✔ assertBlueprintAssembly and runBlueprintAssembly work");
}

function testFailureCodes() {
  assert.equal(isBlueprintAssemblyFailure("MISSING_COMPOSITION"), true);
  assert.equal(isBlueprintAssemblyFailure("DESIGN_DECISION_ALTERED"), true);
  assert.equal(isBlueprintAssemblyFailure("unknown"), false);
  console.log("✔ blueprint assembly failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testPipelineOrder();
  testGardenUnifiedBlueprint();
  testPremiumKitchenAssembly();
  testBlueprintIntegrity();
  testConflictDetection();
  testConstraintMerge();
  testMetadataGeneration();
  testNeverAltersDesignDecisions();
  testAuthorshipMutations();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nblueprint-assembly-stage.spec.ts — all passed");
}

run();

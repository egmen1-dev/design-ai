/**
 * DESIGN AI v18 — Composition Planning Stage tests (Chapter 6.8)
 */
import assert from "node:assert/strict";
import {
  COMPOSITION_PLANNING_VERSION,
  COMPOSITION_PLANNING_GOLDEN_RULE,
  COMPOSITION_PLANNING_PIPELINE,
  CompositionPlanningStage,
  LayoutPattern,
  CompositionObjective,
  selectLayoutPattern,
  buildPlannedCompositionBlueprint,
  buildReadingFlow,
  buildVisualHierarchyLabels,
  runCompositionPlanningStage,
  runCompositionPlanningStageFromPipeline,
  compositionPlanningToMutations,
  enrichPipelineContextWithCompositionPlanning,
  validateCompositionPlanning,
  assertCompositionPlanning,
  runCompositionPlanning,
  isCompositionPlanningFailure,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  runKnowledgeRetrievalStage,
  runBusinessUnderstandingStage,
  runVisualStoryPlanningStage,
  runScenePlanningStage,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  COMPOSITION_DIRECTOR_ID,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
} from "./index";

function gardenPlanningInput() {
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
  return {
    profile: analysis.section!.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  };
}

function testGoldenRule() {
  assert.ok(COMPOSITION_PLANNING_GOLDEN_RULE.includes("managing human attention"));
  assert.equal(COMPOSITION_PLANNING_VERSION, "6.8.0");
  console.log("✔ golden rule — composition manages buyer attention path");
}

function testPipelineStages() {
  assert.equal(COMPOSITION_PLANNING_PIPELINE.length, 15);
  assert.equal(COMPOSITION_PLANNING_PIPELINE[0], CompositionPlanningStage.INPUT_ASSEMBLY);
  assert.equal(COMPOSITION_PLANNING_PIPELINE[14], CompositionPlanningStage.AGENT_HANDOFF);
  console.log("✔ pipeline stages — pattern to hierarchy to validation to handoff");
}

function testPipelineOrder() {
  const scene = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.SCENE_PLANNING)!;
  const composition = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.COMPOSITION_PLANNING)!;
  assert.ok(scene.order < composition.order);
  console.log("✔ design pipeline — scene planning before composition planning");
}

function testGardenMarketplaceLayout() {
  const input = gardenPlanningInput();
  const report = runCompositionPlanningStage({
    profile: input.profile,
    business: input.business,
    story: input.story,
    scene: input.scene,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(report.valid, true);
  assert.equal(report.section!.layoutPattern, LayoutPattern.MARKETPLACE_SPLIT);
  assert.equal(report.section!.plannedBlueprint.visualHierarchy[0], "Hero Product");
  assert.ok(report.section!.plannedBlueprint.heroPlacement.width > 0.3);
  console.log("✔ garden sprayer — marketplace split layout with dominant hero");
}

function testPremiumKitchenLayout() {
  const report = runCompositionPlanningStageFromPipeline();
  assert.equal(report.valid, true);
  assert.equal(report.section!.layoutPattern, LayoutPattern.GOLDEN_RATIO);
  assert.ok(report.section!.plannedBlueprint.safeZones.length > 0);
  console.log("✔ premium kitchen — golden ratio layout with overlay safe zones");
}

function testLayoutPatternFromStory() {
  const input = gardenPlanningInput();
  const pattern = selectLayoutPattern({
    profile: input.profile,
    business: input.business,
    story: input.story,
    scene: input.scene,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(pattern, LayoutPattern.MARKETPLACE_SPLIT);
  console.log("✔ layout pattern — selected from story and marketplace not randomly");
}

function testVisualHierarchy() {
  const input = gardenPlanningInput();
  const planned = buildPlannedCompositionBlueprint(input, LayoutPattern.MARKETPLACE_SPLIT);
  const labels = buildVisualHierarchyLabels(["hero", "headline", "benefits"]);
  assert.equal(labels[0], "Hero Product");
  assert.equal(planned.visualHierarchy[0], "Hero Product");
  console.log("✔ visual hierarchy — hero product leads attention stack");
}

function testReadingFlow() {
  const input = gardenPlanningInput();
  const flow = buildReadingFlow(input, ["Hero Product", "Primary Benefit"]);
  assert.equal(flow[1], "hero_product");
  assert.ok(flow.includes("primary_benefit"));
  console.log("✔ reading flow — predictable attention route through hero and benefits");
}

function testNegativeSpaceAndOverlays() {
  const input = gardenPlanningInput();
  const planned = buildPlannedCompositionBlueprint(input, LayoutPattern.MARKETPLACE_SPLIT);
  assert.ok(planned.negativeSpace.length > 0);
  assert.equal(planned.textAreas.length, 2);
  assert.equal(planned.badgeAreas.length, 1);
  console.log("✔ negative space and overlay zones — reserved without covering hero");
}

function testNeverDoesLightingOrCamera() {
  const report = runCompositionPlanningStageFromPipeline();
  const text = JSON.stringify(report.section!.plannedBlueprint);
  assert.ok(!/\b(lighting setup|camera angle|material finish|color palette)\b/i.test(text));
  console.log("✔ composition only — no lighting camera materials or colors");
}

function testBlueprintMutations() {
  const report = runCompositionPlanningStageFromPipeline();
  const mutations = compositionPlanningToMutations(report.section!, 0, "composition planning");
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].section, "composition");
  assert.equal(mutations[0].producer, COMPOSITION_DIRECTOR_ID);
  console.log("✔ blueprint mutations — composition section via composition-director");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runCompositionPlanningStageFromPipeline();
  const enriched = enrichPipelineContextWithCompositionPlanning(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.ok(enriched.context.technical.composition.layoutPattern);
  assert.ok(enriched.context.blueprint.composition.heroArea);
  console.log("✔ pipeline context bridge — technical composition section enriched");
}

function testValidationFailures() {
  const input = gardenPlanningInput();
  const chaotic = runCompositionPlanningStage(
    {
      profile: input.profile,
      business: input.business,
      story: input.story,
      scene: input.scene,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { chaoticFlow: true },
  );
  assert.equal(chaotic.valid, false);
  assert.ok(chaotic.violations.some((v) => v.code === "CHAOTIC_READING_FLOW"));

  const noHero = runCompositionPlanningStage(
    {
      profile: input.profile,
      business: input.business,
      story: input.story,
      scene: input.scene,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { missingHero: true },
  );
  assert.equal(noHero.valid, false);
  assert.ok(noHero.violations.some((v) => v.code === "NO_HERO_PRODUCT"));
  console.log("✔ validation — chaotic flow and missing hero block stage");
}

function testSystemValidation() {
  const report = validateCompositionPlanning();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.heroDominant, true);
  assert.equal(report.readingFlowAligned, true);
  assert.equal(report.downstreamReady, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertCompositionPlanning());
  const report = runCompositionPlanning();
  assert.equal(report.overlayZonesReserved, true);
  console.log("✔ assertCompositionPlanning and runCompositionPlanning work");
}

function testFailureCodes() {
  assert.equal(isCompositionPlanningFailure("NO_HERO_PRODUCT"), true);
  assert.equal(isCompositionPlanningFailure("OVERLAY_HERO_CONFLICT"), true);
  assert.equal(isCompositionPlanningFailure("unknown"), false);
  console.log("✔ composition planning failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testPipelineOrder();
  testGardenMarketplaceLayout();
  testPremiumKitchenLayout();
  testLayoutPatternFromStory();
  testVisualHierarchy();
  testReadingFlow();
  testNegativeSpaceAndOverlays();
  testNeverDoesLightingOrCamera();
  testBlueprintMutations();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\ncomposition-planning-stage.spec.ts — all passed");
}

run();

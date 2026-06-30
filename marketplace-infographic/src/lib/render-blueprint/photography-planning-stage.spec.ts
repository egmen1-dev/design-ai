/**
 * DESIGN AI v18 — Photography Planning Stage tests (Chapter 6.9)
 */
import assert from "node:assert/strict";
import {
  PHOTOGRAPHY_PLANNING_VERSION,
  PHOTOGRAPHY_PLANNING_GOLDEN_RULE,
  PHOTOGRAPHY_PLANNING_PIPELINE,
  PhotographyPlanningStage,
  CameraPreset,
  LensPreset,
  LightingPreset,
  ExposurePreset,
  PlannedPhotographyStyle,
  selectCameraPreset,
  selectLens,
  selectLightingPreset,
  buildPlannedPhotographyBlueprint,
  runPhotographyPlanningStage,
  runPhotographyPlanningStageFromPipeline,
  photographyPlanningToMutations,
  enrichPipelineContextWithPhotographyPlanning,
  validatePhotographyPlanning,
  assertPhotographyPlanning,
  runPhotographyPlanning,
  isPhotographyPlanningFailure,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  runKnowledgeRetrievalStage,
  runBusinessUnderstandingStage,
  runVisualStoryPlanningStage,
  runScenePlanningStage,
  runCompositionPlanningStage,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  COMMERCIAL_PHOTO_DIRECTOR_ID,
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
  const composition = runCompositionPlanningStage({
    profile: analysis.section!.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  });
  return {
    profile: analysis.section!.profile,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    composition: composition.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  };
}

function testGoldenRule() {
  assert.ok(PHOTOGRAPHY_PLANNING_GOLDEN_RULE.includes("professional"));
  assert.equal(PHOTOGRAPHY_PLANNING_VERSION, "6.9.0");
  console.log("✔ golden rule — buyer feels professional photography instantly");
}

function testPipelineStages() {
  assert.equal(PHOTOGRAPHY_PLANNING_PIPELINE.length, 15);
  assert.equal(PHOTOGRAPHY_PLANNING_PIPELINE[0], PhotographyPlanningStage.INPUT_ASSEMBLY);
  assert.equal(PHOTOGRAPHY_PLANNING_PIPELINE[14], PhotographyPlanningStage.AGENT_HANDOFF);
  console.log("✔ pipeline stages — camera to lighting to validation to handoff");
}

function testPipelineOrder() {
  const composition = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.COMPOSITION_PLANNING)!;
  const photography = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.PHOTOGRAPHY_PLANNING)!;
  assert.ok(composition.order < photography.order);
  console.log("✔ design pipeline — composition planning before photography planning");
}

function testGardenMarketplacePhotography() {
  const input = gardenPlanningInput();
  const report = runPhotographyPlanningStage({
    profile: input.profile,
    story: input.story,
    scene: input.scene,
    composition: input.composition,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(report.valid, true);
  assert.equal(report.section!.photographyStyle, PlannedPhotographyStyle.MODERN_MARKETPLACE);
  assert.equal(report.section!.plannedBlueprint.lens, LensPreset.LENS_35MM);
  assert.equal(report.section!.cameraPreset, CameraPreset.COMMERCIAL_LIFESTYLE);
  assert.ok(report.section!.plannedBlueprint.lightingPreset.length > 0);
  console.log("✔ garden sprayer — marketplace lifestyle photography with 35mm lens");
}

function testPremiumKitchenPhotography() {
  const report = runPhotographyPlanningStageFromPipeline();
  assert.equal(report.valid, true);
  assert.equal(report.section!.plannedBlueprint.lens, LensPreset.LENS_85MM);
  assert.equal(report.section!.photographyStyle, PlannedPhotographyStyle.PREMIUM_LIFESTYLE);
  assert.equal(report.section!.cameraPreset, CameraPreset.STUDIO_PRODUCT);
  console.log("✔ premium kitchen — 85mm studio product photography");
}

function testCameraAndLensFromStory() {
  const input = gardenPlanningInput();
  assert.equal(selectCameraPreset(input), CameraPreset.COMMERCIAL_LIFESTYLE);
  assert.equal(selectLens(input), LensPreset.LENS_35MM);
  console.log("✔ camera and lens — selected from story and scene not randomly");
}

function testLightingStrategy() {
  const input = gardenPlanningInput();
  const lighting = selectLightingPreset(input);
  assert.ok(
    lighting === LightingPreset.WINDOW_LIGHT ||
      lighting === LightingPreset.PRODUCT_RIM_LIGHT ||
      lighting === LightingPreset.GOLDEN_HOUR,
  );
  const planned = buildPlannedPhotographyBlueprint(input);
  assert.ok(planned.lightingPreset);
  assert.ok(planned.exposure === ExposurePreset.BALANCED || planned.exposure === ExposurePreset.HIGH_KEY);
  console.log("✔ lighting strategy — defined before lighting director handoff");
}

function testDepthOfFieldSupportsHero() {
  const input = gardenPlanningInput();
  const planned = buildPlannedPhotographyBlueprint(input);
  assert.ok(!planned.depthOfField.includes("extreme"));
  console.log("✔ depth of field — keeps hero product visually dominant");
}

function testNeverDoesCompositionLayout() {
  const report = runPhotographyPlanningStageFromPipeline();
  const text = JSON.stringify(report.section!.plannedBlueprint);
  assert.ok(!/\b(hero area|headline area|badge layout|safe zone)\b/i.test(text));
  console.log("✔ photography only — no composition layout decisions");
}

function testBlueprintMutations() {
  const report = runPhotographyPlanningStageFromPipeline();
  const mutations = photographyPlanningToMutations(report.section!, 0, "photography planning");
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].section, "photography");
  assert.equal(mutations[0].producer, COMMERCIAL_PHOTO_DIRECTOR_ID);
  console.log("✔ blueprint mutations — photography section via commercial-photo-director");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runPhotographyPlanningStageFromPipeline();
  const enriched = enrichPipelineContextWithPhotographyPlanning(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.ok(enriched.context.technical.photography.lens);
  assert.ok(enriched.context.blueprint.photography.shootingNarrative);
  console.log("✔ pipeline context bridge — technical photography section enriched");
}

function testValidationFailures() {
  const input = gardenPlanningInput();
  const random = runPhotographyPlanningStage(
    {
      profile: input.profile,
      story: input.story,
      scene: input.scene,
      composition: input.composition,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { randomCameraParams: true },
  );
  assert.equal(random.valid, false);
  assert.ok(random.violations.some((v) => v.code === "RANDOM_CAMERA_PARAMS"));

  const noLight = runPhotographyPlanningStage(
    {
      profile: input.profile,
      story: input.story,
      scene: input.scene,
      composition: input.composition,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { missingLightingStrategy: true },
  );
  assert.equal(noLight.valid, false);
  assert.ok(noLight.violations.some((v) => v.code === "MISSING_LIGHTING_STRATEGY"));
  console.log("✔ validation — random camera and missing lighting block stage");
}

function testSystemValidation() {
  const report = validatePhotographyPlanning();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.lightingStrategyDefined, true);
  assert.equal(report.heroAdvantageMaintained, true);
  assert.equal(report.downstreamReady, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertPhotographyPlanning());
  const report = runPhotographyPlanning();
  assert.equal(report.storySupported, true);
  console.log("✔ assertPhotographyPlanning and runPhotographyPlanning work");
}

function testFailureCodes() {
  assert.equal(isPhotographyPlanningFailure("RANDOM_CAMERA_PARAMS"), true);
  assert.equal(isPhotographyPlanningFailure("MISSING_LIGHTING_STRATEGY"), true);
  assert.equal(isPhotographyPlanningFailure("unknown"), false);
  console.log("✔ photography planning failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testPipelineOrder();
  testGardenMarketplacePhotography();
  testPremiumKitchenPhotography();
  testCameraAndLensFromStory();
  testLightingStrategy();
  testDepthOfFieldSupportsHero();
  testNeverDoesCompositionLayout();
  testBlueprintMutations();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nphotography-planning-stage.spec.ts — all passed");
}

run();

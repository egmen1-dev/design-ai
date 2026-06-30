/**
 * DESIGN AI v18 — Scene Planning Stage tests (Chapter 6.7)
 */
import assert from "node:assert/strict";
import {
  SCENE_PLANNING_VERSION,
  SCENE_PLANNING_GOLDEN_RULE,
  SCENE_PLANNING_PIPELINE,
  ScenePlanningStage,
  SceneCategory,
  SceneObjective,
  BackgroundStyle,
  selectSceneCategory,
  buildSceneLocation,
  buildSupportObjects,
  buildPlannedSceneBlueprint,
  runScenePlanningStage,
  runScenePlanningStageFromPipeline,
  scenePlanningToMutations,
  enrichPipelineContextWithScenePlanning,
  validateScenePlanning,
  assertScenePlanning,
  runScenePlanning,
  isScenePlanningFailure,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  runKnowledgeRetrievalStage,
  runBusinessUnderstandingStage,
  runVisualStoryPlanningStage,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  SCENE_DIRECTOR_ID,
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
  return {
    profile: analysis.section!.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  };
}

function testGoldenRule() {
  assert.ok(SCENE_PLANNING_GOLDEN_RULE.includes("where, how, and why"));
  assert.equal(SCENE_PLANNING_VERSION, "6.7.0");
  console.log("✔ golden rule — buyer understands where and how product is used");
}

function testPipelineStages() {
  assert.equal(SCENE_PLANNING_PIPELINE.length, 15);
  assert.equal(SCENE_PLANNING_PIPELINE[0], ScenePlanningStage.INPUT_ASSEMBLY);
  assert.equal(SCENE_PLANNING_PIPELINE[14], ScenePlanningStage.AGENT_HANDOFF);
  console.log("✔ pipeline stages — objective to environment to validation to handoff");
}

function testPipelineOrder() {
  const story = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.VISUAL_STORY_PLANNING)!;
  const scene = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.SCENE_PLANNING)!;
  assert.ok(story.order < scene.order);
  console.log("✔ design pipeline — visual story planning before scene planning");
}

function testGardenOutdoorScene() {
  const input = gardenPlanningInput();
  const report = runScenePlanningStage({
    profile: input.profile,
    business: input.business,
    story: input.story,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(report.valid, true);
  assert.equal(report.section!.sceneCategory, SceneCategory.OUTDOOR);
  assert.equal(report.section!.sceneObjective, SceneObjective.SHOW_USAGE);
  assert.ok(report.section!.plannedBlueprint.location.toLowerCase().includes("orchard"));
  assert.ok(report.section!.plannedBlueprint.supportObjects.some((o) => o.includes("tree")));
  console.log("✔ garden sprayer — outdoor orchard scene with relevant support objects");
}

function testKitchenScene() {
  const report = runScenePlanningStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.plannedBlueprint.environment.length > 0);
  assert.ok(report.section!.renderScene.environment);
  console.log("✔ kitchen — credible home scene from story and business model");
}

function testSpecificLocation() {
  const input = gardenPlanningInput();
  const location = buildSceneLocation({
    profile: input.profile,
    business: input.business,
    story: input.story,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.ok(location.includes("orchard"));
  console.log("✔ environment selection — specific location not generic outdoor");
}

function testSupportingObjectsPurpose() {
  const input = gardenPlanningInput();
  const support = buildSupportObjects({
    profile: input.profile,
    business: input.business,
    story: input.story,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.ok(support.includes("fruit trees"));
  assert.ok(!support.includes("random decor"));
  console.log("✔ supporting objects — explain usage not decorate");
}

function testNegativeSceneRules() {
  const input = gardenPlanningInput();
  const planned = buildPlannedSceneBlueprint(
    {
      profile: input.profile,
      business: input.business,
      story: input.story,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    SceneCategory.OUTDOOR,
    SceneObjective.SHOW_USAGE,
  );
  assert.ok(planned.negativeObjects.includes("random people"));
  assert.ok(planned.negativeObjects.includes("visual clutter"));
  console.log("✔ negative scene rules — forbidden distracting elements catalogued");
}

function testNeverDoesComposition() {
  const report = runScenePlanningStageFromPipeline();
  const text = [
    report.section!.plannedBlueprint.location,
    report.section!.plannedBlueprint.environment,
    report.section!.directorSection.backgroundNarrative,
  ].join(" ");
  assert.ok(!/\b(hero placement|badge layout|camera angle)\b/i.test(text));
  console.log("✔ scene only — no composition lighting or camera decisions");
}

function testBlueprintMutations() {
  const report = runScenePlanningStageFromPipeline();
  const mutations = scenePlanningToMutations(report.section!, 0, "scene planning");
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].section, "scene");
  assert.equal(mutations[0].producer, SCENE_DIRECTOR_ID);
  console.log("✔ blueprint mutations — scene section via scene-director");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runScenePlanningStageFromPipeline();
  const enriched = enrichPipelineContextWithScenePlanning(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.ok(enriched.context.creative.scene.location);
  assert.ok(enriched.context.blueprint.scene.environment);
  console.log("✔ pipeline context bridge — creative scene section enriched");
}

function testValidationFailures() {
  const input = gardenPlanningInput();
  const decorative = runScenePlanningStage(
    {
      profile: input.profile,
      business: input.business,
      story: input.story,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { decorativeOnlyScene: true },
  );
  assert.equal(decorative.valid, false);
  assert.ok(decorative.violations.some((v) => v.code === "SCENE_BEAUTY_ONLY"));
  console.log("✔ validation — decorative-only scene blocks stage");
}

function testSystemValidation() {
  const report = validateScenePlanning();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.storyAligned, true);
  assert.equal(report.productContextClear, true);
  assert.equal(report.downstreamReady, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertScenePlanning());
  const report = runScenePlanning();
  assert.equal(report.realismMaintained, true);
  console.log("✔ assertScenePlanning and runScenePlanning work");
}

function testFailureCodes() {
  assert.equal(isScenePlanningFailure("SCENE_BEAUTY_ONLY"), true);
  assert.equal(isScenePlanningFailure("BACKGROUND_COMPETES"), true);
  assert.equal(isScenePlanningFailure("unknown"), false);
  console.log("✔ scene planning failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testPipelineOrder();
  testGardenOutdoorScene();
  testKitchenScene();
  testSpecificLocation();
  testSupportingObjectsPurpose();
  testNegativeSceneRules();
  testNeverDoesComposition();
  testBlueprintMutations();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nscene-planning-stage.spec.ts — all passed");
}

run();

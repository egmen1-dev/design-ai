/**
 * DESIGN AI v18 — Visual Story Planning Stage tests (Chapter 6.6)
 */
import assert from "node:assert/strict";
import {
  VISUAL_STORY_PLANNING_VERSION,
  VISUAL_STORY_PLANNING_GOLDEN_RULE,
  VISUAL_STORY_PLANNING_PIPELINE,
  VisualStoryPlanningStage,
  StoryPattern,
  StoryObjective,
  selectStoryPatternFromBusiness,
  buildPrimaryMessage,
  buildHeroMoment,
  buildPlannedStoryBlueprint,
  buildStoryConstraints,
  runVisualStoryPlanningStage,
  runVisualStoryPlanningStageFromPipeline,
  storyPlanningToMutations,
  enrichPipelineContextWithStoryPlanning,
  validateVisualStoryPlanning,
  assertVisualStoryPlanning,
  runVisualStoryPlanning,
  isVisualStoryPlanningFailure,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  runKnowledgeRetrievalStage,
  runBusinessUnderstandingStage,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  VISUAL_STORY_DIRECTOR_ID,
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
  return {
    profile: analysis.section!.profile,
    business: business.section!,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  };
}

function testGoldenRule() {
  assert.ok(VISUAL_STORY_PLANNING_GOLDEN_RULE.includes("remember the story"));
  assert.equal(VISUAL_STORY_PLANNING_VERSION, "6.6.0");
  console.log("✔ golden rule — buyer remembers story from first seconds");
}

function testPipelineStages() {
  assert.equal(VISUAL_STORY_PLANNING_PIPELINE.length, 12);
  assert.equal(VISUAL_STORY_PLANNING_PIPELINE[0], VisualStoryPlanningStage.INPUT_ASSEMBLY);
  assert.equal(VISUAL_STORY_PLANNING_PIPELINE[11], VisualStoryPlanningStage.AGENT_HANDOFF);
  console.log("✔ pipeline stages — objective to pattern to blueprint to handoff");
}

function testPipelineOrder() {
  const business = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.BUSINESS_UNDERSTANDING)!;
  const story = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.VISUAL_STORY_PLANNING)!;
  assert.ok(business.order < story.order);
  console.log("✔ design pipeline — business understanding before visual story planning");
}

function testStoryPatternSelection() {
  const input = gardenPlanningInput();
  const pattern = selectStoryPatternFromBusiness(input.business);
  assert.equal(pattern, StoryPattern.PROBLEM_SOLUTION);
  console.log("✔ story pattern — selected from business model not randomly");
}

function testGardenSprayerStory() {
  const input = gardenPlanningInput();
  const report = runVisualStoryPlanningStage({
    profile: input.profile,
    business: input.business,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(report.valid, true);
  assert.equal(report.section!.storyPattern, StoryPattern.PROBLEM_SOLUTION);
  assert.ok(report.section!.plannedBlueprint.primaryMessage.toLowerCase().includes("pump"));
  assert.ok(report.section!.plannedBlueprint.heroMoment.toLowerCase().includes("tree"));
  assert.equal(report.section!.plannedBlueprint.storyFlow[0], "attention");
  console.log("✔ garden sprayer — problem solution story with hero moment");
}

function testKitchenPremiumStory() {
  const report = runVisualStoryPlanningStageFromPipeline();
  assert.equal(report.valid, true);
  assert.equal(report.section!.storyPattern, StoryPattern.PREMIUM_EXPERIENCE);
  assert.equal(report.section!.storyObjective, StoryObjective.DEMONSTRATE_QUALITY);
  console.log("✔ kitchen premium — premium experience pattern and quality objective");
}

function testSinglePrimaryMessage() {
  const input = gardenPlanningInput();
  const multi = runVisualStoryPlanningStage(
    {
      profile: input.profile,
      business: input.business,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { multiplePrimaryMessages: true },
  );
  assert.equal(multi.valid, false);
  assert.ok(multi.violations.some((v) => v.code === "MULTIPLE_PRIMARY_MESSAGES"));
  console.log("✔ primary message — only one main message allowed");
}

function testStoryConstraints() {
  const premium = buildStoryConstraints(StoryPattern.PREMIUM_EXPERIENCE);
  assert.ok(premium.avoid.includes("cheap colors"));
  const feature = buildStoryConstraints(StoryPattern.FEATURE_SHOWCASE);
  assert.ok(feature.avoid.some((a) => a.includes("lifestyle")));
  console.log("✔ story constraints — premium and technical patterns have limits");
}

function testNeverDoesComposition() {
  const report = runVisualStoryPlanningStageFromPipeline();
  const text = [
    report.section!.plannedBlueprint.primaryMessage,
    report.section!.plannedBlueprint.heroMoment,
  ].join(" ");
  assert.ok(!/\b(lighting|camera|composition|badge)\b/i.test(text));
  console.log("✔ meaning only — no composition lighting or photography decisions");
}

function testBlueprintMutations() {
  const report = runVisualStoryPlanningStageFromPipeline();
  const mutations = storyPlanningToMutations(report.section!, 0, "story planning");
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].section, "story");
  assert.equal(mutations[0].producer, VISUAL_STORY_DIRECTOR_ID);
  console.log("✔ blueprint mutations — story section via visual-story-director");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runVisualStoryPlanningStageFromPipeline();
  const enriched = enrichPipelineContextWithStoryPlanning(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.ok(enriched.context.creative.story.primaryMessage);
  assert.ok(enriched.context.blueprint.story.hook);
  console.log("✔ pipeline context bridge — creative story section enriched");
}

function testValidationFailures() {
  const input = gardenPlanningInput();
  const missingHero = runVisualStoryPlanningStage(
    {
      profile: input.profile,
      business: input.business,
      knowledge: input.knowledge,
      marketplace: input.marketplace,
    },
    { missingHeroMoment: true },
  );
  assert.equal(missingHero.valid, false);
  assert.ok(missingHero.violations.some((v) => v.code === "MISSING_HERO_MOMENT"));
  console.log("✔ validation — missing hero moment blocks stage");
}

function testSystemValidation() {
  const report = validateVisualStoryPlanning();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.singleStoryIdea, true);
  assert.equal(report.heroMomentDefined, true);
  assert.equal(report.downstreamReady, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertVisualStoryPlanning());
  const report = runVisualStoryPlanning();
  assert.equal(report.emotionalToneDefined, true);
  console.log("✔ assertVisualStoryPlanning and runVisualStoryPlanning work");
}

function testFailureCodes() {
  assert.equal(isVisualStoryPlanningFailure("MISSING_PRIMARY_MESSAGE"), true);
  assert.equal(isVisualStoryPlanningFailure("DESIGN_DECISION_DETECTED"), true);
  assert.equal(isVisualStoryPlanningFailure("unknown"), false);
  console.log("✔ visual story planning failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testPipelineOrder();
  testStoryPatternSelection();
  testGardenSprayerStory();
  testKitchenPremiumStory();
  testSinglePrimaryMessage();
  testStoryConstraints();
  testNeverDoesComposition();
  testBlueprintMutations();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nvisual-story-planning-stage.spec.ts — all passed");
}

run();

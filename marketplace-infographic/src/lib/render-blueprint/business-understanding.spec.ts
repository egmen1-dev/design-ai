/**
 * DESIGN AI v18 — Business Understanding Stage tests (Chapter 6.5)
 */
import assert from "node:assert/strict";
import {
  BUSINESS_UNDERSTANDING_VERSION,
  BUSINESS_UNDERSTANDING_GOLDEN_RULE,
  BUSINESS_UNDERSTANDING_PIPELINE,
  BusinessUnderstandingStage,
  StoryStrategyArc,
  CompetitivePositioningStrategy,
  transformFeaturesToBenefits,
  rankBusinessPriorities,
  selectStoryStrategyArc,
  selectCompetitiveStrategy,
  buildPipelineBusinessModel,
  runBusinessUnderstandingStage,
  runBusinessUnderstandingStageFromPipeline,
  enrichPipelineContextWithBusinessUnderstanding,
  mapStoryStrategyToStoryType,
  validateBusinessUnderstanding,
  assertBusinessUnderstanding,
  runBusinessUnderstanding,
  isBusinessUnderstandingFailure,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  runKnowledgeRetrievalStage,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
} from "./index";

function gardenInput() {
  const analysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
      targetAudience: "garden owners",
    }),
  );
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section!.profile,
    marketplace: "wildberries",
  });
  return {
    profile: analysis.section!.profile,
    knowledge: knowledge.package!,
    marketplace: "wildberries",
  };
}

function testGoldenRule() {
  assert.ok(BUSINESS_UNDERSTANDING_GOLDEN_RULE.includes("solutions to their problems"));
  assert.equal(BUSINESS_UNDERSTANDING_VERSION, "6.5.0");
  console.log("✔ golden rule — buyers purchase solutions not specifications");
}

function testPipelineStages() {
  assert.equal(BUSINESS_UNDERSTANDING_PIPELINE.length, 12);
  assert.equal(BUSINESS_UNDERSTANDING_PIPELINE[0], BusinessUnderstandingStage.INPUT_ASSEMBLY);
  assert.equal(BUSINESS_UNDERSTANDING_PIPELINE[11], BusinessUnderstandingStage.VALIDATION);
  console.log("✔ pipeline stages — input to feature transform to story strategy to validation");
}

function testPipelineOrder() {
  const business = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.BUSINESS_UNDERSTANDING)!;
  const story = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.VISUAL_STORY_PLANNING)!;
  assert.equal(business.order, 4);
  assert.ok(business.order < story.order);
  console.log("✔ design pipeline — business understanding before visual story planning");
}

function testFeatureBenefitTransformation() {
  const input = gardenInput();
  const chains = transformFeaturesToBenefits(input.profile);
  const battery = chains.find((c) => c.feature.toLowerCase().includes("battery"))!;
  assert.ok(battery.benefit.includes("autonomous") || battery.benefit.includes("operation"));
  assert.ok(battery.customerValue.includes("time") || battery.customerValue.includes("effort"));
  console.log("✔ feature benefit transformation — feature to benefit to customer value");
}

function testBatterySprayerBusinessModel() {
  const input = gardenInput();
  const report = runBusinessUnderstandingStage({
    profile: input.profile,
    knowledge: input.knowledge,
    marketplace: input.marketplace,
  });
  assert.equal(report.valid, true);
  assert.equal(report.section!.model.storyStrategy, "Problem → Solution → Benefit → Trust → Action");
  assert.ok(report.section!.model.primaryValue.length > 0);
  assert.ok(report.section!.model.painPoints.length >= 3);
  console.log("✔ battery sprayer — commercial model with story strategy and pains");
}

function testKitchenPremiumModel() {
  const report = runBusinessUnderstandingStageFromPipeline();
  assert.equal(report.valid, true);
  assert.equal(report.section!.storyStrategyArc, StoryStrategyArc.PREMIUM_QUALITY_MATERIALS_STATUS_PURCHASE);
  console.log("✔ kitchen premium — premium quality materials status purchase arc");
}

function testRankedPriorities() {
  const input = gardenInput();
  const chains = transformFeaturesToBenefits(input.profile);
  const ranked = rankBusinessPriorities(chains, input.profile);
  assert.equal(ranked[0].rank, 1);
  assert.ok(ranked.length >= 3);
  console.log("✔ business priorities — ranked visual hierarchy for Story Director");
}

function testSingleCompetitiveStrategy() {
  const input = gardenInput();
  const strategy = selectCompetitiveStrategy(input.profile);
  assert.equal(strategy, CompetitivePositioningStrategy.MOST_RELIABLE);
  const conflicting = runBusinessUnderstandingStage(
    { profile: input.profile, knowledge: input.knowledge, marketplace: input.marketplace },
    { conflictingStrategies: true },
  );
  assert.equal(conflicting.valid, false);
  console.log("✔ competitive positioning — one primary strategy only");
}

function testStoryStrategyForDirector() {
  const input = gardenInput();
  const story = selectStoryStrategyArc(input.profile);
  assert.equal(story.arc, StoryStrategyArc.PROBLEM_SOLUTION_BENEFIT_TRUST_ACTION);
  assert.equal(mapStoryStrategyToStoryType(story.arc), "problem_solution");
  console.log("✔ story strategy — ready arc for Visual Story Director");
}

function testNeverDoesDesign() {
  const report = runBusinessUnderstandingStageFromPipeline();
  assert.ok(report.section!.model.primaryValue);
  assert.ok(!report.section!.model.storyStrategy.includes("lighting"));
  console.log("✔ design excluded — commercial logic only, no visual design decisions");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runBusinessUnderstandingStageFromPipeline();
  const enriched = enrichPipelineContextWithBusinessUnderstanding(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.ok(enriched.context.business.commercialModel?.primaryValue);
  assert.ok(enriched.context.business.commercialModel?.storyStrategy);
  console.log("✔ pipeline context bridge — commercial model in business section");
}

function testValidationFailures() {
  const input = gardenInput();
  const noValue = runBusinessUnderstandingStage(
    { profile: input.profile, knowledge: input.knowledge, marketplace: input.marketplace },
    { missingPrimaryValue: true },
  );
  assert.equal(noValue.valid, false);
  assert.ok(noValue.violations.some((v) => v.code === "MISSING_PRIMARY_VALUE"));

  const noTransform = runBusinessUnderstandingStage(
    { profile: input.profile, knowledge: input.knowledge, marketplace: input.marketplace },
    { skipFeatureTransform: true },
  );
  assert.equal(noTransform.valid, false);
  assert.ok(noTransform.violations.some((v) => v.code === "SPECS_NOT_TRANSFORMED"));
  console.log("✔ validation — missing value and untransformed specs block stage");
}

function testSystemValidation() {
  const report = validateBusinessUnderstanding();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.valueOverSpecs, true);
  assert.equal(report.prioritiesRanked, true);
  assert.equal(report.storyDirectorReady, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertBusinessUnderstanding());
  const report = runBusinessUnderstanding();
  assert.equal(report.modelComplete, true);
  console.log("✔ assertBusinessUnderstanding and runBusinessUnderstanding work");
}

function testFailureCodes() {
  assert.equal(isBusinessUnderstandingFailure("MISSING_PRIMARY_VALUE"), true);
  assert.equal(isBusinessUnderstandingFailure("CONFLICTING_STRATEGIES"), true);
  assert.equal(isBusinessUnderstandingFailure("unknown"), false);
  console.log("✔ business understanding failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testPipelineOrder();
  testFeatureBenefitTransformation();
  testBatterySprayerBusinessModel();
  testKitchenPremiumModel();
  testRankedPriorities();
  testSingleCompetitiveStrategy();
  testStoryStrategyForDirector();
  testNeverDoesDesign();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nbusiness-understanding.spec.ts — all passed");
}

run();

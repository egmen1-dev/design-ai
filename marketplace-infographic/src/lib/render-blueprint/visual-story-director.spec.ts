/**
 * DESIGN AI v18 — Visual Story Director tests (Chapter 4.10)
 */
import assert from "node:assert/strict";
import {
  VISUAL_STORY_DIRECTOR_GOLDEN_RULE,
  VISUAL_STORY_DIRECTOR_ID,
  VISUAL_STORY_PIPELINE_POSITION,
  STORY_TYPE_CATALOG,
  StoryType,
  CommercialGoal,
  PrimaryEmotion,
  buildStorySection,
  validateStorySection,
  runVisualStoryDirector,
  directorContextFromBlueprint,
  storySectionToMutations,
  storyDirectorAgent,
  universalStoryDirectorAgent,
  createEmptyRenderBlueprint,
  buildAgentContextPackage,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function bootstrapContext() {
  const bp = createEmptyRenderBlueprint({ category: "electronics", seed: 1 });
  bp.creative.goal = "Technical";
  bp.lifecycle.sections.product = SectionState.READY;
  bp.lifecycle.sections.creative = SectionState.READY;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  return buildAgentContextPackage({ blueprint: bp, agentId: VISUAL_STORY_DIRECTOR_ID });
}

function testGoldenRule() {
  assert.ok(VISUAL_STORY_DIRECTOR_GOLDEN_RULE.includes("creates meaning"));
  console.log("✔ golden rule — story creates meaning, not images");
}

function testPipelinePosition() {
  assert.equal(VISUAL_STORY_PIPELINE_POSITION[2], VISUAL_STORY_DIRECTOR_ID);
  assert.ok(VISUAL_STORY_PIPELINE_POSITION.indexOf("scene-director") > 2);
  console.log("✔ visual story director is first creative director after analysis");
}

function testStoryTypeCatalog() {
  assert.ok(STORY_TYPE_CATALOG.length >= 16);
  assert.ok(STORY_TYPE_CATALOG.some((t) => t.id === StoryType.PROBLEM_SOLUTION));
  console.log("✔ story type catalog defines formal story types");
}

function testBuildStorySection() {
  const { section } = buildStorySection(
    {
      productCategory: "baby",
      creativeGoal: "Lifestyle",
      marketplace: "WB",
      priceSegment: "middle",
      audience: "parents",
    },
    0.88,
  );
  assert.equal(section.storyType, StoryType.SAFETY);
  assert.ok(section.commercialGoal);
  assert.ok(section.primaryEmotion);
  assert.ok(section.storyBlueprint.hook.length > 0);
  assert.ok(!section.storyBlueprint.narrative.toLowerCase().includes("flux"));
  console.log("✔ story section includes narrative, emotion, and commercial goal");
}

function testStoryNotSceneOrPrompt() {
  const { section } = buildStorySection(
    {
      productCategory: "electronics",
      creativeGoal: "Technical",
      marketplace: "WB",
      priceSegment: "middle",
      audience: "buyers",
    },
    0.8,
  );
  const report = validateStorySection(section, {
    productCategory: "electronics",
    creativeGoal: "Technical",
    marketplace: "WB",
    priceSegment: "middle",
    audience: "buyers",
  });
  assert.equal(report.valid, true);
  const narrative = section.storyBlueprint.narrative.toLowerCase();
  assert.ok(!narrative.includes("kitchen"));
  assert.ok(!narrative.includes("prompt"));
  console.log("✔ story avoids scene, composition, and prompt decisions");
}

function testFailureOnCategoryMismatch() {
  const { section } = buildStorySection(
    {
      productCategory: "electronics",
      creativeGoal: "Lifestyle",
      marketplace: "WB",
      priceSegment: "middle",
      audience: "buyers",
    },
    0.7,
  );
  const forced = {
    ...section,
    storyType: StoryType.FAMILY,
    storyBlueprint: { ...section.storyBlueprint, storyType: StoryType.FAMILY },
  };
  const report = validateStorySection(forced, {
    productCategory: "electronics",
    creativeGoal: "Lifestyle",
    marketplace: "WB",
    priceSegment: "middle",
    audience: "buyers",
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.includes("CATEGORY_MISMATCH"));
  console.log("✔ category mismatch fails story validation");
}

function testRunVisualStoryDirectorPipeline() {
  const context = bootstrapContext();
  const directorContext = directorContextFromBlueprint(context.blueprint);
  const result = runVisualStoryDirector({ context, directorContext });
  assert.equal(result.section.commercialGoal, CommercialGoal.HIGHLIGHT_INNOVATION);
  assert.equal(result.decisionSession.state.stages.length, 8);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "story");
  assert.ok(result.explainability.rejectedAlternatives.length >= 1);
  console.log("✔ full decision pipeline produces story mutations only");
}

function testStoryMutationsOwnership() {
  const { section } = buildStorySection(
    {
      productCategory: "cosmetics",
      creativeGoal: "Premium",
      marketplace: "WB",
      priceSegment: "premium",
      audience: "women",
    },
    0.9,
  );
  const mutations = storySectionToMutations(section, 0, "story decision");
  assert.equal(mutations[0].producer, VISUAL_STORY_DIRECTOR_ID);
  assert.equal(mutations[0].section, "story");
  console.log("✔ story director publishes story section mutations only");
}

async function testLegacyAgentUsesChapter410() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  const result = await storyDirectorAgent.execute(bp, {
    productCategory: "electronics",
    creativeGoal: "Technical",
  });
  assert.ok(result.storySection);
  assert.ok(result.story.storyType);
  assert.ok(result.story.commercialGoal);
  assert.ok(result.decisionTrace.some((t) => t.includes("observe")));
  console.log("✔ legacy story director agent uses Chapter 4.10 engine");
}

async function testUniversalAgentWrapper() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: VISUAL_STORY_DIRECTOR_ID });
  const result = await universalStoryDirectorAgent.execute(ctx);
  assert.equal(result.mutations[0].section, "story");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  console.log("✔ universal agent wrapper returns normalized confidence and mutations");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testStoryTypeCatalog();
  testBuildStorySection();
  testStoryNotSceneOrPrompt();
  testFailureOnCategoryMismatch();
  testRunVisualStoryDirectorPipeline();
  testStoryMutationsOwnership();
  await testLegacyAgentUsesChapter410();
  await testUniversalAgentWrapper();
  console.log("\nvisual-story-director.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Scene Director tests (Chapter 4.11)
 */
import assert from "node:assert/strict";
import {
  SCENE_DIRECTOR_GOLDEN_RULE,
  SCENE_DIRECTOR_ID,
  SCENE_DIRECTOR_PIPELINE_POSITION,
  SCENE_TYPE_CATALOG,
  ENVIRONMENT_CATALOG,
  SceneType,
  EnvironmentType,
  StoryType,
  buildSceneSection,
  validateSceneSection,
  runSceneDirector,
  sceneDirectorContextFromBlueprint,
  sceneSectionToMutations,
  sceneDirectorAgent,
  universalSceneDirectorAgent,
  createEmptyRenderBlueprint,
  buildAgentContextPackage,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function bootstrapContext() {
  const bp = createEmptyRenderBlueprint({ category: "baby_products", seed: 2 });
  bp.creative.goal = "Lifestyle";
  bp.story = {
    hook: "Безопасность для семьи",
    customerProblem: "нужна надёжность",
    customerDesire: "спокойствие",
    visualPromise: "абсолютная надёжность",
    emotionalTone: "calm",
    narrative: "История о безопасности ребёнка",
    storyType: StoryType.SAFETY,
    primaryEmotion: "safety",
    commercialGoal: "increase_trust",
  };
  bp.lifecycle.sections.product = SectionState.READY;
  bp.lifecycle.sections.creative = SectionState.READY;
  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.stage = BlueprintLifecycle.SCENE_DEFINED;
  return buildAgentContextPackage({ blueprint: bp, agentId: SCENE_DIRECTOR_ID });
}

function testGoldenRule() {
  assert.ok(SCENE_DIRECTOR_GOLDEN_RULE.includes("physical world"));
  console.log("✔ golden rule — scene designs a world, not a random background");
}

function testPipelinePosition() {
  assert.equal(SCENE_DIRECTOR_PIPELINE_POSITION[0], "visual-story-director");
  assert.equal(SCENE_DIRECTOR_PIPELINE_POSITION[1], SCENE_DIRECTOR_ID);
  assert.ok(SCENE_DIRECTOR_PIPELINE_POSITION.indexOf("composition-director") > 1);
  console.log("✔ scene director follows story director in pipeline");
}

function testCatalogs() {
  assert.ok(SCENE_TYPE_CATALOG.length >= 13);
  assert.ok(ENVIRONMENT_CATALOG.length >= 13);
  assert.ok(ENVIRONMENT_CATALOG.some((e) => e.id === EnvironmentType.MODERN_KITCHEN));
  console.log("✔ scene and environment catalogs defined");
}

function testBuildSceneSectionFromSafetyStory() {
  const { section } = buildSceneSection(
    {
      productCategory: "baby",
      creativeGoal: "Lifestyle",
      marketplace: "WB",
      priceSegment: "middle",
      audience: "parents",
      storyType: StoryType.SAFETY,
      primaryEmotion: "safety",
      commercialGoal: "increase_trust",
      storyHook: "Безопасность для семьи",
    },
    0.86,
  );
  assert.equal(section.environment, EnvironmentType.CHILDREN_ROOM);
  assert.equal(section.sceneType, SceneType.LIFESTYLE);
  assert.ok(section.backgroundNarrative.length > 20);
  assert.ok(section.materialPalette.length >= 2);
  assert.ok(section.sceneBlueprint.environment);
  console.log("✔ safety story maps to children room lifestyle scene");
}

function testSceneNotCompositionOrPrompt() {
  const { section } = buildSceneSection(
    {
      productCategory: "electronics",
      creativeGoal: "Technical",
      marketplace: "WB",
      priceSegment: "middle",
      audience: "buyers",
      storyType: StoryType.TECHNOLOGY,
      primaryEmotion: "curiosity",
      commercialGoal: "highlight_innovation",
    },
    0.82,
  );
  const report = validateSceneSection(section, {
    productCategory: "electronics",
    creativeGoal: "Technical",
    marketplace: "WB",
    priceSegment: "middle",
    audience: "buyers",
    storyType: StoryType.TECHNOLOGY,
  });
  assert.equal(report.valid, true);
  const text = section.backgroundNarrative.toLowerCase();
  assert.ok(!text.includes("hero"));
  assert.ok(!text.includes("prompt"));
  console.log("✔ scene avoids composition and prompt decisions");
}

function testStoryConflictFails() {
  const { section } = buildSceneSection(
    {
      productCategory: "cosmetics",
      creativeGoal: "Premium",
      marketplace: "WB",
      priceSegment: "premium",
      audience: "women",
      storyType: StoryType.PREMIUM_LIFESTYLE,
      primaryEmotion: "luxury",
      commercialGoal: "increase_premium_perception",
    },
    0.9,
  );
  const forced = {
    ...section,
    environment: EnvironmentType.WORKSHOP,
    sceneBlueprint: { ...section.sceneBlueprint, environmentType: EnvironmentType.WORKSHOP },
  };
  const report = validateSceneSection(forced, {
    productCategory: "cosmetics",
    creativeGoal: "Premium",
    marketplace: "WB",
    priceSegment: "premium",
    audience: "women",
    storyType: StoryType.PREMIUM_LIFESTYLE,
    primaryEmotion: "luxury",
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.includes("STORY_CONFLICT"));
  console.log("✔ luxury story conflicts with workshop environment");
}

function testRunSceneDirectorPipeline() {
  const context = bootstrapContext();
  const directorContext = sceneDirectorContextFromBlueprint(context.blueprint);
  const result = runSceneDirector({ context, directorContext });
  assert.equal(result.section.environment, EnvironmentType.CHILDREN_ROOM);
  assert.equal(result.decisionSession.state.stages.length, 8);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "scene");
  assert.ok(result.explainability.rejectedAlternatives.length >= 1);
  console.log("✔ full decision pipeline produces scene mutations only");
}

function testSceneMutationsOwnership() {
  const { section } = buildSceneSection(
    {
      productCategory: "electronics",
      creativeGoal: "Technical",
      marketplace: "WB",
      priceSegment: "middle",
      audience: "buyers",
      storyType: StoryType.TECHNOLOGY,
    },
    0.85,
  );
  const mutations = sceneSectionToMutations(section, 0, "scene decision");
  assert.equal(mutations[0].producer, SCENE_DIRECTOR_ID);
  assert.equal(mutations[0].section, "scene");
  console.log("✔ scene director publishes scene section mutations only");
}

async function testLegacyAgentUsesChapter411() {
  const bp = createEmptyRenderBlueprint({ category: "baby" });
  bp.story.storyType = StoryType.SAFETY;
  bp.story.hook = "Безопасность";
  bp.story.narrative = "История безопасности";
  bp.lifecycle.stage = BlueprintLifecycle.SCENE_DEFINED;
  const result = await sceneDirectorAgent.execute(bp, {
    productCategory: "baby",
    creativeGoal: "Lifestyle",
  });
  assert.ok(result.sceneSection);
  assert.ok(result.scene.backgroundNarrative);
  assert.ok(result.scene.sceneType);
  assert.ok(result.decisionTrace.some((t) => t.includes("observe")));
  console.log("✔ legacy scene director agent uses Chapter 4.11 engine");
}

async function testUniversalAgentWrapper() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.story.storyType = StoryType.TECHNOLOGY;
  bp.story.hook = "Инновация";
  bp.story.narrative = "Технологическая история";
  bp.lifecycle.stage = BlueprintLifecycle.SCENE_DEFINED;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: SCENE_DIRECTOR_ID });
  const result = await universalSceneDirectorAgent.execute(ctx);
  assert.equal(result.mutations[0].section, "scene");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  console.log("✔ universal agent wrapper returns normalized confidence and mutations");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testCatalogs();
  testBuildSceneSectionFromSafetyStory();
  testSceneNotCompositionOrPrompt();
  testStoryConflictFails();
  testRunSceneDirectorPipeline();
  testSceneMutationsOwnership();
  await testLegacyAgentUsesChapter411();
  await testUniversalAgentWrapper();
  console.log("\nscene-director.spec.ts — all passed");
}

run();

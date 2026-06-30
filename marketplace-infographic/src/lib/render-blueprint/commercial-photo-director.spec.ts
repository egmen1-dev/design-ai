/**
 * DESIGN AI v18 — Commercial Photo Director tests (Chapter 4.13)
 */
import assert from "node:assert/strict";
import {
  COMMERCIAL_PHOTO_DIRECTOR_GOLDEN_RULE,
  COMMERCIAL_PHOTO_DIRECTOR_ID,
  COMMERCIAL_PHOTO_PIPELINE_POSITION,
  PHOTOGRAPHY_STYLE_CATALOG,
  PhotographyStyle,
  PhotoMood,
  FocusStrategy,
  ProductInteraction,
  StoryType,
  SceneType,
  LayoutTemplate,
  buildPhotographySection,
  validatePhotographySection,
  runCommercialPhotoDirector,
  commercialPhotoDirectorContextFromBlueprint,
  photographySectionToMutations,
  commercialPhotoDirectorAgent,
  universalCommercialPhotoDirectorAgent,
  createEmptyRenderBlueprint,
  buildAgentContextPackage,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function bootstrapContext() {
  const bp = createEmptyRenderBlueprint({ category: "electronics", seed: 4 });
  bp.creative.marketplace = "WB";
  bp.creative.goal = "Technical";
  bp.story = {
    hook: "Инновация",
    customerProblem: "сложно показать преимущество",
    customerDesire: "понять технологичность",
    visualPromise: "ясная инновация",
    emotionalTone: "innovative",
    narrative: "Технологическая история",
    storyType: StoryType.TECHNOLOGY,
    primaryEmotion: "curiosity",
    commercialGoal: "highlight_innovation",
  };
  bp.scene = {
    environment: "studio",
    architecture: "modern",
    timeOfDay: "day",
    weather: "clear",
    depth: "shallow",
    surface: "matte desk",
    sceneType: SceneType.TECHNOLOGY,
    environmentType: "technology_lab",
    backgroundNarrative: "Технологичная среда",
    lightingMood: "crisp neutral daylight",
  };
  bp.composition = {
    ...bp.composition,
    templateId: LayoutTemplate.FEATURE_GRID,
    template: "hero_left",
  };
  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.sections.scene = SectionState.READY;
  bp.lifecycle.sections.composition = SectionState.READY;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  return buildAgentContextPackage({ blueprint: bp, agentId: COMMERCIAL_PHOTO_DIRECTOR_ID });
}

function testGoldenRule() {
  assert.ok(COMMERCIAL_PHOTO_DIRECTOR_GOLDEN_RULE.includes("advertising photographer"));
  console.log("✔ golden rule — thinks like advertising photographer, not generator");
}

function testPipelinePosition() {
  assert.equal(COMMERCIAL_PHOTO_PIPELINE_POSITION[1], COMMERCIAL_PHOTO_DIRECTOR_ID);
  assert.ok(COMMERCIAL_PHOTO_PIPELINE_POSITION.indexOf("lighting-director") > 1);
  console.log("✔ commercial photo director follows composition in pipeline");
}

function testStyleCatalog() {
  assert.ok(PHOTOGRAPHY_STYLE_CATALOG.length >= 11);
  assert.ok(PHOTOGRAPHY_STYLE_CATALOG.some((s) => s.id === PhotographyStyle.MODERN_MARKETPLACE));
  console.log("✔ photography style catalog defined");
}

function testBuildPhotographySectionTechnologyStory() {
  const { section } = buildPhotographySection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      creativeGoal: "Technical",
      priceSegment: "middle",
      productCutout: true,
      storyType: StoryType.TECHNOLOGY,
      sceneType: SceneType.TECHNOLOGY,
      layoutTemplateId: LayoutTemplate.FEATURE_GRID,
    },
    0.86,
  );
  assert.equal(section.photographyStyle, PhotographyStyle.TECHNOLOGY_PRODUCT);
  assert.ok(section.shootingNarrative.length > 25);
  assert.ok(section.lightingIntent.length > 10);
  assert.ok(section.cameraIntent.length > 10);
  assert.ok(section.materialIntent.length > 10);
  assert.ok(!section.photographyBlueprint.visualMood.includes("luxury"));
  console.log("✔ technology story maps to technology product shoot plan");
}

function testPhotographyNotPromptOrLayout() {
  const { section } = buildPhotographySection(
    {
      productCategory: "home_appliances",
      marketplace: "WB",
      creativeGoal: "Lifestyle",
      priceSegment: "middle",
      productCutout: false,
      storyType: StoryType.COMFORT,
      sceneType: SceneType.LIFESTYLE,
    },
    0.84,
  );
  const report = validatePhotographySection(section, {
    productCategory: "home_appliances",
    marketplace: "WB",
    creativeGoal: "Lifestyle",
    priceSegment: "middle",
    productCutout: false,
  });
  assert.equal(report.valid, true);
  const text = section.shootingNarrative.toLowerCase();
  assert.ok(!text.includes("prompt"));
  assert.ok(!text.includes("hero area"));
  console.log("✔ photography avoids prompt and layout decisions");
}

function testStoryConflictFails() {
  const { section } = buildPhotographySection(
    {
      productCategory: "cosmetics",
      marketplace: "WB",
      creativeGoal: "Premium",
      priceSegment: "premium",
      productCutout: true,
      storyType: StoryType.MINIMAL_LUXURY,
      primaryEmotion: "luxury",
    },
    0.9,
  );
  const forced = {
    ...section,
    photographyStyle: PhotographyStyle.LIFESTYLE_COMMERCIAL,
    photographyBlueprint: {
      ...section.photographyBlueprint,
      photographyStyle: PhotographyStyle.LIFESTYLE_COMMERCIAL,
    },
  };
  const report = validatePhotographySection(forced, {
    productCategory: "cosmetics",
    marketplace: "WB",
    creativeGoal: "Premium",
    priceSegment: "premium",
    productCutout: true,
    storyType: StoryType.MINIMAL_LUXURY,
    primaryEmotion: "luxury",
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.includes("STORY_CONFLICT"));
  console.log("✔ luxury story conflicts with lifestyle commercial photo style");
}

function testRunCommercialPhotoDirectorPipeline() {
  const context = bootstrapContext();
  const directorContext = commercialPhotoDirectorContextFromBlueprint(context.blueprint);
  const result = runCommercialPhotoDirector({ context, directorContext });
  assert.equal(result.section.photographyStyle, PhotographyStyle.TECHNOLOGY_PRODUCT);
  assert.equal(result.decisionSession.state.stages.length, 8);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "photography");
  assert.ok(result.explainability.rejectedAlternatives.length >= 1);
  console.log("✔ full decision pipeline produces photography mutations only");
}

function testPhotographyMutationsOwnership() {
  const { section } = buildPhotographySection(
    {
      productCategory: "cosmetics",
      marketplace: "WB",
      creativeGoal: "Premium",
      priceSegment: "premium",
      productCutout: true,
      storyType: StoryType.PREMIUM_LIFESTYLE,
      primaryEmotion: "luxury",
    },
    0.88,
  );
  const mutations = photographySectionToMutations(section, 0, "photo decision");
  assert.equal(mutations[0].producer, COMMERCIAL_PHOTO_DIRECTOR_ID);
  assert.equal(mutations[0].section, "photography");
  console.log("✔ commercial photo director publishes photography section only");
}

function testProductInteractionForCutout() {
  const { section } = buildPhotographySection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      creativeGoal: "CTR",
      priceSegment: "middle",
      productCutout: true,
      storyType: StoryType.INNOVATION,
    },
    0.85,
  );
  assert.equal(section.productInteraction, ProductInteraction.ON_SURFACE);
  assert.ok(section.materialIntent.includes("cutout") || section.materialIntent.includes("contact"));
  console.log("✔ cutout product gets surface contact material intent");
}

async function testLegacyAgentUsesChapter413() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.story.storyType = StoryType.TECHNOLOGY;
  bp.scene.sceneType = SceneType.TECHNOLOGY;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const result = await commercialPhotoDirectorAgent.execute(bp, {
    productCategory: "electronics",
    marketplace: "WB",
  });
  assert.ok(result.photographySection);
  assert.ok(result.photography.shootingNarrative);
  assert.ok(result.photography.photographyStyle);
  assert.ok(result.decisionTrace.some((t) => t.includes("observe")));
  console.log("✔ legacy commercial photo director agent uses Chapter 4.13 engine");
}

async function testUniversalAgentWrapper() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics" });
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: COMMERCIAL_PHOTO_DIRECTOR_ID });
  const result = await universalCommercialPhotoDirectorAgent.execute(ctx);
  assert.equal(result.mutations[0].section, "photography");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  console.log("✔ universal agent wrapper returns normalized confidence and mutations");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testStyleCatalog();
  testBuildPhotographySectionTechnologyStory();
  testPhotographyNotPromptOrLayout();
  testStoryConflictFails();
  testRunCommercialPhotoDirectorPipeline();
  testPhotographyMutationsOwnership();
  testProductInteractionForCutout();
  await testLegacyAgentUsesChapter413();
  await testUniversalAgentWrapper();
  console.log("\ncommercial-photo-director.spec.ts — all passed");
}

run();

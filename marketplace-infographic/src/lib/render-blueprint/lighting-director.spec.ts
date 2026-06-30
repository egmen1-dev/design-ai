/**
 * DESIGN AI v18 — Lighting Director tests (Chapter 4.14)
 */
import assert from "node:assert/strict";
import {
  LIGHTING_DIRECTOR_GOLDEN_RULE,
  LIGHTING_DIRECTOR_ID,
  LIGHTING_DIRECTOR_PIPELINE_POSITION,
  LIGHTING_SCHEME_CATALOG,
  LightingScheme,
  LightingStyle,
  PhotographyStyle,
  StoryType,
  SceneType,
  buildLightingSection,
  validateLightingSection,
  runLightingDirector,
  lightingDirectorContextFromBlueprint,
  lightingSectionToMutations,
  lightingDirectorAgent,
  universalLightingDirectorAgent,
  createEmptyRenderBlueprint,
  buildAgentContextPackage,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function bootstrapContext() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics", seed: 5 });
  bp.creative.marketplace = "WB";
  bp.story = {
    hook: "Премиальный образ",
    customerProblem: "стандарт не передаёт статус",
    customerDesire: "исключительное качество",
    visualPromise: "премиальность",
    emotionalTone: "luxury",
    narrative: "Премиальная история",
    storyType: StoryType.PREMIUM_LIFESTYLE,
    primaryEmotion: "luxury",
    commercialGoal: "increase_premium_perception",
  };
  bp.scene = {
    environment: "living_room",
    architecture: "modern",
    timeOfDay: "golden_hour",
    weather: "clear",
    depth: "medium",
    surface: "marble",
    sceneType: SceneType.LUXURY,
    lightingMood: "warm premium ambient light",
  };
  bp.photography = {
    style: "advertising",
    shotType: "hero",
    backgroundBlur: 0.35,
    contrast: "soft",
    visualMood: "warm morning ambiance",
    realism: 0.9,
    photographyStyle: PhotographyStyle.LUXURY_ADVERTISING,
    photoMood: "warm_morning",
    lightingIntent: "Soft natural morning key with gentle fill",
    shootingNarrative: "Премиальная предметная съёмка",
  };
  bp.lifecycle.sections.photography = SectionState.READY;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  return buildAgentContextPackage({ blueprint: bp, agentId: LIGHTING_DIRECTOR_ID });
}

function testGoldenRule() {
  assert.ok(LIGHTING_DIRECTOR_GOLDEN_RULE.includes("plausible"));
  console.log("✔ golden rule — lighting is plausible, product stays primary");
}

function testPipelinePosition() {
  assert.equal(LIGHTING_DIRECTOR_PIPELINE_POSITION[1], LIGHTING_DIRECTOR_ID);
  assert.ok(LIGHTING_DIRECTOR_PIPELINE_POSITION.indexOf("camera-director") > 1);
  console.log("✔ lighting director follows commercial photo director");
}

function testSchemeCatalog() {
  assert.ok(LIGHTING_SCHEME_CATALOG.length >= 10);
  assert.ok(LIGHTING_SCHEME_CATALOG.some((s) => s.id === LightingScheme.TOP_SOFTBOX));
  console.log("✔ lighting scheme catalog defined");
}

function testBuildLightingSectionLuxuryPhotography() {
  const { section } = buildLightingSection(
    {
      productCategory: "cosmetics",
      marketplace: "WB",
      productCutout: true,
      storyType: StoryType.PREMIUM_LIFESTYLE,
      primaryEmotion: "luxury",
      photographyStyle: PhotographyStyle.LUXURY_ADVERTISING,
      lightingIntent: "Soft natural morning key with gentle fill",
      sceneType: SceneType.LUXURY,
    },
    0.88,
  );
  assert.equal(section.lightingScheme, LightingScheme.LUXURY_SIDE_LIGHT);
  assert.equal(section.lightingStyle, LightingStyle.LUXURY_WARM);
  assert.ok(section.keyLight.intensity > 0);
  assert.ok(section.shadowProfile.contactShadow);
  assert.ok(section.colorTemperature >= 4000);
  console.log("✔ luxury photography maps to luxury side light scheme");
}

function testLightingNotPromptOrComposition() {
  const { section } = buildLightingSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      productCutout: true,
      storyType: StoryType.TECHNOLOGY,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      lightingIntent: "Even key with controlled reflections",
    },
    0.85,
  );
  const report = validateLightingSection(section, {
    productCategory: "electronics",
    marketplace: "WB",
    productCutout: true,
    photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
    lightingIntent: "Even key with controlled reflections",
  });
  assert.equal(report.valid, true);
  assert.ok(!section.lightingMood.includes("prompt"));
  console.log("✔ lighting avoids prompt and composition decisions");
}

function testCutoutRequiresContactShadow() {
  const { section } = buildLightingSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      productCutout: true,
      photographyStyle: PhotographyStyle.MODERN_MARKETPLACE,
      lightingIntent: "Balanced commercial key",
    },
    0.84,
  );
  const forced = {
    ...section,
    shadowProfile: { ...section.shadowProfile, contactShadow: false },
    lightingBlueprint: {
      ...section.lightingBlueprint,
      shadowProfile: { ...section.shadowProfile, contactShadow: false },
    },
  };
  const report = validateLightingSection(forced, {
    productCategory: "electronics",
    marketplace: "WB",
    productCutout: true,
    photographyStyle: PhotographyStyle.MODERN_MARKETPLACE,
    lightingIntent: "Balanced commercial key",
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.includes("PRODUCT_COMPOSITE_INCOMPATIBLE"));
  console.log("✔ cutout product requires contact shadow");
}

function testRunLightingDirectorPipeline() {
  const context = bootstrapContext();
  const directorContext = lightingDirectorContextFromBlueprint(context.blueprint);
  const result = runLightingDirector({ context, directorContext });
  assert.equal(result.section.lightingScheme, LightingScheme.LUXURY_SIDE_LIGHT);
  assert.equal(result.decisionSession.state.stages.length, 8);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "lighting");
  assert.ok(result.explainability.rejectedAlternatives.length >= 1);
  console.log("✔ full decision pipeline produces lighting mutations only");
}

function testLightingMutationsOwnership() {
  const { section } = buildLightingSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      productCutout: false,
      storyType: StoryType.INNOVATION,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      lightingIntent: "Crisp neutral key",
    },
    0.86,
  );
  const mutations = lightingSectionToMutations(section, 0, "lighting decision");
  assert.equal(mutations[0].producer, LIGHTING_DIRECTOR_ID);
  assert.equal(mutations[0].section, "lighting");
  console.log("✔ lighting director publishes lighting section only");
}

function testMarketplaceUsesTopSoftbox() {
  const { section } = buildLightingSection(
    {
      productCategory: "home_appliances",
      marketplace: "WB",
      productCutout: true,
      photographyStyle: PhotographyStyle.MODERN_MARKETPLACE,
      lightingIntent: "Clean marketplace lighting",
    },
    0.83,
  );
  assert.equal(section.lightingScheme, LightingScheme.TOP_SOFTBOX);
  console.log("✔ WB marketplace prefers top softbox scheme");
}

async function testLegacyAgentUsesChapter414() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics" });
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.photography.photographyStyle = PhotographyStyle.LUXURY_ADVERTISING;
  bp.photography.lightingIntent = "Soft morning key";
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const result = await lightingDirectorAgent.execute(bp, {
    productCategory: "cosmetics",
    marketplace: "WB",
  });
  assert.ok(result.lightingSection);
  assert.ok(result.lighting.lightingScheme);
  assert.ok(result.lighting.keyLight);
  assert.ok(result.decisionTrace.some((t) => t.includes("observe")));
  console.log("✔ legacy lighting director agent uses Chapter 4.14 engine");
}

async function testUniversalAgentWrapper() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.photography.photographyStyle = PhotographyStyle.TECHNOLOGY_PRODUCT;
  bp.photography.lightingIntent = "Controlled reflections";
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: LIGHTING_DIRECTOR_ID });
  const result = await universalLightingDirectorAgent.execute(ctx);
  assert.equal(result.mutations[0].section, "lighting");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  console.log("✔ universal agent wrapper returns normalized confidence and mutations");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testSchemeCatalog();
  testBuildLightingSectionLuxuryPhotography();
  testLightingNotPromptOrComposition();
  testCutoutRequiresContactShadow();
  testRunLightingDirectorPipeline();
  testLightingMutationsOwnership();
  testMarketplaceUsesTopSoftbox();
  await testLegacyAgentUsesChapter414();
  await testUniversalAgentWrapper();
  console.log("\nlighting-director.spec.ts — all passed");
}

run();

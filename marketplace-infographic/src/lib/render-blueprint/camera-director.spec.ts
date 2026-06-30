/**
 * DESIGN AI v18 — Camera Director tests (Chapter 4.15)
 */
import assert from "node:assert/strict";
import {
  CAMERA_DIRECTOR_GOLDEN_RULE,
  CAMERA_DIRECTOR_ID,
  CAMERA_DIRECTOR_PIPELINE_POSITION,
  CAMERA_STYLE_CATALOG,
  CameraStyle,
  CameraAngleStyle,
  CameraHeightStyle,
  DepthOfFieldProfile,
  FramingProfile,
  PhotographyStyle,
  StoryType,
  SceneType,
  LightingScheme,
  FocusStrategy,
  buildCameraSection,
  validateCameraSection,
  runCameraDirector,
  cameraDirectorContextFromBlueprint,
  cameraSectionToMutations,
  cameraDirectorAgent,
  universalCameraDirectorAgent,
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
    cameraIntent: "Three-quarter product angle, front-weighted focus, natural eye-level commercial framing",
    shootingNarrative: "Премиальная предметная съёмка",
  };
  bp.lighting = {
    preset: "golden_hour",
    temperature: 4200,
    key: "soft_key_camera_left",
    fill: "balanced",
    rim: "subtle",
    back: "none",
    shadowSoftness: 0.75,
    reflectionStrength: 0.35,
    lightingScheme: LightingScheme.LUXURY_SIDE_LIGHT,
  };
  bp.lifecycle.sections.photography = SectionState.READY;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  return buildAgentContextPackage({ blueprint: bp, agentId: CAMERA_DIRECTOR_ID });
}

function testGoldenRule() {
  assert.ok(CAMERA_DIRECTOR_GOLDEN_RULE.includes("viewpoint"));
  console.log("✔ golden rule — viewpoint for commercial value, not beauty");
}

function testPipelinePosition() {
  assert.equal(CAMERA_DIRECTOR_PIPELINE_POSITION[1], CAMERA_DIRECTOR_ID);
  assert.ok(CAMERA_DIRECTOR_PIPELINE_POSITION.indexOf("material-director") > 1);
  console.log("✔ camera director follows lighting director");
}

function testStyleCatalog() {
  assert.ok(CAMERA_STYLE_CATALOG.length >= 6);
  assert.ok(CAMERA_STYLE_CATALOG.some((s) => s.id === CameraStyle.MARKETPLACE_THUMB));
  console.log("✔ camera style catalog defined");
}

function testBuildCameraSectionPremiumPhotography() {
  const { section } = buildCameraSection(
    {
      productCategory: "cosmetics",
      marketplace: "WB",
      storyType: StoryType.PREMIUM_LIFESTYLE,
      primaryEmotion: "luxury",
      photographyStyle: PhotographyStyle.LUXURY_ADVERTISING,
      cameraIntent: "Three-quarter product angle, front-weighted focus",
      lightingScheme: LightingScheme.LUXURY_SIDE_LIGHT,
    },
    0.88,
  );
  assert.equal(section.cameraStyle, CameraStyle.PREMIUM_HERO);
  assert.equal(section.cameraHeight, CameraHeightStyle.LOW_ANGLE);
  assert.equal(section.focalLength, 85);
  assert.equal(section.depthOfField, DepthOfFieldProfile.SOFT_BACKGROUND);
  assert.ok(section.heroScale >= 0.35);
  console.log("✔ premium photography maps to premium hero camera style");
}

function testCameraNotPromptOrLighting() {
  const { section } = buildCameraSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      storyType: StoryType.TECHNOLOGY,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      cameraIntent: "Even key with controlled reflections",
      lightingScheme: LightingScheme.TWO_POINT_STUDIO,
    },
    0.85,
  );
  const report = validateCameraSection(section, {
    productCategory: "electronics",
    marketplace: "WB",
    photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
    lightingScheme: LightingScheme.TWO_POINT_STUDIO,
  });
  assert.equal(report.valid, true);
  assert.ok(!section.providerHints.some((h) => h.includes("prompt")));
  console.log("✔ camera avoids prompt and lighting decisions");
}

function testHeroTooSmallFails() {
  const { section } = buildCameraSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      photographyStyle: PhotographyStyle.LIFESTYLE_COMMERCIAL,
      lightingScheme: LightingScheme.NATURAL_WINDOW_LIGHT,
      sceneType: SceneType.LIFESTYLE,
    },
    0.84,
  );
  const forced = {
    ...section,
    heroScale: 0.2,
    cameraBlueprint: { ...section.cameraBlueprint, heroScale: 0.2 },
  };
  const report = validateCameraSection(forced, {
    productCategory: "electronics",
    marketplace: "WB",
    photographyStyle: PhotographyStyle.LIFESTYLE_COMMERCIAL,
    lightingScheme: LightingScheme.NATURAL_WINDOW_LIGHT,
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.includes("HERO_TOO_SMALL"));
  console.log("✔ hero scale below threshold fails validation");
}

function testRunCameraDirectorPipeline() {
  const context = bootstrapContext();
  const directorContext = cameraDirectorContextFromBlueprint(context.blueprint);
  const result = runCameraDirector({ context, directorContext });
  assert.equal(result.section.cameraStyle, CameraStyle.PREMIUM_HERO);
  assert.equal(result.decisionSession.state.stages.length, 8);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "camera");
  assert.ok(result.explainability.rejectedAlternatives.length >= 1);
  console.log("✔ full decision pipeline produces camera mutations only");
}

function testCameraMutationsOwnership() {
  const { section } = buildCameraSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      storyType: StoryType.INNOVATION,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      lightingScheme: LightingScheme.TOP_SOFTBOX,
    },
    0.86,
  );
  const mutations = cameraSectionToMutations(section, 0, "camera decision");
  assert.equal(mutations[0].producer, CAMERA_DIRECTOR_ID);
  assert.equal(mutations[0].section, "camera");
  console.log("✔ camera director publishes camera section only");
}

function testMarketplaceUsesThumbStyle() {
  const { section } = buildCameraSection(
    {
      productCategory: "home_appliances",
      marketplace: "WB",
      photographyStyle: PhotographyStyle.MODERN_MARKETPLACE,
      focusStrategy: FocusStrategy.ENTIRE_PRODUCT_SHARP,
      lightingScheme: LightingScheme.TOP_SOFTBOX,
    },
    0.83,
  );
  assert.equal(section.cameraStyle, CameraStyle.MARKETPLACE_THUMB);
  assert.equal(section.framingProfile, FramingProfile.MARKETPLACE_FOCUS);
  assert.equal(section.depthOfField, DepthOfFieldProfile.ENTIRE_PRODUCT_SHARP);
  console.log("✔ WB marketplace prefers marketplace thumb camera style");
}

function testLegacyBlueprintMapping() {
  const { section } = buildCameraSection(
    {
      productCategory: "electronics",
      marketplace: "OZON",
      storyType: StoryType.TECHNOLOGY,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      lightingScheme: LightingScheme.TWO_POINT_STUDIO,
    },
    0.85,
  );
  assert.equal(section.cameraBlueprint.lens, 50);
  assert.equal(section.cameraBlueprint.angle, "three-quarter");
  assert.equal(section.cameraBlueprint.distance, "medium");
  assert.ok(section.cameraBlueprint.cameraStyle);
  assert.ok(section.cameraBlueprint.focalLength);
  console.log("✔ camera section maps to legacy camera blueprint fields");
}

async function testLegacyAgentUsesChapter415() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics" });
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.photography.photographyStyle = PhotographyStyle.LUXURY_ADVERTISING;
  bp.photography.cameraIntent = "Three-quarter product angle";
  bp.lighting.lightingScheme = LightingScheme.LUXURY_SIDE_LIGHT;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const result = await cameraDirectorAgent.execute(bp, {
    productCategory: "cosmetics",
    marketplace: "WB",
  });
  assert.ok(result.cameraSection);
  assert.ok(result.camera.cameraStyle);
  assert.ok(result.camera.focalLength);
  assert.ok(result.decisionTrace.some((t) => t.includes("observe")));
  console.log("✔ legacy camera director agent uses Chapter 4.15 engine");
}

async function testUniversalAgentWrapper() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.photography.photographyStyle = PhotographyStyle.TECHNOLOGY_PRODUCT;
  bp.lighting.lightingScheme = LightingScheme.TWO_POINT_STUDIO;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: CAMERA_DIRECTOR_ID });
  const result = await universalCameraDirectorAgent.execute(ctx);
  assert.equal(result.mutations[0].section, "camera");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  console.log("✔ universal agent wrapper returns normalized confidence and mutations");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testStyleCatalog();
  testBuildCameraSectionPremiumPhotography();
  testCameraNotPromptOrLighting();
  testHeroTooSmallFails();
  testRunCameraDirectorPipeline();
  testCameraMutationsOwnership();
  testMarketplaceUsesThumbStyle();
  testLegacyBlueprintMapping();
  await testLegacyAgentUsesChapter415();
  await testUniversalAgentWrapper();
  console.log("\ncamera-director.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Material Director tests (Chapter 4.16)
 */
import assert from "node:assert/strict";
import {
  MATERIAL_DIRECTOR_GOLDEN_RULE,
  MATERIAL_DIRECTOR_ID,
  MATERIAL_DIRECTOR_PIPELINE_POSITION,
  MATERIAL_WORLD_CATALOG,
  MaterialWorld,
  ReflectionProfile,
  RoughnessProfile,
  ContactSurface,
  TextureComplexity,
  PhotographyStyle,
  StoryType,
  SceneType,
  LightingScheme,
  CameraStyle,
  buildMaterialSection,
  validateMaterialSection,
  runMaterialDirector,
  materialDirectorContextFromBlueprint,
  materialSectionToMutations,
  materialDirectorAgent,
  universalMaterialDirectorAgent,
  createEmptyRenderBlueprint,
  buildAgentContextPackage,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function bootstrapContext() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics", seed: 6 });
  bp.creative.marketplace = "WB";
  bp.product.cutout = true;
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
    materialPalette: ["marble", "oak", "soft fabric"],
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
    cameraIntent: "Three-quarter product angle",
    materialIntent: "Premium surface contact shadows — product sits naturally on scene materials",
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
    lightingStyle: "luxury_warm",
  };
  bp.camera = {
    lens: 85,
    height: "low",
    angle: "three-quarter",
    distance: "close",
    perspective: "dramatic",
    cameraStyle: CameraStyle.PREMIUM_HERO,
    focalLength: 85,
    heroScale: 0.52,
  };
  bp.lifecycle.sections.photography = SectionState.READY;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  return buildAgentContextPackage({ blueprint: bp, agentId: MATERIAL_DIRECTOR_ID });
}

function testGoldenRule() {
  assert.ok(MATERIAL_DIRECTOR_GOLDEN_RULE.includes("physically convincing"));
  console.log("✔ golden rule — materials are physically convincing, not decorative");
}

function testPipelinePosition() {
  assert.equal(MATERIAL_DIRECTOR_PIPELINE_POSITION[1], MATERIAL_DIRECTOR_ID);
  assert.ok(MATERIAL_DIRECTOR_PIPELINE_POSITION.indexOf("render-pipeline") > 1);
  console.log("✔ material director follows camera director");
}

function testWorldCatalog() {
  assert.ok(MATERIAL_WORLD_CATALOG.length >= 6);
  assert.ok(MATERIAL_WORLD_CATALOG.some((w) => w.id === MaterialWorld.MARKETPLACE_NEUTRAL));
  console.log("✔ material world catalog defined");
}

function testBuildMaterialSectionLuxuryStory() {
  const { section } = buildMaterialSection(
    {
      productCategory: "cosmetics",
      marketplace: "OZON",
      storyType: StoryType.PREMIUM_LIFESTYLE,
      primaryEmotion: "luxury",
      photographyStyle: PhotographyStyle.LUXURY_ADVERTISING,
      materialIntent: "Premium surface contact shadows",
      lightingScheme: LightingScheme.LUXURY_SIDE_LIGHT,
      cameraStyle: CameraStyle.PREMIUM_HERO,
    },
    0.88,
  );
  assert.equal(section.materialWorld, MaterialWorld.LUXURY_INTERIOR);
  assert.equal(section.reflectionProfile, ReflectionProfile.SOFT_SATIN);
  assert.ok(section.surfacePalette.length >= 2);
  assert.ok(section.surfacePalette.length <= 4);
  console.log("✔ luxury story maps to luxury interior material world");
}

function testMaterialNotPromptOrLighting() {
  const { section } = buildMaterialSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      storyType: StoryType.TECHNOLOGY,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      materialIntent: "Consistent scene materials with subtle contact shadows",
      lightingScheme: LightingScheme.TWO_POINT_STUDIO,
      cameraStyle: CameraStyle.TECHNOLOGY_DETAIL,
    },
    0.85,
  );
  const report = validateMaterialSection(section, {
    productCategory: "electronics",
    marketplace: "WB",
    photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
    lightingScheme: LightingScheme.TWO_POINT_STUDIO,
    cameraStyle: CameraStyle.TECHNOLOGY_DETAIL,
  });
  assert.equal(report.valid, true);
  assert.ok(!section.providerHints.some((h) => h.includes("prompt")));
  console.log("✔ materials avoid prompt and lighting decisions");
}

function testCutoutRequiresMatteContact() {
  const { section } = buildMaterialSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      productCutout: true,
      photographyStyle: PhotographyStyle.MODERN_MARKETPLACE,
      lightingScheme: LightingScheme.TOP_SOFTBOX,
      cameraStyle: CameraStyle.MARKETPLACE_THUMB,
    },
    0.84,
  );
  assert.equal(section.reflectionProfile, ReflectionProfile.MATTE);
  assert.equal(section.contactSurface, ContactSurface.STUDIO_FLOOR);
  const forced = {
    ...section,
    contactSurface: ContactSurface.GLASS_SURFACE,
    materialBlueprint: { ...section.materialBlueprint, contactSurface: ContactSurface.GLASS_SURFACE },
  };
  const report = validateMaterialSection(forced, {
    productCategory: "electronics",
    marketplace: "WB",
    productCutout: true,
    photographyStyle: PhotographyStyle.MODERN_MARKETPLACE,
    cameraStyle: CameraStyle.MARKETPLACE_THUMB,
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.includes("CUTOUT_INCOMPATIBLE"));
  console.log("✔ cutout product requires matte studio contact surface");
}

function testRunMaterialDirectorPipeline() {
  const context = bootstrapContext();
  const directorContext = materialDirectorContextFromBlueprint(context.blueprint);
  const result = runMaterialDirector({ context, directorContext });
  assert.equal(result.section.materialWorld, MaterialWorld.MARKETPLACE_NEUTRAL);
  assert.equal(result.decisionSession.state.stages.length, 8);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "materials");
  assert.ok(result.explainability.rejectedAlternatives.length >= 1);
  console.log("✔ full decision pipeline produces material mutations only");
}

function testMaterialMutationsOwnership() {
  const { section } = buildMaterialSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      storyType: StoryType.INNOVATION,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      lightingScheme: LightingScheme.TOP_SOFTBOX,
      cameraStyle: CameraStyle.TECHNOLOGY_DETAIL,
    },
    0.86,
  );
  const mutations = materialSectionToMutations(section, 0, "material decision");
  assert.equal(mutations[0].producer, MATERIAL_DIRECTOR_ID);
  assert.equal(mutations[0].section, "materials");
  console.log("✔ material director publishes materials section only");
}

function testMarketplaceUsesNeutralWorld() {
  const { section } = buildMaterialSection(
    {
      productCategory: "home_appliances",
      marketplace: "WB",
      productCutout: true,
      photographyStyle: PhotographyStyle.MODERN_MARKETPLACE,
      lightingScheme: LightingScheme.TOP_SOFTBOX,
      cameraStyle: CameraStyle.MARKETPLACE_THUMB,
    },
    0.83,
  );
  assert.equal(section.materialWorld, MaterialWorld.MARKETPLACE_NEUTRAL);
  assert.equal(section.textureComplexity, TextureComplexity.MINIMAL);
  assert.equal(section.reflectionProfile, ReflectionProfile.MATTE);
  console.log("✔ WB marketplace prefers neutral matte material world");
}

function testLegacyBlueprintMapping() {
  const { section } = buildMaterialSection(
    {
      productCategory: "electronics",
      marketplace: "OZON",
      storyType: StoryType.TECHNOLOGY,
      photographyStyle: PhotographyStyle.TECHNOLOGY_PRODUCT,
      lightingScheme: LightingScheme.TWO_POINT_STUDIO,
      cameraStyle: CameraStyle.TECHNOLOGY_DETAIL,
    },
    0.85,
  );
  assert.ok(section.materialBlueprint.floor.length > 3);
  assert.ok(section.materialBlueprint.walls.length > 3);
  assert.equal(section.materialBlueprint.reflection, "medium");
  assert.ok(section.materialBlueprint.roughness > 0);
  assert.ok(section.materialBlueprint.materialWorld);
  assert.ok(section.materialBlueprint.surfacePalette);
  console.log("✔ material section maps to legacy material blueprint fields");
}

async function testLegacyAgentUsesChapter416() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics" });
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.photography.photographyStyle = PhotographyStyle.LUXURY_ADVERTISING;
  bp.photography.materialIntent = "Premium contact shadows";
  bp.lighting.lightingScheme = LightingScheme.LUXURY_SIDE_LIGHT;
  bp.camera.cameraStyle = CameraStyle.PREMIUM_HERO;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const result = await materialDirectorAgent.execute(bp, {
    productCategory: "cosmetics",
    marketplace: "OZON",
  });
  assert.ok(result.materialSection);
  assert.ok(result.materials.materialWorld);
  assert.ok(result.materials.surfacePalette);
  assert.ok(result.decisionTrace.some((t) => t.includes("observe")));
  console.log("✔ legacy material director agent uses Chapter 4.16 engine");
}

async function testUniversalAgentWrapper() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.photography.photographyStyle = PhotographyStyle.TECHNOLOGY_PRODUCT;
  bp.lighting.lightingScheme = LightingScheme.TWO_POINT_STUDIO;
  bp.camera.cameraStyle = CameraStyle.TECHNOLOGY_DETAIL;
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: MATERIAL_DIRECTOR_ID });
  const result = await universalMaterialDirectorAgent.execute(ctx);
  assert.equal(result.mutations[0].section, "materials");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  console.log("✔ universal agent wrapper returns normalized confidence and mutations");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testWorldCatalog();
  testBuildMaterialSectionLuxuryStory();
  testMaterialNotPromptOrLighting();
  testCutoutRequiresMatteContact();
  testRunMaterialDirectorPipeline();
  testMaterialMutationsOwnership();
  testMarketplaceUsesNeutralWorld();
  testLegacyBlueprintMapping();
  await testLegacyAgentUsesChapter416();
  await testUniversalAgentWrapper();
  console.log("\nmaterial-director.spec.ts — all passed");
}

run();

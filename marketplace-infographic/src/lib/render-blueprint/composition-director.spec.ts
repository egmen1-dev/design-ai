/**
 * DESIGN AI v18 — Composition Director tests (Chapter 4.12)
 */
import assert from "node:assert/strict";
import {
  COMPOSITION_DIRECTOR_GOLDEN_RULE,
  COMPOSITION_DIRECTOR_ID,
  COMPOSITION_DIRECTOR_PIPELINE_POSITION,
  LAYOUT_TEMPLATE_CATALOG,
  LayoutTemplate,
  EyeFlowProfile,
  HierarchyLevel,
  StoryType,
  SceneType,
  buildLayoutSection,
  validateLayoutSection,
  runCompositionDirector,
  rectsOverlap,
  compositionDirectorContextFromBlueprint,
  layoutSectionToMutations,
  compositionDirectorAgent,
  universalCompositionDirectorAgent,
  createEmptyRenderBlueprint,
  buildAgentContextPackage,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function bootstrapContext() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics", seed: 3 });
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
    environmentType: "luxury_interior",
    backgroundNarrative: "Продукт в премиальном интерьере",
  };
  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.sections.scene = SectionState.READY;
  bp.lifecycle.stage = BlueprintLifecycle.COMPOSITION_DEFINED;
  return buildAgentContextPackage({ blueprint: bp, agentId: COMPOSITION_DIRECTOR_ID });
}

function testGoldenRule() {
  assert.ok(COMPOSITION_DIRECTOR_GOLDEN_RULE.includes("attention path"));
  console.log("✔ golden rule — composition designs buyer attention path");
}

function testPipelinePosition() {
  assert.equal(COMPOSITION_DIRECTOR_PIPELINE_POSITION[1], COMPOSITION_DIRECTOR_ID);
  assert.ok(COMPOSITION_DIRECTOR_PIPELINE_POSITION.indexOf("commercial-photo-director") > 1);
  console.log("✔ composition director follows scene director");
}

function testTemplateCatalog() {
  assert.ok(LAYOUT_TEMPLATE_CATALOG.length >= 7);
  assert.ok(LAYOUT_TEMPLATE_CATALOG.some((t) => t.id === LayoutTemplate.MODERN_MARKETPLACE));
  console.log("✔ layout template catalog defined");
}

function testBuildLayoutSectionPremiumStory() {
  const { section } = buildLayoutSection(
    {
      productCategory: "cosmetics",
      marketplace: "WB",
      creativeGoal: "Premium",
      priceSegment: "premium",
      productCutout: true,
      aspectRatio: "3:4",
      storyType: StoryType.PREMIUM_LIFESTYLE,
      primaryEmotion: "luxury",
      sceneType: SceneType.LUXURY,
      mustLeaveHeadlineSpace: true,
      mustLeaveBadgeSpace: true,
      mustLeaveBenefitsSpace: true,
      mustAvoidHeroOverlap: true,
    },
    0.87,
  );
  assert.equal(section.templateId, LayoutTemplate.LUXURY_SHOWCASE);
  assert.equal(section.visualHierarchy[0], HierarchyLevel.HERO);
  assert.ok(section.whiteSpace >= 0.2);
  assert.ok(section.heroArea.width > 0.4);
  assert.ok(section.safeZones.length >= 1);
  console.log("✔ premium story maps to luxury showcase layout");
}

function testHeroDoesNotOverlapOverlayZones() {
  const { section } = buildLayoutSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      creativeGoal: "Technical",
      priceSegment: "middle",
      productCutout: true,
      aspectRatio: "3:4",
      storyType: StoryType.TECHNOLOGY,
      sceneType: SceneType.TECHNOLOGY,
      mustLeaveHeadlineSpace: true,
      mustLeaveBadgeSpace: true,
      mustLeaveBenefitsSpace: true,
      mustAvoidHeroOverlap: true,
    },
    0.84,
  );
  const report = validateLayoutSection(section, {
    productCategory: "electronics",
    marketplace: "WB",
    creativeGoal: "Technical",
    priceSegment: "middle",
    productCutout: true,
    aspectRatio: "3:4",
    mustLeaveHeadlineSpace: true,
    mustLeaveBadgeSpace: true,
    mustLeaveBenefitsSpace: true,
    mustAvoidHeroOverlap: true,
  });
  assert.equal(report.valid, true);
  assert.equal(rectsOverlap(section.heroArea, section.headlineArea), false);
  console.log("✔ hero kept clear of headline and benefits zones");
}

function testHeroOverlapFails() {
  const { section } = buildLayoutSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      creativeGoal: "Lifestyle",
      priceSegment: "middle",
      productCutout: true,
      aspectRatio: "3:4",
      mustLeaveHeadlineSpace: true,
      mustLeaveBadgeSpace: true,
      mustLeaveBenefitsSpace: true,
      mustAvoidHeroOverlap: true,
    },
    0.8,
  );
  const forced = {
    ...section,
    heroArea: { x: 0.5, y: 0.1, width: 0.4, height: 0.3 },
    headlineArea: { x: 0.52, y: 0.1, width: 0.4, height: 0.12 },
    compositionBlueprint: {
      ...section.compositionBlueprint,
      heroArea: { x: 0.5, y: 0.1, width: 0.4, height: 0.3 },
      headlineArea: { x: 0.52, y: 0.1, width: 0.4, height: 0.12 },
    },
  };
  const report = validateLayoutSection(forced, {
    productCategory: "electronics",
    marketplace: "WB",
    creativeGoal: "Lifestyle",
    priceSegment: "middle",
    productCutout: true,
    aspectRatio: "3:4",
    mustLeaveHeadlineSpace: true,
    mustLeaveBadgeSpace: true,
    mustLeaveBenefitsSpace: true,
    mustAvoidHeroOverlap: true,
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.includes("HERO_OVERLAY_CONFLICT"));
  console.log("✔ hero overlay conflict fails validation");
}

function testRunCompositionDirectorPipeline() {
  const context = bootstrapContext();
  const directorContext = compositionDirectorContextFromBlueprint(context.blueprint);
  const result = runCompositionDirector({ context, directorContext });
  assert.equal(result.section.templateId, LayoutTemplate.LUXURY_SHOWCASE);
  assert.equal(result.decisionSession.state.stages.length, 8);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "composition");
  assert.ok(result.explainability.rejectedAlternatives.length >= 1);
  console.log("✔ full decision pipeline produces composition mutations only");
}

function testLayoutMutationsOwnership() {
  const { section } = buildLayoutSection(
    {
      productCategory: "electronics",
      marketplace: "WB",
      creativeGoal: "CTR",
      priceSegment: "middle",
      productCutout: true,
      aspectRatio: "3:4",
      storyType: StoryType.INNOVATION,
      mustLeaveHeadlineSpace: true,
      mustLeaveBadgeSpace: true,
      mustLeaveBenefitsSpace: true,
      mustAvoidHeroOverlap: true,
    },
    0.85,
  );
  const mutations = layoutSectionToMutations(section, 0, "layout decision");
  assert.equal(mutations[0].producer, COMPOSITION_DIRECTOR_ID);
  assert.equal(mutations[0].section, "composition");
  console.log("✔ composition director publishes composition section only");
}

async function testLegacyAgentUsesChapter412() {
  const bp = createEmptyRenderBlueprint({ category: "cosmetics" });
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.scene.sceneType = SceneType.LUXURY;
  bp.lifecycle.stage = BlueprintLifecycle.COMPOSITION_DEFINED;
  const result = await compositionDirectorAgent.execute(bp, {
    productCategory: "cosmetics",
    marketplace: "WB",
  });
  assert.ok(result.layoutSection);
  assert.ok(result.composition.templateId);
  assert.ok(result.composition.heroArea);
  assert.ok(result.decisionTrace.some((t) => t.includes("observe")));
  console.log("✔ legacy composition director agent uses Chapter 4.12 engine");
}

async function testUniversalAgentWrapper() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.story.storyType = StoryType.TECHNOLOGY;
  bp.scene.sceneType = SceneType.TECHNOLOGY;
  bp.lifecycle.stage = BlueprintLifecycle.COMPOSITION_DEFINED;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: COMPOSITION_DIRECTOR_ID });
  const result = await universalCompositionDirectorAgent.execute(ctx);
  assert.equal(result.mutations[0].section, "composition");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  console.log("✔ universal agent wrapper returns normalized confidence and mutations");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testTemplateCatalog();
  testBuildLayoutSectionPremiumStory();
  testHeroDoesNotOverlapOverlayZones();
  testHeroOverlapFails();
  testRunCompositionDirectorPipeline();
  testLayoutMutationsOwnership();
  await testLegacyAgentUsesChapter412();
  await testUniversalAgentWrapper();
  console.log("\ncomposition-director.spec.ts — all passed");
}

run();

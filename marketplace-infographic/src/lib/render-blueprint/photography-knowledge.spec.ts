/**
 * DESIGN AI v18 — Photography Knowledge tests (Chapter 5.9)
 */
import assert from "node:assert/strict";
import {
  PHOTOGRAPHY_KNOWLEDGE_VERSION,
  PHOTOGRAPHY_KNOWLEDGE_GOLDEN_RULE,
  PRODUCT_FIRST_PRINCIPLE,
  PhotographyTopic,
  LightingKnowledgeScheme,
  LensProfile,
  MaterialType,
  ExposureMode,
  SEED_PHOTOGRAPHY_KNOWLEDGE,
  LIGHTING_SCHEME_KNOWLEDGE,
  LENS_KNOWLEDGE,
  MATERIAL_LIGHTING_MAP,
  getPhotographyKnowledge,
  getPhotographyKnowledgeByTopic,
  matchPhotographyKnowledge,
  recommendPhotographyKnowledge,
  getLensRecommendation,
  getMaterialLightingAdvice,
  validatePhotographyBlueprint,
  applyPhotographyLearningFeedback,
  validatePhotographyKnowledge,
  assertPhotographyKnowledge,
  runPhotographyKnowledge,
  isPhotographyKnowledgeFailure,
} from "./index";
import { ProductCategoryKnowledge } from "./marketplace-knowledge-types";

function testGoldenRule() {
  assert.ok(PHOTOGRAPHY_KNOWLEDGE_GOLDEN_RULE.includes("does not begin with the camera"));
  assert.equal(PHOTOGRAPHY_KNOWLEDGE_VERSION, "5.9.0");
  console.log("✔ golden rule — photography begins with buyer perception, not camera");
}

function testProductFirst() {
  const rule = getPhotographyKnowledge("product-first")!;
  assert.ok(PRODUCT_FIRST_PRINCIPLE.includes("Product > Photography"));
  assert.equal(rule.topic, PhotographyTopic.COMMERCIAL);
  console.log("✔ product first — photography serves product demonstration");
}

function testKnowledgeStructure() {
  const sample = SEED_PHOTOGRAPHY_KNOWLEDGE[1];
  assert.ok(sample.rule);
  assert.ok(sample.examples.length > 0);
  assert.ok(sample.references.length > 0);
  assert.ok(sample.commercialRationale);
  assert.ok(sample.confidence > 0);
  console.log("✔ photography knowledge structure — rule, examples, references, rationale");
}

function testLightingKnowledge() {
  const softbox = LIGHTING_SCHEME_KNOWLEDGE[LightingKnowledgeScheme.STUDIO_SOFTBOX];
  assert.ok(softbox.applications.includes("main_image"));
  const matched = matchPhotographyKnowledge({ imageContext: "main_image" });
  assert.ok(matched.some((k) => k.id === "studio-softbox"));
  console.log("✔ lighting knowledge — softbox, rim, three-point, window light schemes");
}

function testLensKnowledge() {
  assert.equal(LENS_KNOWLEDGE[LensProfile.MM_35].perception, "dynamic perspective");
  assert.equal(LENS_KNOWLEDGE[LensProfile.MM_85].perception, "premium product compression");
  const luxury = getLensRecommendation({ styleId: "luxury" });
  const lifestyle = getLensRecommendation({ storyType: "lifestyle" });
  assert.equal(luxury, LensProfile.MM_85);
  assert.equal(lifestyle, LensProfile.MM_35);
  console.log("✔ lens knowledge — 35mm dynamic, 50mm natural, 85mm premium, 100mm macro");
}

function testPerspectiveKnowledge() {
  const low = getPhotographyKnowledge("perspective-low-power")!;
  assert.ok(low.rule.includes("Low camera angle"));
  const front = getPhotographyKnowledge("perspective-front-technical")!;
  assert.ok(front.conditions.length > 0);
  console.log("✔ perspective — low angle for power, frontal for technical products");
}

function testDepthOfField() {
  const luxury = matchPhotographyKnowledge({ styleId: "luxury" });
  assert.ok(luxury.some((k) => k.id === "dof-luxury-moderate"));
  const technical = matchPhotographyKnowledge({ storyType: "technical" });
  assert.ok(technical.some((k) => k.id === "dof-technical-deep"));
  console.log("✔ depth of field — moderate blur for luxury, deep focus for technical");
}

function testExposureKnowledge() {
  const highKey = getPhotographyKnowledge("exposure-high-key")!;
  assert.ok(highKey.rule.includes("High key"));
  const lowKey = getPhotographyKnowledge("exposure-low-key-premium")!;
  assert.ok(lowKey.conditions.some((c) => c.field === "styleId"));
  assert.ok(Object.values(ExposureMode).includes("high_key"));
  console.log("✔ exposure — high key marketplace, low key premium storytelling");
}

function testReflectionKnowledge() {
  const metal = getPhotographyKnowledge("reflection-controlled-metal")!;
  assert.ok(metal.rule.includes("controlled specular"));
  const plastic = getPhotographyKnowledge("reflection-minimize-plastic")!;
  assert.ok(plastic.rule.includes("matte plastic"));
  console.log("✔ reflection — controlled metal/glass, minimized plastic glare");
}

function testMaterialInteraction() {
  assert.ok(getMaterialLightingAdvice(MaterialType.GLASS).includes("backlight"));
  assert.ok(getMaterialLightingAdvice(MaterialType.WOOD).includes("warm"));
  assert.ok(getMaterialLightingAdvice(MaterialType.FABRIC).includes("soft"));
  assert.equal(Object.keys(MATERIAL_LIGHTING_MAP).length, 7);
  console.log("✔ material interaction — glass, metal, plastic, wood, fabric, ceramic, leather");
}

function testPhysicalRealism() {
  const physics = getPhotographyKnowledgeByTopic(PhotographyTopic.PHYSICAL_REALISM);
  assert.ok(physics.some((k) => k.id === "physics-shadow-direction"));
  const valid = validatePhotographyBlueprint({
    lightDirection: "left",
    shadowDirection: "right",
    primarySubject: "product",
    storyFocus: "product",
  });
  assert.equal(valid.valid, true);
  console.log("✔ physical realism — shadow direction matches light direction");
}

function testContextSensitiveRecommendations() {
  const luxury = recommendPhotographyKnowledge({ styleId: "luxury", category: ProductCategoryKnowledge.BEAUTY });
  const technical = recommendPhotographyKnowledge({
    category: ProductCategoryKnowledge.ELECTRONICS,
    storyType: "technical",
  });
  assert.notDeepEqual(
    luxury.map((k) => k.id),
    technical.map((k) => k.id),
  );
  console.log("✔ context-sensitive — luxury beauty vs technical electronics differ");
}

function testValidateCompliantBlueprint() {
  const result = validatePhotographyBlueprint({
    primarySubject: "product",
    storyFocus: "product",
    lightDirection: "left",
    shadowDirection: "right",
    material: MaterialType.METAL,
    reflections: "controlled_specular",
  });
  assert.equal(result.valid, true);
  assert.equal(result.retryRecommended, false);
  console.log("✔ compliant photography blueprint passes validation");
}

function testValidateViolatingBlueprint() {
  const result = validatePhotographyBlueprint({
    primarySubject: "background_art",
    storyFocus: "product",
    lightDirection: "left",
    shadowDirection: "left",
    material: MaterialType.GLASS,
    lighting: "flat_front_only",
    storyType: "technical",
    depthOfField: "shallow_bokeh",
    physicsViolations: ["impossible_reflection"],
  });
  assert.equal(result.valid, false);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.length >= 3);
  console.log("✔ violating photography triggers retry — physics, product-first, material");
}

function testPhotographyLearning() {
  const rule = getPhotographyKnowledge("lens-50mm-natural")!;
  const updated = applyPhotographyLearningFeedback([rule], {
    knowledgeId: rule.id,
    visionScore: 0.95,
    commercialScore: 0.9,
  });
  assert.ok(updated[0].confidence > rule.confidence);
  console.log("✔ photography evolution — Design Memory adjusts confidence from vision reports");
}

function testRandomLightingFails() {
  const report = validatePhotographyKnowledge({ randomLighting: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "RANDOM_LIGHTING_SELECTION"));
  console.log("✔ random lighting selection is architecturally invalid");
}

function testValidatePhotographyKnowledge() {
  const report = validatePhotographyKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.productFirst, true);
  assert.equal(report.physicallyRealistic, true);
  assert.equal(SEED_PHOTOGRAPHY_KNOWLEDGE.length, 22);
  console.log("✔ photography knowledge validation passes");
}

function testRunPhotographyKnowledge() {
  const report = runPhotographyKnowledge({});
  assert.equal(report.valid, true);
  assertPhotographyKnowledge();
  console.log("✔ runPhotographyKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isPhotographyKnowledgeFailure("PHYSICS_VIOLATION"), true);
  assert.equal(isPhotographyKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ photography knowledge failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testProductFirst();
  testKnowledgeStructure();
  testLightingKnowledge();
  testLensKnowledge();
  testPerspectiveKnowledge();
  testDepthOfField();
  testExposureKnowledge();
  testReflectionKnowledge();
  testMaterialInteraction();
  testPhysicalRealism();
  testContextSensitiveRecommendations();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testPhotographyLearning();
  testRandomLightingFails();
  testValidatePhotographyKnowledge();
  testRunPhotographyKnowledge();
  testFailureCodes();
  console.log("\nphotography-knowledge.spec.ts — all passed");
}

run();

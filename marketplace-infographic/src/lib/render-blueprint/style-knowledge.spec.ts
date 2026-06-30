/**
 * DESIGN AI v18 — Style Knowledge tests (Chapter 5.7)
 */
import assert from "node:assert/strict";
import {
  STYLE_KNOWLEDGE_VERSION,
  STYLE_KNOWLEDGE_GOLDEN_RULE,
  StyleFamily,
  StyleTaxonomyRoot,
  SEED_STYLE_PROFILES,
  STYLE_FAMILY_TAXONOMY,
  AUDIENCE_STYLE_PREFERENCES,
  getStyleProfile,
  getStylesByFamily,
  getStyleTaxonomyPath,
  composeStyles,
  isStyleAllowedForCategory,
  recommendStyleForContext,
  getStyleConstraints,
  getAgentStyleGuidance,
  validateStyleBlueprint,
  validateNewStyle,
  validateAgentStyleConsistency,
  validateStyleKnowledge,
  assertStyleKnowledge,
  runStyleKnowledge,
  isStyleKnowledgeFailure,
} from "./index";
import {
  MarketplaceImageContext,
  MarketplaceKnowledgeId,
  ProductCategoryKnowledge,
} from "./marketplace-knowledge-types";

function testGoldenRule() {
  assert.ok(STYLE_KNOWLEDGE_GOLDEN_RULE.includes("not image decoration"));
  assert.equal(STYLE_KNOWLEDGE_VERSION, "5.7.0");
  console.log("✔ golden rule — style conveys business meaning, not decoration");
}

function testStyleProfileStructure() {
  const luxury = getStyleProfile("luxury")!;
  assert.ok(luxury.visualCharacteristics.length > 0);
  assert.ok(luxury.recommendedCategories.length > 0);
  assert.ok(luxury.forbiddenCategories.length > 0);
  assert.ok(luxury.psychologicalEffects.length > 0);
  assert.ok(luxury.constraints.length > 0);
  assert.ok(luxury.confidence > 0);
  console.log("✔ style profile structure — characteristics, categories, constraints, psychology");
}

function testCoreStyleFamilies() {
  const families = Object.values(StyleFamily);
  assert.equal(families.length, 10);
  assert.ok(getStylesByFamily(StyleFamily.LUXURY).length >= 2);
  assert.ok(getStylesByFamily(StyleFamily.TECHNICAL).length >= 1);
  console.log("✔ ten core style families — luxury, minimal, modern, premium, technical, etc.");
}

function testStyleTaxonomy() {
  const path = getStyleTaxonomyPath("minimal-luxury");
  assert.ok(path.includes("commercial"));
  assert.equal(STYLE_FAMILY_TAXONOMY[StyleFamily.LUXURY].root, StyleTaxonomyRoot.COMMERCIAL);
  console.log("✔ style taxonomy — commercial → luxury → minimal luxury hierarchy");
}

function testStyleCharacteristics() {
  const minimal = getStyleProfile("minimal")!;
  assert.ok(minimal.visualCharacteristics.some((c) => c.includes("negative space")));
  const luxury = getStyleProfile("luxury")!;
  assert.ok(luxury.visualCharacteristics.some((c) => c.includes("premium")));
  console.log("✔ style characteristics — minimal negative space, luxury premium materials");
}

function testCategoryRestrictions() {
  assert.equal(isStyleAllowedForCategory("luxury", "cosmetics"), true);
  assert.equal(isStyleAllowedForCategory("luxury", "construction_supplies"), false);
  assert.equal(isStyleAllowedForCategory("technical", ProductCategoryKnowledge.ELECTRONICS), true);
  console.log("✔ category restrictions — luxury for cosmetics, not construction supplies");
}

function testAudiencePreferences() {
  assert.ok(AUDIENCE_STYLE_PREFERENCES.young.includes(StyleFamily.MODERN));
  assert.ok(AUDIENCE_STYLE_PREFERENCES.professional.includes(StyleFamily.TECHNICAL));
  const young = recommendStyleForContext({ audience: "young", category: ProductCategoryKnowledge.SPORTS });
  const pro = recommendStyleForContext({ audience: "professional", category: ProductCategoryKnowledge.ELECTRONICS });
  assert.notEqual(young[0]?.id, pro[0]?.id);
  console.log("✔ audience preferences — young vs professional produce different styles");
}

function testMarketplaceStyleHints() {
  const amazonMain = recommendStyleForContext({
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    category: ProductCategoryKnowledge.ELECTRONICS,
  });
  assert.ok(amazonMain.length > 0);
  assert.ok(
    amazonMain.some((s) => s.family === StyleFamily.MINIMAL || s.family === StyleFamily.TECHNICAL),
  );
  console.log("✔ marketplace style — Amazon main image favors minimal/technical cleanliness");
}

function testStyleComposition() {
  const composed = composeStyles("minimal", "luxury");
  assert.ok(composed);
  assert.equal(composed!.id, "minimal-luxury");
  assert.ok(composed!.visualCharacteristics.length >= 4);
  const modernTechnical = getStyleProfile("modern-technical");
  assert.ok(modernTechnical);
  console.log("✔ style composition — minimal + luxury → minimal luxury, modern + technical");
}

function testStyleConstraints() {
  const constraints = getStyleConstraints("minimal");
  assert.ok(constraints.some((c) => c.includes("noise") || c.includes("overcrowding")));
  console.log("✔ style constraints — minimal forbids visual noise and overcrowding");
}

function testPsychologicalEffects() {
  const eco = getStyleProfile("eco")!;
  assert.ok(eco.psychologicalEffects.some((e) => e.includes("natural") || e.includes("environmental")));
  const technical = getStyleProfile("technical")!;
  assert.ok(technical.psychologicalEffects.some((e) => e.includes("precision") || e.includes("reliability")));
  console.log("✔ psychological effects — eco naturalness, technical precision");
}

function testAgentStyleGuidance() {
  const guidance = getAgentStyleGuidance("lighting-director", "luxury");
  assert.ok(guidance);
  assert.ok(guidance!.directives.length > 0);
  assert.ok(guidance!.forbidden.length > 0);
  assert.equal(validateAgentStyleConsistency("minimal-luxury"), true);
  console.log("✔ agent style guidance — consistent directives across agents");
}

function testStyleBlueprintValidation() {
  const valid = validateStyleBlueprint({
    styleId: "minimal",
    lighting: "soft even neutral",
    composition: "clean negative space sparse",
    scene: "simple uncluttered",
    visualDensity: "low",
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.readyForConsensus, true);

  const invalid = validateStyleBlueprint({
    styleId: "minimal",
    lighting: "harsh chaotic neon",
    composition: "overcrowded busy cluttered",
    visualDensity: "high",
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.retryRecommended, true);
  console.log("✔ style blueprint validation — violations trigger consensus retry");
}

function testNewStyleValidation() {
  const issues = validateNewStyle({
    id: "random-pretty",
    name: "Random Pretty",
    family: StyleFamily.MODERN,
    description: "Just looks nice",
    visualCharacteristics: [],
    recommendedCategories: [],
    forbiddenCategories: [],
    psychologicalEffects: [],
    constraints: [],
    confidence: 0.3,
    version: "0.1.0",
  });
  assert.ok(issues.length >= 3);
  console.log("✔ new style validation — unstructured styles rejected before adoption");
}

function testDecorativeStyleFails() {
  const report = validateStyleKnowledge({ decorativeOnlyStyle: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "DECORATIVE_STYLE_ONLY"));
  console.log("✔ decorative-only style is architecturally invalid");
}

function testValidateStyleKnowledge() {
  const report = validateStyleKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.structured, true);
  assert.equal(report.compositionCapable, true);
  assert.equal(report.evolutionReady, true);
  assert.equal(SEED_STYLE_PROFILES.length, 13);
  console.log("✔ style knowledge validation passes");
}

function testRunStyleKnowledge() {
  const report = runStyleKnowledge({});
  assert.equal(report.valid, true);
  assertStyleKnowledge();
  console.log("✔ runStyleKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isStyleKnowledgeFailure("STYLE_CONSISTENCY_VIOLATED"), true);
  assert.equal(isStyleKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ style knowledge failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testStyleProfileStructure();
  testCoreStyleFamilies();
  testStyleTaxonomy();
  testStyleCharacteristics();
  testCategoryRestrictions();
  testAudiencePreferences();
  testMarketplaceStyleHints();
  testStyleComposition();
  testStyleConstraints();
  testPsychologicalEffects();
  testAgentStyleGuidance();
  testStyleBlueprintValidation();
  testNewStyleValidation();
  testDecorativeStyleFails();
  testValidateStyleKnowledge();
  testRunStyleKnowledge();
  testFailureCodes();
  console.log("\nstyle-knowledge.spec.ts — all passed");
}

run();

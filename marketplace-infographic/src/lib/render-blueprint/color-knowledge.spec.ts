/**
 * DESIGN AI v18 — Color Knowledge tests (Chapter 5.10)
 */
import assert from "node:assert/strict";
import {
  COLOR_KNOWLEDGE_VERSION,
  COLOR_KNOWLEDGE_GOLDEN_RULE,
  ColorName,
  ColorHarmony,
  PaletteColorTemperature,
  ContrastType,
  CategoryColorProfile,
  ACCENT_COLOR_POLICY,
  MIN_TEXT_CONTRAST_RATIO,
  SEED_COLOR_KNOWLEDGE,
  COLOR_PSYCHOLOGY,
  CATEGORY_COLOR_PROFILES,
  CONTRAST_GUIDANCE,
  getColorKnowledge,
  getColorPsychology,
  getCategoryColorProfile,
  recommendColorKnowledge,
  selectColorHarmony,
  selectPaletteColorTemperature,
  resolveBrandColorConflict,
  validateAgentPaletteConsistency,
  validateColorBlueprint,
  applyColorLearningFeedback,
  validateColorKnowledge,
  assertColorKnowledge,
  runColorKnowledge,
  isColorKnowledgeFailure,
} from "./index";
import { ProductCategoryKnowledge } from "./marketplace-knowledge-types";
import { StyleFamily } from "./style-knowledge-types";

function testGoldenRule() {
  assert.ok(COLOR_KNOWLEDGE_GOLDEN_RULE.includes("does not help sell"));
  assert.equal(COLOR_KNOWLEDGE_VERSION, "5.10.0");
  console.log("✔ golden rule — color sells, not decorates");
}

function testColorKnowledgeStructure() {
  const sample = SEED_COLOR_KNOWLEDGE[0];
  assert.ok(sample.palette);
  assert.ok(sample.purpose);
  assert.ok(sample.psychologicalEffects.length > 0);
  assert.ok(sample.confidence > 0);
  console.log("✔ color knowledge structure — palette, purpose, psychology, confidence");
}

function testColorPsychology() {
  const blue = getColorPsychology(ColorName.BLUE)!;
  assert.ok(blue.effects.includes("trust"));
  const black = getColorPsychology(ColorName.BLACK)!;
  assert.ok(black.effects.includes("luxury"));
  const white = getColorPsychology(ColorName.WHITE)!;
  assert.ok(white.effects.includes("cleanliness"));
  assert.equal(COLOR_PSYCHOLOGY.length, 5);
  console.log("✔ color psychology — blue trust, black luxury, white cleanliness, red energy");
}

function testColorHarmony() {
  assert.ok(Object.values(ColorHarmony).includes("complementary"));
  assert.ok(Object.values(ColorHarmony).includes("triadic"));
  const luxury = selectColorHarmony({ styleId: "luxury" });
  assert.equal(luxury, ColorHarmony.MONOCHROMATIC);
  const eco = selectColorHarmony({ styleId: StyleFamily.ECO });
  assert.equal(eco, ColorHarmony.ANALOGOUS);
  console.log("✔ color harmony — monochromatic, analogous, complementary, triadic schemes");
}

function testCategoryColorProfiles() {
  const medical = getCategoryColorProfile(CategoryColorProfile.MEDICAL);
  assert.ok(medical.includes(ColorName.WHITE));
  const luxury = getCategoryColorProfile(CategoryColorProfile.LUXURY_COSMETICS);
  assert.ok(luxury.includes(ColorName.BLACK));
  const eco = getCategoryColorProfile(CategoryColorProfile.ECO);
  assert.ok(eco.includes(ColorName.GREEN));
  const electronics = getCategoryColorProfile(CategoryColorProfile.ELECTRONICS);
  assert.ok(electronics.includes(ColorName.BLUE));
  console.log("✔ category profiles — medical, luxury cosmetics, eco, electronics");
}

function testColorTemperature() {
  const warm = selectPaletteColorTemperature({ category: ProductCategoryKnowledge.KITCHEN });
  const cold = selectPaletteColorTemperature({ category: ProductCategoryKnowledge.ELECTRONICS });
  assert.equal(warm, PaletteColorTemperature.WARM);
  assert.equal(cold, PaletteColorTemperature.COLD);
  console.log("✔ color temperature — warm for kitchen, cold for electronics");
}

function testContrastGuidance() {
  assert.ok(CONTRAST_GUIDANCE[ContrastType.LUMINANCE].includes("Brightness"));
  assert.ok(CONTRAST_GUIDANCE[ContrastType.SATURATION].includes("Saturation"));
  assert.equal(MIN_TEXT_CONTRAST_RATIO, 4.5);
  console.log("✔ contrast — color, luminance, saturation, local, global");
}

function testAccentColorPolicy() {
  assert.equal(ACCENT_COLOR_POLICY.maxTotal, 3);
  const over = validateColorBlueprint({ accentCount: 5 });
  assert.ok(over.violations.some((v) => v.code === "EXCESSIVE_ACCENT_COLORS"));
  console.log("✔ accent colors — max three: primary, secondary, accent");
}

function testHeroProductContrast() {
  const rule = getColorKnowledge("hero-product-contrast")!;
  assert.ok(rule.purpose.includes("never be lost"));
  const lost = validateColorBlueprint({
    backgroundColor: "#ff0000",
    heroProductColor: "#ff0000",
  });
  assert.ok(lost.violations.some((v) => v.code === "HERO_LOST_ON_BACKGROUND"));
  console.log("✔ commercial strategy — hero product never lost on background");
}

function testBrandColorConflict() {
  const resolved = resolveBrandColorConflict({
    brandColors: ["#brand"],
    readabilityContrast: 3,
    productVisibility: 0.8,
  });
  assert.equal(resolved.prioritize, "readability");
  console.log("✔ brand colors — readability overrides brand when contrast fails");
}

function testAgentPaletteConsistency() {
  assert.equal(
    validateAgentPaletteConsistency({
      lighting: "warm_soft",
      material: "warm_wood",
      overlay: "warm_accent",
    }),
    true,
  );
  assert.equal(
    validateAgentPaletteConsistency({
      lighting: "warm_soft",
      material: "cold_steel",
      overlay: "cold_blue",
    }),
    false,
  );
  console.log("✔ color consistency — unified temperature across lighting, material, overlay");
}

function testContextRecommendations() {
  const luxury = recommendColorKnowledge({ category: ProductCategoryKnowledge.BEAUTY, styleId: "luxury" });
  const medical = recommendColorKnowledge({ category: "medical", styleId: StyleFamily.MEDICAL });
  assert.notEqual(luxury[0]?.id, medical[0]?.id);
  console.log("✔ context recommendations — luxury beauty vs medical differ");
}

function testValidateCompliantBlueprint() {
  const result = validateColorBlueprint({
    palette: [ColorName.WHITE, ColorName.GRAY, ColorName.BLUE],
    backgroundColor: "#ffffff",
    heroProductColor: "#333333",
    accentCount: 2,
    contrastRatio: 4.5,
    textContrastRatio: 5,
    lightingColor: "warm_neutral",
    materialColor: "warm_wood",
    overlayColor: "warm_accent",
    storyEmotion: "trust",
    styleId: "minimal",
  });
  assert.equal(result.valid, true);
  assert.equal(result.retryRecommended, false);
  console.log("✔ compliant color blueprint passes validation");
}

function testValidateViolatingBlueprint() {
  const result = validateColorBlueprint({
    backgroundColor: "#ff0000",
    heroProductColor: "#ff0000",
    accentCount: 5,
    contrastRatio: 1.5,
    textContrastRatio: 2,
    storyEmotion: "trust",
    palette: [ColorName.RED, "orange", "yellow", "green", "blue"],
    lightingColor: "warm",
    materialColor: "cold_steel",
    overlayColor: "cold_blue",
    styleId: "minimal",
  });
  assert.equal(result.valid, false);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.length >= 4);
  console.log("✔ violating color blueprint triggers local retry");
}

function testColorLearning() {
  const rule = getColorKnowledge("luxury-cosmetics-palette")!;
  const updated = applyColorLearningFeedback([rule], {
    knowledgeId: rule.id,
    commercialScore: 0.95,
  });
  assert.ok(updated[0].confidence > rule.confidence);
  console.log("✔ color evolution — commercial metrics adjust confidence");
}

function testRandomColorFails() {
  const report = validateColorKnowledge({ randomColorSelection: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "RANDOM_COLOR_SELECTION"));
  console.log("✔ random color selection is architecturally invalid");
}

function testValidateColorKnowledge() {
  const report = validateColorKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.contrastAware, true);
  assert.equal(report.consistencyEnforced, true);
  assert.equal(SEED_COLOR_KNOWLEDGE.length, 10);
  console.log("✔ color knowledge validation passes");
}

function testRunColorKnowledge() {
  const report = runColorKnowledge({});
  assert.equal(report.valid, true);
  assertColorKnowledge();
  console.log("✔ runColorKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isColorKnowledgeFailure("ACCESSIBILITY_CONTRAST_FAIL"), true);
  assert.equal(isColorKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ color knowledge failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testColorKnowledgeStructure();
  testColorPsychology();
  testColorHarmony();
  testCategoryColorProfiles();
  testColorTemperature();
  testContrastGuidance();
  testAccentColorPolicy();
  testHeroProductContrast();
  testBrandColorConflict();
  testAgentPaletteConsistency();
  testContextRecommendations();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testColorLearning();
  testRandomColorFails();
  testValidateColorKnowledge();
  testRunColorKnowledge();
  testFailureCodes();
  console.log("\ncolor-knowledge.spec.ts — all passed");
}

run();

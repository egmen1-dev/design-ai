/**
 * DESIGN AI v18 — Composition Knowledge tests (Chapter 5.8)
 */
import assert from "node:assert/strict";
import {
  COMPOSITION_KNOWLEDGE_VERSION,
  COMPOSITION_KNOWLEDGE_GOLDEN_RULE,
  CompositionPrinciple,
  CompositionBalance,
  CompositionGrid,
  CompositionPatternId,
  SEED_COMPOSITION_RULES,
  VISUAL_HIERARCHY_LEVELS,
  READING_FLOWS,
  COMPOSITION_PATTERNS,
  COMPOSITION_ANTI_PATTERNS,
  getCompositionRule,
  getCompositionPattern,
  getVisualHierarchy,
  getReadingFlow,
  matchCompositionRules,
  recommendCompositionPattern,
  getAdaptiveHeroRatio,
  detectAntiPatterns,
  validateCompositionBlueprint,
  applyCompositionLearningFeedback,
  validateCompositionKnowledge,
  assertCompositionKnowledge,
  runCompositionKnowledge,
  isCompositionKnowledgeFailure,
} from "./index";
import { ProductCategoryKnowledge } from "./marketplace-knowledge-types";

function testGoldenRule() {
  assert.ok(COMPOSITION_KNOWLEDGE_GOLDEN_RULE.includes("human attention management"));
  assert.equal(COMPOSITION_KNOWLEDGE_VERSION, "5.8.0");
  console.log("✔ golden rule — composition manages attention, not random placement");
}

function testCompositionRuleStructure() {
  const hero = getCompositionRule("hero-focal-point")!;
  assert.equal(hero.principle, CompositionPrinciple.FOCAL_POINT);
  assert.ok(hero.recommendation.length > 0);
  assert.ok(hero.examples.length > 0);
  assert.ok(hero.confidence > 0);
  console.log("✔ composition rule structure — principle, recommendation, examples, confidence");
}

function testVisualHierarchy() {
  const hierarchy = getVisualHierarchy();
  assert.equal(hierarchy.length, 5);
  assert.equal(hierarchy[0].role, "hero_product");
  assert.equal(hierarchy[4].role, "decorative_elements");
  console.log("✔ visual hierarchy — hero → benefit → supporting → additional → decorative");
}

function testReadingFlow() {
  const western = getReadingFlow("western_z_pattern")!;
  assert.deepEqual(western.path, ["top_left", "center", "bottom_right"]);
  assert.ok(READING_FLOWS.length >= 2);
  console.log("✔ reading flow — top left → center → bottom right");
}

function testCompositionPatterns() {
  assert.equal(COMPOSITION_PATTERNS.length, 6);
  const centered = getCompositionPattern(CompositionPatternId.CENTERED_HERO)!;
  assert.ok(centered.heroProductRatio.min >= 0.55);
  const lifestyle = getCompositionPattern(CompositionPatternId.LIFESTYLE_FOCUS)!;
  assert.equal(lifestyle.negativeSpace, "high");
  console.log("✔ six composition patterns — centered hero, diagonal flow, lifestyle focus, etc.");
}

function testGridSystems() {
  const exploded = getCompositionPattern(CompositionPatternId.EXPLODED_VIEW)!;
  assert.equal(exploded.grid, CompositionGrid.GOLDEN_RATIO);
  const split = getCompositionPattern(CompositionPatternId.SPLIT_LAYOUT)!;
  assert.equal(split.grid, CompositionGrid.GRID_2X2);
  console.log("✔ grid systems — 2×2, 3×3, golden ratio, modular, overlay");
}

function testNegativeSpaceRule() {
  const matched = matchCompositionRules({ styleId: "luxury" });
  assert.ok(matched.some((r) => r.id === "negative-space-premium"));
  console.log("✔ negative space — premium styles trigger generous negative space rule");
}

function testRuleOfThirdsAdvisory() {
  const thirds = getCompositionRule("rule-of-thirds-advisory")!;
  assert.equal(thirds.principle, CompositionPrinciple.RULE_OF_THIRDS);
  assert.ok(thirds.confidence < 0.9);
  console.log("✔ rule of thirds — advisory tool, not mandatory standard");
}

function testAdaptiveComposition() {
  const small = getAdaptiveHeroRatio("small");
  const large = getAdaptiveHeroRatio("large");
  assert.ok(small.min > large.max);
  const smallPattern = recommendCompositionPattern({
    category: ProductCategoryKnowledge.ELECTRONICS,
    productSize: "small",
  });
  const largePattern = recommendCompositionPattern({
    category: ProductCategoryKnowledge.FURNITURE,
    productSize: "large",
  });
  assert.notEqual(smallPattern?.id, largePattern?.id);
  console.log("✔ adaptive composition — small product hero up to 65%, furniture lifestyle focus");
}

function testAntiPatterns() {
  assert.equal(COMPOSITION_ANTI_PATTERNS.length, 6);
  const detected = detectAntiPatterns({
    hasHeroObject: false,
    overcrowded: true,
    competingFoci: 2,
    negativeSpaceRatio: 0.05,
  });
  assert.ok(detected.length >= 3);
  console.log("✔ anti-patterns — overcrowding, missing hero, competing foci detected");
}

function testValidateCompliantBlueprint() {
  const result = validateCompositionBlueprint({
    hasHeroObject: true,
    hierarchyOrder: ["hero_product", "primary_benefit", "supporting_elements"],
    patternId: CompositionPatternId.CENTERED_HERO,
    heroProductRatio: 0.7,
    negativeSpaceRatio: 0.25,
    storyPrimaryFocus: "product",
    firstAttentionTarget: "product",
  });
  assert.equal(result.valid, true);
  assert.equal(result.retryRecommended, false);
  assert.equal(result.explainable, true);
  console.log("✔ compliant composition passes validation");
}

function testValidateViolatingBlueprint() {
  const result = validateCompositionBlueprint({
    hasHeroObject: false,
    overcrowded: true,
    competingFoci: 3,
    hierarchyOrder: ["decorative_elements", "hero_product"],
    storyPrimaryFocus: "product",
    firstAttentionTarget: "background",
  });
  assert.equal(result.valid, false);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.some((v) => v.code === "STORY_CONTRADICTION"));
  console.log("✔ violating composition triggers local retry");
}

function testBalanceRules() {
  const symmetrical = matchCompositionRules({ category: ProductCategoryKnowledge.ELECTRONICS });
  assert.ok(symmetrical.some((r) => r.id === "symmetrical-trust"));
  const asymmetrical = matchCompositionRules({ storyEnergy: "sports" });
  assert.ok(asymmetrical.some((r) => r.id === "asymmetrical-dynamic"));
  console.log("✔ balance — symmetrical for technical, asymmetrical for dynamic sports");
}

function testCompositionLearning() {
  const rule = getCompositionRule("hero-focal-point")!;
  const updated = applyCompositionLearningFeedback([rule], {
    ruleId: rule.id,
    visionScore: 0.95,
    commercialScore: 0.9,
  });
  assert.ok(updated[0].confidence > rule.confidence);
  console.log("✔ composition evolution — Design Memory adjusts rule confidence");
}

function testRandomPlacementFails() {
  const report = validateCompositionKnowledge({ randomPlacement: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "RANDOM_OBJECT_PLACEMENT"));
  console.log("✔ random object placement is architecturally invalid");
}

function testValidateCompositionKnowledge() {
  const report = validateCompositionKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.hierarchyDefined, true);
  assert.equal(report.patternsSupported, true);
  assert.equal(SEED_COMPOSITION_RULES.length, 10);
  console.log("✔ composition knowledge validation passes");
}

function testRunCompositionKnowledge() {
  const report = runCompositionKnowledge({});
  assert.equal(report.valid, true);
  assertCompositionKnowledge();
  console.log("✔ runCompositionKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isCompositionKnowledgeFailure("ANTI_PATTERN_DETECTED"), true);
  assert.equal(isCompositionKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ composition knowledge failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testCompositionRuleStructure();
  testVisualHierarchy();
  testReadingFlow();
  testCompositionPatterns();
  testGridSystems();
  testNegativeSpaceRule();
  testRuleOfThirdsAdvisory();
  testAdaptiveComposition();
  testAntiPatterns();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testBalanceRules();
  testCompositionLearning();
  testRandomPlacementFails();
  testValidateCompositionKnowledge();
  testRunCompositionKnowledge();
  testFailureCodes();
  console.log("\ncomposition-knowledge.spec.ts — all passed");
}

run();

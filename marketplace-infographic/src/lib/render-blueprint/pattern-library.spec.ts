/**
 * DESIGN AI v18 — Pattern Library tests (Chapter 5.14)
 */
import assert from "node:assert/strict";
import {
  PATTERN_LIBRARY_VERSION,
  PATTERN_LIBRARY_GOLDEN_RULE,
  MIN_SUCCESS_RATE_FOR_PUBLICATION,
  PATTERN_HIERARCHY,
  SEED_DESIGN_PATTERNS,
  PatternLibraryCategory,
  BusinessPatternGoal,
  StoryPatternKind,
  getDesignPattern,
  getPatternHierarchy,
  getPatternsByCategory,
  matchDesignPatterns,
  recommendDesignPatterns,
  violatesPatternConstraints,
  blendDesignPatterns,
  scorePatternUsage,
  validatePatternForPublication,
  validatePatternBlueprint,
  validatePatternLibrary,
  assertPatternLibrary,
  runPatternLibrary,
  isPatternLibraryFailure,
} from "./index";
import { MarketplaceImageContext, MarketplaceKnowledgeId } from "./marketplace-knowledge-types";

function testGoldenRule() {
  assert.ok(PATTERN_LIBRARY_GOLDEN_RULE.includes("experience"));
  assert.equal(PATTERN_LIBRARY_VERSION, "5.14.0");
  console.log("✔ golden rule — library stores experience not images");
}

function testPatternStructure() {
  const sample = SEED_DESIGN_PATTERNS[0];
  assert.ok(sample.name);
  assert.ok(sample.purpose);
  assert.ok(sample.layout);
  assert.ok(sample.explainable);
  assert.ok(sample.usageCount > 0);
  assert.ok(sample.successRate > 0);
  console.log("✔ design pattern structure — name, purpose, layout, confidence, usage, successRate");
}

function testPatternHierarchy() {
  const hierarchy = getPatternHierarchy();
  assert.equal(hierarchy.length, 6);
  assert.equal(hierarchy[0].category, PatternLibraryCategory.BUSINESS);
  assert.equal(hierarchy[5].category, PatternLibraryCategory.MARKETPLACE);
  assert.deepEqual(PATTERN_HIERARCHY, hierarchy);
  console.log("✔ pattern hierarchy — business → story → composition → photography → typography → marketplace");
}

function testBusinessPatterns() {
  const business = getPatternsByCategory(PatternLibraryCategory.BUSINESS);
  assert.ok(business.length >= 4);
  const attention = getDesignPattern("biz-attention-capture")!;
  assert.equal(attention.businessGoal, BusinessPatternGoal.ATTENTION);
  console.log("✔ business patterns — attention, trust, benefits, value perception");
}

function testStoryPatterns() {
  const story = getPatternsByCategory(PatternLibraryCategory.STORY);
  assert.ok(story.length >= 4);
  const hero = matchDesignPatterns({ storyKind: StoryPatternKind.PRODUCT_HERO });
  assert.ok(hero.some((p) => p.id === "story-product-hero"));
  console.log("✔ story patterns — product hero, problem solution, lifestyle, premium");
}

function testCompositionPatterns() {
  const composition = getPatternsByCategory(PatternLibraryCategory.COMPOSITION);
  assert.ok(composition.length >= 4);
  assert.ok(getDesignPattern("comp-centered-hero"));
  assert.ok(getDesignPattern("comp-diagonal-composition"));
  console.log("✔ composition patterns — centered hero, diagonal, feature grid, lifestyle split");
}

function testPhotographyPatterns() {
  const photo = getPatternsByCategory(PatternLibraryCategory.PHOTOGRAPHY);
  assert.ok(photo.length >= 3);
  assert.ok(getDesignPattern("photo-premium-lighting"));
  console.log("✔ photography patterns — premium lighting, soft lifestyle, technical detail");
}

function testTypographyPatterns() {
  const typo = getPatternsByCategory(PatternLibraryCategory.TYPOGRAPHY);
  assert.equal(typo.length, 2);
  assert.ok(getDesignPattern("typo-hierarchy-headline"));
  console.log("✔ typography patterns — headline hierarchy and CTA badge layout");
}

function testMarketplacePatterns() {
  const wb = recommendDesignPatterns({ marketplace: MarketplaceKnowledgeId.WILDBERRIES });
  const amazon = recommendDesignPatterns({ marketplace: MarketplaceKnowledgeId.AMAZON });
  const ozon = recommendDesignPatterns({ marketplace: MarketplaceKnowledgeId.OZON });
  assert.ok(wb.some((p) => p.id === "mkt-wildberries-hero-usp"));
  assert.ok(amazon.some((p) => p.id === "mkt-amazon-minimal-product"));
  assert.ok(ozon.some((p) => p.id === "mkt-ozon-structured-benefits"));
  console.log("✔ marketplace patterns — Wildberries, Amazon, Ozon libraries");
}

function testPatternConstraints() {
  const lifestyle = violatesPatternConstraints(getDesignPattern("story-lifestyle")!, {
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
  });
  assert.equal(lifestyle.violated, true);
  const grid = violatesPatternConstraints(getDesignPattern("comp-feature-grid")!, { featureCount: 1 });
  assert.equal(grid.violated, true);
  const premium = violatesPatternConstraints(getDesignPattern("story-premium-showcase")!, {
    priceTier: "budget",
  });
  assert.equal(premium.violated, true);
  console.log("✔ pattern constraints — lifestyle, feature grid, luxury rules enforced");
}

function testPatternSelection() {
  const ranked = recommendDesignPatterns({
    marketplace: MarketplaceKnowledgeId.AMAZON,
    businessGoal: BusinessPatternGoal.ATTENTION,
    storyKind: StoryPatternKind.PRODUCT_HERO,
  });
  assert.ok(ranked.length > 0);
  assert.ok(ranked[0].confidence >= MIN_SUCCESS_RATE_FOR_PUBLICATION);
  console.log("✔ pattern selection — context-aware ranking not random");
}

function testPatternBlending() {
  const blend = blendDesignPatterns(["comp-centered-hero", "photo-premium-lighting", "story-product-hero"]);
  assert.equal(blend.compatible, true);
  assert.ok(blend.blendedLayout.includes("+"));
  const incompatible = blendDesignPatterns(["comp-centered-hero", "comp-diagonal-composition"]);
  assert.equal(incompatible.compatible, false);
  console.log("✔ pattern blending — combine proven schemes into new layout");
}

function testPatternScoring() {
  const pattern = getDesignPattern("comp-centered-hero")!;
  const updated = scorePatternUsage(pattern, {
    patternId: pattern.id,
    visionScore: 0.9,
    ctrPrediction: 0.85,
    commercialScore: 0.88,
    retryCount: 0,
    userRating: 0.9,
  });
  assert.ok(updated.usageCount > pattern.usageCount);
  assert.ok(updated.successRate >= pattern.successRate);
  console.log("✔ pattern scoring — vision, CTR, commercial score update statistics");
}

function testPatternPublication() {
  const seed = getDesignPattern("biz-trust-building")!;
  const result = validatePatternForPublication({
    pattern: seed,
    businessGoalAligned: true,
    compatibleWithLibrary: true,
  });
  assert.equal(result.valid, true);
  const bad = validatePatternForPublication({
    pattern: { ...seed, id: "bad", successRate: 0.2, explainable: "x" },
    businessGoalAligned: false,
    compatibleWithLibrary: false,
  });
  assert.equal(bad.valid, false);
  console.log("✔ pattern publication — validation before library inclusion");
}

function testValidateCompliantBlueprint() {
  const result = validatePatternBlueprint({
    selectedPatternIds: ["comp-centered-hero", "photo-premium-lighting"],
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    businessGoal: BusinessPatternGoal.ATTENTION,
    explainable: true,
  });
  assert.equal(result.valid, true);
  assert.equal(result.retryRecommended, false);
  assert.ok((result.recommendedPatterns?.length ?? 0) > 0);
  console.log("✔ compliant pattern blueprint passes validation");
}

function testValidateViolatingBlueprint() {
  const result = validatePatternBlueprint({
    selectedPatternIds: ["story-lifestyle", "comp-feature-grid"],
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    featureCount: 1,
    containsImageTemplate: true,
    explainable: false,
  });
  assert.equal(result.valid, false);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.length >= 3);
  console.log("✔ violating pattern blueprint triggers local retry");
}

function testImageTemplateFails() {
  const report = validatePatternLibrary({ storesImageTemplates: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "IMAGE_TEMPLATE_STORED"));
  console.log("✔ image templates are architecturally invalid");
}

function testValidatePatternLibrary() {
  const report = validatePatternLibrary();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.reusableKnowledge, true);
  assert.equal(report.blendCapable, true);
  assert.equal(SEED_DESIGN_PATTERNS.length, 21);
  console.log("✔ pattern library validation passes");
}

function testRunPatternLibrary() {
  const report = runPatternLibrary({});
  assert.equal(report.valid, true);
  assertPatternLibrary();
  console.log("✔ runPatternLibrary entry point works");
}

function testFailureCodes() {
  assert.equal(isPatternLibraryFailure("PATTERN_CONSTRAINT_VIOLATION"), true);
  assert.equal(isPatternLibraryFailure("UNKNOWN"), false);
  console.log("✔ pattern library failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPatternStructure();
  testPatternHierarchy();
  testBusinessPatterns();
  testStoryPatterns();
  testCompositionPatterns();
  testPhotographyPatterns();
  testTypographyPatterns();
  testMarketplacePatterns();
  testPatternConstraints();
  testPatternSelection();
  testPatternBlending();
  testPatternScoring();
  testPatternPublication();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testImageTemplateFails();
  testValidatePatternLibrary();
  testRunPatternLibrary();
  testFailureCodes();
  console.log("\npattern-library.spec.ts — all passed");
}

run();

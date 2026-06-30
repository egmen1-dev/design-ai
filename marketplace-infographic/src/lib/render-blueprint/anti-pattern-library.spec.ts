/**
 * DESIGN AI v18 — Anti-Pattern Library tests (Chapter 5.15)
 */
import assert from "node:assert/strict";
import {
  ANTI_PATTERN_LIBRARY_VERSION,
  ANTI_PATTERN_LIBRARY_GOLDEN_RULE,
  SEVERITY_ACTIONS,
  SEED_DESIGN_ANTI_PATTERNS,
  AntiPatternCategory,
  AntiPatternSeverity,
  getDesignAntiPattern,
  getAntiPatternsByCategory,
  getSeverityAction,
  detectDesignAntiPatterns,
  recommendAntiPatternFixes,
  validateAntiPatternBlueprint,
  applyAntiPatternLearningFeedback,
  validateAntiPatternLibrary,
  assertAntiPatternLibrary,
  runAntiPatternLibrary,
  isAntiPatternLibraryFailure,
} from "./index";
import { MIN_TEXT_CONTRAST_RATIO } from "./color-knowledge-engine";
import { MIN_PRODUCT_HERO_RATIO } from "./cognitive-psychology-knowledge-engine";

function testGoldenRule() {
  assert.ok(ANTI_PATTERN_LIBRARY_GOLDEN_RULE.includes("mistakes avoided"));
  assert.equal(ANTI_PATTERN_LIBRARY_VERSION, "5.15.0");
  console.log("✔ golden rule — professional design is mistakes avoided");
}

function testAntiPatternStructure() {
  const sample = SEED_DESIGN_ANTI_PATTERNS[0];
  assert.ok(sample.name);
  assert.ok(sample.description);
  assert.ok(sample.detectionRules.length > 0);
  assert.ok(sample.recommendedFixes.length > 0);
  assert.ok(sample.examples.length > 0);
  assert.ok(sample.confidence > 0);
  console.log("✔ anti-pattern structure — name, description, detectionRules, recommendedFixes, confidence");
}

function testAntiPatternCategories() {
  const categories = Object.values(AntiPatternCategory);
  assert.equal(categories.length, 7);
  assert.ok(getAntiPatternsByCategory(AntiPatternCategory.BUSINESS).length >= 3);
  assert.ok(getAntiPatternsByCategory(AntiPatternCategory.COMPOSITION).length >= 5);
  assert.ok(getAntiPatternsByCategory(AntiPatternCategory.PHOTOGRAPHY).length >= 4);
  console.log("✔ anti-pattern categories — business, composition, photography, typography, marketplace, psychology, rendering");
}

function testSeverityLevels() {
  assert.equal(SEVERITY_ACTIONS.length, 4);
  const critical = getSeverityAction(AntiPatternSeverity.CRITICAL);
  assert.equal(critical.action, "reject");
  const major = getSeverityAction(AntiPatternSeverity.MAJOR);
  assert.equal(major.action, "retry");
  const minor = getSeverityAction(AntiPatternSeverity.MINOR);
  assert.equal(minor.action, "correct");
  console.log("✔ severity levels — critical reject, major retry, minor correct, info recommend");
}

function testBusinessAntiPatterns() {
  const detected = detectDesignAntiPatterns({ missingUsp: true, tellEverythingAtOnce: true });
  assert.ok(detected.some((d) => d.antiPattern.id === "biz-missing-usp"));
  assert.ok(detected.some((d) => d.antiPattern.id === "biz-tell-everything-at-once"));
  console.log("✔ business anti-patterns — missing USP, tell everything at once");
}

function testCompositionAntiPatterns() {
  const detected = detectDesignAntiPatterns({
    hasHeroProduct: false,
    competingFocalPoints: 3,
    overcrowded: true,
    chaoticEyeFlow: true,
    negativeSpaceRatio: 0.1,
    heroProductRatio: 0.2,
  });
  assert.ok(detected.some((d) => d.antiPattern.id === "comp-missing-hero"));
  assert.ok(detected.some((d) => d.antiPattern.id === "comp-competing-foci"));
  assert.ok(detected.some((d) => d.antiPattern.id === "comp-hero-area-too-small"));
  assert.equal(MIN_PRODUCT_HERO_RATIO, 0.35);
  console.log("✔ composition anti-patterns — missing hero, competing foci, overcrowded frame");
}

function testPhotographyAntiPatterns() {
  const detected = detectDesignAntiPatterns({
    impossibleLighting: true,
    wrongShadows: true,
    plasticMaterials: true,
    aiArtifacts: true,
  });
  assert.ok(detected.some((d) => d.antiPattern.id === "photo-impossible-lighting"));
  assert.ok(detected.some((d) => d.antiPattern.id === "photo-ai-artifacts"));
  console.log("✔ photography anti-patterns — impossible lighting, wrong shadows, AI artifacts");
}

function testTypographyAntiPatterns() {
  const detected = detectDesignAntiPatterns({
    textDensity: 0.5,
    textContrastRatio: 2,
    alignmentChaotic: true,
    headlineTooLong: true,
  });
  assert.ok(detected.some((d) => d.antiPattern.id === "typo-excessive-text"));
  assert.ok(detected.some((d) => d.antiPattern.id === "typo-low-contrast"));
  assert.equal(MIN_TEXT_CONTRAST_RATIO, 4.5);
  console.log("✔ typography anti-patterns — excessive text, low contrast, chaotic alignment");
}

function testMarketplaceAntiPatterns() {
  const detected = detectDesignAntiPatterns({
    marketplaceRuleViolation: true,
    thumbnailReadable: false,
    safeZoneViolation: true,
  });
  assert.ok(detected.some((d) => d.antiPattern.id === "mkt-main-image-violation"));
  assert.ok(detected.some((d) => d.antiPattern.id === "mkt-thumbnail-unreadable"));
  console.log("✔ marketplace anti-patterns — rule violation, thumbnail unreadable, safe zones");
}

function testPsychologyAntiPatterns() {
  const detected = detectDesignAntiPatterns({
    cognitiveLoad: 0.9,
    visualNoise: true,
    emotionalConflict: true,
  });
  assert.ok(detected.some((d) => d.antiPattern.id === "psych-info-overload"));
  assert.ok(detected.some((d) => d.antiPattern.id === "psych-visual-noise"));
  console.log("✔ psychology anti-patterns — info overload, visual noise, emotional conflict");
}

function testRenderingAntiPatterns() {
  const detected = detectDesignAntiPatterns({
    deformedGeometry: true,
    duplicateObjects: true,
    renderNoise: true,
  });
  assert.ok(detected.some((d) => d.antiPattern.id === "render-deformed-geometry"));
  assert.ok(detected.some((d) => d.antiPattern.id === "render-ai-noise"));
  console.log("✔ rendering anti-patterns — deformed geometry, duplicates, AI noise");
}

function testDetectionEngine() {
  const detected = detectDesignAntiPatterns({ hasHeroProduct: false });
  const hero = detected.find((d) => d.antiPattern.id === "comp-missing-hero");
  assert.ok(hero);
  assert.ok(hero!.matchedRules.length > 0);
  console.log("✔ detection engine — automatic rule-based anti-pattern detection");
}

function testAutoRecovery() {
  const detected = detectDesignAntiPatterns({ overcrowded: true, visualNoise: true });
  const fixes = recommendAntiPatternFixes(detected);
  assert.ok(fixes.some((f) => f.toLowerCase().includes("negative space") || f.toLowerCase().includes("noise")));
  const clutter = getDesignAntiPattern("comp-overcrowded-frame")!;
  assert.ok(clutter.recommendedFixes.some((f) => f.includes("negative space")));
  console.log("✔ auto recovery — recommended fixes for retry architecture");
}

function testValidateCompliantBlueprint() {
  const result = validateAntiPatternBlueprint({
    hasHeroProduct: true,
    heroProductRatio: 0.5,
    competingFocalPoints: 1,
    overcrowded: false,
    negativeSpaceRatio: 0.25,
    chaoticEyeFlow: false,
    textContrastRatio: 5,
    textDensity: 0.15,
    cognitiveLoad: 0.4,
    thumbnailReadable: true,
    visualNoise: false,
  });
  assert.equal(result.valid, true);
  assert.equal(result.rejectRecommended, false);
  assert.equal(result.retryRecommended, false);
  console.log("✔ compliant blueprint passes anti-pattern validation");
}

function testValidateViolatingBlueprint() {
  const result = validateAntiPatternBlueprint({
    hasHeroProduct: false,
    heroProductRatio: 0.2,
    competingFocalPoints: 3,
    overcrowded: true,
    chaoticEyeFlow: true,
    textContrastRatio: 2,
    textDensity: 0.5,
    cognitiveLoad: 0.9,
    visualNoise: true,
    marketplaceRuleViolation: true,
    aiArtifacts: true,
    deformedGeometry: true,
    missingUsp: true,
    tellEverythingAtOnce: true,
  });
  assert.equal(result.valid, false);
  assert.equal(result.rejectRecommended, true);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.length >= 5);
  assert.ok(result.recommendedFixes.length > 0);
  assert.equal(result.highestSeverity, AntiPatternSeverity.CRITICAL);
  console.log("✔ violating blueprint triggers reject and retry with fixes");
}

function testAntiPatternLearning() {
  const ap = getDesignAntiPattern("photo-ai-artifacts")!;
  const updated = applyAntiPatternLearningFeedback([ap], {
    antiPatternId: ap.id,
    detected: true,
    ledToRetry: true,
    commercialScoreImpact: -0.2,
  });
  assert.ok(updated[0].confidence > ap.confidence);
  console.log("✔ anti-pattern learning — detection stats feed Design Memory confidence");
}

function testPostGenerationOnlyFails() {
  const report = validateAntiPatternLibrary({ postGenerationOnly: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "POST_GENERATION_ONLY"));
  console.log("✔ post-generation-only detection is architecturally invalid");
}

function testValidateAntiPatternLibrary() {
  const report = validateAntiPatternLibrary();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.preGenerationDetection, true);
  assert.equal(report.autoRecoveryReady, true);
  assert.equal(SEED_DESIGN_ANTI_PATTERNS.length, 26);
  console.log("✔ anti-pattern library validation passes");
}

function testRunAntiPatternLibrary() {
  const report = runAntiPatternLibrary({});
  assert.equal(report.valid, true);
  assertAntiPatternLibrary();
  console.log("✔ runAntiPatternLibrary entry point works");
}

function testFailureCodes() {
  assert.equal(isAntiPatternLibraryFailure("CRITICAL_ANTI_PATTERN"), true);
  assert.equal(isAntiPatternLibraryFailure("UNKNOWN"), false);
  console.log("✔ anti-pattern library failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testAntiPatternStructure();
  testAntiPatternCategories();
  testSeverityLevels();
  testBusinessAntiPatterns();
  testCompositionAntiPatterns();
  testPhotographyAntiPatterns();
  testTypographyAntiPatterns();
  testMarketplaceAntiPatterns();
  testPsychologyAntiPatterns();
  testRenderingAntiPatterns();
  testDetectionEngine();
  testAutoRecovery();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testAntiPatternLearning();
  testPostGenerationOnlyFails();
  testValidateAntiPatternLibrary();
  testRunAntiPatternLibrary();
  testFailureCodes();
  console.log("\nanti-pattern-library.spec.ts — all passed");
}

run();

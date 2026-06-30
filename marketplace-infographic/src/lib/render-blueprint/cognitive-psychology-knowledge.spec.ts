/**
 * DESIGN AI v18 — Cognitive Psychology Knowledge tests (Chapter 5.12)
 */
import assert from "node:assert/strict";
import {
  COGNITIVE_PSYCHOLOGY_KNOWLEDGE_VERSION,
  COGNITIVE_PSYCHOLOGY_KNOWLEDGE_GOLDEN_RULE,
  MARKETPLACE_ATTENTION_WINDOW_MS,
  MARKETPLACE_SCAN_WINDOW_MS,
  MAX_COMPETING_FOCAL_POINTS,
  MAX_COGNITIVE_LOAD,
  RECOGNITION_PRIORITY_ORDER,
  EYE_MOVEMENT_PATH,
  GESTALT_PRINCIPLES,
  TRUST_SIGNALS,
  EMOTIONAL_TRIGGER_GUIDANCE,
  LIFE_CONTEXT_GUIDANCE,
  SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE,
  COGNITIVE_PSYCHOLOGY_EVIDENCE_SOURCE,
  GestaltPrinciple,
  RecognitionPriority,
  EmotionalTrigger,
  LifeContextPattern,
  getCognitivePsychologyKnowledge,
  getEyeMovementPath,
  getTrustSignals,
  matchCognitivePsychologyKnowledge,
  recommendCognitivePsychologyKnowledge,
  selectEmotionalTrigger,
  estimateCognitiveLoad,
  validateTrustSignals,
  validateCognitivePsychologyBlueprint,
  applyCognitivePsychologyLearningFeedback,
  validateCognitivePsychologyKnowledge,
  assertCognitivePsychologyKnowledge,
  runCognitivePsychologyKnowledge,
  isCognitivePsychologyKnowledgeFailure,
} from "./index";
import { KnowledgeEvidenceSource } from "./design-knowledge-philosophy-types";

function testGoldenRule() {
  assert.ok(COGNITIVE_PSYCHOLOGY_KNOWLEDGE_GOLDEN_RULE.includes("trust"));
  assert.equal(COGNITIVE_PSYCHOLOGY_KNOWLEDGE_VERSION, "5.12.0");
  console.log("✔ golden rule — brain understands product, feels trust, wants more");
}

function testKnowledgeStructure() {
  const sample = SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE[0];
  assert.ok(sample.rule);
  assert.ok(sample.purpose);
  assert.ok(sample.recommendation);
  assert.ok(sample.confidence > 0);
  assert.equal(COGNITIVE_PSYCHOLOGY_EVIDENCE_SOURCE, KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY);
  console.log("✔ cognitive psychology knowledge structure — rule, purpose, recommendation, confidence");
}

function testHumanAttention() {
  assert.equal(MARKETPLACE_ATTENTION_WINDOW_MS, 1000);
  const rule = getCognitivePsychologyKnowledge("human-attention-window")!;
  assert.ok(rule.recommendation.includes("hero"));
  console.log("✔ human attention — marketplace decision under one second");
}

function testSelectiveAttention() {
  assert.equal(MAX_COMPETING_FOCAL_POINTS, 1);
  const competing = validateCognitivePsychologyBlueprint({ competingFocalPoints: 3 });
  assert.ok(competing.violations.some((v) => v.code === "COMPETING_ATTENTION_CENTERS"));
  const missing = validateCognitivePsychologyBlueprint({ competingFocalPoints: 0 });
  assert.ok(missing.violations.some((v) => v.code === "MISSING_FOCAL_POINT"));
  console.log("✔ selective attention — single primary attention center");
}

function testCognitiveLoad() {
  const heavy = estimateCognitiveLoad({
    competingFocalPoints: 3,
    semanticBlockCount: 8,
    textDensity: 0.4,
    paletteColorCount: 9,
    gestaltViolationCount: 2,
  });
  assert.ok(heavy > MAX_COGNITIVE_LOAD);
  const overloaded = validateCognitivePsychologyBlueprint({ cognitiveLoad: 0.8 });
  assert.ok(overloaded.violations.some((v) => v.code === "EXCESSIVE_COGNITIVE_LOAD"));
  console.log("✔ cognitive load — measurable parameter with maximum threshold");
}

function testRecognitionBeforeReading() {
  assert.deepEqual(RECOGNITION_PRIORITY_ORDER, [
    RecognitionPriority.SHAPE,
    RecognitionPriority.IMAGE,
    RecognitionPriority.COLOR,
    RecognitionPriority.TEXT,
  ]);
  const textOnly = validateCognitivePsychologyBlueprint({ textOnlyMeaning: true });
  assert.ok(textOnly.violations.some((v) => v.code === "TEXT_ONLY_MEANING"));
  console.log("✔ recognition before reading — shape, image, color, then text");
}

function testGestaltPrinciples() {
  assert.equal(GESTALT_PRINCIPLES.length, 7);
  assert.ok(GESTALT_PRINCIPLES.includes(GestaltPrinciple.FIGURE_GROUND));
  const gestalt = validateCognitivePsychologyBlueprint({
    gestaltViolations: [GestaltPrinciple.PROXIMITY],
  });
  assert.ok(gestalt.violations.some((v) => v.code === "GESTALT_VIOLATION"));
  console.log("✔ gestalt principles — proximity, similarity, continuity, closure, figure-ground");
}

function testPatternRecognitionScenes() {
  assert.ok(LIFE_CONTEXT_GUIDANCE[LifeContextPattern.KITCHEN].includes("kitchen"));
  const lifestyle = matchCognitivePsychologyKnowledge({ imageContext: "lifestyle" });
  assert.ok(lifestyle.some((k) => k.id === "pattern-recognition-scenes"));
  console.log("✔ pattern recognition — familiar life contexts accelerate understanding");
}

function testTrustFormation() {
  const signals = getTrustSignals();
  assert.equal(signals.length, 5);
  assert.equal(validateTrustSignals(["photo_quality", "clean_composition"]), true);
  assert.equal(validateTrustSignals(["photo_quality"]), false);
  const lowTrust = validateCognitivePsychologyBlueprint({
    trustSignalsPresent: ["photo_quality"],
  });
  assert.ok(lowTrust.violations.some((v) => v.code === "INSUFFICIENT_TRUST_SIGNALS"));
  console.log("✔ trust formation — visual quality signals before text specifications");
}

function testEmotionalTriggers() {
  assert.ok(EMOTIONAL_TRIGGER_GUIDANCE[EmotionalTrigger.SAFETY].includes("lighting"));
  const safety = selectEmotionalTrigger({ emotionalGoal: EmotionalTrigger.SAFETY });
  const tech = selectEmotionalTrigger({ category: "electronics" });
  assert.equal(safety, EmotionalTrigger.SAFETY);
  assert.equal(tech, EmotionalTrigger.TECHNOLOGY);
  console.log("✔ emotional triggers — safety, reliability, technology, comfort, and more");
}

function testEyeMovementPath() {
  const path = getEyeMovementPath();
  assert.equal(path.length, 4);
  assert.equal(path[0].role, "hero_product");
  assert.deepEqual(EYE_MOVEMENT_PATH, path);
  const chaotic = validateCognitivePsychologyBlueprint({
    eyeMovementOrder: ["additional_information", "hero_product"],
    chaoticGaze: true,
  });
  assert.ok(chaotic.violations.some((v) => v.code === "CHAOTIC_EYE_MOVEMENT"));
  console.log("✔ eye movement — hero product → benefit → characteristic → detail");
}

function testMarketplaceBehaviour() {
  assert.equal(MARKETPLACE_SCAN_WINDOW_MS, 2000);
  const slow = validateCognitivePsychologyBlueprint({ perceptionTimeMs: 3500 });
  assert.ok(slow.violations.some((v) => v.code === "SLOW_VISUAL_PERCEPTION"));
  const scan = matchCognitivePsychologyKnowledge({ marketplace: "marketplace" });
  assert.ok(scan.some((k) => k.id === "marketplace-fast-scan"));
  console.log("✔ marketplace behaviour — design for fast card scanning");
}

function testValidateCompliantBlueprint() {
  const result = validateCognitivePsychologyBlueprint({
    competingFocalPoints: 1,
    semanticBlockCount: 3,
    productRecognizable: true,
    textOnlyMeaning: false,
    eyeMovementOrder: ["hero_product", "primary_benefit", "key_characteristic"],
    trustSignalsPresent: ["photo_quality", "clean_composition", "professional_lighting"],
    perceptionTimeMs: 1500,
    productHeroRatio: 0.45,
    paletteColorCount: 4,
    marketplaceScanOptimized: true,
    chaoticGaze: false,
  });
  assert.equal(result.valid, true);
  assert.equal(result.retryRecommended, false);
  assert.ok((result.estimatedCognitiveLoad ?? 1) <= MAX_COGNITIVE_LOAD);
  console.log("✔ compliant cognitive blueprint passes validation");
}

function testValidateViolatingBlueprint() {
  const result = validateCognitivePsychologyBlueprint({
    competingFocalPoints: 3,
    semanticBlockCount: 8,
    productRecognizable: false,
    textOnlyMeaning: true,
    eyeMovementOrder: ["additional_information", "hero_product"],
    gestaltViolations: [GestaltPrinciple.PROXIMITY, GestaltPrinciple.FIGURE_GROUND],
    trustSignalsPresent: ["photo_quality"],
    perceptionTimeMs: 3500,
    productHeroRatio: 0.2,
    paletteColorCount: 9,
    marketplaceScanOptimized: false,
    chaoticGaze: true,
  });
  assert.equal(result.valid, false);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.length >= 5);
  assert.ok(result.violations.some((v) => v.aspect === "heroRatio" || v.code === "PRODUCT_NOT_RECOGNIZABLE"));
  console.log("✔ violating cognitive blueprint triggers local retry");
}

function testContextRecommendations() {
  const safety = recommendCognitivePsychologyKnowledge({ emotionalGoal: EmotionalTrigger.SAFETY });
  const tech = recommendCognitivePsychologyKnowledge({ emotionalGoal: EmotionalTrigger.TECHNOLOGY });
  assert.ok(safety.some((k) => k.id === "emotional-trigger-safety"));
  assert.ok(tech.some((k) => k.id === "emotional-trigger-technology"));
  console.log("✔ context recommendations — emotional trigger knowledge");
}

function testCognitiveLearning() {
  const rule = getCognitivePsychologyKnowledge("selective-attention")!;
  const updated = applyCognitivePsychologyLearningFeedback([rule], {
    knowledgeId: rule.id,
    commercialScore: 0.95,
  });
  assert.ok(updated[0].confidence > rule.confidence);
  console.log("✔ cognitive evolution — commercial metrics adjust confidence");
}

function testOverloadedCompositionFails() {
  const report = validateCognitivePsychologyKnowledge({ overloadedComposition: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "EXCESSIVE_COGNITIVE_LOAD"));
  console.log("✔ overloaded composition is architecturally invalid");
}

function testValidateCognitivePsychologyKnowledge() {
  const report = validateCognitivePsychologyKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.attentionManaged, true);
  assert.equal(report.trustAware, true);
  assert.equal(SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE.length, 14);
  console.log("✔ cognitive psychology knowledge validation passes");
}

function testRunCognitivePsychologyKnowledge() {
  const report = runCognitivePsychologyKnowledge({});
  assert.equal(report.valid, true);
  assertCognitivePsychologyKnowledge();
  console.log("✔ runCognitivePsychologyKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isCognitivePsychologyKnowledgeFailure("TEXT_ONLY_MEANING"), true);
  assert.equal(isCognitivePsychologyKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ cognitive psychology failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testKnowledgeStructure();
  testHumanAttention();
  testSelectiveAttention();
  testCognitiveLoad();
  testRecognitionBeforeReading();
  testGestaltPrinciples();
  testPatternRecognitionScenes();
  testTrustFormation();
  testEmotionalTriggers();
  testEyeMovementPath();
  testMarketplaceBehaviour();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testContextRecommendations();
  testCognitiveLearning();
  testOverloadedCompositionFails();
  testValidateCognitivePsychologyKnowledge();
  testRunCognitivePsychologyKnowledge();
  testFailureCodes();
  console.log("\ncognitive-psychology-knowledge.spec.ts — all passed");
}

run();

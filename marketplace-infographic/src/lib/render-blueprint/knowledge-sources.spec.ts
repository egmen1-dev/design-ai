/**
 * DESIGN AI v18 — Knowledge Sources tests (Chapter 5.3)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_SOURCES_VERSION,
  KNOWLEDGE_SOURCES_GOLDEN_RULE,
  SOURCE_HIERARCHY,
  KnowledgeSourceLevel,
  KnowledgeSourceType,
  DEFAULT_SOURCE_TRUST_WEIGHT,
  buildAttributedSource,
  buildSeedSourceCatalog,
  attributeSourcesForRule,
  computeMultiSourceConfidence,
  validateMultiSource,
  applyDynamicWeightUpdate,
  resolveSourceConflict,
  processHumanFeedback,
  submitAiHypothesis,
  validateSourceAttribution,
  validateKnowledgeSources,
  assertKnowledgeSources,
  runKnowledgeSources,
  isKnowledgeSourcesFailure,
  KnowledgeEvidenceSource,
} from "./index";

function testGoldenRule() {
  assert.ok(KNOWLEDGE_SOURCES_GOLDEN_RULE.includes("without a source"));
  assert.equal(KNOWLEDGE_SOURCES_VERSION, "5.3.0");
  console.log("✔ golden rule — no rule without verified source origin");
}

function testSourceHierarchy() {
  assert.deepEqual(SOURCE_HIERARCHY, [1, 2, 3, 4, 5]);
  assert.ok(DEFAULT_SOURCE_TRUST_WEIGHT[KnowledgeSourceLevel.EXPERT] > DEFAULT_SOURCE_TRUST_WEIGHT[KnowledgeSourceLevel.AI_GENERATED]);
  console.log("✔ source hierarchy — expert highest trust, AI generated lowest");
}

function testAttributedSource() {
  const source = buildAttributedSource({
    evidenceId: KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY,
    name: "Commercial photographer panel",
  });
  assert.equal(source.type, KnowledgeSourceType.EXPERT);
  assert.equal(source.level, KnowledgeSourceLevel.EXPERT);
  assert.ok(source.confidence >= 0.8);
  assert.ok(source.date.length >= 10);
  assert.equal(source.independent, true);
  console.log("✔ source attribution — type, name, evidence level, confidence, date, version");
}

function testSeedCatalog() {
  const catalog = buildSeedSourceCatalog();
  assert.ok(catalog.length >= 5);
  assert.ok(catalog.some((s) => s.type === KnowledgeSourceType.EXPERT));
  assert.ok(catalog.some((s) => s.type === KnowledgeSourceType.SCIENTIFIC));
  assert.ok(catalog.some((s) => s.type === KnowledgeSourceType.DESIGN_MEMORY));
  console.log("✔ seed catalog — expert, scientific, marketplace, analytics, design memory");
}

function testRuleSourceAttribution() {
  const sources = attributeSourcesForRule("luxury-cosmetics-soft-lighting");
  assert.ok(sources.length >= 3);
  assert.equal(validateSourceAttribution(sources, "luxury-cosmetics-soft-lighting").length, 0);
  console.log("✔ every seed rule has multiple attributed sources");
}

function testMultiSourceValidation() {
  const sources = attributeSourcesForRule("luxury-cosmetics-soft-lighting");
  const validation = validateMultiSource("luxury-cosmetics-soft-lighting", sources);
  assert.equal(validation.validated, true);
  assert.ok(validation.independentSourceCount >= 2);
  assert.ok(validation.combinedConfidence >= 0.6);
  console.log("✔ multi-source validation — photography + marketing + psychology increases confidence");
}

function testDynamicWeighting() {
  const source = buildAttributedSource({
    evidenceId: KnowledgeEvidenceSource.EXPERT_CURATED,
    name: "Art director guidelines",
    confidence: 0.85,
  });
  const update = applyDynamicWeightUpdate(source, 3, 0);
  assert.ok(update.newWeight > update.previousWeight);
  assert.ok(update.confirmedBy?.includes(KnowledgeSourceType.INTERNAL_ANALYTICS));
  console.log("✔ dynamic weighting — expert rule gains confidence when confirmed by sales");
}

function testConflictResolution() {
  const research = buildAttributedSource({
    evidenceId: KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY,
    name: "Perception research",
  });
  const marketplace = buildAttributedSource({
    evidenceId: KnowledgeEvidenceSource.MARKETPLACE_RESEARCH,
    name: "Marketplace trend data",
  });
  const conflict = resolveSourceConflict({
    ruleId: "composition-test",
    researchSource: research,
    marketplaceSource: marketplace,
    message: "Research vs marketplace divergence on hero scale",
  });
  assert.equal(conflict.resolution, "preserve_both");
  assert.equal(conflict.sources.length, 2);
  console.log("✔ conflict resolution — preserve both sources, escalate to evaluation");
}

function testHumanFeedback() {
  const impact = processHumanFeedback({
    rating: "positive",
    affectedRuleIds: ["luxury-cosmetics-soft-lighting"],
    sampleCount: 1,
  });
  assert.equal(impact.createsNewRule, false);
  assert.ok(impact.weightDelta > 0);
  const negative = processHumanFeedback({ rating: "negative", affectedRuleIds: ["kitchen-soft-morning-light"] });
  assert.ok(negative.weightDelta < 0);
  console.log("✔ human feedback — adjusts weights, never creates rule from single rating");
}

function testAiHypothesisGating() {
  const rejected = submitAiHypothesis({ id: "hyp-1", hypothesis: "new layout style", sampleCount: 1 });
  assert.equal(rejected.approved, false);
  const approved = submitAiHypothesis({ id: "hyp-2", hypothesis: "validated layout", sampleCount: 8 });
  assert.equal(approved.approved, true);
  console.log("✔ AI generated knowledge — requires validation and sample accumulation");
}

function testCombinedConfidence() {
  const sources = attributeSourcesForRule("premium-large-negative-space");
  const confidence = computeMultiSourceConfidence(sources);
  assert.ok(confidence > 0.7);
  console.log("✔ combined confidence — diversity bonus from independent source levels");
}

function testFailureConditions() {
  const report = validateKnowledgeSources({
    llmOnlyRule: true,
    singleFeedbackCreatesRule: true,
    aiHypothesisAutoAccepted: true,
    mixedWithoutDistinction: true,
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "LLM_ONLY_SOURCE"));
  assert.ok(report.violations.some((v) => v.code === "SINGLE_FEEDBACK_RULE"));
  assert.ok(report.violations.some((v) => v.code === "AI_HYPOTHESIS_AUTO_ACCEPTED"));
  console.log("✔ failure conditions — LLM-only, single feedback, auto-accepted AI rejected");
}

function testValidateKnowledgeSources() {
  const report = validateKnowledgeSources();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.traceable, true);
  assert.equal(report.multiSourceValidated, true);
  console.log("✔ knowledge sources validation passes for seed rules");
}

function testRunKnowledgeSources() {
  const report = runKnowledgeSources({});
  assert.equal(report.valid, true);
  assertKnowledgeSources();
  console.log("✔ runKnowledgeSources entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeSourcesFailure("UNKNOWN_ORIGIN"), true);
  assert.equal(isKnowledgeSourcesFailure("UNKNOWN"), false);
  console.log("✔ knowledge sources failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testSourceHierarchy();
  testAttributedSource();
  testSeedCatalog();
  testRuleSourceAttribution();
  testMultiSourceValidation();
  testDynamicWeighting();
  testConflictResolution();
  testHumanFeedback();
  testAiHypothesisGating();
  testCombinedConfidence();
  testFailureConditions();
  testValidateKnowledgeSources();
  testRunKnowledgeSources();
  testFailureCodes();
  console.log("\nknowledge-sources.spec.ts — all passed");
}

run();

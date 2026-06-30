/**
 * DESIGN AI v18 — Knowledge Validation tests (Chapter 5.17)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_VALIDATION_VERSION,
  KNOWLEDGE_VALIDATION_GOLDEN_RULE,
  VALIDATION_PIPELINE,
  MIN_APPROVAL_CONFIDENCE,
  MAX_CONFIDENCE_WITHOUT_EVIDENCE,
  DUPLICATE_SIMILARITY_THRESHOLD,
  ValidatableKnowledgeKind,
  KnowledgeValidationStage,
  KnowledgeValidationStatus,
  buildValidatableKnowledgeCatalog,
  validateKnowledgeEntrySchema,
  validateKnowledgeEntrySemantics,
  validateKnowledgeEntryEvidence,
  validateKnowledgeEntryExplainability,
  detectKnowledgeConflicts,
  detectDuplicateKnowledge,
  simulateKnowledgeRule,
  recalculateKnowledgeConfidence,
  validateVersionCompatibility,
  runKnowledgeValidationPipeline,
  validatePublishedKnowledgeCatalog,
  assertKnowledgeValidation,
  runKnowledgeValidation,
  isKnowledgeValidationFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(KNOWLEDGE_VALIDATION_GOLDEN_RULE.includes("correctness"));
  assert.equal(KNOWLEDGE_VALIDATION_VERSION, "5.17.0");
  console.log("✔ golden rule — knowledge proves correctness before repository");
}

function testValidationPipeline() {
  assert.equal(VALIDATION_PIPELINE.length, 8);
  assert.equal(VALIDATION_PIPELINE[1], KnowledgeValidationStage.SCHEMA_VALIDATION);
  assert.equal(VALIDATION_PIPELINE[7], KnowledgeValidationStage.KNOWLEDGE_REPOSITORY);
  console.log("✔ validation pipeline — creation to schema to approval to repository");
}

function testSchemaValidation() {
  const catalog = buildValidatableKnowledgeCatalog();
  const sample = catalog[0];
  assert.equal(validateKnowledgeEntrySchema(sample).length, 0);
  const bad = validateKnowledgeEntrySchema({
    ...sample,
    id: "",
    confidence: 1.5,
    version: "invalid",
  });
  assert.ok(bad.some((v) => v.code === "SCHEMA_INVALID"));
  console.log("✔ schema validation — required fields, types, version, references");
}

function testSemanticValidation() {
  const catalog = buildValidatableKnowledgeCatalog();
  const sample = catalog.find((e) => e.id === "typo-readability-first")!;
  assert.equal(validateKnowledgeEntrySemantics(sample).length, 0);
  const bad = validateKnowledgeEntrySemantics({ ...sample, recommendation: "x" });
  assert.ok(bad.some((v) => v.code === "SEMANTIC_INVALID"));
  console.log("✔ semantic validation — category fit and actionable recommendations");
}

function testConflictDetection() {
  const catalog = buildValidatableKnowledgeCatalog();
  const conflicts = detectKnowledgeConflicts(catalog);
  const lighting = conflicts.find((c) => c.reason.includes("lighting"));
  assert.ok(lighting);
  assert.equal(lighting!.requiresExpertReview, true);
  console.log("✔ conflict detection — warm vs cold lighting flagged for expert review");
}

function testEvidenceValidation() {
  const catalog = buildValidatableKnowledgeCatalog();
  const sample = catalog[0];
  assert.equal(validateKnowledgeEntryEvidence(sample).length, 0);
  const bad = validateKnowledgeEntryEvidence({ ...sample, evidenceSources: [], confidence: 0.9 });
  assert.ok(bad.some((v) => v.code === "MISSING_EVIDENCE"));
  assert.equal(MAX_CONFIDENCE_WITHOUT_EVIDENCE, 0.55);
  console.log("✔ evidence validation — provenance required, confidence capped without evidence");
}

function testDuplicateDetection() {
  const catalog = buildValidatableKnowledgeCatalog();
  const duplicates = detectDuplicateKnowledge(catalog);
  assert.ok(Array.isArray(duplicates));
  assert.equal(DUPLICATE_SIMILARITY_THRESHOLD, 0.82);
  console.log("✔ duplicate detection — similar rules flagged for merge review");
}

function testSimulationValidation() {
  const catalog = buildValidatableKnowledgeCatalog();
  const sample = catalog.find((e) => e.id === "typo-readability-first")!;
  assert.equal(
    simulateKnowledgeRule(sample, {
      blueprintCount: 200,
      commercialScoreDelta: 0.08,
      visionScoreDelta: 0.05,
      retryRate: 0.05,
      stableDecisions: true,
    }).length,
    0,
  );
  const failed = simulateKnowledgeRule(sample, {
    blueprintCount: 5,
    commercialScoreDelta: -0.2,
    retryRate: 0.5,
    stableDecisions: false,
  });
  assert.ok(failed.some((v) => v.code === "SIMULATION_FAILED"));
  console.log("✔ simulation validation — commercial, vision, retry, stability checks");
}

function testConfidenceRecalculation() {
  const catalog = buildValidatableKnowledgeCatalog();
  const sample = catalog[0];
  const boosted = recalculateKnowledgeConfidence(sample, {
    simulationPassed: true,
    historicalSuccess: 0.9,
    userFeedback: 0.85,
  });
  assert.ok(boosted >= sample.confidence);
  assert.ok(boosted <= 1);
  assert.ok(MIN_APPROVAL_CONFIDENCE >= 0.7);
  console.log("✔ confidence validation — dynamic score from evidence and simulation");
}

function testVersionCompatibility() {
  const catalog = buildValidatableKnowledgeCatalog();
  const current = catalog[0];
  const previous = { ...current, version: "5.10.0" };
  assert.equal(validateVersionCompatibility({ ...current, version: "6.0.0" }, previous).length, 0);
  const bad = validateVersionCompatibility({ ...current, version: "4.0.0" }, previous);
  assert.ok(bad.some((v) => v.code === "VERSION_INCOMPATIBLE"));
  console.log("✔ version compatibility — major version cannot decrease");
}

function testExplainabilityValidation() {
  const catalog = buildValidatableKnowledgeCatalog();
  const sample = catalog.find((e) => e.id === "typo-readability-first")!;
  assert.equal(validateKnowledgeEntryExplainability(sample).length, 0);
  const bad = validateKnowledgeEntryExplainability({ ...sample, explainable: "short" });
  assert.ok(bad.some((v) => v.code === "UNEXPLAINABLE_KNOWLEDGE"));
  console.log("✔ explainability validation — why, problem, where, proof required");
}

function testRunValidationPipelineApproved() {
  const catalog = buildValidatableKnowledgeCatalog();
  const entry = catalog.find((e) => e.id === "typo-readability-first")!;
  const report = runKnowledgeValidationPipeline(entry, {
    catalog,
    simulation: {
      blueprintCount: 200,
      commercialScoreDelta: 0.08,
      visionScoreDelta: 0.06,
      retryRate: 0.05,
      stableDecisions: true,
    },
  });
  assert.equal(report.approved, true);
  assert.equal(report.status, KnowledgeValidationStatus.APPROVED);
  assert.equal(report.pipelineComplete, true);
  assert.equal(report.explainable, true);
  console.log("✔ approved knowledge passes full validation pipeline");
}

function testRunValidationPipelineRejected() {
  const report = runKnowledgeValidationPipeline(
    {
      id: "bad-rule",
      kind: ValidatableKnowledgeKind.RULE,
      category: "test",
      title: "Bad",
      description: "x",
      recommendation: "y",
      purpose: "z",
      confidence: 2,
      version: "bad",
      evidenceSources: [],
      references: [],
      conditions: [],
      explainable: "no",
    },
    { skipSimulation: true },
  );
  assert.equal(report.approved, false);
  assert.equal(report.status, KnowledgeValidationStatus.REJECTED);
  assert.ok(report.violations.length > 0);
  console.log("✔ invalid knowledge rejected before repository");
}

function testConflictNeedsReview() {
  const catalog = buildValidatableKnowledgeCatalog();
  const warm = catalog.find((e) => e.id === "photo-warm-lighting-rule")!;
  const report = runKnowledgeValidationPipeline(warm, { catalog, skipSimulation: true });
  assert.equal(report.status, KnowledgeValidationStatus.NEEDS_REVIEW);
  assert.ok(report.conflicts.length > 0);
  console.log("✔ conflicting knowledge marked needs_review not auto-deleted");
}

function testPublishWithoutValidationFails() {
  const report = validatePublishedKnowledgeCatalog({ publishWithoutValidation: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "UNPUBLISHED_KNOWLEDGE"));
  console.log("✔ publish without validation is architecturally invalid");
}

function testValidatePublishedCatalog() {
  const report = validatePublishedKnowledgeCatalog();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.continuousValidationReady, true);
  assert.ok(report.approvedCount > 0);
  assert.ok(report.conflicts.length > 0);
  assert.ok(buildValidatableKnowledgeCatalog().length > 20);
  console.log("✔ published knowledge catalog validation passes");
}

function testRunKnowledgeValidation() {
  const catalog = buildValidatableKnowledgeCatalog();
  const result = runKnowledgeValidation({ entry: catalog[0] });
  assert.equal(result.valid, true);
  assert.ok(result.entryReport);
  assertKnowledgeValidation();
  console.log("✔ runKnowledgeValidation entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeValidationFailure("KNOWLEDGE_CONFLICT"), true);
  assert.equal(isKnowledgeValidationFailure("UNKNOWN"), false);
  console.log("✔ knowledge validation failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testValidationPipeline();
  testSchemaValidation();
  testSemanticValidation();
  testConflictDetection();
  testEvidenceValidation();
  testDuplicateDetection();
  testSimulationValidation();
  testConfidenceRecalculation();
  testVersionCompatibility();
  testExplainabilityValidation();
  testRunValidationPipelineApproved();
  testRunValidationPipelineRejected();
  testConflictNeedsReview();
  testPublishWithoutValidationFails();
  testValidatePublishedCatalog();
  testRunKnowledgeValidation();
  testFailureCodes();
  console.log("\nknowledge-validation.spec.ts — all passed");
}

run();

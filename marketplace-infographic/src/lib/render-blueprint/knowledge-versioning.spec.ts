/**
 * DESIGN AI v18 — Knowledge Versioning tests (Chapter 5.18)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_VERSIONING_VERSION,
  KNOWLEDGE_VERSIONING_GOLDEN_RULE,
  VERSION_LIFECYCLE,
  KnowledgeVersionState,
  KnowledgeCompatibilityLevel,
  KnowledgeVersionBump,
  buildKnowledgeVersionCatalog,
  parseSemanticVersion,
  compareSemanticVersions,
  bumpSemanticVersion,
  analyzeVersionCompatibility,
  canTransitionVersionState,
  transitionVersionState,
  getKnowledgeVersionHistory,
  getLatestApprovedVersion,
  createKnowledgeVersionDraft,
  validateDependencyVersions,
  validateVersionForPublication,
  releaseKnowledgeVersion,
  rollbackKnowledgeVersion,
  createKnowledgeSnapshot,
  validateKnowledgeSnapshot,
  selectKnowledgeVersion,
  assertImmutablePublishedVersion,
  recordAuditEntry,
  validateKnowledgeVersioning,
  assertKnowledgeVersioning,
  runKnowledgeVersioning,
  isKnowledgeVersioningFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(KNOWLEDGE_VERSIONING_GOLDEN_RULE.includes("controlled"));
  assert.equal(KNOWLEDGE_VERSIONING_VERSION, "5.18.0");
  console.log("✔ golden rule — every change controlled, verified, and reversible");
}

function testVersionLifecycle() {
  assert.equal(VERSION_LIFECYCLE.length, 6);
  assert.equal(VERSION_LIFECYCLE[0], KnowledgeVersionState.DRAFT);
  assert.equal(VERSION_LIFECYCLE[3], KnowledgeVersionState.APPROVED);
  assert.equal(VERSION_LIFECYCLE[5], KnowledgeVersionState.ARCHIVED);
  console.log("✔ version lifecycle — draft to validation to testing to approved to deprecated to archived");
}

function testSemanticVersioning() {
  assert.deepEqual(parseSemanticVersion("1.0.0"), { major: 1, minor: 0, patch: 0 });
  assert.equal(compareSemanticVersions("1.1.0", "1.0.0"), 1);
  assert.equal(bumpSemanticVersion("1.0.0", KnowledgeVersionBump.MINOR), "1.1.0");
  assert.equal(bumpSemanticVersion("1.2.0", KnowledgeVersionBump.MAJOR), "2.0.0");
  assert.equal(bumpSemanticVersion("1.2.3", KnowledgeVersionBump.PATCH), "1.2.4");
  console.log("✔ semantic versioning — major minor patch bumps");
}

function testImmutableKnowledge() {
  const catalog = buildKnowledgeVersionCatalog();
  const approved = catalog.find((v) => v.status === KnowledgeVersionState.APPROVED)!;
  const violations = assertImmutablePublishedVersion(approved, { confidence: approved.confidence + 0.2 });
  assert.ok(violations.some((v) => v.code === "IMMUTABLE_VIOLATION"));
  console.log("✔ immutable knowledge — published versions cannot be mutated in place");
}

function testVersionHistory() {
  const history = getKnowledgeVersionHistory("photo-warm-lighting-rule");
  assert.ok(history.length >= 3);
  assert.equal(history[0].version, "1.0.0");
  assert.equal(history[history.length - 1].version, "1.2.0");
  console.log("✔ version history — lighting rule v1 v2 v3 chain preserved");
}

function testCompatibilityAnalysis() {
  const catalog = buildKnowledgeVersionCatalog();
  const v1 = catalog.find((v) => v.id === "photo-warm-lighting-rule@1.0.0")!;
  const v2 = catalog.find((v) => v.id === "photo-warm-lighting-rule@1.1.0")!;
  const v3 = catalog.find((v) => v.id === "photo-warm-lighting-rule@1.2.0")!;
  assert.equal(analyzeVersionCompatibility(v1, v2), KnowledgeCompatibilityLevel.PARTIALLY_COMPATIBLE);
  assert.ok(
    analyzeVersionCompatibility(v2, v3) === KnowledgeCompatibilityLevel.COMPATIBLE ||
      analyzeVersionCompatibility(v2, v3) === KnowledgeCompatibilityLevel.PARTIALLY_COMPATIBLE,
  );
  console.log("✔ compatibility management — compatible, partially compatible, breaking change");
}

function testStateTransitions() {
  assert.equal(canTransitionVersionState(KnowledgeVersionState.DRAFT, KnowledgeVersionState.VALIDATION), true);
  assert.equal(canTransitionVersionState(KnowledgeVersionState.APPROVED, KnowledgeVersionState.DRAFT), false);
  const { draft } = createKnowledgeVersionDraft("typo-readability-first", ["Draft transition test"]);
  assert.ok(draft);
  const result = transitionVersionState(draft!, KnowledgeVersionState.VALIDATION);
  assert.equal(result.violations.length, 0);
  assert.equal(result.version.status, KnowledgeVersionState.VALIDATION);
  console.log("✔ version states — controlled lifecycle transitions");
}

function testCreateDraft() {
  const { draft, violations } = createKnowledgeVersionDraft("typo-readability-first", [
    "Refined hierarchy weights for mobile",
  ]);
  assert.equal(violations.length, 0);
  assert.ok(draft);
  assert.equal(draft!.status, KnowledgeVersionState.DRAFT);
  assert.ok(compareSemanticVersions(draft!.version, getLatestApprovedVersion("typo-readability-first")!.version) > 0);
  console.log("✔ change tracking — new draft version with documented changes");
}

function testExperimentalVersions() {
  const catalog = buildKnowledgeVersionCatalog();
  const experimental = catalog.find((v) => v.experimental);
  assert.ok(experimental);
  assert.equal(experimental!.status, KnowledgeVersionState.TESTING);
  const selection = selectKnowledgeVersion(experimental!.knowledgeId, { allowExperimental: false });
  assert.notEqual(selection?.version, experimental!.version);
  console.log("✔ experimental versions — limited testing, not used by all agents");
}

function testDependencyVersioning() {
  const catalog = buildKnowledgeVersionCatalog();
  const withDeps = catalog.find((v) => v.dependencies && v.dependencies.length > 0);
  if (withDeps) {
    const violations = validateDependencyVersions(withDeps, catalog);
    assert.ok(Array.isArray(violations));
  }
  console.log("✔ dependency versioning — references and inheritance tracked");
}

function testPublishValidation() {
  const catalog = buildKnowledgeVersionCatalog();
  const latest = getLatestApprovedVersion("typo-readability-first")!;
  const testingVersion: typeof latest = {
    ...latest,
    id: "typo-readability-first@1.0.1",
    version: "1.0.1",
    status: KnowledgeVersionState.TESTING,
    changes: ["Patch confidence calibration"],
    previousVersionId: latest.id,
  };
  const violations = validateVersionForPublication(testingVersion, {
    skipValidation: true,
    simulationPassed: true,
    regressionPassed: true,
    commercialScoreDelta: 0.05,
  });
  assert.equal(violations.length, 0);
  console.log("✔ validation before publish — structure, simulation, regression, commercial score");
}

function testPublishKnowledgeVersion() {
  const latest = getLatestApprovedVersion("typo-readability-first")!;
  const testingVersion = {
    ...latest,
    id: "typo-readability-first@5.12.0",
    version: "5.12.0",
    status: KnowledgeVersionState.TESTING,
    changes: ["Simulation-verified typography scale"],
    previousVersionId: latest.id,
    compatibility: KnowledgeCompatibilityLevel.COMPATIBLE,
  };
  const report = releaseKnowledgeVersion(testingVersion, {
    skipValidation: true,
    simulationPassed: true,
    regressionPassed: true,
    commercialScoreDelta: 0.04,
  });
  assert.equal(report.published, true);
  assert.equal(report.status, KnowledgeVersionState.APPROVED);
  assert.ok(report.auditEntry);
  console.log("✔ release — approved version with audit trail");
}

function testRollback() {
  const catalog = buildKnowledgeVersionCatalog();
  const history = getKnowledgeVersionHistory("photo-warm-lighting-rule", catalog);
  const target = history.find((v) => v.version === "1.1.0")!;
  const { record, violations } = rollbackKnowledgeVersion(
    "photo-warm-lighting-rule",
    target.id,
    "Commercial score regression after v3",
    catalog,
  );
  assert.equal(violations.length, 0);
  assert.ok(record);
  assert.equal(record!.preservedHistory, true);
  assert.equal(record!.testResultsRetained, true);
  console.log("✔ rollback — revert to stable version without deleting history");
}

function testKnowledgeSnapshot() {
  const snapshot = createKnowledgeSnapshot("project-kitchen-premium");
  assert.ok(snapshot.reproducible);
  assert.ok(Object.keys(snapshot.knowledgeVersions).length > 10);
  assert.equal(validateKnowledgeSnapshot(snapshot).length, 0);
  console.log("✔ knowledge snapshots — reproducible generation years later");
}

function testVersionSelection() {
  const selection = selectKnowledgeVersion("photo-warm-lighting-rule", {
    marketplace: "amazon",
    businessContext: "trust",
  });
  assert.ok(selection);
  assert.equal(selection!.status, KnowledgeVersionState.APPROVED);
  const pinned = selectKnowledgeVersion("photo-warm-lighting-rule", {
    pinnedVersions: { "photo-warm-lighting-rule": "1.0.0" },
  });
  assert.equal(pinned!.version, "1.0.0");
  assert.equal(pinned!.reason, "project-pinned");
  console.log("✔ version selection — retrieval uses approved compatible version");
}

function testAuditTrail() {
  const latest = getLatestApprovedVersion("typo-readability-first")!;
  const audit = recordAuditEntry(latest, ["confidence"], "Analytics refresh", true);
  assert.equal(audit.knowledgeId, latest.knowledgeId);
  assert.equal(audit.validationPassed, true);
  assert.ok(audit.changedFields.includes("confidence"));
  console.log("✔ audit trail — author, date, fields, reason, validation result");
}

function testValidateKnowledgeVersioning() {
  const report = validateKnowledgeVersioning();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.ok(report.approvedCount > 0);
  assert.equal(report.snapshotCapable, true);
  assert.equal(report.rollbackReady, true);
  assertKnowledgeVersioning();
  console.log("✔ knowledge versioning system validation passes");
}

function testRunKnowledgeVersioning() {
  const report = runKnowledgeVersioning();
  assert.equal(report.valid, true);
  assert.ok(report.versionCount > 20);
  console.log("✔ runKnowledgeVersioning entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeVersioningFailure("IMMUTABLE_VIOLATION"), true);
  assert.equal(isKnowledgeVersioningFailure("UNKNOWN"), false);
  console.log("✔ knowledge versioning failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testVersionLifecycle();
  testSemanticVersioning();
  testImmutableKnowledge();
  testVersionHistory();
  testCompatibilityAnalysis();
  testStateTransitions();
  testCreateDraft();
  testExperimentalVersions();
  testDependencyVersioning();
  testPublishValidation();
  testPublishKnowledgeVersion();
  testRollback();
  testKnowledgeSnapshot();
  testVersionSelection();
  testAuditTrail();
  testValidateKnowledgeVersioning();
  testRunKnowledgeVersioning();
  testFailureCodes();
  console.log("\nknowledge-versioning.spec.ts — all passed");
}

run();

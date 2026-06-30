/**
 * DESIGN AI v18 — Pipeline Architecture Principles tests (Chapter 6.20)
 */
import assert from "node:assert/strict";
import {
  PIPELINE_ARCHITECTURE_PRINCIPLES_VERSION,
  FINAL_GOLDEN_RULE_OF_DESIGN_PIPELINE,
  PIPELINE_ARCHITECTURE_STATEMENT,
  PIPELINE_ARCHITECTURE_CONSTITUTION,
  PIPELINE_MANIFEST,
  PIPELINE_MATURITY_LEVELS,
  PipelineArchitecturePrincipleId,
  PipelineMaturityLevel,
  getPipelineArchitecturePrinciple,
  validatePrinciplePlanningBeforeRendering,
  validatePrincipleBlueprintBeforePrompt,
  validatePrincipleAgentSpecialization,
  validatePrincipleSingleSourceOfTruth,
  validatePrincipleKnowledgeDrivenDecisions,
  validatePrincipleValidationBeforeProgress,
  validatePrincipleLocalRetry,
  validatePrincipleExplainability,
  validatePrincipleProviderIndependence,
  validatePrincipleContinuousLearning,
  validatePrincipleCommercialFirst,
  validatePrincipleScalability,
  validatePrincipleDeterministicWorkflow,
  validatePrincipleObservability,
  validatePrincipleFutureCompatibility,
  validatePipelineArchitecturePrinciple,
  validatePipelineManifest,
  detectPipelineMaturityLevel,
  validatePipelineArchitectureConstitution,
  assertPipelineArchitectureConstitution,
  runPipelineArchitecturePrinciples,
  isPipelineArchitecturePrincipleFailure,
} from "./index";

function testConstitutionCatalog() {
  assert.equal(PIPELINE_ARCHITECTURE_CONSTITUTION.length, 15);
  assert.equal(PIPELINE_ARCHITECTURE_PRINCIPLES_VERSION, "6.20.0");
  assert.ok(FINAL_GOLDEN_RULE_OF_DESIGN_PIPELINE.includes("single prompt"));
  assert.ok(PIPELINE_ARCHITECTURE_STATEMENT.includes("decision quality"));
  console.log("✔ constitution — 15 immutable architecture principles defined");
}

function testFinalGoldenRule() {
  assert.ok(FINAL_GOLDEN_RULE_OF_DESIGN_PIPELINE.includes("design director"));
  assert.ok(FINAL_GOLDEN_RULE_OF_DESIGN_PIPELINE.includes("collective"));
  console.log("✔ final golden rule — pipeline is collective design intelligence");
}

function testPipelineManifest() {
  assert.equal(PIPELINE_MANIFEST.length, 15);
  assert.equal(PIPELINE_MANIFEST[0].label, "Understand Product");
  assert.equal(PIPELINE_MANIFEST[14].label, "Deliver");
  assert.equal(validatePipelineManifest(), true);
  console.log("✔ pipeline manifest — each stage strengthens the previous");
}

function testMaturityLevels() {
  assert.equal(PIPELINE_MATURITY_LEVELS.length, 5);
  assert.equal(detectPipelineMaturityLevel(), PipelineMaturityLevel.SELF_IMPROVING);
  console.log("✔ maturity level 5 — self-improving design intelligence");
}

function testPrinciple1PlanningBeforeRendering() {
  const passed = validatePrinciplePlanningBeforeRendering();
  assert.equal(passed.passed, true);
  const failed = validatePrinciplePlanningBeforeRendering({ promptOnlyPipeline: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 1 — planning completes before rendering");
}

function testPrinciple2BlueprintBeforePrompt() {
  const passed = validatePrincipleBlueprintBeforePrompt();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleBlueprintBeforePrompt({ logicInPrompt: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 2 — blueprint is primary document, not prompt");
}

function testPrinciple3AgentSpecialization() {
  const passed = validatePrincipleAgentSpecialization();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleAgentSpecialization({ chaoticAgents: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 3 — each agent owns one knowledge domain");
}

function testPrinciple4SingleSourceOfTruth() {
  const passed = validatePrincipleSingleSourceOfTruth();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleSingleSourceOfTruth({ multipleBlueprints: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 4 — one authoritative render blueprint");
}

function testPrinciple5KnowledgeDrivenDecisions() {
  const passed = validatePrincipleKnowledgeDrivenDecisions();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleKnowledgeDrivenDecisions({ logicInPrompt: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 5 — knowledge engine before creative decisions");
}

function testPrinciple6ValidationBeforeProgress() {
  const passed = validatePrincipleValidationBeforeProgress();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleValidationBeforeProgress({ skipValidation: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 6 — validation mandatory before advancing");
}

function testPrinciple7LocalRetry() {
  const passed = validatePrincipleLocalRetry();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleLocalRetry({ fullPipelineRestartOnly: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 7 — local retry, not full pipeline restart");
}

function testPrinciple8Explainability() {
  const passed = validatePrincipleExplainability();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleExplainability({ blackBoxPipeline: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 8 — every decision is explainable");
}

function testPrinciple9ProviderIndependence() {
  const passed = validatePrincipleProviderIndependence();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleProviderIndependence({ providerLocked: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 9 — pipeline independent of render provider");
}

function testPrinciple10ContinuousLearning() {
  const passed = validatePrincipleContinuousLearning();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleContinuousLearning({ skipLearning: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 10 — learning completes every pipeline run");
}

function testPrinciple11CommercialFirst() {
  const passed = validatePrincipleCommercialFirst();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleCommercialFirst({ promptOnlyPipeline: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 11 — commercial effectiveness over aesthetics alone");
}

function testPrinciple12Scalability() {
  const passed = validatePrincipleScalability();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleScalability({ chaoticAgents: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 12 — modular components scale independently");
}

function testPrinciple13DeterministicWorkflow() {
  const passed = validatePrincipleDeterministicWorkflow();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleDeterministicWorkflow({ nonDeterministicPlanning: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 13 — planning decisions are deterministic");
}

function testPrinciple14Observability() {
  const passed = validatePrincipleObservability();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleObservability({ skipObservability: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 14 — every stage is measurable");
}

function testPrinciple15FutureCompatibility() {
  const passed = validatePrincipleFutureCompatibility();
  assert.equal(passed.passed, true);
  const failed = validatePrincipleFutureCompatibility({ providerLocked: true });
  assert.equal(failed.passed, false);
  console.log("✔ principle 15 — architecture ready for future evolution");
}

function testValidateConstitution() {
  const report = validatePipelineArchitectureConstitution();
  assert.equal(report.valid, true);
  assert.equal(report.principlesPassed, 15);
  assert.equal(report.principlesTotal, 15);
  assert.equal(report.constitutionSatisfied, true);
  assert.equal(report.finalGoldenRuleSatisfied, true);
  assert.equal(report.architectureStatementValid, true);
  assert.equal(report.manifestValid, true);
  assert.equal(report.successCriteriaMet, true);
  assert.equal(report.maturityLevel, PipelineMaturityLevel.SELF_IMPROVING);
  assertPipelineArchitectureConstitution();
  console.log("✔ full constitution — all 15 architecture principles satisfied");
}

function testGetPrinciple() {
  const principle = getPipelineArchitecturePrinciple(
    PipelineArchitecturePrincipleId.PLANNING_BEFORE_RENDERING,
  )!;
  assert.equal(principle.number, 1);
  assert.equal(principle.immutable, true);
  const check = validatePipelineArchitecturePrinciple(
    PipelineArchitecturePrincipleId.PLANNING_BEFORE_RENDERING,
  );
  assert.equal(check.passed, true);
  console.log("✔ individual principle lookup and validation works");
}

function testRunPipelineArchitecturePrinciples() {
  const report = runPipelineArchitecturePrinciples();
  assert.equal(report.valid, true);
  console.log("✔ runPipelineArchitecturePrinciples entry point works");
}

function testFailureCodes() {
  assert.equal(isPipelineArchitecturePrincipleFailure("PROMPT_AS_SOURCE"), true);
  assert.equal(isPipelineArchitecturePrincipleFailure("UNKNOWN"), false);
  console.log("✔ architecture principle failure codes are catalogued");
}

function run() {
  testConstitutionCatalog();
  testFinalGoldenRule();
  testPipelineManifest();
  testMaturityLevels();
  testPrinciple1PlanningBeforeRendering();
  testPrinciple2BlueprintBeforePrompt();
  testPrinciple3AgentSpecialization();
  testPrinciple4SingleSourceOfTruth();
  testPrinciple5KnowledgeDrivenDecisions();
  testPrinciple6ValidationBeforeProgress();
  testPrinciple7LocalRetry();
  testPrinciple8Explainability();
  testPrinciple9ProviderIndependence();
  testPrinciple10ContinuousLearning();
  testPrinciple11CommercialFirst();
  testPrinciple12Scalability();
  testPrinciple13DeterministicWorkflow();
  testPrinciple14Observability();
  testPrinciple15FutureCompatibility();
  testValidateConstitution();
  testGetPrinciple();
  testRunPipelineArchitecturePrinciples();
  testFailureCodes();
  console.log("\npipeline-architecture-principles.spec.ts — all passed");
}

run();

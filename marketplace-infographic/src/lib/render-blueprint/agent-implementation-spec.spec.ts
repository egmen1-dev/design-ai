/**
 * DESIGN AI v18 — Agent Implementation Specification tests (Chapter 7)
 */
import assert from "node:assert/strict";
import {
  AGENT_IMPLEMENTATION_SPEC_VERSION,
  AGENT_IMPLEMENTATION_SPEC_GOLDEN_RULE,
  AGENT_IMPLEMENTATION_ARCHITECTURE_STATEMENT,
  LEGACY_PROMPT_AGENT_MODEL,
  UNIVERSAL_AGENT_MODEL_PIPELINE,
  AGENT_INTERNAL_ARCHITECTURE,
  AGENT_SHARED_PRINCIPLES,
  AGENT_DOCUMENTATION_TEMPLATE,
  AGENT_IMPLEMENTATION_SCOPE,
  UniversalAgentModelStage,
  AgentInternalLayer,
  AgentSharedPrincipleId,
  AgentImplementationStatus,
  validateUniversalAgentModel,
  validateAgentInternalArchitecture,
  validateAgentDocumentationTemplate,
  validateAgentScopeCatalog,
  validatePrincipleSingleDomain,
  validatePrincipleUseKnowledgeEngine,
  validatePrincipleNoForeignBlueprintMutation,
  validatePrincipleSelfValidationRequired,
  validatePrincipleExplainableOutput,
  validatePrincipleRetrySupport,
  validatePrincipleDeterministicDecisions,
  validateAgentSharedPrinciple,
  validateImplementedAgentConformance,
  validateAllImplementedAgents,
  validateAgentImplementationSpec,
  assertAgentImplementationSpec,
  runAgentImplementationSpec,
  getAgentDocumentationTemplate,
  getAgentImplementationScopeEntry,
  isAgentImplementationSpecFailure,
} from "./index";

function testSpecCatalog() {
  assert.equal(AGENT_SHARED_PRINCIPLES.length, 7);
  assert.equal(UNIVERSAL_AGENT_MODEL_PIPELINE.length, 9);
  assert.equal(AGENT_INTERNAL_ARCHITECTURE.length, 8);
  assert.equal(AGENT_DOCUMENTATION_TEMPLATE.length, 13);
  assert.equal(AGENT_IMPLEMENTATION_SCOPE.length, 21);
  assert.equal(AGENT_IMPLEMENTATION_SPEC_VERSION, "7.0.0");
  console.log("✔ specification catalog — universal model, architecture, principles, scope");
}

function testGoldenRule() {
  assert.ok(AGENT_IMPLEMENTATION_SPEC_GOLDEN_RULE.includes("built inside"));
  assert.ok(AGENT_IMPLEMENTATION_ARCHITECTURE_STATEMENT.includes("microservice"));
  console.log("✔ golden rule — internal implementation distinct from ecosystem interaction");
}

function testLegacyPromptContrast() {
  assert.deepEqual(LEGACY_PROMPT_AGENT_MODEL, ["input", "prompt", "llm", "output"]);
  assert.ok(!LEGACY_PROMPT_AGENT_MODEL.includes("decision_engine"));
  console.log("✔ design philosophy — not input prompt llm output");
}

function testUniversalAgentModel() {
  assert.equal(validateUniversalAgentModel().length, 0);
  assert.equal(UNIVERSAL_AGENT_MODEL_PIPELINE[0].id, UniversalAgentModelStage.PIPELINE_CONTEXT);
  assert.equal(UNIVERSAL_AGENT_MODEL_PIPELINE[3].id, UniversalAgentModelStage.DECISION_ENGINE);
  assert.equal(UNIVERSAL_AGENT_MODEL_PIPELINE[8].id, UniversalAgentModelStage.PIPELINE_CONTEXT_OUT);
  console.log("✔ universal agent model — 9-stage internal pipeline");
}

function testInternalArchitecture() {
  assert.equal(validateAgentInternalArchitecture().length, 0);
  assert.equal(AGENT_INTERNAL_ARCHITECTURE[0].id, AgentInternalLayer.INPUT_LAYER);
  assert.equal(AGENT_INTERNAL_ARCHITECTURE[6].id, AgentInternalLayer.SELF_CRITIC);
  console.log("✔ common internal architecture — 8 identical layers");
}

function testDocumentationTemplate() {
  assert.equal(validateAgentDocumentationTemplate(), true);
  assert.equal(getAgentDocumentationTemplate().length, 13);
  assert.equal(getAgentDocumentationTemplate()[12].title, "Golden Rule");
  console.log("✔ documentation standard — 13 sections per agent");
}

function testScopeCatalog() {
  assert.equal(validateAgentScopeCatalog(), true);
  const story = getAgentImplementationScopeEntry("visual-story-director")!;
  assert.equal(story.status, AgentImplementationStatus.IMPLEMENTED);
  assert.equal(story.blueprintSections?.[0], "story");
  const planned = AGENT_IMPLEMENTATION_SCOPE.filter((e) => e.status === AgentImplementationStatus.PLANNED);
  assert.ok(planned.length >= 5);
  console.log("✔ scope catalog — 21 agents with implemented and planned entries");
}

function testPrincipleSingleDomain() {
  assert.equal(validatePrincipleSingleDomain().passed, true);
  assert.equal(validatePrincipleSingleDomain({ superAgent: true }).passed, false);
  console.log("✔ shared principle — single domain specialization");
}

function testPrincipleUseKnowledgeEngine() {
  assert.equal(validatePrincipleUseKnowledgeEngine().passed, true);
  assert.equal(validatePrincipleUseKnowledgeEngine({ promptOnlyAgent: true }).passed, false);
  console.log("✔ shared principle — knowledge engine before decisions");
}

function testPrincipleNoForeignMutation() {
  assert.equal(validatePrincipleNoForeignBlueprintMutation().passed, true);
  assert.equal(validatePrincipleNoForeignBlueprintMutation({ mutateForeignSections: true }).passed, false);
  console.log("✔ shared principle — no foreign blueprint mutation");
}

function testPrincipleSelfValidation() {
  assert.equal(validatePrincipleSelfValidationRequired().passed, true);
  assert.equal(validatePrincipleSelfValidationRequired({ skipSelfValidation: true }).passed, false);
  console.log("✔ shared principle — self validation before output");
}

function testPrincipleExplainableOutput() {
  assert.equal(validatePrincipleExplainableOutput().passed, true);
  assert.equal(validatePrincipleExplainableOutput({ blackBoxOutput: true }).passed, false);
  console.log("✔ shared principle — explainable agent output");
}

function testPrincipleRetrySupport() {
  assert.equal(validatePrincipleRetrySupport().passed, true);
  assert.equal(validatePrincipleRetrySupport({ noRetrySupport: true }).passed, false);
  console.log("✔ shared principle — localized retry support");
}

function testPrincipleDeterministicDecisions() {
  assert.equal(validatePrincipleDeterministicDecisions().passed, true);
  assert.equal(validatePrincipleDeterministicDecisions({ nonDeterministicAgent: true }).passed, false);
  console.log("✔ shared principle — deterministic planning decisions");
}

function testImplementedAgentConformance() {
  const story = validateImplementedAgentConformance("visual-story-director");
  assert.equal(story.conforms, true);
  assert.equal(story.hasContract, true);
  assert.equal(story.usesDecisionEngine, true);
  const all = validateAllImplementedAgents();
  assert.ok(all.length >= 7);
  assert.ok(all.every((r) => r.conforms));
  console.log("✔ implemented agents conform to universal implementation spec");
}

function testValidateFullSpec() {
  const report = validateAgentImplementationSpec();
  assert.equal(report.valid, true);
  assert.equal(report.principlesPassed, 7);
  assert.equal(report.universalModelComplete, true);
  assert.equal(report.internalArchitectureComplete, true);
  assert.equal(report.documentationTemplateComplete, true);
  assert.equal(report.scopeCatalogComplete, true);
  assert.equal(report.implementedAgentsConform, true);
  assert.equal(report.successCriteriaMet, true);
  assertAgentImplementationSpec();
  console.log("✔ full specification — all shared principles and conformance checks pass");
}

function testIndividualPrincipleLookup() {
  const check = validateAgentSharedPrinciple(AgentSharedPrincipleId.SINGLE_DOMAIN);
  assert.equal(check.passed, true);
  console.log("✔ individual shared principle lookup works");
}

function testRunAgentImplementationSpec() {
  assert.equal(runAgentImplementationSpec().valid, true);
  console.log("✔ runAgentImplementationSpec entry point works");
}

function testFailureCodes() {
  assert.equal(isAgentImplementationSpecFailure("PROMPT_ONLY_AGENT"), true);
  assert.equal(isAgentImplementationSpecFailure("UNKNOWN"), false);
  console.log("✔ implementation spec failure codes are catalogued");
}

function run() {
  testSpecCatalog();
  testGoldenRule();
  testLegacyPromptContrast();
  testUniversalAgentModel();
  testInternalArchitecture();
  testDocumentationTemplate();
  testScopeCatalog();
  testPrincipleSingleDomain();
  testPrincipleUseKnowledgeEngine();
  testPrincipleNoForeignMutation();
  testPrincipleSelfValidation();
  testPrincipleExplainableOutput();
  testPrincipleRetrySupport();
  testPrincipleDeterministicDecisions();
  testImplementedAgentConformance();
  testValidateFullSpec();
  testIndividualPrincipleLookup();
  testRunAgentImplementationSpec();
  testFailureCodes();
  console.log("\nagent-implementation-spec.spec.ts — all passed");
}

run();

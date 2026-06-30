/**
 * DESIGN AI v18 — Agent Design Philosophy tests (Chapter 7.1)
 */
import assert from "node:assert/strict";
import {
  AGENT_DESIGN_PHILOSOPHY_VERSION,
  AGENT_DESIGN_PHILOSOPHY_GOLDEN_RULE,
  AGENT_DESIGN_PHILOSOPHY_STATEMENT,
  AGENT_OATH,
  LEGACY_SINGLE_PROMPT_MODEL,
  HUMAN_STUDIO_PIPELINE,
  AGENT_PROFESSIONAL_TRAITS,
  AGENT_DESIGN_PHILOSOPHY_PRINCIPLES,
  BLUEPRINT_SECTION_OWNERSHIP,
  AGENT_COOPERATION_CHAIN,
  AgentDesignPhilosophyPrincipleId,
  validateHumanStudioModel,
  validateAgentPhilosophySpecialization,
  validateAgentPhilosophyResponsibility,
  validateAgentPhilosophyExplainability,
  validateAgentPhilosophyKnowledgeDrivenDesign,
  validateAgentPhilosophyDeterminism,
  validateAgentPhilosophyMinimalAuthority,
  validateAgentPhilosophyValidation,
  validateAgentPhilosophyCooperation,
  validateAgentPhilosophyIsolation,
  validateAgentPhilosophyContinuousImprovement,
  validateAgentPhilosophyCommercialThinking,
  validateAgentPhilosophyFutureCompatibility,
  validateAgentDesignPhilosophyPrinciple,
  validateAgentDesignPhilosophy,
  assertAgentDesignPhilosophy,
  runAgentDesignPhilosophy,
  getAgentDesignPhilosophyPrinciple,
  isAgentDesignPhilosophyFailure,
} from "./index";

function testPhilosophyCatalog() {
  assert.equal(AGENT_DESIGN_PHILOSOPHY_PRINCIPLES.length, 12);
  assert.equal(AGENT_PROFESSIONAL_TRAITS.length, 6);
  assert.equal(BLUEPRINT_SECTION_OWNERSHIP.length, 9);
  assert.equal(AGENT_COOPERATION_CHAIN.length, 6);
  assert.equal(AGENT_DESIGN_PHILOSOPHY_VERSION, "7.1.0");
  console.log("✔ philosophy catalog — 12 principles, traits, ownership, cooperation");
}

function testGoldenRuleAndOath() {
  assert.ok(AGENT_DESIGN_PHILOSOPHY_GOLDEN_RULE.includes("digital professional"));
  assert.ok(AGENT_DESIGN_PHILOSOPHY_STATEMENT.includes("design agency"));
  assert.ok(AGENT_OATH.includes("verified knowledge"));
  console.log("✔ golden rule and agent oath defined");
}

function testLegacyPromptContrast() {
  assert.deepEqual(LEGACY_SINGLE_PROMPT_MODEL, ["user_request", "llm", "result"]);
  assert.ok(!LEGACY_SINGLE_PROMPT_MODEL.includes("knowledge"));
  console.log("✔ why multi-agent — not user request llm result");
}

function testHumanStudioAnalogy() {
  assert.equal(HUMAN_STUDIO_PIPELINE.length, 7);
  assert.equal(validateHumanStudioModel(), true);
  assert.equal(HUMAN_STUDIO_PIPELINE[0].label, "Marketer");
  assert.equal(HUMAN_STUDIO_PIPELINE[6].label, "Creative Director");
  console.log("✔ human studio analogy — team strengthens previous role");
}

function testPrincipleSpecialization() {
  assert.equal(validateAgentPhilosophySpecialization().passed, true);
  assert.equal(validateAgentPhilosophySpecialization({ superAgent: true }).passed, false);
  console.log("✔ principle 1 — maximum agent specialization");
}

function testPrincipleResponsibility() {
  assert.equal(validateAgentPhilosophyResponsibility().passed, true);
  assert.equal(validateAgentPhilosophyResponsibility({ mutateForeignBlueprint: true }).passed, false);
  console.log("✔ principle 2 — blueprint section ownership");
}

function testPrincipleExplainability() {
  assert.equal(validateAgentPhilosophyExplainability().passed, true);
  assert.equal(validateAgentPhilosophyExplainability({ blackBoxDecision: true }).passed, false);
  console.log("✔ principle 3 — every decision explainable");
}

function testPrincipleKnowledgeDriven() {
  assert.equal(validateAgentPhilosophyKnowledgeDrivenDesign().passed, true);
  assert.equal(validateAgentPhilosophyKnowledgeDrivenDesign({ llmOnlyDecision: true }).passed, false);
  console.log("✔ principle 4 — knowledge engine before LLM intuition");
}

function testPrincipleDeterminism() {
  assert.equal(validateAgentPhilosophyDeterminism().passed, true);
  assert.equal(validateAgentPhilosophyDeterminism({ nonDeterministic: true }).passed, false);
  console.log("✔ principle 5 — reproducible agent decisions");
}

function testPrincipleMinimalAuthority() {
  assert.equal(validateAgentPhilosophyMinimalAuthority().passed, true);
  assert.equal(validateAgentPhilosophyMinimalAuthority({ excessiveContext: true }).passed, false);
  console.log("✔ principle 6 — minimal context authority");
}

function testPrincipleValidation() {
  assert.equal(validateAgentPhilosophyValidation().passed, true);
  assert.equal(validateAgentPhilosophyValidation({ skipValidation: true }).passed, false);
  console.log("✔ principle 7 — self validation before publish");
}

function testPrincipleCooperation() {
  assert.equal(validateAgentPhilosophyCooperation().passed, true);
  assert.equal(validateAgentPhilosophyCooperation({ directAgentCall: true }).passed, false);
  console.log("✔ principle 8 — agents strengthen previous decisions");
}

function testPrincipleIsolation() {
  assert.equal(validateAgentPhilosophyIsolation().passed, true);
  assert.equal(validateAgentPhilosophyIsolation({ directAgentCall: true }).passed, false);
  console.log("✔ principle 9 — modular isolation through contracts");
}

function testPrincipleContinuousImprovement() {
  assert.equal(validateAgentPhilosophyContinuousImprovement().passed, true);
  assert.equal(validateAgentPhilosophyContinuousImprovement({ skipLearning: true }).passed, false);
  console.log("✔ principle 10 — learning feedback after every generation");
}

function testPrincipleCommercialThinking() {
  assert.equal(validateAgentPhilosophyCommercialThinking().passed, true);
  assert.equal(validateAgentPhilosophyCommercialThinking({ beautyWithoutBusiness: true }).passed, false);
  console.log("✔ principle 11 — commercial effectiveness over aesthetics alone");
}

function testPrincipleFutureCompatibility() {
  assert.equal(validateAgentPhilosophyFutureCompatibility().passed, true);
  assert.equal(validateAgentPhilosophyFutureCompatibility({ llmLocked: true }).passed, false);
  console.log("✔ principle 12 — future-proof agent architecture");
}

function testValidateFullPhilosophy() {
  const report = validateAgentDesignPhilosophy();
  assert.equal(report.valid, true);
  assert.equal(report.principlesPassed, 12);
  assert.equal(report.philosophySatisfied, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.agentOathValid, true);
  assert.equal(report.humanStudioModelValid, true);
  assert.equal(report.successCriteriaMet, true);
  assertAgentDesignPhilosophy();
  console.log("✔ full philosophy — all 12 principles satisfied");
}

function testPrincipleLookup() {
  const principle = getAgentDesignPhilosophyPrinciple(AgentDesignPhilosophyPrincipleId.SPECIALIZATION)!;
  assert.equal(principle.number, 1);
  assert.equal(validateAgentDesignPhilosophyPrinciple(AgentDesignPhilosophyPrincipleId.SPECIALIZATION).passed, true);
  console.log("✔ individual principle lookup works");
}

function testRunAgentDesignPhilosophy() {
  assert.equal(runAgentDesignPhilosophy().valid, true);
  console.log("✔ runAgentDesignPhilosophy entry point works");
}

function testFailureCodes() {
  assert.equal(isAgentDesignPhilosophyFailure("SUPER_AGENT"), true);
  assert.equal(isAgentDesignPhilosophyFailure("UNKNOWN"), false);
  console.log("✔ philosophy failure codes are catalogued");
}

function run() {
  testPhilosophyCatalog();
  testGoldenRuleAndOath();
  testLegacyPromptContrast();
  testHumanStudioAnalogy();
  testPrincipleSpecialization();
  testPrincipleResponsibility();
  testPrincipleExplainability();
  testPrincipleKnowledgeDriven();
  testPrincipleDeterminism();
  testPrincipleMinimalAuthority();
  testPrincipleValidation();
  testPrincipleCooperation();
  testPrincipleIsolation();
  testPrincipleContinuousImprovement();
  testPrincipleCommercialThinking();
  testPrincipleFutureCompatibility();
  testValidateFullPhilosophy();
  testPrincipleLookup();
  testRunAgentDesignPhilosophy();
  testFailureCodes();
  console.log("\nagent-design-philosophy.spec.ts — all passed");
}

run();

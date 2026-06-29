/**
 * DESIGN AI v18 — Agent Ecosystem tests (Chapter 4)
 */
import assert from "node:assert/strict";
import {
  AGENT_CATEGORIES,
  AGENT_ECOSYSTEM_GOLDEN_RULE,
  AGENT_PRINCIPLES,
  AGENT_CATEGORY_MAP,
  AgentEcosystemCategory,
  AgentPrinciple,
  agentsInCategory,
  getAgentCategory,
  isDesignAgent,
  AgentEcosystemValidator,
  AgentEcosystemError,
  assertAgentEcosystem,
  recordAgentDecision,
  validateAgentEcosystem,
  storyDirectorAgent,
  BlueprintLifecycle,
} from "./index";

function testPrinciplesCatalog() {
  assert.equal(AGENT_PRINCIPLES.length, 9);
  assert.equal(AGENT_CATEGORIES.length, 5);
  assert.ok(AGENT_ECOSYSTEM_GOLDEN_RULE.includes("not a prompt generator"));
  console.log("✔ agent ecosystem defines 9 principles and 5 categories");
}

function testCategoryMapping() {
  assert.equal(getAgentCategory("visual-story-director"), AgentEcosystemCategory.CREATIVE_DIRECTOR);
  assert.equal(getAgentCategory("lighting-director"), AgentEcosystemCategory.TECHNICAL_DIRECTOR);
  assert.equal(getAgentCategory("critics"), AgentEcosystemCategory.CRITIC);
  assert.equal(getAgentCategory("chief-design-director"), AgentEcosystemCategory.ORCHESTRATOR);
  assert.equal(getAgentCategory("flux-adapter"), null);
  assert.equal(isDesignAgent("flux-adapter"), false);
  assert.ok(agentsInCategory(AgentEcosystemCategory.TECHNICAL_DIRECTOR).includes("camera-director"));
  console.log("✔ agents mapped to creative, technical, critic, orchestrator categories");
}

function testAllDesignAgentsCategorized() {
  const uncategorized = Object.entries(AGENT_CATEGORY_MAP).filter(
    ([id, cat]) => id !== "flux-adapter" && cat === null,
  );
  assert.equal(uncategorized.length, 0);
  console.log("✔ every design agent has an ecosystem category");
}

async function testStoryDirectorPassesPrinciples() {
  const result = await storyDirectorAgent.execute(
    {
      meta: { revision: 0 } as never,
      story: { hook: "", customerProblem: "", customerDesire: "", visualPromise: "", emotionalTone: "", narrative: "" },
      creative: { goal: "Technical", marketplace: "WB", priceSegment: "middle", audience: "x", emotion: "x" },
      product: { category: "electronics", subCategory: "x", dominantColor: [], materials: [], finish: "matte", shape: "rect", cutout: true },
      lifecycle: { stage: BlueprintLifecycle.STORY_DEFINED, sections: {} as never },
    } as never,
    { productCategory: "electronics", creativeGoal: "Technical" },
  );

  const report = validateAgentEcosystem({
    agent: storyDirectorAgent,
    result,
    sectionsWritten: ["story"],
  });
  assert.equal(report.valid, true);
  assert.ok(report.passed.includes(AgentPrinciple.EXPLAINABLE_DECISION));
  assert.ok(report.passed.includes(AgentPrinciple.PROVIDER_INDEPENDENCE));
  console.log("✔ story director passes agent ecosystem principles");
}

function testProviderReferenceViolatesIndependence() {
  const report = validateAgentEcosystem({
    agent: storyDirectorAgent,
    result: {
      confidence: 80,
      decisionTrace: ["Using FLUX for better quality"],
      warnings: [],
    },
    sectionsWritten: ["story"],
  });
  assert.equal(report.valid, false);
  assert.ok(
    report.violations.some((v) => v.principle === AgentPrinciple.PROVIDER_INDEPENDENCE),
  );
  console.log("✔ provider reference in decisionTrace violates provider independence");
}

function testCrossAgentCallViolatesIsolation() {
  const report = validateAgentEcosystem({
    agent: storyDirectorAgent,
    crossAgentCall: { target: "lighting-director" },
  });
  assert.ok(
    report.violations.some((v) => v.principle === AgentPrinciple.NO_DIRECT_COMMUNICATION),
  );
  console.log("✔ direct agent call violates no direct communication");
}

function testSingleResponsibilityViolation() {
  const report = validateAgentEcosystem({
    agent: storyDirectorAgent,
    result: {
      confidence: 85,
      decisionTrace: ["wrote lighting"],
      warnings: [],
    },
    sectionsWritten: ["lighting"],
  });
  assert.ok(
    report.violations.some((v) => v.principle === AgentPrinciple.SINGLE_RESPONSIBILITY),
  );
  console.log("✔ writing foreign section violates single responsibility");
}

function testMissingDecisionTrace() {
  const report = validateAgentEcosystem({
    agent: storyDirectorAgent,
    result: { confidence: 90, decisionTrace: [], warnings: [] },
    sectionsWritten: ["story"],
  });
  assert.ok(
    report.violations.some((v) => v.principle === AgentPrinciple.EXPLAINABLE_DECISION),
  );
  console.log("✔ missing decisionTrace violates explainable decision");
}

function testRecordAgentDecision() {
  const record = recordAgentDecision({
    agentId: "visual-story-director",
    result: {
      confidence: 82,
      decisionTrace: ["Hook from creative goal"],
      warnings: [],
    },
    sectionsUsed: ["story", "creative", "product"],
    constraintsConsidered: ["no typography"],
    reason: "Story hook derived from product category",
  });
  assert.equal(record.category, AgentEcosystemCategory.CREATIVE_DIRECTOR);
  assert.equal(record.sectionsUsed.length, 3);
  assert.ok(record.reason.length > 0);
  console.log("✔ agent decision record captures explainability fields");
}

function testAgentEcosystemValidatorClass() {
  const validator = new AgentEcosystemValidator();
  assert.throws(
    () =>
      validator.assert({
        agent: storyDirectorAgent,
        result: { confidence: 200, decisionTrace: ["bad"], warnings: [] },
        sectionsWritten: ["story"],
      }),
    AgentEcosystemError,
  );
  console.log("✔ AgentEcosystemValidator throws on principle violation");
}

function testGoldenRuleAdapterExcluded() {
  const report = validateAgentEcosystem({ agent: storyDirectorAgent });
  assert.notEqual(report.category, null);
  console.log("✔ golden rule — agents decide design, adapters translate");
}

async function run() {
  testPrinciplesCatalog();
  testCategoryMapping();
  testAllDesignAgentsCategorized();
  await testStoryDirectorPassesPrinciples();
  testProviderReferenceViolatesIndependence();
  testCrossAgentCallViolatesIsolation();
  testSingleResponsibilityViolation();
  testMissingDecisionTrace();
  testRecordAgentDecision();
  testAgentEcosystemValidatorClass();
  testGoldenRuleAdapterExcluded();
  console.log("\nagent-ecosystem.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Universal Agent Contract tests (Chapter 4.1)
 */
import assert from "node:assert/strict";
import {
  AgentCategory,
  STABLE_AGENT_IDS,
  UNIVERSAL_AGENT_CONTRACT_GOLDEN_RULE,
  UniversalAgentContractValidator,
  UniversalContractError,
  assertUniversalAgentContract,
  categoryForAgent,
  consumesForAgent,
  createAgentContext,
  denormalizeConfidence,
  normalizeConfidence,
  preconditionsMet,
  producesForAgent,
  updatesToMutations,
  validateUniversalAgentContract,
  wrapLegacyBlueprintAgent,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
  storyDirectorAgent,
  universalStoryDirectorAgent,
} from "./index";

function testStableAgentIds() {
  assert.ok(STABLE_AGENT_IDS.includes("visual-story-director"));
  assert.ok(STABLE_AGENT_IDS.includes("design-memory"));
  console.log("✔ stable agent IDs catalog includes current and reserved agents");
}

function testCategoryProducesConsumes() {
  assert.equal(categoryForAgent("visual-story-director"), AgentCategory.CREATIVE_DIRECTOR);
  assert.ok(consumesForAgent("visual-story-director").includes("creative"));
  assert.ok(producesForAgent("lighting-director").includes("lighting"));
  console.log("✔ category, produces, and consumes derived from agent matrix");
}

function testConfidenceNormalization() {
  assert.equal(normalizeConfidence(82), 0.82);
  assert.equal(normalizeConfidence(0.75), 0.75);
  assert.equal(denormalizeConfidence(0.82), 82);
  console.log("✔ confidence normalized 0.0..1.0 with legacy 0..100 bridge");
}

function testUniversalInterface() {
  const report = validateUniversalAgentContract(universalStoryDirectorAgent);
  assert.equal(report.valid, true);
  assert.equal(universalStoryDirectorAgent.category, AgentCategory.CREATIVE_DIRECTOR);
  assert.deepEqual(universalStoryDirectorAgent.produces, ["story"]);
  console.log("✔ universal story director implements BlueprintAgent interface");
}

async function testExecuteReturnsMutationsNotBlueprint() {
  let bp = createEmptyRenderBlueprint({ category: "electronics", seed: 1 });
  bp = {
    ...bp,
    lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED },
  };
  const context = createAgentContext({ blueprint: bp });
  assert.equal(universalStoryDirectorAgent.canExecute(context), true);

  const result = await universalStoryDirectorAgent.execute(context);
  assert.equal(result.approved, true);
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  assert.ok(result.mutations.length >= 1);
  assert.equal(result.mutations[0].section, "story");
  assert.equal((result as { blueprint?: unknown }).blueprint, undefined);
  assert.ok(result.diagnostics.inputHash.length > 0);
  assert.ok(result.diagnostics.outputHash.length > 0);
  console.log("✔ execute returns mutations and diagnostics — never full blueprint");
}

function testMutationOwnershipViolation() {
  const mutations = updatesToMutations(
    { lighting: { preset: "studio", temperature: 5500, key: 1, fill: 0.5, rim: 0, back: 0, shadowSoftness: 0.5, reflectionStrength: 0.3 } },
    "visual-story-director",
    0,
    "bad",
  );
  const report = validateUniversalAgentContract(universalStoryDirectorAgent, {
    approved: false,
    confidence: 0.5,
    mutations,
    diagnostics: {
      executionTimeMs: 1,
      inputHash: "a",
      outputHash: "b",
      confidence: 0.5,
      version: "1.0.0",
      consumedSections: ["creative"],
      producedSections: ["story"],
      decisionTrace: ["test"],
    },
    recommendations: [],
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "MUTATION_OWNERSHIP"));
  console.log("✔ mutation outside produces list violates ownership");
}

function testCanExecuteNeverThrows() {
  const bp = createEmptyRenderBlueprint({ category: "x" });
  const context = createAgentContext({ blueprint: bp });
  assert.equal(typeof universalStoryDirectorAgent.canExecute(context), "boolean");
  console.log("✔ canExecute returns boolean without throwing");
}

function testPreconditionsMet() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const context = createAgentContext({
    blueprint: { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } },
  });
  assert.equal(preconditionsMet(universalStoryDirectorAgent, context), true);
  console.log("✔ preconditionsMet checks consumed sections and canExecute");
}

function testWrapLegacyAgent() {
  const wrapped = wrapLegacyBlueprintAgent(storyDirectorAgent, {
    category: AgentCategory.CREATIVE_DIRECTOR,
    consumes: ["creative", "product"],
    produces: ["story"],
    buildInput: (ctx) => ({
      productCategory: ctx.blueprint.product.category,
      creativeGoal: ctx.blueprint.creative.goal,
    }),
  });
  assert.equal(wrapped.id, storyDirectorAgent.id);
  assert.throws(
    () =>
      new UniversalAgentContractValidator().assert({
        ...wrapped,
        id: "",
      } as typeof wrapped),
    UniversalContractError,
  );
  console.log("✔ wrapLegacyBlueprintAgent bridges Ch 3.2 to Ch 4.1 contract");
}

function testGoldenRule() {
  assert.ok(UNIVERSAL_AGENT_CONTRACT_GOLDEN_RULE.includes("interchangeable"));
  assert.throws(() => assertUniversalAgentContract({} as never), UniversalContractError);
  console.log("✔ golden rule — new agents plug in without lifecycle changes");
}

async function run() {
  testStableAgentIds();
  testCategoryProducesConsumes();
  testConfidenceNormalization();
  testUniversalInterface();
  await testExecuteReturnsMutationsNotBlueprint();
  testMutationOwnershipViolation();
  testCanExecuteNeverThrows();
  testPreconditionsMet();
  testWrapLegacyAgent();
  testGoldenRule();
  console.log("\nuniversal-agent-contract.spec.ts — all passed");
}

run();

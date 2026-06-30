/**
 * DESIGN AI v18 — Base Agent Architecture tests (Chapter 7.2)
 */
import assert from "node:assert/strict";
import {
  BASE_AGENT_ARCHITECTURE_VERSION,
  BASE_AGENT_ARCHITECTURE_GOLDEN_RULE,
  LEGACY_PROMPT_AGENT_ARCHITECTURE,
  BASE_AGENT_PIPELINE,
  BASE_AGENT_LAYERS,
  BASE_AGENT_INJECTABLE_DEPENDENCIES,
  BASE_AGENT_ERROR_CATEGORIES,
  BaseAgentPipelineStage,
  BaseAgentArchitectureLayer,
  BaseAgentExecutionStatus,
  createInitialAgentState,
  buildBaseAgentInput,
  projectContextForAgent,
  buildAgentTelemetry,
  validateBaseAgentPipelineStructure,
  validateStatelessDesign,
  validateDependencyInjection,
  executeBaseAgentArchitecture,
  validateBaseAgentArchitecture,
  validateBaseAgentArchitectureWithExecution,
  assertBaseAgentArchitecture,
  runBaseAgentArchitecture,
  getBaseAgentLayer,
  getBaseAgentPipelineStage,
  isBaseAgentArchitectureFailure,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
} from "./index";

async function testArchitectureCatalog() {
  assert.equal(BASE_AGENT_PIPELINE.length, 9);
  assert.equal(BASE_AGENT_LAYERS.length, 9);
  assert.equal(BASE_AGENT_INJECTABLE_DEPENDENCIES.length, 5);
  assert.equal(BASE_AGENT_ERROR_CATEGORIES.length, 4);
  assert.equal(BASE_AGENT_ARCHITECTURE_VERSION, "7.2.0");
  console.log("✔ architecture catalog — 9-stage pipeline and 9 layers");
}

function testGoldenRule() {
  assert.ok(BASE_AGENT_ARCHITECTURE_GOLDEN_RULE.includes("identical engineering structure"));
  console.log("✔ golden rule — same structure, different profession");
}

function testLegacyPromptContrast() {
  assert.deepEqual(LEGACY_PROMPT_AGENT_ARCHITECTURE, ["input", "prompt", "llm", "output"]);
  console.log("✔ modular architecture — not input prompt llm output");
}

function testPipelineAndLayers() {
  assert.equal(validateBaseAgentPipelineStructure().length, 0);
  assert.equal(BASE_AGENT_PIPELINE[0].id, BaseAgentPipelineStage.PIPELINE_CONTEXT);
  assert.equal(BASE_AGENT_PIPELINE[4].id, BaseAgentPipelineStage.DECISION_ENGINE);
  assert.equal(BASE_AGENT_PIPELINE[8].id, BaseAgentPipelineStage.OUTPUT_ADAPTER);
  assert.equal(BASE_AGENT_LAYERS[8].id, BaseAgentArchitectureLayer.TELEMETRY);
  console.log("✔ universal pipeline — decision engine is only variable module");
}

function testAgentInputAndState() {
  const input = buildBaseAgentInput({ agentId: "visual-story-director" });
  assert.ok(input.pipelineContext);
  assert.ok(input.blueprint);
  assert.ok(input.knowledge.items.length > 0);
  assert.ok(input.constraints.constraints.length >= 0);

  const state = createInitialAgentState();
  assert.equal(state.status, BaseAgentExecutionStatus.PENDING);
  assert.equal(state.validationPassed, false);
  console.log("✔ agent input and ephemeral state shapes");
}

function testContextProjection() {
  const lighting = projectContextForAgent("lighting-director");
  assert.ok(lighting.sections.includes("story"));
  assert.ok(lighting.sections.includes("scene"));
  assert.ok(!lighting.sections.includes("composition"));
  console.log("✔ context analyzer — minimal section projection per agent");
}

function testTelemetry() {
  const telemetry = buildAgentTelemetry({
    durationMs: 120,
    knowledgeItemsUsed: 4,
    rulesEvaluated: 8,
    decisionScore: 0.91,
    validationScore: 1,
    retryCount: 0,
    stagesCompleted: [BaseAgentPipelineStage.DECISION_ENGINE],
  });
  assert.equal(telemetry.durationMs, 120);
  assert.equal(telemetry.knowledgeItemsUsed, 4);
  console.log("✔ telemetry layer — duration, knowledge, rules, scores");
}

function testStatelessAndDependencyInjection() {
  assert.equal(validateStatelessDesign().length, 0);
  assert.equal(validateStatelessDesign({ hiddenState: true }).length, 1);
  assert.equal(validateDependencyInjection().length, 0);
  assert.equal(validateDependencyInjection({ selfCreatedDependencies: true }).length, 1);
  console.log("✔ stateless design and dependency injection requirements");
}

async function testKitchenExecution() {
  let bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 42 });
  bp = { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } };
  const report = await executeBaseAgentArchitecture({
    agentId: "visual-story-director",
    blueprint: bp,
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.stagesCompleted.length, 9);
  assert.equal(report.state.status, BaseAgentExecutionStatus.COMPLETED);
  assert.ok(report.result?.mutations.length);
  assert.ok(report.telemetry.durationMs >= 0);
  console.log("✔ kitchen execution — story director completes all 9 pipeline stages");
}

async function testSkipValidationFails() {
  const report = await executeBaseAgentArchitecture({
    agentId: "visual-story-director",
    context: { skipSelfValidation: true },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "MISSING_SELF_VALIDATION"));
  console.log("✔ missing self validation fails base architecture execution");
}

async function testValidateArchitecture() {
  const report = await validateBaseAgentArchitectureWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelineComplete, true);
  assert.equal(report.layersComplete, true);
  assert.equal(report.kitchenExecutionValid, true);
  assert.equal(report.successCriteriaMet, true);
  assertBaseAgentArchitecture();
  console.log("✔ full base agent architecture validation passes");
}

function testLookupHelpers() {
  const stage = getBaseAgentPipelineStage(BaseAgentPipelineStage.RULE_ENGINE)!;
  assert.equal(stage.moduleRef, "constraint-engine");
  const layer = getBaseAgentLayer(BaseAgentArchitectureLayer.TELEMETRY)!;
  assert.equal(layer.order, 9);
  console.log("✔ pipeline stage and layer lookup helpers work");
}

async function testRunBaseAgentArchitecture() {
  const report = await runBaseAgentArchitecture();
  assert.equal(report.valid, true);
  console.log("✔ runBaseAgentArchitecture entry point works");
}

function testFailureCodes() {
  assert.equal(isBaseAgentArchitectureFailure("PROMPT_ONLY_ARCHITECTURE"), true);
  assert.equal(isBaseAgentArchitectureFailure("UNKNOWN"), false);
  console.log("✔ base architecture failure codes are catalogued");
}

async function run() {
  testArchitectureCatalog();
  testGoldenRule();
  testLegacyPromptContrast();
  testPipelineAndLayers();
  testAgentInputAndState();
  testContextProjection();
  testTelemetry();
  testStatelessAndDependencyInjection();
  await testKitchenExecution();
  await testSkipValidationFails();
  await testValidateArchitecture();
  testLookupHelpers();
  await testRunBaseAgentArchitecture();
  testFailureCodes();
  console.log("\nbase-agent-architecture.spec.ts — all passed");
}

run();

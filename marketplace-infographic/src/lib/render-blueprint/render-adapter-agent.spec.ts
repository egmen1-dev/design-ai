/**
 * DESIGN AI v18 — Render Adapter Agent tests (Chapter 7.27)
 */
import assert from "node:assert/strict";
import {
  RENDER_ADAPTER_AGENT_VERSION,
  RENDER_ADAPTER_AGENT_GOLDEN_RULE,
  RENDER_ADAPTER_AGENT_MISSION,
  RENDER_ADAPTER_AGENT_MODULES,
  RENDER_ADAPTER_AGENT_PIPELINE,
  RENDER_ADAPTER_AGENT_ID,
  RENDER_ADAPTER_AGENT_CONTRACT_ID,
  RenderAdapterAgentModule,
  translateRenderAdapterBlueprints,
  adaptRenderAdapterForProvider,
  compileRenderAdapterPrompt,
  buildRenderAdapterNegativePrompt,
  optimizeRenderAdapterParameters,
  buildRenderAdapterPayloadSection,
  fromRenderAdapterPayloadSection,
  validateRenderAdapterAgentPayload,
  scoreRenderAdapterProviderMatch,
  hasStrongGardenSprayerRenderPayload,
  buildDefaultFluxProviderProfile,
  buildDefaultRenderAdapterAgentInput,
  buildBatterySprayerRenderAdapterInput,
  mapRenderAdapterAgentModuleToStage,
  executeRenderAdapterAgent,
  executeRenderAdapterAgentWithPipeline,
  validateRenderAdapterAgent,
  validateRenderAdapterAgentWithExecution,
  assertRenderAdapterAgent,
  runRenderAdapterAgent,
  isRenderAdapterAgentFailure,
  getRenderAdapterAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(RENDER_ADAPTER_AGENT_MODULES.length, 7);
  assert.equal(RENDER_ADAPTER_AGENT_VERSION, "7.27.0");
  assert.equal(RENDER_ADAPTER_AGENT_PIPELINE.length, 2);
  assert.equal(RENDER_ADAPTER_AGENT_ID, RENDER_ADAPTER_AGENT_CONTRACT_ID);
  console.log("✔ agent catalog — 7 internal modules, blueprint-to-provider translator");
}

function testGoldenRuleAndMission() {
  assert.ok(RENDER_ADAPTER_AGENT_GOLDEN_RULE.includes("translator"));
  assert.ok(RENDER_ADAPTER_AGENT_MISSION.includes("generator"));
  console.log("✔ golden rule — design-to-prompt translation without changing ideas");
}

function testPipelinePosition() {
  assert.equal(RENDER_ADAPTER_AGENT_PIPELINE[0].from, "render_orchestrator");
  assert.equal(RENDER_ADAPTER_AGENT_PIPELINE[0].to, "render_adapter");
  assert.equal(RENDER_ADAPTER_AGENT_PIPELINE[1].to, "image_provider");
  console.log("✔ pipeline position — after render orchestrator, before image provider");
}

function testRenderAdapterInputContract() {
  const input = buildDefaultRenderAdapterAgentInput();
  assert.ok(input.renderSession.sessionId);
  assert.equal(input.providerProfile.provider, "flux");
  assert.ok(input.storyBlueprint.primaryMessage);
  console.log("✔ render adapter input — render session, blueprints, provider profile");
}

function testBlueprintTranslationAndPrompt() {
  const input = buildBatterySprayerRenderAdapterInput();
  const translation = translateRenderAdapterBlueprints(input);
  const prompt = compileRenderAdapterPrompt(input, translation);
  const negative = buildRenderAdapterNegativePrompt(input.providerProfile, input);
  const params = optimizeRenderAdapterParameters(input);
  const providerMatch = scoreRenderAdapterProviderMatch("flux", input.providerProfile.promptStyle);
  assert.ok(translation.sceneLine.toLowerCase().includes("garden") || translation.sceneLine.toLowerCase().includes("outdoor"));
  assert.ok(prompt.toLowerCase().includes("commercial"));
  assert.ok(negative.includes("no watermark"));
  assert.equal(params.renderParameters.width, 905);
  assert.ok(providerMatch > 0.9);
  console.log("✔ blueprint translation — flux prompt, negative constraints, Wildberries parameters");
}

function testRenderPayloadOutput() {
  const input = buildBatterySprayerRenderAdapterInput();
  const section = buildRenderAdapterPayloadSection(input, {}, 0.93);
  const payload = fromRenderAdapterPayloadSection(section);
  assert.equal(hasStrongGardenSprayerRenderPayload(payload), true);
  assert.equal(validateRenderAdapterAgentPayload(payload, input).length, 0);
  console.log("✔ render payload — garden sprayer final payload for image provider");
}

function testModuleMapping() {
  assert.equal(mapRenderAdapterAgentModuleToStage(RenderAdapterAgentModule.PROMPT_COMPILER), "prompt_compilation");
  const mod = getRenderAdapterAgentModule(RenderAdapterAgentModule.NEGATIVE_PROMPT_BUILDER)!;
  assert.equal(mod.order, 4);
  console.log("✔ internal modules map to render adapter validation stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeRenderAdapterAgent({
    agentInput: buildBatterySprayerRenderAdapterInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, RENDER_ADAPTER_AGENT_ID);
  assert.equal(report.doesNotMakeDesignDecisions, true);
  assert.equal(hasStrongGardenSprayerRenderPayload(report.payload!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer render payload ready for flux provider");
}

async function testRetryOnPromptConflict() {
  const report = await executeRenderAdapterAgent({
    agentInput: buildBatterySprayerRenderAdapterInput(),
    context: { promptConflict: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "prompt_conflict");
  assert.equal(hasStrongGardenSprayerRenderPayload(report.payload!), true);
  console.log("✔ retry logic — prompt compiler recovers from conflicting instructions");
}

async function testRetryOnProviderIncompatible() {
  const report = await executeRenderAdapterAgent({
    agentInput: buildBatterySprayerRenderAdapterInput(),
    context: { providerIncompatible: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "provider_incompatible");
  assert.notEqual(report.payload!.renderParameters.quality, "unsupported_ultra");
  console.log("✔ retry logic — parameter optimizer recovers provider compatibility");
}

async function testRejectContradictoryPrompt() {
  const report = await executeRenderAdapterAgent({
    agentInput: buildBatterySprayerRenderAdapterInput(),
    context: { injectContradictoryPrompt: true, skipRetry: true },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "BLUEPRINT_LOST_IN_TRANSLATION" || v.code === "PROMPT_CONFLICT"));
  console.log("✔ validation — contradictory prompt blocked from clean garden payload");
}

async function testPipelineHandoff() {
  const report = await executeRenderAdapterAgentWithPipeline({
    agentInput: buildBatterySprayerRenderAdapterInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — final render payload for image provider");
}

async function testKpis() {
  const report = await executeRenderAdapterAgent({
    agentInput: buildBatterySprayerRenderAdapterInput(),
  });
  assert.ok(report.kpis.promptAccuracy > 0);
  assert.ok(report.kpis.providerCompatibility > 0);
  assert.ok(report.kpis.confidenceScore > 0);
  console.log("✔ performance metrics — prompt accuracy, provider compatibility KPIs");
}

async function testValidateWithExecution() {
  const report = await validateRenderAdapterAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertRenderAdapterAgent();
  console.log("✔ full render adapter agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runRenderAdapterAgent();
  assert.equal(report.valid, true);
  console.log("✔ runRenderAdapterAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isRenderAdapterAgentFailure("PROMPT_CONFLICT"), true);
  assert.equal(isRenderAdapterAgentFailure("UNKNOWN"), false);
  console.log("✔ render adapter agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testRenderAdapterInputContract();
  testBlueprintTranslationAndPrompt();
  testRenderPayloadOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnPromptConflict();
  await testRetryOnProviderIncompatible();
  await testRejectContradictoryPrompt();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Render Adapter Agent (Ch 7.27) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

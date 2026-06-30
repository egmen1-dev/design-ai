/**
 * DESIGN AI v18 — Render Orchestrator Agent tests (Chapter 7.26)
 */
import assert from "node:assert/strict";
import {
  RENDER_ORCHESTRATOR_AGENT_VERSION,
  RENDER_ORCHESTRATOR_AGENT_GOLDEN_RULE,
  RENDER_ORCHESTRATOR_AGENT_MISSION,
  RENDER_ORCHESTRATOR_AGENT_MODULES,
  RENDER_ORCHESTRATOR_AGENT_PIPELINE,
  RENDER_ORCHESTRATOR_AGENT_ID,
  RENDER_ORCHESTRATOR_AGENT_CONTRACT_ID,
  RenderOrchestratorAgentModule,
  RenderOrchestratorAgentSessionStatus,
  RenderOrchestratorAgentRenderStrategy,
  collectRenderOrchestratorBlueprints,
  resolveRenderOrchestratorDependencies,
  buildRenderOrchestratorPlan,
  scheduleRenderOrchestratorExecution,
  selectRenderOrchestratorProvider,
  buildRenderSessionSection,
  fromRenderSessionSection,
  validateRenderOrchestratorAgentSession,
  scoreRenderProviderCandidate,
  hasReadyGardenSprayerRenderSession,
  buildDefaultRenderOrchestratorAgentInput,
  buildBatterySprayerRenderOrchestratorInput,
  mapRenderOrchestratorModuleToStage,
  executeRenderOrchestratorAgent,
  executeRenderOrchestratorAgentWithPipeline,
  validateRenderOrchestratorAgent,
  validateRenderOrchestratorAgentWithExecution,
  assertRenderOrchestratorAgent,
  runRenderOrchestratorAgent,
  isRenderOrchestratorAgentFailure,
  getRenderOrchestratorAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(RENDER_ORCHESTRATOR_AGENT_MODULES.length, 6);
  assert.equal(RENDER_ORCHESTRATOR_AGENT_VERSION, "7.26.0");
  assert.equal(RENDER_ORCHESTRATOR_AGENT_PIPELINE.length, 2);
  assert.equal(RENDER_ORCHESTRATOR_AGENT_ID, RENDER_ORCHESTRATOR_AGENT_CONTRACT_ID);
  console.log("✔ agent catalog — 6 internal modules, render pipeline coordinator");
}

function testGoldenRuleAndMission() {
  assert.ok(RENDER_ORCHESTRATOR_AGENT_GOLDEN_RULE.includes("faithfully"));
  assert.ok(RENDER_ORCHESTRATOR_AGENT_MISSION.includes("blueprints"));
  console.log("✔ golden rule — faithful blueprint realization, not creative decisions");
}

function testPipelinePosition() {
  assert.equal(RENDER_ORCHESTRATOR_AGENT_PIPELINE[0].from, "final_approval");
  assert.equal(RENDER_ORCHESTRATOR_AGENT_PIPELINE[0].to, "render_orchestrator");
  assert.equal(RENDER_ORCHESTRATOR_AGENT_PIPELINE[1].to, "render_adapter");
  console.log("✔ pipeline position — after final approval, before render adapter");
}

function testRenderOrchestratorInputContract() {
  const input = buildDefaultRenderOrchestratorAgentInput();
  const audit = collectRenderOrchestratorBlueprints(input);
  assert.equal(audit.complete, true);
  assert.equal(input.finalDecision.approved, true);
  assert.equal(input.preferredProvider, "flux");
  console.log("✔ render orchestrator input — approved decision and full blueprint stack");
}

function testRenderPlanning() {
  const input = buildBatterySprayerRenderOrchestratorInput();
  const plan = buildRenderOrchestratorPlan(input);
  const order = scheduleRenderOrchestratorExecution(plan);
  const provider = scoreRenderProviderCandidate("flux", plan.strategy !== RenderOrchestratorAgentRenderStrategy.SINGLE_PASS);
  assert.ok(plan.stages.length >= 6);
  assert.ok(order.some((step) => step.includes("parallel_group")));
  assert.ok(provider > 0.9);
  console.log("✔ render planning — multi-stage plan with parallel scheduling groups");
}

function testRenderSessionOutput() {
  const input = buildBatterySprayerRenderOrchestratorInput();
  const deps = resolveRenderOrchestratorDependencies(input);
  const section = buildRenderSessionSection(input, {}, 0.93);
  const session = fromRenderSessionSection(section);
  assert.equal(deps.valid, true);
  assert.equal(hasReadyGardenSprayerRenderSession(session), true);
  assert.equal(session.status, RenderOrchestratorAgentSessionStatus.READY);
  assert.equal(validateRenderOrchestratorAgentSession(session, input).length, 0);
  console.log("✔ render session — garden sprayer ready session for render adapter");
}

function testModuleMapping() {
  assert.equal(mapRenderOrchestratorModuleToStage(RenderOrchestratorAgentModule.RENDER_PLANNER), "render_planning");
  const mod = getRenderOrchestratorAgentModule(RenderOrchestratorAgentModule.EXECUTION_SCHEDULER)!;
  assert.equal(mod.order, 4);
  console.log("✔ internal modules map to render orchestration stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeRenderOrchestratorAgent({
    agentInput: buildBatterySprayerRenderOrchestratorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, RENDER_ORCHESTRATOR_AGENT_ID);
  assert.equal(report.doesNotMakeDesignDecisions, true);
  assert.equal(hasReadyGardenSprayerRenderSession(report.session!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer render session ready for adapter");
}

async function testRetryOnProviderUnavailable() {
  const report = await executeRenderOrchestratorAgent({
    agentInput: buildBatterySprayerRenderOrchestratorInput(),
    context: { providerUnavailable: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "provider_failover");
  assert.equal(hasReadyGardenSprayerRenderSession(report.session!), true);
  console.log("✔ retry logic — provider failover to backup and recover render session");
}

async function testRetryOnOverlayRenderError() {
  const report = await executeRenderOrchestratorAgent({
    agentInput: buildBatterySprayerRenderOrchestratorInput(),
    context: { overlayRenderError: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "stage_local_retry");
  assert.equal(report.session!.status, RenderOrchestratorAgentSessionStatus.READY);
  console.log("✔ retry logic — local overlay stage retry without full regeneration");
}

async function testBlockedWithoutApproval() {
  const report = await executeRenderOrchestratorAgent({
    agentInput: buildBatterySprayerRenderOrchestratorInput(),
    context: { missingApproval: true, skipRetry: true },
  });
  assert.equal(report.valid, true);
  assert.equal(report.session!.status, RenderOrchestratorAgentSessionStatus.FAILED);
  console.log("✔ pipeline blocked — render cannot start without final approval");
}

async function testPipelineHandoff() {
  const report = await executeRenderOrchestratorAgentWithPipeline({
    agentInput: buildBatterySprayerRenderOrchestratorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — render session for render adapter");
}

async function testKpis() {
  const report = await executeRenderOrchestratorAgent({
    agentInput: buildBatterySprayerRenderOrchestratorInput(),
  });
  assert.ok(report.kpis.renderSuccessRate > 0);
  assert.ok(report.kpis.pipelineReliability > 0);
  assert.ok(report.kpis.averageRenderTime > 0);
  console.log("✔ performance metrics — render success, pipeline reliability, timing KPIs");
}

async function testValidateWithExecution() {
  const report = await validateRenderOrchestratorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertRenderOrchestratorAgent();
  console.log("✔ full render orchestrator agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runRenderOrchestratorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runRenderOrchestratorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isRenderOrchestratorAgentFailure("MISSING_APPROVAL"), true);
  assert.equal(isRenderOrchestratorAgentFailure("UNKNOWN"), false);
  console.log("✔ render orchestrator agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testRenderOrchestratorInputContract();
  testRenderPlanning();
  testRenderSessionOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnProviderUnavailable();
  await testRetryOnOverlayRenderError();
  await testBlockedWithoutApproval();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Render Orchestrator Agent (Ch 7.26) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

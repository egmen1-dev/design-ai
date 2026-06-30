/**
 * DESIGN AI v18 — Render Validator Agent tests (Chapter 7.28)
 */
import assert from "node:assert/strict";
import {
  RENDER_VALIDATOR_AGENT_VERSION,
  RENDER_VALIDATOR_AGENT_GOLDEN_RULE,
  RENDER_VALIDATOR_AGENT_MISSION,
  RENDER_VALIDATOR_AGENT_MODULES,
  RENDER_VALIDATOR_AGENT_PIPELINE,
  RENDER_VALIDATOR_AGENT_ID,
  RENDER_VALIDATOR_AGENT_CONTRACT_ID,
  RenderValidatorAgentModule,
  analyzeRenderedImage,
  scoreLayoutMatch,
  scoreStoryMatch,
  scoreLightingMatch,
  scoreRenderQuality,
  detectRenderArtifacts,
  checkMarketplaceCompliance,
  computeRenderValidationOverallScore,
  buildRenderValidationSection,
  fromRenderValidationSection,
  validateRenderValidatorAgentReport,
  scoreRenderValidationCandidate,
  hasApprovedGardenSprayerRender,
  buildGardenSprayerRenderedImage,
  buildDefaultRenderValidatorAgentInput,
  buildBatterySprayerRenderValidatorInput,
  mapRenderValidatorModuleToStage,
  executeRenderValidatorAgent,
  executeRenderValidatorAgentWithPipeline,
  validateRenderValidatorAgent,
  validateRenderValidatorAgentWithExecution,
  assertRenderValidatorAgent,
  runRenderValidatorAgent,
  isRenderValidatorAgentFailure,
  getRenderValidatorAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(RENDER_VALIDATOR_AGENT_MODULES.length, 7);
  assert.equal(RENDER_VALIDATOR_AGENT_VERSION, "7.28.0");
  assert.equal(RENDER_VALIDATOR_AGENT_PIPELINE.length, 2);
  assert.equal(RENDER_VALIDATOR_AGENT_ID, RENDER_VALIDATOR_AGENT_CONTRACT_ID);
  console.log("✔ agent catalog — 7 internal modules, final render quality gate");
}

function testGoldenRuleAndMission() {
  assert.ok(RENDER_VALIDATOR_AGENT_GOLDEN_RULE.includes("approved intent"));
  assert.ok(RENDER_VALIDATOR_AGENT_MISSION.includes("generated image"));
  console.log("✔ golden rule — blueprint-to-render fidelity, not new design decisions");
}

function testPipelinePosition() {
  assert.equal(RENDER_VALIDATOR_AGENT_PIPELINE[0].from, "image_provider");
  assert.equal(RENDER_VALIDATOR_AGENT_PIPELINE[0].to, "render_validator");
  assert.equal(RENDER_VALIDATOR_AGENT_PIPELINE[1].to, "delivery_engine");
  console.log("✔ pipeline position — after image provider, before delivery engine");
}

function testRenderValidatorInputContract() {
  const input = buildDefaultRenderValidatorAgentInput();
  assert.equal(input.renderedImage.width, 905);
  assert.equal(input.finalDecision.approved, true);
  assert.ok(input.storyBlueprint.primaryMessage);
  console.log("✔ render validator input — rendered image, blueprints, final decision");
}

function testValidationScoring() {
  const input = buildBatterySprayerRenderValidatorInput();
  const analysis = analyzeRenderedImage(input.renderedImage);
  const layout = scoreLayoutMatch(input, analysis);
  const story = scoreStoryMatch(input, analysis);
  const lighting = scoreLightingMatch(input, analysis);
  const quality = scoreRenderQuality(input.renderedImage);
  const overall = computeRenderValidationOverallScore({ layoutMatch: layout, storyMatch: story, lightingMatch: lighting, qualityScore: quality });
  const candidate = scoreRenderValidationCandidate(layout, quality);
  assert.ok(layout >= 85);
  assert.ok(overall >= 88);
  assert.ok(candidate > 0.9);
  console.log("✔ validation scoring — layout, story, lighting, quality, overall");
}

function testRenderValidationReportOutput() {
  const input = buildBatterySprayerRenderValidatorInput();
  const section = buildRenderValidationSection(input, {}, 0.93);
  const report = fromRenderValidationSection(section);
  assert.equal(hasApprovedGardenSprayerRender(report), true);
  assert.equal(report.renderProblems.length, 0);
  assert.equal(validateRenderValidatorAgentReport(report).length, 0);
  console.log("✔ render validation report — garden sprayer render approved for delivery");
}

function testArtifactAndComplianceDetection() {
  const input = buildBatterySprayerRenderValidatorInput();
  const artifacts = detectRenderArtifacts(input.renderedImage, { injectArtifact: true });
  const compliance = checkMarketplaceCompliance(input, input.renderedImage, { marketplaceComplianceFailure: true });
  assert.equal(artifacts.some((p) => p.category === "artifact"), true);
  assert.equal(compliance.some((p) => p.category === "marketplace"), true);
  console.log("✔ artifact and compliance detection — AI artifacts and marketplace issues");
}

function testModuleMapping() {
  assert.equal(mapRenderValidatorModuleToStage(RenderValidatorAgentModule.BLUEPRINT_COMPARATOR), "blueprint_comparison");
  const mod = getRenderValidatorAgentModule(RenderValidatorAgentModule.ARTIFACT_DETECTOR)!;
  assert.equal(mod.order, 4);
  console.log("✔ internal modules map to render validation stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeRenderValidatorAgent({
    agentInput: buildBatterySprayerRenderValidatorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, RENDER_VALIDATOR_AGENT_ID);
  assert.equal(report.doesNotCreateImages, true);
  assert.equal(hasApprovedGardenSprayerRender(report.report!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer render passes validation");
}

async function testRetryOnHeroRatioMismatch() {
  const report = await executeRenderValidatorAgent({
    agentInput: buildBatterySprayerRenderValidatorInput(),
    context: { heroRatioMismatch: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "overlay_retry");
  assert.equal(hasApprovedGardenSprayerRender(report.report!), true);
  console.log("✔ retry logic — overlay retry recovers hero product layout match");
}

async function testRetryOnInjectArtifact() {
  const report = await executeRenderValidatorAgent({
    agentInput: buildBatterySprayerRenderValidatorInput(),
    context: { injectArtifact: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "full_render_retry");
  assert.equal(hasApprovedGardenSprayerRender(report.report!), true);
  console.log("✔ retry logic — full render retry clears critical artifacts");
}

async function testRejectArtifactWithoutRetry() {
  const report = await executeRenderValidatorAgent({
    agentInput: buildBatterySprayerRenderValidatorInput(),
    context: { injectArtifact: true, skipRetry: true },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "FALSE_APPROVAL" || v.code === "ARTIFACT_MISSED"));
  console.log("✔ validation — critical artifacts block approval without retry");
}

async function testPipelineHandoff() {
  const report = await executeRenderValidatorAgentWithPipeline({
    agentInput: buildBatterySprayerRenderValidatorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — approved render validation for delivery engine");
}

async function testKpis() {
  const report = await executeRenderValidatorAgent({
    agentInput: buildBatterySprayerRenderValidatorInput(),
  });
  assert.ok(report.kpis.validationAccuracy > 0);
  assert.ok(report.kpis.blueprintMatchAccuracy > 0);
  assert.ok(report.kpis.confidenceScore > 0);
  console.log("✔ performance metrics — validation accuracy, blueprint match, confidence KPIs");
}

async function testValidateWithExecution() {
  const report = await validateRenderValidatorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertRenderValidatorAgent();
  console.log("✔ full render validator agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runRenderValidatorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runRenderValidatorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isRenderValidatorAgentFailure("FALSE_APPROVAL"), true);
  assert.equal(isRenderValidatorAgentFailure("UNKNOWN"), false);
  console.log("✔ render validator agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testRenderValidatorInputContract();
  testValidationScoring();
  testRenderValidationReportOutput();
  testArtifactAndComplianceDetection();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnHeroRatioMismatch();
  await testRetryOnInjectArtifact();
  await testRejectArtifactWithoutRetry();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Render Validator Agent (Ch 7.28) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * DESIGN AI v18 — Commercial Critic Agent tests (Chapter 7.22)
 */
import assert from "node:assert/strict";
import {
  COMMERCIAL_CRITIC_AGENT_VERSION,
  COMMERCIAL_CRITIC_AGENT_GOLDEN_RULE,
  COMMERCIAL_CRITIC_AGENT_MISSION,
  COMMERCIAL_CRITIC_AGENT_MODULES,
  COMMERCIAL_CRITIC_AGENT_PIPELINE,
  COMMERCIAL_CRITIC_AGENT_ID,
  COMMERCIAL_CRITIC_ID,
  CommercialCriticAgentModule,
  predictCommercialCtr,
  scoreCommercialSellingPower,
  scoreCommercialTrust,
  scoreCommercialEmotion,
  scoreCommercialClarity,
  computeOverallCommercialScore,
  buildCommercialSection,
  fromCommercialSection,
  validateCommercialCriticAgentReport,
  scoreCommercialCandidateForUsp,
  hasStrongGardenSprayerCommercial,
  buildDefaultCommercialCriticAgentInput,
  buildBatterySprayerCommercialCriticInput,
  mapCommercialCriticModuleToStage,
  executeCommercialCriticAgent,
  executeCommercialCriticAgentWithPipeline,
  validateCommercialCriticAgent,
  validateCommercialCriticAgentWithExecution,
  assertCommercialCriticAgent,
  runCommercialCriticAgent,
  isCommercialCriticAgentFailure,
  getCommercialCriticAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(COMMERCIAL_CRITIC_AGENT_MODULES.length, 7);
  assert.equal(COMMERCIAL_CRITIC_AGENT_VERSION, "7.22.0");
  assert.equal(COMMERCIAL_CRITIC_AGENT_PIPELINE.length, 2);
  assert.equal(COMMERCIAL_CRITIC_AGENT_ID, COMMERCIAL_CRITIC_ID);
  console.log("✔ agent catalog — 7 internal modules, commercial effectiveness critic");
}

function testGoldenRuleAndMission() {
  assert.ok(COMMERCIAL_CRITIC_AGENT_GOLDEN_RULE.includes("scroll past"));
  assert.ok(COMMERCIAL_CRITIC_AGENT_MISSION.includes("sell the product"));
  console.log("✔ golden rule — buyer scroll-stop moment, not design aesthetics");
}

function testPipelinePosition() {
  assert.equal(COMMERCIAL_CRITIC_AGENT_PIPELINE[0].from, "vision_critic");
  assert.equal(COMMERCIAL_CRITIC_AGENT_PIPELINE[0].to, "commercial_critic");
  assert.equal(COMMERCIAL_CRITIC_AGENT_PIPELINE[1].to, "senior_art_director");
  console.log("✔ pipeline position — after vision critic, before senior art director");
}

function testCommercialCriticInputContract() {
  const input = buildDefaultCommercialCriticAgentInput();
  assert.ok(input.productProfile.category);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.visionReport.overallScore >= 85);
  assert.ok(input.marketplaceBlueprint.overlayStrategy);
  console.log("✔ commercial critic input — product, business, blueprints, vision report");
}

function testCommercialScoring() {
  const input = buildBatterySprayerCommercialCriticInput();
  const ctr = predictCommercialCtr(input);
  const selling = scoreCommercialSellingPower(input);
  const trust = scoreCommercialTrust(input);
  const emotion = scoreCommercialEmotion(input);
  const clarity = scoreCommercialClarity(input);
  const overall = computeOverallCommercialScore({ ctrPrediction: ctr, sellingPower: selling, trustScore: trust, clarityScore: clarity, emotionScore: emotion });
  assert.ok(ctr >= 0.75);
  assert.ok(selling >= 85);
  assert.ok(overall >= 85);
  const score = scoreCommercialCandidateForUsp("Main Benefit", input.businessModel.primaryValue);
  assert.ok(score > 0.9);
  console.log("✔ commercial scoring — CTR, selling power, trust, emotion, clarity");
}

function testCommercialReportOutput() {
  const input = buildBatterySprayerCommercialCriticInput();
  const section = buildCommercialSection(input, {}, 0.93);
  const report = fromCommercialSection(section);
  assert.equal(hasStrongGardenSprayerCommercial(report), true);
  assert.ok(report.recommendations.length >= 1);
  assert.equal(validateCommercialCriticAgentReport(report, section).length, 0);
  console.log("✔ commercial report — strong garden sprayer Wildberries commercial audit");
}

function testModuleMapping() {
  assert.equal(mapCommercialCriticModuleToStage(CommercialCriticAgentModule.CTR_PREDICTOR), "ctr_prediction");
  const mod = getCommercialCriticAgentModule(CommercialCriticAgentModule.EMOTION_ANALYZER)!;
  assert.equal(mod.order, 4);
  console.log("✔ internal modules map to commercial validation stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeCommercialCriticAgent({
    agentInput: buildBatterySprayerCommercialCriticInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, COMMERCIAL_CRITIC_ID);
  assert.equal(report.doesNotFixErrors, true);
  assert.equal(hasStrongGardenSprayerCommercial(report.report!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer passes commercial critic audit");
}

async function testRetryOnLowCtrPrediction() {
  const report = await executeCommercialCriticAgent({
    agentInput: buildBatterySprayerCommercialCriticInput(),
    context: { lowCtrPrediction: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "ctr_selling_trust_emotion");
  assert.equal(hasStrongGardenSprayerCommercial(report.report!), true);
  console.log("✔ retry logic — CTR predictor, selling power, trust, emotion modules");
}

async function testRetryOnWeakSellingPower() {
  const report = await executeCommercialCriticAgent({
    agentInput: buildBatterySprayerCommercialCriticInput(),
    context: { weakSellingPower: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.report!.sellingPower >= 80);
  console.log("✔ retry logic — recovers selling power after commercial critique retry");
}

async function testPipelineHandoff() {
  const report = await executeCommercialCriticAgentWithPipeline({
    agentInput: buildBatterySprayerCommercialCriticInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — commercial report for senior art director");
}

async function testKpis() {
  const report = await executeCommercialCriticAgent({
    agentInput: buildBatterySprayerCommercialCriticInput(),
  });
  assert.ok(report.kpis.ctrPredictionAccuracy > 0);
  assert.ok(report.kpis.sellingPowerAccuracy > 0);
  assert.ok(report.kpis.recommendationQuality > 0);
  console.log("✔ performance metrics — CTR, selling power, recommendation KPIs");
}

async function testValidateWithExecution() {
  const report = await validateCommercialCriticAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertCommercialCriticAgent();
  console.log("✔ full commercial critic agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runCommercialCriticAgent();
  assert.equal(report.valid, true);
  console.log("✔ runCommercialCriticAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isCommercialCriticAgentFailure("LOW_CTR_PREDICTION"), true);
  assert.equal(isCommercialCriticAgentFailure("UNKNOWN"), false);
  console.log("✔ commercial critic agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testCommercialCriticInputContract();
  testCommercialScoring();
  testCommercialReportOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnLowCtrPrediction();
  await testRetryOnWeakSellingPower();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Commercial Critic Agent (Ch 7.22) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

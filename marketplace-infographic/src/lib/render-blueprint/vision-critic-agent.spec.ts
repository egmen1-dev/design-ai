/**
 * DESIGN AI v18 — Vision Critic Agent tests (Chapter 7.21)
 */
import assert from "node:assert/strict";
import {
  VISION_CRITIC_AGENT_VERSION,
  VISION_CRITIC_AGENT_GOLDEN_RULE,
  VISION_CRITIC_AGENT_MISSION,
  VISION_CRITIC_AGENT_MODULES,
  VISION_CRITIC_AGENT_PIPELINE,
  VISION_CRITIC_AGENT_ID,
  VISION_CRITIC_ID,
  VisionCriticAgentModule,
  scoreComposition,
  scoreHierarchy,
  scoreBalance,
  scoreReadability,
  scoreVisionClarity,
  computeOverallVisionScore,
  buildVisionSection,
  fromVisionSection,
  validateVisionCriticAgentReport,
  scoreVisionCandidateForHierarchy,
  hasProfessionalGardenSprayerVision,
  buildDefaultVisionCriticAgentInput,
  buildBatterySprayerVisionCriticInput,
  mapVisionCriticModuleToStage,
  executeVisionCriticAgent,
  executeVisionCriticAgentWithPipeline,
  validateVisionCriticAgent,
  validateVisionCriticAgentWithExecution,
  assertVisionCriticAgent,
  runVisionCriticAgent,
  isVisionCriticAgentFailure,
  getVisionCriticAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(VISION_CRITIC_AGENT_MODULES.length, 7);
  assert.equal(VISION_CRITIC_AGENT_VERSION, "7.21.0");
  assert.equal(VISION_CRITIC_AGENT_PIPELINE.length, 2);
  assert.equal(VISION_CRITIC_AGENT_ID, VISION_CRITIC_ID);
  console.log("✔ agent catalog — 7 internal modules, independent vision critic");
}

function testGoldenRuleAndMission() {
  assert.ok(VISION_CRITIC_AGENT_GOLDEN_RULE.includes("first time"));
  assert.ok(VISION_CRITIC_AGENT_MISSION.includes("professionally perceived"));
  console.log("✔ golden rule — judges visual result only, never modifies blueprints");
}

function testPipelinePosition() {
  assert.equal(VISION_CRITIC_AGENT_PIPELINE[0].from, "anti_pattern_director");
  assert.equal(VISION_CRITIC_AGENT_PIPELINE[0].to, "vision_critic");
  assert.equal(VISION_CRITIC_AGENT_PIPELINE[1].to, "commercial_critic");
  console.log("✔ pipeline position — after anti-pattern director, before commercial critic");
}

function testVisionCriticInputContract() {
  const input = buildDefaultVisionCriticAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.antiPatternReport.confidence > 0);
  assert.ok(input.patternBlueprint.selectedPatterns.length >= 3);
  assert.ok(input.typographyBlueprint.fontFamily);
  assert.ok(input.materialBlueprint.materials.length >= 1);
  console.log("✔ vision critic input — full blueprint stack plus anti-pattern report");
}

function testVisionScoring() {
  const input = buildBatterySprayerVisionCriticInput();
  const composition = scoreComposition(input);
  const hierarchy = scoreHierarchy(input);
  const balance = scoreBalance(input);
  const readability = scoreReadability(input);
  const clarity = scoreVisionClarity(input);
  const overall = computeOverallVisionScore({ compositionScore: composition, hierarchyScore: hierarchy, balanceScore: balance, readabilityScore: readability, clarityScore: clarity });
  assert.ok(composition >= 85);
  assert.ok(hierarchy >= 85);
  assert.ok(overall >= 88);
  const score = scoreVisionCandidateForHierarchy("Hero Product", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ vision scoring — composition, hierarchy, balance, readability, clarity");
}

function testVisionReportOutput() {
  const input = buildBatterySprayerVisionCriticInput();
  const section = buildVisionSection(input, {}, 0.93);
  const report = fromVisionSection(section);
  assert.equal(hasProfessionalGardenSprayerVision(report), true);
  assert.ok(report.recommendations.length >= 1);
  assert.equal(validateVisionCriticAgentReport(report, section).length, 0);
  console.log("✔ vision report — professional garden sprayer vision audit");
}

function testModuleMapping() {
  assert.equal(mapVisionCriticModuleToStage(VisionCriticAgentModule.READABILITY_INSPECTOR), "readability_inspection");
  const mod = getVisionCriticAgentModule(VisionCriticAgentModule.COMPOSITION_INSPECTOR)!;
  assert.equal(mod.order, 1);
  console.log("✔ internal modules map to vision inspection stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeVisionCriticAgent({
    agentInput: buildBatterySprayerVisionCriticInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, VISION_CRITIC_ID);
  assert.equal(report.blueprintUnmodified, true);
  assert.equal(hasProfessionalGardenSprayerVision(report.report!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer passes vision critic audit");
}

async function testRetryOnLowVisionScore() {
  const report = await executeVisionCriticAgent({
    agentInput: buildBatterySprayerVisionCriticInput(),
    context: { lowOverallVisionScore: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "inspection_scoring_validation");
  assert.equal(hasProfessionalGardenSprayerVision(report.report!), true);
  console.log("✔ retry logic — composition, hierarchy, scoring, and validation inspectors");
}

async function testRetryOnPoorHeroReadability() {
  const report = await executeVisionCriticAgent({
    agentInput: buildBatterySprayerVisionCriticInput(),
    context: { poorHeroReadability: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.report!.compositionScore >= 85);
  console.log("✔ retry logic — recovers hero readability after inspection retry");
}

async function testPipelineHandoff() {
  const report = await executeVisionCriticAgentWithPipeline({
    agentInput: buildBatterySprayerVisionCriticInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — vision report for commercial critic");
}

async function testKpis() {
  const report = await executeVisionCriticAgent({
    agentInput: buildBatterySprayerVisionCriticInput(),
  });
  assert.ok(report.kpis.visionAccuracy > 0);
  assert.ok(report.kpis.recommendationQuality > 0);
  assert.ok(report.kpis.constitutionCompliance > 0);
  console.log("✔ performance metrics — accuracy, recommendations, constitution KPIs");
}

async function testValidateWithExecution() {
  const report = await validateVisionCriticAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertVisionCriticAgent();
  console.log("✔ full vision critic agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runVisionCriticAgent();
  assert.equal(report.valid, true);
  console.log("✔ runVisionCriticAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isVisionCriticAgentFailure("VISION_SCORE_TOO_LOW"), true);
  assert.equal(isVisionCriticAgentFailure("UNKNOWN"), false);
  console.log("✔ vision critic agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testVisionCriticInputContract();
  testVisionScoring();
  testVisionReportOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnLowVisionScore();
  await testRetryOnPoorHeroReadability();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Vision Critic Agent (Ch 7.21) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

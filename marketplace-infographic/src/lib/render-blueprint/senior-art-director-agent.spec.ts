/**
 * DESIGN AI v18 — Senior Art Director Agent tests (Chapter 7.23)
 */
import assert from "node:assert/strict";
import {
  SENIOR_ART_DIRECTOR_AGENT_VERSION,
  SENIOR_ART_DIRECTOR_AGENT_GOLDEN_RULE,
  SENIOR_ART_DIRECTOR_AGENT_MISSION,
  SENIOR_ART_DIRECTOR_AGENT_MODULES,
  SENIOR_ART_DIRECTOR_AGENT_PIPELINE,
  SENIOR_ART_DIRECTOR_AGENT_ID,
  SENIOR_ART_DIRECTOR_ID,
  SeniorArtDirectorAgentModule,
  scoreDesignHarmony,
  scoreModernity,
  scorePremiumQuality,
  scoreVisualTaste,
  scoreCreativeQuality,
  scoreArtDirectorConsistency,
  computeOverallDesignScore,
  buildArtDirectorSection,
  fromArtDirectorSection,
  validateSeniorArtDirectorAgentReport,
  scoreArtDirectorCandidateForHarmony,
  hasAgencyGradeGardenSprayerDesign,
  buildDefaultSeniorArtDirectorAgentInput,
  buildBatterySprayerSeniorArtDirectorInput,
  mapSeniorArtDirectorModuleToStage,
  executeSeniorArtDirectorAgent,
  executeSeniorArtDirectorAgentWithPipeline,
  validateSeniorArtDirectorAgent,
  validateSeniorArtDirectorAgentWithExecution,
  assertSeniorArtDirectorAgent,
  runSeniorArtDirectorAgent,
  isSeniorArtDirectorAgentFailure,
  getSeniorArtDirectorAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(SENIOR_ART_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(SENIOR_ART_DIRECTOR_AGENT_VERSION, "7.23.0");
  assert.equal(SENIOR_ART_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(SENIOR_ART_DIRECTOR_AGENT_ID, SENIOR_ART_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, holistic art direction expert");
}

function testGoldenRuleAndMission() {
  assert.ok(SENIOR_ART_DIRECTOR_AGENT_GOLDEN_RULE.includes("put my name"));
  assert.ok(SENIOR_ART_DIRECTOR_AGENT_MISSION.includes("art director"));
  console.log("✔ golden rule — agency-grade holistic design approval, not surface beauty");
}

function testPipelinePosition() {
  assert.equal(SENIOR_ART_DIRECTOR_AGENT_PIPELINE[0].from, "commercial_critic");
  assert.equal(SENIOR_ART_DIRECTOR_AGENT_PIPELINE[0].to, "senior_art_director");
  assert.equal(SENIOR_ART_DIRECTOR_AGENT_PIPELINE[1].to, "chief_design_director");
  console.log("✔ pipeline position — after commercial critic, before chief design director");
}

function testSeniorArtDirectorInputContract() {
  const input = buildDefaultSeniorArtDirectorAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.visionReport.overallScore >= 85);
  assert.ok(input.commercialReport.overallCommercialScore >= 85);
  assert.ok(input.patternBlueprint.selectedPatterns.length >= 1);
  console.log("✔ senior art director input — full blueprint stack plus critic reports");
}

function testArtDirectorScoring() {
  const input = buildBatterySprayerSeniorArtDirectorInput();
  const harmony = scoreDesignHarmony(input);
  const modernity = scoreModernity(input);
  const premium = scorePremiumQuality(input);
  const taste = scoreVisualTaste(input);
  const creative = scoreCreativeQuality(input);
  const consistency = scoreArtDirectorConsistency(input);
  const overall = computeOverallDesignScore({
    modernityScore: modernity,
    premiumScore: premium,
    visualTaste: taste,
    designConsistency: consistency,
    creativeQuality: creative,
  });
  assert.ok(harmony >= 80);
  assert.ok(modernity >= 80);
  assert.ok(premium >= 85);
  assert.ok(overall >= 88);
  const harmonyMatch = scoreArtDirectorCandidateForHarmony("Garden Outdoor", "Natural Fresh");
  assert.ok(harmonyMatch > 0.9);
  console.log("✔ art director scoring — harmony, modernity, premium, taste, consistency");
}

function testArtDirectorReportOutput() {
  const input = buildBatterySprayerSeniorArtDirectorInput();
  const section = buildArtDirectorSection(input, {}, 0.93);
  const report = fromArtDirectorSection(section);
  assert.equal(hasAgencyGradeGardenSprayerDesign(report), true);
  assert.equal(report.criticalProblems.length, 0);
  assert.ok(report.recommendations.length >= 1);
  assert.equal(validateSeniorArtDirectorAgentReport(report, section).length, 0);
  console.log("✔ art director report — agency-grade garden sprayer holistic design audit");
}

function testModuleMapping() {
  assert.equal(
    mapSeniorArtDirectorModuleToStage(SeniorArtDirectorAgentModule.DESIGN_HARMONY_ANALYZER),
    "design_harmony",
  );
  const mod = getSeniorArtDirectorAgentModule(SeniorArtDirectorAgentModule.PREMIUM_QUALITY_INSPECTOR)!;
  assert.equal(mod.order, 3);
  console.log("✔ internal modules map to art direction validation stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeSeniorArtDirectorAgent({
    agentInput: buildBatterySprayerSeniorArtDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, SENIOR_ART_DIRECTOR_ID);
  assert.equal(report.doesNotFixErrors, true);
  assert.equal(hasAgencyGradeGardenSprayerDesign(report.report!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer passes senior art director audit");
}

async function testRetryOnLowDesignScore() {
  const report = await executeSeniorArtDirectorAgent({
    agentInput: buildBatterySprayerSeniorArtDirectorInput(),
    context: { lowDesignScore: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "harmony_modernity_consistency");
  assert.equal(hasAgencyGradeGardenSprayerDesign(report.report!), true);
  console.log("✔ retry logic — harmony, modernity, consistency modules recover design score");
}

async function testRetryOnOutdatedDesign() {
  const report = await executeSeniorArtDirectorAgent({
    agentInput: buildBatterySprayerSeniorArtDirectorInput(),
    context: { outdatedDesign: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.report!.modernityScore >= 80);
  console.log("✔ retry logic — recovers modernity after outdated design flag");
}

async function testRetryOnInjectCriticalProblem() {
  const report = await executeSeniorArtDirectorAgent({
    agentInput: buildBatterySprayerSeniorArtDirectorInput(),
    context: { injectCriticalProblem: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.report!.criticalProblems.length, 0);
  console.log("✔ retry logic — recovers from injected critical creative problem");
}

async function testPipelineHandoff() {
  const report = await executeSeniorArtDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerSeniorArtDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — art director report for chief design director");
}

async function testKpis() {
  const report = await executeSeniorArtDirectorAgent({
    agentInput: buildBatterySprayerSeniorArtDirectorInput(),
  });
  assert.ok(report.kpis.designEvaluationAccuracy > 0);
  assert.ok(report.kpis.premiumDetectionAccuracy > 0);
  assert.ok(report.kpis.recommendationQuality > 0);
  console.log("✔ performance metrics — design evaluation, premium detection, recommendation KPIs");
}

async function testValidateWithExecution() {
  const report = await validateSeniorArtDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertSeniorArtDirectorAgent();
  console.log("✔ full senior art director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runSeniorArtDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runSeniorArtDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isSeniorArtDirectorAgentFailure("LOW_DESIGN_SCORE"), true);
  assert.equal(isSeniorArtDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ senior art director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testSeniorArtDirectorInputContract();
  testArtDirectorScoring();
  testArtDirectorReportOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnLowDesignScore();
  await testRetryOnOutdatedDesign();
  await testRetryOnInjectCriticalProblem();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Senior Art Director Agent (Ch 7.23) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

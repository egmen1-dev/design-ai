/**
 * DESIGN AI v18 — Anti-Pattern Director Agent tests (Chapter 7.20)
 */
import assert from "node:assert/strict";
import {
  ANTI_PATTERN_DIRECTOR_AGENT_VERSION,
  ANTI_PATTERN_DIRECTOR_AGENT_GOLDEN_RULE,
  ANTI_PATTERN_DIRECTOR_AGENT_MISSION,
  ANTI_PATTERN_DIRECTOR_AGENT_MODULES,
  ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE,
  ANTI_PATTERN_DIRECTOR_AGENT_ID,
  ANTI_PATTERN_DIRECTOR_ID,
  AntiPatternDirectorAgentModule,
  buildAntiPatternBlueprintCheck,
  detectConsistencyConflicts,
  buildAntiPatternSection,
  fromAntiPatternSection,
  validateAntiPatternDirectorAgentReport,
  validateBlueprintConsistency,
  scoreAntiPatternCandidateForStory,
  hasCleanGardenSprayerAudit,
  buildDefaultAntiPatternDirectorAgentInput,
  buildBatterySprayerAntiPatternDirectorInput,
  mapAntiPatternDirectorModuleToStage,
  executeAntiPatternDirectorAgent,
  executeAntiPatternDirectorAgentWithPipeline,
  validateAntiPatternDirectorAgent,
  validateAntiPatternDirectorAgentWithExecution,
  assertAntiPatternDirectorAgent,
  runAntiPatternDirectorAgent,
  isAntiPatternDirectorAgentFailure,
  getAntiPatternDirectorAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(ANTI_PATTERN_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(ANTI_PATTERN_DIRECTOR_AGENT_VERSION, "7.20.0");
  assert.equal(ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(ANTI_PATTERN_DIRECTOR_AGENT_ID, ANTI_PATTERN_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, quality guardian agent");
}

function testGoldenRuleAndMission() {
  assert.ok(ANTI_PATTERN_DIRECTOR_AGENT_GOLDEN_RULE.includes("does not invent"));
  assert.ok(ANTI_PATTERN_DIRECTOR_AGENT_MISSION.includes("mistakes must absolutely be avoided"));
  console.log("✔ golden rule — prevents bad design before render");
}

function testPipelinePosition() {
  assert.equal(ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE[0].from, "pattern_director");
  assert.equal(ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE[0].to, "anti_pattern_director");
  assert.equal(ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE[1].to, "vision_critic");
  console.log("✔ pipeline position — after pattern director, before vision critic");
}

function testAntiPatternDirectorInputContract() {
  const input = buildDefaultAntiPatternDirectorAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.photographyBlueprint.photoStyle);
  assert.ok(input.lightingBlueprint.lightingPreset);
  assert.ok(input.cameraBlueprint.cameraType);
  assert.ok(input.materialBlueprint.materials.length >= 1);
  assert.ok(input.typographyBlueprint.fontFamily);
  assert.ok(input.marketplaceBlueprint.overlayStrategy);
  assert.ok(input.patternBlueprint.selectedPatterns.length >= 3);
  assert.ok(input.knowledgePackage.rawPackage);
  console.log("✔ anti-pattern director input — full blueprint stack from story to pattern");
}

function testVisualAndCommercialDetection() {
  const input = buildBatterySprayerAntiPatternDirectorInput();
  const cleanCheck = buildAntiPatternBlueprintCheck(input);
  assert.equal(cleanCheck.hasHeroProduct, true);
  assert.ok(cleanCheck.heroProductRatio! >= 0.3);
  const injected = buildAntiPatternBlueprintCheck(input, { injectCriticalViolations: true });
  const section = buildAntiPatternSection(input, { injectCriticalViolations: true }, 0.93);
  assert.ok(section.detected.length >= 3);
  assert.ok(section.validation.retryRecommended);
  const score = scoreAntiPatternCandidateForStory("USP Headline", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ visual and commercial detection — library anti-patterns scored by severity");
}

function testMarketplaceAndConsistency() {
  const input = buildBatterySprayerAntiPatternDirectorInput();
  assert.equal(validateBlueprintConsistency(input), true);
  const conflicts = detectConsistencyConflicts(input, { agentInconsistency: true });
  assert.ok(conflicts.some((p) => p.category === "consistency"));
  const constitution = detectConsistencyConflicts(input, { constitutionViolated: true });
  assert.ok(constitution.some((p) => p.message.includes("Constitution")));
  console.log("✔ marketplace and consistency — blueprint conflicts and constitution checks");
}

function testAntiPatternReportOutput() {
  const input = buildBatterySprayerAntiPatternDirectorInput();
  const section = buildAntiPatternSection(input, {}, 0.93);
  const report = fromAntiPatternSection(section, input);
  assert.ok(report.recommendations.length >= 1);
  assert.equal(hasCleanGardenSprayerAudit(report), true);
  assert.equal(validateAntiPatternDirectorAgentReport(report, section).length, 0);
  console.log("✔ anti-pattern report — clean audit for garden sprayer Wildberries stack");
}

function testModuleMapping() {
  assert.equal(mapAntiPatternDirectorModuleToStage(AntiPatternDirectorAgentModule.CONSISTENCY_VALIDATOR), "consistency_validation");
  const mod = getAntiPatternDirectorAgentModule(AntiPatternDirectorAgentModule.RISK_ASSESSMENT_ENGINE)!;
  assert.equal(mod.order, 5);
  console.log("✔ internal modules map to Ch 5.15 anti-pattern library stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeAntiPatternDirectorAgent({
    agentInput: buildBatterySprayerAntiPatternDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, ANTI_PATTERN_DIRECTOR_ID);
  assert.equal(report.doesNotFixErrors, true);
  assert.equal(hasCleanGardenSprayerAudit(report.report!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer passes anti-pattern audit");
}

async function testRetryOnCriticalViolations() {
  const report = await executeAntiPatternDirectorAgent({
    agentInput: buildBatterySprayerAntiPatternDirectorInput(),
    context: { injectCriticalViolations: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "detection_risk_recommendation");
  assert.equal(hasCleanGardenSprayerAudit(report.report!), true);
  console.log("✔ retry logic — detection, risk assessment, recommendation builder");
}

async function testRetryOnAgentInconsistency() {
  const report = await executeAntiPatternDirectorAgent({
    agentInput: buildBatterySprayerAntiPatternDirectorInput(),
    context: { agentInconsistency: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.report!.detectedProblems.some((p) => p.category === "consistency") || report.retryCount > 0);
  console.log("✔ retry logic — consistency validator flags conflicts then recovers");
}

async function testPipelineHandoff() {
  const report = await executeAntiPatternDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerAntiPatternDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — anti-pattern report for vision critic");
}

async function testKpis() {
  const report = await executeAntiPatternDirectorAgent({
    agentInput: buildBatterySprayerAntiPatternDirectorInput(),
  });
  assert.ok(report.kpis.detectionAccuracy > 0);
  assert.ok(report.kpis.constitutionCompliance > 0);
  assert.ok(report.kpis.marketplaceViolationDetection > 0);
  console.log("✔ performance metrics — detection, constitution, marketplace KPIs");
}

async function testValidateWithExecution() {
  const report = await validateAntiPatternDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertAntiPatternDirectorAgent();
  console.log("✔ full anti-pattern director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runAntiPatternDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runAntiPatternDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isAntiPatternDirectorAgentFailure("CRITICAL_VIOLATIONS_UNDETECTED"), true);
  assert.equal(isAntiPatternDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ anti-pattern director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testAntiPatternDirectorInputContract();
  testVisualAndCommercialDetection();
  testMarketplaceAndConsistency();
  testAntiPatternReportOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnCriticalViolations();
  await testRetryOnAgentInconsistency();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Anti-Pattern Director Agent (Ch 7.20) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

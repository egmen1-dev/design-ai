/**
 * DESIGN AI v18 — Learning Agent tests (Chapter 7.25)
 */
import assert from "node:assert/strict";
import {
  LEARNING_AGENT_VERSION,
  LEARNING_AGENT_GOLDEN_RULE,
  LEARNING_AGENT_MISSION,
  LEARNING_AGENT_MODULES,
  LEARNING_AGENT_PIPELINE,
  LEARNING_AGENT_ID,
  LEARNING_AGENT_CONTRACT_ID,
  LearningAgentModule,
  collectLearningExperience,
  discoverLearningPatterns,
  analyzeLearningFailures,
  evolveLearningKnowledge,
  buildLearningMemoryUpdates,
  computeLearningConfidence,
  buildLearningPackageSection,
  fromLearningPackageSection,
  validateLearningAgentPackage,
  scoreLearningOutcomeCandidate,
  hasStrongGardenSprayerLearning,
  buildDefaultLearningAgentInput,
  buildBatterySprayerLearningInput,
  mapLearningAgentModuleToStage,
  executeLearningAgent,
  executeLearningAgentWithPipeline,
  validateLearningAgent,
  validateLearningAgentWithExecution,
  assertLearningAgent,
  runLearningAgent,
  isLearningAgentFailure,
  getLearningAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(LEARNING_AGENT_MODULES.length, 7);
  assert.equal(LEARNING_AGENT_VERSION, "7.25.0");
  assert.equal(LEARNING_AGENT_PIPELINE.length, 2);
  assert.equal(LEARNING_AGENT_ID, LEARNING_AGENT_CONTRACT_ID);
  console.log("✔ agent catalog — 7 internal modules, platform self-learning engine");
}

function testGoldenRuleAndMission() {
  assert.ok(LEARNING_AGENT_GOLDEN_RULE.includes("smarter than yesterday"));
  assert.ok(LEARNING_AGENT_MISSION.includes("learn"));
  console.log("✔ golden rule — improves future generations, not current project");
}

function testPipelinePosition() {
  assert.equal(LEARNING_AGENT_PIPELINE[0].from, "analytics");
  assert.equal(LEARNING_AGENT_PIPELINE[0].to, "learning_agent");
  assert.equal(LEARNING_AGENT_PIPELINE[1].to, "knowledge_engine");
  console.log("✔ pipeline position — after analytics, hands off to knowledge engine");
}

function testLearningAgentInputContract() {
  const input = buildDefaultLearningAgentInput();
  assert.ok(input.projectBlueprint.storyBlueprint.primaryMessage);
  assert.ok(input.visionReport.overallScore >= 85);
  assert.ok(input.finalDecision.approved);
  assert.equal(input.userFeedback.rating, "like");
  assert.ok(input.marketplaceAnalytics.ctr >= 0.04);
  console.log("✔ learning agent input — completed project with reports, feedback, analytics");
}

function testExperienceAndPatternDiscovery() {
  const input = buildBatterySprayerLearningInput();
  const experience = collectLearningExperience(input);
  const patterns = discoverLearningPatterns(input, experience);
  const outcome = scoreLearningOutcomeCandidate(experience.ctr, input.userFeedback.rating);
  assert.ok(experience.commercialScore >= 85);
  assert.ok(patterns.newPatterns.length >= 1);
  assert.ok(outcome > 0.9);
  console.log("✔ experience and pattern discovery — outdoor hero minimal typography pattern");
}

function testFailureAndKnowledgeEvolution() {
  const input = buildBatterySprayerLearningInput();
  const experience = collectLearningExperience(input);
  const antiPatterns = analyzeLearningFailures(input, experience);
  const knowledge = evolveLearningKnowledge(input, experience);
  const memory = buildLearningMemoryUpdates(input, experience, discoverLearningPatterns(input, experience));
  assert.equal(antiPatterns.length, 0);
  assert.ok(knowledge.length >= 1);
  assert.ok(memory.length >= 1);
  console.log("✔ failure analysis and knowledge evolution — warm outdoor lighting proposal");
}

function testLearningPackageOutput() {
  const input = buildBatterySprayerLearningInput();
  const section = buildLearningPackageSection(input, {}, 0.88);
  const pkg = fromLearningPackageSection(section);
  assert.equal(hasStrongGardenSprayerLearning(pkg), true);
  assert.ok(pkg.knowledgeUpdates.length >= 1);
  assert.equal(validateLearningAgentPackage(pkg).length, 0);
  console.log("✔ learning package — garden sprayer produces patterns, memory, and knowledge updates");
}

function testModuleMapping() {
  assert.equal(mapLearningAgentModuleToStage(LearningAgentModule.PATTERN_DISCOVERY), "pattern_discovery");
  const mod = getLearningAgentModule(LearningAgentModule.MEMORY_UPDATER)!;
  assert.equal(mod.order, 5);
  console.log("✔ internal modules map to learning validation stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeLearningAgent({
    agentInput: buildBatterySprayerLearningInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, LEARNING_AGENT_ID);
  assert.equal(report.doesNotMutateCurrentProject, true);
  assert.equal(hasStrongGardenSprayerLearning(report.package!), true);
  assert.ok(report.confidence >= 0.72);
  console.log("✔ kitchen execution — battery sprayer learning package for knowledge engine");
}

async function testRetryOnInsufficientStatistics() {
  const report = await executeLearningAgent({
    agentInput: buildBatterySprayerLearningInput(),
    context: { insufficientStatistics: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "insufficient_statistics");
  assert.equal(hasStrongGardenSprayerLearning(report.package!), true);
  console.log("✔ retry logic — experience collector and validator recover statistical confidence");
}

async function testRejectFalsePattern() {
  const report = await executeLearningAgent({
    agentInput: buildBatterySprayerLearningInput(),
    context: { injectFalsePattern: true, skipRetry: true },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "FALSE_LEARNING_DETECTED"));
  console.log("✔ validation — random coincidence rejected as false learning");
}

async function testPipelineHandoff() {
  const report = await executeLearningAgentWithPipeline({
    agentInput: buildBatterySprayerLearningInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — learning package for knowledge engine");
}

async function testKpis() {
  const report = await executeLearningAgent({
    agentInput: buildBatterySprayerLearningInput(),
  });
  assert.ok(report.kpis.patternDiscoveryAccuracy > 0);
  assert.ok(report.kpis.memoryGrowthQuality > 0);
  assert.ok(report.kpis.confidenceScore > 0);
  console.log("✔ performance metrics — pattern discovery, memory growth, confidence KPIs");
}

async function testValidateWithExecution() {
  const report = await validateLearningAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertLearningAgent();
  console.log("✔ full learning agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runLearningAgent();
  assert.equal(report.valid, true);
  console.log("✔ runLearningAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isLearningAgentFailure("FALSE_LEARNING_DETECTED"), true);
  assert.equal(isLearningAgentFailure("UNKNOWN"), false);
  console.log("✔ learning agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testLearningAgentInputContract();
  testExperienceAndPatternDiscovery();
  testFailureAndKnowledgeEvolution();
  testLearningPackageOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnInsufficientStatistics();
  await testRejectFalsePattern();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Learning Agent (Ch 7.25) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

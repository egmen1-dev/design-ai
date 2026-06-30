/**
 * DESIGN AI v18 — Pattern Director Agent tests (Chapter 7.19)
 */
import assert from "node:assert/strict";
import {
  PATTERN_DIRECTOR_AGENT_VERSION,
  PATTERN_DIRECTOR_AGENT_GOLDEN_RULE,
  PATTERN_DIRECTOR_AGENT_MISSION,
  PATTERN_DIRECTOR_AGENT_MODULES,
  PATTERN_DIRECTOR_AGENT_PIPELINE,
  PATTERN_DIRECTOR_AGENT_ID,
  PATTERN_DIRECTOR_ID,
  PatternDirectorAgentModule,
  mapStoryKind,
  mapBusinessGoal,
  buildPatternSelectionContext,
  searchCompatiblePatterns,
  fuseSelectedPatterns,
  computeInnovationLevel,
  buildPatternSection,
  fromPatternSection,
  validatePatternDirectorAgentBlueprint,
  validatePatternFusionCompatible,
  scorePatternCandidateForStory,
  hasGardenSprayerPatternSet,
  buildDefaultPatternDirectorAgentInput,
  buildBatterySprayerPatternDirectorInput,
  mapPatternDirectorModuleToStage,
  executePatternDirectorAgent,
  executePatternDirectorAgentWithPipeline,
  validatePatternDirectorAgent,
  validatePatternDirectorAgentWithExecution,
  assertPatternDirectorAgent,
  runPatternDirectorAgent,
  isPatternDirectorAgentFailure,
  getPatternDirectorAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(PATTERN_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(PATTERN_DIRECTOR_AGENT_VERSION, "7.19.0");
  assert.equal(PATTERN_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(PATTERN_DIRECTOR_AGENT_ID, PATTERN_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, pattern-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(PATTERN_DIRECTOR_AGENT_GOLDEN_RULE.includes("does not copy"));
  assert.ok(PATTERN_DIRECTOR_AGENT_MISSION.includes("proven design patterns"));
  console.log("✔ golden rule — principles over image copying");
}

function testPipelinePosition() {
  assert.equal(PATTERN_DIRECTOR_AGENT_PIPELINE[0].from, "marketplace_director");
  assert.equal(PATTERN_DIRECTOR_AGENT_PIPELINE[0].to, "pattern_director");
  assert.equal(PATTERN_DIRECTOR_AGENT_PIPELINE[1].to, "anti_pattern_director");
  console.log("✔ pipeline position — after marketplace director, before anti-pattern director");
}

function testPatternDirectorInputContract() {
  const input = buildDefaultPatternDirectorAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.marketplaceBlueprint.overlayStrategy);
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.productProfile.category);
  assert.ok(input.knowledgePackage.rawPackage);
  console.log("✔ pattern director input — product, story, scene, layout, marketplace, knowledge");
}

function testPatternSearchAndRanking() {
  const input = buildBatterySprayerPatternDirectorInput();
  const ctx = buildPatternSelectionContext(input);
  assert.equal(mapStoryKind(input), "problem_solution");
  assert.equal(mapBusinessGoal(input), "benefits_demo");
  const patterns = searchCompatiblePatterns(input);
  assert.ok(patterns.length >= 3);
  assert.ok(patterns.some((p) => p.id.includes("wildberries")));
  assert.ok(!patterns.some((p) => p.id === "story-premium-showcase"));
  const section = buildPatternSection(input, {}, 0.93);
  assert.ok(section.ctrPrediction >= 0.7);
  assert.ok(section.patterns.some((p) => p.id === "mkt-wildberries-hero-usp"));
  console.log("✔ pattern search and ranking — Wildberries garden sprayer patterns scored");
}

function testPatternCompatibilityAndFusion() {
  const input = buildBatterySprayerPatternDirectorInput();
  const section = buildPatternSection(input, {}, 0.93);
  const fusion = fuseSelectedPatterns(section.patterns);
  assert.ok(fusion.fusedIds.length >= 2);
  assert.equal(validatePatternFusionCompatible(fusion.fusedIds), true);
  assert.equal(section.blendCompatible, true);
  const score = scorePatternCandidateForStory("Problem → Solution", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ pattern compatibility and fusion — story-aligned blend without conflicts");
}

function testUniquenessAndInnovation() {
  const input = buildBatterySprayerPatternDirectorInput();
  const level = computeInnovationLevel(input);
  assert.ok(level >= 0.42 && level <= 0.55);
  const lowInnovation = computeInnovationLevel(input, { insufficientInnovation: true });
  assert.ok(lowInnovation < 0.3);
  console.log("✔ uniqueness controller — controlled innovation level for garden outdoor card");
}

function testPatternBlueprintOutput() {
  const input = buildBatterySprayerPatternDirectorInput();
  const ctx = buildPatternSelectionContext(input);
  const section = buildPatternSection(input, {}, 0.93);
  const blueprint = fromPatternSection(section, input, ctx);
  assert.ok(blueprint.selectedPatterns.length >= 3);
  assert.ok(blueprint.visualRules.length >= 2);
  assert.ok(blueprint.recommendedElements.includes("Hero Product Large"));
  assert.ok(blueprint.avoidElements.includes("Luxury Interior Mood"));
  assert.equal(hasGardenSprayerPatternSet(blueprint), true);
  assert.equal(validatePatternDirectorAgentBlueprint(blueprint, input, section).length, 0);
  console.log("✔ pattern blueprint — complete output for anti-pattern director and critics");
}

function testModuleMapping() {
  assert.equal(mapPatternDirectorModuleToStage(PatternDirectorAgentModule.PATTERN_FUSION), "pattern_fusion");
  const mod = getPatternDirectorAgentModule(PatternDirectorAgentModule.PATTERN_SEARCH)!;
  assert.equal(mod.order, 1);
  console.log("✔ internal modules map to Ch 5.14 pattern library stages");
}

async function testKitchenSprayerExecution() {
  const report = await executePatternDirectorAgent({
    agentInput: buildBatterySprayerPatternDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, PATTERN_DIRECTOR_ID);
  assert.equal(report.imageCopyExcluded, true);
  assert.equal(hasGardenSprayerPatternSet(report.blueprint!), true);
  assert.ok(report.kpis.ctrPrediction >= 0.7);
  assert.ok(report.confidence >= 0.75);
  assert.ok(report.blueprint!.innovationLevel >= 0.42);
  console.log("✔ kitchen execution — battery sprayer Wildberries pattern blueprint");
}

async function testRetryOnConflictingPatterns() {
  const report = await executePatternDirectorAgent({
    agentInput: buildBatterySprayerPatternDirectorInput(),
    context: { conflictingPatterns: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "search_fusion_innovation");
  assert.ok(report.blueprint!.selectedPatterns.length >= 3);
  console.log("✔ retry logic — pattern search, fusion, and innovation controller");
}

async function testRetryOnTooSimilarToPrevious() {
  const report = await executePatternDirectorAgent({
    agentInput: buildBatterySprayerPatternDirectorInput(),
    context: { tooSimilarToPrevious: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.blueprint!.innovationLevel >= 0.42);
  console.log("✔ retry logic — uniqueness controller increases innovation after similarity flag");
}

async function testPipelineHandoff() {
  const report = await executePatternDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerPatternDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — pattern blueprint for anti-pattern director");
}

async function testKpis() {
  const report = await executePatternDirectorAgent({
    agentInput: buildBatterySprayerPatternDirectorInput(),
  });
  assert.ok(report.kpis.patternMatch > 0);
  assert.ok(report.kpis.patternSynergy > 0);
  assert.ok(report.kpis.storyAlignment > 0);
  console.log("✔ performance metrics — match, synergy, story alignment KPIs");
}

async function testValidateWithExecution() {
  const report = await validatePatternDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertPatternDirectorAgent();
  console.log("✔ full pattern director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runPatternDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runPatternDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isPatternDirectorAgentFailure("CONFLICTING_PATTERNS"), true);
  assert.equal(isPatternDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ pattern director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testPatternDirectorInputContract();
  testPatternSearchAndRanking();
  testPatternCompatibilityAndFusion();
  testUniquenessAndInnovation();
  testPatternBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnConflictingPatterns();
  await testRetryOnTooSimilarToPrevious();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Pattern Director Agent (Ch 7.19) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * DESIGN AI v18 — Visual Story Director Agent tests (Chapter 7.10)
 */
import assert from "node:assert/strict";
import {
  VISUAL_STORY_DIRECTOR_AGENT_VERSION,
  VISUAL_STORY_DIRECTOR_AGENT_GOLDEN_RULE,
  VISUAL_STORY_DIRECTOR_AGENT_MISSION,
  VISUAL_STORY_DIRECTOR_AGENT_MODULES,
  VISUAL_STORY_DIRECTOR_AGENT_PIPELINE,
  VISUAL_STORY_DIRECTOR_AGENT_ID,
  VisualStoryDirectorAgentModule,
  StoryPattern,
  StoryObjective,
  mapStoryFlowToNarrative,
  formatStoryPatternLabel,
  fromPlannedStoryBlueprint,
  validateVisualStoryDirectorAgentBlueprint,
  buildCommercialStoryNarrative,
  scoreStoryPatternForBusinessGoal,
  buildDefaultVisualStoryDirectorAgentInput,
  buildBatterySprayerStoryDirectorInput,
  toVisualStoryPlanningInput,
  mapModuleToPlanningStage,
  executeVisualStoryDirectorAgent,
  executeVisualStoryDirectorAgentWithPipeline,
  validateVisualStoryDirectorAgent,
  validateVisualStoryDirectorAgentWithExecution,
  assertVisualStoryDirectorAgent,
  runVisualStoryDirectorAgent,
  isVisualStoryDirectorAgentFailure,
  getVisualStoryDirectorAgentModule,
  runVisualStoryPlanningStage,
  buildPlannedStoryBlueprint,
  buildHeroMoment,
  VISUAL_STORY_DIRECTOR_ID,
} from "./index";

function testAgentCatalog() {
  assert.equal(VISUAL_STORY_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(VISUAL_STORY_DIRECTOR_AGENT_VERSION, "7.10.0");
  assert.equal(VISUAL_STORY_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(VISUAL_STORY_DIRECTOR_AGENT_ID, VISUAL_STORY_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, first creative agent");
}

function testGoldenRuleAndMission() {
  assert.ok(VISUAL_STORY_DIRECTOR_AGENT_GOLDEN_RULE.includes("creates the story"));
  assert.ok(VISUAL_STORY_DIRECTOR_AGENT_MISSION.includes("first 2–3 seconds"));
  console.log("✔ golden rule — story meaning before composition or lighting");
}

function testPipelinePosition() {
  assert.equal(VISUAL_STORY_DIRECTOR_AGENT_PIPELINE[0].from, "knowledge_retrieval");
  assert.equal(VISUAL_STORY_DIRECTOR_AGENT_PIPELINE[0].to, "visual_story_director");
  assert.equal(VISUAL_STORY_DIRECTOR_AGENT_PIPELINE[1].to, "scene_director");
  console.log("✔ pipeline position — after knowledge retrieval, before scene director");
}

function testStoryDirectorInputContract() {
  const input = buildDefaultVisualStoryDirectorAgentInput();
  assert.ok(input.productProfile.category);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.knowledgePackage.rawPackage);
  assert.ok(input.marketplaceProfile.id);
  assert.ok(input.pipelineContext.pipelineId);
  const planning = toVisualStoryPlanningInput(input);
  assert.equal(planning.marketplace, input.marketplaceProfile.id);
  console.log("✔ story director input — product, business, knowledge, marketplace, context");
}

function testStoryPatternSelector() {
  assert.equal(formatStoryPatternLabel(StoryPattern.PROBLEM_SOLUTION), "Problem → Solution");
  const score = scoreStoryPatternForBusinessGoal(StoryPattern.PROBLEM_SOLUTION, "Increase CTR");
  assert.ok(score > 0.9);
  console.log("✔ story pattern selector — pattern aligned with business goal");
}

function testCommercialStoryEngine() {
  const input = buildBatterySprayerStoryDirectorInput();
  const planning = toVisualStoryPlanningInput(input);
  const report = runVisualStoryPlanningStage(planning);
  const blueprint = fromPlannedStoryBlueprint(
    report.section!.plannedBlueprint,
    input.businessModel,
    report.section!.confidence,
  );
  assert.ok(blueprint.primaryMessage.includes("tree") || blueprint.primaryMessage.includes("pump"));
  assert.equal(/beautiful tool/i.test(blueprint.primaryMessage), false);
  const narrative = buildCommercialStoryNarrative(blueprint.primaryMessage, input.businessModel);
  assert.ok(narrative.length >= 3);
  console.log("✔ commercial story engine — sells outcome, not product appearance");
}

function testHeroMomentAndNarrative() {
  const input = buildBatterySprayerStoryDirectorInput();
  const planning = toVisualStoryPlanningInput(input);
  const pattern = StoryPattern.PROBLEM_SOLUTION;
  const hero = buildHeroMoment(
    { ...planning, business: planning.business },
    pattern,
  );
  assert.ok(hero.toLowerCase().includes("tree") || hero.toLowerCase().includes("strain"));
  const planned = buildPlannedStoryBlueprint(planning, pattern, StoryObjective.SHOW_BENEFIT);
  const flow = mapStoryFlowToNarrative(planned.storyFlow);
  assert.ok(flow.length >= 4);
  assert.ok(flow[0].includes("Problem") || flow[0].length > 0);
  console.log("✔ hero moment and narrative planner — memorable moment and story flow");
}

function testStoryBlueprintOutput() {
  const input = buildBatterySprayerStoryDirectorInput();
  const report = runVisualStoryPlanningStage(toVisualStoryPlanningInput(input));
  const blueprint = fromPlannedStoryBlueprint(
    report.section!.plannedBlueprint,
    input.businessModel,
    report.section!.confidence,
  );
  assert.ok(blueprint.storyPattern);
  assert.ok(blueprint.heroMoment);
  assert.ok(blueprint.emotionalDirection);
  assert.ok(blueprint.visualPriority.length > 0);
  assert.equal(validateVisualStoryDirectorAgentBlueprint(blueprint, input.businessModel).length, 0);
  console.log("✔ story blueprint — complete output for downstream agents");
}

function testModuleMapping() {
  assert.equal(mapModuleToPlanningStage(VisualStoryDirectorAgentModule.HERO_MOMENT_BUILDER), "hero_moment");
  const mod = getVisualStoryDirectorAgentModule(VisualStoryDirectorAgentModule.EMOTION_DESIGNER)!;
  assert.equal(mod.order, 3);
  console.log("✔ internal modules map to Ch 6.6 planning stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeVisualStoryDirectorAgent({
    agentInput: buildBatterySprayerStoryDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, VISUAL_STORY_DIRECTOR_ID);
  assert.equal(report.firstCreativeAgent, true);
  assert.equal(report.designExcluded, true);
  assert.ok(report.blueprint?.storyPattern.includes("Problem"));
  assert.ok(report.blueprint?.heroMoment.toLowerCase().includes("tree") || report.blueprint?.heroMoment.includes("strain"));
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer story blueprint");
}

async function testRetryOnMissingHeroMoment() {
  const report = await executeVisualStoryDirectorAgent({
    agentInput: buildBatterySprayerStoryDirectorInput(),
    context: { missingHeroMoment: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "pattern_emotion_decision");
  assert.ok(report.blueprint?.heroMoment);
  console.log("✔ retry logic — pattern selection, emotion design, decision engine");
}

async function testPipelineHandoff() {
  const report = await executeVisualStoryDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerStoryDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — story blueprint for scene director");
}

function testKpis() {
  const report = executeVisualStoryDirectorAgent({
    agentInput: buildBatterySprayerStoryDirectorInput(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.storyQualityScore > 0);
    assert.ok(r.kpis.heroMomentStrength > 0);
    assert.ok(r.kpis.confidenceScore > 0);
    console.log("✔ performance metrics — story quality, hero strength, confidence KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validateVisualStoryDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertVisualStoryDirectorAgent();
  console.log("✔ full visual story director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runVisualStoryDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runVisualStoryDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isVisualStoryDirectorAgentFailure("MISSING_HERO_MOMENT"), true);
  assert.equal(isVisualStoryDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ visual story director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testStoryDirectorInputContract();
  testStoryPatternSelector();
  testCommercialStoryEngine();
  testHeroMomentAndNarrative();
  testStoryBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnMissingHeroMoment();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nvisual-story-director-agent.spec.ts — all passed");
}

run();

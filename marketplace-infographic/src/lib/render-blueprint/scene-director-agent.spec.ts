/**
 * DESIGN AI v18 — Scene Director Agent tests (Chapter 7.11)
 */
import assert from "node:assert/strict";
import {
  SCENE_DIRECTOR_AGENT_VERSION,
  SCENE_DIRECTOR_AGENT_GOLDEN_RULE,
  SCENE_DIRECTOR_AGENT_MISSION,
  SCENE_DIRECTOR_AGENT_MODULES,
  SCENE_DIRECTOR_AGENT_PIPELINE,
  SCENE_DIRECTOR_AGENT_ID,
  SceneDirectorAgentModule,
  SceneCategory,
  formatSceneTypeLabel,
  storyPatternIdFromAgentBlueprint,
  toPlannedStoryFromAgentBlueprint,
  fromPlannedSceneBlueprint,
  validateSceneDirectorAgentBlueprint,
  validateEnvironmentSupportsStory,
  scoreSceneCandidateForStory,
  buildDefaultSceneDirectorAgentInput,
  buildBatterySprayerSceneDirectorInput,
  toScenePlanningInput,
  mapSceneDirectorModuleToPlanningStage,
  executeSceneDirectorAgent,
  executeSceneDirectorAgentWithPipeline,
  validateSceneDirectorAgent,
  validateSceneDirectorAgentWithExecution,
  assertSceneDirectorAgent,
  runSceneDirectorAgent,
  isSceneDirectorAgentFailure,
  getSceneDirectorAgentModule,
  runScenePlanningStage,
  buildSceneLocation,
  buildSupportObjects,
  SCENE_DIRECTOR_ID,
} from "./index";

function testAgentCatalog() {
  assert.equal(SCENE_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(SCENE_DIRECTOR_AGENT_VERSION, "7.11.0");
  assert.equal(SCENE_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(SCENE_DIRECTOR_AGENT_ID, SCENE_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, environment-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(SCENE_DIRECTOR_AGENT_GOLDEN_RULE.includes("designs the environment"));
  assert.ok(SCENE_DIRECTOR_AGENT_MISSION.includes("Where should this story happen"));
  console.log("✔ golden rule — world design, not composition or lighting");
}

function testPipelinePosition() {
  assert.equal(SCENE_DIRECTOR_AGENT_PIPELINE[0].from, "visual_story_director");
  assert.equal(SCENE_DIRECTOR_AGENT_PIPELINE[0].to, "scene_director");
  assert.equal(SCENE_DIRECTOR_AGENT_PIPELINE[1].to, "composition_director");
  console.log("✔ pipeline position — after story director, before composition director");
}

function testSceneDirectorInputContract() {
  const input = buildDefaultSceneDirectorAgentInput();
  assert.ok(input.productProfile.category);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.knowledgePackage.rawPackage);
  assert.ok(input.marketplaceProfile.id);
  const planning = toScenePlanningInput(input);
  assert.equal(planning.marketplace, input.marketplaceProfile.id);
  assert.ok(planning.story.primaryMessage);
  console.log("✔ scene director input — product, business, story, knowledge, marketplace");
}

function testSceneSelector() {
  const input = buildBatterySprayerSceneDirectorInput();
  const planning = toScenePlanningInput(input);
  const report = runScenePlanningStage(planning);
  assert.equal(report.section!.plannedBlueprint.sceneType, SceneCategory.OUTDOOR);
  assert.equal(formatSceneTypeLabel(SceneCategory.OUTDOOR), "Outdoor Natural");
  const score = scoreSceneCandidateForStory("Garden Lifestyle", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ scene selector — outdoor natural scene for garden sprayer story");
}

function testEnvironmentBuilder() {
  const input = buildBatterySprayerSceneDirectorInput();
  const planning = toScenePlanningInput(input);
  const location = buildSceneLocation(planning);
  assert.ok(location.toLowerCase().includes("orchard") || location.toLowerCase().includes("garden"));
  const blueprint = fromPlannedSceneBlueprint(
    runScenePlanningStage(planning).section!.plannedBlueprint,
    input,
    0.94,
  );
  assert.equal(/white studio/i.test(blueprint.environment), false);
  assert.equal(validateEnvironmentSupportsStory(blueprint.environment, input.storyBlueprint.primaryMessage), true);
  console.log("✔ environment builder — credible garden world, not white studio");
}

function testPropPlanner() {
  const input = buildBatterySprayerSceneDirectorInput();
  const planning = toScenePlanningInput(input);
  const props = buildSupportObjects(planning);
  assert.ok(props.some((p) => p.includes("tree") || p.includes("plant")));
  const blueprint = fromPlannedSceneBlueprint(
    runScenePlanningStage(planning).section!.plannedBlueprint,
    input,
    0.94,
  );
  assert.ok(blueprint.negativeObjects.length > 0);
  assert.equal(blueprint.negativeObjects.some((o) => o.includes("random people")), true);
  console.log("✔ prop planner — support objects reinforce story, forbidden objects blocked");
}

function testSceneBlueprintOutput() {
  const input = buildBatterySprayerSceneDirectorInput();
  const report = runScenePlanningStage(toScenePlanningInput(input));
  const blueprint = fromPlannedSceneBlueprint(
    report.section!.plannedBlueprint,
    input,
    report.section!.confidence,
  );
  assert.ok(blueprint.sceneType);
  assert.ok(blueprint.environment);
  assert.ok(blueprint.atmosphere);
  assert.ok(blueprint.surfaceType);
  assert.ok(blueprint.depthLevel);
  assert.equal(validateSceneDirectorAgentBlueprint(blueprint, input).length, 0);
  console.log("✔ scene blueprint — complete output for downstream agents");
}

function testStoryBlueprintMapping() {
  const input = buildBatterySprayerSceneDirectorInput();
  const planned = toPlannedStoryFromAgentBlueprint(input.storyBlueprint);
  assert.equal(storyPatternIdFromAgentBlueprint(input.storyBlueprint), "problem_solution");
  assert.equal(planned.primaryMessage, input.storyBlueprint.primaryMessage);
  console.log("✔ story blueprint mapping — agent story converts to planning input");
}

function testModuleMapping() {
  assert.equal(mapSceneDirectorModuleToPlanningStage(SceneDirectorAgentModule.ATMOSPHERE_ENGINE), "time_of_day");
  const mod = getSceneDirectorAgentModule(SceneDirectorAgentModule.BACKGROUND_DESIGNER)!;
  assert.equal(mod.order, 3);
  console.log("✔ internal modules map to Ch 6.7 planning stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeSceneDirectorAgent({
    agentInput: buildBatterySprayerSceneDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, SCENE_DIRECTOR_ID);
  assert.equal(report.compositionExcluded, true);
  assert.ok(report.blueprint?.sceneType.includes("Outdoor"));
  assert.ok(report.blueprint?.environment.toLowerCase().includes("garden") || report.blueprint?.environment.includes("orchard"));
  assert.ok(report.blueprint?.supportObjects.some((o) => /tree|plant|shrub/i.test(o)));
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer garden scene blueprint");
}

async function testRetryOnStoryConflict() {
  const report = await executeSceneDirectorAgent({
    agentInput: buildBatterySprayerSceneDirectorInput(),
    context: { storyConflict: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "scene_environment_prop");
  console.log("✔ retry logic — scene selector, environment builder, prop planner");
}

async function testRetryOnMissingLocation() {
  const report = await executeSceneDirectorAgent({
    agentInput: buildBatterySprayerSceneDirectorInput(),
    context: { missingLocation: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.blueprint?.environment.length > 10);
  console.log("✔ retry logic — recovers from missing location");
}

async function testPipelineHandoff() {
  const report = await executeSceneDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerSceneDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — scene blueprint for composition director");
}

function testKpis() {
  const report = executeSceneDirectorAgent({
    agentInput: buildBatterySprayerSceneDirectorInput(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.sceneRelevance > 0);
    assert.ok(r.kpis.storyAlignment > 0);
    assert.ok(r.kpis.heroVisibility > 0);
    console.log("✔ performance metrics — relevance, alignment, hero visibility KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validateSceneDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertSceneDirectorAgent();
  console.log("✔ full scene director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runSceneDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runSceneDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isSceneDirectorAgentFailure("STORY_CONFLICT"), true);
  assert.equal(isSceneDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ scene director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testSceneDirectorInputContract();
  testSceneSelector();
  testEnvironmentBuilder();
  testPropPlanner();
  testSceneBlueprintOutput();
  testStoryBlueprintMapping();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnStoryConflict();
  await testRetryOnMissingLocation();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nscene-director-agent.spec.ts — all passed");
}

run();

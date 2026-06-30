/**
 * DESIGN AI v18 — Composition Director Agent tests (Chapter 7.12)
 */
import assert from "node:assert/strict";
import {
  COMPOSITION_DIRECTOR_AGENT_VERSION,
  COMPOSITION_DIRECTOR_AGENT_GOLDEN_RULE,
  COMPOSITION_DIRECTOR_AGENT_MISSION,
  COMPOSITION_DIRECTOR_AGENT_MODULES,
  COMPOSITION_DIRECTOR_AGENT_PIPELINE,
  COMPOSITION_DIRECTOR_AGENT_ID,
  CompositionDirectorAgentModule,
  LayoutPattern,
  formatLayoutPatternLabel,
  toPlannedSceneFromAgentBlueprint,
  fromPlannedCompositionBlueprint,
  readingFlowToPoints,
  computeBalanceScore,
  validateCompositionDirectorAgentBlueprint,
  validateLayoutSupportsStory,
  scoreLayoutCandidateForStory,
  heroOccupiesMarketplaceRange,
  buildDefaultCompositionDirectorAgentInput,
  buildBatterySprayerCompositionDirectorInput,
  toCompositionPlanningInput,
  mapCompositionDirectorModuleToPlanningStage,
  executeCompositionDirectorAgent,
  executeCompositionDirectorAgentWithPipeline,
  validateCompositionDirectorAgent,
  validateCompositionDirectorAgentWithExecution,
  assertCompositionDirectorAgent,
  runCompositionDirectorAgent,
  isCompositionDirectorAgentFailure,
  getCompositionDirectorAgentModule,
  runCompositionPlanningStage,
  buildPlannedCompositionBlueprint,
  buildReadingFlow,
  selectLayoutPattern,
  COMPOSITION_DIRECTOR_ID,
} from "./index";

function testAgentCatalog() {
  assert.equal(COMPOSITION_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(COMPOSITION_DIRECTOR_AGENT_VERSION, "7.12.0");
  assert.equal(COMPOSITION_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(COMPOSITION_DIRECTOR_AGENT_ID, COMPOSITION_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, composition-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(COMPOSITION_DIRECTOR_AGENT_GOLDEN_RULE.includes("invisible director"));
  assert.ok(COMPOSITION_DIRECTOR_AGENT_MISSION.includes("buyer"));
  console.log("✔ golden rule — attention path, not decoration");
}

function testPipelinePosition() {
  assert.equal(COMPOSITION_DIRECTOR_AGENT_PIPELINE[0].from, "scene_director");
  assert.equal(COMPOSITION_DIRECTOR_AGENT_PIPELINE[0].to, "composition_director");
  assert.equal(COMPOSITION_DIRECTOR_AGENT_PIPELINE[1].to, "photography_director");
  console.log("✔ pipeline position — after scene director, before photography director");
}

function testCompositionDirectorInputContract() {
  const input = buildDefaultCompositionDirectorAgentInput();
  assert.ok(input.productProfile.category);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.knowledgePackage.rawPackage);
  assert.ok(input.marketplaceProfile.id);
  const planning = toCompositionPlanningInput(input);
  assert.equal(planning.marketplace, input.marketplaceProfile.id);
  assert.ok(planning.scene.location);
  console.log("✔ composition director input — product, business, story, scene, knowledge, marketplace");
}

function testLayoutSelector() {
  const input = buildBatterySprayerCompositionDirectorInput();
  const planning = toCompositionPlanningInput(input);
  const report = runCompositionPlanningStage(planning);
  assert.equal(report.section!.layoutPattern, LayoutPattern.MARKETPLACE_SPLIT);
  assert.equal(formatLayoutPatternLabel(LayoutPattern.MARKETPLACE_SPLIT), "Marketplace Hero");
  const score = scoreLayoutCandidateForStory("Marketplace Hero", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ layout selector — marketplace hero layout for garden sprayer");
}

function testHeroPlacementEngine() {
  const input = buildBatterySprayerCompositionDirectorInput();
  const planning = toCompositionPlanningInput(input);
  const planned = buildPlannedCompositionBlueprint(planning, selectLayoutPattern(planning));
  const blueprint = fromPlannedCompositionBlueprint(planned, 0.94);
  assert.equal(heroOccupiesMarketplaceRange(blueprint.heroPlacement), true);
  assert.ok(blueprint.heroPlacement.width > 0.3);
  console.log("✔ hero placement — dominant hero within marketplace range");
}

function testHierarchyAndReadingFlow() {
  const input = buildBatterySprayerCompositionDirectorInput();
  const planning = toCompositionPlanningInput(input);
  const planned = buildPlannedCompositionBlueprint(planning, LayoutPattern.MARKETPLACE_SPLIT);
  const flow = buildReadingFlow(planning, planned.visualHierarchy);
  const points = readingFlowToPoints(flow);
  assert.equal(planned.visualHierarchy[0], "Hero Product");
  assert.equal(flow[1], "hero_product");
  assert.ok(points.length >= 4);
  console.log("✔ hierarchy and reading flow — hero leads predictable attention route");
}

function testNegativeSpacePlanner() {
  const input = buildBatterySprayerCompositionDirectorInput();
  const planning = toCompositionPlanningInput(input);
  const planned = buildPlannedCompositionBlueprint(planning, LayoutPattern.MARKETPLACE_SPLIT);
  const blueprint = fromPlannedCompositionBlueprint(planned, 0.94);
  assert.ok(blueprint.negativeSpace.length > 0);
  assert.ok(blueprint.textZones.length >= 2);
  assert.ok(blueprint.badgeZones.length >= 1);
  console.log("✔ negative space planner — reserved zones for text and badges");
}

function testLayoutBlueprintOutput() {
  const input = buildBatterySprayerCompositionDirectorInput();
  const report = runCompositionPlanningStage(toCompositionPlanningInput(input));
  const blueprint = fromPlannedCompositionBlueprint(
    report.section!.plannedBlueprint,
    report.section!.confidence,
  );
  assert.ok(blueprint.layoutPattern);
  assert.ok(blueprint.balanceScore >= 0.7);
  assert.equal(validateCompositionDirectorAgentBlueprint(blueprint, input).length, 0);
  console.log("✔ layout blueprint — complete output for downstream agents");
}

function testSceneBlueprintMapping() {
  const input = buildBatterySprayerCompositionDirectorInput();
  const planned = toPlannedSceneFromAgentBlueprint(input.sceneBlueprint);
  assert.ok(planned.location);
  assert.ok(planned.environment);
  assert.equal(validateLayoutSupportsStory("Marketplace Hero", input.storyBlueprint.primaryMessage), true);
  console.log("✔ scene blueprint mapping — agent scene converts to planning input");
}

function testModuleMapping() {
  assert.equal(
    mapCompositionDirectorModuleToPlanningStage(CompositionDirectorAgentModule.READING_FLOW_PLANNER),
    "reading_flow",
  );
  const mod = getCompositionDirectorAgentModule(CompositionDirectorAgentModule.HERO_PLACEMENT_ENGINE)!;
  assert.equal(mod.order, 2);
  console.log("✔ internal modules map to Ch 6.8 planning stages");
}

function testBalanceScore() {
  const input = buildBatterySprayerCompositionDirectorInput();
  const planned = buildPlannedCompositionBlueprint(
    toCompositionPlanningInput(input),
    LayoutPattern.MARKETPLACE_SPLIT,
  );
  const score = computeBalanceScore(planned);
  assert.ok(score >= 0.7);
  console.log("✔ balance score — stable composition weight distribution");
}

async function testKitchenSprayerExecution() {
  const report = await executeCompositionDirectorAgent({
    agentInput: buildBatterySprayerCompositionDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, COMPOSITION_DIRECTOR_ID);
  assert.equal(report.photographyExcluded, true);
  assert.ok(report.blueprint?.layoutPattern.includes("Marketplace"));
  assert.equal(report.blueprint?.visualHierarchy[0], "Hero Product");
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer marketplace layout blueprint");
}

async function testRetryOnChaoticFlow() {
  const report = await executeCompositionDirectorAgent({
    agentInput: buildBatterySprayerCompositionDirectorInput(),
    context: { chaoticFlow: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "layout_hero_reading_balance");
  console.log("✔ retry logic — layout selector, hero placement, reading flow");
}

async function testRetryOnHeroTooSmall() {
  const report = await executeCompositionDirectorAgent({
    agentInput: buildBatterySprayerCompositionDirectorInput(),
    context: { heroTooSmall: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(heroOccupiesMarketplaceRange(report.blueprint!.heroPlacement));
  console.log("✔ retry logic — recovers from undersized hero product");
}

async function testPipelineHandoff() {
  const report = await executeCompositionDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerCompositionDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — layout blueprint for photography director");
}

function testKpis() {
  const report = executeCompositionDirectorAgent({
    agentInput: buildBatterySprayerCompositionDirectorInput(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.heroVisibilityScore > 0);
    assert.ok(r.kpis.readingFlowQuality > 0);
    assert.ok(r.kpis.balanceScore > 0);
    console.log("✔ performance metrics — hero visibility, flow, balance KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validateCompositionDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertCompositionDirectorAgent();
  console.log("✔ full composition director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runCompositionDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runCompositionDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isCompositionDirectorAgentFailure("CHAOTIC_READING_FLOW"), true);
  assert.equal(isCompositionDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ composition director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testCompositionDirectorInputContract();
  testLayoutSelector();
  testHeroPlacementEngine();
  testHierarchyAndReadingFlow();
  testNegativeSpacePlanner();
  testLayoutBlueprintOutput();
  testSceneBlueprintMapping();
  testModuleMapping();
  testBalanceScore();
  await testKitchenSprayerExecution();
  await testRetryOnChaoticFlow();
  await testRetryOnHeroTooSmall();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\ncomposition-director-agent.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Typography Director Agent tests (Chapter 7.17)
 */
import assert from "node:assert/strict";
import {
  TYPOGRAPHY_DIRECTOR_AGENT_VERSION,
  TYPOGRAPHY_DIRECTOR_AGENT_GOLDEN_RULE,
  TYPOGRAPHY_DIRECTOR_AGENT_MISSION,
  TYPOGRAPHY_DIRECTOR_AGENT_MODULES,
  TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE,
  TYPOGRAPHY_DIRECTOR_AGENT_ID,
  TYPOGRAPHY_DIRECTOR_ID,
  TypographyDirectorAgentModule,
  FontCharacter,
  selectTypographyStrategy,
  selectTypographyFontCharacter,
  buildTextHierarchy,
  buildTypographySection,
  fromTypographySection,
  validateTypographySupportsMarketplace,
  scoreTypographyCandidateForStory,
  hasMarketplaceHeadlineHierarchy,
  countHeadlineWords,
  buildDefaultTypographyDirectorAgentInput,
  buildBatterySprayerTypographyDirectorInput,
  mapTypographyDirectorModuleToStage,
  executeTypographyDirectorAgent,
  executeTypographyDirectorAgentWithPipeline,
  validateTypographyDirectorAgent,
  validateTypographyDirectorAgentWithExecution,
  assertTypographyDirectorAgent,
  runTypographyDirectorAgent,
  isTypographyDirectorAgentFailure,
  getTypographyDirectorAgentModule,
  validateTypographyDirectorAgentBlueprint,
} from "./index";

function testAgentCatalog() {
  assert.equal(TYPOGRAPHY_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(TYPOGRAPHY_DIRECTOR_AGENT_VERSION, "7.17.0");
  assert.equal(TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(TYPOGRAPHY_DIRECTOR_AGENT_ID, TYPOGRAPHY_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, typography-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(TYPOGRAPHY_DIRECTOR_AGENT_GOLDEN_RULE.includes("less than one second"));
  assert.ok(TYPOGRAPHY_DIRECTOR_AGENT_MISSION.includes("text"));
  console.log("✔ golden rule — scan speed drives overlay typography");
}

function testPipelinePosition() {
  assert.equal(TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE[0].from, "material_director");
  assert.equal(TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE[0].to, "typography_director");
  assert.equal(TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE[1].to, "marketplace_director");
  console.log("✔ pipeline position — after material director, before marketplace director");
}

function testTypographyDirectorInputContract() {
  const input = buildDefaultTypographyDirectorAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.layoutBlueprint.textZones.length > 0);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.marketplaceProfile.id);
  assert.ok(input.knowledgePackage.rawPackage);
  console.log("✔ typography director input — story, layout, business model, marketplace, knowledge");
}

function testTypographyStrategySelector() {
  const input = buildBatterySprayerTypographyDirectorInput();
  const strategy = selectTypographyStrategy(input);
  assert.equal(strategy, "Bold Commercial");
  const font = selectTypographyFontCharacter(input);
  assert.equal(font, FontCharacter.GEOMETRIC);
  const score = scoreTypographyCandidateForStory("Bold Commercial", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ typography strategy selector — bold commercial geometric for garden sprayer");
}

function testHierarchyBuilder() {
  const input = buildBatterySprayerTypographyDirectorInput();
  const hierarchy = buildTextHierarchy(input);
  assert.equal(hierarchy[0].level, 1);
  assert.equal(hierarchy[0].role, "headline");
  assert.ok(hierarchy[1].role === "primary_benefit");
  assert.ok(hierarchy.length >= 3);
  console.log("✔ hierarchy builder — single dominant headline with benefit levels");
}

function testReadabilityEngine() {
  const input = buildBatterySprayerTypographyDirectorInput();
  const section = buildTypographySection(input, {}, 0.93);
  const hierarchy = buildTextHierarchy(input);
  assert.ok(section.headlineWordCount >= 3);
  assert.ok(section.headlineWordCount <= 7);
  assert.ok(section.textDensity <= 0.3);
  assert.equal(validateTypographySupportsMarketplace(section.headlineWordCount, input.marketplaceProfile.id), true);
  console.log("✔ readability engine — 3–7 word headline for Wildberries scan speed");
}

function testTextLayoutAndContrast() {
  const input = buildBatterySprayerTypographyDirectorInput();
  const section = buildTypographySection(input, {}, 0.93);
  const blueprint = fromTypographySection(section, buildTextHierarchy(input), input, 0.93);
  assert.ok(blueprint.safeZones.length > 0);
  assert.ok(blueprint.contrastProfile.includes("5."));
  assert.ok(blueprint.fontFamily.length > 0);
  console.log("✔ text layout and contrast — safe zones with thumbnail-readable contrast");
}

function testTypographyBlueprintOutput() {
  const input = buildBatterySprayerTypographyDirectorInput();
  const section = buildTypographySection(input, {}, 0.93);
  const blueprint = fromTypographySection(section, buildTextHierarchy(input), input, 0.93);
  assert.ok(blueprint.headingStyle.includes("Bold Commercial"));
  assert.equal(hasMarketplaceHeadlineHierarchy(blueprint), true);
  assert.equal(validateTypographyDirectorAgentBlueprint(blueprint, input, section).length, 0);
  console.log("✔ typography blueprint — complete output for marketplace director");
}

function testModuleMapping() {
  assert.equal(mapTypographyDirectorModuleToStage(TypographyDirectorAgentModule.READABILITY_ENGINE), "readability");
  const mod = getTypographyDirectorAgentModule(TypographyDirectorAgentModule.HIERARCHY_BUILDER)!;
  assert.equal(mod.order, 2);
  console.log("✔ internal modules map to Ch 5.11 typography knowledge stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeTypographyDirectorAgent({
    agentInput: buildBatterySprayerTypographyDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, TYPOGRAPHY_DIRECTOR_ID);
  assert.equal(report.photoExcluded, true);
  assert.equal(report.materialExcluded, true);
  assert.equal(hasMarketplaceHeadlineHierarchy(report.blueprint!), true);
  assert.ok(countHeadlineWords(report.blueprint!) <= 7);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer bold commercial typography blueprint");
}

async function testRetryOnPoorReadability() {
  const report = await executeTypographyDirectorAgent({
    agentInput: buildBatterySprayerTypographyDirectorInput(),
    context: { poorReadability: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "hierarchy_readability_layout");
  assert.ok(countHeadlineWords(report.blueprint!) <= 7);
  console.log("✔ retry logic — hierarchy builder, readability engine, text layout planner");
}

async function testRetryOnLowContrast() {
  const report = await executeTypographyDirectorAgent({
    agentInput: buildBatterySprayerTypographyDirectorInput(),
    context: { lowContrastScore: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.blueprint!.contrastProfile.includes("5."));
  console.log("✔ retry logic — recovers contrast for marketplace thumbnail readability");
}

async function testPipelineHandoff() {
  const report = await executeTypographyDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerTypographyDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — typography blueprint for marketplace director");
}

async function testKpis() {
  const report = await executeTypographyDirectorAgent({
    agentInput: buildBatterySprayerTypographyDirectorInput(),
  });
  assert.ok(report.kpis.readabilityScore > 0);
  assert.ok(report.kpis.hierarchyQuality > 0);
  assert.ok(report.kpis.overlaySafety > 0);
  console.log("✔ performance metrics — readability, hierarchy, overlay safety KPIs");
}

async function testValidateWithExecution() {
  const report = await validateTypographyDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertTypographyDirectorAgent();
  console.log("✔ full typography director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runTypographyDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runTypographyDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isTypographyDirectorAgentFailure("POOR_READABILITY"), true);
  assert.equal(isTypographyDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ typography director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testTypographyDirectorInputContract();
  testTypographyStrategySelector();
  testHierarchyBuilder();
  testReadabilityEngine();
  testTextLayoutAndContrast();
  testTypographyBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnPoorReadability();
  await testRetryOnLowContrast();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\ntypography-director-agent.spec.ts — all passed");
}

run();

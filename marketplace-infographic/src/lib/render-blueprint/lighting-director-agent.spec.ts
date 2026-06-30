/**
 * DESIGN AI v18 — Lighting Director Agent tests (Chapter 7.14)
 */
import assert from "node:assert/strict";
import {
  LIGHTING_DIRECTOR_AGENT_VERSION,
  LIGHTING_DIRECTOR_AGENT_GOLDEN_RULE,
  LIGHTING_DIRECTOR_AGENT_MISSION,
  LIGHTING_DIRECTOR_AGENT_MODULES,
  LIGHTING_DIRECTOR_AGENT_PIPELINE,
  LIGHTING_DIRECTOR_AGENT_ID,
  LightingDirectorAgentModule,
  LightingScheme,
  formatLightingSchemeLabel,
  buildLightingDirectorContextFromAgentInput,
  fromLightingSection,
  computeReflectionQuality,
  validateLightingSupportsStory,
  scoreLightingCandidateForStory,
  hasNaturalOutdoorLighting,
  buildDefaultLightingDirectorAgentInput,
  buildBatterySprayerLightingDirectorInput,
  mapLightingDirectorModuleToStage,
  executeLightingDirectorAgent,
  executeLightingDirectorAgentWithPipeline,
  validateLightingDirectorAgent,
  validateLightingDirectorAgentWithExecution,
  assertLightingDirectorAgent,
  runLightingDirectorAgent,
  isLightingDirectorAgentFailure,
  getLightingDirectorAgentModule,
  buildLightingSection,
  validateLightingDirectorAgentBlueprint,
  LIGHTING_DIRECTOR_ID,
} from "./index";

function testAgentCatalog() {
  assert.equal(LIGHTING_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(LIGHTING_DIRECTOR_AGENT_VERSION, "7.14.0");
  assert.equal(LIGHTING_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(LIGHTING_DIRECTOR_AGENT_ID, LIGHTING_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, lighting-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(LIGHTING_DIRECTOR_AGENT_GOLDEN_RULE.includes("commercial psychology"));
  assert.ok(LIGHTING_DIRECTOR_AGENT_MISSION.includes("light"));
  console.log("✔ golden rule — light guides attention, not decoration");
}

function testPipelinePosition() {
  assert.equal(LIGHTING_DIRECTOR_AGENT_PIPELINE[0].from, "photography_director");
  assert.equal(LIGHTING_DIRECTOR_AGENT_PIPELINE[0].to, "lighting_director");
  assert.equal(LIGHTING_DIRECTOR_AGENT_PIPELINE[1].to, "camera_director");
  console.log("✔ pipeline position — after photography director, before camera director");
}

function testLightingDirectorInputContract() {
  const input = buildDefaultLightingDirectorAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.photographyBlueprint.photoStyle);
  assert.ok(input.productProfile.category);
  assert.ok(input.knowledgePackage.rawPackage);
  const ctx = buildLightingDirectorContextFromAgentInput(input);
  assert.ok(ctx.lightingIntent);
  assert.ok(ctx.photographyStyle);
  console.log("✔ lighting director input — story, scene, layout, photography, knowledge");
}

function testLightingStrategySelector() {
  const input = buildBatterySprayerLightingDirectorInput();
  const ctx = buildLightingDirectorContextFromAgentInput(input);
  const { section } = buildLightingSection(ctx, 0.93);
  assert.equal(section.lightingScheme, LightingScheme.NATURAL_WINDOW_LIGHT);
  assert.equal(formatLightingSchemeLabel(LightingScheme.NATURAL_WINDOW_LIGHT), "Outdoor Natural");
  const score = scoreLightingCandidateForStory("Outdoor Natural", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ lighting strategy selector — outdoor natural for garden sprayer");
}

function testKeyLightAndShadow() {
  const input = buildBatterySprayerLightingDirectorInput();
  const { section } = buildLightingSection(buildLightingDirectorContextFromAgentInput(input), 0.93);
  const blueprint = fromLightingSection(section, 0.94);
  assert.ok(blueprint.keyLight.length > 10);
  assert.ok(section.shadowProfile.contactShadow);
  assert.ok(blueprint.shadowStyle.includes("softness"));
  console.log("✔ key light and shadow engine — soft natural key with contact shadow");
}

function testColorTemperatureAndReflection() {
  const input = buildBatterySprayerLightingDirectorInput();
  const { section } = buildLightingSection(buildLightingDirectorContextFromAgentInput(input), 0.93);
  const blueprint = fromLightingSection(section, 0.94);
  assert.ok(blueprint.colorTemperature >= 4800);
  assert.ok(computeReflectionQuality(section) >= 0.65);
  assert.ok(blueprint.reflectionStyle.includes("specular") || blueprint.reflectionStyle.includes("natural"));
  console.log("✔ color temperature and reflection — daylight temperature with controlled highlights");
}

function testLightingBlueprintOutput() {
  const input = buildBatterySprayerLightingDirectorInput();
  const { section } = buildLightingSection(buildLightingDirectorContextFromAgentInput(input), 0.93);
  const blueprint = fromLightingSection(section, 0.93);
  assert.ok(blueprint.lightingPreset);
  assert.ok(blueprint.lightingMood);
  assert.equal(validateLightingSupportsStory(blueprint.lightingPreset, input.sceneBlueprint.sceneType), true);
  assert.equal(validateLightingDirectorAgentBlueprint(blueprint, input, section).length, 0);
  console.log("✔ lighting blueprint — complete output for camera and material directors");
}

function testModuleMapping() {
  assert.equal(mapLightingDirectorModuleToStage(LightingDirectorAgentModule.SHADOW_ENGINE), "shadow_profile");
  const mod = getLightingDirectorAgentModule(LightingDirectorAgentModule.KEY_LIGHT_PLANNER)!;
  assert.equal(mod.order, 2);
  console.log("✔ internal modules map to Ch 4.14 lighting stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeLightingDirectorAgent({
    agentInput: buildBatterySprayerLightingDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, LIGHTING_DIRECTOR_ID);
  assert.equal(report.cameraExcluded, true);
  assert.equal(hasNaturalOutdoorLighting(report.blueprint!), true);
  assert.ok(report.blueprint!.colorTemperature >= 4800);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer outdoor natural lighting blueprint");
}

async function testRetryOnArtificialLighting() {
  const report = await executeLightingDirectorAgent({
    agentInput: buildBatterySprayerLightingDirectorInput(),
    context: { artificialLighting: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "strategy_shadow_reflection");
  console.log("✔ retry logic — strategy selector, shadow engine, reflection controller");
}

async function testRetryOnMissingContactShadow() {
  const report = await executeLightingDirectorAgent({
    agentInput: buildBatterySprayerLightingDirectorInput(),
    context: { missingContactShadow: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.blueprint?.shadowStyle.includes("softness"));
  console.log("✔ retry logic — recovers contact shadow for cutout product");
}

async function testPipelineHandoff() {
  const report = await executeLightingDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerLightingDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — lighting blueprint for camera director");
}

function testKpis() {
  const report = executeLightingDirectorAgent({
    agentInput: buildBatterySprayerLightingDirectorInput(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.lightingRealism > 0);
    assert.ok(r.kpis.shadowQuality > 0);
    assert.ok(r.kpis.commercialTrust > 0);
    console.log("✔ performance metrics — realism, shadow, trust KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validateLightingDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertLightingDirectorAgent();
  console.log("✔ full lighting director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runLightingDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runLightingDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isLightingDirectorAgentFailure("ARTIFICIAL_LIGHTING"), true);
  assert.equal(isLightingDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ lighting director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testLightingDirectorInputContract();
  testLightingStrategySelector();
  testKeyLightAndShadow();
  testColorTemperatureAndReflection();
  testLightingBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnArtificialLighting();
  await testRetryOnMissingContactShadow();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nlighting-director-agent.spec.ts — all passed");
}

run();

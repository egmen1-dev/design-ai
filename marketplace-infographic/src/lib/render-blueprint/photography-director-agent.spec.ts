/**
 * DESIGN AI v18 — Photography Director Agent tests (Chapter 7.13)
 */
import assert from "node:assert/strict";
import {
  PHOTOGRAPHY_DIRECTOR_AGENT_VERSION,
  PHOTOGRAPHY_DIRECTOR_AGENT_GOLDEN_RULE,
  PHOTOGRAPHY_DIRECTOR_AGENT_MISSION,
  PHOTOGRAPHY_DIRECTOR_AGENT_MODULES,
  PHOTOGRAPHY_DIRECTOR_AGENT_PIPELINE,
  PHOTOGRAPHY_DIRECTOR_AGENT_ID,
  PhotographyDirectorAgentModule,
  CameraPreset,
  LensPreset,
  PlannedPhotographyStyle,
  formatPhotoStyleLabel,
  formatPerspectiveLabel,
  fromPlannedPhotographyBlueprint,
  deriveShootingType,
  computeRealismScore,
  validatePhotographySupportsStory,
  scorePhotographyCandidateForStory,
  isInUseWorkflowShooting,
  buildDefaultPhotographyDirectorAgentInput,
  buildBatterySprayerPhotographyDirectorInput,
  toPhotographyPlanningInput,
  mapPhotographyDirectorModuleToPlanningStage,
  executePhotographyDirectorAgent,
  executePhotographyDirectorAgentWithPipeline,
  validatePhotographyDirectorAgent,
  validatePhotographyDirectorAgentWithExecution,
  assertPhotographyDirectorAgent,
  runPhotographyDirectorAgent,
  isPhotographyDirectorAgentFailure,
  getPhotographyDirectorAgentModule,
  runPhotographyPlanningStage,
  buildPlannedPhotographyBlueprint,
  selectPhotographyStyle,
  validatePhotographyDirectorAgentBlueprint,
  COMMERCIAL_PHOTO_DIRECTOR_ID,
} from "./index";

function testAgentCatalog() {
  assert.equal(PHOTOGRAPHY_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(PHOTOGRAPHY_DIRECTOR_AGENT_VERSION, "7.13.0");
  assert.equal(PHOTOGRAPHY_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(PHOTOGRAPHY_DIRECTOR_AGENT_ID, COMMERCIAL_PHOTO_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, commercial photography agent");
}

function testGoldenRuleAndMission() {
  assert.ok(PHOTOGRAPHY_DIRECTOR_AGENT_GOLDEN_RULE.includes("believe the product"));
  assert.ok(PHOTOGRAPHY_DIRECTOR_AGENT_MISSION.includes("photographed"));
  console.log("✔ golden rule — professional photography trust, not AI art");
}

function testPipelinePosition() {
  assert.equal(PHOTOGRAPHY_DIRECTOR_AGENT_PIPELINE[0].from, "composition_director");
  assert.equal(PHOTOGRAPHY_DIRECTOR_AGENT_PIPELINE[0].to, "photography_director");
  assert.equal(PHOTOGRAPHY_DIRECTOR_AGENT_PIPELINE[1].to, "lighting_director");
  console.log("✔ pipeline position — after composition director, before lighting director");
}

function testPhotographyDirectorInputContract() {
  const input = buildDefaultPhotographyDirectorAgentInput();
  assert.ok(input.productProfile.category);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.knowledgePackage.rawPackage);
  const planning = toPhotographyPlanningInput(input);
  assert.ok(planning.composition.layoutPattern);
  assert.ok(planning.scene.location);
  console.log("✔ photography director input — story, scene, layout, knowledge");
}

function testPhotographyStyleSelector() {
  const input = buildBatterySprayerPhotographyDirectorInput();
  const planning = toPhotographyPlanningInput(input);
  const report = runPhotographyPlanningStage(planning);
  assert.equal(report.section!.photographyStyle, PlannedPhotographyStyle.MODERN_MARKETPLACE);
  assert.equal(formatPhotoStyleLabel(PlannedPhotographyStyle.MODERN_MARKETPLACE), "Outdoor Commercial");
  const score = scorePhotographyCandidateForStory("Outdoor Commercial", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ photography style selector — outdoor commercial for garden sprayer");
}

function testCommercialShootingEngine() {
  const input = buildBatterySprayerPhotographyDirectorInput();
  const planning = toPhotographyPlanningInput(input);
  const planned = buildPlannedPhotographyBlueprint(planning);
  const blueprint = fromPlannedPhotographyBlueprint(
    planned,
    selectPhotographyStyle(planning),
    input,
    0.94,
  );
  assert.equal(isInUseWorkflowShooting(blueprint.shootingType), true);
  assert.equal(/catalog/i.test(blueprint.shootingType), false);
  assert.equal(validatePhotographySupportsStory(blueprint.shootingType, input.storyBlueprint.primaryMessage), true);
  console.log("✔ commercial shooting engine — in-use workflow, not catalog photography");
}

function testPerspectiveAndDepthOfField() {
  const input = buildBatterySprayerPhotographyDirectorInput();
  const planning = toPhotographyPlanningInput(input);
  const planned = buildPlannedPhotographyBlueprint(planning);
  const blueprint = fromPlannedPhotographyBlueprint(
    planned,
    PlannedPhotographyStyle.MODERN_MARKETPLACE,
    input,
    0.94,
  );
  assert.ok(formatPerspectiveLabel(planned.cameraAngle).includes("Quarter") || formatPerspectiveLabel(planned.cameraAngle).includes("Eye"));
  assert.ok(blueprint.depthOfField.includes("sharp"));
  assert.equal(planned.lens, LensPreset.LENS_35MM);
  assert.equal(planned.cameraPreset, CameraPreset.COMMERCIAL_LIFESTYLE);
  console.log("✔ perspective and depth of field — three-quarter view with sharp hero");
}

function testRealismController() {
  const input = buildBatterySprayerPhotographyDirectorInput();
  const planning = toPhotographyPlanningInput(input);
  const planned = buildPlannedPhotographyBlueprint(planning);
  const score = computeRealismScore(planned);
  assert.ok(score >= 0.7);
  const blueprint = fromPlannedPhotographyBlueprint(planned, PlannedPhotographyStyle.MODERN_MARKETPLACE, input, 0.94);
  assert.equal(blueprint.realismLevel, "high");
  console.log("✔ realism controller — high realism, no AI-artificial look");
}

function testPhotographyBlueprintOutput() {
  const input = buildBatterySprayerPhotographyDirectorInput();
  const report = runPhotographyPlanningStage(toPhotographyPlanningInput(input));
  const blueprint = fromPlannedPhotographyBlueprint(
    report.section!.plannedBlueprint,
    report.section!.photographyStyle,
    input,
    report.section!.confidence,
  );
  assert.ok(blueprint.photoStyle);
  assert.ok(blueprint.lensProfile);
  assert.ok(blueprint.commercialMood);
  assert.equal(validatePhotographyDirectorAgentBlueprint(blueprint, input, report.section!.plannedBlueprint).length, 0);
  console.log("✔ photography blueprint — complete output for lighting and camera directors");
}

function testModuleMapping() {
  assert.equal(
    mapPhotographyDirectorModuleToPlanningStage(PhotographyDirectorAgentModule.DEPTH_OF_FIELD_PLANNER),
    "depth_of_field",
  );
  const mod = getPhotographyDirectorAgentModule(PhotographyDirectorAgentModule.REALISM_CONTROLLER)!;
  assert.equal(mod.order, 5);
  console.log("✔ internal modules map to Ch 6.9 planning stages");
}

async function testKitchenSprayerExecution() {
  const report = await executePhotographyDirectorAgent({
    agentInput: buildBatterySprayerPhotographyDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, COMMERCIAL_PHOTO_DIRECTOR_ID);
  assert.equal(report.lightingExcluded, true);
  assert.ok(report.blueprint?.photoStyle.includes("Outdoor"));
  assert.equal(isInUseWorkflowShooting(report.blueprint!.shootingType), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer outdoor commercial photography");
}

async function testRetryOnArtificialPhotography() {
  const report = await executePhotographyDirectorAgent({
    agentInput: buildBatterySprayerPhotographyDirectorInput(),
    context: { artificialPhotography: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "style_perspective_realism");
  console.log("✔ retry logic — style selector, perspective planner, realism controller");
}

async function testRetryOnHeroLosesAdvantage() {
  const report = await executePhotographyDirectorAgent({
    agentInput: buildBatterySprayerPhotographyDirectorInput(),
    context: { heroLosesAdvantage: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.blueprint?.depthOfField.includes("sharp"));
  console.log("✔ retry logic — recovers hero dominance via depth of field");
}

async function testPipelineHandoff() {
  const report = await executePhotographyDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerPhotographyDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — photography blueprint for lighting director");
}

function testKpis() {
  const report = executePhotographyDirectorAgent({
    agentInput: buildBatterySprayerPhotographyDirectorInput(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.realismScore > 0);
    assert.ok(r.kpis.commercialPhotographyScore > 0);
    assert.ok(r.kpis.heroVisibility > 0);
    console.log("✔ performance metrics — realism, trust, hero visibility KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validatePhotographyDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertPhotographyDirectorAgent();
  console.log("✔ full photography director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runPhotographyDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runPhotographyDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isPhotographyDirectorAgentFailure("ARTIFICIAL_PHOTOGRAPHY"), true);
  assert.equal(isPhotographyDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ photography director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testPhotographyDirectorInputContract();
  testPhotographyStyleSelector();
  testCommercialShootingEngine();
  testPerspectiveAndDepthOfField();
  testRealismController();
  testPhotographyBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnArtificialPhotography();
  await testRetryOnHeroLosesAdvantage();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nphotography-director-agent.spec.ts — all passed");
}

run();

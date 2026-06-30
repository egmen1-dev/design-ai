/**
 * DESIGN AI v18 — Camera Director Agent tests (Chapter 7.15)
 */
import assert from "node:assert/strict";
import {
  CAMERA_DIRECTOR_AGENT_VERSION,
  CAMERA_DIRECTOR_AGENT_GOLDEN_RULE,
  CAMERA_DIRECTOR_AGENT_MISSION,
  CAMERA_DIRECTOR_AGENT_MODULES,
  CAMERA_DIRECTOR_AGENT_PIPELINE,
  CAMERA_DIRECTOR_AGENT_ID,
  CameraDirectorAgentModule,
  CameraStyle,
  CameraAngleStyle,
  formatCameraStyleLabel,
  focalLengthToFieldOfView,
  buildCameraDirectorContextFromAgentInput,
  fromCameraSection,
  validateCameraSupportsStory,
  scoreCameraCandidateForStory,
  isThreeQuarterGardenAngle,
  buildDefaultCameraDirectorAgentInput,
  buildBatterySprayerCameraDirectorInput,
  mapCameraDirectorModuleToStage,
  executeCameraDirectorAgent,
  executeCameraDirectorAgentWithPipeline,
  validateCameraDirectorAgent,
  validateCameraDirectorAgentWithExecution,
  assertCameraDirectorAgent,
  runCameraDirectorAgent,
  isCameraDirectorAgentFailure,
  getCameraDirectorAgentModule,
  buildCameraSection,
  validateCameraDirectorAgentBlueprint,
  CAMERA_DIRECTOR_ID,
} from "./index";

function testAgentCatalog() {
  assert.equal(CAMERA_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(CAMERA_DIRECTOR_AGENT_VERSION, "7.15.0");
  assert.equal(CAMERA_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(CAMERA_DIRECTOR_AGENT_ID, CAMERA_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, camera-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(CAMERA_DIRECTOR_AGENT_GOLDEN_RULE.includes("single correct viewpoint"));
  assert.ok(CAMERA_DIRECTOR_AGENT_MISSION.includes("buyer"));
  console.log("✔ golden rule — viewpoint defines product perception");
}

function testPipelinePosition() {
  assert.equal(CAMERA_DIRECTOR_AGENT_PIPELINE[0].from, "lighting_director");
  assert.equal(CAMERA_DIRECTOR_AGENT_PIPELINE[0].to, "camera_director");
  assert.equal(CAMERA_DIRECTOR_AGENT_PIPELINE[1].to, "material_director");
  console.log("✔ pipeline position — after lighting director, before material director");
}

function testCameraDirectorInputContract() {
  const input = buildDefaultCameraDirectorAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.photographyBlueprint.photoStyle);
  assert.ok(input.lightingBlueprint.lightingPreset);
  assert.ok(input.productProfile.category);
  assert.ok(input.knowledgePackage.rawPackage);
  const ctx = buildCameraDirectorContextFromAgentInput(input);
  assert.ok(ctx.cameraIntent);
  assert.ok(ctx.photographyStyle);
  console.log("✔ camera director input — story, scene, layout, photography, lighting, knowledge");
}

function testCameraStrategySelector() {
  const input = buildBatterySprayerCameraDirectorInput();
  const ctx = buildCameraDirectorContextFromAgentInput(input);
  const { section } = buildCameraSection(ctx, 0.93);
  assert.equal(section.cameraStyle, CameraStyle.LIFESTYLE_CONTEXT);
  assert.equal(formatCameraStyleLabel(section.cameraStyle), "Three Quarter View");
  const score = scoreCameraCandidateForStory("Three Quarter View", input.storyBlueprint.storyPattern);
  assert.ok(score > 0.9);
  console.log("✔ camera strategy selector — three quarter lifestyle for garden sprayer");
}

function testAnglePlanner() {
  const input = buildBatterySprayerCameraDirectorInput();
  const { section } = buildCameraSection(buildCameraDirectorContextFromAgentInput(input), 0.93);
  assert.equal(section.cameraAngle, CameraAngleStyle.THREE_QUARTER);
  assert.notEqual(section.cameraAngle, CameraAngleStyle.TOP);
  const blueprint = fromCameraSection(section, input, 0.93);
  assert.equal(blueprint.cameraAngle, 20);
  console.log("✔ angle planner — three quarter 20° reveals tank, straps, and volume");
}

function testLensSelector() {
  const input = buildBatterySprayerCameraDirectorInput();
  const { section } = buildCameraSection(buildCameraDirectorContextFromAgentInput(input), 0.93);
  const blueprint = fromCameraSection(section, input, 0.93);
  assert.equal(section.focalLength, 35);
  assert.equal(blueprint.lensFocalLength, 35);
  assert.ok(blueprint.fieldOfView >= 40 && blueprint.fieldOfView <= 70);
  assert.equal(focalLengthToFieldOfView(35), blueprint.fieldOfView);
  console.log("✔ lens selector — 35mm dynamic perspective for outdoor garden product");
}

function testPerspectiveAndFraming() {
  const input = buildBatterySprayerCameraDirectorInput();
  const { section } = buildCameraSection(buildCameraDirectorContextFromAgentInput(input), 0.93);
  const blueprint = fromCameraSection(section, input, 0.93);
  assert.ok(blueprint.perspectiveType.length > 0);
  assert.ok(blueprint.framing.length > 0);
  assert.ok(section.heroScale >= 0.35);
  assert.ok(validateCameraSupportsStory(blueprint.cameraAngle, input.sceneBlueprint.sceneType));
  assert.equal(isThreeQuarterGardenAngle(blueprint), true);
  console.log("✔ perspective and framing — trustworthy geometry with readable hero scale");
}

function testCameraBlueprintOutput() {
  const input = buildBatterySprayerCameraDirectorInput();
  const { section } = buildCameraSection(buildCameraDirectorContextFromAgentInput(input), 0.93);
  const blueprint = fromCameraSection(section, input, 0.93);
  assert.ok(blueprint.cameraType);
  assert.ok(blueprint.cameraPosition.x !== 0 || blueprint.cameraPosition.z !== 0);
  assert.ok(blueprint.focusPoint.x > 0);
  assert.equal(validateCameraDirectorAgentBlueprint(blueprint, input, section).length, 0);
  console.log("✔ camera blueprint — complete output for material director and render adapter");
}

function testModuleMapping() {
  assert.equal(mapCameraDirectorModuleToStage(CameraDirectorAgentModule.LENS_SELECTOR), "focal_length");
  const mod = getCameraDirectorAgentModule(CameraDirectorAgentModule.ANGLE_PLANNER)!;
  assert.equal(mod.order, 2);
  console.log("✔ internal modules map to Ch 4.15 camera stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeCameraDirectorAgent({
    agentInput: buildBatterySprayerCameraDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, CAMERA_DIRECTOR_ID);
  assert.equal(report.materialExcluded, true);
  assert.ok(report.blueprint!.lensFocalLength >= 35);
  assert.ok(report.blueprint!.cameraAngle >= 15);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer three quarter camera blueprint");
}

async function testRetryOnTopDownAngle() {
  const report = await executeCameraDirectorAgent({
    agentInput: buildBatterySprayerCameraDirectorInput(),
    context: { topDownAngle: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "strategy_lens_perspective");
  assert.notEqual(report.cameraSection?.cameraAngle, CameraAngleStyle.TOP);
  console.log("✔ retry logic — strategy selector, lens selector, perspective controller");
}

async function testRetryOnAwkwardLens() {
  const report = await executeCameraDirectorAgent({
    agentInput: buildBatterySprayerCameraDirectorInput(),
    context: { awkwardLens: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.blueprint!.lensFocalLength < 100);
  console.log("✔ retry logic — recovers from macro lens mismatch for garden story");
}

async function testPipelineHandoff() {
  const report = await executeCameraDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerCameraDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — camera blueprint for material director");
}

async function testKpis() {
  const report = await executeCameraDirectorAgent({
    agentInput: buildBatterySprayerCameraDirectorInput(),
  });
  assert.ok(report.kpis.perspectiveAccuracy > 0);
  assert.ok(report.kpis.productReadability > 0);
  assert.ok(report.kpis.commercialTrust > 0);
  console.log("✔ performance metrics — perspective, readability, trust KPIs");
}

async function testValidateWithExecution() {
  const report = await validateCameraDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertCameraDirectorAgent();
  console.log("✔ full camera director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runCameraDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runCameraDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isCameraDirectorAgentFailure("TOP_VIEW_MISMATCH"), true);
  assert.equal(isCameraDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ camera director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testCameraDirectorInputContract();
  testCameraStrategySelector();
  testAnglePlanner();
  testLensSelector();
  testPerspectiveAndFraming();
  testCameraBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnTopDownAngle();
  await testRetryOnAwkwardLens();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\ncamera-director-agent.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Material Director Agent tests (Chapter 7.16)
 */
import assert from "node:assert/strict";
import {
  MATERIAL_DIRECTOR_AGENT_VERSION,
  MATERIAL_DIRECTOR_AGENT_GOLDEN_RULE,
  MATERIAL_DIRECTOR_AGENT_MISSION,
  MATERIAL_DIRECTOR_AGENT_MODULES,
  MATERIAL_DIRECTOR_AGENT_PIPELINE,
  MATERIAL_DIRECTOR_AGENT_ID,
  MaterialDirectorAgentModule,
  MaterialWorld,
  ReflectionProfile,
  detectProductMaterials,
  formatWearLevel,
  formatCleanlinessLevel,
  computeMaterialRealismScore,
  buildMaterialDirectorContextFromAgentInput,
  fromMaterialSection,
  validateMaterialSupportsLighting,
  scoreMaterialCandidateForStory,
  hasSprayerProductMaterials,
  buildDefaultMaterialDirectorAgentInput,
  buildBatterySprayerMaterialDirectorInput,
  mapMaterialDirectorModuleToStage,
  executeMaterialDirectorAgent,
  executeMaterialDirectorAgentWithPipeline,
  validateMaterialDirectorAgent,
  validateMaterialDirectorAgentWithExecution,
  assertMaterialDirectorAgent,
  runMaterialDirectorAgent,
  isMaterialDirectorAgentFailure,
  getMaterialDirectorAgentModule,
  buildMaterialSection,
  validateMaterialDirectorAgentBlueprint,
  MATERIAL_DIRECTOR_ID,
} from "./index";

function testAgentCatalog() {
  assert.equal(MATERIAL_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(MATERIAL_DIRECTOR_AGENT_VERSION, "7.16.0");
  assert.equal(MATERIAL_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(MATERIAL_DIRECTOR_AGENT_ID, MATERIAL_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, material-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(MATERIAL_DIRECTOR_AGENT_GOLDEN_RULE.includes("physically believable"));
  assert.ok(MATERIAL_DIRECTOR_AGENT_MISSION.includes("materials"));
  console.log("✔ golden rule — materials must feel real, not CGI");
}

function testPipelinePosition() {
  assert.equal(MATERIAL_DIRECTOR_AGENT_PIPELINE[0].from, "camera_director");
  assert.equal(MATERIAL_DIRECTOR_AGENT_PIPELINE[0].to, "material_director");
  assert.equal(MATERIAL_DIRECTOR_AGENT_PIPELINE[1].to, "render_adapter");
  console.log("✔ pipeline position — after camera director, before render adapter");
}

function testMaterialDirectorInputContract() {
  const input = buildDefaultMaterialDirectorAgentInput();
  assert.ok(input.sceneBlueprint.environment);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.photographyBlueprint.photoStyle);
  assert.ok(input.lightingBlueprint.lightingPreset);
  assert.ok(input.cameraBlueprint.cameraType);
  assert.ok(input.productProfile.category);
  assert.ok(input.knowledgePackage.rawPackage);
  const ctx = buildMaterialDirectorContextFromAgentInput(input);
  assert.ok(ctx.materialIntent);
  assert.ok(ctx.photographyStyle);
  console.log("✔ material director input — scene, layout, photography, lighting, camera, knowledge");
}

function testMaterialDetector() {
  const input = buildBatterySprayerMaterialDirectorInput();
  const materials = detectProductMaterials(input);
  assert.equal(materials.length, 5);
  assert.ok(materials.some((m) => m.name === "ABS Plastic"));
  assert.ok(materials.some((m) => m.name === "Rubber"));
  assert.ok(materials.some((m) => m.name === "Polyethylene Tank"));
  const score = scoreMaterialCandidateForStory("Natural Professional", "Problem Solution");
  assert.ok(score > 0.9);
  console.log("✔ material detector — sprayer ABS, rubber, tank, metal, PVC hose");
}

function testSurfaceAnalyzerAndReflection() {
  const input = buildBatterySprayerMaterialDirectorInput();
  const { section } = buildMaterialSection(buildMaterialDirectorContextFromAgentInput(input), 0.93);
  const materials = detectProductMaterials(input);
  const blueprint = fromMaterialSection(section, materials, input, 0.93);
  assert.ok(blueprint.surfaceQuality.includes("Matte") || blueprint.surfaceQuality.includes("Natural"));
  assert.equal(section.reflectionProfile, ReflectionProfile.MATTE);
  assert.equal(validateMaterialSupportsLighting(blueprint.reflectionProfile, input.lightingBlueprint.lightingPreset), true);
  console.log("✔ surface analyzer and reflection — matte plastic with soft outdoor reflections");
}

function testTextureAndWear() {
  const input = buildBatterySprayerMaterialDirectorInput();
  const { section } = buildMaterialSection(buildMaterialDirectorContextFromAgentInput(input), 0.93);
  const blueprint = fromMaterialSection(section, detectProductMaterials(input), input, 0.93);
  assert.ok(blueprint.microTexture.length > 0);
  assert.equal(formatWearLevel(input), "Brand New");
  assert.equal(formatCleanlinessLevel({}), "Factory Clean");
  assert.ok(computeMaterialRealismScore(section, blueprint.materials, {}, true) >= 0.85);
  console.log("✔ texture and wear — brand new factory clean with natural micro-texture");
}

function testMaterialBlueprintOutput() {
  const input = buildBatterySprayerMaterialDirectorInput();
  const { section } = buildMaterialSection(buildMaterialDirectorContextFromAgentInput(input), 0.93);
  const materials = detectProductMaterials(input);
  const blueprint = fromMaterialSection(section, materials, input, 0.93);
  assert.equal(section.materialWorld, MaterialWorld.NATURAL_WARM);
  assert.equal(hasSprayerProductMaterials(blueprint), true);
  assert.ok(blueprint.realismScore >= 0.85);
  assert.equal(validateMaterialDirectorAgentBlueprint(blueprint, input, section).length, 0);
  console.log("✔ material blueprint — complete output for render adapter and vision critic");
}

function testModuleMapping() {
  assert.equal(mapMaterialDirectorModuleToStage(MaterialDirectorAgentModule.REFLECTION_PLANNER), "reflection_profile");
  const mod = getMaterialDirectorAgentModule(MaterialDirectorAgentModule.MATERIAL_DETECTOR)!;
  assert.equal(mod.order, 1);
  console.log("✔ internal modules map to Ch 4.16 material stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeMaterialDirectorAgent({
    agentInput: buildBatterySprayerMaterialDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, MATERIAL_DIRECTOR_ID);
  assert.equal(report.lightingExcluded, true);
  assert.equal(report.cameraExcluded, true);
  assert.equal(hasSprayerProductMaterials(report.blueprint!), true);
  assert.ok(report.blueprint!.realismScore >= 0.85);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer multi-material blueprint");
}

async function testRetryOnArtificialMaterials() {
  const report = await executeMaterialDirectorAgent({
    agentInput: buildBatterySprayerMaterialDirectorInput(),
    context: { artificialMaterials: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "detector_reflection_texture");
  assert.equal(report.blueprint!.cleanlinessLevel, "Factory Clean");
  console.log("✔ retry logic — material detector, reflection planner, texture controller");
}

async function testRetryOnPlasticLooksMetallic() {
  const report = await executeMaterialDirectorAgent({
    agentInput: buildBatterySprayerMaterialDirectorInput(),
    context: { plasticLooksMetallic: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(!report.blueprint!.materials.some((m) => m.name.includes("Plastic") && m.reflection.includes("metallic")));
  console.log("✔ retry logic — recovers from plastic-as-metal reflection mismatch");
}

async function testPipelineHandoff() {
  const report = await executeMaterialDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerMaterialDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — material blueprint for render adapter");
}

async function testKpis() {
  const report = await executeMaterialDirectorAgent({
    agentInput: buildBatterySprayerMaterialDirectorInput(),
  });
  assert.ok(report.kpis.materialRealism > 0);
  assert.ok(report.kpis.reflectionAccuracy > 0);
  assert.ok(report.kpis.productTrust > 0);
  console.log("✔ performance metrics — realism, reflection, trust KPIs");
}

async function testValidateWithExecution() {
  const report = await validateMaterialDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertMaterialDirectorAgent();
  console.log("✔ full material director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runMaterialDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runMaterialDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isMaterialDirectorAgentFailure("PLASTIC_LOOKS_METALLIC"), true);
  assert.equal(isMaterialDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ material director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testMaterialDirectorInputContract();
  testMaterialDetector();
  testSurfaceAnalyzerAndReflection();
  testTextureAndWear();
  testMaterialBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnArtificialMaterials();
  await testRetryOnPlasticLooksMetallic();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nmaterial-director-agent.spec.ts — all passed");
}

run();

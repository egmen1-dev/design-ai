/**
 * DESIGN AI v18 — Product Analysis Agent tests (Chapter 7.7)
 */
import assert from "node:assert/strict";
import {
  PRODUCT_ANALYSIS_AGENT_VERSION,
  PRODUCT_ANALYSIS_AGENT_GOLDEN_RULE,
  PRODUCT_ANALYSIS_AGENT_MISSION,
  PRODUCT_ANALYSIS_AGENT_MODULES,
  PRODUCT_ANALYSIS_AGENT_PIPELINE,
  ProductAnalysisAgentModule,
  buildDefaultProductAnalysisAgentInput,
  buildBatterySprayerAgentInput,
  toPipelineProductAnalysisInput,
  transformSpecificationToAdvantage,
  extractAdvantagesFromSpecifications,
  buildAudienceConfidenceScores,
  toProductAnalysisAgentProfile,
  validateProductAnalysisAgentProfile,
  mapModuleToPipelineStage,
  executeProductAnalysisAgent,
  executeProductAnalysisAgentWithPipeline,
  validateProductAnalysisAgent,
  validateProductAnalysisAgentWithExecution,
  assertProductAnalysisAgent,
  runProductAnalysisAgent,
  isProductAnalysisAgentFailure,
  getProductAnalysisAgentModule,
  getReadyAgents,
  PRODUCT_ANALYZER_ID,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
} from "./index";

function testAgentCatalog() {
  assert.equal(PRODUCT_ANALYSIS_AGENT_MODULES.length, 7);
  assert.equal(PRODUCT_ANALYSIS_AGENT_VERSION, "7.7.0");
  assert.equal(PRODUCT_ANALYSIS_AGENT_PIPELINE.length, 4);
  console.log("✔ agent catalog — 7 internal modules and pipeline position");
}

function testGoldenRuleAndMission() {
  assert.ok(PRODUCT_ANALYSIS_AGENT_GOLDEN_RULE.includes("analyzes the product"));
  assert.ok(PRODUCT_ANALYSIS_AGENT_MISSION.includes("What exactly are we selling"));
  console.log("✔ golden rule — analyzes product, not image; mission is commercial understanding");
}

function testFirstAgentInPipeline() {
  const ready = getReadyAgents({ completedAgents: [] });
  assert.equal(ready[0], PRODUCT_ANALYZER_ID);
  console.log("✔ pipeline position — product analysis agent runs first");
}

function testAgentInputContract() {
  const input = buildDefaultProductAnalysisAgentInput();
  assert.ok(input.title);
  assert.ok(input.productImages.length > 0);
  assert.ok(input.specifications.length > 0);
  const pipeline = toPipelineProductAnalysisInput(input);
  assert.equal(pipeline.productImageRef, input.productImages[0].url);
  console.log("✔ input contract — title, specs, images map to pipeline analysis input");
}

function testFeatureExtractor() {
  assert.equal(transformSpecificationToAdvantage({ key: "tank_volume", value: "16", unit: "L" }), "large tank capacity");
  assert.equal(transformSpecificationToAdvantage({ key: "battery", value: "12", unit: "V" }), "autonomous battery operation");
  const advantages = extractAdvantagesFromSpecifications([
    { key: "power", value: "1200", unit: "W" },
  ]);
  assert.ok(advantages[0].includes("powerful") || advantages[0].includes("1200"));
  console.log("✔ feature extractor — specifications become user-facing advantages");
}

function testAudienceAnalyzer() {
  const scores = buildAudienceConfidenceScores(["garden owners", "farmers", "landscapers"]);
  assert.equal(scores.length, 3);
  assert.ok(scores[0].confidence >= scores[1].confidence);
  console.log("✔ audience analyzer — segments with confidence scores");
}

function testProductProfileOutput() {
  const analysis = analyzeProduct(buildDefaultProductAnalysisInput());
  const profile = toProductAnalysisAgentProfile(analysis.section!.profile, ["premium motor"]);
  assert.ok(profile.category);
  assert.ok(profile.advantages.length > 0);
  assert.ok(profile.painPoints.length > 0);
  assert.ok(profile.useCases.length > 0);
  assert.equal(validateProductAnalysisAgentProfile(profile).length, 0);
  console.log("✔ product profile — complete structured output for pipeline");
}

function testModuleMapping() {
  assert.equal(mapModuleToPipelineStage(ProductAnalysisAgentModule.CATEGORY_DETECTOR), "category_recognition");
  const mod = getProductAnalysisAgentModule(ProductAnalysisAgentModule.PAIN_POINT_DETECTOR)!;
  assert.equal(mod.order, 4);
  console.log("✔ internal modules map to Ch 6.3 pipeline stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeProductAnalysisAgent({
    agentInput: buildBatterySprayerAgentInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, PRODUCT_ANALYZER_ID);
  assert.equal(report.modulesCompleted.length, 7);
  assert.equal(report.profile?.subcategory, "Battery Sprayer");
  assert.ok(report.profile?.painPoints.some((p) => p.includes("pump") || p.includes("fatigue")));
  assert.ok(report.profile?.useCases.includes("garden"));
  assert.ok(report.profile?.advantages.some((a) => a.includes("tank") || a.includes("battery")));
  assert.equal(report.designExcluded, true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer product understanding");
}

async function testRetryOnLowConfidence() {
  const report = await executeProductAnalysisAgent({
    agentInput: buildBatterySprayerAgentInput(),
    context: { lowConfidence: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  console.log("✔ retry logic — category, feature, audience re-run on low confidence");
}

async function testAmbiguousCategoryRetry() {
  const report = await executeProductAnalysisAgent({
    agentInput: buildBatterySprayerAgentInput(),
    context: { forceAmbiguousCategory: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  console.log("✔ retry logic — recovers from ambiguous category detection");
}

async function testPipelineHandoff() {
  const report = await executeProductAnalysisAgentWithPipeline({
    agentInput: buildBatterySprayerAgentInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — data flows to story director via pipeline context");
}

function testKpis() {
  const report = executeProductAnalysisAgent({
    agentInput: buildBatterySprayerAgentInput(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.accuracyCategory > 0);
    assert.ok(r.kpis.confidenceScore > 0);
    console.log("✔ performance metrics — category accuracy, confidence, retry rate KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validateProductAnalysisAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.firstAgentInPipeline, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertProductAnalysisAgent();
  console.log("✔ full product analysis agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runProductAnalysisAgent();
  assert.equal(report.valid, true);
  console.log("✔ runProductAnalysisAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isProductAnalysisAgentFailure("LOW_CONFIDENCE"), true);
  assert.equal(isProductAnalysisAgentFailure("UNKNOWN"), false);
  console.log("✔ product analysis agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testFirstAgentInPipeline();
  testAgentInputContract();
  testFeatureExtractor();
  testAudienceAnalyzer();
  testProductProfileOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnLowConfidence();
  await testAmbiguousCategoryRetry();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nproduct-analysis-agent.spec.ts — all passed");
}

run();

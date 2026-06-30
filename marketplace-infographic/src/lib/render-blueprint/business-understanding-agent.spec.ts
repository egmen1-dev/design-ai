/**
 * DESIGN AI v18 — Business Understanding Agent tests (Chapter 7.8)
 */
import assert from "node:assert/strict";
import {
  BUSINESS_UNDERSTANDING_AGENT_VERSION,
  BUSINESS_UNDERSTANDING_AGENT_GOLDEN_RULE,
  BUSINESS_UNDERSTANDING_AGENT_MISSION,
  BUSINESS_UNDERSTANDING_AGENT_MODULES,
  BUSINESS_UNDERSTANDING_AGENT_PIPELINE,
  BUSINESS_UNDERSTANDING_AGENT_ID,
  BusinessUnderstandingAgentModule,
  buildDefaultBusinessUnderstandingAgentInput,
  buildBatterySprayerBusinessAgentInput,
  toPipelineBusinessUnderstandingInput,
  fromPipelineBusinessModel,
  validateBusinessUnderstandingAgentModel,
  mapModuleToBusinessStage,
  transformCharacteristicToCommercialValue,
  executeBusinessUnderstandingAgent,
  executeBusinessUnderstandingAgentWithPipeline,
  validateBusinessUnderstandingAgent,
  validateBusinessUnderstandingAgentWithExecution,
  assertBusinessUnderstandingAgent,
  runBusinessUnderstandingAgent,
  isBusinessUnderstandingAgentFailure,
  getBusinessUnderstandingAgentModule,
  runBusinessUnderstandingStage,
  transformFeaturesToBenefits,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
} from "./index";

function testAgentCatalog() {
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_MODULES.length, 7);
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_VERSION, "7.8.0");
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_PIPELINE.length, 3);
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_ID, "business-understanding");
  console.log("✔ agent catalog — 7 internal modules and pipeline position");
}

function testGoldenRuleAndMission() {
  assert.ok(BUSINESS_UNDERSTANDING_AGENT_GOLDEN_RULE.includes("solution to their problem"));
  assert.ok(BUSINESS_UNDERSTANDING_AGENT_MISSION.includes("Why should a person want to buy"));
  console.log("✔ golden rule — buyers purchase outcomes and emotions, not specs");
}

function testPipelinePosition() {
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_PIPELINE[0].from, "product_analysis_agent");
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_PIPELINE[0].to, "business_understanding_agent");
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_PIPELINE[1].to, "knowledge_retrieval");
  assert.equal(BUSINESS_UNDERSTANDING_AGENT_PIPELINE[2].to, "story_director");
  console.log("✔ pipeline position — follows product analysis, precedes story director");
}

function testAgentInputContract() {
  const input = buildDefaultBusinessUnderstandingAgentInput();
  assert.ok(input.productProfile.category);
  assert.ok(input.knowledgePackage.rawPackage);
  assert.ok(input.marketplaceProfile.id);
  const pipeline = toPipelineBusinessUnderstandingInput(input);
  assert.equal(pipeline.profile.category, input.productProfile.category);
  assert.equal(pipeline.marketplace, input.marketplaceProfile.id);
  console.log("✔ input contract — product profile, knowledge package, marketplace profile");
}

function testValueAnalyzer() {
  const analysis = analyzeProduct(
    buildDefaultProductAnalysisInput({ category: "garden_tools", marketplace: "wildberries" }),
  );
  const chains = transformFeaturesToBenefits(analysis.section!.profile);
  assert.ok(chains.length > 0);
  const battery = chains.find((c) => c.feature.toLowerCase().includes("battery"));
  assert.ok(battery);
  assert.ok(
    battery!.customerValue.includes("time") ||
      battery!.customerValue.includes("effort") ||
      battery!.customerValue.includes("strain"),
  );
  const mapped = transformCharacteristicToCommercialValue("8 Ah battery", "several hours of autonomous operation");
  assert.ok(mapped.commercialValue.includes("time") || mapped.commercialValue.includes("effort"));
  console.log("✔ value analyzer — characteristics become user benefits and commercial value");
}

function testBusinessModelOutput() {
  const input = buildBatterySprayerBusinessAgentInput();
  const stage = runBusinessUnderstandingStage(toPipelineBusinessUnderstandingInput(input));
  const model = fromPipelineBusinessModel(stage.section!.model, stage.section);
  assert.ok(model.primaryValue);
  assert.ok(model.painPoints.length > 0);
  assert.ok(model.customerGoals.length > 0);
  assert.ok(model.purchaseMotivations.length > 0);
  assert.ok(model.businessStrategy);
  assert.ok(model.emotionalPositioning);
  assert.equal(validateBusinessUnderstandingAgentModel(model).length, 0);
  console.log("✔ business model — complete commercial strategy output");
}

function testModuleMapping() {
  assert.equal(mapModuleToBusinessStage(BusinessUnderstandingAgentModule.VALUE_ANALYZER), "feature_transformation");
  const mod = getBusinessUnderstandingAgentModule(BusinessUnderstandingAgentModule.EMOTIONAL_MAPPER)!;
  assert.equal(mod.order, 4);
  console.log("✔ internal modules map to Ch 6.5 pipeline stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeBusinessUnderstandingAgent({
    agentInput: buildBatterySprayerBusinessAgentInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, BUSINESS_UNDERSTANDING_AGENT_ID);
  assert.equal(report.modulesCompleted.length, 7);
  assert.ok(report.model?.primaryValue);
  assert.ok(report.model?.painPoints.length >= 3);
  assert.ok(report.model?.businessStrategy.includes("Problem"));
  assert.equal(report.designExcluded, true);
  assert.equal(report.valueOverSpecs, true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer commercial strategy");
}

async function testRetryOnLowEmotionalConfidence() {
  const report = await executeBusinessUnderstandingAgent({
    agentInput: buildBatterySprayerBusinessAgentInput(),
    context: { lowEmotionalConfidence: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "emotional_mapper");
  console.log("✔ retry logic — emotional mapper → strategy builder → business model builder");
}

async function testRetryOnValueAnalyzer() {
  const report = await executeBusinessUnderstandingAgent({
    agentInput: buildBatterySprayerBusinessAgentInput(),
    context: { missingPrimaryValue: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "value_analyzer");
  console.log("✔ retry logic — value analyzer → competitive positioning → strategy builder");
}

async function testPipelineHandoff() {
  const report = await executeBusinessUnderstandingAgentWithPipeline({
    agentInput: buildBatterySprayerBusinessAgentInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — business model published for downstream agents");
}

function testKpis() {
  const report = executeBusinessUnderstandingAgent({
    agentInput: buildBatterySprayerBusinessAgentInput(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.valuePropositionAccuracy > 0);
    assert.ok(r.kpis.emotionalMappingScore > 0);
    assert.ok(r.kpis.marketplaceAlignment > 0);
    console.log("✔ performance metrics — value accuracy, emotional mapping, marketplace alignment KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validateBusinessUnderstandingAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertBusinessUnderstandingAgent();
  console.log("✔ full business understanding agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runBusinessUnderstandingAgent();
  assert.equal(report.valid, true);
  console.log("✔ runBusinessUnderstandingAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isBusinessUnderstandingAgentFailure("MISSING_PRIMARY_VALUE"), true);
  assert.equal(isBusinessUnderstandingAgentFailure("UNKNOWN"), false);
  console.log("✔ business understanding agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testAgentInputContract();
  testValueAnalyzer();
  testBusinessModelOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnLowEmotionalConfidence();
  await testRetryOnValueAnalyzer();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nbusiness-understanding-agent.spec.ts — all passed");
}

run();

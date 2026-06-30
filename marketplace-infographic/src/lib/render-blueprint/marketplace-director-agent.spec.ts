/**
 * DESIGN AI v18 — Marketplace Director Agent tests (Chapter 7.18)
 */
import assert from "node:assert/strict";
import {
  MARKETPLACE_DIRECTOR_AGENT_VERSION,
  MARKETPLACE_DIRECTOR_AGENT_GOLDEN_RULE,
  MARKETPLACE_DIRECTOR_AGENT_MISSION,
  MARKETPLACE_DIRECTOR_AGENT_MODULES,
  MARKETPLACE_DIRECTOR_AGENT_PIPELINE,
  MARKETPLACE_DIRECTOR_AGENT_ID,
  MARKETPLACE_DIRECTOR_ID,
  MarketplaceDirectorAgentModule,
  selectOverlayStrategy,
  analyzeBuyerBehavior,
  buildBadgePriority,
  buildSafeAreaRules,
  computeCtrPrediction,
  buildMarketplaceSection,
  fromMarketplaceSection,
  validateMarketplaceSupportsInfographic,
  scoreMarketplaceCandidateForPlatform,
  hasWildberriesMinimalOverlay,
  buildDefaultMarketplaceDirectorAgentInput,
  buildBatterySprayerMarketplaceDirectorInput,
  mapMarketplaceDirectorModuleToStage,
  executeMarketplaceDirectorAgent,
  executeMarketplaceDirectorAgentWithPipeline,
  validateMarketplaceDirectorAgent,
  validateMarketplaceDirectorAgentWithExecution,
  assertMarketplaceDirectorAgent,
  runMarketplaceDirectorAgent,
  isMarketplaceDirectorAgentFailure,
  getMarketplaceDirectorAgentModule,
  validateMarketplaceDirectorAgentBlueprint,
} from "./index";

function testAgentCatalog() {
  assert.equal(MARKETPLACE_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(MARKETPLACE_DIRECTOR_AGENT_VERSION, "7.18.0");
  assert.equal(MARKETPLACE_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(MARKETPLACE_DIRECTOR_AGENT_ID, MARKETPLACE_DIRECTOR_ID);
  console.log("✔ agent catalog — 7 internal modules, marketplace-focused agent");
}

function testGoldenRuleAndMission() {
  assert.ok(MARKETPLACE_DIRECTOR_AGENT_GOLDEN_RULE.includes("final commercial step"));
  assert.ok(MARKETPLACE_DIRECTOR_AGENT_MISSION.includes("marketplace"));
  console.log("✔ golden rule — platform adaptation drives conversion");
}

function testPipelinePosition() {
  assert.equal(MARKETPLACE_DIRECTOR_AGENT_PIPELINE[0].from, "typography_director");
  assert.equal(MARKETPLACE_DIRECTOR_AGENT_PIPELINE[0].to, "marketplace_director");
  assert.equal(MARKETPLACE_DIRECTOR_AGENT_PIPELINE[1].to, "pattern_director");
  console.log("✔ pipeline position — after typography director, before pattern director");
}

function testMarketplaceDirectorInputContract() {
  const input = buildDefaultMarketplaceDirectorAgentInput();
  assert.ok(input.storyBlueprint.primaryMessage);
  assert.ok(input.layoutBlueprint.layoutPattern);
  assert.ok(input.typographyBlueprint.fontFamily);
  assert.ok(input.businessModel.primaryValue);
  assert.ok(input.productProfile.category);
  assert.ok(input.marketplaceProfile.id);
  assert.ok(input.knowledgePackage.rawPackage);
  console.log("✔ marketplace director input — product, story, layout, typography, business, marketplace");
}

function testMarketplaceProfileAndRules() {
  const input = buildBatterySprayerMarketplaceDirectorInput();
  const strategy = selectOverlayStrategy(input);
  assert.equal(strategy, "Minimal Marketplace");
  const behavior = analyzeBuyerBehavior(input);
  assert.equal(behavior.emotionFirst, true);
  assert.ok(behavior.overlayMaxElements <= 4);
  const score = scoreMarketplaceCandidateForPlatform("Minimal Marketplace", input.marketplaceProfile.id);
  assert.ok(score > 0.9);
  console.log("✔ marketplace profile and rules — Wildberries minimal overlay with emotion-first scan");
}

function testOverlayOptimizer() {
  const input = buildBatterySprayerMarketplaceDirectorInput();
  const section = buildMarketplaceSection(input, {}, 0.93);
  const badges = buildBadgePriority(input);
  assert.ok(badges.length >= 2);
  assert.ok(badges.length <= 4);
  assert.equal(section.overlayStrategy, "Minimal Marketplace");
  assert.equal(validateMarketplaceSupportsInfographic(section.overlayElementCount, "wildberries"), true);
  console.log("✔ overlay optimizer — 2–4 benefits, no instruction-style overload");
}

function testCommercialAdaptation() {
  const input = buildBatterySprayerMarketplaceDirectorInput();
  const section = buildMarketplaceSection(input, {}, 0.93);
  assert.equal(section.informationDensity, "Medium");
  assert.equal(section.emotionLevel, "High");
  assert.ok(section.commercialRecommendations.length >= 2);
  console.log("✔ commercial adaptation — high emotion, medium information for Wildberries");
}

function testMarketplaceBlueprintOutput() {
  const input = buildBatterySprayerMarketplaceDirectorInput();
  const section = buildMarketplaceSection(input, {}, 0.93);
  const blueprint = fromMarketplaceSection(section, input, 0.93);
  assert.ok(blueprint.safeAreaRules.some((r) => r.includes("badge")));
  assert.ok(blueprint.marketplaceOptimizations.length >= 2);
  assert.ok(computeCtrPrediction(section, input) >= 0.85);
  assert.equal(hasWildberriesMinimalOverlay(blueprint), true);
  assert.equal(validateMarketplaceDirectorAgentBlueprint(blueprint, input, section).length, 0);
  console.log("✔ marketplace blueprint — complete output for pattern director and render adapter");
}

function testModuleMapping() {
  assert.equal(mapMarketplaceDirectorModuleToStage(MarketplaceDirectorAgentModule.OVERLAY_OPTIMIZER), "overlay_strategy");
  const mod = getMarketplaceDirectorAgentModule(MarketplaceDirectorAgentModule.BEHAVIOR_ANALYZER)!;
  assert.equal(mod.order, 3);
  console.log("✔ internal modules map to Ch 5.5 marketplace knowledge stages");
}

async function testKitchenSprayerExecution() {
  const report = await executeMarketplaceDirectorAgent({
    agentInput: buildBatterySprayerMarketplaceDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, MARKETPLACE_DIRECTOR_ID);
  assert.equal(report.designStructureExcluded, true);
  assert.equal(hasWildberriesMinimalOverlay(report.blueprint!), true);
  assert.ok(report.kpis.ctrPrediction >= 0.85);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer Wildberries marketplace blueprint");
}

async function testRetryOnOverlayOverloaded() {
  const report = await executeMarketplaceDirectorAgent({
    agentInput: buildBatterySprayerMarketplaceDirectorInput(),
    context: { overlayOverloaded: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "behavior_overlay_commercial");
  assert.ok(report.blueprint!.badgePriority.length <= 4);
  console.log("✔ retry logic — behavior analyzer, overlay optimizer, commercial adaptation");
}

async function testRetryOnLowCtrPrediction() {
  const report = await executeMarketplaceDirectorAgent({
    agentInput: buildBatterySprayerMarketplaceDirectorInput(),
    context: { lowCtrPrediction: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.kpis.ctrPrediction >= 0.7);
  console.log("✔ retry logic — recovers CTR prediction for marketplace thumbnail");
}

async function testPipelineHandoff() {
  const report = await executeMarketplaceDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerMarketplaceDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ pipeline handoff — marketplace blueprint for pattern director");
}

async function testKpis() {
  const report = await executeMarketplaceDirectorAgent({
    agentInput: buildBatterySprayerMarketplaceDirectorInput(),
  });
  assert.ok(report.kpis.marketplaceMatch > 0);
  assert.ok(report.kpis.overlayQuality > 0);
  assert.ok(report.kpis.buyerReadability > 0);
  console.log("✔ performance metrics — match, overlay, readability KPIs");
}

async function testValidateWithExecution() {
  const report = await validateMarketplaceDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertMarketplaceDirectorAgent();
  console.log("✔ full marketplace director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runMarketplaceDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runMarketplaceDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isMarketplaceDirectorAgentFailure("OVERLAY_OVERLOADED"), true);
  assert.equal(isMarketplaceDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ marketplace director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testMarketplaceDirectorInputContract();
  testMarketplaceProfileAndRules();
  testOverlayOptimizer();
  testCommercialAdaptation();
  testMarketplaceBlueprintOutput();
  testModuleMapping();
  await testKitchenSprayerExecution();
  await testRetryOnOverlayOverloaded();
  await testRetryOnLowCtrPrediction();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nmarketplace-director-agent.spec.ts — all passed");
}

run();

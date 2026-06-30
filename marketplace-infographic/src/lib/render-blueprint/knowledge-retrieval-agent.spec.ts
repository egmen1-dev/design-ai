/**
 * DESIGN AI v18 — Knowledge Retrieval Agent tests (Chapter 7.9)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_RETRIEVAL_AGENT_VERSION,
  KNOWLEDGE_RETRIEVAL_AGENT_GOLDEN_RULE,
  KNOWLEDGE_RETRIEVAL_AGENT_MISSION,
  KNOWLEDGE_RETRIEVAL_AGENT_MODULES,
  KNOWLEDGE_RETRIEVAL_AGENT_SERVICE_FLOW,
  KNOWLEDGE_RETRIEVAL_AGENT_ID,
  KnowledgeRetrievalAgentModule,
  MAX_PACKAGE_SIZE,
  expandKnowledgeDomainsForAgent,
  buildKnowledgePackageVersions,
  fromStagedKnowledgePackage,
  fuseKnowledgeInsights,
  validateKnowledgeRetrievalAgentPackage,
  buildDefaultKnowledgeRetrievalAgentRequest,
  buildStoryDirectorKnowledgeRequest,
  buildLightingDirectorKnowledgeRequest,
  mapModuleToRetrievalStage,
  executeKnowledgeRetrievalAgent,
  executeKnowledgeRetrievalAgentForClient,
  validateKnowledgeRetrievalAgent,
  validateKnowledgeRetrievalAgentWithExecution,
  assertKnowledgeRetrievalAgent,
  runKnowledgeRetrievalAgent,
  isKnowledgeRetrievalAgentFailure,
  getKnowledgeRetrievalAgentModule,
  runKnowledgeRetrievalStage,
  buildPipelineKnowledgeQueryFromProfile,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
} from "./index";

function gardenProfile() {
  const analysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      productImageRef: "product/battery-sprayer-hero.jpg",
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
      targetAudience: "garden owners",
    }),
  );
  return analysis.section!.profile;
}

function testAgentCatalog() {
  assert.equal(KNOWLEDGE_RETRIEVAL_AGENT_MODULES.length, 7);
  assert.equal(KNOWLEDGE_RETRIEVAL_AGENT_VERSION, "7.9.0");
  assert.equal(KNOWLEDGE_RETRIEVAL_AGENT_SERVICE_FLOW.length, 3);
  assert.equal(KNOWLEDGE_RETRIEVAL_AGENT_ID, "knowledge-retrieval");
  console.log("✔ agent catalog — 7 internal modules, service agent model");
}

function testGoldenRuleAndMission() {
  assert.ok(KNOWLEDGE_RETRIEVAL_AGENT_GOLDEN_RULE.includes("right knowledge"));
  assert.ok(KNOWLEDGE_RETRIEVAL_AGENT_MISSION.includes("What knowledge is needed"));
  console.log("✔ golden rule — relevance over volume; no design decisions");
}

function testContextAnalyzerExpansion() {
  const storyDomains = expandKnowledgeDomainsForAgent("visual-story-director", ["story_pattern"]);
  assert.ok(storyDomains.includes("story_pattern"));
  assert.ok(storyDomains.includes("consumer_psychology"));
  assert.ok(storyDomains.includes("emotional_design"));
  const lightingDomains = expandKnowledgeDomainsForAgent("lighting-director", ["lighting"]);
  assert.ok(lightingDomains.includes("photography"));
  console.log("✔ context analyzer — auto-expands domains for requesting agent");
}

function testKnowledgeRequestContract() {
  const request = buildDefaultKnowledgeRetrievalAgentRequest();
  assert.equal(request.agent, "visual-story-director");
  assert.ok(request.domain.length > 0);
  assert.ok(request.productProfile.category);
  assert.ok(request.businessModel.primaryValue);
  assert.ok(request.pipelineContext.pipelineId);
  assert.ok(request.knowledgeVersion);
  assert.equal("prompt" in request, false);
  const query = buildPipelineKnowledgeQueryFromProfile(request.productProfile, "wildberries");
  assert.equal(query.marketplace, "wildberries");
  assert.ok(query.businessGoal);
  console.log("✔ knowledge request — business context only, no prompt");
}

function testSemanticSearchAndRanking() {
  const profile = gardenProfile();
  const stage = runKnowledgeRetrievalStage({ profile, marketplace: "wildberries" });
  assert.equal(stage.valid, true);
  assert.ok(stage.package!.rules.length > 0);
  assert.ok(stage.package!.rules[0].finalScore > 0);
  console.log("✔ semantic search and ranking — meaning-based retrieval with scores");
}

function testKnowledgePackageOutput() {
  const profile = gardenProfile();
  const stage = runKnowledgeRetrievalStage({ profile, marketplace: "wildberries" });
  const versions = buildKnowledgePackageVersions("wildberries", "6.4.0");
  const pkg = fromStagedKnowledgePackage(stage.package!, versions);
  assert.ok(pkg.rules.length > 0);
  assert.ok(pkg.patterns.length > 0);
  assert.ok(pkg.marketplace.items.length > 0);
  assert.ok(pkg.confidence > 0);
  assert.ok(pkg.sources.length > 0);
  assert.equal(validateKnowledgeRetrievalAgentPackage(pkg).length, 0);
  console.log("✔ knowledge package — rules, patterns, marketplace, confidence, sources");
}

function testKnowledgeFusion() {
  const fused = fuseKnowledgeInsights({
    marketplaceRule: "Use large Hero Product",
    pattern: "Centered Hero",
    historicalStat: "48–55%",
    marketplace: "Wildberries",
  });
  assert.ok(fused.includes("Centered Hero"));
  assert.ok(fused.includes("Wildberries"));
  assert.ok(fused.includes("High Confidence"));
  console.log("✔ knowledge fusion — merges marketplace rule, pattern, and statistics");
}

function testVersionControl() {
  const versions = buildKnowledgePackageVersions("wildberries", "6.4.0");
  assert.equal(versions.knowledgeEngine, "6.4.0");
  assert.ok(versions.patternLibrary);
  assert.ok(versions.marketplaceRules);
  console.log("✔ version control — knowledge engine, pattern library, marketplace rules");
}

function testModuleMapping() {
  assert.equal(mapModuleToRetrievalStage(KnowledgeRetrievalAgentModule.SEMANTIC_SEARCH), "semantic_search");
  const mod = getKnowledgeRetrievalAgentModule(KnowledgeRetrievalAgentModule.CONTEXT_FILTER)!;
  assert.equal(mod.order, 5);
  console.log("✔ internal modules map to Ch 6.4 pipeline stages");
}

async function testStoryDirectorKitchen() {
  const report = await executeKnowledgeRetrievalAgent({
    request: buildStoryDirectorKnowledgeRequest(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, KNOWLEDGE_RETRIEVAL_AGENT_ID);
  assert.ok(report.package!.rules.length > 0);
  assert.ok(report.expandedDomains.includes("consumer_psychology"));
  assert.equal(report.designExcluded, true);
  assert.equal(report.serviceAgent, true);
  assert.ok(report.stagedPackage!.packageSize <= MAX_PACKAGE_SIZE);
  console.log("✔ kitchen execution — story director knowledge delivery for battery sprayer");
}

async function testLightingDirectorClient() {
  const report = await executeKnowledgeRetrievalAgent({
    request: buildLightingDirectorKnowledgeRequest(),
  });
  assert.equal(report.valid, true);
  assert.ok(report.expandedDomains.includes("photography"));
  console.log("✔ service clients — lighting director receives photography knowledge");
}

async function testRetryOnLowConfidence() {
  const report = await executeKnowledgeRetrievalAgent({
    request: buildStoryDirectorKnowledgeRequest(),
    context: { lowConfidence: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "context_analyzer");
  console.log("✔ retry logic — context analyzer restart on low confidence");
}

async function testServiceFlowHandoff() {
  const report = await executeKnowledgeRetrievalAgentForClient({
    request: buildStoryDirectorKnowledgeRequest(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  console.log("✔ service flow — knowledge returns to requesting agent");
}

function testKpis() {
  const report = executeKnowledgeRetrievalAgent({
    request: buildStoryDirectorKnowledgeRequest(),
  });
  return report.then((r) => {
    assert.ok(r.kpis.retrievalPrecision > 0);
    assert.ok(r.kpis.knowledgeCoverage > 0);
    assert.ok(r.kpis.confidenceScore > 0);
    console.log("✔ performance metrics — precision, coverage, confidence KPIs");
  });
}

async function testValidateWithExecution() {
  const report = await validateKnowledgeRetrievalAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.serviceAgentModel, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertKnowledgeRetrievalAgent();
  console.log("✔ full knowledge retrieval agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runKnowledgeRetrievalAgent();
  assert.equal(report.valid, true);
  console.log("✔ runKnowledgeRetrievalAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeRetrievalAgentFailure("INSUFFICIENT_KNOWLEDGE"), true);
  assert.equal(isKnowledgeRetrievalAgentFailure("UNKNOWN"), false);
  console.log("✔ knowledge retrieval agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testContextAnalyzerExpansion();
  testKnowledgeRequestContract();
  testSemanticSearchAndRanking();
  testKnowledgePackageOutput();
  testKnowledgeFusion();
  testVersionControl();
  testModuleMapping();
  await testStoryDirectorKitchen();
  await testLightingDirectorClient();
  await testRetryOnLowConfidence();
  await testServiceFlowHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nknowledge-retrieval-agent.spec.ts — all passed");
}

run();

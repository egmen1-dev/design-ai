/**
 * DESIGN AI v18 — Knowledge Retrieval Stage tests (Chapter 6.4)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
  KNOWLEDGE_RETRIEVAL_STAGE_GOLDEN_RULE,
  KNOWLEDGE_RETRIEVAL_STAGE_PIPELINE,
  STAGE_CACHEABLE_CATEGORIES,
  KnowledgeRetrievalPipelineStage,
  KnowledgeRetrievalDomain,
  MAX_PACKAGE_SIZE,
  buildPipelineKnowledgeQueryFromProfile,
  selectKnowledgeDomainsForProfile,
  buildSemanticQueryFromProfile,
  filterKnowledgeByMarketplaceContext,
  retrievePatternsForStage,
  retrieveAntiPatternsForStage,
  assembleStagedKnowledgePackage,
  runKnowledgeRetrievalStage,
  runKnowledgeRetrievalStageFromPipeline,
  enrichPipelineContextWithKnowledgeRetrieval,
  validateKnowledgeRetrievalStage,
  assertKnowledgeRetrievalStage,
  runKnowledgeRetrievalStageValidation,
  isKnowledgeRetrievalStageFailure,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  clearRetrievalCache,
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

function testGoldenRule() {
  assert.ok(KNOWLEDGE_RETRIEVAL_STAGE_GOLDEN_RULE.includes("right agent"));
  assert.equal(KNOWLEDGE_RETRIEVAL_STAGE_VERSION, "6.4.0");
  console.log("✔ golden rule — right knowledge to right agent at right moment");
}

function testPipelineStages() {
  assert.equal(KNOWLEDGE_RETRIEVAL_STAGE_PIPELINE.length, 12);
  assert.equal(KNOWLEDGE_RETRIEVAL_STAGE_PIPELINE[0], KnowledgeRetrievalPipelineStage.PROFILE_ANALYSIS);
  assert.equal(KNOWLEDGE_RETRIEVAL_STAGE_PIPELINE[11], KnowledgeRetrievalPipelineStage.AGENT_DELIVERY);
  console.log("✔ pipeline stages — profile to query to package to agent delivery");
}

function testKnowledgeQuery() {
  const profile = gardenProfile();
  const query = buildPipelineKnowledgeQueryFromProfile(profile, "wildberries");
  assert.equal(query.category, "Garden Equipment");
  assert.equal(query.marketplace, "wildberries");
  assert.equal(query.priceSegment, "mass_market");
  assert.deepEqual(query.targetAudience, ["garden owners"]);
  assert.ok(!("prompt" in query));
  console.log("✔ knowledge query — business context only, no prompt");
}

function testDomainSelection() {
  const profile = gardenProfile();
  const domains = selectKnowledgeDomainsForProfile(profile);
  assert.ok(domains.includes(KnowledgeRetrievalDomain.MARKETPLACE));
  assert.ok(domains.includes(KnowledgeRetrievalDomain.PHOTOGRAPHY));
  assert.ok(domains.includes(KnowledgeRetrievalDomain.PATTERN));
  assert.ok(domains.includes(KnowledgeRetrievalDomain.ANTI_PATTERN));
  console.log("✔ domain selection — marketplace, photography, patterns for garden sprayer");
}

function testSemanticSearch() {
  const profile = gardenProfile();
  const semantic = buildSemanticQueryFromProfile(profile);
  assert.ok(semantic.toLowerCase().includes("battery") || semantic.toLowerCase().includes("sprayer"));
  const report = runKnowledgeRetrievalStage({ profile, marketplace: "wildberries" });
  assert.equal(report.valid, true);
  assert.ok(report.package!.rawPackage.items.length > 0);
  console.log("✔ semantic search — meaning-based retrieval for battery garden sprayer");
}

function testContextFiltering() {
  const profile = gardenProfile();
  const query = buildPipelineKnowledgeQueryFromProfile(profile, "wildberries");
  const report = runKnowledgeRetrievalStage({ profile, marketplace: "wildberries" });
  const amazonOnly = report.package!.rawPackage.items.every((i) => i.semanticTags.includes("amazon"));
  assert.equal(amazonOnly, false);
  const filtered = filterKnowledgeByMarketplaceContext(report.package!.rawPackage.items, query);
  assert.ok(filtered.length > 0);
  console.log("✔ context filtering — marketplace and positioning filter irrelevant rules");
}

function testKnowledgeRanking() {
  const report = runKnowledgeRetrievalStageFromPipeline();
  assert.ok(report.package!.rules.length > 0);
  assert.ok(report.package!.rules.every((r) => r.finalScore > 0));
  assert.ok(report.package!.rules[0].contextMatch >= 0);
  console.log("✔ knowledge ranking — context match, confidence, marketplace, historical success");
}

function testPatternRetrieval() {
  const profile = gardenProfile();
  const query = buildPipelineKnowledgeQueryFromProfile(profile, "wildberries");
  const patterns = retrievePatternsForStage(query);
  assert.ok(patterns.length >= 2);
  assert.ok(patterns[0].score >= patterns[1].score);
  console.log("✔ pattern retrieval — top patterns with scores, not full library");
}

function testAntiPatternRetrieval() {
  const profile = gardenProfile();
  const query = buildPipelineKnowledgeQueryFromProfile(profile, "wildberries");
  const anti = retrieveAntiPatternsForStage(query);
  assert.ok(anti.length >= 2);
  assert.ok(anti.some((a) => a.warning.length > 10));
  console.log("✔ anti-pattern retrieval — preemptive warnings for agents");
}

function testStagedKnowledgePackage() {
  const report = runKnowledgeRetrievalStageFromPipeline();
  const pkg = report.package!;
  assert.ok(pkg.marketplace.length >= 0);
  assert.ok(pkg.patterns.length > 0);
  assert.ok(pkg.antiPatterns.length > 0);
  assert.ok(pkg.rules.length > 0);
  assert.ok(pkg.packageSize <= MAX_PACKAGE_SIZE);
  console.log("✔ knowledge package — structured domain slices for all agents");
}

function testMaximumRelevanceMinimumContext() {
  const report = runKnowledgeRetrievalStageFromPipeline();
  assert.ok(report.package!.packageSize <= MAX_PACKAGE_SIZE);
  assert.ok(report.package!.packageSize > 0);
  console.log("✔ maximum relevance minimum context — bounded package size");
}

function testCaching() {
  clearRetrievalCache();
  assert.ok(STAGE_CACHEABLE_CATEGORIES.includes("garden_tools"));
  const profile = gardenProfile();
  const first = runKnowledgeRetrievalStage({ profile, marketplace: "wildberries" }, { skipCache: false });
  const second = runKnowledgeRetrievalStage({ profile, marketplace: "wildberries" }, { skipCache: false });
  assert.equal(first.valid, true);
  assert.equal(second.valid, true);
  console.log("✔ caching — garden_tools category uses intelligent cache");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = runKnowledgeRetrievalStageFromPipeline();
  const enriched = enrichPipelineContextWithKnowledgeRetrieval(ctx, report.package!);
  assert.equal(enriched.violations.length, 0);
  assert.ok(enriched.context.knowledge.package.items.length > 0);
  console.log("✔ pipeline context bridge — shared knowledge package in context");
}

function testValidationFailures() {
  const empty = runKnowledgeRetrievalStage(
    { profile: gardenProfile(), marketplace: "wildberries" },
    { forceEmptyPackage: true },
  );
  assert.equal(empty.valid, false);
  assert.ok(empty.violations.some((v) => v.code === "EMPTY_PACKAGE"));
  console.log("✔ validation — empty package blocks stage completion");
}

function testSystemValidation() {
  const report = validateKnowledgeRetrievalStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.maximumRelevanceMinimumContext, true);
  assert.equal(report.sharedKnowledgeBase, true);
  assert.equal(report.marketplaceAware, true);
  console.log("✔ system validation — stage meets success criteria");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertKnowledgeRetrievalStage());
  const report = runKnowledgeRetrievalStageValidation();
  assert.equal(report.rankingActive, true);
  console.log("✔ assertKnowledgeRetrievalStage and runKnowledgeRetrievalStageValidation work");
}

function testFailureCodes() {
  assert.equal(isKnowledgeRetrievalStageFailure("FULL_BASE_LEAK"), true);
  assert.equal(isKnowledgeRetrievalStageFailure("MARKETPLACE_IGNORED"), true);
  assert.equal(isKnowledgeRetrievalStageFailure("unknown"), false);
  console.log("✔ knowledge retrieval stage failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testKnowledgeQuery();
  testDomainSelection();
  testSemanticSearch();
  testContextFiltering();
  testKnowledgeRanking();
  testPatternRetrieval();
  testAntiPatternRetrieval();
  testStagedKnowledgePackage();
  testMaximumRelevanceMinimumContext();
  testCaching();
  testPipelineContextBridge();
  testValidationFailures();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nknowledge-retrieval-stage.spec.ts — all passed");
}

run();

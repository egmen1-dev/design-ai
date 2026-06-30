/**
 * DESIGN AI v18 — Knowledge Retrieval Engine tests (Chapter 5.16)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_RETRIEVAL_VERSION,
  KNOWLEDGE_RETRIEVAL_GOLDEN_RULE,
  MAX_PACKAGE_SIZE,
  RETRIEVAL_PIPELINE,
  CACHEABLE_CATEGORIES,
  SEMANTIC_EXPANSIONS,
  AGENT_RETRIEVAL_DOMAINS,
  KnowledgeRetrievalDomain,
  RetrievalPipelineStage,
  buildRetrievalCatalog,
  analyzeRetrievalContext,
  computeSemanticMatch,
  rankKnowledgeItems,
  resolveKnowledgeConflicts,
  retrieveKnowledgePackage,
  validateKnowledgePackage,
  clearRetrievalCache,
  validateKnowledgeRetrieval,
  assertKnowledgeRetrieval,
  runKnowledgeRetrieval,
  isKnowledgeRetrievalFailure,
} from "./index";
import { MarketplaceKnowledgeId } from "./marketplace-knowledge-types";

function testGoldenRule() {
  assert.ok(KNOWLEDGE_RETRIEVAL_GOLDEN_RULE.includes("right moment"));
  assert.equal(KNOWLEDGE_RETRIEVAL_VERSION, "5.16.0");
  console.log("✔ golden rule — find right knowledge at right moment");
}

function testRetrievalPipeline() {
  assert.equal(RETRIEVAL_PIPELINE.length, 8);
  assert.equal(RETRIEVAL_PIPELINE[0], RetrievalPipelineStage.AGENT_REQUEST);
  assert.equal(RETRIEVAL_PIPELINE[7], RetrievalPipelineStage.AGENT_DELIVERY);
  console.log("✔ retrieval pipeline — request to context to package to agent");
}

function testContextAnalysis() {
  const analysis = analyzeRetrievalContext({
    category: "kitchen",
    marketplace: MarketplaceKnowledgeId.AMAZON,
    styleId: "premium",
    businessGoal: "trust",
    agentId: "lighting-director",
    semanticQuery: "Premium Kitchen Appliance",
  });
  assert.ok(analysis.semanticTags.includes("kitchen"));
  assert.ok(analysis.semanticTags.includes("premium") || analysis.semanticTags.includes("luxury"));
  assert.ok(analysis.agentDomains.includes(KnowledgeRetrievalDomain.PHOTOGRAPHY));
  console.log("✔ context analysis — category, marketplace, style, agent domains");
}

function testSemanticRetrieval() {
  const catalog = buildRetrievalCatalog();
  const premiumKitchen = catalog.find((i) => i.id === "style-premium-kitchen")!;
  const score = computeSemanticMatch(premiumKitchen, ["premium", "kitchen", "appliance", "warm_lighting"]);
  assert.ok(score > 0.3);
  assert.ok(SEMANTIC_EXPANSIONS.premium.includes("warm_lighting"));
  const pkg = retrieveKnowledgePackage({
    context: { semanticQuery: "Premium Kitchen Appliance", category: "kitchen", styleId: "premium" },
    limit: 6,
    useCache: false,
  });
  assert.ok(pkg.items.length > 0);
  assert.ok(pkg.items.some((i) => i.semanticTags.includes("kitchen") || i.semanticTags.includes("premium")));
  console.log("✔ semantic retrieval — meaning-based not keyword-only search");
}

function testMultiDomainRetrieval() {
  const pkg = retrieveKnowledgePackage({
    context: {
      agentId: "lighting-director",
      category: "kitchen",
      marketplace: MarketplaceKnowledgeId.AMAZON,
      businessGoal: "trust",
    },
    limit: 8,
    useCache: false,
  });
  const domains = new Set(pkg.domains);
  assert.ok(domains.has(KnowledgeRetrievalDomain.PHOTOGRAPHY));
  assert.ok(AGENT_RETRIEVAL_DOMAINS["lighting-director"]!.includes(KnowledgeRetrievalDomain.COLOR));
  console.log("✔ multi-domain retrieval — lighting director gets photography, color, psychology");
}

function testKnowledgeRanking() {
  const catalog = buildRetrievalCatalog();
  const ranked = rankKnowledgeItems(catalog.slice(0, 10), {
    category: "kitchen",
    marketplace: "amazon",
    businessGoal: "trust",
  });
  assert.ok(ranked[0].finalScore >= ranked[ranked.length - 1].finalScore);
  assert.ok(ranked[0].explanation.includes("Context Match"));
  console.log("✔ knowledge ranking — context, confidence, evidence, success, marketplace");
}

function testKnowledgePackage() {
  const pkg = retrieveKnowledgePackage({
    context: { category: "electronics", agentId: "composition-director" },
    limit: 6,
    useCache: false,
  });
  assert.ok(pkg.packageSize <= MAX_PACKAGE_SIZE);
  assert.ok(pkg.packageSize > 0);
  assert.equal(pkg.explainable, true);
  assert.ok(pkg.pipelineStages.length === 8);
  assert.ok(pkg.totalCandidates > pkg.packageSize);
  console.log("✔ knowledge package — compact relevant rules with explanations");
}

function testConflictResolution() {
  const items = rankKnowledgeItems(buildRetrievalCatalog().slice(0, 8), { styleId: "luxury" });
  const { conflicts } = resolveKnowledgeConflicts(items);
  assert.ok(Array.isArray(conflicts));
  const pkg = retrieveKnowledgePackage({
    context: { category: "kitchen", styleId: "premium", businessGoal: "value" },
    limit: 8,
    useCache: false,
  });
  assert.ok(pkg.conflicts.every((c) => c.delegatedToDesignRules || c.resolvedWinner));
  console.log("✔ conflict resolution — conflicts delegated with resolved winner");
}

function testCaching() {
  clearRetrievalCache();
  assert.ok(CACHEABLE_CATEGORIES.includes("kitchen"));
  const first = retrieveKnowledgePackage({
    context: { category: "kitchen", marketplace: "amazon" },
    limit: 5,
    useCache: true,
  });
  const second = retrieveKnowledgePackage({
    context: { category: "kitchen", marketplace: "amazon" },
    limit: 5,
    useCache: true,
  });
  assert.equal(first.fromCache, false);
  assert.equal(second.fromCache, true);
  assert.equal(second.packageSize, first.packageSize);
  console.log("✔ caching — popular categories served from cache");
}

function testExplainability() {
  const pkg = retrieveKnowledgePackage({
    context: { semanticQuery: "premium kitchen", category: "kitchen" },
    limit: 5,
    useCache: false,
  });
  for (const item of pkg.items) {
    assert.ok(item.explanation.includes("Context Match"));
    assert.ok(item.explanation.includes("Historical Success"));
    assert.ok(item.explanation.includes("Marketplace Compatibility"));
  }
  console.log("✔ explainability — each item explains why it was selected");
}

function testValidateKnowledgePackage() {
  const pkg = retrieveKnowledgePackage({
    context: { agentId: "visual-story-director", category: "beauty" },
    limit: 6,
    useCache: false,
  });
  const validation = validateKnowledgePackage(pkg);
  assert.equal(validation.valid, true);
  console.log("✔ package validation — no duplicates, explainable, within size limit");
}

function testFullBaseLeakFails() {
  const report = validateKnowledgeRetrieval({ fullBaseLeak: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "FULL_BASE_LEAK"));
  console.log("✔ full base leak is architecturally invalid");
}

function testValidateKnowledgeRetrieval() {
  const report = validateKnowledgeRetrieval();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.semanticRetrieval, true);
  assert.equal(report.cacheEnabled, true);
  console.log("✔ knowledge retrieval validation passes");
}

function testRunKnowledgeRetrieval() {
  const result = runKnowledgeRetrieval({
    request: { context: { category: "tools", agentId: "composition-director" }, limit: 5 },
  });
  assert.equal(result.valid, true);
  assert.ok(result.package);
  assertKnowledgeRetrieval();
  console.log("✔ runKnowledgeRetrieval entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeRetrievalFailure("UNEXPLAINABLE_SELECTION"), true);
  assert.equal(isKnowledgeRetrievalFailure("UNKNOWN"), false);
  console.log("✔ knowledge retrieval failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testRetrievalPipeline();
  testContextAnalysis();
  testSemanticRetrieval();
  testMultiDomainRetrieval();
  testKnowledgeRanking();
  testKnowledgePackage();
  testConflictResolution();
  testCaching();
  testExplainability();
  testValidateKnowledgePackage();
  testFullBaseLeakFails();
  testValidateKnowledgeRetrieval();
  testRunKnowledgeRetrieval();
  testFailureCodes();
  console.log("\nknowledge-retrieval.spec.ts — all passed");
}

run();

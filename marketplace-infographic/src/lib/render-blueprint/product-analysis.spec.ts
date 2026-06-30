/**
 * DESIGN AI v18 — Product Analysis Stage tests (Chapter 6.3)
 */
import assert from "node:assert/strict";
import {
  PRODUCT_ANALYSIS_VERSION,
  PRODUCT_ANALYSIS_GOLDEN_RULE,
  PRODUCT_ANALYSIS_PIPELINE,
  PRODUCT_ANALYZER_ID,
  ProductAnalysisStage,
  PriceSegment,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
  analyzeProduct,
  buildKnowledgeRequestFromProfile,
  buildProductAnalysisExplainability,
  productAnalysisToMutations,
  enrichPipelineContextWithProductAnalysis,
  runProductAnalysisStage,
  validateProductAnalysis,
  assertProductAnalysis,
  runProductAnalysis,
  isProductAnalysisFailure,
  buildDefaultPipelineInput,
  createGenerationPipelineContext,
  getReadyAgents,
  AGENT_RETRIEVAL_DOMAINS,
  KnowledgeRetrievalDomain,
  resetPipelineContextStores,
} from "./index";

function testGoldenRule() {
  assert.ok(PRODUCT_ANALYSIS_GOLDEN_RULE.includes("complete product understanding"));
  assert.equal(PRODUCT_ANALYSIS_VERSION, "6.3.0");
  console.log("✔ golden rule — complete product understanding, not classification");
}

function testPipelineStages() {
  assert.equal(PRODUCT_ANALYSIS_PIPELINE.length, 12);
  assert.equal(PRODUCT_ANALYSIS_PIPELINE[0], ProductAnalysisStage.INPUT_NORMALIZATION);
  assert.equal(PRODUCT_ANALYSIS_PIPELINE[11], ProductAnalysisStage.VALIDATION);
  console.log("✔ pipeline stages — input to category to profile to knowledge to validation");
}

function testKitchenProductAnalysis() {
  const report = analyzeProduct(buildDefaultProductAnalysisInput());
  assert.equal(report.valid, true);
  assert.ok(report.section);
  assert.equal(report.section.profile.category, "Kitchen Appliances");
  assert.ok(report.section.profile.primaryBenefits.length >= 3);
  assert.ok(report.section.profile.painPoints.length >= 3);
  assert.ok(report.section.profile.useCases.length >= 3);
  assert.equal(report.section.productBlueprint.cutout, true);
  console.log("✔ kitchen analysis — category, benefits, pains, use cases, blueprint");
}

function testBatterySprayerUnderstanding() {
  const report = analyzeProduct(
    buildDefaultProductAnalysisInput({
      productImageRef: "product/battery-sprayer-hero.jpg",
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
      targetAudience: "garden owners",
    }),
  );
  assert.equal(report.valid, true);
  const profile = report.section!.profile;
  assert.equal(profile.subcategory, "Battery Sprayer");
  assert.ok(profile.painPoints.some((p) => p.includes("pump") || p.includes("fatigue")));
  assert.ok(profile.useCases.includes("garden"));
  assert.ok(profile.emotionalTriggers.some((e) => e.includes("harvest") || e.includes("gardening")));
  assert.equal(profile.priceSegment, PriceSegment.MASS_MARKET);
  console.log("✔ battery sprayer — marketer-level understanding beyond plastic container");
}

function testNeverDoesDesign() {
  const report = runProductAnalysis();
  assert.equal(report.designExcluded, true);
  const analysis = analyzeProduct(buildDefaultProductAnalysisInput());
  const explain = buildProductAnalysisExplainability(analysis.section!.profile);
  assert.equal(explain.designExcluded, true);
  console.log("✔ design excluded — product analysis never makes design decisions");
}

function testKnowledgeRequest() {
  const report = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
    }),
  );
  const req = report.section!.knowledgeRequest;
  assert.equal(req.category, "Battery Sprayer");
  assert.equal(req.marketplace, "wildberries");
  assert.equal(req.retrievalRequest.context.agentId, PRODUCT_ANALYZER_ID);
  assert.ok(req.retrievalRequest.context.semanticQuery!.includes("Battery Sprayer"));
  console.log("✔ knowledge request — category, marketplace, audience, positioning to KR engine");
}

function testKnowledgeRetrievalDomains() {
  const domains = AGENT_RETRIEVAL_DOMAINS[PRODUCT_ANALYZER_ID]!;
  assert.ok(domains.includes(KnowledgeRetrievalDomain.MARKETPLACE));
  assert.ok(domains.includes(KnowledgeRetrievalDomain.CONSUMER));
  console.log("✔ knowledge domains — product-analyzer retrieval domains registered");
}

function testBlueprintMutations() {
  const report = analyzeProduct(buildDefaultProductAnalysisInput());
  const mutations = productAnalysisToMutations(report.section!, 0, "product profile");
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].section, "product");
  assert.equal(mutations[0].producer, PRODUCT_ANALYZER_ID);
  console.log("✔ blueprint mutations — product section only via product-analyzer");
}

function testOrchestratorFirstAgent() {
  const ready = getReadyAgents({ completedAgents: [] });
  assert.deepEqual(ready, [PRODUCT_ANALYZER_ID]);
  console.log("✔ orchestrator dependency — product-analyzer is first ready agent");
}

function testPipelineContextBridge() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const report = analyzeProduct(buildDefaultProductAnalysisInput());
  const enriched = enrichPipelineContextWithProductAnalysis(ctx, report.section!);
  assert.equal(enriched.violations.length, 0);
  assert.equal(enriched.context.business.product.category, "Kitchen Appliances");
  assert.equal(enriched.context.blueprint.product.subCategory, "premium_blender");
  console.log("✔ pipeline context bridge — business section enriched from analysis");
}

function testPipelineInputBridge() {
  const input = buildProductAnalysisInputFromPipeline(buildDefaultPipelineInput());
  assert.equal(input.productImageRef, buildDefaultPipelineInput().productImageRef);
  assert.equal(input.businessGoal, buildDefaultPipelineInput().businessGoal);
  console.log("✔ design pipeline bridge — input maps from DesignPipelineInput");
}

function testValidationFailures() {
  const missingImage = analyzeProduct({ ...buildDefaultProductAnalysisInput(), productImageRef: "" });
  assert.equal(missingImage.valid, false);
  assert.ok(missingImage.violations.some((v) => v.code === "MISSING_IMAGE"));

  const noBenefits = analyzeProduct(buildDefaultProductAnalysisInput(), { missingBenefits: true });
  assert.equal(noBenefits.valid, false);
  assert.ok(noBenefits.violations.some((v) => v.code === "NO_PRIMARY_BENEFITS"));
  console.log("✔ validation — missing image and benefits block pipeline");
}

function testRunProductAnalysisStage() {
  const report = runProductAnalysisStage();
  assert.equal(report.valid, true);
  assert.ok(report.section);
  console.log("✔ runProductAnalysisStage entry point works");
}

function testSystemValidation() {
  const report = validateProductAnalysis();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.marketerLevelUnderstanding, true);
  assert.equal(report.knowledgeRequestFormed, true);
  assert.equal(report.profileComplete, true);
  console.log("✔ pipeline context system validation passes");
}

function testAssertAndRun() {
  assert.doesNotThrow(() => assertProductAnalysis());
  const report = runProductAnalysis();
  assert.equal(report.designExcluded, true);
  console.log("✔ assertProductAnalysis and runProductAnalysis entry points work");
}

function testFailureCodes() {
  assert.equal(isProductAnalysisFailure("MISSING_IMAGE"), true);
  assert.equal(isProductAnalysisFailure("NO_PAIN_POINTS"), true);
  assert.equal(isProductAnalysisFailure("unknown"), false);
  console.log("✔ product analysis failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelineStages();
  testKitchenProductAnalysis();
  testBatterySprayerUnderstanding();
  testNeverDoesDesign();
  testKnowledgeRequest();
  testKnowledgeRetrievalDomains();
  testBlueprintMutations();
  testOrchestratorFirstAgent();
  testPipelineContextBridge();
  testPipelineInputBridge();
  testValidationFailures();
  testRunProductAnalysisStage();
  testSystemValidation();
  testAssertAndRun();
  testFailureCodes();
  console.log("\nproduct-analysis.spec.ts — all passed");
}

run();

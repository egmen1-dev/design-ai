/**
 * DESIGN AI v18 — Marketplace Knowledge tests (Chapter 5.5)
 */
import assert from "node:assert/strict";
import {
  MARKETPLACE_KNOWLEDGE_VERSION,
  MARKETPLACE_KNOWLEDGE_GOLDEN_RULE,
  MarketplaceKnowledgeId,
  MarketplaceImageContext,
  MarketplaceRegion,
  ProductCategoryKnowledge,
  MARKETPLACE_PROFILES,
  SUPPORTED_MARKETPLACE_PLATFORMS,
  MARKETPLACE_PROFILE_VERSIONS,
  CATEGORY_VISUAL_GUIDANCE,
  BLUEPRINT_MARKETPLACE_MAP,
  getMarketplaceKnowledgeProfile,
  getCategoryVisualGuidance,
  getContextRules,
  getBestPracticesForCategory,
  getCriticalRestrictions,
  publishMarketplaceProfileVersion,
  validateMarketplaceBlueprint,
  resolveMarketplaceFromBlueprint,
  profilesHaveDistinctRules,
  getMarketplaceKnowledgeLayerBinding,
  validateMarketplaceKnowledge,
  assertMarketplaceKnowledge,
  runMarketplaceKnowledge,
  isMarketplaceKnowledgeFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(MARKETPLACE_KNOWLEDGE_GOLDEN_RULE.includes("Beautiful design alone does not guarantee sales"));
  assert.equal(MARKETPLACE_KNOWLEDGE_VERSION, "5.5.0");
  console.log("✔ golden rule — commercial design requires marketplace compliance");
}

function testSupportedPlatforms() {
  assert.equal(SUPPORTED_MARKETPLACE_PLATFORMS.length, 8);
  assert.ok(SUPPORTED_MARKETPLACE_PLATFORMS.includes(MarketplaceKnowledgeId.AMAZON));
  assert.ok(SUPPORTED_MARKETPLACE_PLATFORMS.includes(MarketplaceKnowledgeId.WILDBERRIES));
  assert.ok(SUPPORTED_MARKETPLACE_PLATFORMS.includes(MarketplaceKnowledgeId.ALIEXPRESS));
  console.log("✔ eight supported platforms — Amazon through AliExpress");
}

function testProfileVersioning() {
  assert.equal(MARKETPLACE_PROFILE_VERSIONS[MarketplaceKnowledgeId.AMAZON], "12.0.0");
  assert.equal(MARKETPLACE_PROFILE_VERSIONS[MarketplaceKnowledgeId.OZON], "7.0.0");
  assert.equal(MARKETPLACE_PROFILE_VERSIONS[MarketplaceKnowledgeId.WILDBERRIES], "5.0.0");
  const bumped = publishMarketplaceProfileVersion(MarketplaceKnowledgeId.AMAZON, "12.0.0");
  assert.equal(bumped.version, "12.0.1");
  console.log("✔ independent profile versioning — Amazon v12, Ozon v7, WB v5");
}

function testRegionalProfiles() {
  const us = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.US)!;
  const jp = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.JP)!;
  const de = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.DE)!;
  assert.equal(us.region, MarketplaceRegion.US);
  assert.equal(jp.region, MarketplaceRegion.JP);
  assert.equal(de.region, MarketplaceRegion.DE);
  console.log("✔ regional profiles — Amazon US, Japan, Germany");
}

function testDistinctPlatformRules() {
  assert.equal(profilesHaveDistinctRules(), true);
  const amazon = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.US)!;
  const ozon = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.OZON)!;
  assert.notDeepEqual(amazon.requirements, ozon.requirements);
  console.log("✔ platforms have distinct rule sets — not identical across marketplaces");
}

function testContextAwareRules() {
  const amazon = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.US)!;
  const main = getContextRules(amazon, MarketplaceImageContext.MAIN_IMAGE);
  const secondary = getContextRules(amazon, MarketplaceImageContext.SECONDARY_IMAGE);
  assert.ok(main.requirements.length > 0);
  assert.ok(secondary.requirements.length > 0);
  assert.notDeepEqual(main.requirements, secondary.requirements);
  console.log("✔ context-aware rules — main image vs secondary image differ");
}

function testOzonInfographicContext() {
  const ozon = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.OZON)!;
  const infographic = getContextRules(ozon, MarketplaceImageContext.INFOGRAPHIC);
  assert.ok(infographic.requirements.some((r) => r.id.includes("readable-text")));
  console.log("✔ Ozon infographic context — readable text requirement");
}

function testCategoryKnowledge() {
  assert.equal(CATEGORY_VISUAL_GUIDANCE.length, 5);
  const kitchen = getCategoryVisualGuidance(ProductCategoryKnowledge.KITCHEN)!;
  assert.ok(kitchen.lightingHint.includes("warm"));
  const electronics = getCategoryVisualGuidance(ProductCategoryKnowledge.ELECTRONICS)!;
  assert.ok(electronics.backgroundHint.includes("minimal"));
  const beauty = getCategoryVisualGuidance(ProductCategoryKnowledge.BEAUTY)!;
  assert.ok(beauty.lightingHint.includes("soft"));
  console.log("✔ category knowledge — kitchen, electronics, beauty, furniture, sports");
}

function testBestPracticesSeparate() {
  const amazon = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.US)!;
  const beautyPractices = getBestPracticesForCategory(amazon, ProductCategoryKnowledge.BEAUTY);
  assert.ok(beautyPractices.length > 0);
  assert.ok(amazon.requirements.every((r) => r.mandatory === true));
  assert.ok(!beautyPractices.some((p) => "mandatory" in p));
  console.log("✔ mandatory requirements separate from best practices");
}

function testCriticalRestrictions() {
  const amazon = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.US)!;
  const critical = getCriticalRestrictions(amazon, MarketplaceImageContext.MAIN_IMAGE);
  assert.ok(critical.some((r) => r.id.includes("no-badges")));
  assert.ok(critical.some((r) => r.id.includes("no-extra-products")));
  console.log("✔ critical restrictions — no badges, no additional products on main image");
}

function testValidateCompliantBlueprint() {
  const result = validateMarketplaceBlueprint({
    marketplaceId: MarketplaceKnowledgeId.AMAZON,
    context: MarketplaceImageContext.MAIN_IMAGE,
    region: MarketplaceRegion.US,
    background: "white",
    category: ProductCategoryKnowledge.BEAUTY,
  });
  assert.equal(result.valid, true);
  assert.equal(result.readyForRenderPipeline, true);
  assert.ok(result.appliedPractices.length > 0);
  console.log("✔ compliant blueprint passes validation before render pipeline");
}

function testValidateViolatingBlueprint() {
  const result = validateMarketplaceBlueprint({
    marketplaceId: MarketplaceKnowledgeId.AMAZON,
    context: MarketplaceImageContext.MAIN_IMAGE,
    region: MarketplaceRegion.US,
    background: "gray",
    hasPromotionalBadges: true,
    hasAdditionalProducts: true,
  });
  assert.equal(result.valid, false);
  assert.equal(result.readyForRenderPipeline, false);
  assert.ok(result.violations.some((v) => v.code === "CRITICAL_RESTRICTION_VIOLATED"));
  console.log("✔ violating blueprint blocked — white bg, no badges, no extra products");
}

function testBlueprintMarketplaceMap() {
  assert.equal(resolveMarketplaceFromBlueprint("Amazon"), MarketplaceKnowledgeId.AMAZON);
  assert.equal(resolveMarketplaceFromBlueprint("Ozon"), MarketplaceKnowledgeId.OZON);
  assert.equal(resolveMarketplaceFromBlueprint("WB"), MarketplaceKnowledgeId.WILDBERRIES);
  assert.equal(BLUEPRINT_MARKETPLACE_MAP.Amazon, MarketplaceKnowledgeId.AMAZON);
  console.log("✔ blueprint marketplace mapping — Amazon, Ozon, WB");
}

function testKnowledgeLayerBinding() {
  const binding = getMarketplaceKnowledgeLayerBinding();
  assert.equal(binding.layer, "marketplace");
  assert.equal(binding.moduleVersion, "5.5.0");
  assert.ok(binding.profileCount >= MARKETPLACE_PROFILES.length);
  console.log("✔ integrates with Ch 5.4 Knowledge Layer.MARKETPLACE");
}

function testIdenticalRulesFails() {
  const report = validateMarketplaceKnowledge({ identicalRulesAcrossPlatforms: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "IDENTICAL_RULES_ACROSS_PLATFORMS"));
  console.log("✔ identical rules across platforms is architecturally invalid");
}

function testValidateMarketplaceKnowledge() {
  const report = validateMarketplaceKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.contextAware, true);
  assert.equal(report.regionalProfilesSupported, true);
  assert.equal(report.versioningIndependent, true);
  console.log("✔ marketplace knowledge validation passes");
}

function testRunMarketplaceKnowledge() {
  const report = runMarketplaceKnowledge({});
  assert.equal(report.valid, true);
  assertMarketplaceKnowledge();
  console.log("✔ runMarketplaceKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isMarketplaceKnowledgeFailure("CRITICAL_RESTRICTION_VIOLATED"), true);
  assert.equal(isMarketplaceKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ marketplace knowledge failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testSupportedPlatforms();
  testProfileVersioning();
  testRegionalProfiles();
  testDistinctPlatformRules();
  testContextAwareRules();
  testOzonInfographicContext();
  testCategoryKnowledge();
  testBestPracticesSeparate();
  testCriticalRestrictions();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testBlueprintMarketplaceMap();
  testKnowledgeLayerBinding();
  testIdenticalRulesFails();
  testValidateMarketplaceKnowledge();
  testRunMarketplaceKnowledge();
  testFailureCodes();
  console.log("\nmarketplace-knowledge.spec.ts — all passed");
}

run();

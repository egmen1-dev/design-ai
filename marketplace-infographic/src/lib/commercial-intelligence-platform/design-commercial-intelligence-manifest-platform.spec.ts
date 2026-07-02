/**
 * Chapter 11.20 — Commercial Intelligence Manifest Platform tests (25)
 */
import assert from "node:assert/strict";
import {
  MANIFEST_PLATFORM_VERSION,
  MANIFEST_GOLDEN_RULE,
  MANIFEST_MODULES,
  MANIFEST_COMPONENTS,
  MANIFEST_LAYERS,
  MANIFEST_PRINCIPLES,
  MANIFEST_CONSTRAINTS,
  FUTURE_VISION_CAPABILITIES,
  DOWNSTREAM_PLATFORMS,
  MANIFEST_MISSION,
  runCommercialIntelligenceManifestPlatform,
  executeCommercialIntelligenceManifestPlatform,
} from "./design-commercial-intelligence-manifest-platform-engine";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("version 11.20.0", () => assert.equal(MANIFEST_PLATFORM_VERSION, "11.20.0"));
t("7 internal modules", () => assert.equal(MANIFEST_MODULES.length, 7));
t("8 manifest components", () => assert.equal(MANIFEST_COMPONENTS.length, 8));
t("7 manifest layers", () => assert.equal(MANIFEST_LAYERS.length, 7));
t("10 manifest principles", () => assert.equal(MANIFEST_PRINCIPLES.length, 10));
t("8 architectural constraints", () => assert.equal(MANIFEST_CONSTRAINTS.length, 8));
t("8 future vision capabilities", () => assert.equal(FUTURE_VISION_CAPABILITIES.length, 8));
t("golden rule — commercial advantage", () => assert.ok(MANIFEST_GOLDEN_RULE.includes("commercial advantage")));
t("mission — not image generation", () => assert.ok(MANIFEST_MISSION.includes("business result")));
t("contract id manifest", () => {
  const r = runCommercialIntelligenceManifestPlatform();
  assert.equal(r.contractId, "design-commercial-intelligence-manifest-platform");
});
t("mediator summary", () => {
  const r = runCommercialIntelligenceManifestPlatform();
  assert.equal(r.mediatorId, "design-commercial-intelligence-platform-summary");
});
t("pipeline manifest complete event", () => {
  const r = runCommercialIntelligenceManifestPlatform();
  assert.equal(r.pipelineEvents[2], "design_commercial_intelligence_manifest_complete");
});
t("golden rule upheld on default", () => {
  const r = runCommercialIntelligenceManifestPlatform();
  assert.equal(r.goldenRuleUpheld, true);
});
t("valid manifest on default", () => {
  const r = runCommercialIntelligenceManifestPlatform();
  assert.equal(r.valid, true);
});
t("no image generation constraint", () => {
  assert.ok(MANIFEST_CONSTRAINTS.includes("no_image_generation_responsibility"));
});
t("no raw query handoff", () => {
  assert.ok(MANIFEST_CONSTRAINTS.includes("no_raw_user_query_handoff"));
});
t("downstream creative platform", () => {
  assert.ok(DOWNSTREAM_PLATFORMS.includes("creative-intelligence-platform"));
});
t("downstream rendering platform", () => {
  assert.ok(DOWNSTREAM_PLATFORMS.includes("rendering-platform"));
});
t("layer why_exists", () => assert.ok(MANIFEST_LAYERS.includes("why_exists")));
t("layer declaration", () => assert.ok(MANIFEST_LAYERS.includes("declaration")));
t("principle user interest", () => assert.ok(MANIFEST_PRINCIPLES.includes("user_interest_priority")));
t("future autonomous research", () => assert.ok(FUTURE_VISION_CAPABILITIES.includes("autonomous_market_research")));
t("all modules completed", () => {
  const r = runCommercialIntelligenceManifestPlatform();
  assert.equal(r.modulesCompleted.length, 7);
});
t("manifest closes arc 11.11-11.20", () => {
  const r = runCommercialIntelligenceManifestPlatform();
  assert.ok(r.principlesCount === 10 && r.constraintsCount === 8);
});
t("execute with custom platform", () => {
  const r = executeCommercialIntelligenceManifestPlatform({
    productCategory: "electronics",
    productName: "Power Bank",
    businessGoal: "Premium segment CTR",
    marketplaceId: "ozon",
    priceRub: 4500,
  });
  assert.equal(r.version, "11.20.0");
});

console.log(`\ndesign-commercial-intelligence-manifest-platform.spec.ts — ${passed}/25 passed`);
if (passed !== 25) process.exit(1);

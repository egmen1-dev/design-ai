/**
 * Chapter 11.19 — Commercial Intelligence Platform Summary tests (25)
 */
import assert from "node:assert/strict";
import {
  PLATFORM_SUMMARY_VERSION,
  PLATFORM_SUMMARY_GOLDEN_RULE,
  PLATFORM_SUMMARY_MODULES,
  PLATFORM_SUMMARY_COMPONENTS,
  PLATFORM_SUMMARY_LAYERS,
  PLATFORM_SUMMARY_PRINCIPLES,
  runCommercialIntelligencePlatformSummary,
  executeCommercialIntelligencePlatformSummary,
  buildDefaultPlatformInput,
} from "./design-commercial-intelligence-platform-summary-engine";
import { ECOSYSTEM_ENGINES } from "./ecosystem-engines";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("version 11.19.0", () => assert.equal(PLATFORM_SUMMARY_VERSION, "11.19.0"));
t("7 internal modules", () => assert.equal(PLATFORM_SUMMARY_MODULES.length, 7));
t("8 components", () => assert.equal(PLATFORM_SUMMARY_COMPONENTS.length, 8));
t("7 summary layers", () => assert.equal(PLATFORM_SUMMARY_LAYERS.length, 7));
t("7 platform principles", () => assert.equal(PLATFORM_SUMMARY_PRINCIPLES.length, 7));
t("golden rule — unified ecosystem", () => assert.ok(PLATFORM_SUMMARY_GOLDEN_RULE.includes("unified ecosystem")));
t("18 ecosystem engines", () => assert.equal(ECOSYSTEM_ENGINES.length, 18));
t("contract id summary", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.contractId, "design-commercial-intelligence-platform-summary");
});
t("mediator constitution", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.mediatorId, "design-commercial-constitution");
});
t("10 intelligence outputs", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.intelligenceOutputs.length, 10);
});
t("pipeline events triple", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.pipelineEvents.length, 3);
  assert.equal(r.pipelineEvents[2], "design_commercial_intelligence_platform_summary_complete");
});
t("creative handoff ready on default", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.creativeHandoffReady, true);
});
t("quality score >= 75", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.ok(r.qualityScore >= 75);
});
t("all summary layers completed", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.layersCompleted.length, 7);
});
t("layer includes creative_handoff", () => {
  assert.ok(PLATFORM_SUMMARY_LAYERS.includes("creative_handoff"));
});
t("layer includes prediction", () => {
  assert.ok(PLATFORM_SUMMARY_LAYERS.includes("prediction"));
});
t("ecosystem catalog component", () => {
  assert.ok(PLATFORM_SUMMARY_COMPONENTS.includes("Ecosystem Catalog"));
});
t("cross-platform bridge component", () => {
  assert.ok(PLATFORM_SUMMARY_COMPONENTS.includes("Cross-Platform Bridge"));
});
t("fails when constitution invalid flag", () => {
  const r = executeCommercialIntelligencePlatformSummary({
    constitutionReportValid: false,
    platform: buildDefaultPlatformInput(),
  });
  assert.equal(r.creativeHandoffReady, false);
});
t("garden sprayer default input", () => {
  const p = buildDefaultPlatformInput();
  assert.equal(p.productCategory, "garden");
  assert.ok(p.productName.includes("Sprayer"));
});
t("no aestheticsOverBusiness on pass", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.ok(!r.complianceFlags.includes("aestheticsOverBusiness"));
});
t("modules all completed", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.modulesCompleted.length, 7);
});
t("valid summary report", () => {
  const r = runCommercialIntelligencePlatformSummary();
  assert.equal(r.valid, true);
});
t("psychology principle in summary", () => {
  assert.ok(PLATFORM_SUMMARY_PRINCIPLES.includes("psychology_over_assumptions"));
});
t("commercial result over beauty principle", () => {
  assert.ok(PLATFORM_SUMMARY_PRINCIPLES.includes("beauty_as_instrument"));
});

console.log(`\ndesign-commercial-intelligence-platform-summary.spec.ts — ${passed}/25 passed`);
if (passed !== 25) process.exit(1);

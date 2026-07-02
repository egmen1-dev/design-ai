/**
 * Chapter 11.18 — Commercial Constitution Platform tests (25)
 */
import assert from "node:assert/strict";
import {
  COMMERCIAL_CONSTITUTION_PLATFORM_VERSION,
  COMMERCIAL_CONSTITUTION_GOLDEN_RULE,
  COMMERCIAL_CONSTITUTION_MODULES,
  executeCommercialConstitutionPlatform,
  runCommercialConstitutionPlatform,
  buildDefaultConstitutionInput,
} from "./design-commercial-constitution-platform-engine";
import { COMMERCIAL_CONSTITUTION_PRINCIPLES } from "./design-commercial-constitution-platform-types";
import { ECOSYSTEM_ENGINES } from "./ecosystem-engines";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("version 11.18.0", () => assert.equal(COMMERCIAL_CONSTITUTION_PLATFORM_VERSION, "11.18.0"));
t("7 internal modules", () => assert.equal(COMMERCIAL_CONSTITUTION_MODULES.length, 7));
t("golden rule — constitution not aesthetics", () => assert.ok(COMMERCIAL_CONSTITUTION_GOLDEN_RULE.includes("commercial law")));
t("10 principles catalog", () => assert.equal(COMMERCIAL_CONSTITUTION_PRINCIPLES.length, 10));
t("18 ecosystem engines registered", () => assert.equal(ECOSYSTEM_ENGINES.length, 18));
t("default constitution passes", () => {
  const r = runCommercialConstitutionPlatform();
  assert.equal(r.valid, true);
  assert.equal(r.pipelineEvent, "design_commercial_constitution_complete");
});
t("contract id", () => {
  const r = runCommercialConstitutionPlatform();
  assert.equal(r.contractId, "design-commercial-constitution-platform");
});
t("mediator id", () => {
  const r = runCommercialConstitutionPlatform();
  assert.equal(r.mediatorId, "design-commercial-constitution");
});
t("all modules completed", () => {
  const r = runCommercialConstitutionPlatform();
  assert.equal(r.modulesCompleted.length, 7);
});
t("blocks aesthetics over business", () => {
  const r = executeCommercialConstitutionPlatform({
    businessGoal: "sales",
    primaryMessage: "product",
    strategySummary: "strategy",
    measurableObjective: "CTR +5%",
    explanation: "test",
    aestheticsPriorityOverBusiness: true,
  });
  assert.equal(r.valid, false);
  assert.ok(r.violations.some((v) => v.code === "LAW_BEAUTY_OVER_BUSINESS"));
});
t("requires measurable objective", () => {
  const r = executeCommercialConstitutionPlatform({
    businessGoal: "sales",
    primaryMessage: "p",
    strategySummary: "s",
    explanation: "e",
  });
  assert.ok(r.violations.some((v) => v.code === "LAW_MEASURABLE_OBJECTIVE"));
});
t("requires explanation", () => {
  const r = executeCommercialConstitutionPlatform({
    businessGoal: "sales",
    primaryMessage: "p",
    strategySummary: "s",
    measurableObjective: "m",
  });
  assert.ok(r.violations.some((v) => v.code === "LAW_EXPLAINABILITY"));
});
t("requires strategy", () => {
  const r = executeCommercialConstitutionPlatform({
    businessGoal: "sales",
    primaryMessage: "p",
    measurableObjective: "m",
    explanation: "e",
    strategySummary: "",
  });
  assert.ok(r.violations.some((v) => v.code === "LAW_STRATEGY"));
});
t("principles upheld on pass", () => {
  const r = runCommercialConstitutionPlatform();
  assert.ok(r.principlesUpheld.length >= 8);
});
t("buildDefaultConstitutionInput", () => {
  const i = buildDefaultConstitutionInput({
    productCategory: "garden",
    productName: "Sprayer",
    businessGoal: "grow sales",
    marketplaceId: "wildberries",
  });
  assert.ok(i.strategySummary.includes("Sprayer"));
});
t("psychology principle in catalog", () => assert.ok(COMMERCIAL_CONSTITUTION_PRINCIPLES.includes("psychology_over_assumptions")));
t("user interest principle", () => assert.ok(COMMERCIAL_CONSTITUTION_PRINCIPLES.includes("user_interest_priority")));
t("no critical on valid input", () => {
  const r = runCommercialConstitutionPlatform();
  assert.equal(r.violations.filter((v) => v.severity === "critical").length, 0);
});
t("constitution engine is 11.18", () => {
  const engine = ECOSYSTEM_ENGINES.find((e) => e.id === "commercial-constitution");
  assert.equal(engine?.chapterRef, "11.18");
});
t("revenue engine is 11.11", () => {
  const engine = ECOSYSTEM_ENGINES.find((e) => e.id === "revenue-prediction");
  assert.equal(engine?.chapterRef, "11.11");
});
t("consumer psychology first engine", () => assert.equal(ECOSYSTEM_ENGINES[0]?.id, "consumer-psychology"));
t("commercial constitution last engine", () => assert.equal(ECOSYSTEM_ENGINES[17]?.id, "commercial-constitution"));
t("violations have severity", () => {
  const r = executeCommercialConstitutionPlatform({
    businessGoal: "x",
    primaryMessage: "y",
    strategySummary: "",
    aestheticsPriorityOverBusiness: true,
  });
  assert.ok(r.violations.every((v) => v.severity));
});
t("handoff event name", () => {
  const r = runCommercialConstitutionPlatform();
  assert.equal(r.pipelineEvent, "design_commercial_constitution_complete");
});
t("module order 1-7", () => {
  const orders = COMMERCIAL_CONSTITUTION_MODULES.map((m) => m.order);
  assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7]);
});

console.log(`\ndesign-commercial-constitution-platform.spec.ts — ${passed}/25 passed`);
if (passed !== 25) process.exit(1);

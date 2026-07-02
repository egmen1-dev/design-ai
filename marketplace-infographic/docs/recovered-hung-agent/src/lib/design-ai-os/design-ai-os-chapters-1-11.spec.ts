/**
 * Design AI OS — Chapters 1–11 integration tests
 */
import assert from "node:assert/strict";
import { OS_PLATFORM_REGISTRY, getOsPlatform } from "./registry";
import { runChapterPlatform, CHAPTER_GOLDEN_RULES } from "./chapters";
import { runDesignAiOsPipeline } from "./pipeline";
import { runCommercialIntelligenceManifestPlatform } from "../commercial-intelligence-platform";

let n = 0;
function t(name: string, fn: () => void) {
  fn();
  n++;
  console.log(`✔ ${name}`);
}

t("registry has 11 whole chapters", () => assert.equal(OS_PLATFORM_REGISTRY.length, 11));
t("chapter 1 is consumer psychology", () => assert.equal(getOsPlatform(1).id, "consumer-psychology-platform"));
t("chapter 11 is commercial intelligence", () => assert.equal(getOsPlatform(11).id, "commercial-intelligence-platform"));
t("chapters 1-10 chain mediators", () => {
  for (let c = 2; c <= 10; c++) {
    assert.equal(getOsPlatform(c as 2).mediatorChapter, c - 1);
  }
});
t("chapter 11 mediator is 10", () => assert.equal(getOsPlatform(11).mediatorChapter, 10));

const ctx = {
  productCategory: "garden",
  productName: "Battery Sprayer",
  businessGoal: "Increase sales",
  marketplaceId: "wildberries",
  priceRub: 3200,
  targetAudience: "gardeners",
};

const reports: ReturnType<typeof runChapterPlatform>[] = [];
for (let c = 1; c <= 10; c++) {
  const r = runChapterPlatform(c as 1, ctx, reports);
  reports.push(r);
  t(`chapter ${c} runs and passes`, () => {
    assert.equal(r.valid, true);
    assert.ok(r.handoffEvent.endsWith("_complete"));
  });
}

t("full OS pipeline 1-11", () => {
  const p = runDesignAiOsPipeline(ctx);
  assert.equal(p.chaptersCompleted.length, 11);
  assert.equal(p.valid, true);
  assert.equal(p.finalHandoffEvent, "design_commercial_intelligence_manifest_complete");
});

t("chapter 11 manifest version 11.20", () => {
  const m = runCommercialIntelligenceManifestPlatform(ctx);
  assert.equal(m.version, "11.20.0");
});

t("golden rules for all 11 chapters", () => {
  for (let c = 1; c <= 11; c++) {
    assert.ok(CHAPTER_GOLDEN_RULES[c as 1]?.length > 10);
  }
});

t("chapter 10 uses prior outputs", () => {
  const r = runChapterPlatform(10, ctx, reports);
  assert.equal(r.outputs.priorChaptersUsed, 10);
});

console.log(`\ndesign-ai-os-chapters-1-11.spec.ts — ${n} tests passed`);

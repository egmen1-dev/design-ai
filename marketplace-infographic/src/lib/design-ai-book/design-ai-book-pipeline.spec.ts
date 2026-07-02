/**
 * Design AI Book — unified pipeline spec (chapters 8–11)
 */
import assert from "node:assert/strict";
import { runDesignAiBookPipeline, DEFAULT_BOOK_PIPELINE_INPUT } from "./pipeline";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("pipeline runs chapters 8-11", () => {
  const r = runDesignAiBookPipeline();
  assert.deepEqual(r.chaptersCompleted, [8, 9, 10, 11]);
  assert.equal(r.ch11EcosystemEngines, 18);
});

t("pipeline valid on default input", () => {
  const r = runDesignAiBookPipeline(DEFAULT_BOOK_PIPELINE_INPUT);
  assert.equal(r.valid, true);
  assert.equal(r.ch8.chapter, 8);
  assert.equal(r.ch9.chapter, 9);
  assert.equal(r.ch10.chapter, 10);
  assert.equal(r.ch11ManifestValid, true);
});

t("final handoff event", () => {
  const r = runDesignAiBookPipeline();
  assert.equal(r.finalHandoffEvent, "design_commercial_intelligence_manifest_complete");
});

console.log(`\ndesign-ai-book-pipeline.spec.ts — ${passed}/${passed} passed`);

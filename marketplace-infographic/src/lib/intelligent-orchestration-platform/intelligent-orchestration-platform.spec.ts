/**
 * Chapter 9 — Intelligent Orchestration Platform tests
 */
import assert from "node:assert/strict";
import {
  INTELLIGENT_ORCHESTRATION_SECTIONS,
  INTELLIGENT_ORCHESTRATION_PLATFORM_VERSION,
  runIntelligentOrchestrationPlatform,
} from "./sections";
import { getBookChapter } from "../design-ai-book/book-registry";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("chapter 9 expected 19 sections", () => {
  assert.equal(getBookChapter(9).expectedSections, 19);
  assert.equal(INTELLIGENT_ORCHESTRATION_SECTIONS.length, 19);
});
t("refs 9.1 through 9.19", () => {
  assert.equal(INTELLIGENT_ORCHESTRATION_SECTIONS[0].ref, "9.1");
  assert.equal(INTELLIGENT_ORCHESTRATION_SECTIONS[18].ref, "9.19");
});
t("version 9.19.0", () => assert.equal(INTELLIGENT_ORCHESTRATION_PLATFORM_VERSION, "9.19.0"));
t("platform run valid", () => {
  const r = runIntelligentOrchestrationPlatform();
  assert.equal(r.valid, true);
  assert.equal(r.handoffEvent, "intelligent_orchestration_platform_manifest_complete");
});

console.log(`\nintelligent-orchestration-platform.spec.ts — ${passed}/${passed} passed`);

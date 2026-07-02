/**
 * Design AI Book — chapters 1–11 integration spec (audit)
 */
import assert from "node:assert/strict";
import { BOOK_CHAPTERS } from "./book-registry";
import { DESIGN_KNOWLEDGE_PLATFORM_SECTIONS } from "../design-knowledge-platform/sections";
import { INTELLIGENT_ORCHESTRATION_SECTIONS } from "../intelligent-orchestration-platform/sections";
import { HUMAN_AI_COLLABORATION_SECTIONS } from "../human-ai-collaboration/sections";
import { COMMERCIAL_INTELLIGENCE_SECTIONS } from "../commercial-intelligence-platform/sections";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("book has 11 chapters", () => assert.equal(BOOK_CHAPTERS.length, 11));
t("chapter titles", () => {
  assert.equal(BOOK_CHAPTERS[7].title, "Design Knowledge Platform");
  assert.equal(BOOK_CHAPTERS[8].title, "Intelligent Orchestration Platform");
  assert.equal(BOOK_CHAPTERS[9].title, "Human AI Collaboration");
  assert.equal(BOOK_CHAPTERS[10].title, "Commercial Intelligence Platform");
});
t("platform section counts 8-11", () => {
  assert.equal(DESIGN_KNOWLEDGE_PLATFORM_SECTIONS.length, 27);
  assert.equal(INTELLIGENT_ORCHESTRATION_SECTIONS.length, 19);
  assert.equal(HUMAN_AI_COLLABORATION_SECTIONS.length, 15);
  assert.equal(COMMERCIAL_INTELLIGENCE_SECTIONS.length, 20);
});
t("ch11 refs 11.1-11.20", () => {
  assert.equal(COMMERCIAL_INTELLIGENCE_SECTIONS[0].ref, "11.1");
  assert.equal(COMMERCIAL_INTELLIGENCE_SECTIONS[19].ref, "11.20");
});

console.log(`\ndesign-ai-book-ch1-11.spec.ts — ${passed}/${passed} passed`);

/**
 * Chapter 10 — Human AI Collaboration tests
 */
import assert from "node:assert/strict";
import {
  HUMAN_AI_COLLABORATION_SECTIONS,
  HUMAN_AI_COLLABORATION_VERSION,
  runHumanAiCollaboration,
} from "./sections";
import { getBookChapter } from "../design-ai-book/book-registry";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("chapter 10 expected 15 sections", () => {
  assert.equal(getBookChapter(10).expectedSections, 15);
  assert.equal(HUMAN_AI_COLLABORATION_SECTIONS.length, 15);
});
t("refs 10.1 through 10.15", () => {
  assert.equal(HUMAN_AI_COLLABORATION_SECTIONS[0].ref, "10.1");
  assert.equal(HUMAN_AI_COLLABORATION_SECTIONS[14].ref, "10.15");
});
t("version 10.15.0", () => assert.equal(HUMAN_AI_COLLABORATION_VERSION, "10.15.0"));
t("platform run valid", () => {
  const r = runHumanAiCollaboration();
  assert.equal(r.valid, true);
});

console.log(`\nhuman-ai-collaboration.spec.ts — ${passed}/${passed} passed`);

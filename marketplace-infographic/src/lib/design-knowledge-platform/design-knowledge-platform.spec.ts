/**
 * Chapter 8 — Design Knowledge Platform tests
 */
import assert from "node:assert/strict";
import {
  DESIGN_KNOWLEDGE_PLATFORM_SECTIONS,
  DESIGN_KNOWLEDGE_PLATFORM_VERSION,
  runDesignKnowledgePlatform,
} from "./sections";
import { getBookChapter } from "../design-ai-book/book-registry";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

t("chapter 8 expected 27 sections", () => {
  assert.equal(getBookChapter(8).expectedSections, 27);
  assert.equal(DESIGN_KNOWLEDGE_PLATFORM_SECTIONS.length, 27);
});
t("refs 8.1 through 8.27", () => {
  assert.equal(DESIGN_KNOWLEDGE_PLATFORM_SECTIONS[0].ref, "8.1");
  assert.equal(DESIGN_KNOWLEDGE_PLATFORM_SECTIONS[26].ref, "8.27");
});
t("version 8.27.0", () => assert.equal(DESIGN_KNOWLEDGE_PLATFORM_VERSION, "8.27.0"));
t("bridges to ch5 engine sections", () => {
  assert.ok(DESIGN_KNOWLEDGE_PLATFORM_SECTIONS[3].responsibility.includes("5.3"));
  assert.ok(DESIGN_KNOWLEDGE_PLATFORM_SECTIONS[20].responsibility.includes("5.20"));
});
t("platform run valid", () => {
  const r = runDesignKnowledgePlatform({ productCategory: "garden", marketplaceId: "wildberries" });
  assert.equal(r.valid, true);
  assert.equal(r.sectionsRegistered, 27);
});

console.log(`\ndesign-knowledge-platform.spec.ts — ${passed}/${passed} passed`);

/**
 * DESIGN AI v18 — Vision tests (Chapter 3.17)
 */
import assert from "node:assert/strict";
import { createEmptyRenderBlueprint, detectVisionIssues, visionScoreFromBlueprint } from "./index";

function testDetectsWhitespaceIssue() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "electronics" });
  bp.background.decorDensity = 0.9;
  const issues = detectVisionIssues(bp);
  assert.ok(issues.some((i) => i.code === "WHITESPACE"));
  console.log("✔ vision detects whitespace violations");
}

function testVisionScorePenalty() {
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "x" });
  bp.background.decorDensity = 0.9;
  const score = visionScoreFromBlueprint(bp);
  assert.ok(score < 100);
  console.log("✔ vision score penalizes known issues");
}

testDetectsWhitespaceIssue();
testVisionScorePenalty();
console.log("\nvision-tests.spec.ts — all passed");

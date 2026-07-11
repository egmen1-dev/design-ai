import assert from "node:assert/strict";
import {
  applyCompetitiveObjectScale,
  competitiveDominanceEnabled,
  resolveCategoryDominanceBoost,
  shouldRetryForDominance,
} from "./dominance-preservation";

process.env.DAOS_COMPETITIVE_DOMINANCE = "1";
assert.ok(competitiveDominanceEnabled());
assert.equal(resolveCategoryDominanceBoost("auto", ""), 0.07);
assert.equal(applyCompetitiveObjectScale(0.62, "auto", ""), 0.69);
assert.equal(
  shouldRetryForDominance({
    enabled: true,
    law101Passed: true,
    attentionHierarchyScore: 40,
    productVisualWeight: 20,
    headlineVisualWeight: 10,
    benefitsVisualWeight: 5,
    badgeVisualWeight: 3,
    backgroundCompetition: 10,
    primaryFocusRatio: 0.35,
    attentionCompetitionIndex: 20,
    productDominanceScore: 48,
    peakX: 0.5,
    peakY: 0.5,
    peakOnProduct: true,
    version: "1.0.0-quality-cycle-5",
  }),
  true,
);
console.log("dominance-preservation.test.ts: ok");

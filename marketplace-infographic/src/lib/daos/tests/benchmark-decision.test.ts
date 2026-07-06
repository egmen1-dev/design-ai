/**
 * DAOS benchmark decision engine tests
 * Run: npx tsx src/lib/daos/tests/benchmark-decision.test.ts
 */
import assert from "node:assert/strict";
import {
  computeAggregateStats,
  computePairDelta,
  evaluateBenchmarkDecision,
} from "../benchmark/decision";
import type { BenchmarkProductPair, BenchmarkRunMetrics } from "../benchmark/types";

function metrics(overrides: Partial<BenchmarkRunMetrics>): BenchmarkRunMetrics {
  return {
    arm: "baseline",
    productId: "p1",
    productName: "Test",
    meaningLossCount: 2,
    meaningLossCodes: [],
    modulesIgnored: ["a", "b"],
    modulesCompiled: [],
    modulesStillIgnored: ["a", "b"],
    generationTimeMs: 1000,
    ...overrides,
  };
}

const pair: BenchmarkProductPair = {
  product: {
    id: "p1",
    name: "Test",
    category: "electronics",
    complexity: "low",
    prompt: "test",
    image: { background: "#000", accent: "#fff", shape: "toy" },
  },
  seed: "seed",
  baseline: metrics({ arm: "baseline", summaryScore: 70, modulesCompiled: [], meaningLossCount: 3 }),
  daos: metrics({
    arm: "daos",
    summaryScore: 75,
    modulesCompiled: ["layout_coordinates", "hierarchy"],
    modulesStillIgnored: [],
    meaningLossCount: 1,
    promptLength: 900,
  }),
  delta: computePairDelta(
    metrics({ summaryScore: 70, modulesCompiled: [], meaningLossCount: 3 }),
    metrics({
      summaryScore: 75,
      modulesCompiled: ["layout_coordinates", "hierarchy"],
      modulesStillIgnored: [],
      meaningLossCount: 1,
      promptLength: 900,
    }),
  ),
};

assert.equal(pair.delta.deltaSummaryScore, 5);
assert.equal(pair.delta.deltaMeaningLoss, -2);
assert.equal(pair.delta.deltaModulesCompiled, 2);
console.log("✓ pair delta computed");

const aggregate = computeAggregateStats([pair]);
assert.equal(aggregate.averageSummaryDelta, 5);
assert.equal(aggregate.meaningLossImproved, true);
assert.equal(aggregate.modulesCompiledImproved, true);
console.log("✓ aggregate stats computed");

const success = evaluateBenchmarkDecision(aggregate, [pair]);
assert.equal(success.status, "SUCCESS");
assert.match(success.recommendation, /Phase 2/);
console.log("✓ SUCCESS when criteria met");

const weakAggregate = computeAggregateStats([
  {
    ...pair,
    delta: computePairDelta(
      metrics({ summaryScore: 80, meaningLossCount: 1, modulesCompiled: [] }),
      metrics({ summaryScore: 79, meaningLossCount: 2, modulesCompiled: [] }),
    ),
    baseline: metrics({ summaryScore: 80, meaningLossCount: 1 }),
    daos: metrics({ summaryScore: 79, meaningLossCount: 2, arm: "daos" }),
  },
]);
const stop = evaluateBenchmarkDecision(weakAggregate, [pair]);
assert.equal(stop.status, "STOP");
assert.match(stop.recommendation, /Do NOT benchmark 30/);
console.log("✓ STOP when criteria not met");

console.log("\nAll benchmark-decision tests passed.");

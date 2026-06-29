/**
 * DESIGN AI v18 — Performance Model tests (Chapter 3.14)
 */

import assert from "node:assert/strict";
import {
  createEmptyRenderBlueprint,
  buildAgentCacheKey,
  hashAgentInput,
  PerformanceCache,
  runWithAgentCache,
  planIncrementalRebuild,
  reuseUnchangedSections,
  shouldRunLazyStage,
  PerformanceTracker,
  PerformanceLayer,
  assertWithinLimits,
  DEFAULT_PERFORMANCE_LIMITS,
  assertAsyncOperation,
  PipelineContextPool,
  PipelineQueue,
  isOverBudget,
  STAGE_TIME_BUDGET_MS,
  canRunAgentsParallel,
} from "./index";

async function testAgentCacheKey() {
  const k1 = buildAgentCacheKey({ revision: 1, agentVersion: "2.0.0", inputHash: "abc" });
  const k2 = buildAgentCacheKey({ revision: 1, agentVersion: "2.0.0", inputHash: "abc" });
  const k3 = buildAgentCacheKey({ revision: 2, agentVersion: "2.0.0", inputHash: "abc" });
  assert.equal(k1, k2);
  assert.notEqual(k1, k3);
  console.log("✔ agent cache key is deterministic from revision + version + input hash");
}

async function testAgentCacheHit() {
  const cache = new PerformanceCache<string>();
  let calls = 0;
  const input = { revision: 3, agentVersion: "1.0.0", inputHash: hashAgentInput({ x: 1 }) };
  const r1 = await runWithAgentCache(cache, input, async () => {
    calls += 1;
    return "result";
  });
  const r2 = await runWithAgentCache(cache, input, async () => {
    calls += 1;
    return "result";
  });
  assert.equal(r1.cached, false);
  assert.equal(r2.cached, true);
  assert.equal(calls, 1);
  assert.ok(cache.cacheHitRate > 0);
  console.log("✔ agent cache avoids duplicate execution");
}

function testIncrementalRebuildLighting() {
  const plan = planIncrementalRebuild("lighting");
  assert.ok(plan.stagesToRun.includes("lighting"));
  assert.ok(plan.stagesToRun.includes("composition"));
  assert.ok(plan.sectionsToSkip.includes("story"));
  assert.ok(plan.sectionsToSkip.includes("scene"));
  assert.ok(plan.sectionsToSkip.includes("creative"));
  console.log("✔ incremental rebuild only reruns dependent stages");
}

function testZeroCopyReuse() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "electronics" });
  const next = {
    ...bp,
    lighting: { ...bp.lighting, temperature: 3200 },
    meta: { ...bp.meta, revision: 1 },
  };
  const merged = reuseUnchangedSections(bp, next, ["lighting"]);
  assert.equal(merged.story, bp.story);
  assert.equal(merged.scene, bp.scene);
  assert.equal(merged.lighting.temperature, 3200);
  console.log("✔ zero-copy reuses unchanged section references");
}

function testLazyEvaluation() {
  const skip = shouldRunLazyStage("commercial-photographer", { renderSucceeded: false });
  assert.equal(skip.run, false);
  const run = shouldRunLazyStage("scene", { renderSucceeded: false });
  assert.equal(run.run, true);
  console.log("✔ lazy evaluation skips heavy stages after render failure");
}

function testPerformanceTrackerBottleneck() {
  const tracker = new PerformanceTracker();
  tracker.recordStage({
    stage: "story",
    durationMs: 1800,
    waitMs: 0,
    memoryMB: 32,
    layer: PerformanceLayer.DECISION,
    budgetKey: "story",
  });
  tracker.recordStage({
    stage: "render-provider",
    durationMs: 8000,
    waitMs: 200,
    memoryMB: 128,
    layer: PerformanceLayer.RENDER,
  });
  tracker.recordStage({
    stage: "validation",
    durationMs: 50,
    waitMs: 0,
    memoryMB: 16,
    layer: PerformanceLayer.DECISION,
    budgetKey: "validation",
  });
  tracker.setCacheHitRate(0.4);
  tracker.recordRetry();
  const metrics = tracker.finalize();
  assert.equal(metrics.bottlenecks[0].stage, "render-provider");
  assert.equal(metrics.retryCount, 1);
  assert.equal(metrics.cacheHitRate, 0.4);
  assert.ok(metrics.agentTimeMs > 0);
  console.log("✔ performance tracker records metrics and identifies bottlenecks");
}

function testResourceLimits() {
  assert.doesNotThrow(() =>
    assertWithinLimits(DEFAULT_PERFORMANCE_LIMITS, {
      memoryMB: 100,
      cpuTimeMs: 1000,
      parallelAgents: 2,
      retries: 1,
    }),
  );
  assert.throws(
    () =>
      assertWithinLimits(DEFAULT_PERFORMANCE_LIMITS, {
        memoryMB: 9999,
        cpuTimeMs: 1000,
        parallelAgents: 2,
        retries: 1,
      }),
    /Memory limit exceeded/,
  );
  console.log("✔ resource limits enforced");
}

function testAsyncModel() {
  assert.doesNotThrow(() =>
    assertAsyncOperation("provider", () => Promise.resolve("ok")),
  );
  assert.throws(
    () => assertAsyncOperation("provider", () => "sync"),
    /Blocking operation forbidden/,
  );
  console.log("✔ async model rejects blocking network-style calls");
}

function testPipelineQueueIsolation() {
  const pool = new PipelineContextPool();
  const queue = new PipelineQueue<string>(2);
  const a = pool.create();
  const b = pool.create();
  queue.enqueue(a.id, "job-a");
  queue.enqueue(b.id, "job-b");
  queue.enqueue(a.id, "job-c");
  assert.equal(queue.pending, 3);
  const j1 = queue.dequeue();
  const j2 = queue.dequeue();
  assert.equal(j1?.contextId, a.id);
  assert.equal(j2?.contextId, b.id);
  assert.equal(queue.dequeue(), undefined);
  queue.complete();
  const j3 = queue.dequeue();
  assert.ok(j3);
  pool.release(a.id);
  pool.release(b.id);
  assert.equal(pool.size(), 0);
  console.log("✔ pipeline queue isolates contexts and limits concurrency");
}

function testStageBudgets() {
  assert.equal(STAGE_TIME_BUDGET_MS.validation, 100);
  assert.equal(isOverBudget("validation", 150), true);
  assert.equal(isOverBudget("validation", 50), false);
  console.log("✔ stage time budgets defined");
}

function testParallelAgentsCompatible() {
  assert.equal(canRunAgentsParallel("lighting-director", "camera-director"), true);
  console.log("✔ parallel execution compatible with existing agent grouping");
}

async function main() {
  await testAgentCacheKey();
  await testAgentCacheHit();
  testIncrementalRebuildLighting();
  testZeroCopyReuse();
  testLazyEvaluation();
  testPerformanceTrackerBottleneck();
  testResourceLimits();
  testAsyncModel();
  testPipelineQueueIsolation();
  testStageBudgets();
  testParallelAgentsCompatible();
  console.log("\nperformance-model.spec.ts — all passed");
}

main();

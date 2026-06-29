import assert from "node:assert/strict";
import {
  advanceLifecycleStage,
  BlueprintLifecycle,
  createEmptyRenderBlueprint,
  DecisionGraph,
  LifecycleManager,
  MutationEngine,
  MutationEngineError,
  PipelineState,
  RetryEngine,
  RetryKind,
  RetryLimitExceededError,
  SnapshotManager,
  canRunAgentsParallel,
  storyDirectorAgent,
  assertStagePreconditions,
  LifecycleTransitionError,
} from "./index";
import { AgentRegistry } from "./agent-registry";
import type { AgentResultBase, AgentSectionUpdates } from "./agent-contracts";

function testRevisionIncrementsOnMutation() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const agent = {
    id: "creative-engine" as const,
    version: "1",
    stage: BlueprintLifecycle.CREATIVE_DEFINED,
    canExecute: () => true,
    execute: async () => ({}) as AgentResultBase,
    toUpdates: () => ({ creative: { audience: "a", emotion: "b" } }) as AgentSectionUpdates,
  };
  bp.lifecycle.stage = BlueprintLifecycle.CREATIVE_DEFINED;
  const result = engine.apply({
    blueprint: bp,
    graph,
    agent,
    result: {
      confidence: 80,
      decisionTrace: [],
      warnings: [],
      updates: { creative: { audience: "a", emotion: "b" } },
    },
    expectedRevision: 0,
  });
  assert.equal(result.blueprint.meta.revision, 1);
  console.log("✔ revision increments on mutation");
}

function testOptimisticLockRejectsStaleAgent() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "x" });
  bp.meta.revision = 5;
  bp.lifecycle.stage = BlueprintLifecycle.CREATIVE_DEFINED;
  const graph = DecisionGraph.fromBlueprint(bp);
  const agent = {
    id: "creative-engine" as const,
    version: "1",
    stage: BlueprintLifecycle.CREATIVE_DEFINED,
    canExecute: () => true,
    execute: async () => ({}) as AgentResultBase,
    toUpdates: () => ({ creative: { audience: "x", emotion: "y" } }) as AgentSectionUpdates,
  };
  assert.throws(
    () =>
      engine.apply({
        blueprint: bp,
        graph,
        agent,
        result: {
          confidence: 70,
          decisionTrace: [],
          warnings: [],
          updates: { creative: { audience: "x", emotion: "y" } },
        },
        expectedRevision: 4,
      }),
    MutationEngineError,
  );
  console.log("✔ optimistic lock rejects stale revision");
}

function testSnapshotRollbackValidatedOnly() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const dirty = mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: false });
  const valid = mgr.store({
    blueprint: { ...bp, meta: { ...bp.meta, revision: 1 } },
    graph,
    stage: BlueprintLifecycle.PRODUCT_ANALYZED,
    validated: true,
  });
  assert.throws(() => mgr.rollbackToSnapshot(dirty.id, bp, graph), LifecycleTransitionError);
  const restored = mgr.rollbackToLastValidated(bp, graph);
  assert.equal(restored.snapshot.id, valid.id);
  assert.equal(restored.blueprint.meta.revision, 1);
  console.log("✔ rollback only to VALIDATED snapshots");
}

function testRetryLimits() {
  const retry = new RetryEngine({ agent: 2, stage: 2, pipeline: 1 });
  const stage = BlueprintLifecycle.PHOTO_DEFINED;
  retry.recordRetry(RetryKind.Agent, stage, "lighting-director");
  retry.recordRetry(RetryKind.Agent, stage, "lighting-director");
  assert.throws(
    () => retry.recordRetry(RetryKind.Agent, stage, "lighting-director"),
    RetryLimitExceededError,
  );
  console.log("✔ retry limits enforced");
}

function testStagePreconditionsSceneDirector() {
  let bp = createEmptyRenderBlueprint({ seed: 4, category: "x" });
  bp = advanceLifecycleStage(bp);
  assert.throws(
    () => assertStagePreconditions(bp, BlueprintLifecycle.SCENE_DEFINED),
    LifecycleTransitionError,
  );
  console.log("✔ scene stage requires story/creative/product LOCKED");
}

function testParallelCameraAndMaterials() {
  assert.equal(
    canRunAgentsParallel("camera-director", "material-director"),
    true,
  );
  assert.equal(
    canRunAgentsParallel("lighting-director", "material-director"),
    false,
  );
  console.log("✔ parallel groups respect HARD dependencies");
}

async function testExecuteStageWithRegistry() {
  const mgr = new LifecycleManager();
  mgr.registerAgent(storyDirectorAgent);

  let bp = createEmptyRenderBlueprint({ seed: 5, category: "appliances" });
  bp = advanceLifecycleStage(bp);
  const mgr2 = new LifecycleManager();
  bp = mgr2.apply("product-analyzer", bp, {
    confidence: 90,
    decisionTrace: [],
    warnings: [],
    updates: { product: { shape: "box" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  bp = mgr2.apply("creative-engine", bp, {
    confidence: 85,
    decisionTrace: [],
    warnings: [],
    updates: { creative: { audience: "home", emotion: "calm" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);

  const events: string[] = [];
  mgr.onEvent((e) => events.push(e.type));

  const result = await mgr.executeStage(bp, BlueprintLifecycle.STORY_DEFINED, {
    productCategory: "appliances",
    creativeGoal: "Technical",
  });

  assert.ok(events.includes("StageStarted"));
  assert.ok(events.includes("MutationApplied"));
  assert.ok(events.includes("SnapshotCreated"));
  assert.ok(events.includes("StageFinished"));
  assert.equal(result.blueprint.meta.revision, 3);
  assert.ok(mgr.getSnapshots().length >= 1);
  assert.equal(mgr.getPipelineState(), PipelineState.RUNNING);
  console.log("✔ executeStage via registry + events + snapshot");
}

function testAgentRegistryNoDirectImport() {
  const registry = new AgentRegistry();
  registry.register(storyDirectorAgent);
  assert.equal(registry.getByStage(BlueprintLifecycle.STORY_DEFINED).length, 1);
  console.log("✔ agent registry isolates agent lookup");
}

async function run() {
  testRevisionIncrementsOnMutation();
  testOptimisticLockRejectsStaleAgent();
  testSnapshotRollbackValidatedOnly();
  testRetryLimits();
  testStagePreconditionsSceneDirector();
  testParallelCameraAndMaterials();
  testAgentRegistryNoDirectImport();
  await testExecuteStageWithRegistry();
}

run().then(() => {
  console.log("\nAll lifecycle manager Chapter 3.4 specs passed.");
});

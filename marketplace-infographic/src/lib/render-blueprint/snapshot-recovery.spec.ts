import assert from "node:assert/strict";
import {
  SnapshotManager,
  SnapshotIntegrityError,
  RecoveryLimitExceededError,
  RollbackStrategy,
  RecoveryEventType,
  DecisionGraph,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
  LifecycleTransitionError,
  DEFAULT_MAX_RECOVERY_ATTEMPTS,
} from "./index";

function testValidatedSnapshotOnlyAfterValidation() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  assert.throws(
    () =>
      mgr.store({
        blueprint: bp,
        graph,
        stage: BlueprintLifecycle.NEW,
        validated: true,
        validation: {
          passed: false,
          score: 0,
          level: 1,
          errors: [{ code: "X", section: "meta", severity: "error", message: "fail" }],
          warnings: [],
          recommendations: [],
        },
      }),
    LifecycleTransitionError,
  );
  console.log("✔ snapshot refused when validation fails");
}

function testRollbackOnlyValidated() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const dirty = mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: false });
  const valid = mgr.store({
    blueprint: { ...bp, meta: { ...bp.meta, revision: 1 } },
    graph,
    stage: BlueprintLifecycle.PRODUCT_ANALYZED,
    validated: true,
  });
  assert.throws(() => mgr.rollbackToSnapshot(dirty.id, bp, graph), LifecycleTransitionError);
  const result = mgr.rollbackToLastValidated(bp, graph);
  assert.equal(result.snapshot.id, valid.id);
  assert.equal(result.blueprint.meta.revision, 1);
  assert.equal(result.strategy, RollbackStrategy.BLUEPRINT);
  console.log("✔ rollback only to VALIDATED snapshots");
}

function testChecksumIntegrity() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const snap = mgr.store({
    blueprint: bp,
    graph,
    stage: BlueprintLifecycle.PRODUCT_ANALYZED,
    validated: true,
  });
  assert.doesNotThrow(() => mgr.verifyIntegrity(snap));
  const corrupted = { ...snap, checksum: "bad" };
  assert.throws(() => mgr.verifyIntegrity(corrupted), SnapshotIntegrityError);
  console.log("✔ checksum detects corrupted snapshot");
}

function testCowDeltasTracked() {
  const mgr = new SnapshotManager();
  let bp = createEmptyRenderBlueprint({ seed: 4, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: true });
  bp = { ...bp, meta: { ...bp.meta, revision: 1 }, product: { ...bp.product, shape: "round" } };
  const s2 = mgr.store({
    blueprint: bp,
    graph,
    stage: BlueprintLifecycle.PRODUCT_ANALYZED,
    validated: true,
    agentId: "product-analyzer",
  });
  assert.ok(s2.deltas.some((d) => d.section === "product"));
  assert.ok(s2.sectionRefs.product);
  console.log("✔ COW deltas track changed sections");
}

function testSnapshotComparison() {
  const mgr = new SnapshotManager();
  let bp = createEmptyRenderBlueprint({ seed: 5, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const s1 = mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: true });
  bp = { ...bp, creative: { ...bp.creative, goal: "Premium" } };
  const s2 = mgr.store({
    blueprint: bp,
    graph,
    stage: BlueprintLifecycle.CREATIVE_DEFINED,
    validated: true,
  });
  const diff = mgr.compare(s1.id, s2.id);
  assert.ok(diff.changedSections.includes("creative"));
  console.log("✔ snapshot comparison detects section changes");
}

function testReplayOrder() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 6, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: true });
  mgr.store({
    blueprint: { ...bp, meta: { ...bp.meta, revision: 1 } },
    graph,
    stage: BlueprintLifecycle.PRODUCT_ANALYZED,
    validated: true,
  });
  const chain = mgr.replay();
  assert.equal(chain.length, 2);
  assert.ok(chain[0]!.timestamp <= chain[1]!.timestamp);
  console.log("✔ replay returns ordered snapshot chain");
}

function testRecoveryEvents() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 7, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const snap = mgr.store({
    blueprint: bp,
    graph,
    stage: BlueprintLifecycle.STORY_DEFINED,
    validated: true,
  });
  const result = mgr.recover(snap.id, { ...bp, meta: { ...bp.meta, revision: 9 } }, graph);
  assert.ok(result.events.some((e) => e.type === RecoveryEventType.RecoveryStarted));
  assert.ok(result.events.some((e) => e.type === RecoveryEventType.SnapshotLoaded));
  assert.ok(result.events.some((e) => e.type === RecoveryEventType.RecoveryFinished));
  console.log("✔ recovery publishes lifecycle events");
}

function testRecoveryLimit() {
  const mgr = new SnapshotManager({ maxRecoveryAttempts: 2 });
  const bp = createEmptyRenderBlueprint({ seed: 8, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const snap = mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: true });
  mgr.recover(snap.id, bp, graph);
  mgr.recover(snap.id, bp, graph);
  assert.throws(() => mgr.recover(snap.id, bp, graph), RecoveryLimitExceededError);
  assert.equal(DEFAULT_MAX_RECOVERY_ATTEMPTS, 3);
  console.log("✔ recovery limit enforced");
}

function testRetentionKeepsFinal() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 9, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: true });
  const final = mgr.store({
    blueprint: { ...bp, meta: { ...bp.meta, revision: 1 } },
    graph,
    stage: BlueprintLifecycle.PRODUCT_ANALYZED,
    validated: true,
  });
  const kept = mgr.applyRetention(true);
  assert.equal(kept.length, 1);
  assert.equal(kept[0]!.id, final.id);
  assert.equal(mgr.getAll().length, 1);
  console.log("✔ retention keeps final snapshot after success");
}

function testImmutableSnapshot() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 10, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const snap = mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: true });
  assert.throws(() => {
    (snap as { revision: number }).revision = 999;
  });
  console.log("✔ snapshot is immutable after creation");
}

function testSectionRollbackInvalidatesDeps() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 11, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.STORY_DEFINED, validated: true });
  const result = mgr.rollbackSection("story", bp, graph);
  assert.equal(result.strategy, RollbackStrategy.SECTION);
  assert.ok(result.invalidatedSections.includes("scene"));
  console.log("✔ section rollback invalidates dependencies");
}

async function run() {
  testValidatedSnapshotOnlyAfterValidation();
  testRollbackOnlyValidated();
  testChecksumIntegrity();
  testCowDeltasTracked();
  testSnapshotComparison();
  testReplayOrder();
  testRecoveryEvents();
  testRecoveryLimit();
  testRetentionKeepsFinal();
  testImmutableSnapshot();
  testSectionRollbackInvalidatesDeps();
}

run().then(() => {
  console.log("\nAll snapshot recovery Chapter 3.8 specs passed.");
});

/**
 * DESIGN AI v18 — Error Handling & Recovery tests (Chapter 3.16)
 */

import assert from "node:assert/strict";
import {
  RecoveryEngine,
  NonRecoverableError,
  classifyError,
  strategyForSeverity,
  ErrorSeverity,
  RecoveryStrategy,
  RecoveryErrorCategory,
  planProviderRecovery,
  providerRecoveryToPlan,
  planVisionRecovery,
  escalateStrategy,
  rollbackStrategyForRecovery,
  assertRecoveryInvariants,
  assertRecoveryInvariantsOrThrow,
  validateAgentRecommendation,
  RollbackStrategy,
  SnapshotManager,
  DecisionGraph,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
} from "./index";

function testClassifyProviderTimeout() {
  const err = classifyError({
    message: "Provider request timeout",
    httpStatus: undefined,
    category: RecoveryErrorCategory.NETWORK,
  });
  assert.equal(err.category, RecoveryErrorCategory.NETWORK);
  assert.equal(err.severity, ErrorSeverity.MEDIUM);
  assert.equal(err.recoverable, true);
  console.log("✔ classifies network timeout as recoverable MEDIUM");
}

function testFatalBlueprintCorrupt() {
  const err = classifyError({
    message: "Blueprint checksum mismatch",
    code: "CHECKSUM_MISMATCH",
  });
  assert.equal(err.severity, ErrorSeverity.FATAL);
  assert.equal(err.recoverable, false);
  assert.throws(() => new RecoveryEngine().decideRecovery(err), NonRecoverableError);
  console.log("✔ fatal blueprint corruption aborts pipeline");
}

function testSeverityRecoveryMatrix() {
  assert.equal(strategyForSeverity(ErrorSeverity.LOW), RecoveryStrategy.CONTINUE);
  assert.equal(strategyForSeverity(ErrorSeverity.MEDIUM), RecoveryStrategy.LOCAL_RETRY);
  assert.equal(strategyForSeverity(ErrorSeverity.HIGH), RecoveryStrategy.STAGE_ROLLBACK);
  assert.equal(strategyForSeverity(ErrorSeverity.CRITICAL), RecoveryStrategy.BLUEPRINT_ROLLBACK);
  assert.equal(strategyForSeverity(ErrorSeverity.FATAL), RecoveryStrategy.ABORT);
  console.log("✔ recovery matrix maps severity to strategy");
}

function testProviderFailure429() {
  const action = planProviderRecovery({
    httpStatus: 429,
    currentProvider: "flux",
  });
  assert.equal(action.action, "wait");
  const plan = providerRecoveryToPlan(
    action,
    classifyError({ message: "rate limited", httpStatus: 429, provider: "flux" }),
  );
  assert.equal(plan.strategy, RecoveryStrategy.PROVIDER_RETRY);
  assert.equal(plan.waitMs, 2000);
  console.log("✔ provider HTTP 429 → wait and retry");
}

function testProviderFailure500Switch() {
  const action = planProviderRecovery({
    httpStatus: 500,
    currentProvider: "flux",
  });
  assert.equal(action.action, "switch");
  assert.equal(action.nextProvider, "gpt-image");
  console.log("✔ provider HTTP 500 → switch to fallback chain");
}

function testValidationRecoveryBeforeRender() {
  const engine = new RecoveryEngine();
  const err = classifyError({
    message: "Whitespace validation failed",
    category: RecoveryErrorCategory.VALIDATION,
  });
  const plan = engine.decideRecovery(err, undefined, BlueprintLifecycle.COMPOSITION_DEFINED);
  assert.equal(plan.strategy, RecoveryStrategy.STAGE_ROLLBACK);
  console.log("✔ validation failure triggers stage rollback before render");
}

function testCompositeRetryWithoutRender() {
  const engine = new RecoveryEngine();
  const err = classifyError({
    message: "Composite shadow mismatch",
    category: RecoveryErrorCategory.COMPOSITE,
  });
  const plan = engine.decideRecovery(err);
  assert.equal(plan.strategy, RecoveryStrategy.COMPOSITE_RETRY);
  console.log("✔ composite failure uses composite retry without new render");
}

function testVisionRecoveryTable() {
  const bg = planVisionRecovery("wrong_background");
  assert.equal(bg.strategy, RecoveryStrategy.LOCAL_RETRY);
  const lighting = planVisionRecovery("wrong_lighting");
  assert.equal(lighting.strategy, RecoveryStrategy.STAGE_ROLLBACK);
  const overlay = planVisionRecovery("png_overlay_feel");
  assert.equal(overlay.strategy, RecoveryStrategy.COMPOSITE_RETRY);
  console.log("✔ vision QA problems map to correct recovery strategies");
}

function testEscalationChain() {
  assert.equal(escalateStrategy(RecoveryStrategy.LOCAL_RETRY), RecoveryStrategy.STAGE_ROLLBACK);
  assert.equal(escalateStrategy(RecoveryStrategy.STAGE_ROLLBACK), RecoveryStrategy.BLUEPRINT_ROLLBACK);
  assert.equal(escalateStrategy(RecoveryStrategy.BLUEPRINT_ROLLBACK), RecoveryStrategy.PROVIDER_SWITCH);
  assert.equal(escalateStrategy(RecoveryStrategy.PROVIDER_SWITCH), RecoveryStrategy.ABORT);
  console.log("✔ failure escalation follows retry → rollback → switch → abort");
}

function testRetryLimitEscalation() {
  const engine = new RecoveryEngine({
    providerRetry: 1,
    layoutRetry: 1,
    photoRetry: 0,
    visionRetry: 1,
    chiefRetry: 1,
  });
  const err = classifyError({
    message: "Poor photo score",
    category: RecoveryErrorCategory.VISION,
  });
  const plan = engine.decideRecovery(err);
  assert.notEqual(plan.strategy, RecoveryStrategy.LOCAL_RETRY);
  console.log("✔ retry limit triggers escalation to next strategy");
}

function testSnapshotBlueprintRollback() {
  const mgr = new SnapshotManager();
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
  const graph = DecisionGraph.fromBlueprint(bp);
  const snap = mgr.store({
    blueprint: bp,
    graph,
    stage: BlueprintLifecycle.STORY_DEFINED,
    validated: true,
  });
  const rollback = rollbackStrategyForRecovery(RecoveryStrategy.BLUEPRINT_ROLLBACK);
  assert.equal(rollback, RollbackStrategy.BLUEPRINT);
  const result = mgr.recover(snap.id, { ...bp, meta: { ...bp.meta, revision: 99 } }, graph);
  assert.equal(result.strategy, RollbackStrategy.BLUEPRINT);
  assert.equal(result.blueprint.meta.revision, bp.meta.revision);
  console.log("✔ blueprint rollback restores last VALIDATED snapshot");
}

function testRecoveryInvariants() {
  const bp = createEmptyRenderBlueprint({ seed: 5, category: "tools" });
  const after = {
    ...bp,
    meta: { ...bp.meta, seed: 999 },
  };
  const violations = assertRecoveryInvariants({ before: bp, after, seedLocked: bp.meta.seed });
  assert.ok(violations.some((v) => v.code === "SEED_CHANGED"));
  assert.throws(
    () => assertRecoveryInvariantsOrThrow({ before: bp, after, seedLocked: bp.meta.seed }),
    /Seed changed/,
  );
  console.log("✔ recovery invariants block unauthorized seed/version changes");
}

function testAgentRecommendationOnly() {
  validateAgentRecommendation({
    strategy: RecoveryStrategy.STAGE_ROLLBACK,
    reason: "Critics rejected layout",
    confidence: 75,
    affectedSections: ["composition"],
  });
  assert.throws(
    () =>
      validateAgentRecommendation({
        strategy: RecoveryStrategy.LOCAL_RETRY,
        reason: "",
        confidence: 50,
        affectedSections: [],
      }),
    /reason/,
  );
  console.log("✔ agent recovery recommendation validated — execution is LM-only");
}

function testRecoveryLogAndMetrics() {
  const engine = new RecoveryEngine();
  const err = classifyError({ message: "timeout", category: RecoveryErrorCategory.NETWORK });
  const plan = engine.decideRecovery(err);
  engine.recordExecution(plan, true, 120);
  const metrics = engine.buildMetrics();
  assert.equal(metrics.successfulRecoveries, 1);
  assert.ok(engine.getLogs().length === 1);
  console.log("✔ recovery log and metrics recorded");
}

function main() {
  testClassifyProviderTimeout();
  testFatalBlueprintCorrupt();
  testSeverityRecoveryMatrix();
  testProviderFailure429();
  testProviderFailure500Switch();
  testValidationRecoveryBeforeRender();
  testCompositeRetryWithoutRender();
  testVisionRecoveryTable();
  testEscalationChain();
  testRetryLimitEscalation();
  testSnapshotBlueprintRollback();
  testRecoveryInvariants();
  testAgentRecommendationOnly();
  testRecoveryLogAndMetrics();
  console.log("\nrecovery-engine.spec.ts — all passed");
}

main();

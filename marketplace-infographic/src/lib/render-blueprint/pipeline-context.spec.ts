/**
 * DESIGN AI v18 — Pipeline Context tests (Chapter 6.2)
 */
import assert from "node:assert/strict";
import {
  PIPELINE_CONTEXT_VERSION,
  PIPELINE_CONTEXT_GOLDEN_RULE,
  CONTEXT_LIFECYCLE,
  CONTEXT_SECTION_OWNERS,
  STANDARD_CONTEXT_SNAPSHOTS,
  PipelineContextSection,
  PipelineContextLifecycle,
  createGenerationPipelineContext,
  createContextFromOrchestrator,
  validateContextOwnership,
  applyContextPatch,
  mergeContextPatch,
  recordContextAudit,
  getContextAuditTrail,
  validateContextConsistency,
  validateContextBeforeAgentHandoff,
  canTransitionContextLifecycle,
  transitionContextLifecycle,
  createContextSnapshot,
  buildStandardContextSnapshots,
  restoreContextFromSnapshot,
  recoverContextFromLatestSnapshot,
  getAgentContextView,
  validatePipelineContext,
  assertPipelineContext,
  runPipelineContext,
  isPipelineContextFailure,
  resetPipelineContextStores,
} from "./index";

function testGoldenRule() {
  assert.ok(PIPELINE_CONTEXT_GOLDEN_RULE.includes("working memory"));
  assert.equal(PIPELINE_CONTEXT_VERSION, "6.2.0");
  console.log("✔ golden rule — unified working memory for all agents");
}

function testContextLifecycle() {
  assert.equal(CONTEXT_LIFECYCLE.length, 8);
  assert.equal(CONTEXT_LIFECYCLE[0], PipelineContextLifecycle.CREATED);
  assert.equal(CONTEXT_LIFECYCLE[7], PipelineContextLifecycle.ARCHIVED);
  assert.equal(canTransitionContextLifecycle(PipelineContextLifecycle.CREATED, PipelineContextLifecycle.ENRICHED), true);
  console.log("✔ context lifecycle — created to enriched to creative to archived");
}

function testSingleSourceOfTruth() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  assert.ok(ctx.pipelineId);
  assert.ok(ctx.knowledge.package.items.length > 0);
  assert.ok(ctx.blueprint);
  assert.equal(validateContextConsistency(ctx).valid, true);
  console.log("✔ single source of truth — one context object per generation");
}

function testContextSections() {
  assert.ok(CONTEXT_SECTION_OWNERS[PipelineContextSection.CREATIVE].includes("visual-story-director"));
  assert.ok(CONTEXT_SECTION_OWNERS[PipelineContextSection.TECHNICAL].includes("lighting-director"));
  assert.equal(Object.keys(CONTEXT_SECTION_OWNERS).length, 7);
  console.log("✔ context sections — business, knowledge, creative, technical, render, validation, learning");
}

function testImmutablePatchUpdates() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const { context, audit } = applyContextPatch(ctx, {
    agentId: "lighting-director",
    section: PipelineContextSection.TECHNICAL,
    blueprintSection: "lighting",
    changes: { lighting: { lightingStyle: "warm-soft" } },
    reason: "Kitchen marketplace warm key light",
  });
  assert.equal(context.metadata.revision, ctx.metadata.revision + 1);
  assert.ok(audit);
  assert.notEqual(context, ctx);
  console.log("✔ immutable updates — agent patch merged via orchestrator pattern");
}

function testContextOwnership() {
  const ctx = createGenerationPipelineContext();
  const violations = validateContextOwnership("visual-story-director", {
    agentId: "visual-story-director",
    section: PipelineContextSection.TECHNICAL,
    blueprintSection: "lighting",
    changes: {},
    reason: "invalid",
  });
  assert.ok(violations.some((v) => v.code === "OWNERSHIP_VIOLATION"));
  const bad = applyContextPatch(ctx, {
    agentId: "visual-story-director",
    section: PipelineContextSection.TECHNICAL,
    blueprintSection: "lighting",
    changes: { lighting: { lightingStyle: "harsh" } },
    reason: "cross-section",
  });
  assert.ok(bad.violations.length > 0);
  console.log("✔ context ownership — agents patch only owned sections");
}

function testContextConsistency() {
  const ctx = createGenerationPipelineContext();
  const report = validateContextConsistency(ctx);
  assert.equal(report.valid, true);
  const damaged = validateContextConsistency(ctx, { damagedContext: true });
  assert.equal(damaged.valid, false);
  console.log("✔ context consistency — conflicts and required data checked");
}

function testAgentHandoffValidation() {
  const ctx = createGenerationPipelineContext();
  const bad = validateContextBeforeAgentHandoff(ctx, "composition-director");
  assert.ok(bad.some((v) => v.code === "INVALID_LIFECYCLE"));
  const ready = transitionContextLifecycle(ctx, PipelineContextLifecycle.ENRICHED).context;
  const creative = transitionContextLifecycle(ready, PipelineContextLifecycle.CREATIVE_READY).context;
  assert.equal(validateContextBeforeAgentHandoff(creative, "composition-director").length, 0);
  console.log("✔ validation before handoff — damaged context blocks pipeline");
}

function testContextSnapshots() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const snapshots = buildStandardContextSnapshots(ctx);
  assert.equal(snapshots.length, STANDARD_CONTEXT_SNAPSHOTS.length);
  assert.equal(snapshots[0].label, "business_ready");
  assert.equal(snapshots[2].label, "render_ready");
  console.log("✔ context snapshots — business, creative, render ready checkpoints");
}

function testContextRecovery() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const snapshots = buildStandardContextSnapshots(ctx);
  const { context, violations } = restoreContextFromSnapshot(ctx.pipelineId, snapshots[1].id);
  assert.equal(violations.length, 0);
  assert.ok(context);
  assert.equal(context!.lifecycle, PipelineContextLifecycle.CREATIVE_READY);
  const latest = recoverContextFromLatestSnapshot(ctx.pipelineId);
  assert.ok(latest.context);
  console.log("✔ context recovery — resume from last snapshot");
}

function testContextAccess() {
  const ctx = createGenerationPipelineContext();
  const view = getAgentContextView("lighting-director", ctx);
  assert.ok(view.sections.includes(PipelineContextSection.KNOWLEDGE));
  assert.ok(view.sections.includes(PipelineContextSection.CREATIVE));
  assert.equal(view.sections.includes(PipelineContextSection.LEARNING), false);
  const memory = getAgentContextView("design-memory", ctx);
  assert.ok(memory.sections.includes(PipelineContextSection.LEARNING));
  console.log("✔ context access — agents receive only required sections");
}

function testAuditTrail() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  recordContextAudit("scene-director", ctx.pipelineId, ["scene"], "Scene environment defined", 1);
  const trail = getContextAuditTrail(ctx.pipelineId);
  assert.equal(trail.length, 1);
  assert.equal(trail[0].agentId, "scene-director");
  console.log("✔ context security — agent, fields, time, reason audited");
}

function testOrchestratorBridge() {
  const ctx = createContextFromOrchestrator();
  assert.equal(ctx.lifecycle, PipelineContextLifecycle.ENRICHED);
  assert.ok(ctx.knowledge.package.items.length > 0);
  console.log("✔ orchestrator bridge — Ch 6.1 context maps to generation context");
}

function testMergeContextPatch() {
  resetPipelineContextStores();
  const ctx = createGenerationPipelineContext();
  const merged = mergeContextPatch(ctx, {
    agentId: "scene-director",
    section: PipelineContextSection.CREATIVE,
    blueprintSection: "scene",
    changes: { scene: { sceneType: "kitchen" } },
    reason: "Kitchen lifestyle scene",
  });
  assert.ok(merged.metadata.revision > ctx.metadata.revision);
  console.log("✔ merge patch — convenience wrapper for immutable updates");
}

function testDirectMutationBlocked() {
  const report = validatePipelineContext({ directMutation: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "DIRECT_MUTATION"));
  console.log("✔ direct mutation forbidden — patches only");
}

function testValidatePipelineContext() {
  resetPipelineContextStores();
  const report = validatePipelineContext();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.singleSourceOfTruth, true);
  assert.equal(report.snapshotCapable, true);
  assert.equal(report.recoveryCapable, true);
  assertPipelineContext();
  console.log("✔ pipeline context system validation passes");
}

function testRunPipelineContext() {
  resetPipelineContextStores();
  const report = runPipelineContext();
  assert.equal(report.valid, true);
  assert.equal(report.scalable, true);
  console.log("✔ runPipelineContext entry point works");
}

function testFailureCodes() {
  assert.equal(isPipelineContextFailure("OWNERSHIP_VIOLATION"), true);
  assert.equal(isPipelineContextFailure("UNKNOWN"), false);
  console.log("✔ pipeline context failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testContextLifecycle();
  testSingleSourceOfTruth();
  testContextSections();
  testImmutablePatchUpdates();
  testContextOwnership();
  testContextConsistency();
  testAgentHandoffValidation();
  testContextSnapshots();
  testContextRecovery();
  testContextAccess();
  testAuditTrail();
  testOrchestratorBridge();
  testMergeContextPatch();
  testDirectMutationBlocked();
  testValidatePipelineContext();
  testRunPipelineContext();
  testFailureCodes();
  console.log("\npipeline-context.spec.ts — all passed");
}

run();

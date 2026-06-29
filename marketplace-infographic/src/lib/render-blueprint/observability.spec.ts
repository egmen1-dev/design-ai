/**
 * DESIGN AI v18 — Observability & Diagnostics tests (Chapter 3.15)
 */

import assert from "node:assert/strict";
import {
  ObservabilityEngine,
  attachObservabilityToEventBus,
  createDiagnosticContext,
  maskSecrets,
  sanitizeDiagnosticData,
  EventBus,
  DesignEventType,
  BlueprintLifecycle,
  hashAgentInput,
  extractRenderIntent,
  createEmptyRenderBlueprint,
  ObservabilityError,
} from "./index";

function testDiagnosticContext() {
  const ctx = createDiagnosticContext({
    pipelineId: "pipe-1",
    sessionId: "sess-1",
    blueprintRevision: 5,
    currentStage: BlueprintLifecycle.STORY_DEFINED,
  });
  assert.equal(ctx.pipelineId, "pipe-1");
  assert.equal(ctx.blueprintRevision, 5);
  console.log("✔ diagnostic context carries pipelineId, revision, stage, sessionId");
}

function testDecisionTrace() {
  const engine = new ObservabilityEngine({ mode: "debug", pipelineId: "p1" });
  engine.bindContext({ blueprintRevision: 1, currentStage: BlueprintLifecycle.SCENE_DEFINED });
  engine.recordDecision({
    agentId: "scene-director",
    inputHash: "in",
    outputHash: "out",
    confidence: 85,
    reason: "Kitchen environment matches product category",
  });
  const report = engine.buildExplainabilityReport();
  assert.equal(report.decisions.length, 1);
  assert.equal(report.decisions[0].agentId, "scene-director");
  assert.ok(report.decisions[0].context.pipelineId);
  console.log("✔ decision trace is mandatory and includes context");
}

function testMutationTrace() {
  const engine = new ObservabilityEngine({ mode: "debug" });
  engine.recordMutation({
    section: "lighting",
    producer: "lighting-director",
    oldRevision: 2,
    newRevision: 3,
    reason: "Softer key light for marketplace",
  });
  const report = engine.buildExplainabilityReport();
  assert.equal(report.mutations[0].section, "lighting");
  assert.equal(report.mutations[0].newRevision, 3);
  console.log("✔ mutation trace records section, producer, revisions, reason");
}

function testValidationTrace() {
  const engine = new ObservabilityEngine({ mode: "debug" });
  engine.recordValidation({
    ruleId: "VAL_004",
    passed: false,
    severity: "error",
    message: "Camera missing",
    fix: "Run camera-director",
  });
  const report = engine.buildExplainabilityReport();
  assert.equal(report.validations[0].ruleId, "VAL_004");
  console.log("✔ validation trace stores rule, result, severity, message");
}

function testRenderDiagnosticsDebugMode() {
  const engine = new ObservabilityEngine({ mode: "debug" });
  engine.recordRender({
    provider: "flux",
    model: "flux-pro",
    adapterVersion: "3.11.0",
    promptLength: 120,
    negativePromptLength: 40,
    seed: 42,
    generationTimeMs: 3200,
    prompt: "studio product photo",
    negativePrompt: "text, logo",
  });
  const exported = engine.exportForStorage();
  assert.ok(exported.debugArtifacts?.renders[0].prompt);
  console.log("✔ render diagnostics store full prompt only in debug mode");
}

function testRenderDiagnosticsProductionMode() {
  const engine = new ObservabilityEngine({ mode: "production" });
  engine.recordRender({
    provider: "flux",
    model: "flux-pro",
    adapterVersion: "3.11.0",
    promptLength: 120,
    negativePromptLength: 40,
    seed: 42,
    generationTimeMs: 3200,
    prompt: "secret prompt",
    negativePrompt: "text",
  });
  const exported = engine.exportForStorage();
  assert.equal(exported.debugArtifacts, undefined);
  console.log("✔ production mode strips verbose render prompts");
}

function testPrivacyMasking() {
  const masked = maskSecrets("api_key=sk-live-abcdef1234567890 token=abc");
  assert.ok(!masked.includes("sk-live"));
  assert.ok(masked.includes("[REDACTED]"));
  const data = sanitizeDiagnosticData({ apiKey: "secret", count: 3 });
  assert.equal(data.apiKey, "[REDACTED]");
  assert.equal(data.count, 3);
  console.log("✔ privacy rules mask secrets and credentials");
}

function testExplainabilityReport() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "electronics" });
  const intent = extractRenderIntent(bp);
  const engine = new ObservabilityEngine({ mode: "debug", pipelineId: "explain-1" });
  engine.pipelineStart();
  engine.recordDecision({
    agentId: "composition-director",
    inputHash: hashAgentInput(intent.composition),
    outputHash: "out",
    confidence: 90,
    reason: "Hero left template for headline space",
  });
  engine.recordConstraint("mustLeaveHeadlineSpace");
  engine.pipelineComplete();
  const report = engine.buildExplainabilityReport(intent, { cacheHitRate: 0.5, memoryPeakMB: 64 });
  assert.ok(report.renderIntentSummary.includes("scene="));
  assert.ok(report.constraints.includes("mustLeaveHeadlineSpace"));
  assert.equal(report.metrics.cacheHitRate, 0.5);
  assert.ok(report.timeline.length >= 2);
  console.log("✔ explainability report aggregates decisions, constraints, timeline, metrics");
}

function testFailureReport() {
  const engine = new ObservabilityEngine({ mode: "debug" });
  engine.setLastSnapshot("snap-123");
  engine.bindContext({ currentStage: BlueprintLifecycle.RENDERING });
  engine.recordFailure({
    layer: "render",
    category: "provider",
    message: "Provider timeout",
    stackTrace: "Error: timeout\n  at render",
  });
  const failure = engine.buildFailureReport();
  assert.equal(failure.lastSnapshotId, "snap-123");
  assert.equal(failure.errorCategory, "provider");
  assert.ok(failure.stackTrace);
  console.log("✔ failure report includes snapshot, stage, timeline, stack in debug");
}

function testFailureReportRequiresFailure() {
  const engine = new ObservabilityEngine();
  assert.throws(() => engine.buildFailureReport(), ObservabilityError);
  console.log("✔ failure report requires recorded failure");
}

function testEventBusIntegration() {
  const bus = new EventBus({ pipelineId: "obs-pipe" });
  const engine = new ObservabilityEngine({ pipelineId: "obs-pipe" });
  const detach = attachObservabilityToEventBus(engine, bus);
  bus.publish({
    type: DesignEventType.PipelineStarted,
    revision: 0,
    metadata: { blueprintId: "bp-1", stage: BlueprintLifecycle.NEW },
  });
  bus.publish({
    type: DesignEventType.StageStarted,
    revision: 1,
    metadata: { blueprintId: "bp-1", stage: BlueprintLifecycle.STORY_DEFINED, producer: "story-director" },
  });
  const report = engine.buildExplainabilityReport();
  assert.ok(report.timeline.some((t) => t.stage === "Pipeline Started"));
  detach();
  console.log("✔ observability attaches to EventBus for timeline and traces");
}

function testVisionDiagnostics() {
  const engine = new ObservabilityEngine({ mode: "debug" });
  engine.recordVision({
    realismScore: 0.88,
    compositionScore: 0.92,
    whitespaceScore: 0.75,
    overlayScore: 0.8,
    issues: [{ code: "HALO", message: "Edge halo detected", explanation: "Composite mask too hard" }],
  });
  const report = engine.buildExplainabilityReport();
  assert.equal(report.decisions.length, 0);
  const exported = engine.exportForStorage();
  assert.ok(exported.logs.some((l) => l.layer === "vision"));
  console.log("✔ vision diagnostics publish scores and explained issues");
}

function main() {
  testDiagnosticContext();
  testDecisionTrace();
  testMutationTrace();
  testValidationTrace();
  testRenderDiagnosticsDebugMode();
  testRenderDiagnosticsProductionMode();
  testPrivacyMasking();
  testExplainabilityReport();
  testFailureReport();
  testFailureReportRequiresFailure();
  testEventBusIntegration();
  testVisionDiagnostics();
  console.log("\nobservability.spec.ts — all passed");
}

main();

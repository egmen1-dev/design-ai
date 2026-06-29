/**
 * DESIGN AI v18 — Agent Context tests (Chapter 4.6)
 */
import assert from "node:assert/strict";
import {
  AGENT_CONTEXT_GOLDEN_RULE,
  buildAgentContextPackage,
  createAgentContext,
  createEmptyRenderBlueprint,
  defaultPipelineConfiguration,
  deserializeAgentContext,
  detectContextMutation,
  explainContextUsage,
  PipelineMode,
  projectAgentContext,
  scanContextSecurity,
  serializeAgentContext,
  validateAgentContextPackage,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function testGoldenRule() {
  assert.ok(AGENT_CONTEXT_GOLDEN_RULE.includes("only input source"));
  console.log("✔ golden rule — context is sole input source");
}

function testBuildIsolatedReadOnlyContext() {
  const bp = createEmptyRenderBlueprint({ category: "electronics", seed: 7 });
  const pkg = buildAgentContextPackage({ blueprint: bp });
  assert.equal(Object.isFrozen(pkg), true);
  assert.equal(Object.isFrozen(pkg.blueprint), true);
  assert.equal(pkg.configuration.mode, "standard");
  assert.ok(pkg.diagnostics.pipelineId);
  assert.ok(pkg.runtime.executionLimitMs);
  console.log("✔ lifecycle builds isolated frozen context per agent");
}

function testCreateAgentContextBridge() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const ctx = createAgentContext({
    blueprint: bp,
    pipelineId: "pipe-1",
    configuration: defaultPipelineConfiguration({ mode: PipelineMode.HIGH_QUALITY }),
  });
  assert.equal(ctx.config.pipelineId, "pipe-1");
  assert.equal(ctx.configuration.mode, PipelineMode.HIGH_QUALITY);
  assert.ok(ctx.runtime);
  assert.ok(ctx.diagnostics.buildVersion);
  console.log("✔ Ch 4.1 createAgentContext bridges to Ch 4.6 package");
}

function testValidateContextBeforeRun() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const pkg = buildAgentContextPackage({ blueprint: bp });
  const report = validateAgentContextPackage(pkg);
  assert.equal(report.valid, true);
  assert.equal(report.violations.length, 0);
  console.log("✔ context validation passes for complete package");
}

function testRejectSecretsInContext() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const pkg = buildAgentContextPackage({
    blueprint: bp,
    runtime: { apiKey: "sk-secret" } as never,
  });
  const violations = scanContextSecurity(pkg);
  assert.ok(violations.some((v) => v.code === "SECRET_DETECTED"));
  console.log("✔ context security rejects secret fields");
}

function testContextProjectionReducesPayload() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const pkg = buildAgentContextPackage({ blueprint: bp });
  const projection = projectAgentContext(pkg, "lighting-director");
  assert.ok(projection.sections.includes("scene"));
  assert.ok(projection.sections.includes("photography"));
  assert.ok(projection.projectedBlueprintBytes <= projection.fullBlueprintBytes);
  assert.equal(Object.isFrozen(projection.blueprint), true);
  console.log("✔ context projection includes only required sections");
}

function testExplainabilityReport() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.sections.scene = SectionState.READY;
  bp.lifecycle.sections.product = SectionState.READY;
  const pkg = buildAgentContextPackage({ blueprint: bp, agentId: "composition-director" });
  const report = explainContextUsage("composition-director", pkg);
  assert.equal(report.agentId, "composition-director");
  const story = report.entries.find((e) => e.section === "story");
  assert.ok(story?.used);
  assert.ok(story?.available);
  console.log("✔ explainability lists used and available context sections");
}

function testSerializationRoundTrip() {
  const bp = createEmptyRenderBlueprint({ category: "electronics", seed: 3 });
  const pkg = buildAgentContextPackage({
    blueprint: bp,
    configuration: defaultPipelineConfiguration({ mode: PipelineMode.FAST_GENERATION }),
  });
  const json = serializeAgentContext(pkg);
  const restored = deserializeAgentContext(json);
  assert.equal(restored.configuration.mode, PipelineMode.FAST_GENERATION);
  assert.equal(restored.blueprint.meta.seed, 3);
  assert.equal(restored.diagnostics.pipelineId, pkg.diagnostics.pipelineId);
  console.log("✔ context serializes and deserializes without mutation");
}

function testReadOnlyMutationDetection() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const before = buildAgentContextPackage({ blueprint: bp });
  const after = buildAgentContextPackage({
    blueprint: { ...bp, meta: { ...bp.meta, revision: bp.meta.revision + 1 } },
  });
  const violations = detectContextMutation(before, after);
  assert.ok(violations.some((v) => v.code === "CONTEXT_MUTATED"));
  console.log("✔ read-only policy detects blueprint mutation inside context");
}

function testDiagnosticsCarryExecutionMetadata() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.meta.retry = 2;
  const pkg = buildAgentContextPackage({
    blueprint: bp,
    agentId: "scene-director",
    agentVersion: "2.1.0",
    diagnostics: { executionNumber: 4 },
  });
  assert.equal(pkg.diagnostics.retryCount, 2);
  assert.equal(pkg.diagnostics.executionNumber, 4);
  assert.equal(pkg.diagnostics.agentVersion, "2.1.0");
  assert.equal(pkg.diagnostics.stageId, bp.lifecycle.stage);
  console.log("✔ diagnostics carry execution metadata without design decisions");
}

function testBlueprintImmutableDuringStage() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.lifecycle.stage = BlueprintLifecycle.SCENE_DEFINED;
  const pkg = buildAgentContextPackage({ blueprint: bp });
  const revision = pkg.blueprint.meta.revision;
  assert.throws(() => {
    (pkg.blueprint.meta as { revision: number }).revision = revision + 1;
  });
  console.log("✔ blueprint in context is immutable during agent execution");
}

function run() {
  testGoldenRule();
  testBuildIsolatedReadOnlyContext();
  testCreateAgentContextBridge();
  testValidateContextBeforeRun();
  testRejectSecretsInContext();
  testContextProjectionReducesPayload();
  testExplainabilityReport();
  testSerializationRoundTrip();
  testReadOnlyMutationDetection();
  testDiagnosticsCarryExecutionMetadata();
  testBlueprintImmutableDuringStage();
  console.log("\nagent-context.spec.ts — all passed");
}

run();

/**
 * DESIGN AI v18 — Pipeline Orchestrator tests (Chapter 6.1)
 */
import assert from "node:assert/strict";
import {
  PIPELINE_ORCHESTRATOR_VERSION,
  PIPELINE_ORCHESTRATOR_GOLDEN_RULE,
  ORCHESTRATOR_STATE_MACHINE,
  AGENT_DEPENDENCY_GRAPH,
  PARALLEL_AGENT_PAIRS,
  OrchestratorPipelineState,
  OrchestratorPipelineEvent,
  createOrchestratorPipelineContext,
  getAgentDependencyNode,
  canTransitionOrchestratorState,
  transitionOrchestratorState,
  getReadyAgents,
  validateOrchestratorAgentDependencies,
  canExecuteAgentsInParallel,
  groupParallelReadyAgents,
  validateBlueprintOwnership,
  publishOrchestratorEvent,
  planLocalizedRetry,
  collectOrchestratorTelemetry,
  recoverOrchestratorPipeline,
  runPipelineOrchestrator,
  validatePipelineOrchestrator,
  assertPipelineOrchestrator,
  runPipelineOrchestratorValidation,
  isPipelineOrchestratorFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(PIPELINE_ORCHESTRATOR_GOLDEN_RULE.includes("dispatcher"));
  assert.equal(PIPELINE_ORCHESTRATOR_VERSION, "6.1.0");
  console.log("✔ golden rule — orchestrator is dispatcher not designer");
}

function testStateMachine() {
  assert.ok(ORCHESTRATOR_STATE_MACHINE.includes(OrchestratorPipelineState.KNOWLEDGE_LOADING));
  assert.ok(ORCHESTRATOR_STATE_MACHINE.includes(OrchestratorPipelineState.LEARNING));
  assert.equal(canTransitionOrchestratorState(OrchestratorPipelineState.CREATED, OrchestratorPipelineState.KNOWLEDGE_LOADING), true);
  assert.equal(canTransitionOrchestratorState(OrchestratorPipelineState.CREATED, OrchestratorPipelineState.COMPLETED), false);
  console.log("✔ state machine — created to knowledge to creative to completed");
}

function testPipelineContext() {
  const ctx = createOrchestratorPipelineContext();
  assert.ok(ctx.pipelineId);
  assert.ok(ctx.blueprint);
  assert.ok(ctx.knowledge.items.length > 0);
  assert.equal(ctx.state, OrchestratorPipelineState.CREATED);
  console.log("✔ pipeline context — blueprint and knowledge accompany generation");
}

function testDependencyGraph() {
  const composition = getAgentDependencyNode("composition-director")!;
  assert.ok(composition.dependsOn.includes("visual-story-director"));
  assert.ok(composition.dependsOn.includes("scene-director"));
  assert.ok(AGENT_DEPENDENCY_GRAPH.length >= 10);
  console.log("✔ dependency graph — composition requires story and scene directors");
}

function testReadyAgents() {
  const ctx = createOrchestratorPipelineContext();
  const ready = getReadyAgents(ctx);
  assert.deepEqual(ready, ["product-analyzer"]);
  const afterProduct = { ...ctx, completedAgents: ["product-analyzer"] as typeof ctx.completedAgents };
  assert.ok(getReadyAgents(afterProduct).includes("visual-story-director"));
  console.log("✔ dependency control — agents run only when dependencies met");
}

function testParallelExecution() {
  assert.equal(canExecuteAgentsInParallel("lighting-director", "material-director"), true);
  const groups = groupParallelReadyAgents([
    "camera-director",
    "lighting-director",
    "material-director",
  ]);
  assert.ok(groups.some((g) => g.length >= 2));
  assert.ok(PARALLEL_AGENT_PAIRS.some(([a, b]) => a === "lighting-director" && b === "material-director"));
  console.log("✔ parallel execution — lighting and material can run concurrently");
}

function testBlueprintOwnership() {
  assert.equal(validateBlueprintOwnership("visual-story-director", "story").length, 0);
  const bad = validateBlueprintOwnership("visual-story-director", "lighting");
  assert.ok(bad.some((v) => v.code === "CROSS_SECTION_WRITE"));
  console.log("✔ blueprint ownership — agents write only owned sections");
}

function testEventDrivenPipeline() {
  const event = publishOrchestratorEvent(
    OrchestratorPipelineEvent.STORY_COMPLETED,
    "pipe-1",
    "visual-story-director",
  );
  assert.equal(event.type, OrchestratorPipelineEvent.STORY_COMPLETED);
  const run = runPipelineOrchestrator();
  assert.ok(run.events.some((e) => e.type === OrchestratorPipelineEvent.PIPELINE_STARTED));
  assert.ok(run.events.some((e) => e.type === OrchestratorPipelineEvent.STORY_COMPLETED));
  assert.ok(run.events.some((e) => e.type === OrchestratorPipelineEvent.RENDER_FINISHED));
  console.log("✔ event driven — story, scene, blueprint, render, validation events");
}

function testLocalizedRetry() {
  const plan = planLocalizedRetry("lighting-director", "Vision score low on lighting");
  assert.ok(plan.agentsToRetry.includes("lighting-director"));
  assert.ok(plan.agentsToRetry.includes("vision-quality-director"));
  assert.ok(plan.agentsPreserved.includes("visual-story-director"));
  assert.equal(plan.fullRestartRequired, false);
  console.log("✔ retry coordination — lighting retry preserves story and composition");
}

function testFailureManagement() {
  const ctx = createOrchestratorPipelineContext();
  const violations = validateOrchestratorAgentDependencies(ctx, "composition-director");
  assert.ok(violations.some((v) => v.code === "MISSING_DEPENDENCY_CONTROL"));
  console.log("✔ failure management — dependency violations detected before run");
}

function testRecovery() {
  const ctx = createOrchestratorPipelineContext({
    completedAgents: ["product-analyzer", "visual-story-director", "scene-director"],
  });
  const { context, recovered } = recoverOrchestratorPipeline(ctx, "scene-director");
  assert.equal(recovered, true);
  assert.equal(context.state, OrchestratorPipelineState.RETRY);
  assert.ok(context.completedAgents.includes("scene-director"));
  console.log("✔ recovery — resume from last successful snapshot");
}

function testTelemetry() {
  const run = runPipelineOrchestrator();
  assert.ok(run.telemetry.agentDurationsMs["product-analyzer"] > 0);
  assert.ok(run.telemetry.knowledgePackageSize > 0);
  console.log("✔ monitoring — agent durations and knowledge usage tracked");
}

function testRunPipelineOrchestrator() {
  const run = runPipelineOrchestrator();
  assert.equal(run.completed, true);
  assert.equal(run.state, OrchestratorPipelineState.COMPLETED);
  assert.equal(run.agentRuns.length, AGENT_DEPENDENCY_GRAPH.length);
  assert.ok(run.recoveredFromSnapshot);
  console.log("✔ run pipeline orchestrator — full agent ecosystem execution");
}

function testOrchestrationOnly() {
  const bad = runPipelineOrchestrator(undefined, { orchestratorMutatesBlueprint: true });
  assert.ok(bad.violations.some((v) => v.code === "ORCHESTRATOR_MUTATES_BLUEPRINT"));
  console.log("✔ orchestrator never mutates blueprint or makes design decisions");
}

function testValidatePipelineOrchestrator() {
  const report = validatePipelineOrchestrator();
  assert.equal(report.valid, true);
  assert.equal(report.dependencyGraphReady, true);
  assert.equal(report.parallelExecutionReady, true);
  assert.equal(report.recoveryReady, true);
  assertPipelineOrchestrator();
  console.log("✔ pipeline orchestrator system validation passes");
}

function testRunPipelineOrchestratorValidation() {
  const report = runPipelineOrchestratorValidation();
  assert.equal(report.valid, true);
  assert.equal(report.eventDrivenReady, true);
  console.log("✔ runPipelineOrchestratorValidation entry point works");
}

function testFailureCodes() {
  assert.equal(isPipelineOrchestratorFailure("DIRECT_AGENT_CALL"), true);
  assert.equal(isPipelineOrchestratorFailure("UNKNOWN"), false);
  console.log("✔ pipeline orchestrator failure codes are catalogued");
}

function testStateTransition() {
  const ctx = createOrchestratorPipelineContext();
  const result = transitionOrchestratorState(ctx, OrchestratorPipelineState.KNOWLEDGE_LOADING);
  assert.equal(result.violations.length, 0);
  assert.equal(result.context.state, OrchestratorPipelineState.KNOWLEDGE_LOADING);
  console.log("✔ state transitions — controlled lifecycle progression");
}

function run() {
  testGoldenRule();
  testStateMachine();
  testPipelineContext();
  testDependencyGraph();
  testReadyAgents();
  testParallelExecution();
  testBlueprintOwnership();
  testEventDrivenPipeline();
  testLocalizedRetry();
  testFailureManagement();
  testRecovery();
  testTelemetry();
  testRunPipelineOrchestrator();
  testOrchestrationOnly();
  testValidatePipelineOrchestrator();
  testRunPipelineOrchestratorValidation();
  testFailureCodes();
  testStateTransition();
  console.log("\npipeline-orchestrator.spec.ts — all passed");
}

run();

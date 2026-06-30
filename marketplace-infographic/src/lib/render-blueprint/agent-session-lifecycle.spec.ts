/**
 * DESIGN AI v18 — Agent Session Lifecycle tests (Chapter 7.3)
 */
import assert from "node:assert/strict";
import {
  AGENT_SESSION_LIFECYCLE_VERSION,
  AGENT_SESSION_LIFECYCLE_GOLDEN_RULE,
  AGENT_SESSION_LIFECYCLE_STAGES,
  AGENT_SESSION_RETRY_BRANCH,
  AgentSessionLifecycleStage,
  AgentSessionState,
  AgentSessionTerminalOutcome,
  AgentSessionLifecycleEvent,
  createAgentSessionIdentity,
  getAgentSessionRuntimeState,
  validateAgentSessionLifecycleStructure,
  buildAgentSessionArchive,
  executeAgentSessionLifecycle,
  validateAgentSessionLifecycle,
  validateAgentSessionLifecycleWithExecution,
  assertAgentSessionLifecycle,
  runAgentSessionLifecycle,
  isAgentSessionLifecycleFailure,
  getAgentSessionLifecycleStage,
  mapSessionStageToBaseArchitecture,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
  EventBus,
} from "./index";

function testLifecycleCatalog() {
  assert.equal(AGENT_SESSION_LIFECYCLE_STAGES.length, 9);
  assert.equal(AGENT_SESSION_LIFECYCLE_VERSION, "7.3.0");
  assert.equal(validateAgentSessionLifecycleStructure().length, 0);
  console.log("✔ lifecycle catalog — 9 mandatory ephemeral stages");
}

function testGoldenRule() {
  assert.ok(AGENT_SESSION_LIFECYCLE_GOLDEN_RULE.includes("born to solve one professional task"));
  console.log("✔ golden rule — ephemeral agent born for one task");
}

function testRuntimeStates() {
  assert.equal(getAgentSessionRuntimeState(AgentSessionLifecycleStage.REASONING), AgentSessionState.REASONING);
  assert.equal(getAgentSessionRuntimeState(AgentSessionLifecycleStage.SELF_VALIDATION), AgentSessionState.VALIDATING);
  assert.equal(getAgentSessionRuntimeState(AgentSessionLifecycleStage.ARCHIVED), AgentSessionState.ARCHIVED);
  console.log("✔ runtime states — single active state per agent");
}

function testLifecycleEvents() {
  assert.equal(AgentSessionLifecycleEvent.AGENT_CREATED, "AgentCreated");
  assert.equal(AgentSessionLifecycleEvent.KNOWLEDGE_LOADED, "KnowledgeLoaded");
  assert.equal(AgentSessionLifecycleEvent.DECISION_COMPLETED, "DecisionCompleted");
  assert.equal(AgentSessionLifecycleEvent.VALIDATION_PASSED, "ValidationPassed");
  assert.equal(AgentSessionLifecycleEvent.RETRY_STARTED, "RetryStarted");
  assert.equal(AgentSessionLifecycleEvent.AGENT_COMPLETED, "AgentCompleted");
  console.log("✔ lifecycle events — observability event catalog");
}

function testSessionIdentity() {
  const id = createAgentSessionIdentity("visual-story-director");
  assert.equal(id.agentId, "visual-story-director");
  assert.ok(id.agentInstanceId.length > 0);
  assert.ok(id.executionId.length > 0);
  assert.ok(id.traceId.length > 0);
  assert.ok(id.workspaceId.startsWith("ws-"));
  console.log("✔ created stage — agent, execution, trace IDs and workspace");
}

function testRetryBranch() {
  assert.ok(AGENT_SESSION_RETRY_BRANCH.includes(AgentSessionLifecycleStage.SELF_VALIDATION));
  assert.ok(AGENT_SESSION_RETRY_BRANCH.includes(AgentSessionLifecycleStage.REASONING));
  console.log("✔ retry lifecycle — validation failed → reinitialized → reasoning");
}

function testBaseArchitectureMapping() {
  assert.equal(mapSessionStageToBaseArchitecture(AgentSessionLifecycleStage.KNOWLEDGE_LOADED), "knowledge_retrieval");
  assert.equal(mapSessionStageToBaseArchitecture(AgentSessionLifecycleStage.ARCHIVED), "telemetry");
  const stage = getAgentSessionLifecycleStage(AgentSessionLifecycleStage.BLUEPRINT_GENERATED)!;
  assert.equal(stage.runtimeState, AgentSessionState.GENERATING_BLUEPRINT);
  console.log("✔ session stages map to Ch 7.2 base architecture modules");
}

async function testKitchenExecution() {
  let bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 42 });
  bp = { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } };
  const bus = new EventBus({ pipelineId: "ch73-kitchen" });
  const report = await executeAgentSessionLifecycle({
    agentId: "visual-story-director",
    blueprint: bp,
    eventBus: bus,
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.stagesCompleted.length, 9);
  assert.equal(report.currentState, AgentSessionState.ARCHIVED);
  assert.equal(report.outcome, AgentSessionTerminalOutcome.COMPLETED);
  assert.ok(report.archive?.telemetry);
  assert.ok(report.result?.mutations.length);
  assert.ok(report.stageTimings.length >= 9);
  console.log("✔ kitchen execution — story director completes full session lifecycle");
}

async function testRetryOnValidationFailure() {
  const report = await executeAgentSessionLifecycle({
    agentId: "visual-story-director",
    context: { forceValidationFailure: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.eventsPublished.includes(AgentSessionLifecycleEvent.RETRY_STARTED));
  assert.equal(report.outcome, AgentSessionTerminalOutcome.COMPLETED);
  console.log("✔ retry lifecycle — recovers after first validation failure");
}

async function testRetryExhausted() {
  const report = await executeAgentSessionLifecycle({
    agentId: "visual-story-director",
    context: { skipSelfValidation: true, maxRetries: 0 },
  });
  assert.equal(report.valid, false);
  assert.equal(report.outcome, AgentSessionTerminalOutcome.FAILED);
  assert.ok(report.violations.some((v) => v.code === "RETRY_EXHAUSTED" || v.code === "MISSING_SELF_VALIDATION"));
  console.log("✔ retry exhausted — fails when validation cannot recover");
}

async function testCancelled() {
  const report = await executeAgentSessionLifecycle({
    agentId: "visual-story-director",
    context: { cancelled: true },
  });
  assert.equal(report.valid, false);
  assert.equal(report.currentState, AgentSessionState.CANCELLED);
  assert.equal(report.outcome, AgentSessionTerminalOutcome.CANCELLED);
  console.log("✔ cancelled — pipeline stop terminates lifecycle");
}

async function testMissingContext() {
  const report = await executeAgentSessionLifecycle({
    agentId: "visual-story-director",
    context: { missingContext: true },
  });
  assert.equal(report.valid, false);
  assert.equal(report.outcome, AgentSessionTerminalOutcome.FAILED);
  assert.ok(report.violations.some((v) => v.code === "MISSING_CONTEXT"));
  console.log("✔ context loaded — mandatory context gate stops execution");
}

function testArchiveRecord() {
  const identity = createAgentSessionIdentity("lighting-director");
  const archive = buildAgentSessionArchive({
    identity,
    telemetry: {
      durationMs: 50,
      knowledgeItemsUsed: 3,
      rulesEvaluated: 5,
      decisionScore: 0.9,
      validationScore: 1,
      retryCount: 0,
      stagesCompleted: [],
    },
    totalDurationMs: 50,
    outcome: AgentSessionTerminalOutcome.COMPLETED,
    eventsPublished: [AgentSessionLifecycleEvent.AGENT_COMPLETED],
  });
  assert.equal(archive.traceId, identity.traceId);
  assert.equal(archive.telemetry.durationMs, 50);
  console.log("✔ archived — telemetry and trace survive instance destruction");
}

function testStatelessDesign() {
  const report = validateAgentSessionLifecycle({ hiddenState: true });
  assert.equal(report.statelessDesign, false);
  assert.ok(report.violations.some((v) => v.code === "HIDDEN_STATE"));
  console.log("✔ stateless execution — hidden state is a failure condition");
}

async function testValidateWithExecution() {
  const report = await validateAgentSessionLifecycleWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.stagesComplete, true);
  assert.equal(report.kitchenExecutionValid, true);
  assert.equal(report.retrySupported, true);
  assertAgentSessionLifecycle();
  console.log("✔ full session lifecycle validation passes");
}

async function testRunEntryPoint() {
  const report = await runAgentSessionLifecycle();
  assert.equal(report.valid, true);
  console.log("✔ runAgentSessionLifecycle entry point works");
}

function testFailureCodes() {
  assert.equal(isAgentSessionLifecycleFailure("RETRY_EXHAUSTED"), true);
  assert.equal(isAgentSessionLifecycleFailure("UNKNOWN"), false);
  console.log("✔ session lifecycle failure codes are catalogued");
}

async function run() {
  testLifecycleCatalog();
  testGoldenRule();
  testRuntimeStates();
  testLifecycleEvents();
  testSessionIdentity();
  testRetryBranch();
  testBaseArchitectureMapping();
  await testKitchenExecution();
  await testRetryOnValidationFailure();
  await testRetryExhausted();
  await testCancelled();
  await testMissingContext();
  testArchiveRecord();
  testStatelessDesign();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nagent-session-lifecycle.spec.ts — all passed");
}

run();

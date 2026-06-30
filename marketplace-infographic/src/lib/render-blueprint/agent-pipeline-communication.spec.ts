/**
 * DESIGN AI v18 — Agent Pipeline Communication tests (Chapter 7.4)
 */
import assert from "node:assert/strict";
import {
  AGENT_PIPELINE_COMMUNICATION_VERSION,
  AGENT_PIPELINE_COMMUNICATION_GOLDEN_RULE,
  AGENT_PIPELINE_COMMUNICATION_MODEL,
  AGENT_PIPELINE_COMMUNICATION_SEQUENCE,
  AGENT_PIPELINE_MESSAGE_TYPES,
  AgentPipelineMessageType,
  AgentPipelineCommunicationPrinciple,
  AgentPipelineCommunicationStage,
  AgentPipelineCommunicationEvent,
  AgentPipelineResponseStatus,
  AgentPipelineErrorSeverity,
  buildAgentPipelineRequest,
  buildAgentPipelineResponse,
  buildAgentPipelineError,
  buildPipelineMetadata,
  validateAgentPipelineRequest,
  validateAgentPipelineResponse,
  validatePipelineMediatedCommunication,
  validateRetryCommunication,
  validateConsensusCommunication,
  validateNextAgentReadsContextOnly,
  validateAgentPipelineCommunicationStructure,
  executeAgentPipelineCommunication,
  validateAgentPipelineCommunication,
  validateAgentPipelineCommunicationWithExecution,
  assertAgentPipelineCommunication,
  runAgentPipelineCommunication,
  isAgentPipelineCommunicationFailure,
  getAgentPipelineCommunicationStage,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
  StoryType,
  frozenTestBlueprint,
  EventBus,
} from "./index";

function commBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  return bp;
}

function testCatalog() {
  assert.equal(AGENT_PIPELINE_COMMUNICATION_SEQUENCE.length, 8);
  assert.equal(AGENT_PIPELINE_MESSAGE_TYPES.length, 6);
  assert.equal(AGENT_PIPELINE_COMMUNICATION_VERSION, "7.4.0");
  assert.equal(validateAgentPipelineCommunicationStructure().length, 0);
  console.log("✔ communication catalog — 8-stage sequence and 6 message types");
}

function testGoldenRule() {
  assert.ok(AGENT_PIPELINE_COMMUNICATION_GOLDEN_RULE.includes("Never Agent → Agent"));
  assert.equal(AGENT_PIPELINE_COMMUNICATION_MODEL, "agent-blueprint-pipeline-context-next-agent");
  console.log("✔ golden rule — never agent to agent, always through pipeline");
}

function testMessageTypes() {
  assert.equal(AgentPipelineMessageType.REQUEST, "request");
  assert.equal(AgentPipelineMessageType.RESPONSE, "response");
  assert.equal(AgentPipelineMessageType.RETRY_REQUEST, "retry_request");
  assert.equal(AgentPipelineMessageType.CONSENSUS_REPORT, "consensus_report");
  console.log("✔ message types — request, response, event, retry, validation, consensus");
}

function testRequestContract() {
  const request = buildAgentPipelineRequest({ agentId: "visual-story-director" });
  assert.equal(request.agentId, "visual-story-director");
  assert.ok(request.executionId);
  assert.ok(request.pipelineContext.blueprint);
  assert.ok(request.knowledge.items.length > 0);
  assert.ok(request.metadata.revision >= 0);
  assert.equal(validateAgentPipelineRequest(request).length, 0);
  console.log("✔ request contract — data only, no logic");
}

function testResponseContract() {
  const request = buildAgentPipelineRequest({ agentId: "visual-story-director" });
  const response = buildAgentPipelineResponse({
    request,
    sessionReport: {
      valid: true,
      outcome: "completed",
      telemetry: {
        durationMs: 10,
        knowledgeItemsUsed: 2,
        rulesEvaluated: 3,
        decisionScore: 0.9,
        validationScore: 1,
        retryCount: 0,
        stagesCompleted: [],
      },
      violations: [],
    } as never,
  });
  assert.equal(response.status, AgentPipelineResponseStatus.COMPLETED);
  assert.equal(response.validationPassed, true);
  assert.equal(validateAgentPipelineResponse(response).length, 0);
  console.log("✔ response contract — status, blueprint, telemetry");
}

function testDirectCommunicationForbidden() {
  const violations = validatePipelineMediatedCommunication([
    { from: "scene-director", to: "lighting-director", method: "getLightingPlan" },
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "DIRECT_AGENT_COMMUNICATION");
  assert.equal(violations[0].principle, AgentPipelineCommunicationPrinciple.NO_DIRECT_CALLS);
  console.log("✔ direct agent-to-agent communication is forbidden");
}

function testRetryThroughPipeline() {
  const approved = validateRetryCommunication(
    {
      fromAgentId: "vision-quality-director",
      targetAgentId: "composition-director",
      executionId: "exec-1",
      reason: "composition conflict",
      blueprintRevision: 2,
    },
    true,
  );
  assert.equal(approved.length, 0);

  const bypass = validateRetryCommunication(
    {
      fromAgentId: "vision-quality-director",
      targetAgentId: "composition-director",
      executionId: "exec-1",
      reason: "composition conflict",
      blueprintRevision: 2,
    },
    false,
  );
  assert.equal(bypass.length, 1);
  assert.equal(bypass[0].code, "RETRY_BYPASS_PIPELINE");
  console.log("✔ retry communication — pipeline approves, agents do not invoke each other");
}

function testConsensusIndependentReports() {
  const bp = commBlueprint();
  const ok = validateConsensusCommunication([
    {
      agentId: "visual-story-director",
      blueprint: bp,
      report: { storyScore: 88 },
      constraints: ["premium"],
      approved: true,
    },
  ]);
  assert.equal(ok.length, 0);

  const debate = validateConsensusCommunication([], true);
  assert.equal(debate.length, 1);
  assert.equal(debate[0].code, "CONSENSUS_DIRECT_DEBATE");
  console.log("✔ consensus — independent reports, no direct debate");
}

function testNextAgentReadsContext() {
  const ok = validateNextAgentReadsContextOnly("visual-story-director", "scene-director");
  assert.equal(ok.length, 0);

  const direct = validateNextAgentReadsContextOnly("visual-story-director", "scene-director", true);
  assert.equal(direct.length, 1);
  assert.equal(direct[0].code, "DIRECT_AGENT_COMMUNICATION");
  console.log("✔ next agent reads pipeline context — no direct call to previous agent");
}

function testAgentErrorContract() {
  const err = buildAgentPipelineError({
    code: "VALIDATION_FAILED",
    description: "Story blueprint incomplete",
    recommendedAction: "retry_story_director",
    retryPossible: true,
    severity: AgentPipelineErrorSeverity.HIGH,
  });
  assert.equal(err.retryPossible, true);
  assert.equal(err.severity, AgentPipelineErrorSeverity.HIGH);
  console.log("✔ standardized agent error contract");
}

async function testKitchenExecution() {
  const bus = new EventBus({ pipelineId: "ch74-kitchen" });
  const report = await executeAgentPipelineCommunication({
    agentId: "visual-story-director",
    nextAgentId: "scene-director",
    blueprint: commBlueprint(),
    eventBus: bus,
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.stagesCompleted.length, 8);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.nextAgentReadable, true);
  assert.ok(report.eventsPublished.includes(AgentPipelineCommunicationEvent.STORY_COMPLETED));
  assert.ok(report.request);
  assert.ok(report.response?.validationPassed);
  console.log("✔ kitchen execution — full pipeline communication cycle");
}

async function testSkipEventPublishFails() {
  const report = await executeAgentPipelineCommunication({
    agentId: "visual-story-director",
    context: { skipEventPublish: true },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "MISSING_EVENT_PUBLISH"));
  console.log("✔ missing event bus publication fails communication validation");
}

async function testUnauthorizedWriteFails() {
  const report = await executeAgentPipelineCommunication({
    agentId: "visual-story-director",
    context: { forceUnauthorizedWrite: true },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "UNAUTHORIZED_BLUEPRINT_WRITE"));
  console.log("✔ unauthorized blueprint write blocked by ownership model");
}

function testPipelineMetadata() {
  const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 1 });
  const meta = buildPipelineMetadata(bp);
  assert.ok(Array.isArray(meta.constraints));
  assert.equal(meta.revision, bp.meta.revision);
  console.log("✔ pipeline metadata extracted from blueprint context");
}

function testCommunicationPrinciples() {
  const stage = getAgentPipelineCommunicationStage(AgentPipelineCommunicationStage.AGENT_REQUEST)!;
  assert.equal(stage.order, 2);
  console.log("✔ communication sequence stage lookup");
}

async function testValidateWithExecution() {
  const report = await validateAgentPipelineCommunicationWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.contractsDefined, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertAgentPipelineCommunication();
  console.log("✔ full pipeline communication validation passes");
}

async function testRunEntryPoint() {
  const report = await runAgentPipelineCommunication();
  assert.equal(report.valid, true);
  console.log("✔ runAgentPipelineCommunication entry point works");
}

function testFailureCodes() {
  assert.equal(isAgentPipelineCommunicationFailure("DIRECT_AGENT_COMMUNICATION"), true);
  assert.equal(isAgentPipelineCommunicationFailure("UNKNOWN"), false);
  console.log("✔ pipeline communication failure codes are catalogued");
}

async function run() {
  testCatalog();
  testGoldenRule();
  testMessageTypes();
  testRequestContract();
  testResponseContract();
  testDirectCommunicationForbidden();
  testRetryThroughPipeline();
  testConsensusIndependentReports();
  testNextAgentReadsContext();
  testAgentErrorContract();
  await testKitchenExecution();
  await testSkipEventPublishFails();
  await testUnauthorizedWriteFails();
  testPipelineMetadata();
  testCommunicationPrinciples();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nagent-pipeline-communication.spec.ts — all passed");
}

run();

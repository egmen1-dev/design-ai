/**
 * DESIGN AI v18 — Chief Design Director Agent tests (Chapter 7.24)
 */
import assert from "node:assert/strict";
import {
  CHIEF_DESIGN_DIRECTOR_AGENT_VERSION,
  CHIEF_DESIGN_DIRECTOR_AGENT_GOLDEN_RULE,
  CHIEF_DESIGN_DIRECTOR_AGENT_MISSION,
  CHIEF_DESIGN_DIRECTOR_AGENT_MODULES,
  CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE,
  CHIEF_DESIGN_DIRECTOR_AGENT_ID,
  CHIEF_DESIGN_DIRECTOR_AGENT_CONTRACT_ID,
  ChiefDesignDirectorAgentModule,
  ChiefDesignDirectorAgentApprovalLevel,
  auditChiefDesignDirectorBlueprints,
  computeChiefDesignDirectorOverallScore,
  detectChiefDesignExpertConflicts,
  buildChiefDesignDirectorRetryPriority,
  resolveChiefDesignDirectorApprovalLevel,
  buildFinalDesignDecisionSection,
  fromFinalDesignDecisionSection,
  validateChiefDesignDirectorAgentDecision,
  scoreChiefConsensusCandidate,
  hasFinalGardenSprayerApproval,
  buildDefaultChiefDesignDirectorAgentInput,
  buildBatterySprayerChiefDesignDirectorInput,
  mapChiefDesignDirectorModuleToStage,
  executeChiefDesignDirectorAgent,
  executeChiefDesignDirectorAgentWithPipeline,
  validateChiefDesignDirectorAgent,
  validateChiefDesignDirectorAgentWithExecution,
  assertChiefDesignDirectorAgent,
  runChiefDesignDirectorAgent,
  isChiefDesignDirectorAgentFailure,
  getChiefDesignDirectorAgentModule,
} from "./index";

function testAgentCatalog() {
  assert.equal(CHIEF_DESIGN_DIRECTOR_AGENT_MODULES.length, 7);
  assert.equal(CHIEF_DESIGN_DIRECTOR_AGENT_VERSION, "7.24.0");
  assert.equal(CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE.length, 2);
  assert.equal(CHIEF_DESIGN_DIRECTOR_AGENT_ID, CHIEF_DESIGN_DIRECTOR_AGENT_CONTRACT_ID);
  console.log("✔ agent catalog — 7 internal modules, supreme executive design director");
}

function testGoldenRuleAndMission() {
  assert.ok(CHIEF_DESIGN_DIRECTOR_AGENT_GOLDEN_RULE.includes("millions of buyers"));
  assert.ok(CHIEF_DESIGN_DIRECTOR_AGENT_MISSION.includes("final generation"));
  console.log("✔ golden rule — executive signature before render pipeline, not aesthetics");
}

function testPipelinePosition() {
  assert.equal(CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE[0].from, "senior_art_director");
  assert.equal(CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE[0].to, "chief_design_director");
  assert.equal(CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE[1].to, "render_pipeline");
  console.log("✔ pipeline position — after senior art director, before render pipeline");
}

function testChiefDesignDirectorInputContract() {
  const input = buildDefaultChiefDesignDirectorAgentInput();
  const audit = auditChiefDesignDirectorBlueprints(input);
  assert.equal(audit.complete, true);
  assert.ok(input.visionReport.overallScore >= 85);
  assert.ok(input.commercialReport.overallCommercialScore >= 85);
  assert.ok(input.artDirectorReport.overallDesignScore >= 85);
  assert.ok(input.antiPatternReport.confidence > 0);
  console.log("✔ chief design director input — blueprints, anti-pattern, critic reports");
}

function testExecutiveScoring() {
  const input = buildBatterySprayerChiefDesignDirectorInput();
  const overall = computeChiefDesignDirectorOverallScore(input);
  const conflicts = detectChiefDesignExpertConflicts(input);
  const consensus = scoreChiefConsensusCandidate(
    input.commercialReport.overallCommercialScore,
    input.visionReport.overallScore,
  );
  assert.ok(overall >= 88);
  assert.equal(conflicts.some((c) => c.id === "conflict-vision-commercial"), false);
  assert.ok(consensus > 0.9);
  console.log("✔ executive scoring — weighted expert consensus and conflict detection");
}

function testFinalDecisionOutput() {
  const input = buildBatterySprayerChiefDesignDirectorInput();
  const section = buildFinalDesignDecisionSection(input, {}, 0.93);
  const decision = fromFinalDesignDecisionSection(section);
  assert.equal(hasFinalGardenSprayerApproval(decision), true);
  assert.equal(decision.approvalLevel, ChiefDesignDirectorAgentApprovalLevel.APPROVED);
  assert.equal(decision.criticalProblems.length, 0);
  assert.ok(decision.directorComments.length >= 1);
  assert.equal(validateChiefDesignDirectorAgentDecision(decision, section).length, 0);
  console.log("✔ final decision — garden sprayer receives executive approval for render pipeline");
}

function testModuleMapping() {
  assert.equal(
    mapChiefDesignDirectorModuleToStage(ChiefDesignDirectorAgentModule.EXPERT_CONSENSUS_ENGINE),
    "expert_consensus",
  );
  const mod = getChiefDesignDirectorAgentModule(ChiefDesignDirectorAgentModule.APPROVAL_ENGINE)!;
  assert.equal(mod.order, 5);
  console.log("✔ internal modules map to executive validation stages");
}

function testRetryPriorityPlanning() {
  const input = buildBatterySprayerChiefDesignDirectorInput();
  const priorities = buildChiefDesignDirectorRetryPriority(input, [
    {
      id: "conflict-vision-commercial",
      category: "consensus",
      severity: "high",
      message: "Commercial conflict",
    },
  ]);
  assert.equal(priorities[0]?.domain, "Commercial Problems");
  assert.ok(priorities[0]?.agents.includes("commercial-critic"));
  console.log("✔ priority planner — commercial problems ranked first");
}

async function testKitchenSprayerExecution() {
  const report = await executeChiefDesignDirectorAgent({
    agentInput: buildBatterySprayerChiefDesignDirectorInput(),
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.agentId, CHIEF_DESIGN_DIRECTOR_AGENT_ID);
  assert.equal(report.doesNotExecuteRetry, true);
  assert.equal(hasFinalGardenSprayerApproval(report.decision!), true);
  assert.ok(report.confidence >= 0.75);
  console.log("✔ kitchen execution — battery sprayer passes chief design director approval");
}

async function testRetryOnExpertConflict() {
  const report = await executeChiefDesignDirectorAgent({
    agentInput: buildBatterySprayerChiefDesignDirectorInput(),
    context: { expertConflict: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.equal(report.retryBranch, "consensus_conflict_approval");
  assert.equal(hasFinalGardenSprayerApproval(report.decision!), true);
  console.log("✔ retry logic — expert consensus and conflict resolver recover approval");
}

async function testRetryOnLowOverallScore() {
  const report = await executeChiefDesignDirectorAgent({
    agentInput: buildBatterySprayerChiefDesignDirectorInput(),
    context: { lowOverallScore: true, maxRetries: 1 },
  });
  assert.equal(report.valid, true);
  assert.equal(report.retryCount, 1);
  assert.ok(report.decision!.overallScore >= 88);
  console.log("✔ retry logic — recovers weighted consensus after low score flag");
}

async function testRejectedOnMissingBlueprint() {
  const report = await executeChiefDesignDirectorAgent({
    agentInput: buildBatterySprayerChiefDesignDirectorInput(),
    context: { missingBlueprint: true, skipRetry: true },
  });
  assert.equal(report.valid, true);
  assert.equal(report.decision!.approved, false);
  assert.equal(report.decision!.approvalLevel, ChiefDesignDirectorAgentApprovalLevel.REJECTED);
  console.log("✔ rejection — missing blueprint blocks render pipeline entry");
}

async function testPipelineHandoff() {
  const report = await executeChiefDesignDirectorAgentWithPipeline({
    agentInput: buildBatterySprayerChiefDesignDirectorInput(),
  });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineMediated, true);
  assert.equal(report.goldenRuleSatisfied, true);
  console.log("✔ pipeline handoff — final design decision authorizes render pipeline");
}

async function testKpis() {
  const report = await executeChiefDesignDirectorAgent({
    agentInput: buildBatterySprayerChiefDesignDirectorInput(),
  });
  assert.ok(report.kpis.approvalAccuracy > 0);
  assert.ok(report.kpis.consensusQuality > 0);
  assert.ok(report.kpis.commercialSuccessRate > 0);
  console.log("✔ performance metrics — approval accuracy, consensus quality, commercial success KPIs");
}

async function testValidateWithExecution() {
  const report = await validateChiefDesignDirectorAgentWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.pipelinePositionValid, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertChiefDesignDirectorAgent();
  console.log("✔ full chief design director agent validation passes");
}

async function testRunEntryPoint() {
  const report = await runChiefDesignDirectorAgent();
  assert.equal(report.valid, true);
  console.log("✔ runChiefDesignDirectorAgent entry point works");
}

function testFailureCodes() {
  assert.equal(isChiefDesignDirectorAgentFailure("FALSE_APPROVAL"), true);
  assert.equal(isChiefDesignDirectorAgentFailure("UNKNOWN"), false);
  console.log("✔ chief design director agent failure codes are catalogued");
}

async function run() {
  testAgentCatalog();
  testGoldenRuleAndMission();
  testPipelinePosition();
  testChiefDesignDirectorInputContract();
  testExecutiveScoring();
  testFinalDecisionOutput();
  testModuleMapping();
  testRetryPriorityPlanning();
  await testKitchenSprayerExecution();
  await testRetryOnExpertConflict();
  await testRetryOnLowOverallScore();
  await testRejectedOnMissingBlueprint();
  await testPipelineHandoff();
  await testKpis();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nAll Chief Design Director Agent (Ch 7.24) tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

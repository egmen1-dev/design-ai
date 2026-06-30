/**
 * DESIGN AI v18 — Pipeline Observability & Monitoring Stage tests (Chapter 6.19)
 */
import assert from "node:assert/strict";
import {
  PIPELINE_OBSERVABILITY_VERSION,
  PIPELINE_OBSERVABILITY_GOLDEN_RULE,
  PIPELINE_OBSERVABILITY_PIPELINE,
  PIPELINE_OBSERVABILITY_POSITION,
  PipelineObservabilityStage,
  PipelineEventType,
  ComponentHealthStatus,
  ObservabilityErrorCategory,
  buildDistributedTrace,
  collectPipelineEvents,
  collectAgentTelemetry,
  buildPerformanceMetrics,
  analyzeRetries,
  analyzeKnowledgeUsage,
  analyzeCommercialOutcomes,
  buildAuditTrail,
  evaluateAlerts,
  runPipelineObservabilityStage,
  runPipelineObservabilityStageFromPipeline,
  getObservabilityReport,
  resetPipelineObservabilityStores,
  validatePipelineObservabilityStage,
  assertPipelineObservabilityStage,
  runPipelineObservabilityStageSystem,
  isPipelineObservabilityStageFailure,
  runPipelineCompletionStageFromPipeline,
  DesignPipelineStage,
  DesignPipelineLayer,
  HIGH_LEVEL_PIPELINE,
  PIPELINE_LAYERS,
  executeDesignPipelineStage,
  buildDefaultPipelineInput,
} from "./index";

function observabilityInput() {
  const completion = runPipelineCompletionStageFromPipeline();
  return {
    finalProject: completion.section!.finalProject,
    generationTimeMs: completion.section!.metrics.generationTimeMs,
  };
}

function testGoldenRule() {
  assert.ok(PIPELINE_OBSERVABILITY_GOLDEN_RULE.toLowerCase().includes("measure"));
  assert.ok(
    PIPELINE_OBSERVABILITY_GOLDEN_RULE.includes("objective data") ||
      PIPELINE_OBSERVABILITY_GOLDEN_RULE.includes("measurable"),
  );
  console.log("✔ golden rule — observability makes pipeline measurable");
}

function testVersionAndPipeline() {
  assert.equal(PIPELINE_OBSERVABILITY_VERSION, "6.19.0");
  assert.equal(PIPELINE_OBSERVABILITY_PIPELINE.length, 15);
  assert.equal(PIPELINE_OBSERVABILITY_PIPELINE[0], PipelineObservabilityStage.INPUT_ASSEMBLY);
  assert.equal(PIPELINE_OBSERVABILITY_PIPELINE[14], PipelineObservabilityStage.STAGE_COMPLETE);
  assert.deepEqual(PIPELINE_OBSERVABILITY_POSITION, [
    "pipeline-completion",
    "pipeline-observability",
    "monitoring-dashboards",
  ]);
  console.log("✔ pipeline observability stage has 15 internal stages");
}

function testHighLevelPipelinePosition() {
  const observability = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.PIPELINE_OBSERVABILITY)!;
  assert.equal(observability.order, 20);
  assert.equal(observability.layer, DesignPipelineLayer.OBSERVABILITY);
  assert.equal(HIGH_LEVEL_PIPELINE.length, 20);
  assert.equal(PIPELINE_LAYERS.length, 8);
  console.log("✔ pipeline observability is stage 20 in design pipeline");
}

function testPlannedObservabilityReportShape() {
  resetPipelineObservabilityStores();
  const report = runPipelineObservabilityStageFromPipeline();
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  const planned = report.section!.plannedReport;
  assert.ok(planned.traceId.startsWith("trace-"));
  assert.ok(planned.events.length >= 10);
  assert.ok(planned.agentTelemetry.length > 0);
  assert.ok(planned.performance.totalGenerationMs > 0);
  assert.ok(planned.knowledgeAnalytics.topPatterns.length > 0);
  assert.ok(planned.commercialAnalytics.avgCommercialScore > 0);
  assert.ok(planned.auditTrail.length > 0);
  assert.ok(getObservabilityReport(planned.traceId));
  console.log("✔ planned observability report matches Chapter 6.19 contract");
}

function testPipelineEvents() {
  const input = observabilityInput();
  const trace = buildDistributedTrace(input.finalProject)!;
  const events = collectPipelineEvents(input.finalProject, trace);
  assert.ok(events.some((e) => e.type === PipelineEventType.PIPELINE_STARTED));
  assert.ok(events.some((e) => e.type === PipelineEventType.PIPELINE_COMPLETED));
  console.log("✔ pipeline events recorded in journal");
}

function testAgentTelemetry() {
  const input = observabilityInput();
  const telemetry = collectAgentTelemetry(input.finalProject);
  assert.ok(telemetry.length > 0);
  assert.ok(telemetry.every((t) => t.durationMs > 0));
  const slowest = telemetry.reduce((a, b) => (a.durationMs > b.durationMs ? a : b));
  assert.ok(slowest.agentId.length > 0);
  console.log("✔ agent telemetry captures duration and context usage");
}

function testPerformanceMetrics() {
  const input = observabilityInput();
  const telemetry = collectAgentTelemetry(input.finalProject);
  const metrics = buildPerformanceMetrics(input.finalProject, telemetry, input.generationTimeMs);
  assert.ok(metrics.totalGenerationMs > 0);
  assert.ok(Object.keys(metrics.stageDurations).length > 0);
  console.log("✔ performance metrics measure stage durations");
}

function testRetryAnalyticsAlert() {
  const report = runPipelineObservabilityStageFromPipeline({ injectHighRetryRate: true });
  assert.ok(report.section!.plannedReport.retryAnalytics.length > 0);
  assert.ok(report.section!.plannedReport.alerts.some((a) => a.title.includes("Retry")));
  console.log("✔ high retry rate triggers observability alert");
}

function testDistributedTrace() {
  const input = observabilityInput();
  const trace = buildDistributedTrace(input.finalProject)!;
  assert.ok(trace.pipelineId);
  assert.ok(trace.storyId);
  assert.ok(trace.renderId);
  assert.ok(trace.validationId);
  assert.ok(trace.learningId);
  console.log("✔ distributed trace links pipeline through learning");
}

function testHealthMonitoring() {
  const report = runPipelineObservabilityStageFromPipeline({ injectProviderCritical: true });
  const provider = report.section!.plannedReport.health.find((h) => h.component === "Render Provider");
  assert.equal(provider!.status, ComponentHealthStatus.CRITICAL);
  assert.ok(report.section!.plannedReport.errors.some((e) => e.category === ObservabilityErrorCategory.RENDER));
  console.log("✔ health monitoring flags critical provider state");
}

function testAuditTrail() {
  const input = observabilityInput();
  const trace = buildDistributedTrace(input.finalProject)!;
  const audit = buildAuditTrail(input.finalProject, trace);
  assert.ok(audit.some((e) => e.actor === "chief-design-director"));
  assert.ok(audit.some((e) => e.action.includes("Knowledge")));
  console.log("✔ audit trail records agent actions and decisions");
}

function testMissingTelemetryFails() {
  const report = runPipelineObservabilityStage(observabilityInput(), { injectMissingTelemetry: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "MISSING_TELEMETRY"));
  console.log("✔ missing telemetry fails observability validation");
}

function testPipelineChain() {
  const report = runPipelineObservabilityStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.stagesCompleted.includes(PipelineObservabilityStage.AUDIT_TRAIL));
  console.log("✔ completion → observability chain completes");
}

function testDesignPipelineStageExecution() {
  const result = executeDesignPipelineStage(
    DesignPipelineStage.PIPELINE_OBSERVABILITY,
    buildDefaultPipelineInput(),
  );
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(PIPELINE_OBSERVABILITY) passes default kitchen pipeline");
}

function testSystemValidation() {
  resetPipelineObservabilityStores();
  const report = validatePipelineObservabilityStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.eventsRecorded, true);
  assert.equal(report.telemetryCaptured, true);
  assert.equal(report.metricsUpdated, true);
  assert.equal(report.traceCreated, true);
  assert.equal(report.auditTrailComplete, true);
  assert.equal(report.downstreamReady, true);
  assert.doesNotThrow(() => assertPipelineObservabilityStage());
  assert.equal(runPipelineObservabilityStageSystem().valid, true);
  assert.equal(isPipelineObservabilityStageFailure("BLACK_BOX_PIPELINE"), true);
  console.log("✔ system validation confirms pipeline observability stage contract");
}

function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testPlannedObservabilityReportShape();
  testPipelineEvents();
  testAgentTelemetry();
  testPerformanceMetrics();
  testRetryAnalyticsAlert();
  testDistributedTrace();
  testHealthMonitoring();
  testAuditTrail();
  testMissingTelemetryFails();
  testPipelineChain();
  testDesignPipelineStageExecution();
  testSystemValidation();
  console.log("\npipeline-observability-stage.spec.ts — all passed");
}

run();

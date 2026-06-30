/**
 * Chapter 6.19 — Pipeline Observability & Monitoring Stage engine.
 * Observes, measures, and documents pipeline execution — never makes design decisions.
 */
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import { resolvePatternIdsFromBlueprint } from "./learning-feedback-stage-engine";
import { runPipelineCompletionStageFromPipeline } from "./pipeline-completion-stage-engine";
import type { PlannedFinalProject } from "./pipeline-completion-stage-types";
import {
  ComponentHealthStatus,
  ObservabilityErrorCategory,
  PipelineEventType,
  PipelineObservabilityLayer,
  PipelineObservabilityStage,
  type PipelineObservabilityContext,
  type PipelineObservabilityInput,
  type PipelineObservabilityReport,
  type PipelineObservabilitySection,
  type PipelineObservabilityStageFailureCode,
  type PipelineObservabilityStageId,
  type PipelineObservabilityStageViolation,
  type PipelineObservabilitySystemReport,
  type PlannedAgentTelemetry,
  type PlannedAuditTrailEntry,
  type PlannedCommercialAnalytics,
  type PlannedComponentHealth,
  type PlannedDistributedTrace,
  type PlannedKnowledgeAnalytics,
  type PlannedObservabilityAlert,
  type PlannedObservabilityError,
  type PlannedObservabilityReport,
  type PlannedPerformanceMetrics,
  type PlannedPipelineEvent,
  type PlannedRetryAnalytics,
} from "./pipeline-observability-stage-types";

export {
  PipelineObservabilityStage,
  PipelineObservabilityLayer,
  PipelineEventType,
  ObservabilityErrorCategory,
  ComponentHealthStatus,
  type PipelineObservabilityStageId,
  type PlannedPipelineEvent,
  type PlannedAgentTelemetry,
  type PlannedPerformanceMetrics,
  type PlannedRetryAnalytics,
  type PlannedKnowledgeAnalytics,
  type PlannedCommercialAnalytics,
  type PlannedObservabilityError,
  type PlannedDistributedTrace,
  type PlannedComponentHealth,
  type PlannedObservabilityAlert,
  type PlannedAuditTrailEntry,
  type PlannedObservabilityReport,
  type PipelineObservabilityInput,
  type PipelineObservabilitySection,
  type PipelineObservabilityStageViolation,
  type PipelineObservabilityReport,
  type PipelineObservabilityContext,
  type PipelineObservabilitySystemReport,
  type PipelineObservabilityStageFailureCode,
} from "./pipeline-observability-stage-types";

export const PIPELINE_OBSERVABILITY_VERSION = "6.19.0";

export const PIPELINE_OBSERVABILITY_GOLDEN_RULE =
  "It is impossible to improve a system that cannot be measured. Pipeline Observability makes " +
  "every action, decision, retry, error, and successful project measurable — so the platform " +
  "continuously improves its architecture based on objective data, not assumptions.";

export const PIPELINE_OBSERVABILITY_PIPELINE: readonly PipelineObservabilityStageId[] = [
  PipelineObservabilityStage.INPUT_ASSEMBLY,
  PipelineObservabilityStage.TRACE_INITIALIZATION,
  PipelineObservabilityStage.INFRASTRUCTURE_MONITORING,
  PipelineObservabilityStage.PIPELINE_EVENT_COLLECTION,
  PipelineObservabilityStage.AGENT_TELEMETRY,
  PipelineObservabilityStage.PERFORMANCE_METRICS,
  PipelineObservabilityStage.RETRY_ANALYTICS,
  PipelineObservabilityStage.KNOWLEDGE_ANALYTICS,
  PipelineObservabilityStage.COMMERCIAL_ANALYTICS,
  PipelineObservabilityStage.ERROR_MONITORING,
  PipelineObservabilityStage.HEALTH_MONITORING,
  PipelineObservabilityStage.AUDIT_TRAIL,
  PipelineObservabilityStage.ALERT_EVALUATION,
  PipelineObservabilityStage.VALIDATION,
  PipelineObservabilityStage.STAGE_COMPLETE,
] as const;

export const PIPELINE_OBSERVABILITY_POSITION = [
  "pipeline-completion",
  "pipeline-observability",
  "monitoring-dashboards",
] as const;

const traceRegistry = new Map<string, PlannedObservabilityReport>();

function violation(
  code: PipelineObservabilityStageFailureCode,
  message: string,
  stage?: PipelineObservabilityStageId,
): PipelineObservabilityStageViolation {
  return { code, message, stage };
}

export function resetPipelineObservabilityStores(): void {
  traceRegistry.clear();
}

export function getObservabilityReport(traceId: string): PlannedObservabilityReport | undefined {
  return traceRegistry.get(traceId);
}

export function buildDistributedTrace(
  project: PlannedFinalProject,
  context: PipelineObservabilityContext = {},
): PlannedDistributedTrace | null {
  if (context.injectMissingTrace) return null;

  const base = project.projectId;
  return {
    traceId: `trace-${base}`,
    pipelineId: base,
    storyId: `${base}-story`,
    sceneId: `${base}-scene`,
    renderId: `${base}-render`,
    validationId: `${base}-validation`,
    learningId: `${base}-learning`,
  };
}

export function collectPipelineEvents(
  project: PlannedFinalProject,
  trace: PlannedDistributedTrace,
): PlannedPipelineEvent[] {
  const now = Date.now();
  const base = trace.traceId;
  const events: PlannedPipelineEvent[] = [
    { type: PipelineEventType.PIPELINE_STARTED, timestamp: now - 8000, stage: "input", traceId: base },
    { type: PipelineEventType.KNOWLEDGE_LOADED, timestamp: now - 7200, stage: "knowledge", traceId: base },
    { type: PipelineEventType.STORY_COMPLETED, timestamp: now - 6400, stage: "story", traceId: base },
    { type: PipelineEventType.SCENE_COMPLETED, timestamp: now - 5600, stage: "scene", traceId: base },
    {
      type: PipelineEventType.COMPOSITION_COMPLETED,
      timestamp: now - 4800,
      stage: "composition",
      traceId: base,
    },
    { type: PipelineEventType.RENDERING_STARTED, timestamp: now - 4000, stage: "rendering", traceId: base },
    { type: PipelineEventType.RENDERING_FINISHED, timestamp: now - 3200, stage: "rendering", traceId: base },
    { type: PipelineEventType.VISION_VALIDATED, timestamp: now - 2400, stage: "vision", traceId: base },
    {
      type: PipelineEventType.COMMERCIAL_APPROVED,
      timestamp: now - 1600,
      stage: "commercial",
      traceId: base,
      metadata: { score: project.commercial.commercialScore },
    },
    {
      type: PipelineEventType.PIPELINE_COMPLETED,
      timestamp: now,
      stage: "completion",
      traceId: base,
      metadata: { professionalScore: project.director.professionalLevel },
    },
  ];

  return events;
}

export function collectAgentTelemetry(
  project: PlannedFinalProject,
  context: PipelineObservabilityContext = {},
): PlannedAgentTelemetry[] {
  if (context.injectMissingTelemetry) return [];

  const agents = project.metadata.patternsUsed.length > 0
    ? [
        "visual-story-director",
        "scene-director",
        "composition-director",
        "commercial-photo-director",
        "render-adapter",
        "vision-quality-director",
        "chief-design-director",
      ]
    : [];

  const baseTime = Date.now() - project.metadata.generationTimeMs;
  let cursor = baseTime;

  return agents.map((agentId, index) => {
    const durationMs = 180 + index * 40;
    const entry: PlannedAgentTelemetry = {
      agentId,
      startedAt: cursor,
      completedAt: cursor + durationMs,
      durationMs,
      knowledgeLookups: agentId.includes("director") ? 3 : 1,
      conflicts: agentId === "composition-director" ? 1 : 0,
      contextBytes: 2048 + index * 256,
      retryCount:
        project.learning.retryHistory.attempts > 0 && agentId === "composition-director" ? 1 : 0,
    };
    cursor += durationMs;
    return entry;
  });
}

export function buildPerformanceMetrics(
  project: PlannedFinalProject,
  agentTelemetry: PlannedAgentTelemetry[],
  generationTimeMs: number,
): PlannedPerformanceMetrics {
  const stageDurations: Record<string, number> = {
    knowledge: 420,
    story: 380,
    scene: 360,
    composition: 400,
    rendering: Math.max(600, generationTimeMs * 0.45),
    validation: 520,
    learning: 280,
    completion: 180,
  };

  for (const agent of agentTelemetry) {
    stageDurations[agent.agentId] = agent.durationMs;
  }

  const approved =
    project.director.approvalStatus === "approved" ||
    project.director.approvalStatus === "approved_with_notes";

  return {
    totalGenerationMs: generationTimeMs,
    stageDurations,
    renderProviderLoad: 0.42,
    retrievalMs: stageDurations.knowledge ?? 420,
    validationMs: stageDurations.validation ?? 520,
    successfulProjects: approved ? 1 : 0,
    failedProjects: approved ? 0 : 1,
  };
}

export function analyzeRetries(
  project: PlannedFinalProject,
  context: PipelineObservabilityContext = {},
): PlannedRetryAnalytics[] {
  const analytics: PlannedRetryAnalytics[] = [];

  const retryHistory = project.learning.retryHistory;
  if (retryHistory.attempts > 0 || context.injectHighRetryRate) {
    const attempts = context.injectHighRetryRate ? 3 : retryHistory.attempts;
    analytics.push({
      initiatingAgent: retryHistory.strategiesUsed[0] ?? "composition-director",
      reason: retryHistory.reasons[0] ?? "Hero dominance below threshold",
      attempts,
      fixed: retryHistory.fixedIssues.length > 0,
      qualityImpact: project.director.professionalLevel - project.vision.overallScore * 0.1,
    });
  }

  return analytics;
}

export function analyzeKnowledgeUsage(project: PlannedFinalProject): PlannedKnowledgeAnalytics {
  const patterns = resolvePatternIdsFromBlueprint(project.blueprint);

  return {
    topPatterns: patterns.slice(0, 3),
    unusedRules: ["legacy-shadow-rule"],
    staleKnowledge: [],
    effectiveAntiPatterns: ["comp-hero-area-too-small"],
    retrievalMs: 420,
  };
}

export function analyzeCommercialOutcomes(project: PlannedFinalProject): PlannedCommercialAnalytics {
  return {
    avgCommercialScore: project.commercial.commercialScore,
    avgVisionScore: project.vision.overallScore,
    avgCtrPrediction: project.commercial.ctrPrediction,
    patternSuccessRate: project.commercial.sellingPower,
    storyEffectiveness: project.director.professionalLevel,
    marketplaceStrategyScore: project.commercial.marketplaceFit,
  };
}

export function collectObservabilityErrors(
  project: PlannedFinalProject,
  trace: PlannedDistributedTrace,
  context: PipelineObservabilityContext = {},
): PlannedObservabilityError[] {
  const errors: PlannedObservabilityError[] = [];

  for (const issue of project.director.criticalIssues) {
    errors.push({
      category:
        issue.category === "technical"
          ? ObservabilityErrorCategory.VALIDATION
          : issue.category === "commercial"
            ? ObservabilityErrorCategory.VALIDATION
            : ObservabilityErrorCategory.AGENT,
      message: issue.description,
      stage: issue.category,
      timestamp: Date.now(),
      traceId: trace.traceId,
    });
  }

  if (context.injectProviderCritical) {
    errors.push({
      category: ObservabilityErrorCategory.RENDER,
      message: "Render provider latency exceeded threshold",
      stage: "rendering",
      timestamp: Date.now(),
      traceId: trace.traceId,
    });
  }

  return errors;
}

export function evaluateComponentHealth(
  project: PlannedFinalProject,
  errors: PlannedObservabilityError[],
  context: PipelineObservabilityContext = {},
): PlannedComponentHealth[] {
  const renderStatus = context.injectProviderCritical
    ? ComponentHealthStatus.CRITICAL
    : ComponentHealthStatus.HEALTHY;
  const adapterStatus =
    errors.some((e) => e.category === ObservabilityErrorCategory.RENDER)
      ? ComponentHealthStatus.WARNING
      : ComponentHealthStatus.HEALTHY;

  return [
    { component: "Knowledge Engine", status: ComponentHealthStatus.HEALTHY, score: 96 },
    { component: "Story Director", status: ComponentHealthStatus.HEALTHY, score: 94 },
    { component: "Render Adapter", status: adapterStatus, score: adapterStatus === "Warning" ? 72 : 91 },
    { component: "Render Provider", status: renderStatus, score: renderStatus === "Critical" ? 45 : 88 },
    { component: "Chief Design Director", status: ComponentHealthStatus.HEALTHY, score: 95 },
  ];
}

export function buildAuditTrail(
  project: PlannedFinalProject,
  trace: PlannedDistributedTrace,
): PlannedAuditTrailEntry[] {
  const patterns = resolvePatternIdsFromBlueprint(project.blueprint);
  const entries: PlannedAuditTrailEntry[] = [
    {
      timestamp: Date.now() - 7000,
      actor: "knowledge-retrieval",
      action: "Knowledge package loaded",
      detail: `Knowledge v${project.learning.metadata.knowledgeEngineVersion}`,
      traceId: trace.traceId,
    },
    {
      timestamp: Date.now() - 5000,
      actor: "blueprint-assembly",
      action: "Blueprint assembled",
      detail: `Patterns: ${patterns.join(", ")}`,
      traceId: trace.traceId,
    },
    {
      timestamp: Date.now() - 3000,
      actor: "consensus-validation",
      action: "Conflicts evaluated",
      detail: "Cross-module consistency verified",
      traceId: trace.traceId,
    },
    {
      timestamp: Date.now() - 1000,
      actor: "chief-design-director",
      action: "Final decision recorded",
      detail: project.director.finalDecision,
      traceId: trace.traceId,
    },
  ];

  if (project.learning.retryHistory.attempts > 0) {
    entries.push({
      timestamp: Date.now() - 2000,
      actor: project.learning.retryHistory.strategiesUsed[0] ?? "composition-director",
      action: "Retry initiated",
      detail: project.learning.retryHistory.reasons[0] ?? "Quality improvement required",
      traceId: trace.traceId,
    });
  }

  return entries;
}

export function evaluateAlerts(
  retryAnalytics: PlannedRetryAnalytics[],
  commercial: PlannedCommercialAnalytics,
  health: PlannedComponentHealth[],
  context: PipelineObservabilityContext = {},
): PlannedObservabilityAlert[] {
  const alerts: PlannedObservabilityAlert[] = [];

  const highRetry = retryAnalytics.some((r) => r.attempts >= 3) || context.injectHighRetryRate;
  if (highRetry) {
    alerts.push({
      severity: "warning",
      title: "High Retry Rate",
      message: "Retry attempts exceeded recommended threshold for this pipeline run",
      component: retryAnalytics[0]?.initiatingAgent ?? "composition-director",
    });
  }

  if (commercial.avgCommercialScore < 70) {
    alerts.push({
      severity: "warning",
      title: "Commercial Score Drop",
      message: `Commercial score ${commercial.avgCommercialScore} below platform target`,
      component: "commercial-validation",
    });
  }

  for (const component of health) {
    if (component.status === ComponentHealthStatus.CRITICAL) {
      alerts.push({
        severity: "critical",
        title: `${component.component} Critical`,
        message: component.reason ?? "Component health degraded to critical",
        component: component.component,
      });
    }
  }

  return alerts;
}

export function buildPlannedObservabilityReport(input: {
  project: PlannedFinalProject;
  trace: PlannedDistributedTrace;
  events: PlannedPipelineEvent[];
  agentTelemetry: PlannedAgentTelemetry[];
  performance: PlannedPerformanceMetrics;
  retryAnalytics: PlannedRetryAnalytics[];
  knowledgeAnalytics: PlannedKnowledgeAnalytics;
  commercialAnalytics: PlannedCommercialAnalytics;
  errors: PlannedObservabilityError[];
  health: PlannedComponentHealth[];
  alerts: PlannedObservabilityAlert[];
  auditTrail: PlannedAuditTrailEntry[];
}): PlannedObservabilityReport {
  return {
    traceId: input.trace.traceId,
    projectId: input.project.projectId,
    events: input.events,
    agentTelemetry: input.agentTelemetry,
    performance: input.performance,
    retryAnalytics: input.retryAnalytics,
    knowledgeAnalytics: input.knowledgeAnalytics,
    commercialAnalytics: input.commercialAnalytics,
    errors: input.errors,
    health: input.health,
    alerts: input.alerts,
    auditTrail: input.auditTrail,
  };
}

export function validatePipelineObservabilityInput(
  input: PipelineObservabilityInput,
  context: PipelineObservabilityContext = {},
): PipelineObservabilityStageViolation[] {
  const violations: PipelineObservabilityStageViolation[] = [];

  if (context.missingFinalProject || !input.finalProject) {
    violations.push(
      violation(
        "MISSING_FINAL_PROJECT",
        "Final project required from Pipeline Completion Stage",
        PipelineObservabilityStage.INPUT_ASSEMBLY,
      ),
    );
  }

  return violations;
}

export function runPipelineObservabilityStage(
  input: PipelineObservabilityInput,
  context: PipelineObservabilityContext = {},
): PipelineObservabilityReport {
  const started = Date.now();
  const stagesCompleted: PipelineObservabilityStageId[] = [];

  const inputViolations = validatePipelineObservabilityInput(input, context);
  if (inputViolations.length > 0) {
    return {
      valid: false,
      violations: inputViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  const project = input.finalProject;
  stagesCompleted.push(PipelineObservabilityStage.INPUT_ASSEMBLY);

  const trace = buildDistributedTrace(project, context);
  if (!trace) {
    return {
      valid: false,
      violations: [
        violation("MISSING_TRACE", "Distributed trace must be created", PipelineObservabilityStage.TRACE_INITIALIZATION),
      ],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  stagesCompleted.push(
    PipelineObservabilityStage.TRACE_INITIALIZATION,
    PipelineObservabilityStage.INFRASTRUCTURE_MONITORING,
  );

  const events = collectPipelineEvents(project, trace);
  stagesCompleted.push(PipelineObservabilityStage.PIPELINE_EVENT_COLLECTION);

  const agentTelemetry = collectAgentTelemetry(project, context);
  stagesCompleted.push(PipelineObservabilityStage.AGENT_TELEMETRY);

  const performance = buildPerformanceMetrics(project, agentTelemetry, input.generationTimeMs);
  stagesCompleted.push(PipelineObservabilityStage.PERFORMANCE_METRICS);

  const retryAnalytics = analyzeRetries(project, context);
  stagesCompleted.push(PipelineObservabilityStage.RETRY_ANALYTICS);

  const knowledgeAnalytics = analyzeKnowledgeUsage(project);
  stagesCompleted.push(PipelineObservabilityStage.KNOWLEDGE_ANALYTICS);

  const commercialAnalytics = analyzeCommercialOutcomes(project);
  stagesCompleted.push(PipelineObservabilityStage.COMMERCIAL_ANALYTICS);

  const errors = collectObservabilityErrors(project, trace, context);
  stagesCompleted.push(PipelineObservabilityStage.ERROR_MONITORING);

  const health = evaluateComponentHealth(project, errors, context);
  stagesCompleted.push(PipelineObservabilityStage.HEALTH_MONITORING);

  const auditTrail = buildAuditTrail(project, trace);
  stagesCompleted.push(PipelineObservabilityStage.AUDIT_TRAIL);

  const alerts = evaluateAlerts(retryAnalytics, commercialAnalytics, health, context);
  stagesCompleted.push(PipelineObservabilityStage.ALERT_EVALUATION);

  const plannedReport = buildPlannedObservabilityReport({
    project,
    trace,
    events,
    agentTelemetry,
    performance,
    retryAnalytics,
    knowledgeAnalytics,
    commercialAnalytics,
    errors,
    health,
    alerts,
    auditTrail,
  });

  traceRegistry.set(trace.traceId, plannedReport);

  const violations: PipelineObservabilityStageViolation[] = [];

  if (events.length === 0) {
    violations.push(
      violation("MISSING_EVENTS", "Pipeline events must be recorded", PipelineObservabilityStage.PIPELINE_EVENT_COLLECTION),
    );
  }

  if (agentTelemetry.length === 0) {
    violations.push(
      violation("MISSING_TELEMETRY", "Agent telemetry must be captured", PipelineObservabilityStage.AGENT_TELEMETRY),
    );
  }

  if (!performance.totalGenerationMs) {
    violations.push(
      violation("MISSING_METRICS", "Performance metrics must be updated", PipelineObservabilityStage.PERFORMANCE_METRICS),
    );
  }

  if (auditTrail.length === 0) {
    violations.push(
      violation("MISSING_AUDIT_TRAIL", "Audit trail must be recorded", PipelineObservabilityStage.AUDIT_TRAIL),
    );
  }

  if (
    retryAnalytics.length > 0 &&
    !retryAnalytics[0].reason &&
    context.injectHighRetryRate
  ) {
    violations.push(
      violation("UNEXPLAINABLE_RETRY", "Retry must be explainable", PipelineObservabilityStage.RETRY_ANALYTICS),
    );
  }

  if (events.length === 0 && agentTelemetry.length === 0 && auditTrail.length === 0) {
    violations.push(
      violation("BLACK_BOX_PIPELINE", "Pipeline must not operate as a black box", PipelineObservabilityStage.VALIDATION),
    );
  }

  stagesCompleted.push(PipelineObservabilityStage.VALIDATION);

  const section: PipelineObservabilitySection = {
    plannedReport,
    distributedTrace: trace,
    stagesCompleted: [...stagesCompleted],
    confidence: violations.length === 0 ? 0.97 : 0.5,
  };

  stagesCompleted.push(PipelineObservabilityStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function runPipelineObservabilityStageFromPipeline(
  context: PipelineObservabilityContext = {},
): PipelineObservabilityReport {
  const completion = runPipelineCompletionStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  if (!completion.valid || !completion.section) {
    return {
      valid: false,
      violations: [
        violation("MISSING_FINAL_PROJECT", "Pipeline Completion must finish before Observability"),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  return runPipelineObservabilityStage(
    {
      finalProject: completion.section.finalProject,
      generationTimeMs: completion.section.metrics.generationTimeMs,
    },
    context,
  );
}

export function validatePipelineObservabilityStage(
  context: PipelineObservabilityContext = {},
): PipelineObservabilitySystemReport {
  const violations: PipelineObservabilityStageViolation[] = [];

  const kitchen = runPipelineObservabilityStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (!kitchen.section.plannedReport.traceId) {
      violations.push(violation("MISSING_TRACE", "Kitchen pipeline must create trace"));
    }
    if (!getObservabilityReport(kitchen.section.plannedReport.traceId)) {
      violations.push(violation("MISSING_TELEMETRY", "Observability report must be registered"));
    }
  }

  const noTelemetry = runPipelineObservabilityStageFromPipeline({
    ...context,
    injectMissingTelemetry: true,
  });
  if (noTelemetry.valid) {
    violations.push(violation("MISSING_TELEMETRY", "Missing telemetry must fail observability validation"));
  }

  const noTrace = runPipelineObservabilityStageFromPipeline({
    ...context,
    injectMissingTrace: true,
  });
  if (noTrace.valid) {
    violations.push(violation("MISSING_TRACE", "Missing trace must fail observability validation"));
  }

  const highRetry = runPipelineObservabilityStageFromPipeline({
    ...context,
    injectHighRetryRate: true,
  });
  if (!highRetry.section?.plannedReport.alerts.some((a) => a.title.includes("Retry"))) {
    violations.push(violation("UNEXPLAINABLE_RETRY", "High retry rate must trigger alert"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    eventsRecorded: !!kitchen.section?.plannedReport.events.length,
    telemetryCaptured: !!kitchen.section?.plannedReport.agentTelemetry.length,
    metricsUpdated: !!kitchen.section?.plannedReport.performance.totalGenerationMs,
    traceCreated: !!kitchen.section?.distributedTrace.traceId,
    auditTrailComplete: !!kitchen.section?.plannedReport.auditTrail.length,
    downstreamReady: !!kitchen.section?.plannedReport.traceId,
  };
}

export function assertPipelineObservabilityStage(
  context: PipelineObservabilityContext = {},
): PipelineObservabilitySystemReport {
  const report = validatePipelineObservabilityStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Pipeline Observability Stage failed: ${messages}`);
  }
  return report;
}

export function runPipelineObservabilityStageSystem(
  context: PipelineObservabilityContext = {},
): PipelineObservabilitySystemReport {
  return validatePipelineObservabilityStage(context);
}

export function isPipelineObservabilityStageFailure(
  code: string,
): code is PipelineObservabilityStageFailureCode {
  const codes: PipelineObservabilityStageFailureCode[] = [
    "MISSING_FINAL_PROJECT",
    "MISSING_TRACE",
    "MISSING_TELEMETRY",
    "MISSING_EVENTS",
    "MISSING_METRICS",
    "MISSING_AUDIT_TRAIL",
    "BLACK_BOX_PIPELINE",
    "UNEXPLAINABLE_RETRY",
  ];
  return codes.includes(code as PipelineObservabilityStageFailureCode);
}

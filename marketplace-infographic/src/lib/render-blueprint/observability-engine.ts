/**
 * Chapter 3.15 — Observability & Diagnostics engine
 */
import { randomUUID } from "crypto";
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { BlueprintSection } from "./types";
import type { MutationAuditEntry } from "./mutation-types";
import type { ValidationError, ValidationWarning } from "./validation-types";
import type { RenderIntent } from "./render-pipeline-types";
import type { PerformanceMetrics } from "./performance-types";
import {
  DiagnosticLevel,
  ErrorCategory,
  ObservabilityLayer,
  type AgentDiagnostic,
  type CompositeDiagnostic,
  type DecisionTrace,
  type DiagnosticContext,
  type DiagnosticMetrics,
  type DiagnosticRecord,
  type ExplainabilityReport,
  type FailureReport,
  type MutationTrace,
  type ObservabilityMode,
  type ObservabilityOptions,
  type RenderDiagnostic,
  type RetryDiagnostic,
  type TimelineEntry,
  type ValidationTrace,
  type VisionDiagnostic,
  type ErrorCategoryId,
  type ObservabilityLayerId,
} from "./observability-types";
import { maskSecrets, sanitizeDiagnosticData, stripDebugOnlyFields } from "./diagnostic-privacy";
import type { EventBus } from "./event-bus";
import { DesignEventType } from "./event-types";
import type { DesignEvent } from "./event-types";

export {
  DiagnosticLevel,
  ErrorCategory,
  ObservabilityLayer,
  type DiagnosticContext,
  type DecisionTrace,
  type MutationTrace,
  type ValidationTrace,
  type AgentDiagnostic,
  type RenderDiagnostic,
  type CompositeDiagnostic,
  type VisionDiagnostic,
  type RetryDiagnostic,
  type TimelineEntry,
  type DiagnosticMetrics,
  type ExplainabilityReport,
  type FailureReport,
  type DiagnosticRecord,
  type ObservabilityMode,
  type ObservabilityOptions,
} from "./observability-types";

export { maskSecrets, sanitizeDiagnosticData, stripDebugOnlyFields } from "./diagnostic-privacy";

export class ObservabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservabilityError";
  }
}

export function createDiagnosticContext(input: {
  pipelineId?: string;
  sessionId?: string;
  blueprintRevision?: number;
  currentStage?: BlueprintLifecycle;
}): DiagnosticContext {
  return {
    pipelineId: input.pipelineId ?? randomUUID(),
    sessionId: input.sessionId ?? randomUUID(),
    blueprintRevision: input.blueprintRevision ?? 0,
    currentStage: input.currentStage ?? "NEW",
  };
}

export class ObservabilityEngine {
  private readonly mode: ObservabilityMode;
  private context: DiagnosticContext;
  private readonly decisions: DecisionTrace[] = [];
  private readonly mutations: MutationTrace[] = [];
  private readonly validations: ValidationTrace[] = [];
  private readonly agents: AgentDiagnostic[] = [];
  private readonly renders: RenderDiagnostic[] = [];
  private readonly composites: CompositeDiagnostic[] = [];
  private readonly visions: VisionDiagnostic[] = [];
  private readonly retries: RetryDiagnostic[] = [];
  private readonly timeline: TimelineEntry[] = [];
  private readonly logs: DiagnosticRecord[] = [];
  private readonly constraints: string[] = [];
  private activeAgents = new Set<string>();
  private pipelineStartedAt = Date.now();
  private lastSnapshotId?: string;
  private failure?: { layer: ObservabilityLayerId; category: ErrorCategoryId; message: string; stack?: string };

  constructor(options: ObservabilityOptions = {}) {
    this.mode = options.mode ?? "production";
    this.context = createDiagnosticContext({
      pipelineId: options.pipelineId,
      sessionId: options.sessionId,
    });
  }

  get diagnosticContext(): DiagnosticContext {
    return { ...this.context };
  }

  get isDebugMode(): boolean {
    return this.mode === "debug";
  }

  bindContext(patch: Partial<DiagnosticContext>): void {
    this.context = { ...this.context, ...patch };
  }

  recordLog(
    level: keyof typeof DiagnosticLevel,
    layer: keyof typeof ObservabilityLayer,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (this.mode === "production" && (level === "trace" || level === "debug")) return;
    const entry: DiagnosticRecord = {
      level: DiagnosticLevel[level],
      layer: ObservabilityLayer[layer],
      message: maskSecrets(message),
      timestamp: Date.now(),
      context: { ...this.context },
      data: data ? sanitizeDiagnosticData(data) : undefined,
    };
    this.logs.push(entry);
  }

  recordDecision(trace: Omit<DecisionTrace, "context" | "timestamp"> & { timestamp?: number }): void {
    this.decisions.push({
      ...trace,
      reason: maskSecrets(trace.reason),
      timestamp: trace.timestamp ?? Date.now(),
      context: { ...this.context },
    });
    this.activeAgents.add(trace.agentId);
    this.recordLog("info", "AGENTS", `Decision by ${trace.agentId}: ${trace.reason}`, {
      confidence: trace.confidence,
      inputHash: trace.inputHash,
      outputHash: trace.outputHash,
    });
  }

  recordMutation(trace: Omit<MutationTrace, "context" | "timestamp"> & { timestamp?: number }): void {
    this.mutations.push({
      ...trace,
      reason: maskSecrets(trace.reason),
      timestamp: trace.timestamp ?? Date.now(),
      context: { ...this.context },
    });
    this.recordLog("info", "MUTATIONS", `Mutation ${trace.section} by ${trace.producer}`, {
      oldRevision: trace.oldRevision,
      newRevision: trace.newRevision,
    });
  }

  recordMutationFromAudit(entry: MutationAuditEntry, oldRevision: number): void {
    this.recordMutation({
      section: entry.section,
      producer: entry.producer,
      oldRevision,
      newRevision: entry.revision,
      reason: entry.reason,
      timestamp: entry.timestamp,
    });
  }

  recordValidation(trace: Omit<ValidationTrace, "context" | "timestamp"> & { timestamp?: number }): void {
    this.validations.push({
      ...trace,
      message: maskSecrets(trace.message),
      fix: trace.fix ? maskSecrets(trace.fix) : undefined,
      timestamp: trace.timestamp ?? Date.now(),
      context: { ...this.context },
    });
    const level = trace.passed ? "info" : trace.severity === "warning" ? "warning" : "error";
    this.recordLog(level, "VALIDATION", `Rule ${trace.ruleId}: ${trace.message}`, {
      passed: trace.passed,
    });
  }

  recordValidationReport(errors: ValidationError[], warnings: ValidationWarning[]): void {
    for (const e of errors) {
      this.recordValidation({
        ruleId: e.code,
        passed: false,
        severity: e.severity === "fatal" ? "fatal" : "error",
        message: e.message,
      });
    }
    for (const w of warnings) {
      this.recordValidation({
        ruleId: w.code,
        passed: false,
        severity: "warning",
        message: w.message,
      });
    }
  }

  recordAgent(diagnostic: Omit<AgentDiagnostic, "context">): void {
    this.agents.push({
      ...diagnostic,
      recommendations: diagnostic.recommendations.map(maskSecrets),
      context: { ...this.context },
    });
    this.activeAgents.add(diagnostic.agentId);
  }

  recordRender(diagnostic: Omit<RenderDiagnostic, "context">): void {
    const stored = stripDebugOnlyFields(
      {
        ...diagnostic,
        prompt: diagnostic.prompt ? maskSecrets(diagnostic.prompt) : undefined,
        negativePrompt: diagnostic.negativePrompt
          ? maskSecrets(diagnostic.negativePrompt)
          : undefined,
        context: { ...this.context },
      },
      this.isDebugMode,
    );
    this.renders.push(stored);
    this.recordLog("info", "RENDER", `Render via ${diagnostic.provider}`, {
      promptLength: diagnostic.promptLength,
      generationTimeMs: diagnostic.generationTimeMs,
    });
  }

  recordComposite(diagnostic: Omit<CompositeDiagnostic, "context">): void {
    this.composites.push({ ...diagnostic, context: { ...this.context } });
    this.recordLog("info", "RENDER", "Composite completed", {
      integrationQuality: diagnostic.integrationQuality,
    });
  }

  recordVision(diagnostic: Omit<VisionDiagnostic, "context">): void {
    this.visions.push({
      ...diagnostic,
      issues: diagnostic.issues.map((i) => ({
        ...i,
        message: maskSecrets(i.message),
        explanation: maskSecrets(i.explanation),
      })),
      context: { ...this.context },
    });
    this.recordLog("info", "VISION", "Vision QA completed", {
      realismScore: diagnostic.realismScore,
    });
  }

  recordRetry(diagnostic: Omit<RetryDiagnostic, "context" | "timestamp"> & { timestamp?: number }): void {
    this.retries.push({
      ...diagnostic,
      reason: maskSecrets(diagnostic.reason),
      timestamp: diagnostic.timestamp ?? Date.now(),
      context: { ...this.context },
    });
    this.recordLog("warning", "LIFECYCLE", `Retry: ${diagnostic.reason}`, {
      attempt: diagnostic.attempt,
      result: diagnostic.result,
    });
  }

  recordConstraint(rule: string): void {
    this.constraints.push(maskSecrets(rule));
  }

  markTimeline(stage: string, status: TimelineEntry["status"], durationMs?: number): void {
    this.timeline.push({
      stage,
      timestamp: Date.now(),
      durationMs,
      status,
    });
  }

  pipelineStart(): void {
    this.pipelineStartedAt = Date.now();
    this.markTimeline("Pipeline Started", "started");
    this.recordLog("info", "PIPELINE", "Pipeline started");
  }

  pipelineComplete(): void {
    this.markTimeline("Completed", "completed", Date.now() - this.pipelineStartedAt);
    this.recordLog("info", "PIPELINE", "Pipeline completed");
  }

  setLastSnapshot(snapshotId: string): void {
    this.lastSnapshotId = snapshotId;
  }

  recordFailure(input: {
    layer: ObservabilityLayerId;
    category: ErrorCategoryId;
    message: string;
    stackTrace?: string;
  }): void {
    this.failure = {
      layer: input.layer,
      category: input.category,
      message: maskSecrets(input.message),
      stack: input.stackTrace ? maskSecrets(input.stackTrace) : undefined,
    };
    this.markTimeline(this.context.currentStage, "failed");
    const layerKey = (Object.entries(ObservabilityLayer).find(([, v]) => v === input.layer)?.[0] ??
      "PIPELINE") as keyof typeof ObservabilityLayer;
    this.recordLog("fatal", layerKey, input.message);
  }

  buildMetrics(performance?: Partial<PerformanceMetrics>): DiagnosticMetrics {
    const stageDurations: Record<string, number> = {};
    for (const entry of this.timeline) {
      if (entry.durationMs !== undefined) {
        stageDurations[entry.stage] = entry.durationMs;
      }
    }
    const lastRender = this.renders.at(-1);
    return {
      pipelineDurationMs: Date.now() - this.pipelineStartedAt,
      stageDurations,
      retryCount: this.retries.length,
      validationCount: this.validations.length,
      mutationCount: this.mutations.length,
      cacheHitRate: performance?.cacheHitRate ?? 0,
      providerLatencyMs: lastRender?.generationTimeMs ?? 0,
      memoryUsageMB: performance?.memoryPeakMB ?? 0,
      cpuUsagePercent: 0,
    };
  }

  summarizeRenderIntent(intent: RenderIntent): string {
    return maskSecrets(
      `scene=${intent.scene.environment}; camera=${intent.camera.lens}mm; lighting=${intent.lighting.preset}; mood=${intent.mood}`,
    );
  }

  buildExplainabilityReport(
    renderIntent?: RenderIntent,
    performance?: Partial<PerformanceMetrics>,
  ): ExplainabilityReport {
    return {
      context: { ...this.context },
      decisions: [...this.decisions],
      mutations: [...this.mutations],
      validations: this.isDebugMode ? [...this.validations] : this.validations.filter((v) => !v.passed),
      retries: [...this.retries],
      constraints: [...this.constraints],
      activeAgents: [...this.activeAgents],
      renderIntentSummary: renderIntent ? this.summarizeRenderIntent(renderIntent) : "",
      timeline: [...this.timeline],
      metrics: this.buildMetrics(performance),
    };
  }

  buildFailureReport(): FailureReport {
    if (!this.failure) {
      throw new ObservabilityError("No failure recorded — cannot build FailureReport");
    }
    return {
      context: { ...this.context },
      errorCategory: this.failure.category,
      message: this.failure.message,
      failedAt: this.failure.layer,
      activeStage: this.context.currentStage,
      lastSnapshotId: this.lastSnapshotId,
      timeline: [...this.timeline],
      stackTrace: this.isDebugMode ? this.failure.stack : undefined,
    };
  }

  /** Production mode strips verbose traces */
  exportForStorage(): {
    context: DiagnosticContext;
    explainability: ExplainabilityReport;
    logs: DiagnosticRecord[];
    debugArtifacts?: {
      decisions: DecisionTrace[];
      renders: RenderDiagnostic[];
      logs: DiagnosticRecord[];
    };
  } {
    const explainability = this.buildExplainabilityReport();
    const productionLogs = this.logs.filter(
      (l) => l.level === "warning" || l.level === "error" || l.level === "fatal" || l.level === "info",
    );
    const base = {
      context: this.context,
      explainability,
      logs: this.isDebugMode ? [...this.logs] : productionLogs,
    };
    if (!this.isDebugMode) return base;
    return {
      ...base,
      debugArtifacts: {
        decisions: [...this.decisions],
        renders: [...this.renders],
        logs: [...this.logs],
      },
    };
  }
}

/** Subscribe ObservabilityEngine to EventBus for automatic timeline updates */
export function attachObservabilityToEventBus(
  engine: ObservabilityEngine,
  eventBus: EventBus,
): () => void {
  const unsubs: Array<() => void> = [];

  const bind = (type: string, fn: (e: DesignEvent) => void) => {
    unsubs.push(eventBus.subscribe(type, fn));
  };

  bind(DesignEventType.PipelineStarted, () => engine.pipelineStart());
  bind(DesignEventType.PipelineCompleted, () => engine.pipelineComplete());
  bind(DesignEventType.StageStarted, (e) => {
    engine.bindContext({ currentStage: e.metadata.stage, blueprintRevision: e.revision });
    engine.markTimeline(String(e.metadata.stage), "started");
  });
  bind(DesignEventType.StageCompleted, (e) => {
    engine.markTimeline(String(e.metadata.stage), "completed");
  });
  bind(DesignEventType.StageFailed, (e) => {
    engine.recordFailure({
      layer: ObservabilityLayer.LIFECYCLE,
      category: ErrorCategory.PIPELINE,
      message: String(e.payload.detail ?? "Stage failed"),
    });
  });
  bind(DesignEventType.RetryStarted, (e) => {
    engine.recordRetry({
      reason: String(e.payload.reason ?? "retry"),
      strategy: String(e.payload.strategy ?? "default"),
      affectedSections: [],
      result: "skipped",
      attempt: Number(e.payload.attempt ?? 1),
    });
  });
  bind(DesignEventType.MutationApplied, (e) => {
    engine.recordMutation({
      section: e.payload.section as BlueprintSection,
      producer: e.metadata.producer,
      oldRevision: e.revision - 1,
      newRevision: e.revision,
      reason: String(e.payload.reason ?? "mutation"),
    });
  });
  bind(DesignEventType.ValidationFailed, (e) => {
    engine.recordValidation({
      ruleId: String(e.payload.code ?? "validation"),
      passed: false,
      severity: "error",
      message: String(e.payload.message ?? "Validation failed"),
    });
  });
  bind(DesignEventType.PipelineFailed, (e) => {
    engine.recordFailure({
      layer: ObservabilityLayer.PIPELINE,
      category: ErrorCategory.PIPELINE,
      message: String(e.payload.message ?? "Pipeline failed"),
    });
  });

  return () => {
    for (const unsub of unsubs) unsub();
  };
}

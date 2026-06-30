/**
 * Chapter 6.19 — Pipeline Observability & Monitoring Stage types
 * Distinct from Ch 3.15 ObservabilityEngine and ExplainabilityReport.
 */
import type { PlannedFinalProject } from "./pipeline-completion-stage-types";

export const PipelineObservabilityStage = {
  INPUT_ASSEMBLY: "input_assembly",
  TRACE_INITIALIZATION: "trace_initialization",
  INFRASTRUCTURE_MONITORING: "infrastructure_monitoring",
  PIPELINE_EVENT_COLLECTION: "pipeline_event_collection",
  AGENT_TELEMETRY: "agent_telemetry",
  PERFORMANCE_METRICS: "performance_metrics",
  RETRY_ANALYTICS: "retry_analytics",
  KNOWLEDGE_ANALYTICS: "knowledge_analytics",
  COMMERCIAL_ANALYTICS: "commercial_analytics",
  ERROR_MONITORING: "error_monitoring",
  HEALTH_MONITORING: "health_monitoring",
  AUDIT_TRAIL: "audit_trail",
  ALERT_EVALUATION: "alert_evaluation",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type PipelineObservabilityStageId =
  (typeof PipelineObservabilityStage)[keyof typeof PipelineObservabilityStage];

export const PipelineObservabilityLayer = {
  INFRASTRUCTURE: "infrastructure",
  PIPELINE: "pipeline",
  AGENT: "agent",
  KNOWLEDGE: "knowledge",
  COMMERCIAL: "commercial",
} as const;

export type PipelineObservabilityLayerId =
  (typeof PipelineObservabilityLayer)[keyof typeof PipelineObservabilityLayer];

export const PipelineEventType = {
  PIPELINE_STARTED: "PipelineStarted",
  KNOWLEDGE_LOADED: "KnowledgeLoaded",
  STORY_COMPLETED: "StoryCompleted",
  SCENE_COMPLETED: "SceneCompleted",
  COMPOSITION_COMPLETED: "CompositionCompleted",
  RENDERING_STARTED: "RenderingStarted",
  RENDERING_FINISHED: "RenderingFinished",
  VISION_VALIDATED: "VisionValidated",
  COMMERCIAL_APPROVED: "CommercialApproved",
  PIPELINE_COMPLETED: "PipelineCompleted",
} as const;

export type PipelineEventTypeId = (typeof PipelineEventType)[keyof typeof PipelineEventType];

export const ObservabilityErrorCategory = {
  INFRASTRUCTURE: "Infrastructure Error",
  KNOWLEDGE: "Knowledge Error",
  AGENT: "Agent Error",
  RENDER: "Render Error",
  VALIDATION: "Validation Error",
  LEARNING: "Learning Error",
} as const;

export type ObservabilityErrorCategoryId =
  (typeof ObservabilityErrorCategory)[keyof typeof ObservabilityErrorCategory];

export const ComponentHealthStatus = {
  HEALTHY: "Healthy",
  WARNING: "Warning",
  CRITICAL: "Critical",
} as const;

export type ComponentHealthStatusId =
  (typeof ComponentHealthStatus)[keyof typeof ComponentHealthStatus];

/** Ch 6.19 PlannedPipelineEvent — pipeline event journal entry */
export type PlannedPipelineEvent = {
  type: string;
  timestamp: number;
  stage: string;
  traceId: string;
  metadata?: Record<string, string | number | boolean>;
};

/** Ch 6.19 PlannedAgentTelemetry — per-agent measurements */
export type PlannedAgentTelemetry = {
  agentId: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  knowledgeLookups: number;
  conflicts: number;
  contextBytes: number;
  retryCount: number;
};

/** Ch 6.19 PlannedPerformanceMetrics — platform performance snapshot */
export type PlannedPerformanceMetrics = {
  totalGenerationMs: number;
  stageDurations: Record<string, number>;
  renderProviderLoad: number;
  retrievalMs: number;
  validationMs: number;
  successfulProjects: number;
  failedProjects: number;
};

/** Ch 6.19 PlannedRetryAnalytics — retry analysis */
export type PlannedRetryAnalytics = {
  initiatingAgent: string;
  reason: string;
  attempts: number;
  fixed: boolean;
  qualityImpact: number;
};

/** Ch 6.19 PlannedKnowledgeAnalytics — knowledge usage stats */
export type PlannedKnowledgeAnalytics = {
  topPatterns: string[];
  unusedRules: string[];
  staleKnowledge: string[];
  effectiveAntiPatterns: string[];
  retrievalMs: number;
};

/** Ch 6.19 PlannedCommercialAnalytics — commercial outcome stats */
export type PlannedCommercialAnalytics = {
  avgCommercialScore: number;
  avgVisionScore: number;
  avgCtrPrediction: number;
  patternSuccessRate: number;
  storyEffectiveness: number;
  marketplaceStrategyScore: number;
};

/** Ch 6.19 PlannedObservabilityError — classified error record */
export type PlannedObservabilityError = {
  category: string;
  message: string;
  stage: string;
  timestamp: number;
  traceId: string;
};

/** Ch 6.19 PlannedDistributedTrace — generation trace chain */
export type PlannedDistributedTrace = {
  traceId: string;
  pipelineId: string;
  storyId: string;
  sceneId: string;
  renderId: string;
  validationId: string;
  learningId: string;
};

/** Ch 6.19 PlannedComponentHealth — health score per component */
export type PlannedComponentHealth = {
  component: string;
  status: string;
  score: number;
  reason?: string;
};

/** Ch 6.19 PlannedObservabilityAlert — operator alert */
export type PlannedObservabilityAlert = {
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  component: string;
};

/** Ch 6.19 PlannedAuditTrailEntry — audit log entry */
export type PlannedAuditTrailEntry = {
  timestamp: number;
  actor: string;
  action: string;
  detail: string;
  traceId: string;
};

/** Ch 6.19 PlannedObservabilityReport — final observability output */
export type PlannedObservabilityReport = {
  traceId: string;
  projectId: string;
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
};

export type PipelineObservabilityInput = {
  finalProject: PlannedFinalProject;
  generationTimeMs: number;
};

export type PipelineObservabilitySection = {
  plannedReport: PlannedObservabilityReport;
  distributedTrace: PlannedDistributedTrace;
  stagesCompleted: PipelineObservabilityStageId[];
  confidence: number;
};

export type PipelineObservabilityStageViolation = {
  code: PipelineObservabilityStageFailureCode;
  message: string;
  stage?: PipelineObservabilityStageId;
};

export type PipelineObservabilityReport = {
  valid: boolean;
  violations: PipelineObservabilityStageViolation[];
  section?: PipelineObservabilitySection;
  stagesCompleted: PipelineObservabilityStageId[];
  durationMs: number;
};

export type PipelineObservabilityContext = {
  missingFinalProject?: boolean;
  injectMissingTelemetry?: boolean;
  injectHighRetryRate?: boolean;
  injectProviderCritical?: boolean;
  injectMissingTrace?: boolean;
  marketplace?: string;
  providerId?: string;
};

export type PipelineObservabilitySystemReport = {
  valid: boolean;
  violations: PipelineObservabilityStageViolation[];
  goldenRuleSatisfied: boolean;
  eventsRecorded: boolean;
  telemetryCaptured: boolean;
  metricsUpdated: boolean;
  traceCreated: boolean;
  auditTrailComplete: boolean;
  downstreamReady: boolean;
};

export type PipelineObservabilityStageFailureCode =
  | "MISSING_FINAL_PROJECT"
  | "MISSING_TRACE"
  | "MISSING_TELEMETRY"
  | "MISSING_EVENTS"
  | "MISSING_METRICS"
  | "MISSING_AUDIT_TRAIL"
  | "BLACK_BOX_PIPELINE"
  | "UNEXPLAINABLE_RETRY";

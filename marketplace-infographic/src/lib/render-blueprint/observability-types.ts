/**
 * Chapter 3.15 — Observability & Diagnostics types
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { BlueprintSection } from "./types";

export const DiagnosticLevel = {
  TRACE: "trace",
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  FATAL: "fatal",
} as const;

export type DiagnosticLevelId = (typeof DiagnosticLevel)[keyof typeof DiagnosticLevel];

export const ErrorCategory = {
  VALIDATION: "validation",
  RENDER: "render",
  NETWORK: "network",
  PROVIDER: "provider",
  PIPELINE: "pipeline",
  RECOVERY: "recovery",
  UNKNOWN: "unknown",
} as const;

export type ErrorCategoryId = (typeof ErrorCategory)[keyof typeof ErrorCategory];

export const ObservabilityLayer = {
  PIPELINE: "pipeline",
  LIFECYCLE: "lifecycle",
  AGENTS: "agents",
  MUTATIONS: "mutations",
  VALIDATION: "validation",
  RENDER: "render",
  VISION: "vision",
  STORAGE: "storage",
} as const;

export type ObservabilityLayerId = (typeof ObservabilityLayer)[keyof typeof ObservabilityLayer];

export type DiagnosticContext = {
  pipelineId: string;
  blueprintRevision: number;
  currentStage: BlueprintLifecycle;
  sessionId: string;
};

export type DecisionTrace = {
  agentId: string;
  timestamp: number;
  inputHash: string;
  outputHash: string;
  confidence: number;
  reason: string;
  context: DiagnosticContext;
};

export type MutationTrace = {
  section: BlueprintSection;
  producer: string;
  oldRevision: number;
  newRevision: number;
  reason: string;
  timestamp: number;
  context: DiagnosticContext;
};

export type ValidationTrace = {
  ruleId: string;
  passed: boolean;
  severity: "fatal" | "error" | "warning" | "info";
  message: string;
  fix?: string;
  timestamp: number;
  context: DiagnosticContext;
};

export type AgentDiagnostic = {
  agentId: string;
  durationMs: number;
  inputHash: string;
  outputHash: string;
  confidence: number;
  retryCount: number;
  recommendations: string[];
  context: DiagnosticContext;
};

export type RenderDiagnostic = {
  provider: string;
  model: string;
  adapterVersion: string;
  promptLength: number;
  negativePromptLength: number;
  seed: number;
  generationTimeMs: number;
  providerResponseCode?: number;
  /** Full prompt stored only in debug mode */
  prompt?: string;
  negativePrompt?: string;
  context: DiagnosticContext;
};

export type CompositeDiagnostic = {
  backgroundSource: string;
  productSource: string;
  shadowParams: Record<string, number | string | boolean>;
  lightingParams: Record<string, number | string | boolean>;
  reflectionParams: Record<string, number | string | boolean>;
  integrationQuality: number;
  context: DiagnosticContext;
};

export type VisionDiagnostic = {
  realismScore: number;
  compositionScore: number;
  whitespaceScore: number;
  overlayScore: number;
  issues: Array<{ code: string; message: string; explanation: string }>;
  context: DiagnosticContext;
};

export type RetryDiagnostic = {
  reason: string;
  strategy: string;
  affectedSections: BlueprintSection[];
  result: "success" | "failure" | "skipped";
  attempt: number;
  timestamp: number;
  context: DiagnosticContext;
};

export type TimelineEntry = {
  stage: string;
  timestamp: number;
  durationMs?: number;
  status: "started" | "completed" | "failed" | "skipped";
};

export type DiagnosticMetrics = {
  pipelineDurationMs: number;
  stageDurations: Record<string, number>;
  retryCount: number;
  validationCount: number;
  mutationCount: number;
  cacheHitRate: number;
  providerLatencyMs: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
};

export type ExplainabilityReport = {
  context: DiagnosticContext;
  decisions: DecisionTrace[];
  mutations: MutationTrace[];
  validations: ValidationTrace[];
  retries: RetryDiagnostic[];
  constraints: string[];
  activeAgents: string[];
  renderIntentSummary: string;
  timeline: TimelineEntry[];
  metrics: DiagnosticMetrics;
};

export type FailureReport = {
  context: DiagnosticContext;
  errorCategory: ErrorCategoryId;
  message: string;
  failedAt: ObservabilityLayerId;
  activeStage: BlueprintLifecycle;
  lastSnapshotId?: string;
  timeline: TimelineEntry[];
  stackTrace?: string;
};

export type DiagnosticRecord = {
  level: DiagnosticLevelId;
  layer: ObservabilityLayerId;
  message: string;
  timestamp: number;
  context: DiagnosticContext;
  data?: Record<string, string | number | boolean | null>;
};

export type ObservabilityMode = "debug" | "production";

export type ObservabilityOptions = {
  mode?: ObservabilityMode;
  sessionId?: string;
  pipelineId?: string;
};

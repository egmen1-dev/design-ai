/**
 * Chapter 3.14 — Performance Model types
 */
import type { BlueprintSection } from "./types";

export const CacheLevel = {
  MEMORY: "memory",
  PIPELINE: "pipeline",
  DISK: "disk",
  DISTRIBUTED: "distributed",
} as const;

export type CacheLevelId = (typeof CacheLevel)[keyof typeof CacheLevel];

export const PerformanceLayer = {
  USER: "user",
  PIPELINE: "pipeline",
  DECISION: "decision",
  RENDER: "render",
  STORAGE: "storage",
} as const;

export type PerformanceLayerId = (typeof PerformanceLayer)[keyof typeof PerformanceLayer];

export type PerformanceLimits = {
  maxMemoryMB: number;
  maxCpuTime: number;
  maxParallelAgents: number;
  maxRetries: number;
};

export const DEFAULT_PERFORMANCE_LIMITS: PerformanceLimits = {
  maxMemoryMB: 512,
  maxCpuTime: 120_000,
  maxParallelAgents: 4,
  maxRetries: 3,
};

export type StageTimeBudgetMs = {
  productAnalysis: number;
  story: number;
  scene: number;
  composition: number;
  validation: number;
  promptCompilation: number;
  renderAdapter: number;
  composite: number;
  visionQa: number;
};

export const DEFAULT_STAGE_TIME_BUDGET_MS: StageTimeBudgetMs = {
  productAnalysis: 100,
  story: 2_000,
  scene: 200,
  composition: 150,
  validation: 100,
  promptCompilation: 30,
  renderAdapter: 50,
  composite: 200,
  visionQa: 500,
};

export type AgentCacheKey = {
  revision: number;
  agentVersion: string;
  inputHash: string;
};

export type CacheEntry<T> = {
  key: string;
  value: T;
  level: CacheLevelId;
  createdAt: number;
  hits: number;
};

export type StageTiming = {
  stage: string;
  durationMs: number;
  waitMs: number;
  memoryMB: number;
  layer: PerformanceLayerId;
  budgetMs?: number;
  overBudget: boolean;
};

export type BottleneckReport = {
  stage: string;
  durationMs: number;
  shareOfTotal: number;
  layer: PerformanceLayerId;
};

export type PerformanceMetrics = {
  totalTimeMs: number;
  agentTimeMs: number;
  renderTimeMs: number;
  compositeTimeMs: number;
  visionTimeMs: number;
  retryCount: number;
  cacheHitRate: number;
  memoryPeakMB: number;
  stageTimings: StageTiming[];
  bottlenecks: BottleneckReport[];
};

export type IncrementalRebuildPlan = {
  changedSection: BlueprintSection;
  stagesToRun: string[];
  sectionsToSkip: BlueprintSection[];
  invalidatedSections: BlueprintSection[];
};

export type PipelineContextId = string;

export type PipelineQueueJob<T> = {
  id: string;
  contextId: PipelineContextId;
  payload: T;
  enqueuedAt: number;
};

export type LazyGateResult = {
  run: boolean;
  reason: string;
};

export type AgentCacheLookup<T> = {
  hit: boolean;
  value?: T;
  level?: CacheLevelId;
};

export type ParallelExecutionGroup = {
  id: string;
  agents: string[];
  sequential: boolean;
};

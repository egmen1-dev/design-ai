/**
 * Chapter 3.14 — Performance Model engine
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import { DEPENDENCY_CHILDREN } from "./lifecycle";
import { hashSection } from "./section-hash";
import { buildAgentCacheKey, PerformanceCache } from "./performance-cache";
import {
  DEFAULT_PERFORMANCE_LIMITS,
  PerformanceLayer,
  type BottleneckReport,
  type IncrementalRebuildPlan,
  type LazyGateResult,
  type PerformanceLimits,
  type PerformanceMetrics,
  type StageTiming,
} from "./performance-types";
import { STAGE_TIME_BUDGET_MS } from "./performance-stages";

export {
  CacheLevel,
  PerformanceLayer,
  DEFAULT_PERFORMANCE_LIMITS,
  DEFAULT_STAGE_TIME_BUDGET_MS,
  type PerformanceLimits,
  type PerformanceMetrics,
  type StageTiming,
  type BottleneckReport,
  type IncrementalRebuildPlan,
  type AgentCacheKey,
  type CacheEntry,
  type LazyGateResult,
  type PipelineContextId,
  type PipelineQueueJob,
  type ParallelExecutionGroup,
} from "./performance-types";

export {
  buildAgentCacheKey,
  hashAgentInput,
  PerformanceCache,
} from "./performance-cache";

export {
  STAGE_TIME_BUDGET_MS,
  PERFORMANCE_PARALLEL_GROUPS,
  PERFORMANCE_SEQUENTIAL_CHAIN,
  STORY_SCENE_PHOTOGRAPHY_CHAIN,
  stageBudgetFor,
  isOverBudget,
} from "./performance-stages";

export { PipelineQueue, PipelineContextPool } from "./pipeline-queue";

const SECTION_TO_STAGE: Partial<Record<BlueprintSection, string>> = {
  product: "product-analysis",
  story: "story",
  scene: "scene",
  photography: "photography",
  camera: "camera",
  lighting: "lighting",
  materials: "materials",
  composition: "composition",
  constraints: "constraints",
  validation: "validation",
  render: "render-adapter",
};

const ALL_MANAGED_SECTIONS = Object.keys(DEPENDENCY_CHILDREN) as BlueprintSection[];

/** Incremental rebuild — only dependent stages after a section change */
export function planIncrementalRebuild(changedSection: BlueprintSection): IncrementalRebuildPlan {
  const managed = changedSection in DEPENDENCY_CHILDREN ? changedSection : null;
  const invalidated = managed
    ? ([changedSection, ...DEPENDENCY_CHILDREN[managed as keyof typeof DEPENDENCY_CHILDREN]] as BlueprintSection[])
    : [changedSection];

  const stagesToRun = [
    SECTION_TO_STAGE[changedSection],
    ...invalidated
      .filter((s) => s !== changedSection)
      .map((s) => SECTION_TO_STAGE[s])
      .filter((s): s is string => Boolean(s)),
  ].filter((s, i, arr) => s && arr.indexOf(s) === i);

  const sectionsToSkip = ALL_MANAGED_SECTIONS.filter((s) => !invalidated.includes(s));

  return {
    changedSection,
    stagesToRun,
    sectionsToSkip,
    invalidatedSections: invalidated,
  };
}

/** Zero-copy rule — reuse unchanged section references */
export function reuseUnchangedSections(
  previous: RenderBlueprint,
  next: RenderBlueprint,
  changedSections: BlueprintSection[],
): RenderBlueprint {
  const changed = new Set(changedSections);
  const out: RenderBlueprint = { ...next };
  for (const section of ALL_MANAGED_SECTIONS) {
    if (changed.has(section)) continue;
    if (hashSection(previous, section) === hashSection(next, section)) {
      switch (section) {
        case "creative":
          out.creative = previous.creative;
          break;
        case "story":
          out.story = previous.story;
          break;
        case "product":
          out.product = previous.product;
          break;
        case "scene":
          out.scene = previous.scene;
          break;
        case "photography":
          out.photography = previous.photography;
          break;
        case "camera":
          out.camera = previous.camera;
          break;
        case "lighting":
          out.lighting = previous.lighting;
          break;
        case "materials":
          out.materials = previous.materials;
          break;
        case "composition":
          out.composition = previous.composition;
          break;
        case "background":
          out.background = previous.background;
          break;
        case "constraints":
          out.constraints = previous.constraints;
          break;
        case "validation":
          out.validation = previous.validation;
          break;
      }
    }
  }
  return out;
}

/** Lazy evaluation — skip heavy stages when upstream failed */
export function shouldRunLazyStage(
  stage: string,
  context: { renderSucceeded?: boolean; validationPassed?: boolean },
): LazyGateResult {
  if (stage === "commercial-photographer" && context.renderSucceeded === false) {
    return { run: false, reason: "Render failed — Commercial Photographer skipped" };
  }
  if (stage === "vision-qa" && context.renderSucceeded === false) {
    return { run: false, reason: "Render failed — Vision QA skipped" };
  }
  if (stage === "quality-metrics" && context.validationPassed === false) {
    return { run: false, reason: "Validation failed — Quality Metrics skipped" };
  }
  return { run: true, reason: "Stage allowed" };
}

export function assertAsyncOperation(label: string, fn: () => unknown): void {
  const result = fn();
  if (result instanceof Promise) return;
  throw new Error(`Blocking operation forbidden for ${label} — use async API`);
}

export function assertWithinLimits(
  limits: PerformanceLimits,
  usage: { memoryMB: number; cpuTimeMs: number; parallelAgents: number; retries: number },
): void {
  if (usage.memoryMB > limits.maxMemoryMB) {
    throw new Error(`Memory limit exceeded: ${usage.memoryMB}MB > ${limits.maxMemoryMB}MB`);
  }
  if (usage.cpuTimeMs > limits.maxCpuTime) {
    throw new Error(`CPU time limit exceeded: ${usage.cpuTimeMs}ms > ${limits.maxCpuTime}ms`);
  }
  if (usage.parallelAgents > limits.maxParallelAgents) {
    throw new Error(
      `Parallel agent limit exceeded: ${usage.parallelAgents} > ${limits.maxParallelAgents}`,
    );
  }
  if (usage.retries > limits.maxRetries) {
    throw new Error(`Retry limit exceeded: ${usage.retries} > ${limits.maxRetries}`);
  }
}

export class PerformanceTracker {
  private readonly timings: StageTiming[] = [];
  private retryCount = 0;
  private memoryPeakMB = 0;
  private cacheHitRate = 0;
  private readonly startedAt = Date.now();

  recordStage(input: Omit<StageTiming, "overBudget"> & { budgetKey?: keyof typeof STAGE_TIME_BUDGET_MS }): void {
    const budgetMs = input.budgetKey ? STAGE_TIME_BUDGET_MS[input.budgetKey] : input.budgetMs;
    this.timings.push({
      stage: input.stage,
      durationMs: input.durationMs,
      waitMs: input.waitMs,
      memoryMB: input.memoryMB,
      layer: input.layer,
      budgetMs,
      overBudget: budgetMs !== undefined ? input.durationMs > budgetMs : false,
    });
    this.memoryPeakMB = Math.max(this.memoryPeakMB, input.memoryMB);
  }

  recordRetry(): void {
    this.retryCount += 1;
  }

  setCacheHitRate(rate: number): void {
    this.cacheHitRate = rate;
  }

  identifyBottlenecks(): BottleneckReport[] {
    const total = this.timings.reduce((sum, t) => sum + t.durationMs, 0) || 1;
    return [...this.timings]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 5)
      .map((t) => ({
        stage: t.stage,
        durationMs: t.durationMs,
        shareOfTotal: t.durationMs / total,
        layer: t.layer,
      }));
  }

  finalize(): PerformanceMetrics {
    const agentTimeMs = this.timings
      .filter((t) => t.layer === PerformanceLayer.DECISION)
      .reduce((s, t) => s + t.durationMs, 0);
    const renderTimeMs = this.timings
      .filter((t) => t.stage.includes("render") || t.layer === PerformanceLayer.RENDER)
      .reduce((s, t) => s + t.durationMs, 0);
    const compositeTimeMs = this.timings
      .filter((t) => t.stage === "composite")
      .reduce((s, t) => s + t.durationMs, 0);
    const visionTimeMs = this.timings
      .filter((t) => t.stage.includes("vision"))
      .reduce((s, t) => s + t.durationMs, 0);

    return {
      totalTimeMs: Date.now() - this.startedAt,
      agentTimeMs,
      renderTimeMs,
      compositeTimeMs,
      visionTimeMs,
      retryCount: this.retryCount,
      cacheHitRate: this.cacheHitRate,
      memoryPeakMB: this.memoryPeakMB,
      stageTimings: [...this.timings],
      bottlenecks: this.identifyBottlenecks(),
    };
  }
}

/** Wrap agent execution with cache lookup */
export async function runWithAgentCache<T>(
  cache: PerformanceCache<T>,
  keyInput: { revision: number; agentVersion: string; inputHash: string },
  execute: () => Promise<T>,
): Promise<{ value: T; cached: boolean }> {
  const key = buildAgentCacheKey(keyInput);
  const hit = cache.lookup(key);
  if (hit.hit && hit.value !== undefined) {
    return { value: hit.value, cached: true };
  }
  const value = await execute();
  cache.set(key, value);
  return { value, cached: false };
}

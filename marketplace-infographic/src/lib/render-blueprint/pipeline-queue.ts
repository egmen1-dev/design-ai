/**
 * Chapter 3.14 — Pipeline queue with isolated contexts
 */
import { randomUUID } from "crypto";
import { PerformanceCache } from "./performance-cache";
import type { PipelineContextId, PipelineQueueJob } from "./performance-types";

export type PipelineContext = {
  id: PipelineContextId;
  createdAt: number;
  cache: PerformanceCache;
};

export class PipelineContextPool {
  private readonly contexts = new Map<PipelineContextId, PipelineContext>();

  create(): PipelineContext {
    const ctx: PipelineContext = {
      id: randomUUID(),
      createdAt: Date.now(),
      cache: new PerformanceCache(),
    };
    this.contexts.set(ctx.id, ctx);
    return ctx;
  }

  get(id: PipelineContextId): PipelineContext | undefined {
    return this.contexts.get(id);
  }

  release(id: PipelineContextId): void {
    const ctx = this.contexts.get(id);
    if (ctx) {
      ctx.cache.clearPipeline();
      this.contexts.delete(id);
    }
  }

  size(): number {
    return this.contexts.size;
  }
}

export class PipelineQueue<T> {
  private readonly jobs: PipelineQueueJob<T>[] = [];
  private running = 0;

  constructor(private readonly maxConcurrent: number = 4) {}

  enqueue(contextId: PipelineContextId, payload: T): PipelineQueueJob<T> {
    const job: PipelineQueueJob<T> = {
      id: randomUUID(),
      contextId,
      payload,
      enqueuedAt: Date.now(),
    };
    this.jobs.push(job);
    return job;
  }

  /** Non-blocking dequeue — returns undefined when at capacity */
  dequeue(): PipelineQueueJob<T> | undefined {
    if (this.running >= this.maxConcurrent) return undefined;
    const job = this.jobs.shift();
    if (job) this.running += 1;
    return job;
  }

  complete(): void {
    if (this.running > 0) this.running -= 1;
  }

  get pending(): number {
    return this.jobs.length;
  }

  get active(): number {
    return this.running;
  }
}

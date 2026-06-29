/**
 * Chapter 3.14 — Multi-level agent cache
 * Key: Blueprint revision + Agent version + Input hash
 */
import { createHash } from "crypto";
import type { AgentCacheKey, AgentCacheLookup, CacheEntry, CacheLevelId } from "./performance-types";
import { CacheLevel } from "./performance-types";

export function buildAgentCacheKey(input: AgentCacheKey): string {
  const raw = `${input.revision}:${input.agentVersion}:${input.inputHash}`;
  return createHash("sha256").update(raw).digest("hex");
}

export function hashAgentInput(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input ?? null)).digest("hex");
}

type CacheStore = Map<string, CacheEntry<unknown>>;

export class PerformanceCache<T = unknown> {
  private readonly memory: CacheStore = new Map();
  private readonly pipeline: CacheStore = new Map();
  private readonly disk: CacheStore = new Map();
  private readonly distributed: CacheStore = new Map();
  private hits = 0;
  private misses = 0;

  get cacheHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  lookup(key: string, levels: CacheLevelId[] = [
    CacheLevel.MEMORY,
    CacheLevel.PIPELINE,
    CacheLevel.DISK,
    CacheLevel.DISTRIBUTED,
  ]): AgentCacheLookup<T> {
    for (const level of levels) {
      const store = this.storeFor(level);
      const entry = store.get(key);
      if (entry) {
        entry.hits += 1;
        this.hits += 1;
        return { hit: true, value: entry.value as T, level };
      }
    }
    this.misses += 1;
    return { hit: false };
  }

  set(key: string, value: T, level: CacheLevelId = CacheLevel.MEMORY): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      level,
      createdAt: Date.now(),
      hits: 0,
    };
    this.storeFor(level).set(key, entry as CacheEntry<unknown>);
    if (level === CacheLevel.MEMORY) {
      this.pipeline.set(key, entry as CacheEntry<unknown>);
    }
  }

  /** Pipeline cache cleared after generation completes */
  clearPipeline(): void {
    this.pipeline.clear();
    this.memory.clear();
  }

  clearAll(): void {
    this.memory.clear();
    this.pipeline.clear();
    this.disk.clear();
    this.distributed.clear();
    this.hits = 0;
    this.misses = 0;
  }

  promoteToDisk(key: string): boolean {
    const entry = this.pipeline.get(key) ?? this.memory.get(key);
    if (!entry) return false;
    this.disk.set(key, { ...entry, level: CacheLevel.DISK });
    return true;
  }

  private storeFor(level: CacheLevelId): CacheStore {
    switch (level) {
      case CacheLevel.MEMORY:
        return this.memory;
      case CacheLevel.PIPELINE:
        return this.pipeline;
      case CacheLevel.DISK:
        return this.disk;
      case CacheLevel.DISTRIBUTED:
        return this.distributed;
    }
  }
}

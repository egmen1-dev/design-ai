import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";
import type { KernelEvents } from "./KernelEvents";
import type { KernelMetrics } from "./KernelMetrics";
import type { KernelRegistry } from "./KernelRegistry";
import type { KernelExecuteInput, KernelExecuteResult } from "./types";

/**
 * Execution service — runs platforms by ID only.
 * Kernel never knows Commercial, Creative, Visual, etc.
 */
export class KernelRuntime {
  constructor(
    private readonly registry: KernelRegistry,
    private readonly events: KernelEvents,
    private readonly metrics: KernelMetrics,
  ) {}

  async execute(input: KernelExecuteInput): Promise<KernelExecuteResult> {
    const start = performance.now();
    this.events.emit("kernel:execute:start", { platformId: input.platformId });
    this.metrics.increment("executions");

    const platform = this.registry.resolvePlatform(input.platformId);
    const result = await platform.execute({ state: input.state });
    const durationMs = performance.now() - start;

    this.metrics.recordTiming("platform.execute", durationMs);
    this.events.emit("kernel:execute:complete", {
      platformId: input.platformId,
      durationMs,
    });

    return Object.freeze({
      state: result.state,
      platformId: input.platformId,
      durationMs,
    });
  }
}

export type { IProjectState };

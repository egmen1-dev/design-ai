import type { KernelConfiguration } from "./KernelConfiguration";
import type { KernelEvents } from "./KernelEvents";
import type { KernelHealth } from "./KernelHealth";
import type { KernelMetrics } from "./KernelMetrics";
import type { KernelRegistry } from "./KernelRegistry";
import type { KernelPhase } from "./types";

export interface KernelLifecycleHooks {
  onPhase?(phase: KernelPhase): void;
}

/**
 * Lifecycle — startup and shutdown sequences per Part 37.
 */
export class KernelLifecycle {
  constructor(
    private readonly configuration: KernelConfiguration,
    private readonly registry: KernelRegistry,
    private readonly events: KernelEvents,
    private readonly metrics: KernelMetrics,
    private readonly health: KernelHealth,
    private readonly hooks: KernelLifecycleHooks = {},
  ) {}

  async startup(configDir?: string): Promise<void> {
    this.transition("initializing");
    if (configDir) this.configuration.loadFromDirectory(configDir);
    this.transition("ready");
    this.events.emit("kernel:ready");
  }

  async shutdown(): Promise<void> {
    this.transition("shutting_down");
    this.events.emit("kernel:shutdown");
    this.metrics.flush();
    this.events.clear();
    this.transition("stopped");
  }

  private transition(phase: KernelPhase): void {
    this.health.setPhase(phase);
    this.hooks.onPhase?.(phase);
    if (phase === "initializing") this.events.emit("kernel:initialized");
  }
}

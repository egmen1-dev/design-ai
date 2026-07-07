import type { KernelEvents } from "./KernelEvents";
import type { KernelMetrics } from "./KernelMetrics";
import type { KernelPhase, KernelHealthStatus } from "./types";
import type { KernelRegistry } from "./KernelRegistry";

/** Health service — kernel readiness and uptime. */
export class KernelHealth {
  private phase: KernelPhase = "created";
  private readyAt = 0;
  private startedAt = Date.now();

  setPhase(phase: KernelPhase): void {
    this.phase = phase;
    if (phase === "ready") this.readyAt = Date.now();
  }

  getPhase(): KernelPhase {
    return this.phase;
  }

  status(registry: KernelRegistry, events: KernelEvents): KernelHealthStatus {
    return Object.freeze({
      phase: this.phase,
      ready: this.phase === "ready" || this.phase === "executing",
      uptimeMs: Date.now() - this.startedAt,
      platformCount: registry.platformCount(),
      providerCount: registry.providerCount(),
      eventCount: events.count(),
    });
  }
}

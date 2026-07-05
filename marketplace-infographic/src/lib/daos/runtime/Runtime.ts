import type { Kernel } from "@/lib/kernel/Kernel";
import type { DaosEventBus } from "@/lib/daos/events/DaosEventBus";
import { ExecutionEvents } from "./ExecutionEvents";
import { ExecutionGraph } from "./ExecutionGraph";
import { Scheduler } from "./Scheduler";
import { createTaskResult, type TaskResult } from "./TaskResult";
import type { Task } from "./Task";

export interface DaosRuntimeOptions {
  readonly enabled?: boolean;
}

/**
 * Runtime skeleton — orchestrates tasks through Kernel when enabled.
 * Disable to roll back to legacy pipeline (Wave 1).
 */
export class DaosRuntime {
  readonly graph = new ExecutionGraph();
  readonly scheduler = new Scheduler();
  readonly executionEvents: ExecutionEvents;

  private enabled: boolean;

  constructor(
    private readonly kernel: Kernel,
    events: DaosEventBus,
    options: DaosRuntimeOptions = {},
  ) {
    this.executionEvents = new ExecutionEvents(events);
    this.enabled = options.enabled ?? false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable(): void {
    this.enabled = true;
    this.executionEvents.runtimeStart();
  }

  disable(): void {
    this.enabled = false;
    this.scheduler.clear();
    this.executionEvents.runtimeStop();
  }

  async executeTask(task: Task): Promise<TaskResult> {
    if (!this.enabled) {
      throw new Error("DAOS Runtime is disabled — use legacy pipeline");
    }

    this.graph.add(task);
    this.scheduler.enqueue(task);
    this.executionEvents.taskQueued(task.id, task.platformId);

    const start = performance.now();
    this.executionEvents.taskStart(task.id, task.platformId);

    try {
      const result = await this.kernel.execute({
        state: task.state,
        platformId: task.platformId,
      });
      const durationMs = performance.now() - start;
      this.executionEvents.taskComplete(task.id, task.platformId, durationMs);
      return createTaskResult({
        taskId: task.id,
        platformId: task.platformId,
        status: "completed",
        durationMs,
        trace: Object.freeze([Object.freeze({ stateVersion: result.state.version })]),
      });
    } catch (err) {
      const durationMs = performance.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      this.executionEvents.taskFailed(task.id, task.platformId, message);
      return createTaskResult({
        taskId: task.id,
        platformId: task.platformId,
        status: "failed",
        durationMs,
        errors: Object.freeze([message]),
      });
    }
  }
}

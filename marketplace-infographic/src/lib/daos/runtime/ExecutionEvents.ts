import type { DaosEventBus } from "@/lib/daos/events/DaosEventBus";

export const EXECUTION_EVENTS = Object.freeze({
  RUNTIME_START: "runtime:start",
  RUNTIME_STOP: "runtime:stop",
  TASK_QUEUED: "runtime:task:queued",
  TASK_START: "runtime:task:start",
  TASK_COMPLETE: "runtime:task:complete",
  TASK_FAILED: "runtime:task:failed",
} as const);

export type ExecutionEventName = (typeof EXECUTION_EVENTS)[keyof typeof EXECUTION_EVENTS];

export class ExecutionEvents {
  constructor(private readonly bus: DaosEventBus) {}

  runtimeStart(): void {
    this.bus.emit(EXECUTION_EVENTS.RUNTIME_START);
  }

  runtimeStop(): void {
    this.bus.emit(EXECUTION_EVENTS.RUNTIME_STOP);
  }

  taskQueued(taskId: string, platformId: string): void {
    this.bus.emit(EXECUTION_EVENTS.TASK_QUEUED, { taskId, platformId });
  }

  taskStart(taskId: string, platformId: string): void {
    this.bus.emit(EXECUTION_EVENTS.TASK_START, { taskId, platformId });
  }

  taskComplete(taskId: string, platformId: string, durationMs: number): void {
    this.bus.emit(EXECUTION_EVENTS.TASK_COMPLETE, { taskId, platformId, durationMs });
  }

  taskFailed(taskId: string, platformId: string, error: string): void {
    this.bus.emit(EXECUTION_EVENTS.TASK_FAILED, { taskId, platformId, error });
  }
}

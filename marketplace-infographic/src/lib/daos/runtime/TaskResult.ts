import type { TaskStatus } from "./Task";

export interface TaskResult {
  readonly taskId: string;
  readonly platformId: string;
  readonly status: TaskStatus;
  readonly durationMs: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly trace: readonly Readonly<Record<string, unknown>>[];
}

export function createTaskResult(
  patch: Omit<TaskResult, "warnings" | "errors" | "trace"> &
    Partial<Pick<TaskResult, "warnings" | "errors" | "trace">>,
): TaskResult {
  return Object.freeze({
    warnings: Object.freeze([]),
    errors: Object.freeze([]),
    trace: Object.freeze([]),
    ...patch,
    warnings: Object.freeze([...(patch.warnings ?? [])]),
    errors: Object.freeze([...(patch.errors ?? [])]),
    trace: Object.freeze([...(patch.trace ?? [])]),
  });
}

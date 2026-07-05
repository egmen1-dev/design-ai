import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";

export type TaskPriority = "critical" | "high" | "medium" | "low" | "background";

export type TaskStatus =
  | "created"
  | "queued"
  | "running"
  | "validated"
  | "committed"
  | "completed"
  | "failed";

export interface Task {
  readonly id: string;
  readonly platformId: string;
  readonly priority: TaskPriority;
  readonly dependencies: readonly string[];
  readonly timeoutMs: number;
  readonly state: IProjectState;
}

export function createTask(
  patch: Omit<Task, "priority" | "dependencies" | "timeoutMs"> &
    Partial<Pick<Task, "priority" | "dependencies" | "timeoutMs">>,
): Task {
  return Object.freeze({
    priority: "medium",
    dependencies: Object.freeze([]),
    timeoutMs: 120_000,
    ...patch,
    dependencies: Object.freeze([...(patch.dependencies ?? [])]),
  });
}

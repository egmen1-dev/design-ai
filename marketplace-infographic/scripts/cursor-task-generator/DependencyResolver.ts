import type { CursorTask } from "./types";

export function buildDependencyGraph(tasks: CursorTask[]): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  for (const task of tasks) {
    graph[task.id] = [...task.dependsOn];
  }
  return graph;
}

export function resolveTaskStates(tasks: CursorTask[]): CursorTask[] {
  const completed = new Set(
    tasks.filter((t) => t.state === "Completed").map((t) => t.id),
  );
  const taskIds = new Set(tasks.map((t) => t.id));

  return tasks.map((task) => {
    if (task.state === "Completed" || task.state === "Rejected") return task;
    const invalidDeps = task.dependsOn.filter((d) => !taskIds.has(d));
    if (invalidDeps.length) return { ...task, state: "Blocked" as const };
    const blocked = task.dependsOn.some((d) => !completed.has(d));
    if (blocked) return { ...task, state: "Blocked" as const };
    return { ...task, state: "Ready" as const };
  });
}

export function topologicalSort(tasks: CursorTask[]): CursorTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const result: CursorTask[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const task = byId.get(id);
    if (!task) return;
    for (const dep of task.dependsOn) visit(dep);
    result.push(task);
  }

  for (const task of tasks) visit(task.id);
  return result;
}

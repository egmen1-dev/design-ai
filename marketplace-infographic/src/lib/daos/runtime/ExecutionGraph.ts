import type { Task } from "./Task";

export interface ExecutionGraphNode {
  readonly taskId: string;
  readonly platformId: string;
  readonly dependencies: readonly string[];
}

/** DAG of platform tasks for a project run (Wave 1 skeleton). */
export class ExecutionGraph {
  private readonly nodes = new Map<string, ExecutionGraphNode>();

  add(task: Task): void {
    this.nodes.set(
      task.id,
      Object.freeze({
        taskId: task.id,
        platformId: task.platformId,
        dependencies: task.dependencies,
      }),
    );
  }

  get(taskId: string): ExecutionGraphNode | undefined {
    return this.nodes.get(taskId);
  }

  list(): readonly ExecutionGraphNode[] {
    return Object.freeze([...this.nodes.values()]);
  }

  size(): number {
    return this.nodes.size;
  }
}

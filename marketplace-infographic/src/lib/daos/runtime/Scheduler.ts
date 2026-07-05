import type { Task, TaskPriority } from "./Task";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  background: 4,
};

/** Simple priority queue for Wave 1 runtime skeleton. */
export class Scheduler {
  private readonly queue: Task[] = [];

  enqueue(task: Task): void {
    this.queue.push(task);
    this.queue.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  }

  dequeue(): Task | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue.length = 0;
  }
}

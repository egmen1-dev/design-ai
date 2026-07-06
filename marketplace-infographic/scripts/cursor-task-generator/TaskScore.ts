import type { CursorTask, TaskRisk, TaskScore } from "./types";

const RISK_HOURS: Record<TaskRisk, number> = {
  low: 2,
  medium: 4,
  high: 8,
  critical: 12,
};

export function scoreTask(task: Pick<CursorTask, "priority" | "risk" | "files" | "dependsOn">): TaskScore {
  const complexity = Math.min(
    10,
    Math.ceil(task.files.length / 2) + task.dependsOn.length,
  );
  const estimatedHours = RISK_HOURS[task.risk] + task.dependsOn.length * 2;
  const architectureImpact =
    task.priority === "Critical" ? 9 : task.priority === "High" ? 7 : task.priority === "Medium" ? 5 : 3;
  const breakingChange =
    task.priority === "Critical" &&
    (task.files.some((f) => f.includes("handler")) || task.files.some((f) => f.includes("contracts/")));
  const confidence = Math.max(0.5, 1 - task.dependsOn.length * 0.08);

  return {
    complexity,
    risk: task.risk,
    estimatedHours,
    architectureImpact,
    breakingChange,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export function sortTasksByPriority(tasks: CursorTask[]): CursorTask[] {
  const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return [...tasks].sort((a, b) => order[a.priority] - order[b.priority] || a.id.localeCompare(b.id));
}

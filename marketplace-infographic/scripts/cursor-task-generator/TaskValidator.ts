import type { CursorTask } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTask(task: CursorTask): ValidationResult {
  const errors: string[] = [];

  if (!task.architectureRef) errors.push("Missing architecture reference");
  if (!task.files.length) errors.push("No files specified");
  if (!task.acceptance.length) errors.push("No acceptance criteria");
  if (!task.rollback.length) errors.push("No rollback procedure");
  if (task.wave < 1 || task.wave > 20) errors.push(`Invalid wave: ${task.wave}`);

  return { valid: errors.length === 0, errors };
}

export function validateAllTasks(tasks: CursorTask[]): ValidationResult {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const task of tasks) {
    if (ids.has(task.id)) errors.push(`Duplicate task ID: ${task.id}`);
    ids.add(task.id);
    const result = validateTask(task);
    errors.push(...result.errors.map((e) => `${task.id}: ${e}`));
    for (const dep of task.dependsOn) {
      if (!ids.has(dep) && !tasks.some((t) => t.id === dep)) {
        // dependency may appear later in list — checked in second pass
      }
    }
  }

  for (const task of tasks) {
    for (const dep of task.dependsOn) {
      if (!ids.has(dep)) errors.push(`${task.id}: invalid dependency ${dep}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

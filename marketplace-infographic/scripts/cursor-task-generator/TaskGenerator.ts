import { scanRepository } from "../architecture-scanner/scan-repository";
import type { ScanResult } from "../architecture-scanner/types";
import { buildDependencyGraph, resolveTaskStates } from "./DependencyResolver";
import { validateAllTasks } from "./TaskValidator";
import { buildWaves } from "./WaveBuilder";
import type { TaskPlan } from "./types";

export class TaskGenerator {
  constructor(private readonly scan: ScanResult = scanRepository()) {}

  generate(): TaskPlan {
    const waves = buildWaves(this.scan);
    let allTasks = waves.flatMap((w) => w.tasks);
    allTasks = resolveTaskStates(allTasks);

    const wavesWithStates = waves.map((w) => ({
      ...w,
      tasks: allTasks.filter((t) => t.wave === w.wave),
    }));

    const validation = validateAllTasks(allTasks);
    if (!validation.valid) {
      console.warn("Task validation warnings:", validation.errors.slice(0, 10).join("; "));
    }

    return {
      generatedAt: new Date().toISOString(),
      waves: wavesWithStates,
      dependencyGraph: buildDependencyGraph(allTasks),
      checklists: {
        preImplementation: [
          "Read Architecture Bible Part 24 (Cursor Execution Protocol)",
          "Load architecture.yaml DSL",
          "Load directive from task",
          "Run architecture:scan for current baseline",
        ],
        implementation: [
          "Reuse code first — no architectural interpretation",
          "Minimal diff per task",
          "Run unit and integration tests",
          "Run architecture:scan",
        ],
        postImplementation: [
          "Update directive-registry.md status",
          "Write migration report to docs/architecture/migration-logs/",
          "Regenerate Code_Rewrite_Bible.md",
          "Regenerate cursor wave tasks",
        ],
      },
    };
  }
}

export function generateTaskPlan(): TaskPlan {
  return new TaskGenerator().generate();
}

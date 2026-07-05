import type { ScanResult } from "../architecture-scanner/types";
import { scoreTask } from "./TaskScore";
import type { CursorTask, TaskGroup, WavePlan } from "./types";
import { WAVE_DEFINITIONS as WAVES } from "./types";

type Template = Omit<CursorTask, "id" | "score" | "state"> & { idSuffix: string };

const WAVE_TEMPLATES: Record<number, Template[]> = {
  1: [
    {
      idSuffix: "001",
      title: "Introduce ProjectState",
      wave: 1,
      waveName: "Platform Core",
      priority: "Critical",
      risk: "medium",
      estimatedHours: 6,
      dependsOn: [],
      files: ["src/lib/platform-core/project-state/ProjectState.ts", "src/lib/contracts/"],
      acceptance: ["ProjectState immutable", "No compilation errors", "Runtime compatible"],
      rollback: ["Remove ProjectState", "Restore adapters"],
      architectureRef: "Part 28, PC-001",
      adrRef: "ADR-002",
      rfcRef: "RFC-001",
      directive: "PC-001",
      group: "Platform",
    },
    {
      idSuffix: "002",
      title: "Create Architecture Registry",
      wave: 1,
      waveName: "Platform Core",
      priority: "Critical",
      risk: "low",
      estimatedHours: 4,
      dependsOn: ["TASK-001"],
      files: ["src/lib/platform-core/registry/ArchitectureRegistry.ts"],
      acceptance: ["Registry registers platform", "Registry resolves platform"],
      rollback: ["Delete platform-core/registry"],
      architectureRef: "Part 28, PC-002",
      directive: "PC-002",
      group: "Platform",
    },
  ],
  2: [
    {
      idSuffix: "010",
      title: "Introduce BaseSpecification",
      wave: 2,
      waveName: "Contracts",
      priority: "Critical",
      risk: "medium",
      estimatedHours: 8,
      dependsOn: ["TASK-001"],
      files: ["src/lib/contracts/BaseSpecification.ts"],
      acceptance: ["All specs extend BaseSpecification", "DTO immutable"],
      rollback: ["Remove contracts module"],
      architectureRef: "Part 13, DTO-001",
      directive: "DTO-001",
      group: "Contracts",
    },
  ],
  3: [
    {
      idSuffix: "020",
      title: "Runtime engine skeleton",
      wave: 3,
      waveName: "Runtime",
      priority: "Critical",
      risk: "high",
      estimatedHours: 12,
      dependsOn: ["TASK-001", "TASK-010"],
      files: ["src/lib/runtime/index.ts"],
      acceptance: ["Runtime sole orchestrator", "No legacy imports"],
      rollback: ["Remove runtime module"],
      architectureRef: "Part 12, RUN-001",
      rfcRef: "RFC-002",
      directive: "RUN-001",
      group: "Runtime",
    },
  ],
  5: [
    {
      idSuffix: "050",
      title: "Replace DesignBrief with CommercialSpec",
      wave: 5,
      waveName: "Commercial",
      priority: "Critical",
      risk: "high",
      estimatedHours: 8,
      dependsOn: ["TASK-020"],
      files: ["src/lib/commercial-intelligence-platform/"],
      acceptance: ["Returns CommercialSpec", "No prompt generation"],
      rollback: ["Restore DesignBrief adapter"],
      architectureRef: "Part 29, DSP-001",
      directive: "DSP-001",
      group: "Platform",
    },
  ],
  8: [
    {
      idSuffix: "080",
      title: "Introduce RenderGraph",
      wave: 8,
      waveName: "Rendering",
      priority: "Critical",
      risk: "high",
      estimatedHours: 10,
      dependsOn: ["TASK-020"],
      files: ["src/lib/render-engine/RenderGraph.ts"],
      acceptance: ["Node-level retry", "Executes RenderBlueprint only"],
      rollback: ["Revert to monolithic render"],
      architectureRef: "Part 29, REN-002",
      adrRef: "ADR-004",
      rfcRef: "RFC-005",
      directive: "REN-002",
      group: "Platform",
    },
  ],
  11: [
    {
      idSuffix: "110",
      title: "Move Prompt to Provider Adapter",
      wave: 11,
      waveName: "Providers",
      priority: "Critical",
      risk: "critical",
      estimatedHours: 12,
      dependsOn: ["TASK-080"],
      files: ["src/lib/prompt/", "src/lib/providers/"],
      acceptance: ["One prompt compiler", "LAW-040 satisfied"],
      rollback: ["Re-enable legacy prompt path"],
      architectureRef: "Part 29, DSP-003",
      adrRef: "ADR-003",
      rfcRef: "RFC-004",
      directive: "DSP-003",
      group: "Provider",
    },
  ],
  14: [
    {
      idSuffix: "140",
      title: "Architecture validation in CI",
      wave: 14,
      waveName: "Architecture Validation",
      priority: "High",
      estimatedHours: 6,
      dependsOn: ["TASK-110"],
      files: [".github/workflows/ci.yml", "scripts/architecture-scanner/"],
      acceptance: ["architecture:scan in CI", "Score gate >= 98"],
      rollback: ["Remove CI architecture step"],
      architectureRef: "Part 16, CI-001",
      directive: "CI-001",
      group: "Infrastructure",
      risk: "medium",
    },
  ],
  15: [
    {
      idSuffix: "150",
      title: "Legacy cleanup",
      wave: 15,
      waveName: "Legacy Cleanup",
      priority: "High",
      estimatedHours: 8,
      dependsOn: ["TASK-140"],
      files: ["src/lib/legacy/", "src/lib/design-brief/"],
      acceptance: ["Legacy isolated", "Zero legacy in runtime"],
      rollback: ["Restore legacy adapters"],
      architectureRef: "Part 19 Wave 10",
      group: "Legacy",
      risk: "medium",
    },
  ],
  20: [
    {
      idSuffix: "200",
      title: "Architecture release",
      wave: 20,
      waveName: "Release",
      priority: "Critical",
      estimatedHours: 4,
      dependsOn: ["TASK-150"],
      files: ["docs/DAOS_Specification.md"],
      acceptance: ["All release artifacts", "Rollback documented"],
      rollback: ["Revert release tag"],
      architectureRef: "Part 31",
      group: "Infrastructure",
      risk: "low",
    },
  ],
};

function templateToTask(t: Template): CursorTask {
  const id = `TASK-${t.idSuffix}`;
  const partial = { ...t, id };
  return {
    ...partial,
    score: scoreTask(partial),
    state: t.dependsOn.length ? "Pending" : "Ready",
  };
}

function tasksFromScan(scan: ScanResult, wave: number, group: TaskGroup): CursorTask[] {
  const waveFilePatterns: Record<number, RegExp> = {
    4: /design\/|design-knowledge|knowledge/,
    6: /design-process/,
    7: /scene-planner|visual/,
    9: /vision|validation/,
    10: /feedback|learning/,
    12: /assets/,
    17: /marketplace|wildberries|ozon/i,
  };

  const pattern = waveFilePatterns[wave];
  if (!pattern) return [];

  return scan.files
    .filter((f) => (f.risk === "critical" || f.risk === "high") && pattern.test(f.path))
    .slice(0, 5)
    .map((file, idx) => {
      const suffix = String(wave * 100 + idx + 50).padStart(3, "0");
      const partial = {
        id: `TASK-${suffix}`,
        title: `Migrate ${file.path}`,
        wave,
        waveName: WAVES.find((w) => w.wave === wave)?.name ?? `Wave ${wave}`,
        priority: "High" as const,
        risk: file.risk,
        estimatedHours: 6,
        dependsOn: ["TASK-020"],
        files: [file.path],
        acceptance: file.migration.acceptance,
        rollback: ["Restore file from git", "Re-run architecture:scan"],
        architectureRef: `Code_Rewrite_Bible.md — ${file.path}`,
        directive: file.migration.directive,
        group,
        state: "Pending" as const,
      };
      return { ...partial, score: scoreTask(partial) };
    });
}

export function buildWaves(scan: ScanResult): WavePlan[] {
  const plans: WavePlan[] = [];

  for (const def of WAVES) {
    const templates = WAVE_TEMPLATES[def.wave] ?? [];
    const templateTasks = templates.map(templateToTask);
    const scanTasks = tasksFromScan(scan, def.wave, def.group);
    const tasks = [...templateTasks, ...scanTasks];
    plans.push({
      wave: def.wave,
      name: def.name,
      group: def.group,
      tasks,
    });
  }

  return plans;
}

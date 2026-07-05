import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CursorTask, TaskPlan, WavePlan } from "./types";

function taskMarkdown(task: CursorTask): string {
  return `## ${task.id} — ${task.title}

| Field | Value |
|-------|-------|
| **Wave** | ${String(task.wave).padStart(2, "0")} — ${task.waveName} |
| **Priority** | ${task.priority} |
| **Risk** | ${task.risk} |
| **State** | ${task.state} |
| **Group** | ${task.group} |
| **Estimated time** | ${task.estimatedHours}h |
| **Directive** | ${task.directive ?? "—"} |

### Dependencies

${task.dependsOn.length ? task.dependsOn.map((d) => `- ${d}`).join("\n") : "- None"}

### Files

${task.files.map((f) => `- \`${f}\``).join("\n")}

### Acceptance

${task.acceptance.map((a) => `- [ ] ${a}`).join("\n")}

### Rollback

${task.rollback.map((r) => `- ${r}`).join("\n")}

### Architecture Reference

${task.architectureRef}

${task.rfcRef ? `**RFC:** ${task.rfcRef}  \n` : ""}${task.adrRef ? `**ADR:** ${task.adrRef}  \n` : ""}
### Task Score

| Metric | Value |
|--------|-------|
| Complexity | ${task.score.complexity}/10 |
| Architecture impact | ${task.score.architectureImpact}/10 |
| Breaking change | ${task.score.breakingChange ? "Yes" : "No"} |
| Confidence | ${task.score.confidence} |

---
`;
}

export function exportWaveMarkdown(wave: WavePlan): string {
  const num = String(wave.wave).padStart(2, "0");
  const ready = wave.tasks.filter((t) => t.state === "Ready").length;
  const blocked = wave.tasks.filter((t) => t.state === "Blocked").length;

  return `# Wave ${num} — ${wave.name}

> **AUTO-GENERATED** — Part 35 Cursor Task Generator. Regenerate: \`npm run architecture:tasks\`

| | |
|---|---|
| **Group** | ${wave.group} |
| **Tasks** | ${wave.tasks.length} |
| **Ready** | ${ready} |
| **Blocked** | ${blocked} |

---

${wave.tasks.length ? wave.tasks.map(taskMarkdown).join("\n") : "_No tasks defined for this wave yet._\n"}

*END OF WAVE ${num}*
`;
}

export function exportAllWaves(plan: TaskPlan, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  for (const wave of plan.waves) {
    const num = String(wave.wave).padStart(2, "0");
    const path = join(outputDir, `Wave-${num}.md`);
    writeFileSync(path, exportWaveMarkdown(wave), "utf8");
  }
  writeFileSync(join(outputDir, "README.md"), exportPlanIndex(plan), "utf8");
  console.log(`Wrote ${plan.waves.length} wave files to ${outputDir}`);
}

export function exportPlanIndex(plan: TaskPlan): string {
  const total = plan.waves.reduce((n, w) => n + w.tasks.length, 0);
  return `# Cursor Implementation Plan

> Generated: ${plan.generatedAt}  
> Input: Architecture_Bible.md + Code_Rewrite_Bible.md + Repository Analysis

## Waves

| Wave | Name | Tasks | Group |
|------|------|-------|-------|
${plan.waves.map((w) => `| [Wave-${String(w.wave).padStart(2, "0")}.md](Wave-${String(w.wave).padStart(2, "0")}.md) | ${w.name} | ${w.tasks.length} | ${w.group} |`).join("\n")}

**Total tasks:** ${total}

## Pre-Implementation Checklist

${plan.checklists.preImplementation.map((c) => `- [ ] ${c}`).join("\n")}

## Implementation Checklist

${plan.checklists.implementation.map((c) => `- [ ] ${c}`).join("\n")}

## Post-Implementation Checklist

${plan.checklists.postImplementation.map((c) => `- [ ] ${c}`).join("\n")}
`;
}

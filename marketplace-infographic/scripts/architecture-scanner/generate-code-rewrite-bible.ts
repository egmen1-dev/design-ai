import { writeFileSync } from "node:fs";
import { VIOLATION_LABELS } from "./rules";
import type { FileMetadata, ScanResult } from "./types";

function fileSection(file: FileMetadata): string {
  const problems = file.violations.map((v) => `- **${v}**: ${VIOLATION_LABELS[v]}`);
  return `### File: \`${file.path}\`

| Field | Value |
|-------|-------|
| **Layer** | ${file.detectedLayer} |
| **Risk** | ${file.risk} |
| **Lines** | ${file.lines} |
| **Directive** | ${file.migration.directive ?? "TBD"} |

#### Current Responsibility

${file.detectedResponsibility.length ? file.detectedResponsibility.map((r) => `- ${r}`).join("\n") : "- (inferred from path)"}

#### Problems

${problems.length ? problems.join("\n") : "- None detected"}

#### Keep

${file.migration.keep.length ? file.migration.keep.map((k) => `- ${k}`).join("\n") : "- Pending classification"}

#### Move

${file.migration.move.length ? file.migration.move.map((m) => `- ${m}`).join("\n") : "- None"}

#### Delete

${file.migration.delete.length ? file.migration.delete.map((d) => `- ${d}`).join("\n") : "- None"}

#### Target Layer

\`${file.migration.targetLayer}\`

#### Required Changes

${file.migration.requiredChanges.length ? file.migration.requiredChanges.map((c) => `- ${c}`).join("\n") : "- None"}

#### Tests

${file.migration.tests.map((t) => `- ${t}`).join("\n")}

#### Acceptance

${file.migration.acceptance.map((a) => `- ${a}`).join("\n")}

---
`;
}

export function generateMarkdown(result: ScanResult): string {
  const { summary, files } = result;
  const criticalViolations = Object.entries(summary.violations)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0);

  const byModule = new Map<string, FileMetadata[]>();
  for (const file of files) {
    const parts = file.path.replace(/\\/g, "/").split("/");
    const mod = parts.slice(0, 3).join("/");
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod)!.push(file);
  }

  const highRiskFiles = files
    .filter((f) => f.risk === "critical" || f.risk === "high")
    .slice(0, 100);

  const cursorTasks = files
    .filter((f) => f.migration.directive)
    .slice(0, 30)
    .map(
      (f) =>
        `- [ ] **${f.migration.directive}** — \`${f.path}\` (${f.violations.length} violations)`,
    );

  let md = `# CODE REWRITE BIBLE

> **AUTO-GENERATED** — do not edit manually. Regenerate with \`npm run architecture:scan\`.

Generated: ${summary.scannedAt}  
Scanner root: \`${summary.root}\`  
Architecture Bible: [Architecture_Bible.md](Architecture_Bible.md) Part 34

---

## 1. Repository Summary

| Metric | Value |
|--------|-------|
| **Total files scanned** | ${summary.totalFiles} |
| **Architecture score** | **${summary.architectureScore}** / 98 target |
| **Critical risk** | ${summary.byRisk.critical} |
| **High risk** | ${summary.byRisk.high} |
| **Medium risk** | ${summary.byRisk.medium} |
| **Low risk** | ${summary.byRisk.low} |

### Files by layer

${Object.entries(summary.byLayer)
  .sort((a, b) => b[1] - a[1])
  .map(([layer, count]) => `- **${layer}**: ${count}`)
  .join("\n")}

---

## 2. Architecture Score

Target: **≥ 98**

Current: **${summary.architectureScore}**

Factors: platform isolation · contract compliance · runtime compliance · prompt isolation · legacy isolation · provider isolation · asset isolation · test coverage · documentation coverage

---

## 3. File Risk Ranking (top critical/high)

| Risk | File | Violations |
|------|------|------------|
${summary.criticalFiles
  .slice(0, 25)
  .map((f) => `| ${f.risk} | \`${f.path}\` | ${f.violations.join(", ") || "—"} |`)
  .join("\n")}

---

## 4. Critical Violations

${criticalViolations.length ? criticalViolations.map(([v, c]) => `- **${v}**: ${c} files — ${VIOLATION_LABELS[v as keyof typeof VIOLATION_LABELS]}`).join("\n") : "- None"}

---

## 5. Module-by-Module Migration

${[...byModule.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 40)
  .map(([mod, modFiles]) => {
    const viol = modFiles.reduce((n, f) => n + f.violations.length, 0);
    return `### \`${mod}/\` (${modFiles.length} files, ${viol} violations)`;
  })
  .join("\n\n")}

---

## 6. File-by-File Migration (high risk)

${highRiskFiles.map(fileSection).join("\n")}

---

## 7. Generated Cursor Tasks

${cursorTasks.length ? cursorTasks.join("\n") : "- No directives mapped yet"}

---

## 8. Acceptance Checklist

- [ ] Architecture score ≥ 98
- [ ] Zero PROMPT_OUTSIDE_PROVIDER violations
- [ ] Zero LEGACY_IMPORT_IN_RUNTIME violations
- [ ] All files classified (no unknown layer)
- [ ] ProjectState used in orchestration path
- [ ] Code Rewrite Bible regenerated after each migration wave

---

*END OF GENERATED CODE REWRITE BIBLE*
`;

  return md;
}

export function writeCodeRewriteBible(result: ScanResult, outputPath: string): void {
  const markdown = generateMarkdown(result);
  writeFileSync(outputPath, markdown, "utf8");
  console.log(`Wrote ${outputPath} (${result.files.length} files, score ${result.summary.architectureScore})`);
}

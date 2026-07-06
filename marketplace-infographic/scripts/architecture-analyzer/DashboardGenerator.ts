import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AnalyzerResult, DashboardData } from "./types";

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export class DashboardGenerator {
  build(result: AnalyzerResult): DashboardData {
    const platformHealth: Record<string, number> = {};
    for (const item of result.migrationProgress) {
      platformHealth[item.platform] = item.percent;
    }

    return {
      overallScore: result.architectureScore,
      platformHealth,
      technicalDebtCount: result.technicalDebt.length,
      criticalViolations: result.technicalDebt.filter((d) => d.severity === "Critical").length,
      migrationStatus: result.migrationProgress,
    };
  }

  renderDashboard(data: DashboardData, result: AnalyzerResult): string {
    return `# Architecture Dashboard

> **AUTO-GENERATED** — Part 36 Architecture Analyzer. Regenerate: \`npm run architecture:analyze\`

Generated: ${result.generatedAt}

---

## Overall Score

**${data.overallScore}** / 98 target

---

## Platform Health

| Platform | Progress | Bar |
|----------|----------|-----|
${data.migrationStatus.map((m) => `| ${m.platform} | ${m.percent}% | ${m.bar} |`).join("\n")}

---

## Technical Debt

| Metric | Value |
|--------|-------|
| Total items | ${data.technicalDebtCount} |
| Critical | ${data.criticalViolations} |

---

## Critical Violations (top 10)

${result.technicalDebt
  .filter((d) => d.severity === "Critical")
  .slice(0, 10)
  .map((d) => `- **${d.id}** — \`${d.file}\` — ${d.recommendation}`)
  .join("\n") || "- None"}

---

## Migration Status

${result.migrationProgress.map((m) => `### ${m.platform}\n\n\`${m.bar}\` ${m.percent}%\n`).join("\n")}

*END OF DASHBOARD*
`;
  }

  exportAll(result: AnalyzerResult, outputDir: string): void {
    mkdirSync(outputDir, { recursive: true });
    const dashboard = this.build(result);

    writeFileSync(join(outputDir, "Dashboard.md"), this.renderDashboard(dashboard, result), "utf8");
    writeFileSync(join(outputDir, "ArchitectureReport.md"), this.architectureReport(result), "utf8");
    writeFileSync(join(outputDir, "DependencyReport.md"), this.dependencyReport(result), "utf8");
    writeFileSync(join(outputDir, "ComplexityReport.md"), this.complexityReport(result), "utf8");
    writeFileSync(join(outputDir, "TechnicalDebtReport.md"), this.debtReport(result), "utf8");
    writeFileSync(join(outputDir, "MigrationProgress.md"), this.migrationReport(result), "utf8");
    writeFileSync(join(outputDir, "CoverageReport.md"), this.coverageReport(result), "utf8");
    writeFileSync(join(outputDir, "README.md"), this.index(result), "utf8");
  }

  private index(result: AnalyzerResult): string {
    return `# Architecture Reports

Generated: ${result.generatedAt}

| Report | File |
|--------|------|
| Dashboard | [Dashboard.md](Dashboard.md) |
| Architecture | [ArchitectureReport.md](ArchitectureReport.md) |
| Dependencies | [DependencyReport.md](DependencyReport.md) |
| Complexity | [ComplexityReport.md](ComplexityReport.md) |
| Technical Debt | [TechnicalDebtReport.md](TechnicalDebtReport.md) |
| Migration | [MigrationProgress.md](MigrationProgress.md) |
| Coverage | [CoverageReport.md](CoverageReport.md) |
`;
  }

  private architectureReport(result: AnalyzerResult): string {
    return `# Architecture Report

Score: **${result.architectureScore}** / 98

Files scanned: ${result.scan.summary.totalFiles}

## By layer

${Object.entries(result.scan.summary.byLayer)
  .sort((a, b) => b[1] - a[1])
  .map(([l, c]) => `- ${l}: ${c}`)
  .join("\n")}

## By risk

- Critical: ${result.scan.summary.byRisk.critical}
- High: ${result.scan.summary.byRisk.high}
- Medium: ${result.scan.summary.byRisk.medium}
- Low: ${result.scan.summary.byRisk.low}
`;
  }

  private dependencyReport(result: AnalyzerResult): string {
    const d = result.dependencies;
    return `# Dependency Report

Total internal dependencies: ${d.totalInternalDeps}

## Cross-layer edges

| From | To | Count |
|------|-----|-------|
${d.crossLayerEdges.map((e) => `| ${e.from} | ${e.to} | ${e.count} |`).join("\n")}

## Top coupled files

${d.topCoupledFiles.map((f) => `- \`${f.path}\` (${f.dependencyCount})`).join("\n")}
`;
  }

  private complexityReport(result: AnalyzerResult): string {
    return `# Complexity Report

| File | Lines | Cyclomatic (est.) | Coupling | Cohesion |
|------|-------|-------------------|----------|----------|
${result.complexity
  .slice(0, 30)
  .map(
    (c) =>
      `| \`${c.path}\` | ${c.lines} | ${c.cyclomaticEstimate} | ${c.coupling} | ${c.cohesion} |`,
  )
  .join("\n")}
`;
  }

  private debtReport(result: AnalyzerResult): string {
    return `# Technical Debt Report

| ID | Severity | File | Issue | Recommendation |
|----|----------|------|-------|----------------|
${result.technicalDebt
  .slice(0, 50)
  .map(
    (d) =>
      `| ${d.id} | ${d.severity} | \`${d.file}\` | ${d.violation} | ${d.recommendation} |`,
  )
  .join("\n")}
`;
  }

  private migrationReport(result: AnalyzerResult): string {
    return `# Migration Progress

${result.migrationProgress
  .map((m) => `## ${m.platform}\n\n\`${m.bar}\` **${m.percent}%**\n`)
  .join("\n")}
`;
  }

  private coverageReport(result: AnalyzerResult): string {
    const testFiles = result.scan.files.filter((f) => f.path.endsWith(".spec.ts")).length;
    const total = result.scan.summary.totalFiles;
    return `# Coverage Report

Architecture test file ratio: **${result.coveragePercent}%**

Spec files: ${testFiles} / ${total} scanned files

> Full test coverage requires \`npm run test:specs\` audit.
`;
  }
}

export { progressBar };

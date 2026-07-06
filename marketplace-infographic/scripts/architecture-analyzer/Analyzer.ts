import { join } from "node:path";
import { scanRepository } from "../architecture-scanner/scan-repository";
import { existsSync } from "node:fs";
import { ComplexityScanner } from "./ComplexityScanner";
import { DashboardGenerator, progressBar } from "./DashboardGenerator";
import { DebtScanner } from "./DebtScanner";
import { DependencyScanner } from "./DependencyScanner";
import type { AnalyzerResult, MigrationProgressItem } from "./types";

const PROJECT_ROOT = join(__dirname, "../..");

function estimateMigrationProgress(): MigrationProgressItem[] {
  const checks: Array<{ platform: string; paths: string[]; base: number }> = [
    { platform: "Platform Core", paths: ["src/lib/platform-core/"], base: 0 },
    { platform: "Contracts", paths: ["src/lib/contracts/"], base: 0 },
    { platform: "Runtime", paths: ["src/lib/runtime/"], base: 0 },
    { platform: "Knowledge", paths: ["src/lib/design/", "design-knowledge-platform"], base: 20 },
    { platform: "Commercial", paths: ["commercial-intelligence"], base: 40 },
    { platform: "Creative", paths: ["design-process/"], base: 15 },
    { platform: "Visual", paths: ["scene-planner", "layout-engine"], base: 10 },
    { platform: "Rendering", paths: ["render-engine/", "render-blueprint/"], base: 50 },
    { platform: "Vision", paths: ["vision-"], base: 25 },
    { platform: "Learning", paths: ["feedback/"], base: 20 },
    { platform: "Providers", paths: ["src/lib/providers/"], base: 0 },
    { platform: "Legacy Cleanup", paths: ["design-brief/"], base: 0 },
  ];

  return checks.map(({ platform, paths, base }) => {
    const exists = paths.some((p) => {
      try {
        return existsSync(join(PROJECT_ROOT, "src/lib", p)) || existsSync(join(PROJECT_ROOT, "src", p));
      } catch {
        return false;
      }
    });
    let percent = base;
    if (platform === "Platform Core" && existsSync(join(PROJECT_ROOT, "src/lib/platform-core/ProjectState.ts"))) {
      percent = 60;
    }
    if (platform === "Contracts" && existsSync(join(PROJECT_ROOT, "src/lib/contracts/"))) percent = 30;
    if (platform === "Runtime" && existsSync(join(PROJECT_ROOT, "src/lib/runtime/"))) percent = 20;
    if (exists && percent < 30) percent = 30;
    return { platform, percent, bar: progressBar(percent) };
  });
}

export class Analyzer {
  private readonly debtScanner = new DebtScanner();
  private readonly dependencyScanner = new DependencyScanner();
  private readonly complexityScanner = new ComplexityScanner(PROJECT_ROOT);
  private readonly dashboardGenerator = new DashboardGenerator();

  run(root = PROJECT_ROOT): AnalyzerResult {
    const scan = scanRepository(root);
    const technicalDebt = this.debtScanner.scan(scan);
    const dependencies = this.dependencyScanner.scan(scan);
    const complexity = this.complexityScanner.scan(scan);
    const migrationProgress = estimateMigrationProgress();
    const testFiles = scan.files.filter((f) => f.path.endsWith(".spec.ts")).length;
    const coveragePercent = Math.round((testFiles / Math.max(1, scan.summary.totalFiles)) * 100);

    return {
      generatedAt: new Date().toISOString(),
      scan,
      architectureScore: scan.summary.architectureScore,
      technicalDebt,
      dependencies,
      complexity,
      migrationProgress,
      coveragePercent,
    };
  }

  exportReports(outputDir: string, root = PROJECT_ROOT): AnalyzerResult {
    const result = this.run(root);
    this.dashboardGenerator.exportAll(result, outputDir);
    return result;
  }
}

export function runAnalyzer(outputDir: string): AnalyzerResult {
  return new Analyzer().exportReports(outputDir);
}

import { ARCHITECTURE_SCORE_WEIGHTS, TARGET_SCORE } from "./rules";
import type { FileMetadata, ScanSummary } from "./types";

export function mapArchitectureScore(files: FileMetadata[]): number {
  const total = files.length || 1;
  const withViolations = files.filter((f) => f.violations.length > 0).length;
  const unknownLayer = files.filter((f) => f.detectedLayer === "unknown").length;
  const promptViolations = files.filter((f) =>
    f.violations.includes("PROMPT_OUTSIDE_PROVIDER"),
  ).length;
  const legacyRuntime = files.filter((f) =>
    f.violations.includes("LEGACY_IMPORT_IN_RUNTIME"),
  ).length;
  const platformCross = files.filter((f) =>
    f.violations.includes("PLATFORM_IMPORTS_PLATFORM"),
  ).length;
  const testFiles = files.filter((f) => f.detectedLayer === "tests" || f.path.endsWith(".spec.ts")).length;
  const docFiles = files.filter((f) => f.detectedLayer === "docs").length;

  const factors = {
    platformIsolation: 100 - (platformCross / total) * 500,
    contractCompliance: 100 - (unknownLayer / total) * 200,
    runtimeCompliance: 100 - (legacyRuntime / total) * 800,
    promptIsolation: 100 - (promptViolations / total) * 600,
    legacyIsolation: 100 - (files.filter((f) => f.detectedLayer === "legacy").length / total) * 100,
    providerIsolation: 100 - (files.filter((f) => f.violations.includes("PROVIDER_LOGIC_IN_PLATFORM")).length / total) * 400,
    assetIsolation: 100 - (files.filter((f) => f.violations.includes("FILESYSTEM_ACCESS_OUTSIDE_ASSET_PLATFORM")).length / total) * 300,
    testCoverage: Math.min(100, (testFiles / total) * 400),
    documentationCoverage: Math.min(100, (docFiles / total) * 1000 + 50),
  };

  let weighted = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(ARCHITECTURE_SCORE_WEIGHTS)) {
    const factor = factors[key as keyof typeof factors];
    weighted += Math.max(0, Math.min(100, factor)) * weight;
    weightSum += weight;
  }

  const score = Math.round(weighted / weightSum);
  return Math.min(TARGET_SCORE, Math.max(0, score));
}

export function buildSummary(root: string, files: FileMetadata[]): ScanSummary {
  const byLayer: Record<string, number> = {};
  const byRisk = { low: 0, medium: 0, high: 0, critical: 0 };
  const violations: Record<string, number> = {};

  for (const file of files) {
    byLayer[file.detectedLayer] = (byLayer[file.detectedLayer] ?? 0) + 1;
    byRisk[file.risk]++;
    for (const v of file.violations) {
      violations[v] = (violations[v] ?? 0) + 1;
    }
  }

  const architectureScore = mapArchitectureScore(files);
  const criticalFiles = files
    .filter((f) => f.risk === "critical" || f.risk === "high")
    .sort((a, b) => b.violations.length - a.violations.length)
    .slice(0, 50);

  return {
    scannedAt: new Date().toISOString(),
    root,
    totalFiles: files.length,
    byLayer,
    byRisk,
    violations: violations as ScanSummary["violations"],
    architectureScore,
    criticalFiles,
  };
}

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ScanResult } from "../architecture-scanner/types";
import type { ComplexityMetrics } from "./types";

const BRANCH_RE = /\b(if|else|for|while|switch|case|catch|\?\s)/g;

export class ComplexityScanner {
  constructor(private readonly projectRoot: string) {}

  scan(scan: ScanResult): ComplexityMetrics[] {
    return scan.files
      .map((file) => this.analyzeFile(file.path, file.lines, file.imports.length, file.exports.length))
      .sort((a, b) => b.cyclomaticEstimate - a.cyclomaticEstimate)
      .slice(0, 100);
  }

  private analyzeFile(
    relPath: string,
    lines: number,
    importCount: number,
    exportCount: number,
  ): ComplexityMetrics {
    let cyclomaticEstimate = 1;
    try {
      const content = readFileSync(join(this.projectRoot, relPath), "utf8");
      cyclomaticEstimate = Math.max(1, (content.match(BRANCH_RE) ?? []).length + 1);
    } catch {
      cyclomaticEstimate = Math.ceil(lines / 50);
    }

    const coupling = importCount + exportCount;
    const cohesion = exportCount > 0 ? Math.min(1, exportCount / Math.max(1, coupling)) : 0.5;

    return {
      path: relPath,
      lines,
      importCount,
      exportCount,
      cyclomaticEstimate,
      coupling,
      cohesion: Math.round(cohesion * 100) / 100,
    };
  }

  averageComplexity(metrics: ComplexityMetrics[]): number {
    if (!metrics.length) return 0;
    return Math.round(metrics.reduce((s, m) => s + m.cyclomaticEstimate, 0) / metrics.length);
  }
}

import type { ScanResult } from "../architecture-scanner/types";

export type DebtSeverity = "Critical" | "High" | "Medium" | "Low";

export interface TechnicalDebtItem {
  id: string;
  violation: string;
  severity: DebtSeverity;
  file: string;
  recommendation: string;
}

export interface DependencyReportData {
  totalInternalDeps: number;
  crossLayerEdges: Array<{ from: string; to: string; count: number }>;
  topCoupledFiles: Array<{ path: string; dependencyCount: number }>;
}

export interface ComplexityMetrics {
  path: string;
  lines: number;
  importCount: number;
  exportCount: number;
  cyclomaticEstimate: number;
  coupling: number;
  cohesion: number;
}

export interface MigrationProgressItem {
  platform: string;
  percent: number;
  bar: string;
}

export interface AnalyzerResult {
  generatedAt: string;
  scan: ScanResult;
  architectureScore: number;
  technicalDebt: TechnicalDebtItem[];
  dependencies: DependencyReportData;
  complexity: ComplexityMetrics[];
  migrationProgress: MigrationProgressItem[];
  coveragePercent: number;
}

export interface DashboardData {
  overallScore: number;
  platformHealth: Record<string, number>;
  technicalDebtCount: number;
  criticalViolations: number;
  migrationStatus: MigrationProgressItem[];
}

export type ArchitectureLayer =
  | "app"
  | "components"
  | "platform-core"
  | "runtime"
  | "contracts"
  | "platforms"
  | "providers"
  | "sdk"
  | "assets"
  | "infrastructure"
  | "shared"
  | "legacy"
  | "docs"
  | "tests"
  | "unknown";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ViolationType =
  | "PROMPT_OUTSIDE_PROVIDER"
  | "LEGACY_IMPORT_IN_RUNTIME"
  | "PLATFORM_IMPORTS_PLATFORM"
  | "RUNTIME_IMPORTS_PROVIDER"
  | "BUSINESS_LOGIC_IN_UTILS"
  | "FILESYSTEM_ACCESS_OUTSIDE_ASSET_PLATFORM"
  | "HTML_LAYOUT_OWNS_DESIGN"
  | "DTO_NOT_REGISTERED"
  | "MISSING_DECISION_TRACE"
  | "MISSING_PROJECT_STATE"
  | "PROVIDER_LOGIC_IN_PLATFORM"
  | "RENDERING_MAKES_BUSINESS_DECISION"
  | "UNKNOWN_LAYER";

export interface FileMetadata {
  path: string;
  extension: string;
  size: number;
  lines: number;
  exports: string[];
  imports: string[];
  dependencies: string[];
  detectedLayer: ArchitectureLayer;
  detectedResponsibility: string[];
  risk: RiskLevel;
  violations: ViolationType[];
  migration: FileMigrationPlan;
}

export interface FileMigrationPlan {
  keep: string[];
  move: string[];
  delete: string[];
  targetLayer: ArchitectureLayer;
  requiredChanges: string[];
  tests: string[];
  acceptance: string[];
  directive?: string;
}

export interface ScanSummary {
  scannedAt: string;
  root: string;
  totalFiles: number;
  byLayer: Record<string, number>;
  byRisk: Record<RiskLevel, number>;
  violations: Record<ViolationType, number>;
  architectureScore: number;
  criticalFiles: FileMetadata[];
}

export interface ScanResult {
  summary: ScanSummary;
  files: FileMetadata[];
}

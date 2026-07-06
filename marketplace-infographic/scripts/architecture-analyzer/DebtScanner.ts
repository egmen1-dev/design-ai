import { VIOLATION_LABELS } from "../architecture-scanner/rules";
import type { ScanResult } from "../architecture-scanner/types";
import type { DebtSeverity, TechnicalDebtItem } from "./types";

const SEVERITY_MAP: Record<string, DebtSeverity> = {
  PROMPT_OUTSIDE_PROVIDER: "Critical",
  LEGACY_IMPORT_IN_RUNTIME: "Critical",
  RUNTIME_IMPORTS_PROVIDER: "Critical",
  PLATFORM_IMPORTS_PLATFORM: "High",
  PROVIDER_LOGIC_IN_PLATFORM: "High",
  MISSING_PROJECT_STATE: "High",
  RENDERING_MAKES_BUSINESS_DECISION: "High",
  FILESYSTEM_ACCESS_OUTSIDE_ASSET_PLATFORM: "Medium",
  HTML_LAYOUT_OWNS_DESIGN: "Medium",
  DTO_NOT_REGISTERED: "Medium",
  MISSING_DECISION_TRACE: "Medium",
  BUSINESS_LOGIC_IN_UTILS: "Medium",
  UNKNOWN_LAYER: "Low",
};

const RECOMMENDATIONS: Record<string, string> = {
  PROMPT_OUTSIDE_PROVIDER: "Move to Provider Adapter",
  LEGACY_IMPORT_IN_RUNTIME: "Remove legacy imports from Runtime",
  RUNTIME_IMPORTS_PROVIDER: "Resolve providers via Registry only",
  PLATFORM_IMPORTS_PLATFORM: "Exchange data via ProjectState only",
  PROVIDER_LOGIC_IN_PLATFORM: "Move provider logic to Provider Adapter",
  MISSING_PROJECT_STATE: "Wire orchestration through ProjectState",
  RENDERING_MAKES_BUSINESS_DECISION: "Move decisions to Creative/Commercial platforms",
  FILESYSTEM_ACCESS_OUTSIDE_ASSET_PLATFORM: "Route filesystem via Asset Platform",
  HTML_LAYOUT_OWNS_DESIGN: "Use OverlayBlueprint as layout source of truth",
  DTO_NOT_REGISTERED: "Register DTO in contracts module",
  MISSING_DECISION_TRACE: "Add DecisionTrace to platform output",
  BUSINESS_LOGIC_IN_UTILS: "Move business logic to appropriate Platform",
  UNKNOWN_LAYER: "Classify file into canonical layer (Part 27)",
};

export class DebtScanner {
  scan(scan: ScanResult): TechnicalDebtItem[] {
    const items: TechnicalDebtItem[] = [];
    let counter = 1;

    for (const file of scan.files) {
      for (const violation of file.violations) {
        items.push({
          id: `TD-${String(counter++).padStart(3, "0")}`,
          violation: VIOLATION_LABELS[violation] ?? violation,
          severity: SEVERITY_MAP[violation] ?? "Medium",
          file: file.path,
          recommendation: RECOMMENDATIONS[violation] ?? "See Architecture Bible",
        });
      }
    }

    return items.sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return order[a.severity] - order[b.severity];
    });
  }
}

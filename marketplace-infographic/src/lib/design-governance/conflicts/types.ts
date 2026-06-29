export type ConflictSeverity = "low" | "medium" | "high" | "critical";

export type ConflictType =
  | "scene"
  | "lighting"
  | "style"
  | "composition"
  | "palette"
  | "environment"
  | "layout";

export type DesignConflict = {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  values: string[];
  sources: string[];
  description: string;
  resolvedValue?: string;
  resolutionReason?: string;
};

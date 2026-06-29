/**
 * Chapter 3.6 — Validation Engine types
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { BlueprintLifecycle } from "./lifecycle-types";

export const ValidationLevel = {
  SCHEMA: 1,
  BUSINESS: 2,
  ARCHITECTURE: 3,
  PROFESSIONAL: 4,
} as const;

export type ValidationLevelId = (typeof ValidationLevel)[keyof typeof ValidationLevel];

export type ValidationSeverity = "fatal" | "error" | "warning";

export type ValidationError = {
  code: string;
  section: BlueprintSection;
  severity: ValidationSeverity;
  message: string;
};

export type ValidationWarning = {
  code: string;
  section: BlueprintSection;
  message: string;
};

export type ValidationResult = {
  passed: boolean;
  score: number;
  level: ValidationLevelId;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
};

export type ValidationRuleCategory =
  | "Structural"
  | "Business"
  | "Architectural"
  | "Professional";

export type ValidationRule = {
  id: string;
  name: string;
  priority: number;
  level: ValidationLevelId;
  category: ValidationRuleCategory;
  /** Rules in the same group may run in parallel */
  parallelGroup?: string;
  validate(blueprint: Readonly<RenderBlueprint>): ValidationResult;
};

export type ValidationReport = {
  revision: number;
  stage: BlueprintLifecycle;
  score: number;
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
  durationMs: number;
  cached: boolean;
  hasFatal: boolean;
  hasError: boolean;
};

export type ValidationEngineOptions = {
  /** Optional decision graph for architecture cycle checks */
  graph?: import("./decision-graph").DecisionGraph;
};

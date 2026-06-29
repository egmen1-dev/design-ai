/**
 * Chapter 3.6 — Validation Engine
 * Read-only integrity checks — never mutates RenderBlueprint.
 */
import type { RenderBlueprint } from "./types";
import {
  ValidationLevel,
  type ValidationEngineOptions,
  type ValidationLevelId,
  type ValidationReport,
  type ValidationResult,
  type ValidationRule,
} from "./validation-types";
import { DEFAULT_VALIDATION_RULES } from "./validation-rules";

export {
  ValidationLevel,
  type ValidationError,
  type ValidationResult,
  type ValidationRule,
  type ValidationReport,
  type ValidationSeverity,
  type ValidationWarning,
  type ValidationRuleCategory,
  type ValidationEngineOptions,
} from "./validation-types";

export {
  DEFAULT_VALIDATION_RULES,
  VAL_001_BLUEPRINT_STRUCTURE,
  VAL_002_LIFECYCLE,
  VAL_003_DEPENDENCIES,
  VAL_004_CAMERA,
  VAL_005_LIGHTING,
  VAL_006_COMPOSITION,
  VAL_007_BACKGROUND,
  VAL_008_PROFESSIONAL_LAYOUT,
  VAL_009_MARKETPLACE,
  VAL_010_ARCHITECTURE_INVARIANTS,
  VAL_BUSINESS_SCENE_LOGIC,
} from "./validation-rules";

const LEVEL_ORDER: ValidationLevelId[] = [
  ValidationLevel.SCHEMA,
  ValidationLevel.BUSINESS,
  ValidationLevel.ARCHITECTURE,
  ValidationLevel.PROFESSIONAL,
];

function aggregateScore(results: ValidationResult[]): number {
  if (!results.length) return 100;
  const professional = results.filter((r) => r.level === ValidationLevel.PROFESSIONAL);
  if (professional.length) {
    return Math.min(...professional.map((r) => r.score));
  }
  return Math.min(...results.map((r) => r.score));
}

export class ValidationEngine {
  private readonly rules: ValidationRule[];
  private readonly cache = new Map<string, ValidationReport>();

  constructor(rules: ValidationRule[] = DEFAULT_VALIDATION_RULES) {
    this.rules = [...rules].sort((a, b) => a.priority - b.priority);
  }

  registerRule(rule: ValidationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  getRules(): readonly ValidationRule[] {
    return this.rules;
  }

  /** Invalidate cache for revision or entire cache */
  invalidateCache(revision?: number): void {
    if (revision === undefined) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${revision}:`)) this.cache.delete(key);
    }
  }

  /**
   * Full validation pipeline — levels 1→4, fatal stops level progression.
   * Cached by revision + stage.
   */
  validate(
    blueprint: Readonly<RenderBlueprint>,
    options: ValidationEngineOptions = {},
  ): ValidationReport {
    const revision = blueprint.meta.revision ?? 0;
    const stage = blueprint.lifecycle.stage;
    const cacheKey = `${revision}:${stage}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return { ...hit, cached: true };

    const started = Date.now();
    const allErrors: ValidationReport["errors"] = [];
    const allWarnings: ValidationReport["warnings"] = [];
    const allRecommendations: string[] = [];
    const levelResults: ValidationResult[] = [];
    let hasFatal = false;
    let hasError = false;

    if (options.graph) {
      const graphCheck = options.graph.validate();
      if (!graphCheck.ok) {
        for (const issue of graphCheck.issues) {
          const severity = issue.code === "CYCLE" ? "fatal" : "error";
          allErrors.push({
            code: "VAL_003",
            section: "meta",
            severity,
            message: issue.message,
          });
          if (severity === "fatal") hasFatal = true;
          else hasError = true;
        }
      }
    }

    for (const level of LEVEL_ORDER) {
      if (hasFatal) break;

      const levelRules = this.rules.filter((r) => r.level === level);
      const groups = groupRulesForParallel(levelRules);
      const levelPartials: ValidationResult[] = [];

      for (const group of groups) {
        const results = group.map((rule) => rule.validate(blueprint));
        levelPartials.push(...results);
      }

      const merged = mergeLevelResults(level, levelPartials);
      levelResults.push(merged);
      allErrors.push(...merged.errors);
      allWarnings.push(...merged.warnings);
      allRecommendations.push(...merged.recommendations);

      if (merged.errors.some((e) => e.severity === "fatal")) {
        hasFatal = true;
        break;
      }
      if (merged.errors.some((e) => e.severity === "error")) {
        hasError = true;
      }
    }

    const score = aggregateScore(levelResults);
    const passed = !hasFatal && !hasError;

    const report: ValidationReport = {
      revision,
      stage,
      score,
      passed,
      errors: allErrors,
      warnings: allWarnings,
      recommendations: [...new Set(allRecommendations)],
      durationMs: Date.now() - started,
      cached: false,
      hasFatal,
      hasError,
    };

    this.cache.set(cacheKey, report);
    return report;
  }
}

function mergeLevelResults(level: ValidationLevelId, parts: ValidationResult[]): ValidationResult {
  const errors = parts.flatMap((p) => p.errors);
  const warnings = parts.flatMap((p) => p.warnings);
  const recommendations = parts.flatMap((p) => p.recommendations);
  const hasFatal = errors.some((e) => e.severity === "fatal");
  const hasError = errors.some((e) => e.severity === "error");
  return {
    passed: !hasFatal && !hasError,
    score: parts.length ? Math.min(...parts.map((p) => p.score)) : 100,
    level,
    errors,
    warnings,
    recommendations,
  };
}

/** Group consecutive rules: parallelGroup runs together, others solo */
function groupRulesForParallel(rules: ValidationRule[]): ValidationRule[][] {
  const groups: ValidationRule[][] = [];
  const byGroup = new Map<string, ValidationRule[]>();

  for (const rule of rules) {
    if (rule.parallelGroup) {
      const list = byGroup.get(rule.parallelGroup) ?? [];
      list.push(rule);
      byGroup.set(rule.parallelGroup, list);
    } else {
      groups.push([rule]);
    }
  }

  for (const list of byGroup.values()) {
    groups.push(list);
  }

  return groups.sort((a, b) => a[0]!.priority - b[0]!.priority);
}

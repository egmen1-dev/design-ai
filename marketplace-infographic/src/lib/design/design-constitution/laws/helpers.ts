import type {
  ConstitutionContext,
  ConstitutionPatch,
  DesignLaw,
  LawCategory,
  LawSeverity,
  LawValidationResult,
  ConstitutionSetId,
  ConstitutionStage,
} from "../types";

export function createLaw(input: {
  id: string;
  name: string;
  category: LawCategory;
  severity: LawSeverity;
  description: string;
  stages: ConstitutionStage[];
  sets?: ConstitutionSetId[];
  validate: (ctx: ConstitutionContext) => LawValidationResult;
  correct: (ctx: ConstitutionContext, result: LawValidationResult) => ConstitutionPatch;
}): DesignLaw {
  return {
    version: "1.0",
    sets: input.sets ?? ["core_v1", "marketplace_v1", "luxury_v2"],
    ...input,
  };
}

export function pass(metrics?: Record<string, number>): LawValidationResult {
  return { passed: true, metrics };
}

export function fail(reason: string, metrics?: Record<string, number>): LawValidationResult {
  return { passed: false, reason, metrics };
}

export function patchPriority(severity: LawSeverity): number {
  if (severity === "critical") return 100;
  if (severity === "major") return 60;
  return 30;
}

export function layoutPatch(
  patch: ConstitutionPatch["layoutSpecPatch"],
  severity: LawSeverity,
): ConstitutionPatch {
  return { layoutSpecPatch: patch, priority: patchPriority(severity) };
}

export function scenePatch(
  patch: ConstitutionPatch["sceneBlueprintPatch"],
  severity: LawSeverity,
): ConstitutionPatch {
  return { sceneBlueprintPatch: patch, priority: patchPriority(severity) };
}

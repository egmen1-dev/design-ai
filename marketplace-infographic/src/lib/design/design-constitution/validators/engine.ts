import type {
  ConstitutionContext,
  ConstitutionPatch,
  ConstitutionReport,
  ConstitutionScores,
  ConstitutionValidationResult,
  ConstitutionViolation,
  DesignLaw,
  LawReportEntry,
} from "../types";
import { CONSTITUTION_PASS_THRESHOLD, CONSTITUTION_VERSION } from "../types";
import { lawsForSet, CONSTITUTION_SETS } from "../versions";
import { mergeConstitutionPatches } from "../patches/engine";
import { computeConstitutionScores, scoresPassThreshold } from "../scores/engine";

function violationFromLaw(
  law: DesignLaw,
  reason: string,
  patch: ConstitutionPatch,
): ConstitutionViolation {
  return {
    lawId: law.id,
    lawName: law.name,
    category: law.category,
    severity: law.severity,
    reason,
    recommendedPatch: patch,
    priority: patch.priority,
  };
}

export function validateConstitution(ctx: ConstitutionContext): ConstitutionValidationResult {
  const setDef = CONSTITUTION_SETS[ctx.constitutionId];
  const laws = lawsForSet(ctx.constitutionId).filter((l) => l.stages.includes(ctx.stage));

  const entries: LawReportEntry[] = [];
  const violations: ConstitutionViolation[] = [];
  const patches: ConstitutionPatch[] = [];

  for (const law of laws) {
    const result = law.validate(ctx);
    if (result.passed) {
      entries.push({
        lawId: law.id,
        lawName: law.name,
        passed: true,
        severity: law.severity,
      });
      continue;
    }

    const patch = law.correct(ctx, result);
    patches.push(patch);
    violations.push(violationFromLaw(law, result.reason ?? law.description, patch));
    entries.push({
      lawId: law.id,
      lawName: law.name,
      passed: false,
      severity: law.severity,
      reason: result.reason,
      patchApplied: true,
      patchSummary: summarizePatch(patch),
    });
  }

  const scores = computeConstitutionScores({ violations, laws, ctx });
  const combinedPatch = mergeConstitutionPatches(patches);
  const criticalFail = violations.some((v) => v.severity === "critical");
  const passed = !criticalFail && scoresPassThreshold(scores, CONSTITUTION_PASS_THRESHOLD);

  const report: ConstitutionReport = {
    constitutionId: ctx.constitutionId,
    constitutionVersion: setDef.version,
    stage: ctx.stage,
    passed,
    overallDesignScore: scores.overallDesignScore,
    scores,
    entries,
    violations,
    patchesApplied: patches,
    attempts: 1,
  };

  return { passed, report, combinedPatch };
}

export function summarizePatch(patch: ConstitutionPatch): string {
  const parts: string[] = [];
  const lp = patch.layoutSpecPatch;
  if (lp?.heroScaleDelta) parts.push(`hero scale ${lp.heroScaleDelta > 0 ? "+" : ""}${Math.round(lp.heroScaleDelta * 100)}%`);
  if (lp?.whitespaceTarget) parts.push(`whitespace target ${lp.whitespaceTarget}%`);
  if (lp?.reduceObjectCount) parts.push(`reduce objects by ${lp.reduceObjectCount}`);
  if (lp?.removeDecorations) parts.push("remove decorations");
  if (patch.sceneBlueprintPatch?.enforceGroundPlane) parts.push("enforce ground plane");
  if (patch.sceneBlueprintPatch?.disableParticles) parts.push("disable particles");
  if (patch.promptRecompile) parts.push("recompile prompt");
  return parts.join("; ") || "adjust layout";
}

export function formatConstitutionReport(report: ConstitutionReport): string {
  const lines = report.entries.map((e) => {
    const icon = e.passed ? "✔" : "✘";
    const tail = e.passed
      ? "passed"
      : `${e.reason ?? "failed"}. Patch: ${e.patchSummary ?? "none"}`;
    return `${icon} ${e.lawId} ${e.lawName} — ${tail}`;
  });
  return [
    `Constitution ${report.constitutionId} v${report.constitutionVersion} [${report.stage}]`,
    `OverallDesignScore: ${report.overallDesignScore}/100 (${report.passed ? "PASSED" : "FAILED"})`,
    ...lines,
  ].join("\n");
}

export function revalidateAfterPatch(
  ctx: ConstitutionContext,
  previous: ConstitutionReport,
): ConstitutionValidationResult {
  const next = validateConstitution(ctx);
  next.report.attempts = previous.attempts + 1;
  next.report.revalidated = true;
  return next;
}

export { computeConstitutionScores, scoresPassThreshold };

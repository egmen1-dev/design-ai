import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { ConstitutionReport, ConstitutionValidationResult } from "@/lib/design/design-constitution";
import { validateWithCorrection } from "@/lib/design/design-constitution/validators/pipeline";
import { buildConstitutionContext } from "@/lib/design/design-constitution/validators/pipeline";
import {
  applySceneBlueprintPatch,
  applyConstitutionLayoutPatch,
} from "@/lib/design/design-constitution/patches/engine";
import type { FinalDesignBlueprint } from "../blueprint/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import {
  GOVERNANCE_CONSTITUTION_THRESHOLD,
  GOVERNANCE_CONSTITUTION_MAX_ATTEMPTS,
} from "../config";
import { sanitizeBlueprintForConstitution } from "./sanitize";
import { LAYOUT_HARD_LAW_IDS, layoutPassesHardLaws, escalateLayoutSpec } from "./layout-harden";

/** Scene-stage laws that must be physically enforced on the blueprint, not only scored */
const SCENE_HARD_LAW_IDS = new Set(["LAW_010", "LAW_012"]);

export class GovernanceBlockedError extends Error {
  readonly code = "GOVERNANCE_BLOCKED";
  readonly stage: string;
  readonly reports: ConstitutionReport[];

  constructor(message: string, stage: string, reports: ConstitutionReport[]) {
    super(message);
    this.name = "GovernanceBlockedError";
    this.stage = stage;
    this.reports = reports;
  }
}

export type MandatoryConstitutionResult = {
  passed: boolean;
  reports: ConstitutionReport[];
  blueprint: FinalDesignBlueprint;
  validation: ConstitutionValidationResult;
};


function hasUnfixedSceneCriticalViolations(
  report: ConstitutionReport,
  sceneBlueprint?: SceneBlueprint,
): boolean {
  const critical = report.violations.filter((v) => v.severity === "critical");
  if (critical.length === 0) return false;

  if (sceneBlueprint) {
    const floatingOnly = critical.every((v) => SCENE_HARD_LAW_IDS.has(v.lawId));
    if (
      floatingOnly &&
      sceneBlueprint.productInteraction.groundPlane &&
      sceneBlueprint.productInteraction.softShadow
    ) {
      return false;
    }
  }

  return true;
}

function hasUnfixedLayoutCriticalViolations(
  report: ConstitutionReport,
  layoutSpec?: LayoutSpec,
): boolean {
  const critical = report.violations.filter((v) => v.severity === "critical");
  if (critical.length === 0) return false;

  if (layoutSpec) {
    const layoutOnly = critical.every((v) => LAYOUT_HARD_LAW_IDS.has(v.lawId));
    if (layoutOnly && layoutPassesHardLaws(layoutSpec)) {
      return false;
    }
  }

  return true;
}

function governanceStagePassed(
  validation: ConstitutionValidationResult,
  options?: { sceneBlueprint?: SceneBlueprint; layoutSpec?: LayoutSpec },
): boolean {
  const critical = validation.report.violations.filter((v) => v.severity === "critical");
  if (critical.length > 0) {
    if (
      options?.sceneBlueprint &&
      hasUnfixedSceneCriticalViolations(validation.report, options.sceneBlueprint)
    ) {
      return false;
    }
    if (
      options?.layoutSpec &&
      hasUnfixedLayoutCriticalViolations(validation.report, options.layoutSpec)
    ) {
      return false;
    }
    if (!options?.sceneBlueprint && !options?.layoutSpec) return false;
  }
  if (validation.passed) return true;
  return validation.report.overallDesignScore >= GOVERNANCE_CONSTITUTION_THRESHOLD;
}

function applyViolationPatches(input: {
  report: ConstitutionReport;
  sceneBlueprint?: SceneBlueprint;
  layoutSpec?: LayoutSpec;
  severities?: Array<"critical" | "major" | "minor">;
}): { sceneBlueprint?: SceneBlueprint; layoutSpec?: LayoutSpec } {
  let sceneBlueprint = input.sceneBlueprint;
  let layoutSpec = input.layoutSpec;
  const allowed = input.severities ?? ["critical", "major", "minor"];

  for (const violation of input.report.violations.filter((v) => allowed.includes(v.severity))) {
    const patch = violation.recommendedPatch;
    if (patch.sceneBlueprintPatch && sceneBlueprint) {
      sceneBlueprint = applySceneBlueprintPatch(sceneBlueprint, patch.sceneBlueprintPatch);
    }
    if (patch.layoutSpecPatch && layoutSpec) {
      layoutSpec = applyConstitutionLayoutPatch(layoutSpec, patch.layoutSpecPatch);
    }
  }

  return { sceneBlueprint, layoutSpec };
}

function stageOptions(
  stage: ReturnType<typeof buildConstitutionContext>["stage"],
  sceneBlueprint?: SceneBlueprint,
  layoutSpec?: LayoutSpec,
) {
  return stage === "layout_spec" ? { layoutSpec } : { sceneBlueprint };
}

function applyCorrectionPatches(input: {
  validation: ConstitutionValidationResult;
  sceneBlueprint?: SceneBlueprint;
  layoutSpec?: LayoutSpec;
}): { sceneBlueprint?: SceneBlueprint; layoutSpec?: LayoutSpec; changed: boolean } {
  let sceneBlueprint = input.sceneBlueprint;
  let layoutSpec = input.layoutSpec;
  let changed = false;

  const combined = input.validation.combinedPatch;
  if (combined.sceneBlueprintPatch && sceneBlueprint) {
    const next = applySceneBlueprintPatch(sceneBlueprint, combined.sceneBlueprintPatch);
    changed = changed || next !== sceneBlueprint;
    sceneBlueprint = next;
  }
  if (combined.layoutSpecPatch && layoutSpec) {
    const next = applyConstitutionLayoutPatch(layoutSpec, combined.layoutSpecPatch);
    changed = changed || next !== layoutSpec;
    layoutSpec = next;
  }

  const patched = applyViolationPatches({
    report: input.validation.report,
    sceneBlueprint,
    layoutSpec,
    severities: ["critical", "major", "minor"],
  });
  if (patched.sceneBlueprint !== sceneBlueprint) {
    changed = true;
    sceneBlueprint = patched.sceneBlueprint;
  }
  if (patched.layoutSpec !== layoutSpec) {
    changed = true;
    layoutSpec = patched.layoutSpec;
  }

  return { sceneBlueprint, layoutSpec, changed };
}

function runGovernanceStageCorrection(input: {
  ctx: ReturnType<typeof buildConstitutionContext>;
  sceneBlueprint?: SceneBlueprint;
  layoutSpec?: LayoutSpec;
}) {
  let sceneBlueprint = input.sceneBlueprint ?? input.ctx.sceneBlueprint;
  let layoutSpec = input.layoutSpec ?? input.ctx.layoutSpec;
  let result = validateWithCorrection({ ctx: input.ctx, sceneBlueprint, layoutSpec });

  let lastScore = -1;
  let stagnantRounds = 0;
  let escalationRound = 0;

  for (let attempt = 1; attempt <= GOVERNANCE_CONSTITUTION_MAX_ATTEMPTS; attempt++) {
    const options = stageOptions(input.ctx.stage, sceneBlueprint, layoutSpec);
    if (governanceStagePassed(result.validation, options)) break;

    const score = result.report.overallDesignScore;
    stagnantRounds = score === lastScore ? stagnantRounds + 1 : 0;
    lastScore = score;

    let changed = false;
    if (stagnantRounds >= 1) {
      if (input.ctx.stage === "layout_spec" && layoutSpec) {
        const escalated = escalateLayoutSpec(layoutSpec, escalationRound);
        changed = escalated !== layoutSpec;
        layoutSpec = escalated;
        escalationRound++;
      } else if (sceneBlueprint) {
        const escalated = applySceneBlueprintPatch(sceneBlueprint, {
          enforceGroundPlane: true,
          disableParticles: true,
          reduceDecorativeDensity: 0.04 + escalationRound * 0.02,
          reduceBackgroundComplexity: true,
          capLightSources: 2,
        });
        changed = changed || escalated !== sceneBlueprint;
        sceneBlueprint = escalated;
        escalationRound++;
      }
    }

    const patched = applyCorrectionPatches({
      validation: result.validation,
      sceneBlueprint,
      layoutSpec,
    });
    sceneBlueprint = patched.sceneBlueprint ?? sceneBlueprint;
    layoutSpec = patched.layoutSpec ?? layoutSpec;
    changed = changed || patched.changed;

    if (!changed) break;

    result = validateWithCorrection({ ctx: input.ctx, sceneBlueprint, layoutSpec });
    result.report.attempts = attempt + 1;
  }

  return { ...result, sceneBlueprint, layoutSpec };
}

/** Constitution is mandatory — render blocked until PASS after auto-fix */
export function runMandatoryConstitution(input: {
  blueprint: FinalDesignBlueprint;
  analysis: ProductAnalysis;
  compositionScore?: number;
  sceneScore?: number;
  luxuryScore?: number;
}): MandatoryConstitutionResult {
  const reports: ConstitutionReport[] = [];

  const sanitized = sanitizeBlueprintForConstitution({
    sceneBlueprint: input.blueprint.sceneBlueprint,
    layoutSpec: input.blueprint.layoutSpec,
  });

  let workingBlueprint: FinalDesignBlueprint = {
    ...input.blueprint,
    sceneBlueprint: sanitized.sceneBlueprint,
    layoutSpec: sanitized.layoutSpec,
  };

  const sceneCtx = buildConstitutionContext("scene_blueprint", {
    analysis: input.analysis,
    sceneBlueprint: workingBlueprint.sceneBlueprint,
    sceneScore: input.sceneScore,
  });
  const sceneResult = runGovernanceStageCorrection({
    ctx: sceneCtx,
    sceneBlueprint: workingBlueprint.sceneBlueprint,
  });
  reports.push({
    ...sceneResult.report,
    passed: governanceStagePassed(sceneResult.validation, {
      sceneBlueprint: sceneResult.sceneBlueprint,
    }),
  });

  if (
    !governanceStagePassed(sceneResult.validation, {
      sceneBlueprint: sceneResult.sceneBlueprint,
    })
  ) {
    const criticalIds = sceneResult.report.violations
      .filter((v) => v.severity === "critical")
      .map((v) => v.lawId)
      .join(", ");
    throw new GovernanceBlockedError(
      `Constitution FAIL at scene_blueprint (score ${sceneResult.report.overallDesignScore}, need ${GOVERNANCE_CONSTITUTION_THRESHOLD}+ or fix critical laws${criticalIds ? `: ${criticalIds}` : ""})`,
      "scene_blueprint",
      reports,
    );
  }

  workingBlueprint = {
    ...workingBlueprint,
    sceneBlueprint: sceneResult.sceneBlueprint ?? workingBlueprint.sceneBlueprint,
  };

  const layoutCtx = buildConstitutionContext("layout_spec", {
    analysis: input.analysis,
    layoutSpec: workingBlueprint.layoutSpec,
    sceneBlueprint: workingBlueprint.sceneBlueprint,
    compositionScore: input.compositionScore,
  });
  const layoutResult = runGovernanceStageCorrection({
    ctx: layoutCtx,
    layoutSpec: workingBlueprint.layoutSpec,
    sceneBlueprint: workingBlueprint.sceneBlueprint,
  });
  reports.push({
    ...layoutResult.report,
    passed: governanceStagePassed(layoutResult.validation, {
      layoutSpec: layoutResult.layoutSpec,
    }),
  });

  if (
    !governanceStagePassed(layoutResult.validation, {
      layoutSpec: layoutResult.layoutSpec,
    })
  ) {
    const criticalIds = layoutResult.report.violations
      .filter((v) => v.severity === "critical")
      .map((v) => v.lawId)
      .join(", ");
    throw new GovernanceBlockedError(
      `Constitution FAIL at layout_spec (score ${layoutResult.report.overallDesignScore}, need ${GOVERNANCE_CONSTITUTION_THRESHOLD}+ or fix critical laws${criticalIds ? `: ${criticalIds}` : ""})`,
      "layout_spec",
      reports,
    );
  }

  const syncedBlueprint: FinalDesignBlueprint = {
    ...workingBlueprint,
    sceneBlueprint: sceneResult.sceneBlueprint ?? workingBlueprint.sceneBlueprint,
    layoutSpec: layoutResult.layoutSpec ?? workingBlueprint.layoutSpec,
  };

  console.info(
    `[design-governance] Constitution PASS scene=${sceneResult.report.overallDesignScore} layout=${layoutResult.report.overallDesignScore} (threshold ${GOVERNANCE_CONSTITUTION_THRESHOLD}, attempts scene=${sceneResult.report.attempts} layout=${layoutResult.report.attempts})`,
  );

  return {
    passed: true,
    reports,
    blueprint: syncedBlueprint,
    validation: layoutResult.validation,
  };
}

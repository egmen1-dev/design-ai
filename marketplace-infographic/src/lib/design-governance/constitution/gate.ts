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

function governanceStagePassed(
  validation: ConstitutionValidationResult,
  sceneBlueprint?: SceneBlueprint,
): boolean {
  const critical = validation.report.violations.filter((v) => v.severity === "critical");
  if (critical.length > 0) {
    if (sceneBlueprint && hasUnfixedSceneCriticalViolations(validation.report, sceneBlueprint)) {
      return false;
    }
    if (!sceneBlueprint) return false;
  }
  if (validation.passed) return true;
  return validation.report.overallDesignScore >= GOVERNANCE_CONSTITUTION_THRESHOLD;
}

function applyCriticalViolationPatches(input: {
  report: ConstitutionReport;
  sceneBlueprint?: SceneBlueprint;
  layoutSpec?: LayoutSpec;
}): { sceneBlueprint?: SceneBlueprint; layoutSpec?: LayoutSpec } {
  let sceneBlueprint = input.sceneBlueprint;
  let layoutSpec = input.layoutSpec;

  for (const violation of input.report.violations.filter((v) => v.severity === "critical")) {
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

function runGovernanceStageCorrection(input: {
  ctx: ReturnType<typeof buildConstitutionContext>;
  sceneBlueprint?: SceneBlueprint;
  layoutSpec?: LayoutSpec;
}) {
  let sceneBlueprint = input.sceneBlueprint ?? input.ctx.sceneBlueprint;
  let layoutSpec = input.layoutSpec ?? input.ctx.layoutSpec;
  let result = validateWithCorrection({ ctx: input.ctx, sceneBlueprint, layoutSpec });

  for (let attempt = 1; attempt < GOVERNANCE_CONSTITUTION_MAX_ATTEMPTS; attempt++) {
    if (governanceStagePassed(result.validation, sceneBlueprint)) break;
    const patch = result.validation.combinedPatch;
    if (!patch.sceneBlueprintPatch && !patch.layoutSpecPatch) {
      const forced = applyCriticalViolationPatches({
        report: result.report,
        sceneBlueprint,
        layoutSpec,
      });
      if (
        forced.sceneBlueprint === sceneBlueprint &&
        forced.layoutSpec === layoutSpec
      ) {
        break;
      }
      sceneBlueprint = forced.sceneBlueprint ?? sceneBlueprint;
      layoutSpec = forced.layoutSpec ?? layoutSpec;
    } else {
      if (patch.sceneBlueprintPatch && sceneBlueprint) {
        sceneBlueprint = applySceneBlueprintPatch(sceneBlueprint, patch.sceneBlueprintPatch);
      }
      if (patch.layoutSpecPatch && layoutSpec) {
        layoutSpec = applyConstitutionLayoutPatch(layoutSpec, patch.layoutSpecPatch);
      }
    }
    result = validateWithCorrection({ ctx: input.ctx, sceneBlueprint, layoutSpec });
    result.report.attempts = attempt + 1;
  }

  if (!governanceStagePassed(result.validation, sceneBlueprint)) {
    const forced = applyCriticalViolationPatches({
      report: result.report,
      sceneBlueprint,
      layoutSpec,
    });
    if (
      forced.sceneBlueprint !== sceneBlueprint ||
      forced.layoutSpec !== layoutSpec
    ) {
      sceneBlueprint = forced.sceneBlueprint ?? sceneBlueprint;
      layoutSpec = forced.layoutSpec ?? layoutSpec;
      result = validateWithCorrection({ ctx: input.ctx, sceneBlueprint, layoutSpec });
    }
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
    passed: governanceStagePassed(sceneResult.validation, sceneResult.sceneBlueprint),
  });

  if (!governanceStagePassed(sceneResult.validation, sceneResult.sceneBlueprint)) {
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
    passed: governanceStagePassed(layoutResult.validation),
  });

  if (!governanceStagePassed(layoutResult.validation)) {
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
    `[design-governance] Constitution PASS scene=${sceneResult.report.overallDesignScore} layout=${layoutResult.report.overallDesignScore} (threshold ${GOVERNANCE_CONSTITUTION_THRESHOLD})`,
  );

  return {
    passed: true,
    reports,
    blueprint: syncedBlueprint,
    validation: layoutResult.validation,
  };
}

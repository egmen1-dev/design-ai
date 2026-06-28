import type { ConstitutionReport, ConstitutionValidationResult } from "@/lib/design/design-constitution";
import { validateWithCorrection } from "@/lib/design/design-constitution/validators/pipeline";
import { buildConstitutionContext } from "@/lib/design/design-constitution/validators/pipeline";
import type { FinalDesignBlueprint } from "../blueprint/types";
import type { ProductAnalysis } from "@/lib/product-analysis";

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

/** Constitution is mandatory — render blocked until PASS after auto-fix */
export function runMandatoryConstitution(input: {
  blueprint: FinalDesignBlueprint;
  analysis: ProductAnalysis;
  compositionScore?: number;
  sceneScore?: number;
  luxuryScore?: number;
}): MandatoryConstitutionResult {
  const reports: ConstitutionReport[] = [];

  const sceneCtx = buildConstitutionContext("scene_blueprint", {
    analysis: input.analysis,
    sceneBlueprint: input.blueprint.sceneBlueprint,
    sceneScore: input.sceneScore,
  });
  const sceneResult = validateWithCorrection({
    ctx: sceneCtx,
    sceneBlueprint: input.blueprint.sceneBlueprint,
  });
  reports.push(sceneResult.report);

  if (!sceneResult.validation.passed) {
    throw new GovernanceBlockedError(
      `Constitution FAIL at scene_blueprint (score ${sceneResult.report.overallDesignScore})`,
      "scene_blueprint",
      reports,
    );
  }

  const layoutCtx = buildConstitutionContext("layout_spec", {
    analysis: input.analysis,
    layoutSpec: input.blueprint.layoutSpec,
    sceneBlueprint: sceneResult.sceneBlueprint ?? input.blueprint.sceneBlueprint,
    compositionScore: input.compositionScore,
  });
  const layoutResult = validateWithCorrection({
    ctx: layoutCtx,
    layoutSpec: input.blueprint.layoutSpec,
    sceneBlueprint: sceneResult.sceneBlueprint ?? input.blueprint.sceneBlueprint,
  });
  reports.push(layoutResult.report);

  if (!layoutResult.validation.passed) {
    throw new GovernanceBlockedError(
      `Constitution FAIL at layout_spec (score ${layoutResult.report.overallDesignScore})`,
      "layout_spec",
      reports,
    );
  }

  const syncedBlueprint: FinalDesignBlueprint = {
    ...input.blueprint,
    sceneBlueprint: sceneResult.sceneBlueprint ?? input.blueprint.sceneBlueprint,
    layoutSpec: layoutResult.layoutSpec ?? input.blueprint.layoutSpec,
  };

  return {
    passed: true,
    reports,
    blueprint: syncedBlueprint,
    validation: layoutResult.validation,
  };
}

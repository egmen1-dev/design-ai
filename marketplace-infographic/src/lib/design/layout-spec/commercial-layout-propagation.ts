import type { LayoutSpec } from "./types";
import {
  GEOMETRY_CEILING_OBJECT_SCALE,
  productionObjectScaleFromReachable,
  PRODUCT_AREA_RECALIBRATION_VERSION,
} from "./commercial-target-propagation";

export const COMMERCIAL_PROPAGATION_VERSION = "1.1.0-sprint8c";

export type CommercialScaleSource = "commercial" | "template" | "legacy";

export type CommercialLayoutPropagationDiagnostics = {
  commercialLayoutPropagation: boolean;
  commercialScaleSource: CommercialScaleSource;
  commercialScaleExpected: number;
  commercialScaleApplied: number;
  commercialScaleDelta: number;
  commercialPropagationVersion: string;
  commercialPropagationWarnings: string[];
  /** Sprint 8C — reachable target from LayoutSpec (fidelity) */
  commercialReachableTargetPct?: number;
  /** Sprint 8C — aspirational EKB target (not compositor-applied) */
  commercialAspirationalTargetPct?: number;
  commercialPropagationMode?: string;
  productAreaRecalibrationVersion?: string;
};

const LEGACY_DEFAULT_AREA_PCT = 65;

function clampTemplateObjectScale(pct: number): number {
  return Math.min(0.62, Math.max(0.5, pct / 100));
}

function hasCommercialLayoutIntent(layoutSpec?: LayoutSpec): boolean {
  return (layoutSpec?.commercialLayout?.commercialIntentApplied?.length ?? 0) > 0;
}

function commercialAreaPct(layoutSpec: LayoutSpec): number | undefined {
  if (layoutSpec.reachableProductAreaPct != null) {
    return layoutSpec.reachableProductAreaPct;
  }
  if (layoutSpec.productAreaPct != null) {
    return layoutSpec.productAreaPct;
  }
  if (layoutSpec.heroScale != null) {
    return Math.round(layoutSpec.heroScale * 100);
  }
  return undefined;
}

function aspirationalAreaPct(layoutSpec: LayoutSpec): number | undefined {
  return layoutSpec.aspirationalProductAreaPct;
}

/**
 * Resolves compositor objectScale from stabilized LayoutSpec with template fallback.
 * Commercial path harvests geometry ceiling (Sprint 8C) — does not pursue aspirational 55%.
 */
export function resolveLayoutObjectScale(input: {
  layoutSpec?: LayoutSpec;
  templateAreaPct?: number;
}): { objectScale: number; diagnostics: CommercialLayoutPropagationDiagnostics } {
  const warnings: string[] = [];
  const templatePct = input.templateAreaPct;
  const templateScale =
    templatePct != null ? clampTemplateObjectScale(templatePct) : undefined;

  let source: CommercialScaleSource = "legacy";
  let expectedPct = LEGACY_DEFAULT_AREA_PCT;
  let objectScale = clampTemplateObjectScale(LEGACY_DEFAULT_AREA_PCT);
  let propagationMode: string | undefined;
  let reachablePct: number | undefined;
  let aspirationalPct: number | undefined;

  if (hasCommercialLayoutIntent(input.layoutSpec) && input.layoutSpec) {
    const commercialPct = commercialAreaPct(input.layoutSpec);
    aspirationalPct = aspirationalAreaPct(input.layoutSpec);
    if (commercialPct != null) {
      source = "commercial";
      expectedPct = commercialPct;
      const harvest = productionObjectScaleFromReachable(commercialPct / 100);
      objectScale = harvest.objectScale;
      reachablePct = harvest.reachableTargetPct;
      propagationMode = harvest.propagationMode;
      if (aspirationalPct != null && aspirationalPct > reachablePct + 5) {
        warnings.push(
          `aspirational target ${aspirationalPct}% exceeds reachable ${reachablePct}% — compositor uses geometry ceiling harvest @ objectScale=${GEOMETRY_CEILING_OBJECT_SCALE}`,
        );
      }
    } else {
      warnings.push(
        "Commercial LayoutSpec received but reachable product area unresolved — falling back to template",
      );
    }
  }

  if (source !== "commercial") {
    if (templatePct != null) {
      source = "template";
      expectedPct = templatePct;
      objectScale = clampTemplateObjectScale(templatePct);
    } else {
      source = "legacy";
      expectedPct = LEGACY_DEFAULT_AREA_PCT;
      objectScale = clampTemplateObjectScale(LEGACY_DEFAULT_AREA_PCT);
    }
  }

  const delta =
    templateScale != null ? Math.round((objectScale - templateScale) * 1000) / 1000 : 0;

  if (
    hasCommercialLayoutIntent(input.layoutSpec) &&
    input.layoutSpec?.reachableProductAreaPct != null &&
    source !== "commercial"
  ) {
    warnings.push(
      `ASSERT: reachableProductAreaPct=${input.layoutSpec.reachableProductAreaPct} present but source=${source}`,
    );
  }

  if (source === "commercial" && templatePct != null && Math.abs(expectedPct - templatePct) < 0.5) {
    warnings.push(
      "Commercial and template product area are nearly identical; propagation change may be invisible",
    );
  }

  return {
    objectScale,
    diagnostics: {
      commercialLayoutPropagation: source === "commercial",
      commercialScaleSource: source,
      commercialScaleExpected: expectedPct,
      commercialScaleApplied: objectScale,
      commercialScaleDelta: delta,
      commercialPropagationVersion: COMMERCIAL_PROPAGATION_VERSION,
      commercialPropagationWarnings: warnings,
      commercialReachableTargetPct: reachablePct,
      commercialAspirationalTargetPct: aspirationalPct,
      commercialPropagationMode: propagationMode,
      productAreaRecalibrationVersion: PRODUCT_AREA_RECALIBRATION_VERSION,
    },
  };
}

/** @deprecated use resolveLayoutObjectScale — legacy template-only helper */
export function layoutObjectScaleFromTemplate(areaPct?: number): number {
  return resolveLayoutObjectScale({ templateAreaPct: areaPct }).objectScale;
}

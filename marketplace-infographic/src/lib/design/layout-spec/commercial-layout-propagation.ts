import type { LayoutSpec } from "./types";

export const COMMERCIAL_PROPAGATION_VERSION = "1.0.0-sprint6b";

export type CommercialScaleSource = "commercial" | "template" | "legacy";

export type CommercialLayoutPropagationDiagnostics = {
  commercialLayoutPropagation: boolean;
  commercialScaleSource: CommercialScaleSource;
  commercialScaleExpected: number;
  commercialScaleApplied: number;
  commercialScaleDelta: number;
  commercialPropagationVersion: string;
  commercialPropagationWarnings: string[];
};

const LEGACY_DEFAULT_AREA_PCT = 65;

function clampObjectScale(pct: number): number {
  return Math.min(0.62, Math.max(0.5, pct / 100));
}

function hasCommercialLayoutIntent(layoutSpec?: LayoutSpec): boolean {
  return (layoutSpec?.commercialLayout?.commercialIntentApplied?.length ?? 0) > 0;
}

function commercialAreaPct(layoutSpec: LayoutSpec): number | undefined {
  if (layoutSpec.productAreaPct != null) {
    return layoutSpec.productAreaPct;
  }
  if (layoutSpec.heroScale != null) {
    return Math.round(layoutSpec.heroScale * 100);
  }
  return undefined;
}

/**
 * Resolves compositor objectScale from stabilized LayoutSpec with template fallback.
 * Read-only propagation — does not mutate LayoutSpec or compositor algorithms.
 */
export function resolveLayoutObjectScale(input: {
  layoutSpec?: LayoutSpec;
  templateAreaPct?: number;
}): { objectScale: number; diagnostics: CommercialLayoutPropagationDiagnostics } {
  const warnings: string[] = [];
  const templatePct = input.templateAreaPct;
  const templateScale =
    templatePct != null ? clampObjectScale(templatePct) : undefined;

  let source: CommercialScaleSource = "legacy";
  let expectedPct = LEGACY_DEFAULT_AREA_PCT;

  if (hasCommercialLayoutIntent(input.layoutSpec) && input.layoutSpec) {
    const commercialPct = commercialAreaPct(input.layoutSpec);
    if (commercialPct != null) {
      source = "commercial";
      expectedPct = commercialPct;
    } else {
      warnings.push(
        "Commercial LayoutSpec received but productAreaPct/heroScale unresolved — falling back to template",
      );
    }
  }

  if (source !== "commercial") {
    if (templatePct != null) {
      source = "template";
      expectedPct = templatePct;
    } else {
      source = "legacy";
      expectedPct = LEGACY_DEFAULT_AREA_PCT;
    }
  }

  const objectScale = clampObjectScale(expectedPct);
  const delta =
    templateScale != null ? Math.round((objectScale - templateScale) * 1000) / 1000 : 0;

  if (
    hasCommercialLayoutIntent(input.layoutSpec) &&
    input.layoutSpec?.productAreaPct != null &&
    source !== "commercial"
  ) {
    warnings.push(
      `ASSERT: commercial productAreaPct=${input.layoutSpec.productAreaPct} present but source=${source}`,
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
    },
  };
}

/** @deprecated use resolveLayoutObjectScale — legacy template-only helper */
export function layoutObjectScaleFromTemplate(areaPct?: number): number {
  return resolveLayoutObjectScale({ templateAreaPct: areaPct }).objectScale;
}

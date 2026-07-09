import {
  deriveCommercialExpectations,
  deriveProductAreaTargets,
  resolveMeasurementZones,
} from "./expectations";
import { measureImageCommercialSignals } from "./measure";
import type {
  CommercialFidelityDiagnostics,
  CommercialFidelityInput,
  CommercialFidelityReport,
  FidelityParameterId,
  FidelityParameterResult,
  FidelityStatus,
} from "./types";
import { COMMERCIAL_FIDELITY_VERSION } from "./types";

const PARAMETER_LABELS: Record<FidelityParameterId, string> = {
  product_area: "Product Area",
  product_dominance: "Product Dominance",
  visual_hierarchy: "Visual Hierarchy",
  background_separation: "Background Separation",
  scene_consistency: "Scene Consistency",
};

const THRESHOLDS: Record<FidelityParameterId, { warn: number; error: number }> = {
  product_area: { warn: 6, error: 12 },
  product_dominance: { warn: 10, error: 20 },
  visual_hierarchy: { warn: 10, error: 20 },
  background_separation: { warn: 12, error: 22 },
  scene_consistency: { warn: 15, error: 28 },
};

function statusForDelta(
  parameter: FidelityParameterId,
  delta: number,
  measurable = true,
): FidelityStatus {
  if (!measurable) return "UNMEASURABLE";
  const abs = Math.abs(delta);
  const t = THRESHOLDS[parameter];
  if (abs >= t.error) return "ERROR";
  if (abs >= t.warn) return "WARNING";
  return "OK";
}

function scoreFromParameters(parameters: FidelityParameterResult[]): number {
  const measurable = parameters.filter((p) => p.status !== "UNMEASURABLE");
  if (!measurable.length) return 0;
  const sum = measurable.reduce((acc, p) => {
    const penalty = Math.min(100, Math.abs(p.delta) * 2.5);
    return acc + Math.max(0, 100 - penalty);
  }, 0);
  return Math.round((sum / measurable.length) * 10) / 10;
}

function buildImprovementCandidates(parameters: FidelityParameterResult[]): string[] {
  const candidates: string[] = [];
  for (const p of parameters) {
    if (p.status === "OK") continue;
    switch (p.parameter) {
      case "product_area":
        candidates.push(
          p.delta < 0
            ? "Hero zone clutter or weak compositing floor reduces effective product area"
            : "Hero zone over-filled relative to commercial product area target",
        );
        break;
      case "product_dominance":
        candidates.push(
          "Product zone lacks visual dominance versus headline/background regions",
        );
        break;
      case "visual_hierarchy":
        candidates.push(
          "Visual hierarchy energy does not match commercial hero/headline priority",
        );
        break;
      case "background_separation":
        candidates.push(
          "Background palette separation between hero and headline zones is insufficient",
        );
        break;
      case "scene_consistency":
        candidates.push(
          "Generated scene atmosphere diverges from commercial scene preference",
        );
        break;
      default:
        break;
    }
  }
  return [...new Set(candidates)];
}

/**
 * Evaluates commercial fidelity — read-only measurement, never mutates pipeline.
 */
export async function evaluateCommercialFidelity(
  input: CommercialFidelityInput,
): Promise<CommercialFidelityReport> {
  const expected = deriveCommercialExpectations({
    layoutSpec: input.layoutSpec,
    visualBlueprint: input.visualBlueprint,
  });
  const productAreaTargets = deriveProductAreaTargets({
    layoutSpec: input.layoutSpec,
    visualBlueprint: input.visualBlueprint,
  });
  const zones = resolveMeasurementZones(input.layoutSpec);
  const scenePreference =
    input.layoutSpec?.scenePreference ??
    input.visualBlueprint?.commercial?.snapshot?.scenePreference;

  const measuredSignals = await measureImageCommercialSignals({
    imagePath: input.imagePath,
    heroZone: zones.hero,
    headlineZone: zones.headline,
    scenePreference,
  });

  const measured: Record<FidelityParameterId, number> = {
    product_area: measuredSignals.productAreaPct,
    product_dominance: measuredSignals.productDominanceScore,
    visual_hierarchy: measuredSignals.visualHierarchyScore,
    background_separation: measuredSignals.backgroundSeparationScore,
    scene_consistency: measuredSignals.sceneConsistencyScore,
  };

  const warnings: string[] = [];
  const errors: string[] = [];

  if (measuredSignals.measurementMode === "background") {
    warnings.push(
      "product_area measured via hero-zone clarity proxy on background image (no composited product bbox)",
    );
  }

  const parameters: FidelityParameterResult[] = (
    Object.keys(PARAMETER_LABELS) as FidelityParameterId[]
  ).map((parameter) => {
    const exp = expected[parameter];
    const meas = measured[parameter];
    const delta = Math.round((meas - exp) * 10) / 10;
    const measurable =
      parameter !== "product_area" || measuredSignals.measurementMode !== "unknown";
    const status = statusForDelta(parameter, delta, measurable);
    const unit = parameter === "product_area" ? "%" : "score";

    let notes: string | undefined;
    if (parameter === "product_area" && measuredSignals.measurementMode === "background") {
      notes = "proxy: hero-zone canvas share × clarity";
    }

    if (status === "WARNING") {
      warnings.push(`${PARAMETER_LABELS[parameter]} delta ${delta}${unit === "%" ? "%" : ""}`);
    }
    if (status === "ERROR") {
      errors.push(`${PARAMETER_LABELS[parameter]} delta ${delta}${unit === "%" ? "%" : ""}`);
    }

    return {
      parameter,
      label: PARAMETER_LABELS[parameter],
      expected: exp,
      measured: meas,
      delta,
      status,
      unit,
      notes,
    };
  });

  const diagnostics: CommercialFidelityDiagnostics = {
    commercialFidelityVersion: COMMERCIAL_FIDELITY_VERSION,
    commercialFidelityScore: scoreFromParameters(parameters),
    commercialFidelityDelta: Object.fromEntries(
      parameters.map((p) => [p.parameter, p.delta]),
    ) as CommercialFidelityDiagnostics["commercialFidelityDelta"],
    commercialExpectedValues: expected,
    commercialMeasuredValues: measured,
    commercialValidationWarnings: warnings,
    commercialValidationErrors: errors,
    commercialImprovementCandidates: buildImprovementCandidates(parameters),
    productAreaModel: {
      aspirationalTarget: productAreaTargets.aspirationalTarget,
      reachableTarget: productAreaTargets.reachableTarget,
      measuredArea: measuredSignals.productAreaPct,
      unreachableGap:
        Math.round(
          (productAreaTargets.aspirationalTarget - measuredSignals.productAreaPct) * 10,
        ) / 10,
    },
  };

  return {
    parameters,
    diagnostics,
    imagePath: input.imagePath,
    measurementMode: measuredSignals.measurementMode,
  };
}

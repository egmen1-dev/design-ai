/** Commercial Fidelity — read-only measurement layer */

export const COMMERCIAL_FIDELITY_VERSION = "1.1.0-sprint8c";

export type FidelityParameterId =
  | "product_area"
  | "product_dominance"
  | "visual_hierarchy"
  | "background_separation"
  | "scene_consistency";

export type FidelityStatus = "OK" | "WARNING" | "ERROR" | "UNMEASURABLE";

export type FidelityParameterResult = {
  parameter: FidelityParameterId;
  label: string;
  expected: number;
  measured: number;
  delta: number;
  status: FidelityStatus;
  unit: "%" | "score";
  notes?: string;
};

/** Sprint 8C — dual-target product area model */
export type ProductAreaFidelityModel = {
  aspirationalTarget: number;
  reachableTarget: number;
  measuredArea: number;
  unreachableGap: number;
};

export type CommercialFidelityDiagnostics = {
  commercialFidelityVersion: string;
  commercialFidelityScore: number;
  commercialFidelityDelta: Record<FidelityParameterId, number>;
  commercialExpectedValues: Record<FidelityParameterId, number>;
  commercialMeasuredValues: Record<FidelityParameterId, number>;
  commercialValidationWarnings: string[];
  commercialValidationErrors: string[];
  commercialImprovementCandidates: string[];
  productAreaModel?: ProductAreaFidelityModel;
};

export type CommercialFidelityReport = {
  parameters: FidelityParameterResult[];
  diagnostics: CommercialFidelityDiagnostics;
  imagePath: string;
  measurementMode: "background" | "composite" | "unknown";
};

export type CommercialFidelityInput = {
  imagePath: string;
  layoutSpec?: import("@/lib/design/layout-spec/types").LayoutSpec;
  visualBlueprint?: import("@/lib/design/visual-pipeline/types").VisualSceneBlueprint;
  productColorHint?: string;
};

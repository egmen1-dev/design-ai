import type { Law003RecalibrationReport } from "./law003-recalibration";
import {
  LAW003_OVERLAY_DENSITY_SAFE,
  LAW003_PRODUCT_AREA_GOOD,
} from "./law003-recalibration";

export type Law003GovernanceSource = "constitution" | "daos_recalibrated";

export type Law003SoftGovernanceInput = {
  constitutionViolation: boolean;
  recalibration?: Pick<
    Law003RecalibrationReport,
    "law003Before" | "law003After" | "reason" | "warnings" | "staleMetricDetected"
  >;
  softGovernanceEnabled?: boolean;
  factualProductAreaRatio?: number;
  overlayDensity?: number;
};

export type Law003SoftGovernanceDiagnostics = {
  law003GovernanceSource: Law003GovernanceSource;
  law003Before: boolean;
  law003After: boolean;
  law003SoftResolved: boolean;
  law003StillFailingReason?: string;
  softViolation: boolean;
};

export function isDaosLaw003SoftGovernanceEnabled(): boolean {
  return process.env.DAOS_LAW003_SOFT_GOVERNANCE === "1";
}

function resolveStillFailingReason(input: Law003SoftGovernanceInput): string | undefined {
  const recalibration = input.recalibration;
  if (!recalibration?.law003After) return undefined;

  if (recalibration.warnings.includes("OVERLAY_DENSITY_BLOCKS_RECALIBRATION")) {
    return "OVERLAY_DENSITY_TOO_HIGH";
  }

  const factualRatio = input.factualProductAreaRatio;
  if (factualRatio != null && factualRatio < LAW003_PRODUCT_AREA_GOOD) {
    return `FACTUAL_PRODUCT_AREA_BELOW_${Math.round(LAW003_PRODUCT_AREA_GOOD * 100)}`;
  }

  if (input.overlayDensity != null && input.overlayDensity > LAW003_OVERLAY_DENSITY_SAFE) {
    return "OVERLAY_DENSITY_TOO_HIGH";
  }

  if (recalibration.staleMetricDetected) {
    return "STALE_PLANNED_WHITESPACE_STILL_FAILING";
  }

  return recalibration.reason || "LAW_003_RECALIBRATED_STILL_FAILING";
}

/** Resolve which LAW_003 signal DAOS soft gates and overlay score should use. */
export function resolveLaw003SoftGovernance(
  input: Law003SoftGovernanceInput,
): Law003SoftGovernanceDiagnostics {
  const softEnabled = input.softGovernanceEnabled ?? isDaosLaw003SoftGovernanceEnabled();
  const law003Before = input.recalibration?.law003Before ?? input.constitutionViolation;
  const law003After = input.recalibration?.law003After ?? law003Before;
  const useRecalibrated = softEnabled && Boolean(input.recalibration);
  const softViolation = useRecalibrated ? law003After : law003Before;
  const law003SoftResolved = useRecalibrated && law003Before && !law003After;

  return {
    law003GovernanceSource: useRecalibrated ? "daos_recalibrated" : "constitution",
    law003Before,
    law003After,
    law003SoftResolved,
    law003StillFailingReason: softViolation ? resolveStillFailingReason(input) : undefined,
    softViolation,
  };
}

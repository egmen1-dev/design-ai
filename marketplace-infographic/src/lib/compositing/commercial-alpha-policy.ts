import {
  PRODUCT_ALPHA_MAX_HEIGHT_PX,
  PRODUCT_ALPHA_MAX_WIDTH_PX,
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";

export const COMMERCIAL_ALPHA_POLICY_VERSION = "1.0.0-sprint7b";

export type AlphaPolicySource = "aligned" | "legacy_mismatch";

export type CommercialAlphaPolicyDiagnostics = {
  commercialAlphaPolicyVersion: string;
  alphaPolicySource: AlphaPolicySource;
  alphaPolicyWidth: number;
  alphaPolicyHeight: number;
  alphaPolicyConsistency: boolean;
  alphaPolicyWarnings: string[];
};

/** Read-only policy consistency check — no algorithm changes */
export function buildCommercialAlphaPolicyDiagnostics(): CommercialAlphaPolicyDiagnostics {
  const warnings: string[] = [];
  const widthConsistent = PRODUCT_ALPHA_MAX_WIDTH_PX === PRODUCT_MAX_WIDTH_PX;
  const heightConsistent = PRODUCT_ALPHA_MAX_HEIGHT_PX === PRODUCT_TARGET_MAX_HEIGHT_PX;
  const consistent = widthConsistent && heightConsistent;

  if (!widthConsistent) {
    warnings.push(
      `PRODUCT_ALPHA_MAX_WIDTH_PX (${PRODUCT_ALPHA_MAX_WIDTH_PX}) != PRODUCT_MAX_WIDTH_PX (${PRODUCT_MAX_WIDTH_PX})`,
    );
  }
  if (!heightConsistent) {
    warnings.push(
      `PRODUCT_ALPHA_MAX_HEIGHT_PX (${PRODUCT_ALPHA_MAX_HEIGHT_PX}) != PRODUCT_TARGET_MAX_HEIGHT_PX (${PRODUCT_TARGET_MAX_HEIGHT_PX})`,
    );
  }

  return {
    commercialAlphaPolicyVersion: COMMERCIAL_ALPHA_POLICY_VERSION,
    alphaPolicySource: consistent ? "aligned" : "legacy_mismatch",
    alphaPolicyWidth: PRODUCT_ALPHA_MAX_WIDTH_PX,
    alphaPolicyHeight: PRODUCT_ALPHA_MAX_HEIGHT_PX,
    alphaPolicyConsistency: consistent,
    alphaPolicyWarnings: warnings,
  };
}

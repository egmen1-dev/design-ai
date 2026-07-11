import type { AttentionHierarchyDiagnostics } from "@/lib/typography/attention-hierarchy";
import type { CategoryAttentionRules } from "@/lib/daos/commercial-genome-beta/category-intelligence/types";

export const POST_OVERLAY_GATE_VERSION = "1.1.0-category-intelligence";

/** Product dominance floor — LAW_003 / LAW_005 alignment */
export const DOMINANCE_GATE_MIN_SCORE = 48;

/** Primary focus ratio floor — LAW_101 */
export const FOCUS_RATIO_GATE_MIN = 0.32;

export type PostOverlayDominanceGateResult = {
  passed: boolean;
  law101Passed: boolean;
  needsTypographyRelaxation: boolean;
  warnings: string[];
  productDominance: number;
  headlineVisualWeight: number;
  attentionHierarchyScore: number;
  primaryFocusRatio: number;
};

export function postOverlayDominanceGateEnabled(): boolean {
  return process.env.DAOS_POST_OVERLAY_DOMINANCE_GATE !== "0";
}

export function evaluatePostOverlayDominanceGate(
  diagnostics: AttentionHierarchyDiagnostics,
  categoryRules?: CategoryAttentionRules | null,
): PostOverlayDominanceGateResult {
  const dominanceFloor = categoryRules?.dominanceFloor ?? DOMINANCE_GATE_MIN_SCORE;
  const focusFloor = categoryRules?.focusRatioFloor ?? FOCUS_RATIO_GATE_MIN;
  const warnings: string[] = [];

  if (!diagnostics.law101Passed && diagnostics.law101Warning) {
    warnings.push(diagnostics.law101Warning);
  }
  if (diagnostics.productDominanceScore < dominanceFloor) {
    warnings.push(
      `Product dominance ${diagnostics.productDominanceScore} below gate floor ${dominanceFloor}`,
    );
  }
  if (diagnostics.primaryFocusRatio < focusFloor) {
    warnings.push(
      `Primary focus ratio ${diagnostics.primaryFocusRatio} below ${focusFloor}`,
    );
  }
  if (diagnostics.attentionHierarchyScore < 30) {
    warnings.push(`Attention hierarchy ${diagnostics.attentionHierarchyScore} below 30`);
  }
  if (diagnostics.headlineVisualWeight > diagnostics.productVisualWeight * 0.85) {
    warnings.push(
      `Headline VW ${diagnostics.headlineVisualWeight} competes with product VW ${diagnostics.productVisualWeight}`,
    );
  }

  const law101Passed = diagnostics.law101Passed;
  const dominanceOk = diagnostics.productDominanceScore >= dominanceFloor;
  const passed = law101Passed && dominanceOk;

  const needsTypographyRelaxation =
    !law101Passed ||
    diagnostics.headlineVisualWeight >= diagnostics.productVisualWeight ||
    diagnostics.primaryFocusRatio < focusFloor;

  return {
    passed,
    law101Passed,
    needsTypographyRelaxation,
    warnings,
    productDominance: diagnostics.productDominanceScore,
    headlineVisualWeight: diagnostics.headlineVisualWeight,
    attentionHierarchyScore: diagnostics.attentionHierarchyScore,
    primaryFocusRatio: diagnostics.primaryFocusRatio,
  };
}

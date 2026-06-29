/**
 * Chapter 3.18 — Vision QA recovery recommendations (hints only)
 */
import { RecoveryStrategy } from "./recovery-types";
import type { RecoveryStrategyId } from "./recovery-types";
import type { VisionQAIssue, VisionRecommendation } from "./vision-qa-types";

const ISSUE_TO_RECOVERY: Record<string, { strategy: RecoveryStrategyId; problemId: string }> = {
  PRODUCT_TOO_SMALL: { strategy: RecoveryStrategy.STAGE_ROLLBACK, problemId: "product_too_small" },
  INSUFFICIENT_WHITESPACE: { strategy: RecoveryStrategy.STAGE_ROLLBACK, problemId: "product_too_small" },
  MISSING_CONTACT_SHADOW: { strategy: RecoveryStrategy.COMPOSITE_RETRY, problemId: "png_overlay_feel" },
  LIGHTING_MISMATCH: { strategy: RecoveryStrategy.STAGE_ROLLBACK, problemId: "wrong_lighting" },
  PERSPECTIVE_MISMATCH: { strategy: RecoveryStrategy.COMPOSITE_RETRY, problemId: "bad_integration" },
  BACKGROUND_CLUTTER: { strategy: RecoveryStrategy.LOCAL_RETRY, problemId: "wrong_background" },
  DUPLICATE_PRODUCT: { strategy: RecoveryStrategy.BLUEPRINT_ROLLBACK, problemId: "wrong_background" },
  PNG_OVERLAY_FEEL: { strategy: RecoveryStrategy.COMPOSITE_RETRY, problemId: "png_overlay_feel" },
  NOISE: { strategy: RecoveryStrategy.PROVIDER_RETRY, problemId: "wrong_background" },
  JPEG_ARTIFACTS: { strategy: RecoveryStrategy.PROVIDER_RETRY, problemId: "wrong_background" },
  BLUR: { strategy: RecoveryStrategy.PROVIDER_RETRY, problemId: "wrong_background" },
  OVEREXPOSURE: { strategy: RecoveryStrategy.LOCAL_RETRY, problemId: "wrong_lighting" },
};

export function recommendationsFromIssues(issues: VisionQAIssue[]): VisionRecommendation[] {
  const seen = new Set<string>();
  const out: VisionRecommendation[] = [];

  for (const issue of issues) {
    const map = ISSUE_TO_RECOVERY[issue.code];
    if (!map || seen.has(map.problemId)) continue;
    seen.add(map.problemId);
    out.push({
      strategy: map.strategy,
      reason: issue.reason,
      confidence: severityToConfidence(issue.severity),
      problemId: map.problemId,
    });
  }

  return out;
}

function severityToConfidence(severity: string): number {
  switch (severity) {
    case "critical":
      return 95;
    case "high":
      return 85;
    case "medium":
      return 70;
    case "low":
      return 55;
    default:
      return 60;
  }
}

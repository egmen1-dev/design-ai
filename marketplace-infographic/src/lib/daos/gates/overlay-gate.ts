import type { OverlayQualityAudit } from "../audit/overlay-quality-audit";

export type DAOSOverlayGateStatus = "passed" | "warning" | "failed";

export type DAOSOverlayGateResult = {
  status: DAOSOverlayGateStatus;
  score: number;
  blocking: false;
  reasons: string[];
  recommendations: string[];
};

function worstStatus(a: DAOSOverlayGateStatus, b: DAOSOverlayGateStatus): DAOSOverlayGateStatus {
  const order: Record<DAOSOverlayGateStatus, number> = { passed: 0, warning: 1, failed: 2 };
  return order[a] >= order[b] ? a : b;
}

/** Soft overlay guardrail — never blocks generation. */
export function evaluateDaosOverlayGate(audit: OverlayQualityAudit): DAOSOverlayGateResult {
  const reasons: string[] = [];
  const recommendations = new Set<string>(audit.recommendations);
  let status: DAOSOverlayGateStatus = "passed";

  if (audit.score < 60) {
    status = "failed";
    reasons.push(`overlay quality score ${audit.score} below 60`);
  }

  if (audit.law003WhitespaceViolation && audit.law014ContrastViolation) {
    status = "failed";
    reasons.push("both LAW_003 whitespace and LAW_014 contrast violations detected");
  }

  if (audit.pngOverlayFeelRisk > 0.75) {
    status = worstStatus(status, "failed");
    reasons.push(`png overlay feel risk ${audit.pngOverlayFeelRisk.toFixed(2)} exceeds 0.75`);
  }

  if (audit.score < 75 && status === "passed") {
    status = "warning";
    reasons.push(`overlay quality score ${audit.score} below 75`);
  }

  if (audit.law003WhitespaceViolation && !audit.law014ContrastViolation) {
    status = worstStatus(status, "warning");
    reasons.push("LAW_003 whitespace violation detected");
  }

  if (audit.law014ContrastViolation && !audit.law003WhitespaceViolation) {
    status = worstStatus(status, "warning");
    reasons.push("LAW_014 contrast violation detected");
  }

  if (audit.pngOverlayFeelRisk > 0.5 && audit.pngOverlayFeelRisk <= 0.75) {
    status = worstStatus(status, "warning");
    reasons.push(`png overlay feel risk elevated (${audit.pngOverlayFeelRisk.toFixed(2)})`);
  }

  if (audit.estimatedOverlayDensity > 0.45) {
    status = worstStatus(status, "warning");
    reasons.push(`overlay density ${audit.estimatedOverlayDensity.toFixed(2)} above 0.45`);
  }

  if (status === "passed" && audit.warnings.length > 0) {
    status = "warning";
    reasons.push(`${audit.warnings.length} overlay warning(s) recorded`);
  }

  if (status !== "passed" && recommendations.size === 0) {
    recommendations.add("Review overlay quality audit in DAOS debug bundle.");
  }

  return {
    status,
    score: audit.score,
    blocking: false,
    reasons,
    recommendations: [...recommendations],
  };
}

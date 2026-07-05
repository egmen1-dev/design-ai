import type { DAOSConfidence, DAOSDecisionTraceItem, DAOSStatus } from "../../contracts/base";

export function nowIso(): string {
  return new Date().toISOString();
}

export function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item)))
    .filter(Boolean);
}

export function createDecisionTraceItem(
  source: string,
  decision: string,
  reason: string,
  confidence: number,
  evidence?: string[],
): DAOSDecisionTraceItem {
  return {
    id: crypto.randomUUID(),
    source,
    decision,
    reason,
    confidence: Math.max(0, Math.min(1, confidence)),
    evidence: evidence?.length ? evidence : undefined,
    createdAt: nowIso(),
  };
}

export function confidenceFromCompleteness(score: number): DAOSConfidence {
  return {
    score: Math.max(0, Math.min(1, score)),
    reason: score >= 0.8 ? "complete legacy input" : score >= 0.5 ? "partial legacy input" : "minimal legacy input",
  };
}

export function baseSpecificationFields(
  projectId: string,
  source: string,
  status: DAOSStatus,
  confidenceScore: number,
  trace: DAOSDecisionTraceItem[],
) {
  const now = nowIso();
  return {
    id: crypto.randomUUID(),
    projectId,
    version: 1,
    status,
    createdAt: now,
    updatedAt: now,
    source,
    confidence: confidenceFromCompleteness(confidenceScore),
    decisionTrace: trace,
  };
}

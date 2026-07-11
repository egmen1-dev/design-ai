/**
 * Beta Validation 2 — failure reason taxonomy (benchmark-only).
 */

export type FailureReason =
  | "Input Quality"
  | "Composition"
  | "Lighting"
  | "Typography"
  | "Attention"
  | "Dominance"
  | "Background"
  | "Category Specific"
  | "Unknown";

export type FailureRecord = {
  slot: string;
  productId: number;
  category: string;
  reason: FailureReason;
  detail: string;
};

const GAP_TO_REASON: Record<string, FailureReason> = {
  Composition: "Composition",
  "Product Dominance": "Dominance",
  Scene: "Background",
  Typography: "Typography",
  Attention: "Attention",
  Visual: "Attention",
  Lighting: "Lighting",
  Other: "Unknown",
};

export function classifyFailure(input: {
  slot: string;
  productId: number;
  category: string;
  categoryLabel: string;
  daosGenerated: boolean;
  gapClass?: string;
  delta: {
    productDominance: number;
    foregroundIsolation: number;
    headlineVisualWeight: number;
    thumbnailReadability: number;
    attentionHierarchyScore: number;
  };
}): FailureRecord {
  if (!input.daosGenerated) {
    return {
      slot: input.slot,
      productId: input.productId,
      category: input.categoryLabel,
      reason: "Input Quality",
      detail: "Generation failed — pipeline abort",
    };
  }

  const gap = input.gapClass ?? "Other";
  let reason = GAP_TO_REASON[gap] ?? "Unknown";

  if (reason === "Unknown" || reason === "Dominance") {
    if (input.delta.productDominance < -12) reason = "Dominance";
    else if (input.delta.foregroundIsolation < -10) reason = "Background";
    else if (input.delta.headlineVisualWeight > 8) reason = "Typography";
    else if (input.delta.attentionHierarchyScore < -10) reason = "Attention";
    else if (input.delta.thumbnailReadability < -8) reason = "Attention";
  }

  if (input.category === "humidifier" && reason === "Dominance") {
    reason = "Category Specific";
  }

  return {
    slot: input.slot,
    productId: input.productId,
    category: input.categoryLabel,
    reason,
    detail: gap,
  };
}

export function aggregateFailureReasons(records: FailureRecord[]): Record<FailureReason, number> {
  const counts = {} as Record<FailureReason, number>;
  for (const r of records) {
    counts[r.reason] = (counts[r.reason] ?? 0) + 1;
  }
  return counts;
}

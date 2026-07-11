/**
 * Law validation engine — compares live WB correlations against Knowledge Base v1.
 * Benchmark-only; not wired to production runtime.
 */
import {
  KNOWLEDGE_BASE_V1,
  VALIDATION_THRESHOLDS,
  CLUSTER_SUB_FEATURES,
  type BaselineLaw,
  type LawProductionStatus,
} from "./knowledge-base-baseline";

export type LawValidationStatus =
  | "Still Proven"
  | "Confidence Increased"
  | "Confidence Decreased"
  | "Contradicted"
  | "Still Likely"
  | "Still Rejected"
  | "Market Change — Review Required"
  | "Not Measurable"
  | "Skipped";

export type CorrelationRow = {
  feature: string;
  correlation: number;
  absCorrelation: number;
  n: number;
  wbMean: number;
  wbMedian: number;
};

export type LawValidationResult = {
  lawId: string;
  lawName: string;
  productionStatus: LawProductionStatus;
  feature?: string;
  baselineCorrelation?: number;
  currentCorrelation?: number;
  deltaCorrelation?: number;
  validationStatus: LawValidationStatus;
  finding: "confirmation" | "change" | "contradiction" | "not_applicable";
  rationale: string;
};

export type CandidateLaw = {
  feature: string;
  correlation: number;
  absCorrelation: number;
  n: number;
  direction: "positive" | "negative";
  status: "Candidate Law";
  rationale: string;
  requiresReview: true;
};

function sameSign(a: number, b: number): boolean {
  if (Math.abs(a) < 0.05 || Math.abs(b) < 0.05) return true;
  return Math.sign(a) === Math.sign(b);
}

function validateCorrelationLaw(
  law: BaselineLaw,
  current?: CorrelationRow,
): LawValidationResult {
  const base = {
    lawId: law.id,
    lawName: law.name,
    productionStatus: law.status,
    feature: law.feature,
    baselineCorrelation: law.baselineCorrelation,
  };

  if (!law.feature || law.validationType === "qualitative" || law.validationType === "daos_only") {
    return {
      ...base,
      validationStatus: "Not Measurable",
      finding: "not_applicable",
      rationale:
        law.validationType === "daos_only"
          ? "DAOS-only law (layer delta). Validated via production benchmarks, not WB correlation refresh."
          : law.validationType === "qualitative"
            ? "Qualitative law. Re-confirmed if related feature remains negligible in WB scan."
            : "No single WB feature mapping.",
    };
  }

  if (!current) {
    return {
      ...base,
      validationStatus: "Skipped",
      finding: "not_applicable",
      rationale: `Feature ${law.feature} not in current correlation set.`,
    };
  }

  const baselineR = law.baselineCorrelation ?? 0;
  const currentR = current.correlation;
  const delta = Number((currentR - baselineR).toFixed(3));

  // REJECTED laws — flag if market now shows opposite
  if (law.status === "REJECTED") {
    if (law.expectedDirection === "negligible" && current.absCorrelation >= 0.25) {
      return {
        ...base,
        currentCorrelation: currentR,
        deltaCorrelation: delta,
        validationStatus: "Market Change — Review Required",
        finding: "contradiction",
        rationale: `Rejected law may be weakening: |r|=${current.absCorrelation} now exceeds negligible threshold.`,
      };
    }
    if (law.expectedDirection === "negative" && currentR > 0.2) {
      return {
        ...base,
        currentCorrelation: currentR,
        deltaCorrelation: delta,
        validationStatus: "Market Change — Review Required",
        finding: "contradiction",
        rationale: `Sign flipped positive (r=${currentR}) vs rejected negative expectation.`,
      };
    }
    return {
      ...base,
      currentCorrelation: currentR,
      deltaCorrelation: delta,
      validationStatus: "Still Rejected",
      finding: "confirmation",
      rationale: `Rejection holds: r=${currentR} (${law.expectedDirection} expected).`,
    };
  }

  // Negligible expectation (LAW_001)
  if (law.expectedDirection === "negligible") {
    if (current.absCorrelation >= 0.2) {
      return {
        ...base,
        currentCorrelation: currentR,
        deltaCorrelation: delta,
        validationStatus: "Contradicted",
        finding: "contradiction",
        rationale: `Was negligible (baseline r=${baselineR}); now |r|=${current.absCorrelation} — market may have shifted.`,
      };
    }
    return {
      ...base,
      currentCorrelation: currentR,
      deltaCorrelation: delta,
      validationStatus: law.status === "PROVEN" ? "Still Proven" : "Still Likely",
      finding: "confirmation",
      rationale: `Remains negligible: r=${currentR} (baseline ${baselineR}).`,
    };
  }

  // Sign flip → Contradicted
  if (!sameSign(baselineR, currentR) && Math.abs(baselineR) >= 0.15 && Math.abs(currentR) >= 0.1) {
    return {
      ...base,
      currentCorrelation: currentR,
      deltaCorrelation: delta,
      validationStatus: "Contradicted",
      finding: "contradiction",
      rationale: `Sign flipped: baseline r=${baselineR} → current r=${currentR}.`,
    };
  }

  // Collapse to negligible
  if (Math.abs(baselineR) >= 0.2 && current.absCorrelation < VALIDATION_THRESHOLDS.negligibleCorrelation) {
    return {
      ...base,
      currentCorrelation: currentR,
      deltaCorrelation: delta,
      validationStatus: "Contradicted",
      finding: "contradiction",
      rationale: `Correlation collapsed: baseline |r|=${Math.abs(baselineR)} → current |r|=${current.absCorrelation}.`,
    };
  }

  const absDelta = Math.abs(current.absCorrelation - Math.abs(baselineR));

  if (current.absCorrelation > Math.abs(baselineR) + VALIDATION_THRESHOLDS.confidenceIncreaseDelta) {
    return {
      ...base,
      currentCorrelation: currentR,
      deltaCorrelation: delta,
      validationStatus: "Confidence Increased",
      finding: "confirmation",
      rationale: `Stronger signal: |r| ${Math.abs(baselineR)} → ${current.absCorrelation} (+${absDelta.toFixed(3)}).`,
    };
  }

  if (current.absCorrelation < Math.abs(baselineR) - VALIDATION_THRESHOLDS.confidenceDecreaseDelta) {
    return {
      ...base,
      currentCorrelation: currentR,
      deltaCorrelation: delta,
      validationStatus: "Confidence Decreased",
      finding: "change",
      rationale: `Weaker signal: |r| ${Math.abs(baselineR)} → ${current.absCorrelation} (−${absDelta.toFixed(3)}).`,
    };
  }

  const provenLabel = law.status === "PROVEN" ? "Still Proven" : "Still Likely";
  return {
    ...base,
    currentCorrelation: currentR,
    deltaCorrelation: delta,
    validationStatus: provenLabel,
    finding: "confirmation",
    rationale: `Within drift tolerance: r=${currentR} (baseline ${baselineR}, Δ=${delta}).`,
  };
}

export function validateAllLaws(correlations: CorrelationRow[]): LawValidationResult[] {
  const byFeature = new Map(correlations.map((c) => [c.feature, c]));
  const seen = new Set<string>();

  const results = KNOWLEDGE_BASE_V1.map((law) => {
    seen.add(law.id);
    return validateCorrelationLaw(law, law.feature ? byFeature.get(law.feature) : undefined);
  });

  return results;
}

export function discoverCandidateLaws(
  correlations: CorrelationRow[],
  existingFeatures: Set<string>,
): CandidateLaw[] {
  const mappedFeatures = new Set(
    KNOWLEDGE_BASE_V1.filter((l) => l.feature && l.status !== "REJECTED").map((l) => l.feature!),
  );

  return correlations
    .filter((c) => {
      if (mappedFeatures.has(c.feature)) return false;
      if (CLUSTER_SUB_FEATURES.has(c.feature)) return false;
      if (c.n < VALIDATION_THRESHOLDS.candidateLawMinN) return false;
      return c.absCorrelation >= VALIDATION_THRESHOLDS.candidateLawMinR;
    })
    .sort((a, b) => b.absCorrelation - a.absCorrelation)
    .map((c) => ({
      feature: c.feature,
      correlation: c.correlation,
      absCorrelation: c.absCorrelation,
      n: c.n,
      direction: c.correlation > 0 ? "positive" : "negative",
      status: "Candidate Law" as const,
      rationale: `Unmapped feature with |r|=${c.absCorrelation} (n=${c.n}). Requires separate Council review before promotion.`,
      requiresReview: true as const,
    }));
}

export function summarizeValidation(results: LawValidationResult[]) {
  const counts = {
    confirmation: 0,
    change: 0,
    contradiction: 0,
    notApplicable: 0,
    stillProven: 0,
    confidenceIncreased: 0,
    confidenceDecreased: 0,
    contradicted: 0,
    candidateLaws: 0,
  };

  for (const r of results) {
    if (r.finding === "confirmation") counts.confirmation++;
    if (r.finding === "change") counts.change++;
    if (r.finding === "contradiction") counts.contradiction++;
    if (r.finding === "not_applicable") counts.notApplicable++;
    if (r.validationStatus === "Still Proven" || r.validationStatus === "Still Likely") counts.stillProven++;
    if (r.validationStatus === "Confidence Increased") counts.confidenceIncreased++;
    if (r.validationStatus === "Confidence Decreased") counts.confidenceDecreased++;
    if (r.validationStatus === "Contradicted" || r.validationStatus === "Market Change — Review Required") {
      counts.contradicted++;
    }
  }

  return counts;
}

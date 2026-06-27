import type {
  ConstitutionContext,
  ConstitutionScores,
  ConstitutionViolation,
  DesignLaw,
  LawCategory,
} from "../types";

const CATEGORY_SCORE_MAP: Partial<Record<LawCategory, keyof ConstitutionScores>> = {
  composition: "compositionScore",
  hierarchy: "hierarchyScore",
  eye_flow: "hierarchyScore",
  whitespace: "whitespaceScore",
  negative_space: "whitespaceScore",
  luxury: "luxuryScore",
  typography: "typographyScore",
  contrast: "contrastScore",
  marketplace: "marketplaceScore",
  brand: "brandScore",
  visual_density: "visualNoiseScore",
  spacing: "whitespaceScore",
  balance: "compositionScore",
  alignment: "compositionScore",
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeConstitutionScores(input: {
  violations: ConstitutionViolation[];
  laws: DesignLaw[];
  ctx: ConstitutionContext;
}): ConstitutionScores {
  const base: Omit<ConstitutionScores, "overallDesignScore"> = {
    compositionScore: input.ctx.compositionScore ?? 80,
    hierarchyScore: 82,
    whitespaceScore: 80,
    luxuryScore: input.ctx.luxuryScore ?? 78,
    typographyScore: 85,
    contrastScore: 80,
    marketplaceScore: 82,
    brandScore: 88,
    visualNoiseScore: 85,
  };

  for (const law of input.laws) {
    const key = CATEGORY_SCORE_MAP[law.category];
    if (!key || key === "overallDesignScore") continue;
    const violated = input.violations.some((v) => v.lawId === law.id);
    if (violated) {
      const penalty = law.severity === "critical" ? 18 : law.severity === "major" ? 12 : 6;
      base[key] = clamp(base[key] - penalty);
    }
  }

  const ws = input.ctx.layout?.metrics?.whitespacePct ?? input.ctx.layoutSpec?.whitespaceTarget;
  if (ws != null) {
    base.whitespaceScore = clamp(100 - Math.abs(ws - 28) * 3 - (ws < 20 ? 25 : 0));
  }

  if (input.ctx.layout?.metrics) {
    const ratio =
      input.ctx.layout.metrics.productAreaPct / Math.max(input.ctx.layout.metrics.textAreaPct, 1);
    base.contrastScore = clamp(ratio >= 2.5 ? 92 : 70 - (input.ctx.layout.metrics.overlapPct ?? 0) * 5);
  }

  const weights = {
    compositionScore: 0.14,
    hierarchyScore: 0.12,
    whitespaceScore: 0.12,
    luxuryScore: 0.1,
    typographyScore: 0.1,
    contrastScore: 0.1,
    marketplaceScore: 0.1,
    brandScore: 0.06,
    visualNoiseScore: 0.16,
  };

  let overall = 0;
  for (const [key, weight] of Object.entries(weights)) {
    overall += base[key as keyof typeof base] * weight;
  }

  return {
    ...base,
    overallDesignScore: clamp(overall),
  };
}

export function scoresPassThreshold(scores: ConstitutionScores, threshold = 85): boolean {
  return scores.overallDesignScore >= threshold;
}

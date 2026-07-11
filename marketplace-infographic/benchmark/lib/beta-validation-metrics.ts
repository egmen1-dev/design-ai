/**
 * Beta Validation 1 — paired card metrics (benchmark-only).
 */
import { measureThumbnailReadabilityScore } from "../../src/lib/typography/thumbnail-readability-gate";
import { measureAttentionCompetition } from "./attention-competition-metrics";
import { measureVisualWeightMetrics } from "./visual-weight-metrics";
import { evaluateCommercialFidelity } from "../../src/lib/commercial-fidelity";

export type BetaCardMetrics = {
  productDominance: number;
  foregroundIsolation: number;
  headlineVisualWeight: number;
  primaryFocusRatio: number;
  attentionHierarchyScore: number;
  commercialFidelity: number;
  visualWeightHero: number;
  thumbnailReadability: number;
  productVisualWeight: number;
  typographyCompetition: number;
};

export async function measureThumbnailReadability(imagePath: string): Promise<number> {
  return measureThumbnailReadabilityScore(imagePath);
}

export async function measureBetaCardMetrics(imagePath: string): Promise<BetaCardMetrics> {
  const [attention, visual, fidelity] = await Promise.all([
    measureAttentionCompetition(imagePath),
    measureVisualWeightMetrics(imagePath),
    evaluateCommercialFidelity({ imagePath }),
  ]);

  const thumbnailReadability = await measureThumbnailReadability(imagePath);

  const attentionHierarchyScore = Number(
    (
      attention.primaryFocusRatio * 35 +
      Math.max(0, 100 - attention.attentionCompetitionIndex) * 0.25 +
      Math.max(0, attention.productVisualWeight - attention.headlineVisualWeight) * 0.4
    ).toFixed(1),
  );

  return {
    productDominance: attention.productDominanceScore,
    foregroundIsolation: attention.foregroundIsolation,
    headlineVisualWeight: attention.headlineVisualWeight,
    primaryFocusRatio: attention.primaryFocusRatio,
    attentionHierarchyScore,
    commercialFidelity: fidelity.diagnostics.commercialFidelityScore,
    visualWeightHero: visual.visualWeightHero,
    thumbnailReadability,
    productVisualWeight: attention.productVisualWeight,
    typographyCompetition: attention.typographyCompetition,
  };
}

export type MetricComparison = {
  leader: BetaCardMetrics;
  daos: BetaCardMetrics;
  delta: Record<keyof BetaCardMetrics, number>;
  leaderWins: number;
  daosWins: number;
  draws: number;
};

const HIGHER_IS_BETTER: Array<keyof BetaCardMetrics> = [
  "productDominance",
  "foregroundIsolation",
  "primaryFocusRatio",
  "attentionHierarchyScore",
  "commercialFidelity",
  "visualWeightHero",
  "thumbnailReadability",
  "productVisualWeight",
];

const LOWER_IS_BETTER: Array<keyof BetaCardMetrics> = [
  "headlineVisualWeight",
  "typographyCompetition",
];

export function compareMetrics(leader: BetaCardMetrics, daos: BetaCardMetrics): MetricComparison {
  const delta = {} as Record<keyof BetaCardMetrics, number>;
  let leaderWins = 0;
  let daosWins = 0;
  let draws = 0;

  for (const key of Object.keys(leader) as Array<keyof BetaCardMetrics>) {
    const d = Number((daos[key] - leader[key]).toFixed(2));
    delta[key] = d;
  }

  for (const key of HIGHER_IS_BETTER) {
    const diff = daos[key] - leader[key];
    if (Math.abs(diff) < 1.5) draws++;
    else if (diff > 0) daosWins++;
    else leaderWins++;
  }

  for (const key of LOWER_IS_BETTER) {
    const diff = leader[key] - daos[key];
    if (Math.abs(diff) < 1.5) draws++;
    else if (diff > 0) daosWins++;
    else leaderWins++;
  }

  return { leader, daos, delta, leaderWins, daosWins, draws };
}

export type HumanVerdict = {
  moreProfessional: "wb" | "daos" | "draw";
  strongerSell: "wb" | "daos" | "draw";
  fasterRead: "wb" | "daos" | "draw";
  wouldOpen: "wb" | "daos" | "draw";
  overall: "wb" | "daos" | "draw";
  rationale: string;
  gapClass?: string;
};

export function deriveHumanVerdict(
  cmp: MetricComparison,
  meta: { leaderDominance: number; daosGenerated: boolean },
): HumanVerdict {
  const { leader, daos, delta } = cmp;

  const professionalScore = {
    wb: leader.commercialFidelity * 0.5 + leader.productDominance * 0.3 + leader.foregroundIsolation * 0.2,
    daos: daos.commercialFidelity * 0.5 + daos.productDominance * 0.3 + daos.foregroundIsolation * 0.2,
  };

  const sellScore = {
    wb: leader.productDominance * 0.4 + leader.primaryFocusRatio * 100 * 0.35 + leader.thumbnailReadability * 0.25,
    daos: daos.productDominance * 0.4 + daos.primaryFocusRatio * 100 * 0.35 + daos.thumbnailReadability * 0.25,
  };

  const readScore = {
    wb: leader.thumbnailReadability * 0.5 + leader.visualWeightHero * 0.3 + (100 - leader.headlineVisualWeight) * 0.2,
    daos: daos.thumbnailReadability * 0.5 + daos.visualWeightHero * 0.3 + (100 - daos.headlineVisualWeight) * 0.2,
  };

  const openScore = {
    wb: sellScore.wb * 0.5 + readScore.wb * 0.5,
    daos: sellScore.daos * 0.5 + readScore.daos * 0.5,
  };

  function pick(wb: number, daosVal: number, margin = 2): "wb" | "daos" | "draw" {
    if (Math.abs(wb - daosVal) < margin) return "draw";
    return daosVal > wb ? "daos" : "wb";
  }

  const moreProfessional = pick(professionalScore.wb, professionalScore.daos);
  const strongerSell = pick(sellScore.wb, sellScore.daos);
  const fasterRead = pick(readScore.wb, readScore.daos);
  const wouldOpen = pick(openScore.wb, openScore.daos);

  const daosVote = [moreProfessional, strongerSell, fasterRead, wouldOpen].filter((v) => v === "daos").length;
  const wbVote = [moreProfessional, strongerSell, fasterRead, wouldOpen].filter((v) => v === "wb").length;

  const leaderComposite = compositeCommercialScore(leader);
  const daosComposite = compositeCommercialScore(daos);
  const compositeMargin = daosComposite - leaderComposite;

  let overall: "wb" | "daos" | "draw";
  if (Math.abs(compositeMargin) >= 4) {
    overall = compositeMargin > 0 ? "daos" : "wb";
  } else if (daosVote > wbVote + 1) {
    overall = "daos";
  } else if (wbVote > daosVote + 1) {
    overall = "wb";
  } else {
    overall = "draw";
  }

  // Dominance collapse overrides weak thumbnail wins
  if (delta.productDominance < -12 && delta.commercialFidelity < -10) {
    overall = "wb";
  }

  let gapClass = "Other";
  if (!meta.daosGenerated) gapClass = "Composition";
  else if (delta.productDominance < -8) gapClass = "Product Dominance";
  else if (delta.foregroundIsolation < -10) gapClass = "Scene";
  else if (delta.headlineVisualWeight > 5) gapClass = "Typography";
  else if (delta.attentionHierarchyScore < -8) gapClass = "Attention";
  else if (delta.thumbnailReadability < -5) gapClass = "Visual";
  else if (delta.visualWeightHero < -5) gapClass = "Lighting";

  const rationale = [
    `Dominance: WB ${leader.productDominance} vs DAOS ${daos.productDominance} (Δ${delta.productDominance})`,
    `FI: WB ${leader.foregroundIsolation} vs DAOS ${daos.foregroundIsolation}`,
    `Thumbnail: WB ${leader.thumbnailReadability} vs DAOS ${daos.thumbnailReadability}`,
    `Fidelity: WB ${leader.commercialFidelity} vs DAOS ${daos.commercialFidelity}`,
  ].join("; ");

  return {
    moreProfessional,
    strongerSell,
    fasterRead,
    wouldOpen,
    overall,
    rationale,
    gapClass: overall === "wb" ? gapClass : undefined,
  };
}

export function compositeCommercialScore(m: BetaCardMetrics): number {
  return Number(
    (
      m.productDominance * 0.3 +
      m.foregroundIsolation * 0.15 +
      m.commercialFidelity * 0.2 +
      m.thumbnailReadability * 0.15 +
      m.attentionHierarchyScore * 0.1 +
      m.visualWeightHero * 0.1 -
      m.headlineVisualWeight * 0.05
    ).toFixed(1),
  );
}

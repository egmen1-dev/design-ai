import type { DesignGenomeRecord, GenomeRankings } from "./types";

export function computeGenomeRankings(input: {
  designScore?: number;
  seniorAdScore?: number;
  ctrScore?: number;
  photoScore?: number;
  ctrPrediction?: number;
  genome: DesignGenomeRecord;
  trendBoost?: number;
  reusePenalty?: number;
}): GenomeRankings {
  const professional = input.seniorAdScore ?? input.designScore ?? input.genome.rankings.professionalScore;
  const marketplace = input.ctrScore ?? input.genome.rankings.marketplaceScore;
  const commercial = input.photoScore ?? input.genome.rankings.commercialScore;
  const ctr = input.ctrPrediction ?? input.genome.rankings.ctrPrediction;

  const composite =
    professional * 0.28 +
    marketplace * 0.32 +
    commercial * 0.2 +
    input.genome.dna.visualEnergy * 0.1 +
    input.genome.dna.luxury * 0.1;

  return {
    marketplaceScore: Math.round(marketplace),
    professionalScore: Math.round(professional),
    commercialScore: Math.round(commercial),
    readability: Math.round(input.ctrScore ?? input.genome.rankings.readability),
    ctrPrediction: ctr,
    visualImpact: input.genome.dna.visualEnergy,
    originality: Math.min(100, Math.round(50 + input.genome.dna.contrast * 0.35)),
    trendScore: Math.round(60 + (input.trendBoost ?? 0)),
    reuseScore: Math.max(0.1, 1 - (input.reusePenalty ?? 0)),
  };
}

export function genomeCompositeScore(rankings: GenomeRankings): number {
  return (
    rankings.marketplaceScore * 0.3 +
    rankings.professionalScore * 0.25 +
    rankings.commercialScore * 0.2 +
    rankings.readability * 0.1 +
    rankings.visualImpact * 0.08 +
    rankings.originality * 0.07
  );
}

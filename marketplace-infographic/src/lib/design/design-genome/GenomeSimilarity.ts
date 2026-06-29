import type { DesignGenomeRecord } from "./types";

type SimilarityInput = {
  category: string;
  customerIntent: string;
  heroConcept: string;
  indoorOutdoor: string;
  productScalePct: number;
};

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/[^a-zа-я0-9]+/i).filter(Boolean));
  const tb = new Set(b.toLowerCase().split(/[^a-zа-я0-9]+/i).filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.size);
}

export function genomeSimilarityScore(
  query: SimilarityInput,
  genome: DesignGenomeRecord,
): number {
  let score = 0;
  if (genome.knowledgeCategory === query.category) score += 0.25;
  score += tokenOverlap(query.customerIntent, genome.story.customerIntent) * 0.35;
  score += tokenOverlap(query.heroConcept, genome.story.heroConcept) * 0.25;
  if (genome.scene.indoorOutdoor === query.indoorOutdoor) score += 0.08;
  const scaleDelta = Math.abs(genome.composition.productScalePct - query.productScalePct);
  score += Math.max(0, 0.12 - scaleDelta * 0.004);
  return Math.min(1, score);
}

export function rankBySimilarity(
  query: SimilarityInput,
  genomes: DesignGenomeRecord[],
): Array<{ genome: DesignGenomeRecord; similarity: number }> {
  return genomes
    .map((genome) => ({
      genome,
      similarity: genomeSimilarityScore(query, genome),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

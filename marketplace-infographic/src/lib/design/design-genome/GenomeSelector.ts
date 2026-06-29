import type { DesignGenomeRecord } from "./types";
import { rankBySimilarity } from "./GenomeSimilarity";
import { genomeCompositeScore } from "./GenomeRanking";
import { mixGenomes } from "./GenomeMixer";
import { mutateGenome } from "./GenomeMutator";

export function selectGenomeCandidates(input: {
  category: string;
  customerIntent: string;
  heroConcept: string;
  indoorOutdoor: string;
  productScalePct: number;
  pool: DesignGenomeRecord[];
  seed: string;
}): DesignGenomeRecord[] {
  const ranked = rankBySimilarity(
    {
      category: input.category,
      customerIntent: input.customerIntent,
      heroConcept: input.heroConcept,
      indoorOutdoor: input.indoorOutdoor,
      productScalePct: input.productScalePct,
    },
    input.pool,
  );

  const top = ranked.slice(0, 3).map((r) => r.genome);
  if (top.length >= 2) {
    return [mixGenomes(top, undefined, input.seed), ...top];
  }
  if (top.length === 1) {
    return [mutateGenome(top[0], input.seed), top[0]];
  }
  return [];
}

export function pickBestGenome(candidates: DesignGenomeRecord[]): DesignGenomeRecord | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) => genomeCompositeScore(b.rankings) - genomeCompositeScore(a.rankings),
  )[0];
}

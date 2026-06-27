import { createSeededRng, pickRange } from "@/lib/design/variability";
import type { DesignGenomeRecord } from "./types";
import { GENOME_MIX_WEIGHTS } from "./types";
import { buildDesignGenome } from "./GenomeBuilder";
import { computeGenomeRankings } from "./GenomeRanking";

function blendNumber(a: number, b: number, w: number): number {
  return Math.round(a * w + b * (1 - w));
}

function blendString(primary: string, secondary: string, w: number): string {
  return w >= 0.5 ? primary : secondary;
}

export function mixGenomes(
  genomes: DesignGenomeRecord[],
  weights: number[] = [...GENOME_MIX_WEIGHTS],
  seed = "mix",
): DesignGenomeRecord {
  const sources = genomes.slice(0, 3);
  if (sources.length === 0) {
    throw new Error("mixGenomes requires at least one genome");
  }
  if (sources.length === 1) return sources[0];

  const w = weights.slice(0, sources.length);
  const total = w.reduce((s, x) => s + x, 0);
  const norm = w.map((x) => x / total);
  const [a, b, c] = sources;
  const wa = norm[0] ?? 0.5;
  const wb = norm[1] ?? 0.3;
  const wc = norm[2] ?? 0.2;

  const base = a;
  const mixed = buildDesignGenome({
    prompt: base.story.marketingHook,
    productCategory: base.product.category,
    knowledgeCategory: base.knowledgeCategory,
    customerIntent: blendString(a.story.customerIntent, b?.story.customerIntent ?? a.story.customerIntent, wa),
    heroConcept: blendString(a.story.heroConcept, b?.story.heroConcept ?? a.story.heroConcept, wa),
    sceneNarrative: [a.scene.narrative, b?.scene.narrative, c?.scene.narrative].filter(Boolean).join(" · ").slice(0, 200),
    compositionTemplate: wa >= wb ? a.composition.layoutTemplate : (b?.composition.layoutTemplate ?? a.composition.layoutTemplate),
    productScalePct: blendNumber(a.composition.productScalePct, b?.composition.productScalePct ?? a.composition.productScalePct, wa),
    negativeSpacePct: blendNumber(a.composition.negativeSpacePct, b?.composition.negativeSpacePct ?? a.composition.negativeSpacePct, wa),
    fontFamily: wa >= 0.4 ? a.typography.fontFamily : (b?.typography.fontFamily ?? a.typography.fontFamily),
    badge: wa >= wb ? a.badge : (b?.badge ?? a.badge),
    palette: wa >= wb ? a.palette : (b?.palette ?? a.palette),
    dna: {
      ...a.dna,
      productDominance: blendNumber(a.dna.productDominance, b?.dna.productDominance ?? a.dna.productDominance, wa),
      visualEnergy: blendNumber(a.dna.visualEnergy, c?.dna.visualEnergy ?? a.dna.visualEnergy, wa),
      luxury: blendNumber(a.dna.luxury, b?.dna.luxury ?? a.dna.luxury, wa),
    },
  });

  mixed.rankings = computeGenomeRankings({
    genome: mixed,
    designScore: blendNumber(a.rankings.professionalScore, b?.rankings.professionalScore ?? a.rankings.professionalScore, wa),
    ctrScore: blendNumber(a.rankings.marketplaceScore, b?.rankings.marketplaceScore ?? a.rankings.marketplaceScore, wa),
  });
  mixed.genomeKey = `${base.genomeKey}_mix_${seed.slice(0, 8)}`;
  return mixed;
}

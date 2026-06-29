import type { DesignGenomeRecord } from "./types";

export type GenomeValidationResult = {
  valid: boolean;
  score: number;
  issues: string[];
};

export function validateGenome(genome: DesignGenomeRecord): GenomeValidationResult {
  const issues: string[] = [];
  if (!genome.story.heroConcept || genome.story.heroConcept.length < 8) {
    issues.push("hero concept too short");
  }
  if (!genome.story.customerIntent) issues.push("missing customer intent");
  if (genome.composition.productScalePct < 45 || genome.composition.productScalePct > 85) {
    issues.push("product scale out of marketplace range");
  }
  if (genome.composition.negativeSpacePct < 8) {
    issues.push("insufficient negative space");
  }
  if (!genome.palette.primary) issues.push("missing primary color");

  const score = Math.max(0, 100 - issues.length * 18);
  return { valid: issues.length === 0, score, issues };
}

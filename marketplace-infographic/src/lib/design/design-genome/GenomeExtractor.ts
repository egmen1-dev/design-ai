import type { GenomeBuildInput } from "./types";
import { buildDesignGenome } from "./GenomeBuilder";

export function extractGenomeFromGeneration(input: GenomeBuildInput) {
  return buildDesignGenome(input);
}

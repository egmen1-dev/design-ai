export { evolveGenomeWeight, persistGenome } from "./GenomeDatabase";
import { GENOME_EMA_ALPHA } from "./types";

export function outcomeFromFeedback(userLiked: boolean): number {
  return userLiked ? 0.88 : 0.22;
}

export function decayStaleGenomeWeight(monthsIdle: number, current: number): number {
  if (monthsIdle < 3) return current;
  const decay = Math.min(0.35, (monthsIdle - 2) * 0.04);
  return Math.max(0.15, current - decay);
}

export { GENOME_EMA_ALPHA };

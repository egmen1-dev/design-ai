import { createHash } from "crypto";
import type { CreativeDirectorResult } from "./creative-concept";

export type ConceptFingerprint = {
  hash: string;
  archetypeId: string;
  title: string;
  visualHook: string;
  tokens: Set<string>;
};

export function buildConceptFingerprint(concept: CreativeDirectorResult): ConceptFingerprint {
  const text = [
    concept.archetypeId ?? "",
    concept.creativeConcept.title,
    concept.creativeConcept.visualHook,
    concept.oneThought.headline,
    concept.compositionScenarioId ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const tokens = new Set(
    text
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 2),
  );

  const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);

  return {
    hash,
    archetypeId: concept.archetypeId ?? "unknown",
    title: concept.creativeConcept.title,
    visualHook: concept.creativeConcept.visualHook.slice(0, 80),
    tokens,
  };
}

/** Jaccard similarity 0–100 */
export function conceptSimilarity(a: ConceptFingerprint, b: ConceptFingerprint): number {
  if (a.hash === b.hash) return 100;
  if (a.archetypeId === b.archetypeId && a.title === b.title) return 85;

  const intersection = [...a.tokens].filter((t) => b.tokens.has(t)).length;
  const union = new Set([...a.tokens, ...b.tokens]).size;
  if (union === 0) return 0;
  return Math.round((intersection / union) * 100);
}

export function isTooSimilarToRecent(
  concept: CreativeDirectorResult,
  recentFingerprints: ConceptFingerprint[],
  threshold = 70,
): boolean {
  const fp = buildConceptFingerprint(concept);
  return recentFingerprints.some((recent) => conceptSimilarity(fp, recent) >= threshold);
}

export function filterTemplateConcepts<T extends { concept: CreativeDirectorResult }>(
  ranked: T[],
  recentFingerprints: ConceptFingerprint[],
  threshold = 70,
): T[] {
  return ranked.filter((item) => !isTooSimilarToRecent(item.concept, recentFingerprints, threshold));
}

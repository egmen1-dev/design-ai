import type { ProductAnalysis } from "@/lib/product-analysis";
import {
  buildConceptVariants,
  type CreativeDirectorResult,
  type ScoredConcept,
} from "./creative-concept";
import { evaluateConcept, CONCEPT_PASS_THRESHOLD } from "./concept-evaluator";
import { filterTemplateConcepts } from "./concept-similarity";
import type { ConceptFingerprint } from "./concept-similarity";
import type { ArtDirectorModeId } from "./art-director-modes";
import type { FoundationPromptInput } from "./types";

export type ConceptGenerationResult = {
  selected: CreativeDirectorResult;
  candidates: ScoredConcept[];
  evaluatedCount: number;
  renderQueue: CreativeDirectorResult[];
};

function scoreAndRank(
  concepts: CreativeDirectorResult[],
  analysis: ProductAnalysis,
  prompt: string,
  modeId: ArtDirectorModeId,
): ScoredConcept[] {
  return concepts
    .map((concept, i) => {
      const evaluation = evaluateConcept(concept, analysis, prompt, {
        modeId,
        archetypeIndex: i,
      });
      return {
        concept: { ...concept, conceptScore: evaluation.finalScore },
        evaluation,
      };
    })
    .sort((a, b) => b.evaluation.finalScore - a.evaluation.finalScore);
}

/**
 * Multi Concept Engine:
 * 1. Генерация 8 архетипов
 * 2. Оценка по 9 критериям + взвешенный Final Score
 * 3. Фильтр шаблонности (>70% похожесть с прошлыми)
 * 4. Выбор лучшей + очередь для retry
 */
export async function generateAndSelectConcept(
  input: FoundationPromptInput & {
    analysis: ProductAnalysis;
    artDirectorMode?: ArtDirectorModeId;
    recentFingerprints?: ConceptFingerprint[];
  },
): Promise<ConceptGenerationResult> {
  const modeId = input.artDirectorMode ?? "marketplace_ctr";
  const concepts = buildConceptVariants(input.productPrompt, input.analysis, modeId);

  let ranked = scoreAndRank(concepts, input.analysis, input.productPrompt, modeId);

  if (input.recentFingerprints?.length) {
    ranked = filterTemplateConcepts(ranked, input.recentFingerprints, 70);
    if (ranked.length === 0) {
      ranked = scoreAndRank(concepts, input.analysis, input.productPrompt, modeId);
    }
  }

  let selected = ranked[0];
  if (selected && selected.evaluation.finalScore < CONCEPT_PASS_THRESHOLD) {
    const better = ranked.find((r) => r.evaluation.finalScore >= CONCEPT_PASS_THRESHOLD);
    if (better) selected = better;
  }

  if (!selected) {
    const fallback = concepts[0];
    selected = {
      concept: { ...fallback, conceptScore: 85 },
      evaluation: evaluateConcept(fallback, input.analysis, input.productPrompt, { modeId }),
    };
  }

  const renderQueue = ranked.map((r) => r.concept);

  return {
    selected: selected.concept,
    candidates: ranked,
    evaluatedCount: ranked.length,
    renderQueue,
  };
}

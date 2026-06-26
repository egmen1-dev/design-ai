import type { ProductAnalysis } from "@/lib/product-analysis";
import type { CompositionScenarioId } from "@/lib/design/types";
import {
  buildConceptVariants,
  sanitizeCreativeDirectorResult,
  type CreativeDirectorResult,
  type ScoredConcept,
} from "./creative-concept";
import { evaluateConcept, CONCEPT_PASS_THRESHOLD } from "./concept-evaluator";
import { resolveArtDirector } from "./category-art-directors";
import { buildCreativeDirectorMultiPrompt } from "./creative-director-prompt";
import type { FoundationPromptInput } from "./types";
import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ai-status";
import { OLLAMA_NUM_PREDICT, OLLAMA_TIMEOUT_MS } from "@/lib/pipeline-config";

export type ConceptGenerationResult = {
  selected: CreativeDirectorResult;
  candidates: ScoredConcept[];
  evaluatedCount: number;
};

function extractJsonArray(text: string): string {
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) {
    return text.slice(arrStart, arrEnd + 1);
  }
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    return `[${text.slice(objStart, objEnd + 1)}]`;
  }
  throw new Error("Ollama не вернула валидный JSON");
}

async function callOllamaConcepts(prompt: string): Promise<unknown[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.55, num_predict: OLLAMA_NUM_PREDICT },
    }),
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Ollama: ${response.status}`);
  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Пустой ответ Ollama");

  const parsed = JSON.parse(extractJsonArray(data.response)) as unknown;
  return Array.isArray(parsed) ? parsed : [parsed];
}

function scoreAndRank(
  concepts: CreativeDirectorResult[],
  analysis: ProductAnalysis,
  prompt: string,
): ScoredConcept[] {
  return concepts
    .map((concept) => ({
      concept: { ...concept, conceptScore: undefined },
      evaluation: evaluateConcept(concept, analysis, prompt),
    }))
    .map((item) => ({
      ...item,
      concept: { ...item.concept, conceptScore: item.evaluation.total },
    }))
    .sort((a, b) => b.evaluation.total - a.evaluation.total);
}

function pickScenarioForRank(
  analysis: ProductAnalysis,
  prompt: string,
  index: number,
): CompositionScenarioId {
  const director = resolveArtDirector(analysis.category, prompt);
  return director.preferredScenarios[index % director.preferredScenarios.length] ?? "hero_product";
}

/**
 * Этап 1–2 Engine 2.0: сгенерировать 6–8 концептов (только JSON), оценить, выбрать лучший.
 * Если лучший < 90 — берём следующий по рейтингу.
 */
export async function generateAndSelectConcept(
  input: FoundationPromptInput & { analysis: ProductAnalysis },
  useOllama: boolean,
): Promise<ConceptGenerationResult> {
  const fallbackVariants = buildConceptVariants(input.productPrompt, input.analysis);
  const fallbackBest = fallbackVariants[0];
  let candidates: CreativeDirectorResult[] = fallbackVariants;

  if (useOllama) {
    try {
      const prompt = buildCreativeDirectorMultiPrompt(input);
      const rawList = await callOllamaConcepts(prompt);
      const parsed = rawList
        .slice(0, 8)
        .map((raw, i) => {
          const fb = fallbackVariants[i] ?? fallbackBest;
          return sanitizeCreativeDirectorResult(raw, {
            ...fb,
            compositionScenarioId:
              fb.compositionScenarioId ?? pickScenarioForRank(input.analysis, input.productPrompt, i),
          });
        });
      if (parsed.length >= 1) {
        candidates = parsed.length >= 6 ? parsed : [...parsed, ...fallbackVariants].slice(0, 8);
      }
    } catch {
      // deterministic fallback
    }
  }

  let ranked = scoreAndRank(candidates, input.analysis, input.productPrompt);

  let selected = ranked[0];
  if (selected && selected.evaluation.total < CONCEPT_PASS_THRESHOLD) {
    const better = ranked.find((r) => r.evaluation.total >= CONCEPT_PASS_THRESHOLD);
    if (better) selected = better;
  }
  if (!selected) {
    selected = {
      concept: { ...fallbackBest, conceptScore: 85 },
      evaluation: evaluateConcept(fallbackBest, input.analysis, input.productPrompt),
    };
  }

  return {
    selected: selected.concept,
    candidates: ranked.slice(0, 8),
    evaluatedCount: ranked.length,
  };
}

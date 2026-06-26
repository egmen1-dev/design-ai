import type { CompositionInput, CompositionLayout } from "@/lib/composition/types";
import { validateAndAdjustComposition } from "@/lib/composition/validate";
import { generateDesignDNA } from "./dna";
import { buildLayoutFromDNA } from "./build";
import { scoreComposition } from "./score";
import { selectScenario, COMPOSITION_SCENARIOS } from "./scenarios";
import { createSeededRng } from "./variability";
import type {
  CompositionEngineInput,
  CompositionResult,
  CompositionScenarioId,
} from "./types";

const MIN_SCORE = 90;
const MAX_ATTEMPTS = 10;

function attachScore(layout: CompositionLayout): CompositionLayout {
  const score = scoreComposition(layout, layout.dna!);
  return { ...layout, score: score.total };
}

/**
 * Интеллектуальный Composition Engine.
 * Каждая генерация — новая DNA + сценарий + jitter в диапазонах.
 * Перестраивает макет пока score < 90.
 */
export function generateComposition(input: CompositionEngineInput): CompositionResult {
  const baseSeed =
    input.seed ?? `gen-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  let best: CompositionResult | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = `${baseSeed}:a${attempt}`;
    const rng = createSeededRng(seed);
    const dna = generateDesignDNA(input.category, seed, input.styleHint);
    const scenario = selectScenario(dna, input.category, rng);

    const compInput: CompositionInput = {
      category: input.category,
      layout: input.layout,
      bulletCount: input.bulletCount,
      hasLeftPanel: input.hasLeftPanel,
      hasRightSidebar: input.hasRightSidebar,
      hasLogo: input.hasLogo,
      objectScale: input.objectScale,
    };

    let layout = buildLayoutFromDNA(compInput, dna, scenario, seed);
    layout = validateAndAdjustComposition({
      ...layout,
      dna,
      scenarioId: scenario.id,
      seed,
    });
    const score = scoreComposition(layout, dna);
    layout = attachScore({ ...layout, dna, scenarioId: scenario.id, seed });

    const result: CompositionResult = {
      layout,
      dna,
      scenarioId: scenario.id as CompositionScenarioId,
      score,
      seed,
      attempts: attempt + 1,
    };

    if (!best || score.total > best.score.total) {
      best = result;
    }

    if (score.total >= MIN_SCORE) {
      return result;
    }
  }

  return best!;
}

export { COMPOSITION_SCENARIOS, generateDesignDNA, scoreComposition };

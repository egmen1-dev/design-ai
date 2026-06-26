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
import {
  COMPOSITION_MAX_ATTEMPTS,
  COMPOSITION_MIN_SCORE,
} from "@/lib/pipeline-config";
import { applyVisualHookToDna } from "@/lib/design-process/visual-hook";

const MIN_SCORE = COMPOSITION_MIN_SCORE;
const MAX_ATTEMPTS = COMPOSITION_MAX_ATTEMPTS;

function attachScore(layout: CompositionLayout): CompositionLayout {
  const score = scoreComposition(layout, layout.dna!);
  return { ...layout, score: score.total };
}

function resolveScenario(
  input: CompositionEngineInput,
  dna: ReturnType<typeof generateDesignDNA>,
  rng: ReturnType<typeof createSeededRng>,
) {
  if (input.scenarioId) {
    const forced = COMPOSITION_SCENARIOS.find((s) => s.id === input.scenarioId);
    if (forced) return forced;
  }
  return selectScenario(dna, input.category, rng, input.visualHook);
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
    const dna = applyVisualHookToDna(
      generateDesignDNA(input.category, seed, input.styleHint),
      input.visualHook,
    );
    const scenario = resolveScenario(input, dna, rng);

    const compInput: CompositionInput = {
      category: input.category,
      layout: input.layout,
      bulletCount: input.bulletCount,
      hasLeftPanel: input.hasLeftPanel,
      hasRightSidebar: input.hasRightSidebar,
      hasLogo: input.hasLogo,
      objectScale: input.objectScale,
    };

    let layout = buildLayoutFromDNA(compInput, dna, scenario, seed, input.productSafeZone);
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

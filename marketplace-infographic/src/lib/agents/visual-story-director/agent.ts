import { getOllamaStatus } from "@/lib/ai-status";
import { callOllamaJson } from "@/lib/ollama-json";
import { SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import type { DesignAgent } from "../types";
import { evaluateVisualStoryDirectorHeuristic } from "./heuristic";
import { buildVisualStoryDirectorPrompt } from "./prompt";
import type { VisualStoryDirectorInput, VisualStoryDirectorResult } from "./types";

export const VISUAL_STORY_DIRECTOR_AGENT: DesignAgent<
  VisualStoryDirectorInput,
  VisualStoryDirectorResult
> = {
  id: "visual-story-director",
  name: "Visual Story Director",
  version: "1.0.0",
  run: runVisualStoryDirector,
};

export async function runVisualStoryDirector(
  input: VisualStoryDirectorInput,
): Promise<VisualStoryDirectorResult> {
  const heuristic = evaluateVisualStoryDirectorHeuristic(input);
  const status = await getOllamaStatus();
  if (status.mockMode || !status.available || SKIP_OLLAMA_QUALITY_RETRY) {
    return heuristic;
  }

  try {
    const raw = await callOllamaJson<{
      heroConcept?: string;
      sceneNarrative?: string;
      customerIntent?: string;
      emotion?: string;
      marketingHook?: string;
      score?: number;
    }>(buildVisualStoryDirectorPrompt(input), { temperature: 0.35, numPredict: 500 });

    return {
      ...heuristic,
      heroConcept: raw.heroConcept ?? heuristic.heroConcept,
      sceneNarrative: raw.sceneNarrative ?? heuristic.sceneNarrative,
      customerIntent: raw.customerIntent ?? heuristic.customerIntent,
      storyBlueprint: {
        ...heuristic.storyBlueprint,
        heroConcept: raw.heroConcept ?? heuristic.heroConcept,
        sceneNarrative: raw.sceneNarrative ?? heuristic.sceneNarrative,
        customerIntent: raw.customerIntent ?? heuristic.customerIntent,
        emotion: raw.emotion ?? heuristic.storyBlueprint.emotion,
        marketingHook: raw.marketingHook ?? heuristic.storyBlueprint.marketingHook,
      },
      score: typeof raw.score === "number" ? raw.score : heuristic.score,
      approved: (raw.score ?? heuristic.score) >= 78,
      source: "merged",
    };
  } catch (error) {
    console.warn("[visual-story-director] Ollama failed:", error);
    return heuristic;
  }
}

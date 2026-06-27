import { getOllamaStatus } from "@/lib/ai-status";
import { callOllamaJson } from "@/lib/ollama-json";
import { SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import type { DesignAgent } from "../types";
import { evaluateCommercialPhotoDirectorHeuristic } from "./heuristic";
import { buildCommercialPhotoDirectorPrompt } from "./prompt";
import type { CommercialPhotoDirectorInput, CommercialPhotoDirectorResult } from "./types";

export const COMMERCIAL_PHOTO_DIRECTOR_AGENT: DesignAgent<
  CommercialPhotoDirectorInput,
  CommercialPhotoDirectorResult
> = {
  id: "commercial-photo-director",
  name: "Commercial Photo Director",
  version: "1.0.0",
  run: runCommercialPhotoDirector,
};

export async function runCommercialPhotoDirector(
  input: CommercialPhotoDirectorInput,
): Promise<CommercialPhotoDirectorResult> {
  const heuristic = evaluateCommercialPhotoDirectorHeuristic(input);
  const status = await getOllamaStatus();
  if (status.mockMode || !status.available || SKIP_OLLAMA_QUALITY_RETRY) {
    return heuristic;
  }

  try {
    const raw = await callOllamaJson<{
      backgroundNarrative?: string;
      lightSource?: string;
      colorTemperature?: string;
      atmosphere?: string;
      score?: number;
    }>(buildCommercialPhotoDirectorPrompt(input), { temperature: 0.3, numPredict: 450 });

    return {
      ...heuristic,
      backgroundNarrative: raw.backgroundNarrative ?? heuristic.backgroundNarrative,
      photoBlueprint: {
        ...heuristic.photoBlueprint,
        backgroundNarrative: raw.backgroundNarrative ?? heuristic.backgroundNarrative,
        lightSource: raw.lightSource ?? heuristic.photoBlueprint.lightSource,
        colorTemperature: raw.colorTemperature ?? heuristic.photoBlueprint.colorTemperature,
        atmosphere: raw.atmosphere ?? heuristic.photoBlueprint.atmosphere,
      },
      scenePatch: {
        ...heuristic.scenePatch,
        lightingTemperature: raw.colorTemperature ?? heuristic.scenePatch.lightingTemperature,
        visualMood: raw.atmosphere ?? heuristic.scenePatch.visualMood,
      },
      score: typeof raw.score === "number" ? raw.score : heuristic.score,
      approved: (raw.score ?? heuristic.score) >= 76,
    };
  } catch (error) {
    console.warn("[commercial-photo-director] Ollama failed:", error);
    return heuristic;
  }
}

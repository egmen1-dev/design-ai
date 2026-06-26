import { getOllamaStatus } from "@/lib/ai-status";
import { callOllamaJson } from "@/lib/ollama-json";
import { SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import type { DesignAgent } from "../types";
import { evaluateSeniorArtDirectorHeuristic } from "./heuristic";
import { buildSeniorArtDirectorPrompt } from "./prompt";
import {
  mergeSeniorArtDirectorReviews,
  sanitizeSeniorArtDirectorReview,
} from "./sanitize";
import type { SeniorArtDirectorInput, SeniorArtDirectorReview } from "./types";

export const SENIOR_ART_DIRECTOR_AGENT: DesignAgent<
  SeniorArtDirectorInput,
  SeniorArtDirectorReview
> = {
  id: "senior-art-director",
  name: "Senior Art Director",
  version: "1.0.0",
  run: runSeniorArtDirector,
};

/** Senior Art Director — профессиональная оценка макета */
export async function runSeniorArtDirector(
  input: SeniorArtDirectorInput,
): Promise<SeniorArtDirectorReview> {
  const heuristic = evaluateSeniorArtDirectorHeuristic(input);
  heuristic.templateId = input.templateId;

  const status = await getOllamaStatus();
  if (status.mockMode || !status.available || SKIP_OLLAMA_QUALITY_RETRY) {
    return heuristic;
  }

  try {
    const prompt = buildSeniorArtDirectorPrompt(input);
    const raw = await callOllamaJson<unknown>(prompt, {
      temperature: 0.22,
      numPredict: 700,
    });
    const llm = sanitizeSeniorArtDirectorReview(raw, heuristic.score);
    llm.templateId = input.templateId;
    return mergeSeniorArtDirectorReviews(heuristic, llm);
  } catch (error) {
    console.warn("[senior-art-director] Ollama review failed, heuristic only:", error);
    return heuristic;
  }
}

export { evaluateSeniorArtDirectorHeuristic } from "./heuristic";
export { buildSeniorArtDirectorPrompt } from "./prompt";
export type {
  SeniorArtDirectorInput,
  SeniorArtDirectorReview,
  SeniorArtDirectorDimensionScores,
} from "./types";
export { SENIOR_AD_APPROVE_SCORE, SENIOR_AD_BEHANCE_SCORE } from "./types";

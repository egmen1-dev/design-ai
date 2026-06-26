import { getOllamaStatus } from "@/lib/ai-status";
import { callOllamaJson } from "@/lib/ollama-json";
import { SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import type { DesignAgent } from "../types";
import { evaluateCommercialPhotographerHeuristic } from "./heuristic";
import { buildCommercialPhotographerPrompt } from "./prompt";
import {
  mergeCommercialPhotographerReviews,
  sanitizeCommercialPhotographerReview,
} from "./sanitize";
import type { CommercialPhotographerInput, CommercialPhotographerReview } from "./types";

export const COMMERCIAL_PHOTOGRAPHER_AGENT: DesignAgent<
  CommercialPhotographerInput,
  CommercialPhotographerReview
> = {
  id: "commercial-photographer",
  name: "Commercial Photographer / CGI",
  version: "1.0.0",
  run: runCommercialPhotographer,
};

/** Коммерческий фотограф — оценка фотореализма композита */
export async function runCommercialPhotographer(
  input: CommercialPhotographerInput,
): Promise<CommercialPhotographerReview> {
  const heuristic = evaluateCommercialPhotographerHeuristic(input);
  const pngCap = !input.hasComposite || input.backgroundSource === "fallback";

  const status = await getOllamaStatus();
  if (status.mockMode || !status.available || SKIP_OLLAMA_QUALITY_RETRY) {
    return heuristic;
  }

  try {
    const prompt = buildCommercialPhotographerPrompt(input);
    const raw = await callOllamaJson<unknown>(prompt, {
      temperature: 0.2,
      numPredict: 700,
    });
    const llm = sanitizeCommercialPhotographerReview(raw, heuristic.score, pngCap);
    return mergeCommercialPhotographerReviews(heuristic, llm);
  } catch (error) {
    console.warn("[commercial-photographer] Ollama review failed, heuristic only:", error);
    return heuristic;
  }
}

export { evaluateCommercialPhotographerHeuristic } from "./heuristic";
export { buildCommercialPhotographerPrompt } from "./prompt";
export type {
  CommercialPhotographerInput,
  CommercialPhotographerReview,
  CommercialPhotographerDimensionScores,
} from "./types";
export { PHOTO_BEHANCE_SCORE, PHOTO_PNG_OVERLAY_CAP } from "./types";

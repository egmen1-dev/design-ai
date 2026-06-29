import { getOllamaStatus } from "@/lib/ai-status";
import { callOllamaJson } from "@/lib/ollama-json";
import { SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import type { DesignAgent } from "../types";
import { evaluateMarketplaceCtrHeuristic } from "./heuristic";
import { buildMarketplaceCtrExpertPrompt } from "./prompt";
import {
  mergeMarketplaceCtrReviews,
  sanitizeMarketplaceCtrReview,
} from "./sanitize";
import type { MarketplaceCtrExpertInput, MarketplaceCtrReview } from "./types";

export const MARKETPLACE_CTR_EXPERT_AGENT: DesignAgent<
  MarketplaceCtrExpertInput,
  MarketplaceCtrReview
> = {
  id: "marketplace-ctr-expert",
  name: "Marketplace CTR Expert",
  version: "1.0.0",
  run: runMarketplaceCtrExpert,
};

/** Эксперт по CTR Wildberries — маркетинговая оценка карточки */
export async function runMarketplaceCtrExpert(
  input: MarketplaceCtrExpertInput,
): Promise<MarketplaceCtrReview> {
  const heuristic = evaluateMarketplaceCtrHeuristic(input);

  const status = await getOllamaStatus();
  if (status.mockMode || !status.available || SKIP_OLLAMA_QUALITY_RETRY) {
    return heuristic;
  }

  try {
    const prompt = buildMarketplaceCtrExpertPrompt(input);
    const raw = await callOllamaJson<unknown>(prompt, {
      temperature: 0.25,
      numPredict: 650,
    });
    const llm = sanitizeMarketplaceCtrReview(raw, heuristic.score);
    llm.templateId = input.templateId;
    return mergeMarketplaceCtrReviews(heuristic, llm);
  } catch (error) {
    console.warn("[marketplace-ctr] Ollama review failed, heuristic only:", error);
    return heuristic;
  }
}

export { evaluateMarketplaceCtrHeuristic } from "./heuristic";
export { buildMarketplaceCtrExpertPrompt } from "./prompt";
export type {
  MarketplaceCtrExpertInput,
  MarketplaceCtrReview,
  MarketplaceCtrDimensionScores,
} from "./types";
export { CTR_CLICK_SCORE, CTR_AVERAGE_CAP } from "./types";

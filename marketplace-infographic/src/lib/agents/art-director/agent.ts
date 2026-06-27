import { getOllamaStatus } from "@/lib/ai-status";
import { callOllamaJson } from "@/lib/ollama-json";
import { SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import type { DesignAgent } from "../types";
import { evaluateArtDirectorHeuristic } from "./heuristic";
import { buildArtDirectorPrompt } from "./prompt";
import type { ArtDirectorInput, ArtDirectorReview } from "./types";

export const ART_DIRECTOR_AGENT: DesignAgent<ArtDirectorInput, ArtDirectorReview> = {
  id: "art-director",
  name: "Art Director",
  version: "1.0.0",
  run: runArtDirector,
};

export async function runArtDirector(input: ArtDirectorInput): Promise<ArtDirectorReview> {
  const heuristic = evaluateArtDirectorHeuristic(input);
  const status = await getOllamaStatus();
  if (status.mockMode || !status.available || SKIP_OLLAMA_QUALITY_RETRY) {
    return heuristic;
  }

  try {
    const raw = await callOllamaJson<Partial<ArtDirectorReview>>(buildArtDirectorPrompt(input), {
      temperature: 0.25,
      numPredict: 400,
    });
    const score = typeof raw.score === "number" ? raw.score : heuristic.score;
    return {
      ...heuristic,
      score,
      modernityScore: raw.modernityScore ?? heuristic.modernityScore,
      trendAlignment: raw.trendAlignment ?? heuristic.trendAlignment,
      storyAlignment: raw.storyAlignment ?? heuristic.storyAlignment,
      problems: raw.problems?.length ? raw.problems : heuristic.problems,
      recommendations: raw.recommendations?.length ? raw.recommendations : heuristic.recommendations,
      approved: score >= 88,
      source: "merged",
    };
  } catch {
    return heuristic;
  }
}

export { evaluateArtDirectorHeuristic } from "./heuristic";
export type { ArtDirectorInput, ArtDirectorReview } from "./types";
export { ART_DIRECTOR_APPROVE_SCORE } from "./types";

import { getOllamaStatus } from "@/lib/ai-status";
import { callOllamaJson } from "@/lib/ollama-json";
import { SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import type { DesignAgent } from "../types";
import { deriveFixApplicationHints } from "./apply-hints";
import { buildChiefDesignDirectorHeuristic } from "./heuristic";
import { buildChiefDesignDirectorPrompt } from "./prompt";
import {
  mergeChiefDesignDirectorPlans,
  sanitizeChiefDesignDirectorPlan,
} from "./sanitize";
import type { ChiefDesignDirectorInput, ChiefDesignDirectorPlan } from "./types";

export const CHIEF_DESIGN_DIRECTOR_AGENT: DesignAgent<
  ChiefDesignDirectorInput,
  ChiefDesignDirectorPlan
> = {
  id: "chief-design-director",
  name: "Chief Design Director",
  version: "1.0.0",
  run: runChiefDesignDirector,
};

/** Chief Design Director — объединяет отчёты экспертов в план исправлений */
export async function runChiefDesignDirector(
  input: ChiefDesignDirectorInput,
): Promise<ChiefDesignDirectorPlan> {
  const heuristic = buildChiefDesignDirectorHeuristic(input);

  const status = await getOllamaStatus();
  if (status.mockMode || !status.available || SKIP_OLLAMA_QUALITY_RETRY) {
    return heuristic;
  }

  try {
    const prompt = buildChiefDesignDirectorPrompt(input);
    const raw = await callOllamaJson<unknown>(prompt, {
      temperature: 0.18,
      numPredict: 900,
    });
    const llm = sanitizeChiefDesignDirectorPlan(raw, heuristic);
    return mergeChiefDesignDirectorPlans(heuristic, llm);
  } catch (error) {
    console.warn("[chief-design-director] Ollama failed, heuristic only:", error);
    return heuristic;
  }
}

export { buildChiefDesignDirectorHeuristic } from "./heuristic";
export { buildChiefDesignDirectorPrompt } from "./prompt";
export { deriveFixApplicationHints } from "./apply-hints";
export type { FixApplicationHints } from "./apply-hints";
export type { ChiefDesignDirectorInput, ChiefDesignDirectorPlan, FixAction, TopProblem } from "./types";
export { CHIEF_APPROVE_SCORE } from "./types";

import type { SeniorArtDirectorReview, SeniorArtDirectorDimensionScores } from "./types";
import { SENIOR_AD_APPROVE_SCORE } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function avg(scores: number[]) {
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

type RawReview = {
  score?: number;
  approved?: boolean;
  criticalProblems?: unknown;
  recommendations?: unknown;
  scores?: Partial<SeniorArtDirectorDimensionScores>;
};

export function sanitizeSeniorArtDirectorReview(
  raw: unknown,
  fallbackScore = 70,
): SeniorArtDirectorReview {
  const p = (raw ?? {}) as RawReview;
  const scores: SeniorArtDirectorDimensionScores = {
    composition: clamp(p.scores?.composition ?? fallbackScore),
    typography: clamp(p.scores?.typography ?? fallbackScore),
    hierarchy: clamp(p.scores?.hierarchy ?? fallbackScore),
    balance: clamp(p.scores?.balance ?? fallbackScore),
    minimalism: clamp(p.scores?.minimalism ?? fallbackScore),
    modernLook: clamp(p.scores?.modernLook ?? fallbackScore),
  };

  const score = clamp(p.score ?? avg(Object.values(scores)));
  const criticalProblems = Array.isArray(p.criticalProblems)
    ? p.criticalProblems.map(String).filter(Boolean).slice(0, 12)
    : [];
  const recommendations = Array.isArray(p.recommendations)
    ? p.recommendations.map(String).filter(Boolean).slice(0, 12)
    : [];

  const approved =
    typeof p.approved === "boolean"
      ? p.approved && score >= SENIOR_AD_APPROVE_SCORE
      : score >= SENIOR_AD_APPROVE_SCORE && criticalProblems.length === 0;

  return {
    score,
    approved,
    criticalProblems,
    recommendations,
    scores,
    source: "ollama",
  };
}

export function mergeSeniorArtDirectorReviews(
  heuristic: SeniorArtDirectorReview,
  llm: SeniorArtDirectorReview,
): SeniorArtDirectorReview {
  const scores: SeniorArtDirectorDimensionScores = {
    composition: Math.min(heuristic.scores.composition, llm.scores.composition),
    typography: Math.min(heuristic.scores.typography, llm.scores.typography),
    hierarchy: Math.min(heuristic.scores.hierarchy, llm.scores.hierarchy),
    balance: Math.min(heuristic.scores.balance, llm.scores.balance),
    minimalism: Math.min(heuristic.scores.minimalism, llm.scores.minimalism),
    modernLook: Math.min(heuristic.scores.modernLook, llm.scores.modernLook),
  };

  const score = Math.min(heuristic.score, llm.score);
  const criticalProblems = [...new Set([...heuristic.criticalProblems, ...llm.criticalProblems])].slice(0, 12);
  const recommendations = [...new Set([...heuristic.recommendations, ...llm.recommendations])].slice(0, 12);

  return {
    score,
    approved: score >= SENIOR_AD_APPROVE_SCORE && criticalProblems.length === 0,
    criticalProblems,
    recommendations,
    scores,
    source: "merged",
    templateId: heuristic.templateId ?? llm.templateId,
  };
}

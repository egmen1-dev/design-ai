import type {
  MarketplaceCtrDimensionScores,
  MarketplaceCtrReview,
} from "./types";
import { CTR_AVERAGE_CAP, CTR_CLICK_SCORE } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

type RawCtrReview = {
  score?: number;
  ctrPrediction?: number;
  wouldClick?: boolean;
  mainProblems?: unknown;
  recommendations?: unknown;
  scores?: Partial<MarketplaceCtrDimensionScores>;
};

export function sanitizeMarketplaceCtrReview(
  raw: unknown,
  fallbackScore = 62,
): MarketplaceCtrReview {
  const p = (raw ?? {}) as RawCtrReview;
  const scores: MarketplaceCtrDimensionScores = {
    clarity: clamp(p.scores?.clarity ?? fallbackScore),
    sellingPower: clamp(p.scores?.sellingPower ?? fallbackScore),
    attention: clamp(p.scores?.attention ?? fallbackScore),
    emotion: clamp(p.scores?.emotion ?? fallbackScore),
    marketplaceFit: clamp(p.scores?.marketplaceFit ?? fallbackScore),
  };

  let score = clamp(p.score ?? Object.values(scores).reduce((a, b) => a + b, 0) / 5);
  const mainProblems = Array.isArray(p.mainProblems)
    ? p.mainProblems.map(String).filter(Boolean).slice(0, 10)
    : [];
  const recommendations = Array.isArray(p.recommendations)
    ? p.recommendations.map(String).filter(Boolean).slice(0, 10)
    : [];

  if (score > CTR_AVERAGE_CAP && mainProblems.length > 0) {
    score = Math.min(score, CTR_AVERAGE_CAP);
  }

  const ctrPrediction = clamp(
    p.ctrPrediction ?? score * 0.85 - mainProblems.length * 4,
  );

  const wouldClick =
    typeof p.wouldClick === "boolean"
      ? p.wouldClick && score >= CTR_CLICK_SCORE - 5
      : score >= CTR_CLICK_SCORE && ctrPrediction >= 72 && mainProblems.length === 0;

  return {
    score,
    ctrPrediction,
    wouldClick,
    confidence: clamp(score - mainProblems.length * 5),
    mainProblems,
    issues: mainProblems,
    recommendations,
    corrections: [],
    layoutSpecPatch: {},
    scores,
    source: "ollama",
  };
}

export function mergeMarketplaceCtrReviews(
  heuristic: MarketplaceCtrReview,
  llm: MarketplaceCtrReview,
): MarketplaceCtrReview {
  const scores: MarketplaceCtrDimensionScores = {
    clarity: Math.min(heuristic.scores.clarity, llm.scores.clarity),
    sellingPower: Math.min(heuristic.scores.sellingPower, llm.scores.sellingPower),
    attention: Math.min(heuristic.scores.attention, llm.scores.attention),
    emotion: Math.min(heuristic.scores.emotion, llm.scores.emotion),
    marketplaceFit: Math.min(heuristic.scores.marketplaceFit, llm.scores.marketplaceFit),
  };

  const score = Math.min(heuristic.score, llm.score);
  const ctrPrediction = Math.min(heuristic.ctrPrediction, llm.ctrPrediction);
  const mainProblems = [...new Set([...heuristic.mainProblems, ...llm.mainProblems])].slice(0, 10);
  const recommendations = [...new Set([...heuristic.recommendations, ...llm.recommendations])].slice(0, 10);

  const wouldClick =
    score >= CTR_CLICK_SCORE &&
    ctrPrediction >= 72 &&
    mainProblems.length === 0 &&
    heuristic.wouldClick &&
    llm.wouldClick;

  return {
    score,
    ctrPrediction,
    wouldClick,
    confidence: Math.min(heuristic.confidence, llm.confidence),
    mainProblems,
    issues: mainProblems,
    recommendations,
    corrections: [...(heuristic.corrections ?? []), ...(llm.corrections ?? [])],
    layoutSpecPatch: { ...(heuristic.layoutSpecPatch ?? {}), ...(llm.layoutSpecPatch ?? {}) },
    scores,
    source: "merged",
    templateId: heuristic.templateId ?? llm.templateId,
  };
}

import type {
  CommercialPhotographerDimensionScores,
  CommercialPhotographerReview,
} from "./types";
import { PHOTO_BEHANCE_SCORE, PHOTO_PNG_OVERLAY_CAP } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

type RawPhotoReview = {
  score?: number;
  realism?: number;
  looksLikePhoto?: boolean;
  problems?: unknown;
  recommendations?: unknown;
  scores?: Partial<CommercialPhotographerDimensionScores>;
};

export function sanitizeCommercialPhotographerReview(
  raw: unknown,
  fallbackScore = 65,
  pngCap = false,
): CommercialPhotographerReview {
  const p = (raw ?? {}) as RawPhotoReview;
  const scores: CommercialPhotographerDimensionScores = {
    lighting: clamp(p.scores?.lighting ?? fallbackScore),
    shadows: clamp(p.scores?.shadows ?? fallbackScore),
    perspective: clamp(p.scores?.perspective ?? fallbackScore),
    integration: clamp(p.scores?.integration ?? fallbackScore),
    colorMatching: clamp(p.scores?.colorMatching ?? fallbackScore),
    realism: clamp(p.scores?.realism ?? p.realism ?? fallbackScore),
  };

  let score = clamp(p.score ?? Object.values(scores).reduce((a, b) => a + b, 0) / 6);
  let realism = clamp(p.realism ?? scores.realism);
  const problems = Array.isArray(p.problems) ? p.problems.map(String).filter(Boolean).slice(0, 12) : [];
  const recommendations = Array.isArray(p.recommendations)
    ? p.recommendations.map(String).filter(Boolean).slice(0, 12)
    : [];

  if (pngCap || problems.some((x) => /png|вставлен/i.test(x))) {
    score = Math.min(score, PHOTO_PNG_OVERLAY_CAP);
    realism = Math.min(realism, PHOTO_PNG_OVERLAY_CAP);
    scores.integration = Math.min(scores.integration, PHOTO_PNG_OVERLAY_CAP);
    scores.realism = realism;
  }

  if (score > PHOTO_BEHANCE_SCORE && problems.length > 0) {
    score = PHOTO_BEHANCE_SCORE;
  }

  const looksLikePhoto =
    typeof p.looksLikePhoto === "boolean"
      ? p.looksLikePhoto && score >= 78 && problems.length === 0
      : score >= 82 && realism >= 78 && problems.length === 0;

  return {
    score,
    realism,
    looksLikePhoto,
    problems,
    recommendations,
    scores,
    source: "ollama",
  };
}

export function mergeCommercialPhotographerReviews(
  heuristic: CommercialPhotographerReview,
  llm: CommercialPhotographerReview,
): CommercialPhotographerReview {
  const scores: CommercialPhotographerDimensionScores = {
    lighting: Math.min(heuristic.scores.lighting, llm.scores.lighting),
    shadows: Math.min(heuristic.scores.shadows, llm.scores.shadows),
    perspective: Math.min(heuristic.scores.perspective, llm.scores.perspective),
    integration: Math.min(heuristic.scores.integration, llm.scores.integration),
    colorMatching: Math.min(heuristic.scores.colorMatching, llm.scores.colorMatching),
    realism: Math.min(heuristic.scores.realism, llm.scores.realism),
  };

  const score = Math.min(heuristic.score, llm.score);
  const realism = Math.min(heuristic.realism, llm.realism);
  const problems = [...new Set([...heuristic.problems, ...llm.problems])].slice(0, 12);
  const recommendations = [...new Set([...heuristic.recommendations, ...llm.recommendations])].slice(0, 12);

  const looksLikePhoto =
    heuristic.looksLikePhoto &&
    llm.looksLikePhoto &&
    score >= 82 &&
    realism >= 78 &&
    problems.length === 0;

  return {
    score,
    realism,
    looksLikePhoto,
    problems,
    recommendations,
    scores,
    source: "merged",
  };
}

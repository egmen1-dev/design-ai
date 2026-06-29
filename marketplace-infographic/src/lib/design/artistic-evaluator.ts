import type { CompositionLayout } from "@/lib/composition/types";
import type { CreativeConcept, OneThought } from "@/lib/design-process/creative-concept";

export type ArtisticScore = {
  posterLike: number;
  premiumFeel: number;
  instantComprehension: number;
  professionalFeel: number;
  notOverloaded: number;
  productDominance: number;
  total: number;
  passed: boolean;
};

export type ArtisticEvaluatorInput = {
  creativeConcept: CreativeConcept;
  oneThought: OneThought;
  compositionLayout?: CompositionLayout;
  elementCount?: number;
};

const PASS_THRESHOLD = 90;

/** Художественная оценка — рекламный постер, не шаблон */
export function evaluateArtistic(input: ArtisticEvaluatorInput): ArtisticScore {
  const layout = input.compositionLayout;
  const productArea = layout?.metrics?.productAreaPct ?? 62;
  const textArea = layout?.metrics?.textAreaPct ?? 12;
  const plaqueArea = layout?.metrics?.plaqueAreaPct ?? 8;
  const overlap = layout?.metrics?.overlapPct ?? 0;
  const elements = input.elementCount ?? 3;

  const posterLike =
    input.creativeConcept.visualHook.length > 40 && productArea >= 58 ? 94 : 78;

  const premiumFeel =
    input.creativeConcept.emotion.includes("престиж") ||
    input.creativeConcept.mainIdea.length > 20 ||
    (input.creativeConcept.styleKeywords?.length ?? 0) >= 3
      ? 92
      : 88;

  const instantComprehension =
    input.oneThought.headline.length <= 45 &&
    input.oneThought.answer.length <= 8 &&
    (input.creativeConcept.whatToSayInOneSecond?.length ?? 0) <= 60
      ? 95
      : 80;

  const professionalFeel =
    input.creativeConcept.reason.length > 30 ? 93 : 85;

  const notOverloaded =
    elements <= 4 && textArea < 18 && plaqueArea < 10 && overlap < 5 ? 96 : 70;

  const productDominance =
    productArea >= 60 && productArea <= 76 ? 95 : productArea >= 55 ? 82 : 65;

  const dimensions = [
    posterLike,
    premiumFeel,
    instantComprehension,
    professionalFeel,
    notOverloaded,
    productDominance,
  ];
  const total = Math.round(dimensions.reduce((a, b) => a + b, 0) / dimensions.length);

  return {
    posterLike,
    premiumFeel,
    instantComprehension,
    professionalFeel,
    notOverloaded,
    productDominance,
    total,
    passed: dimensions.every((d) => d >= PASS_THRESHOLD) && total >= PASS_THRESHOLD,
  };
}

export { PASS_THRESHOLD as ARTISTIC_PASS_THRESHOLD };

import type { CompositionLayout } from "@/lib/composition/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { ProductAnalysis } from "@/lib/product-analysis";

export type MarketplaceCtrDimensionScores = {
  clarity: number;
  sellingPower: number;
  attention: number;
  emotion: number;
  marketplaceFit: number;
};

export type MarketplaceCtrReview = {
  score: number;
  ctrPrediction: number;
  wouldClick: boolean;
  mainProblems: string[];
  recommendations: string[];
  scores: MarketplaceCtrDimensionScores;
  source: "heuristic" | "ollama" | "merged";
  templateId?: LayoutTemplateId;
};

export type MarketplaceCtrExpertInput = {
  meaning: CardMeaning;
  layout: CompositionLayout;
  templateId: LayoutTemplateId;
  creative?: CreativeDirectorResult;
  analysis: ProductAnalysis;
  productPrompt: string;
  elementCount?: number;
  marketIntelligenceSnippet?: string;
};

/** Средняя карточка не должна быть выше ~70; клик среди 100 конкурентов — строго */
export const CTR_CLICK_SCORE = 78;
export const CTR_AVERAGE_CAP = 70;

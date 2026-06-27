import type { CompositionLayout } from "@/lib/composition/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { CriticCorrection } from "@/lib/design/quality-v165/critic-corrections";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec/types";

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
  confidence: number;
  mainProblems: string[];
  issues: string[];
  recommendations: string[];
  corrections: CriticCorrection[];
  layoutSpecPatch: LayoutSpecPatch;
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
  storyBlueprintSnippet?: string;
};

/** Средняя карточка не должна быть выше ~70; клик среди 100 конкурентов — строго */
export const CTR_CLICK_SCORE = 78;
export const CTR_AVERAGE_CAP = 70;

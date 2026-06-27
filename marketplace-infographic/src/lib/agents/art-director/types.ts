import type { CardMeaning } from "@/lib/layout-engine/types";
import type { CompositionLayout } from "@/lib/composition/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { TrendIntelligenceContext } from "@/lib/design/trend-intelligence";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";

export type ArtDirectorReview = {
  score: number;
  approved: boolean;
  modernityScore: number;
  trendAlignment: number;
  storyAlignment: number;
  problems: string[];
  recommendations: string[];
  source: "heuristic" | "ollama" | "merged";
  templateId?: LayoutTemplateId;
};

export type ArtDirectorInput = {
  meaning: CardMeaning;
  layout: CompositionLayout;
  templateId: LayoutTemplateId;
  creative?: CreativeDirectorResult;
  analysis: ProductAnalysis;
  productPrompt: string;
  storyBlueprintSnippet?: string;
  trendIntelligence?: TrendIntelligenceContext;
};

export const ART_DIRECTOR_APPROVE_SCORE = 88;

import type { CompositionLayout } from "@/lib/composition/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { TrendIntelligenceContext } from "@/lib/design/trend-intelligence";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { CriticCorrection } from "@/lib/design/quality-v165/critic-corrections";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec/types";

export type ArtDirectorReview = {
  score: number;
  approved: boolean;
  confidence: number;
  modernityScore: number;
  trendAlignment: number;
  storyAlignment: number;
  problems: string[];
  issues: string[];
  recommendations: string[];
  corrections: CriticCorrection[];
  layoutSpecPatch: LayoutSpecPatch;
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

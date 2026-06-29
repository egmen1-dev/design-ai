import type { CompositionLayout } from "@/lib/composition/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { CriticCorrection } from "@/lib/design/quality-v165/critic-corrections";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec/types";

export type SeniorArtDirectorDimensionScores = {
  composition: number;
  typography: number;
  hierarchy: number;
  balance: number;
  minimalism: number;
  modernLook: number;
};

export type SeniorArtDirectorReview = {
  score: number;
  approved: boolean;
  confidence: number;
  criticalProblems: string[];
  issues: string[];
  recommendations: string[];
  corrections: CriticCorrection[];
  layoutSpecPatch: LayoutSpecPatch;
  scores: SeniorArtDirectorDimensionScores;
  source: "heuristic" | "ollama" | "merged";
  templateId?: LayoutTemplateId;
};

export type SeniorArtDirectorInput = {
  meaning: CardMeaning;
  layout: CompositionLayout;
  templateId: LayoutTemplateId;
  creative?: CreativeDirectorResult;
  analysis: ProductAnalysis;
  productPrompt: string;
  headlineFontPx?: number;
  hasComposite?: boolean;
  elementCount?: number;
  marketIntelligenceSnippet?: string;
  storyBlueprintSnippet?: string;
};

export const SENIOR_AD_APPROVE_SCORE = 90;
export const SENIOR_AD_BEHANCE_SCORE = 95;

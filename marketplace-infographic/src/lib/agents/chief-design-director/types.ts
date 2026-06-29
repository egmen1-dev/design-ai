import type { CardMeaning } from "@/lib/layout-engine/types";
import type { CompositionLayout } from "@/lib/composition/types";
import type { SeniorArtDirectorReview } from "../senior-art-director/types";
import type { MarketplaceCtrReview } from "../marketplace-ctr-expert/types";
import type { CommercialPhotographerReview } from "../commercial-photographer/types";

export type FixPriority = "critical" | "major" | "minor";

export type FixAction = {
  priority: FixPriority;
  action: string;
  expectedImprovement: string;
};

export type TopProblem = {
  problem: string;
  reason: string;
};

export type ChiefDesignDirectorPlan = {
  approved: boolean;
  estimatedScoreAfterFix: number;
  topProblems: TopProblem[];
  layoutChanges: FixAction[];
  typographyChanges: FixAction[];
  backgroundChanges: FixAction[];
  lightingChanges: FixAction[];
  productChanges: FixAction[];
  colorChanges: FixAction[];
  effectChanges: FixAction[];
  badgeChanges: FixAction[];
  compositionChanges: FixAction[];
  finalAdvice: string;
  source: "heuristic" | "ollama" | "merged";
};

export type ChiefDesignDirectorInput = {
  cardMeaning: CardMeaning;
  layout: CompositionLayout;
  designScore?: number;
  templateId?: string;
  seniorArtDirector: SeniorArtDirectorReview;
  marketplaceExpert: MarketplaceCtrReview;
  commercialPhotographer: CommercialPhotographerReview;
  productPrompt: string;
  marketIntelligenceSnippet?: string;
  storyBlueprintSnippet?: string;
};

export const CHIEF_APPROVE_SCORE = 95;

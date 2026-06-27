import type { ChiefDesignDirectorPlan } from "@/lib/agents/chief-design-director/types";
import type { CommercialPhotographerReview } from "@/lib/agents/commercial-photographer/types";
import type { ParametricBadgeSnapshot } from "@/lib/agents/design-memory/types";
import type { MarketplaceCtrReview } from "@/lib/agents/marketplace-ctr-expert/types";
import type { SeniorArtDirectorReview } from "@/lib/agents/senior-art-director/types";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { ProductCategory } from "@/lib/product-analysis";

export type UserFeedbackValue = "like" | "dislike";

export type FeedbackLearningSnapshot = {
  productCategory: ProductCategory;
  knowledgeCategory?: KnowledgeCategory;
  templateId?: LayoutTemplateId;
  fontId?: string | null;
  badgeId?: string | null;
  scenePlan?: ScenePlan;
  designScore?: number;
  cardMeaning?: CardMeaning;
  seniorAdReview?: SeniorArtDirectorReview;
  ctrReview?: MarketplaceCtrReview;
  photoReview?: CommercialPhotographerReview;
  chiefPlan?: ChiefDesignDirectorPlan;
  parametricBadgeKey?: string;
  parametricBadgeModel?: ParametricBadgeSnapshot;
  recommendedFontFamily?: string;
  recommendedPaletteKey?: string;
  generationHistoryId?: string;
  designGenomeKey?: string;
};

export type ApplyUserFeedbackResult = {
  imageId: string;
  feedback: UserFeedbackValue;
  designMemoryUpdated: boolean;
  knowledgePatternUpdated: boolean;
  assetsUpdated: number;
};

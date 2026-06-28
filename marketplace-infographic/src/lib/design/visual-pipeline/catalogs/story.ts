import type { ProductCategory } from "@/lib/product-analysis";
import type {
  StoryDecision,
  StoryTypeId,
  TargetEmotionId,
  UsageContextId,
} from "../types";
import type { SceneTypeId } from "@/lib/design/scene-blueprint/types";

const CATEGORY_STORY: Partial<Record<ProductCategory, StoryTypeId>> = {
  home_appliances: "domestic",
  electronics: "technical",
  cosmetics: "premium",
  fashion: "lifestyle",
  garden_tools: "workshop",
  sport: "lifestyle",
  auto: "industrial_product",
  food: "domestic",
  kids: "lifestyle",
  premium: "premium",
  generic: "premium",
};

const STORY_SCENE: Record<StoryTypeId, SceneTypeId> = {
  industrial_product: "industrial_studio",
  lifestyle: "lifestyle",
  workshop: "workshop",
  premium: "premium_studio",
  technical: "technical_presentation",
  domestic: "kitchen",
};

const STORY_EMOTION: Record<StoryTypeId, TargetEmotionId> = {
  industrial_product: "professional",
  lifestyle: "calm",
  workshop: "confidence",
  premium: "luxury",
  technical: "trust",
  domestic: "calm",
};

const STORY_CONTEXT: Record<StoryTypeId, UsageContextId> = {
  industrial_product: "professional",
  lifestyle: "home",
  workshop: "utility",
  premium: "retail",
  technical: "professional",
  domestic: "home",
};

export function resolveStoryDecision(
  category: ProductCategory,
  priceSegment: "budget" | "mid" | "premium",
): StoryDecision {
  let storyType = CATEGORY_STORY[category] ?? "premium";
  if (priceSegment === "premium" && storyType !== "technical") {
    storyType = "premium";
  }
  return {
    storyType,
    targetEmotion: STORY_EMOTION[storyType],
    usageContext: STORY_CONTEXT[storyType],
  };
}

export function storyTypeToSceneType(storyType: StoryTypeId): SceneTypeId {
  return STORY_SCENE[storyType];
}

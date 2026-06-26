import type { ProductCategory } from "@/lib/product-analysis";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";
import { getCachedDesignMemoryStore } from "./store";
import { MEMORY_OVERUSE_THRESHOLD } from "./types";

export function getMemoryLayoutBoost(
  templateId: LayoutTemplateId,
  category?: ProductCategory,
): number {
  const store = getCachedDesignMemoryStore();
  if (!store) return 0;

  let boost = 0;

  const global = store.layoutWeights[templateId];
  if (global && global.samples >= 2) {
    boost += (global.weight - 0.5) * 24;
  }

  if (category) {
    const cat = store.categories[category];
    const catLayout = cat?.layoutWeights[templateId];
    if (catLayout && catLayout.samples >= 2) {
      boost += (catLayout.weight - 0.5) * 28;
    }
  }

  const recentCount = store.recentTemplateUsage.filter((id) => id === templateId).length;
  if (recentCount >= MEMORY_OVERUSE_THRESHOLD) {
    boost -= 10 * (recentCount - MEMORY_OVERUSE_THRESHOLD + 1);
  }

  if (store.avoidPatterns.some((pattern) => pattern.endsWith(templateId))) {
    boost -= 14;
  }

  return boost;
}

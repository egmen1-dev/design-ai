import type { ProductCategory } from "@/lib/product-analysis";
import type { DesignMemoryStore, DesignMemoryUpdateResult, WeightChange } from "./types";
import { DESIGN_MEMORY_VERSION } from "./types";
import type { LearnResult } from "./learn";

function topWeightChanges(
  weights: Record<string, { weight: number; samples: number }>,
  limit = 5,
): WeightChange[] {
  return Object.entries(weights)
    .filter(([, entry]) => entry.samples >= 2)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, limit)
    .map(([key, entry]) => ({
      key,
      delta: Number((entry.weight - 0.5).toFixed(3)),
      reason: `avg weight ${entry.weight.toFixed(2)} (${entry.samples} samples)`,
    }));
}

function bottomWeightChanges(
  weights: Record<string, { weight: number; samples: number }>,
  limit = 3,
): WeightChange[] {
  return Object.entries(weights)
    .filter(([, entry]) => entry.samples >= 2)
    .sort((a, b) => a[1].weight - b[1].weight)
    .slice(0, limit)
    .map(([key, entry]) => ({
      key,
      delta: Number((entry.weight - 0.5).toFixed(3)),
      reason: `low avg weight ${entry.weight.toFixed(2)} (${entry.samples} samples)`,
    }));
}

function buildAdvice(store: DesignMemoryStore, learn: LearnResult): string[] {
  const advice: string[] = [];

  const topLayouts = topWeightChanges(store.layoutWeights, 3);
  const weakLayouts = bottomWeightChanges(store.layoutWeights, 2);
  const topLighting = topWeightChanges(store.lightingWeights, 2);
  const weakBadges = bottomWeightChanges(store.badgeWeights, 2);

  for (const layout of topLayouts) {
    if (layout.delta > 0.05) {
      advice.push(`Increase probability of layout ${layout.key}.`);
    }
  }
  for (const layout of weakLayouts) {
    if (layout.delta < -0.05) {
      advice.push(`Reduce usage of layout ${layout.key}.`);
    }
  }
  for (const light of topLighting) {
    if (light.delta > 0.04) {
      advice.push(`Prefer lighting profile ${light.key}.`);
    }
  }
  for (const badge of weakBadges) {
    if (badge.delta < -0.06) {
      advice.push(`Use badge ${badge.key} less often.`);
    }
  }

  for (const pattern of store.avoidPatterns) {
    if (pattern.startsWith("overused_layout:")) {
      advice.push(`Reduce repetition of ${pattern.replace("overused_layout:", "layout ")}.`);
    }
  }

  if (learn.outcome >= 0.7) {
    advice.push("Repeat similar composition combinations for this category.");
  } else if (learn.outcome < 0.45) {
    advice.push("Increase negative space and simplify badge density.");
  }

  return [...new Set(advice)].slice(0, 8);
}

export function buildMemoryReport(
  store: DesignMemoryStore,
  learn: LearnResult,
  category?: ProductCategory,
): DesignMemoryUpdateResult {
  const catMem = category ? store.categories[category] : undefined;

  return {
    learningVersion: DESIGN_MEMORY_VERSION,
    memoryUpdate: true,
    patternDetected: learn.successfulPatterns.length > 0 || learn.unsuccessfulPatterns.length > 0,
    successfulPatterns: learn.successfulPatterns,
    unsuccessfulPatterns: learn.unsuccessfulPatterns,
    recommendedWeightChanges: learn.recommendedWeightChanges,
    layoutWeights: topWeightChanges(catMem?.layoutWeights ?? store.layoutWeights),
    fontWeights: topWeightChanges(store.fontWeights, 4),
    badgeWeights: topWeightChanges(store.badgeWeights, 4),
    lightingWeights: topWeightChanges(catMem?.lightingWeights ?? store.lightingWeights, 4),
    backgroundWeights: topWeightChanges(catMem?.backgroundWeights ?? store.backgroundWeights, 4),
    compositionWeights: topWeightChanges(store.compositionWeights, 4),
    avoidPatterns: store.avoidPatterns,
    nextGenerationAdvice: buildAdvice(store, learn),
  };
}

import type { ProductCategory } from "@/lib/product-analysis";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";

export const DESIGN_MEMORY_VERSION = "1.0";
export const MEMORY_EMA_ALPHA = 0.15;
export const MEMORY_OVERUSE_WINDOW = 20;
export const MEMORY_OVERUSE_THRESHOLD = 3;

export type WeightEntry = {
  weight: number;
  samples: number;
  avgScore: number;
};

export type PatternCombo = {
  pattern: string;
  delta: number;
  samples: number;
};

export type WeightChange = {
  key: string;
  delta: number;
  reason: string;
};

export type DesignMemoryStore = {
  learningVersion: string;
  updatedAt: string;
  totalSamples: number;
  categories: Partial<Record<ProductCategory, CategoryMemory>>;
  layoutWeights: Record<string, WeightEntry>;
  fontWeights: Record<string, WeightEntry>;
  badgeWeights: Record<string, WeightEntry>;
  lightingWeights: Record<string, WeightEntry>;
  backgroundWeights: Record<string, WeightEntry>;
  compositionWeights: Record<string, WeightEntry>;
  comboScores: Record<string, WeightEntry>;
  recentTemplateUsage: LayoutTemplateId[];
  avoidPatterns: string[];
};

export type CategoryMemory = {
  samples: number;
  layoutWeights: Record<string, WeightEntry>;
  lightingWeights: Record<string, WeightEntry>;
  backgroundWeights: Record<string, WeightEntry>;
  avgDesignScore: number;
};

export type DesignMemoryUpdateResult = {
  learningVersion: string;
  memoryUpdate: boolean;
  patternDetected: boolean;
  successfulPatterns: PatternCombo[];
  unsuccessfulPatterns: PatternCombo[];
  recommendedWeightChanges: WeightChange[];
  layoutWeights: WeightChange[];
  fontWeights: WeightChange[];
  badgeWeights: WeightChange[];
  lightingWeights: WeightChange[];
  backgroundWeights: WeightChange[];
  compositionWeights: WeightChange[];
  avoidPatterns: string[];
  nextGenerationAdvice: string[];
};

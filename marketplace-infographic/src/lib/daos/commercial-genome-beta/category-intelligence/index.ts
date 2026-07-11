import type { FeatureFlagDefinition } from "@/lib/daos/feature-flag-registry";
import type { CommercialDecisionBeta } from "../types";
import { applyCategoryIntelligence } from "./apply-category-intelligence";
import { getCategoryProfile, WAVE1_CATEGORY_KEYS } from "./profiles";
import { resolveCategoryIntelligenceKey } from "./resolve-category-key";
import type {
  CategoryAttentionRules,
  CategoryIntelligenceKey,
  CategoryIntelligenceProfile,
  CategoryIntelligenceResult,
} from "./types";
import { CATEGORY_INTELLIGENCE_FLAG, CATEGORY_INTELLIGENCE_VERSION } from "./types";

export function isCategoryIntelligenceEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[CATEGORY_INTELLIGENCE_FLAG] === "1";
}

export const CATEGORY_INTELLIGENCE_FLAG_DEFINITION: FeatureFlagDefinition = {
  FlagId: CATEGORY_INTELLIGENCE_FLAG,
  Name: "DAOS_CATEGORY_INTELLIGENCE",
  Owner: "Commercial Genome Beta",
  Description:
    "Enables Category Intelligence Layer — wave-1 specialized commercial models for Дом, Кухня, Климат, Мойка atop Commercial Genome.",
  DefaultValue: "0",
  CurrentValue: process.env[CATEGORY_INTELLIGENCE_FLAG] ?? "0",
  Scope: "runtime",
  Category: "commercial",
  LifecycleState: "Shadow",
  IntroducedInWave: 45,
  PlannedRemovalWave: null,
  Consumers: [
    "commercial-genome-beta",
    "generate-infographic-handler",
    "attention-hierarchy",
    "post-overlay-dominance-gate",
  ],
  Dependencies: ["DAOS_COMMERCIAL_GENOME_BETA"],
  Diagnostics: ["categoryIntelligence", "categoryIntelligenceKey", "categoryIntelligenceOverrides"],
  Deprecated: false,
  Notes: "Additive layer — does not modify Foundation (EKB) or Layout Runtime.",
};

export function registerCategoryIntelligenceFlag(
  register: (def: FeatureFlagDefinition) => void,
  env: NodeJS.ProcessEnv = process.env,
): void {
  register({
    ...CATEGORY_INTELLIGENCE_FLAG_DEFINITION,
    CurrentValue: env[CATEGORY_INTELLIGENCE_FLAG] ?? "0",
  });
}

export function enrichDecisionWithCategoryIntelligence(input: {
  decision: CommercialDecisionBeta;
  productTitle?: string;
  category?: string;
  env?: NodeJS.ProcessEnv;
}): {
  decision: CommercialDecisionBeta;
  intelligence: CategoryIntelligenceResult;
} {
  const env = input.env ?? process.env;
  if (!isCategoryIntelligenceEnabled(env)) {
    return {
      decision: input.decision,
      intelligence: {
        version: CATEGORY_INTELLIGENCE_VERSION,
        enabled: false,
        key: null,
        label: null,
        profile: null,
        appliedOverrides: [],
        trace: ["categoryIntelligence: flag disabled"],
      },
    };
  }

  return applyCategoryIntelligence({
    decision: input.decision,
    productTitle: input.productTitle,
    category: input.category,
  });
}

export function getCategoryAttentionRules(
  intelligence: CategoryIntelligenceResult | undefined,
): CategoryAttentionRules | null {
  return intelligence?.profile?.attentionRules ?? null;
}

export {
  applyCategoryIntelligence,
  getCategoryProfile,
  resolveCategoryIntelligenceKey,
  WAVE1_CATEGORY_KEYS,
  CATEGORY_INTELLIGENCE_FLAG,
  CATEGORY_INTELLIGENCE_VERSION,
};

export type {
  CategoryAttentionRules,
  CategoryIntelligenceKey,
  CategoryIntelligenceProfile,
  CategoryIntelligenceResult,
};

import type { ProductCategory } from "@/lib/product-analysis";
import type { AttentionHierarchyDiagnostics } from "@/lib/typography/attention-hierarchy";

export const COMPETITIVE_DOMINANCE_VERSION = "1.0.0-competitive-sprint-1";

/** Minimum pixel-measured dominance before post-overlay retry */
export const DOMINANCE_PRESERVATION_MIN_SCORE = 52;

/** objectScale bump on dominance-preservation retry */
export const DOMINANCE_RETRY_SCALE_DELTA = 0.1;

export const MAX_DOMINANCE_RETRIES = 1;

const MAX_OBJECT_SCALE = 0.9;

const CATEGORY_SCALE_BOOST: Partial<Record<ProductCategory, number>> = {
  auto: 0.07,
  home_appliances: 0.06,
  electronics: 0.05,
  generic: 0.05,
  garden_tools: 0.03,
};

const PROMPT_SCALE_BOOST: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /увлажнител|осушител|климат/i, boost: 0.06 },
  { pattern: /дрель|перфоратор|шуруповерт|болгарк/i, boost: 0.05 },
  { pattern: /пылесос|моющ|пароочист/i, boost: 0.05 },
  { pattern: /домашн|бытов|интерьер/i, boost: 0.04 },
];

export function competitiveDominanceEnabled(): boolean {
  return process.env.DAOS_COMPETITIVE_DOMINANCE !== "0";
}

export function resolveCategoryDominanceBoost(
  category: ProductCategory,
  productPrompt = "",
): number {
  if (!competitiveDominanceEnabled()) return 0;

  let boost = CATEGORY_SCALE_BOOST[category] ?? 0;
  for (const rule of PROMPT_SCALE_BOOST) {
    if (rule.pattern.test(productPrompt)) {
      boost = Math.max(boost, rule.boost);
    }
  }
  return boost;
}

export function applyCompetitiveObjectScale(
  baseScale: number,
  category: ProductCategory,
  productPrompt = "",
): number {
  const boosted = baseScale + resolveCategoryDominanceBoost(category, productPrompt);
  return Math.min(MAX_OBJECT_SCALE, Math.round(boosted * 1000) / 1000);
}

export function shouldRetryForDominance(
  diagnostics: AttentionHierarchyDiagnostics | undefined,
): boolean {
  if (!competitiveDominanceEnabled() || !diagnostics?.enabled) return false;
  if (!diagnostics.law101Passed) return true;
  return diagnostics.productDominanceScore < DOMINANCE_PRESERVATION_MIN_SCORE;
}

export function competitiveLightingContrastBoost(): number {
  return competitiveDominanceEnabled() ? 0.12 : 0.06;
}

/** Headline font scale factor inside attention-hierarchy CSS */
export function competitiveHeadlineScaleFactor(category: ProductCategory): number {
  if (!competitiveDominanceEnabled()) return 0.62;
  switch (category) {
    case "auto":
    case "home_appliances":
    case "generic":
    case "electronics":
      return 0.5;
    default:
      return 0.56;
  }
}

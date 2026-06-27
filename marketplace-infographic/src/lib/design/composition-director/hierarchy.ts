import type { HierarchyLevel, LayoutGeometry, NormalizedVisualWeight } from "./types";

export type HierarchyMap = Record<"headline" | "hero" | "benefits" | "cta" | "decorative", HierarchyLevel>;

export const DEFAULT_HIERARCHY: HierarchyMap = {
  headline: "H1",
  hero: "hero",
  benefits: "supporting",
  cta: "cta",
  decorative: "decorative",
};

export function scoreHierarchy(
  geometry: LayoutGeometry,
  weight: NormalizedVisualWeight,
): number {
  let score = 100;
  const heroArea = geometry.hero.width * geometry.hero.height;
  const headArea = geometry.headline.width * geometry.headline.height;

  if (weight.hero < weight.headline) score -= 25;
  if (heroArea < headArea) score -= 20;
  if (weight.background > 0.15) score -= 10;
  if (weight.benefits > weight.headline) score -= 15;

  return Math.max(0, Math.min(100, score));
}

export function hierarchyPromptBlock(hierarchy: HierarchyMap): string {
  return [
    "VISUAL HIERARCHY (preserve order):",
    `1. ${hierarchy.headline} — headline`,
    `2. ${hierarchy.hero} — product hero`,
    `3. ${hierarchy.benefits} — supporting benefit`,
    `4. ${hierarchy.cta} — CTA badge`,
    `5. ${hierarchy.decorative} — decorative (minimal)`,
  ].join("\n");
}

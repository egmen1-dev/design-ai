import type { FontIntelligenceProfile, FontStyleTag } from "./types";
import { profileFromFamily } from "./GoogleFontsCollector";

export function analyzeFontProfile(
  family: string,
  category = "sans-serif",
): FontIntelligenceProfile {
  return profileFromFamily(family, category, "analyzer");
}

export function rankFontsByIntelligence(
  profiles: FontIntelligenceProfile[],
  category: string,
  styleTags: string[] = [],
): FontIntelligenceProfile[] {
  return [...profiles]
    .map((p) => {
      let boost = p.successScore * 20 + p.marketplaceReadability * 0.3 + p.visualImpact * 0.2;
      if (p.categories.includes(category)) boost += 15;
      for (const tag of styleTags) {
        if (p.tags.includes(tag as FontStyleTag)) boost += 8;
      }
      return { ...p, successScore: Math.min(1, boost / 100) };
    })
    .sort((a, b) => b.successScore - a.successScore);
}

export function fontCssImport(family: string): string {
  const encoded = family.replace(/ /g, "+");
  return `@import url('https://fonts.googleapis.com/css2?family=${encoded}:wght@400;600;700;800&display=swap');`;
}

import type { LibraryFontRecord } from "@/lib/design-library";
import type { ProductAnalysis } from "@/lib/product-analysis";

export type RankedFont = LibraryFontRecord & { score: number; reason: string };

const FONT_AFFINITY: Record<string, Partial<Record<ProductAnalysis["category"], number>>> = {
  Montserrat: { garden_tools: 12, electronics: 15, generic: 10 },
  Inter: { electronics: 14, home_appliances: 12, generic: 11 },
  Roboto: { electronics: 10, home_appliances: 10 },
  "Open Sans": { cosmetics: 12, food: 10, kids: 10 },
  Oswald: { sport: 15, auto: 12 },
  Playfair: { cosmetics: 14, premium: 16, fashion: 14 },
  Raleway: { cosmetics: 12, fashion: 11 },
};

export function rankFonts(
  fonts: LibraryFontRecord[],
  analysis: ProductAnalysis,
  style: string,
): RankedFont[] {
  return fonts
    .map((font) => {
      let score = 50;
      const nameKey = font.name.split(" ")[0];
      const affinity = FONT_AFFINITY[font.name] ?? FONT_AFFINITY[nameKey];
      if (affinity?.[analysis.category]) score += affinity[analysis.category]!;

      if (font.styleTags.includes(style)) score += 12;
      if (font.styleTags.includes(analysis.brandTone)) score += 10;
      if (analysis.priceSegment === "premium" && /playfair|raleway|serif/i.test(font.name))
        score += 8;
      if (analysis.category === "electronics" && /montserrat|inter|roboto/i.test(font.name))
        score += 10;
      if (analysis.audienceGender === "kids" && /rounded|comic|nunito/i.test(font.name))
        score += 8;

      const reason =
        score >= 80
          ? `идеален для ${analysis.category}, тон ${analysis.brandTone}`
          : score >= 65
            ? `хорошо подходит для ${analysis.category}`
            : `базовый вариант`;

      return { ...font, score: Math.min(99, score), reason };
    })
    .sort((a, b) => b.score - a.score);
}

export function pickBestFontId(
  fonts: LibraryFontRecord[],
  analysis: ProductAnalysis,
  style: string,
  preferredId?: string | null,
): string | null {
  if (preferredId && fonts.some((f) => f.id === preferredId)) return preferredId;
  const ranked = rankFonts(fonts, analysis, style);
  return ranked[0]?.id ?? null;
}

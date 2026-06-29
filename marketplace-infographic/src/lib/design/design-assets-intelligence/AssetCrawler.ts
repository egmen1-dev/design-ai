import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import { collectPinterestReferences } from "./PinterestCollector";
import { collectBehanceReferences } from "./BehanceCollector";
import { collectDribbbleReferences } from "./DribbbleCollector";
import { collectFigmaReferences } from "./FigmaCollector";
import { collectGoogleFonts, collectFontshareFonts } from "./GoogleFontsCollector";
import { analyzeBadgeReferences, badgeModelKey } from "./BadgeAnalyzer";
import { analyzeShapeFromBadge } from "./ShapeAnalyzer";
import { getPalettesForCategory } from "./PaletteAnalyzer";
import { persistCrawledAssets } from "./diversity-engine";

export type CrawlResult = {
  badgeModels: number;
  fontProfiles: number;
  palettes: number;
  shapes: number;
  references: number;
};

/** Asset Crawler — собирает референсы и пополняет библиотеки */
export async function crawlDesignAssets(
  category: KnowledgeCategory,
): Promise<CrawlResult> {
  const [pinterest, behance, dribbble, figma, googleFonts, fontshare] =
    await Promise.all([
      collectPinterestReferences(),
      collectBehanceReferences(),
      collectDribbbleReferences(),
      collectFigmaReferences(),
      collectGoogleFonts(),
      collectFontshareFonts(),
    ]);

  const references = [...pinterest, ...behance, ...dribbble, ...figma];
  const badgeModels = analyzeBadgeReferences(references);
  const shapes = badgeModels.map(analyzeShapeFromBadge);
  const palettes = getPalettesForCategory(category);
  const fonts = [...googleFonts, ...fontshare];

  await persistCrawledAssets({
    category,
    badgeModels: badgeModels.map((m) => ({ key: badgeModelKey(m), model: m })),
    fonts,
    palettes,
    shapes,
  });

  return {
    badgeModels: badgeModels.length,
    fontProfiles: fonts.length,
    palettes: palettes.length,
    shapes: shapes.length,
    references: references.length,
  };
}

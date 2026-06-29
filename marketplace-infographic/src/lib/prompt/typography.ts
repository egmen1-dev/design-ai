import type { DesignLibrary } from "@/lib/design-library";
import type { ProductAnalysis } from "@/lib/product-analysis";
import { rankFonts } from "@/lib/asset-selection/font-ranker";

export function buildTypographyPrompt(
  library: DesignLibrary,
  analysis: ProductAnalysis,
  style: string,
): string {
  const ranked = rankFonts(library.fonts, analysis, style);
  const top = ranked.slice(0, 5);

  const block =
    top.length === 0
      ? "Шрифты: fontId: null"
      : top
          .map(
            (f) =>
              `- id: ${f.id}, name: "${f.name}", score: ${f.score}, reason: ${f.reason}`,
          )
          .join("\n");

  return `ТИПОГРАФИКА
Выбери fontId из списка (или null). Учитывай score и reason:
${block}

fontFamily, fontWeight, fontPair — опиши в JSON.
fontReason — почему выбран шрифт для этой категории.`;
}

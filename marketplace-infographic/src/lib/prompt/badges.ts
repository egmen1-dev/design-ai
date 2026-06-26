import type { DesignLibrary } from "@/lib/design-library";
import type { ProductAnalysis } from "@/lib/product-analysis";
import { rankBadges } from "@/lib/asset-selection/badge-ranker";

export function buildBadgesPrompt(
  library: DesignLibrary,
  analysis: ProductAnalysis,
  style: string,
  accentHex: string,
): string {
  const ranked = rankBadges(library.badges, analysis, style, accentHex);
  const top = ranked.slice(0, 5);

  const block =
    top.length === 0
      ? "Плашки: badgeId: null"
      : top
          .map(
            (b) =>
              `- id: ${b.id}, name: "${b.name}", score: ${b.score}, reason: ${b.reason}`,
          )
          .join("\n");

  return `ПЛАШКИ И БЕЙДЖИ
badgeStyle: rounded / pill / stat-card / vertical-bar
Выбери badgeId из списка (или null):
${block}
badgeReason — почему подходит форма плашки`;
}

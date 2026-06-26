import type { LibraryBadgeRecord } from "@/lib/design-library";
import type { ProductAnalysis } from "@/lib/product-analysis";

export type RankedBadge = LibraryBadgeRecord & { score: number; reason: string };

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function rankBadges(
  badges: LibraryBadgeRecord[],
  analysis: ProductAnalysis,
  style: string,
  accentHex: string,
): RankedBadge[] {
  const accentLum = hexLuminance(accentHex);

  return badges
    .map((badge) => {
      let score = 50;
      if (badge.styleTags.includes(style)) score += 14;
      if (badge.styleTags.includes(analysis.brandTone)) score += 10;
      if (badge.styleTags.includes(analysis.category)) score += 12;
      if (/pill|rounded|ribbon/i.test(badge.name)) score += 6;
      if (/stat|card/i.test(badge.name) && analysis.category === "electronics") score += 8;
      if (accentLum < 0.5 && /light|white/i.test(badge.htmlTemplate)) score += 6;

      const reason =
        score >= 78
          ? `совместима с палитрой и категорией ${analysis.category}`
          : `подходит по стилю ${style}`;

      return { ...badge, score: Math.min(99, score), reason };
    })
    .sort((a, b) => b.score - a.score);
}

export function pickBestBadgeId(
  badges: LibraryBadgeRecord[],
  analysis: ProductAnalysis,
  style: string,
  accentHex: string,
  preferredId?: string | null,
): string | null {
  if (preferredId && badges.some((b) => b.id === preferredId)) return preferredId;
  const ranked = rankBadges(badges, analysis, style, accentHex);
  return ranked[0]?.id ?? null;
}

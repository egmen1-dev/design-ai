import type { InfographicData } from "@/lib/infographic-template";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

export function formatMarketplaceHeadline(headline: string): string {
  const lower = headline.toLowerCase();
  if (lower === headline || headline === headline.toUpperCase()) {
    return toTitleCase(headline);
  }
  return headline;
}

export function buildMarketplacePillHtml(subtitle: string, accent: string): string {
  if (!subtitle?.trim()) return "";
  return `
    <div class="mp-pill mp-pill--glass" style="--pill-accent:${accent};">
      <span class="mp-pill__text">${escapeHtml(subtitle.toUpperCase())}</span>
    </div>`;
}

/** Компактный стеклянный бейдж — одна ключевая цифра */
export function buildMarketplaceLeftSpecsHtml(
  data: InfographicData,
  accent: string,
): string {
  const hero = data.specBlocks[0];
  if (!hero) return "";

  const heroLabel = hero.label ?? "параметр";
  const heroValue = hero.value ?? "—";

  return `
    <div class="mp-glass-badge" style="--badge-accent:${accent};">
      <span class="mp-glass-badge__value">${escapeHtml(heroValue)}</span>
      <span class="mp-glass-badge__label">${escapeHtml(heroLabel)}</span>
    </div>`;
}

/** Постерный режим — без боковых панелей */
export function buildMarketplaceSidebarHtml(): string {
  return "";
}

export function buildMarketplaceBottomRibbonHtml(): string {
  return "";
}

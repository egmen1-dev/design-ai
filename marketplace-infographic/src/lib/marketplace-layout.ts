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
  const normalized = subtitle.trim().toLowerCase();
  if (/^\d/.test(normalized) || normalized.includes("квт") || normalized.includes("вт")) {
    return "";
  }
  return `
    <div class="mp-pill" style="--pill-accent:${accent};">
      <span class="mp-pill__text">${escapeHtml(subtitle)}</span>
    </div>`;
}

/** Бейдж характеристики внутри шапки */
export function buildMarketplaceHeaderSpecHtml(
  data: InfographicData,
  accent: string,
): string {
  const hero = data.specBlocks[0];
  if (!hero?.value) return "";

  const heroLabel = hero.label ?? "";
  const heroValue = hero.value ?? "—";
  const parts = heroValue.trim().split(/\s+/);
  const main = parts[0] ?? heroValue;
  const unit = parts.slice(1).join(" ") || heroLabel;

  return `
    <div class="mp-header__spec" style="--spec-accent:${accent};">
      <span class="mp-header__spec-value">${escapeHtml(main)}</span>
      ${unit ? `<span class="mp-header__spec-unit">${escapeHtml(unit)}</span>` : ""}
    </div>`;
}

/** @deprecated используйте buildMarketplaceHeaderSpecHtml */
export function buildMarketplaceLeftSpecsHtml(
  data: InfographicData,
  accent: string,
): string {
  return buildMarketplaceHeaderSpecHtml(data, accent);
}

/** Постерный режим — без боковых панелей */
export function buildMarketplaceSidebarHtml(): string {
  return "";
}

export function buildMarketplaceBottomRibbonHtml(): string {
  return "";
}

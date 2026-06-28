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

function parseSpecValue(value: string, label: string): { main: string; unit: string; icon: string } {
  const parts = value.trim().split(/\s+/);
  const main = parts[0] ?? value;
  const unit = parts.slice(1).join(" ") || label;
  const icon = /квт|вт|мощ/i.test(`${value} ${label}`) ? "bolt" : "star";
  return { main, unit, icon };
}

/** WB-стиль: карточка заголовка + мощный бейдж характеристики */
export function buildWbCoverHeadHtml(data: InfographicData, accent: string): string {
  const hero = data.specBlocks[0];
  const spec = hero?.value
    ? parseSpecValue(hero.value, hero.label ?? "")
    : null;

  const specHtml = spec
    ? `
    <div class="wb-head__power" style="--wb-accent:${accent};">
      <span class="material-symbols-outlined wb-head__power-icon" aria-hidden="true">${spec.icon}</span>
      <div class="wb-head__power-text">
        <span class="wb-head__power-val">${escapeHtml(spec.main)}</span>
        <span class="wb-head__power-unit">${escapeHtml(spec.unit)}</span>
      </div>
    </div>`
    : "";

  return `
    <div class="wb-head__card">
      <div class="wb-head__stripe" style="background:linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 72%, #0f172a) 100%);"></div>
      <h1 class="wb-head__title">{{HEADLINE_PLACEHOLDER}}</h1>
      ${specHtml}
    </div>`;
}

export function buildMarketplacePillHtml(subtitle: string, accent: string): string {
  if (!subtitle?.trim()) return "";
  const normalized = subtitle.trim().toLowerCase();
  if (/^\d/.test(normalized) || normalized.includes("квт") || normalized.includes("вт")) {
    return "";
  }
  return `
    <div class="wb-head__tag" style="--wb-accent:${accent};">
      <span class="wb-head__tag-text">${escapeHtml(subtitle)}</span>
    </div>`;
}

export function buildMarketplaceHeaderSpecHtml(
  _data: InfographicData,
  _accent: string,
): string {
  return "";
}

export function buildMarketplaceLeftSpecsHtml(
  data: InfographicData,
  accent: string,
): string {
  return buildWbCoverHeadHtml(data, accent).replace("{{HEADLINE_PLACEHOLDER}}", "");
}

export function buildMarketplaceSidebarHtml(): string {
  return "";
}

export function buildMarketplaceBottomRibbonHtml(): string {
  return "";
}

/** Полная шапка WB для marketplace */
export function buildMarketplaceCoverHeadHtml(
  headline: string,
  data: InfographicData,
  accent: string,
  subtitle: string,
): string {
  const inner = buildWbCoverHeadHtml(data, accent).replace(
    "{{HEADLINE_PLACEHOLDER}}",
    escapeHtml(headline),
  );
  const pill = buildMarketplacePillHtml(subtitle, accent);
  return `<header class="wb-head">${inner}${pill}</header>`;
}

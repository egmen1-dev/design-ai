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
  return `
    <div class="mp-pill" style="background:${accent};">
      <span class="material-symbols-outlined mp-pill__icon" aria-hidden="true">bolt</span>
      <span class="mp-pill__text">${escapeHtml(subtitle.toUpperCase())}</span>
    </div>`;
}

export function buildMarketplaceLeftSpecsHtml(
  data: InfographicData,
  accent: string,
): string {
  const blocks = data.specBlocks.slice(0, 2);
  const giftBlock = data.mainBanner;

  const cards = blocks.map((spec) => {
    const icon = /об\/мин|rpm|скорост/i.test(spec.label)
      ? "speed"
      : /вт|квт|мощ/i.test(spec.label)
        ? "bolt"
        : "tune";
    return `
      <div class="mp-stat-card">
        <div class="mp-stat-card__icon" style="color:${accent};">
          <span class="material-symbols-outlined" aria-hidden="true">${icon}</span>
        </div>
        <div class="mp-stat-card__body">
          <span class="mp-stat-card__value" style="color:${accent};">${escapeHtml(spec.value)}</span>
          <span class="mp-stat-card__label">${escapeHtml(spec.label)}</span>
        </div>
      </div>`;
  });

  const giftHtml = giftBlock
    ? `
      <div class="mp-gift-card">
        <div class="mp-gift-card__thumb" aria-hidden="true">
          <span class="material-symbols-outlined">visibility</span>
        </div>
        <p class="mp-gift-card__text">${escapeHtml(giftBlock.title)}</p>
      </div>`
    : "";

  return `<div class="mp-left-stack">${cards.join("")}${giftHtml}</div>`;
}

function parseFeatureNumber(text: string): { value: string; label: string } {
  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (match) {
    return { value: match[1], label: match[2].trim() || "параметр" };
  }
  const parts = text.split(/\s+/);
  return { value: parts[0] ?? text, label: parts.slice(1).join(" ") || "преимущество" };
}

export function buildMarketplaceSidebarHtml(
  data: InfographicData,
  accent: string,
): string {
  const features = data.callouts.slice(0, 3);
  const items = features.map((callout, index) => {
    const parsed = parseFeatureNumber(callout.text);
    const isLast = index === features.length - 1;
    return `
      <div class="mp-sidebar__item${isLast ? " mp-sidebar__item--footer" : ""}">
        ${index < 2 ? `<span class="mp-sidebar__value">${escapeHtml(parsed.value)}</span>` : ""}
        <span class="mp-sidebar__label">${escapeHtml(isLast ? callout.text.toUpperCase() : parsed.label.toUpperCase())}</span>
      </div>`;
  });

  return `
    <div class="mp-sidebar" style="background:${accent};">
      ${items.join("")}
    </div>`;
}

export function buildMarketplaceBottomRibbonHtml(
  bullets: string[],
  accent: string,
): string {
  const text = bullets[bullets.length - 1] ?? bullets[0] ?? "";
  if (!text) return "";

  return `
    <div class="mp-bottom-ribbon" style="background:${accent};">
      <span class="mp-bottom-ribbon__text">${escapeHtml(text)}</span>
    </div>`;
}

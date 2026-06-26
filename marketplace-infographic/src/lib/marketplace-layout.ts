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

  const cards = blocks.map((spec) => {
    const icon = /об\/мин|rpm|скорост/i.test(spec.label)
      ? "speed"
      : /вт|квт|мощ/i.test(spec.label)
        ? "bolt"
        : /дБ|шум|тих/i.test(spec.label)
          ? "volume_down"
          : /л|литр|бак|объём/i.test(spec.label)
            ? "water_drop"
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

  const giftText = data.marketplaceGift;
  const giftHtml = giftText
    ? `
      <div class="mp-gift-card">
        <div class="mp-gift-card__thumb" aria-hidden="true">
          <span class="material-symbols-outlined">redeem</span>
        </div>
        <p class="mp-gift-card__text">${escapeHtml(giftText)}</p>
      </div>`
    : "";

  return `<div class="mp-left-stack">${cards.join("")}${giftHtml}</div>`;
}

export function buildMarketplaceSidebarHtml(
  data: InfographicData,
  accent: string,
): string {
  const sidebar = data.marketplaceSidebar ?? [];
  const footer = data.marketplaceFooter;

  if (sidebar.length === 0 && !footer) {
    return "";
  }

  const items = sidebar.slice(0, 2).map((item) => {
    const icon = /акб|батар/i.test(item.label)
      ? "battery_full"
      : /насад/i.test(item.label)
        ? "construction"
        : "star";
    return `
      <div class="mp-sidebar__item">
        <span class="material-symbols-outlined mp-sidebar__icon" aria-hidden="true">${icon}</span>
        <span class="mp-sidebar__value">${escapeHtml(item.value)}</span>
        <span class="mp-sidebar__label">${escapeHtml(item.label)}</span>
      </div>`;
  });

  const footerHtml = footer
    ? `<div class="mp-sidebar__item mp-sidebar__item--footer">
        <span class="mp-sidebar__label">${escapeHtml(footer.toUpperCase())}</span>
      </div>`
    : "";

  return `
    <div class="mp-sidebar" style="background:linear-gradient(180deg, ${accent} 0%, ${accent}dd 100%);">
      ${items.join("")}
      ${footerHtml}
    </div>`;
}

export function buildMarketplaceBottomRibbonHtml(
  data: InfographicData,
  accent: string,
): string {
  const text = data.marketplaceBottom;
  if (!text) return "";

  return `
    <div class="mp-bottom-ribbon" style="background:${accent};">
      <span class="mp-bottom-ribbon__text">${escapeHtml(text)}</span>
    </div>`;
}

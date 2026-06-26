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

/** Левая плашка как в референсе: hero-цифра + подарок + teal-подвал */
export function buildMarketplaceLeftSpecsHtml(
  data: InfographicData,
  accent: string,
): string {
  const hero = data.specBlocks[0];
  const secondary = data.specBlocks[1];
  const giftText = data.marketplaceGift;

  const heroIsRpm = /об\/мин|rpm/i.test(`${hero?.label} ${hero?.value}`);
  const heroLabel = heroIsRpm ? "об/мин" : (hero?.label ?? "параметр");
  const heroValue = heroIsRpm
    ? String(hero?.value ?? "").replace(/\s*об\/мин\s*/gi, "").trim() || "—"
    : (hero?.value ?? "—");

  const secondaryHtml =
    secondary && secondary.value !== "—"
      ? `
      <div class="mp-left-panel__secondary">
        <span class="material-symbols-outlined" aria-hidden="true">volume_down</span>
        <span class="mp-left-panel__secondary-value">${escapeHtml(secondary.value)}</span>
        <span class="mp-left-panel__secondary-label">${escapeHtml(secondary.label)}</span>
      </div>`
      : "";

  const giftVisual = giftText
    ? `
      <div class="mp-left-panel__gift-visual" aria-hidden="true">
        <div class="mp-left-panel__gift-icon"><span class="material-symbols-outlined">visibility</span></div>
        <div class="mp-left-panel__gift-icon"><span class="material-symbols-outlined">back_hand</span></div>
      </div>`
    : `
      <div class="mp-left-panel__gift-visual mp-left-panel__gift-visual--placeholder" aria-hidden="true">
        <span class="material-symbols-outlined">redeem</span>
      </div>`;

  const giftFooter = giftText
    ? `<div class="mp-left-panel__footer" style="background:${accent};">${escapeHtml(giftText)}</div>`
    : secondary && secondary.value !== "—"
      ? `<div class="mp-left-panel__footer" style="background:${accent};">${escapeHtml(`${secondary.value} ${secondary.label}`)}</div>`
      : "";

  return `
    <div class="mp-left-panel">
      <div class="mp-left-panel__hero">
        <span class="mp-left-panel__hero-label">${escapeHtml(heroLabel)}</span>
        <span class="mp-left-panel__hero-value" style="color:${accent};">${escapeHtml(heroValue)}</span>
        <span class="material-symbols-outlined mp-left-panel__hero-icon" style="color:${accent};" aria-hidden="true">speed</span>
      </div>
      ${secondaryHtml}
      ${giftVisual}
      ${giftFooter}
    </div>`;
}

/** Компактная правая плашка — не на всю высоту */
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
    ? `<div class="mp-sidebar__footer">
        <span class="mp-sidebar__footer-text">${escapeHtml(footer.toUpperCase())}</span>
      </div>`
    : "";

  return `
    <div class="mp-sidebar" style="--sidebar-accent:${accent};">
      <div class="mp-sidebar__inner">
        ${items.join("")}
        ${footerHtml}
      </div>
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

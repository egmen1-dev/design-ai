import type { InfographicStyle } from "@/lib/design-trends";
import { buildPlaqueHtml } from "@/lib/marketplace-badges";
import { buildStyleSlideSkin } from "@/lib/style-slide-css";
import type { InfographicData } from "@/lib/infographic-template";
import { resolveMarketplaceHeadline } from "@/lib/marketplace-headline";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatMarketplaceHeadline(headline: string): string {
  return headline;
}

function buildSideSpecStack(
  data: InfographicData,
  style: InfographicStyle,
  accent: string,
): string {
  const skin = buildStyleSlideSkin(style);
  const items: string[] = [];

  for (const spec of data.specBlocks.slice(0, 3)) {
    if (!spec?.value) continue;
    const label = (spec.label ?? "").trim();
    const text = label ? `${spec.value} ${label}`.trim() : spec.value;
    items.push(
      buildPlaqueHtml("ribbon", { type: "ribbon", text: text.slice(0, 22) }, skin, accent),
    );
  }

  if (items.length === 0) return "";
  return `<div class="wb-side">${items.join("")}</div>`;
}

/** WB-паттерн: тонкая полоса заголовка + вертикальные ленты слева */
export function buildMarketplaceCoverHeadHtml(
  headline: string,
  data: InfographicData,
  accent: string,
  style: InfographicStyle = "modern",
): string {
  const side = buildSideSpecStack(data, style, accent);
  return `
    <header class="wb-top">
      <div class="wb-top__bar" style="--wb-accent:${accent};">
        <h1 class="wb-top__title">${escapeHtml(headline)}</h1>
      </div>
    </header>
    ${side}`;
}

export function buildMarketplacePillHtml(): string {
  return "";
}

export function buildMarketplaceHeaderSpecHtml(): string {
  return "";
}

export function buildMarketplaceLeftSpecsHtml(): string {
  return "";
}

export function buildMarketplaceSidebarHtml(): string {
  return "";
}

export function buildMarketplaceBottomRibbonHtml(): string {
  return "";
}

export function buildMarketplaceCover(
  data: InfographicData,
  accent: string,
  style: InfographicStyle,
  productPrompt?: string,
): string {
  const headline = resolveMarketplaceHeadline(data, productPrompt);
  return buildMarketplaceCoverHeadHtml(headline, data, accent, style);
}

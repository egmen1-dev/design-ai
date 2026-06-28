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

function buildSpecRibbons(
  data: InfographicData,
  style: InfographicStyle,
  accent: string,
): string {
  const skin = buildStyleSlideSkin(style);
  const ribbons: string[] = [];

  for (const spec of data.specBlocks.slice(0, 2)) {
    if (!spec?.value) continue;
    const text = `${spec.value} ${spec.label ?? ""}`.trim();
    ribbons.push(
      buildPlaqueHtml(
        "ribbon",
        { type: "ribbon", text },
        skin,
        accent,
      ),
    );
  }

  const bullet = data.callouts?.[0]?.text;
  if (bullet && ribbons.length < 3) {
    ribbons.push(
      buildPlaqueHtml(
        "ribbon",
        { type: "ribbon", text: bullet.slice(0, 28) },
        skin,
        accent,
      ),
    );
  }

  if (ribbons.length === 0) return "";
  return `<div class="wb-cover__ribbons">${ribbons.join("")}</div>`;
}

/** Премиальная шапка WB: тёмная полоса + ленты характеристик */
export function buildMarketplaceCoverHeadHtml(
  headline: string,
  data: InfographicData,
  accent: string,
  style: InfographicStyle = "modern",
): string {
  const ribbons = buildSpecRibbons(data, style, accent);

  return `
    <header class="wb-cover">
      <div class="wb-cover__bar" style="--wb-accent:${accent};">
        <h1 class="wb-cover__title">${escapeHtml(headline)}</h1>
      </div>
      ${ribbons}
    </header>`;
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

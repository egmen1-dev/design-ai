import type { InfographicSdInput } from "@/lib/validations";
import type { InfographicData } from "@/lib/infographic-template";
import { extractProductSubtitle, extractProductTitle } from "@/lib/title-extract";

function sanitizeBulletText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function inferAccentColor(colors: string[]): InfographicData["accentColor"] {
  const hex = (colors[0] ?? "#00a8b5").toLowerCase();
  if (/e31|ef44|dc26|f00|red/.test(hex)) return "red";
  if (/2563|3b82|60a5|blue/.test(hex)) return "blue";
  if (/7c3|8b5|a78|purple|violet/.test(hex)) return "purple";
  if (/16a3|22c5|10b9|green/.test(hex)) return "green";
  return "red";
}

function inferScene(backgroundPrompt: string, prompt?: string): InfographicData["backgroundScene"] {
  const text = `${backgroundPrompt} ${prompt ?? ""}`.toLowerCase();
  if (/garden|lawn|grass|сад|газон/.test(text)) return "outdoor_home";
  if (/home|interior|дом|интерьер|kitchen/.test(text)) return "outdoor_home";
  if (/studio|студи/.test(text)) return "studio";
  if (/office|офис/.test(text)) return "office";
  return "nature";
}

function inferProductVisual(data: InfographicSdInput): InfographicData["productVisual"] {
  const text = `${data.title} ${data.backgroundPrompt}`.toLowerCase();
  if (/генератор|generator/.test(text)) return "generator";
  if (/крем|космет|spf/.test(text)) return "cosmetic";
  if (/пылесос|робот|техник/.test(text)) return "appliance";
  return "generic";
}

/** Постерный режим: одна мысль, минимум элементов */
export function sdDataToInfographic(
  data: InfographicSdInput,
  prompt?: string,
): InfographicData {
  const isMarketplace = data.layout === "marketplace";
  const creativeHeadline = data.creativeHeadline ?? data.title;
  const headline = creativeHeadline || extractProductTitle(prompt ?? "", data.title);
  const subtitle = data.heroMetric
    ? `${data.heroMetric.value} ${data.heroMetric.label}`.trim()
    : extractProductSubtitle(prompt ?? "", data.subtitle);

  const heroValue = data.heroMetric?.value ?? data.bullets[0]?.match(/\d+(?:[.,]\d+)?/)?.[0] ?? "★";
  const heroLabel =
    data.heroMetric?.label ??
    data.bullets[0]?.replace(/^[\d\s.,]+/, "").trim() ??
    "параметр";

  if (isMarketplace) {
    return {
      headline,
      productName: data.badge,
      categoryPill: data.subtitle,
      brandName: undefined,
      productVisual: inferProductVisual(data),
      backgroundScene: inferScene(data.backgroundPrompt, prompt),
      specBlocks: [{ value: heroValue, label: heroLabel }],
      mainBanner: undefined,
      callouts: [],
      marketplaceGift: undefined,
      marketplaceSidebar: undefined,
      marketplaceFooter: undefined,
      marketplaceBottom: undefined,
      posterMode: true,
      accentColor: inferAccentColor(data.colors),
    };
  }

  return {
    headline: headline.toUpperCase().slice(0, 40),
    productName: data.badge,
    categoryPill: data.subtitle,
    brandName: data.badge,
    productVisual: inferProductVisual(data),
    backgroundScene: inferScene(data.backgroundPrompt, prompt),
    specBlocks: [{ value: heroValue, label: heroLabel }],
    mainBanner: undefined,
    callouts: [],
    posterMode: true,
    accentColor: inferAccentColor(data.colors),
  };
}

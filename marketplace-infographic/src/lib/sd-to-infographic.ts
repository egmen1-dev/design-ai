import type { InfographicSdInput } from "@/lib/validations";
import type { InfographicData } from "@/lib/infographic-template";

function parseBullet(bullet: string): { value: string; label: string } {
  const trimmed = bullet.trim();
  const numMatch = trimmed.match(
    /^(\d+(?:[.,]\d+)?\s*(?:кВт|квт|Вт|вт|л|литр|дБ|мм|см|кг|г|ч|мАч|об\/мин|об)?)/i,
  );
  if (numMatch) {
    const value = numMatch[1].trim();
    const label = trimmed.slice(numMatch[0].length).trim() || "параметр";
    return { value, label };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return { value: trimmed, label: "параметр" };
  }
  return { value: parts[0], label: parts.slice(1).join(" ") };
}

function inferScene(backgroundPrompt: string, prompt?: string): InfographicData["backgroundScene"] {
  const text = `${backgroundPrompt} ${prompt ?? ""}`.toLowerCase();
  if (/kitchen|кухн/.test(text)) return "kitchen";
  if (/bath|ванн/.test(text)) return "bathroom";
  if (/office|офис/.test(text)) return "office";
  if (/studio|студи/.test(text)) return "studio";
  if (/nature|forest|природ|лес/.test(text)) return "nature";
  return "outdoor_home";
}

function inferAccentColor(colors: string[]): NonNullable<InfographicData["accentColor"]> {
  const primary = (colors[0] ?? "").toLowerCase();
  if (/00a8|00b|0aa|14b8|06b6|0891|0d9|teal|cyan/.test(primary)) return "blue";
  if (/e31|ef44|dc26|b91|f00|red/.test(primary)) return "red";
  if (/2563|3b82|1d4|00c6|blue/.test(primary)) return "blue";
  if (/7c3|933|a855|purple|6366/.test(primary)) return "purple";
  if (/16a3|22c5|1580|green/.test(primary)) return "green";
  return "blue";
}

function inferProductVisual(data: InfographicSdInput): InfographicData["productVisual"] {
  const text = `${data.title} ${data.subtitle} ${data.backgroundPrompt}`.toLowerCase();
  if (/генератор|generator|бензин|квт/.test(text)) return "generator";
  if (/крем|сыворот|космет|spf/.test(text)) return "cosmetic";
  if (/пылесос|чайник|робот|техник|appliance/.test(text)) return "appliance";
  return "generic";
}

/** Конвертирует JSON SD-пайплайна в структуру WB-шаблона */
export function sdDataToInfographic(
  data: InfographicSdInput,
  prompt?: string,
): InfographicData {
  const bullets = data.bullets.slice(0, 5);
  const parsed = bullets.map(parseBullet);
  const isMarketplace = data.layout === "marketplace";

  const specBlocks = parsed.slice(0, 3).map((item, index) => ({
    value: item.value || bullets[index],
    label: item.label || "параметр",
  }));

  while (specBlocks.length < 2) {
    specBlocks.push({ value: "★", label: "качество" });
  }

  const bannerBullet = bullets[2] ?? bullets[1] ?? bullets[0] ?? data.subtitle;
  const bannerParsed = parseBullet(bannerBullet);

  const title = isMarketplace
    ? data.title.slice(0, 40)
    : data.title.toUpperCase().slice(0, 40);

  return {
    headline: title,
    productName: data.badge,
    categoryPill: data.subtitle,
    brandName: isMarketplace ? undefined : data.badge,
    productVisual: inferProductVisual(data),
    backgroundScene: inferScene(data.backgroundPrompt, prompt),
    specBlocks,
    mainBanner: {
      icon: /вт|квт|мощ|power|подар|очк/i.test(bannerBullet) ? "⚡" : "★",
      title: isMarketplace
        ? bullets.find((b) => /подар|комплект|очк|перчат/i.test(b)) ?? bannerBullet
        : bannerBullet,
      description: bullets[3] ?? `${bannerParsed.value} ${bannerParsed.label}`.trim(),
    },
    callouts: bullets.slice(0, 4).map((text, index) => ({
      text,
      position:
        (["bottom-left", "bottom-right", "middle-left", "middle-right"] as const)[index] ??
        "bottom-left",
    })),
    accentColor: inferAccentColor(data.colors),
  };
}

import type { InfographicSdInput } from "@/lib/validations";
import type { InfographicData } from "@/lib/infographic-template";

function sanitizeBulletText(text: string): string {
  return text
    .replace(/\bитра\b/gi, "литра")
    .replace(/\s+/g, " ")
    .trim();
}

function bulletKey(text: string): string {
  return sanitizeBulletText(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");
}

function overlaps(a: string, b: string): boolean {
  const ka = bulletKey(a);
  const kb = bulletKey(b);
  if (ka === kb) return true;
  if (ka.includes(kb) || kb.includes(ka)) return true;
  const numA = ka.match(/\d+/g)?.join("") ?? "";
  const numB = kb.match(/\d+/g)?.join("") ?? "";
  if (numA && numA === numB) {
    const wordsA = ka.replace(/\d+/g, "").trim();
    const wordsB = kb.replace(/\d+/g, "").trim();
    if (wordsA && wordsB && (wordsA.includes(wordsB) || wordsB.includes(wordsA))) return true;
  }
  return false;
}

function parseBullet(bullet: string): { value: string; label: string } {
  const trimmed = sanitizeBulletText(bullet);
  const numMatch = trimmed.match(
    /^(\d+(?:[.,]\d+)?\s*(?:кВт|квт|Вт|вт|л|литр|литра|дБ|мм|см|кг|г|ч|мАч|об\/мин|об)?)/i,
  );
  if (numMatch) {
    const value = numMatch[1].trim();
    let label = trimmed.slice(numMatch[0].length).trim() || "параметр";
    if (/^литр/i.test(label)) label = label.replace(/^литр/i, "литра");
    return { value, label };
  }

  const countMatch = trimmed.match(/^(\d+)\s+(.+)$/);
  if (countMatch) {
    return { value: countMatch[1], label: countMatch[2].trim() };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return { value: trimmed, label: "параметр" };
  }
  return { value: parts[0], label: parts.slice(1).join(" ") };
}

type MarketplaceZones = {
  leftBullets: string[];
  gift: string | null;
  sidebar: Array<{ value: string; label: string }>;
  footer: string | null;
  bottom: string | null;
};

function splitMarketplaceBullets(bullets: string[]): MarketplaceZones {
  const clean = bullets.map(sanitizeBulletText).filter(Boolean);
  const used = new Set<string>();

  const markUsed = (text: string) => {
    used.add(bulletKey(text));
  };

  const isAvailable = (text: string) =>
    ![...used].some((key) => overlaps(text, key) || bulletKey(text) === key);

  const leftBullets: string[] = [];
  for (const bullet of clean) {
    if (leftBullets.length >= 2) break;
    if (!/\d/.test(bullet)) continue;
    if (/акб|насад|батар/i.test(bullet) && !/вт|квт|об\/мин|дБ|литр|л\b/i.test(bullet)) continue;
    if (!isAvailable(bullet)) continue;
    leftBullets.push(bullet);
    markUsed(bullet);
  }

  while (leftBullets.length < 2) {
    const filler = clean.find((b) => isAvailable(b) && !leftBullets.includes(b));
    if (!filler) break;
    leftBullets.push(filler);
    markUsed(filler);
  }

  const gift =
    clean.find(
      (b) =>
        isAvailable(b) && /подар|очк|перчат|в подарок/i.test(b) && !/насад|акб/i.test(b),
    ) ?? null;
  if (gift) markUsed(gift);

  const sidebar: Array<{ value: string; label: string }> = [];
  for (const bullet of clean) {
    if (sidebar.length >= 2) break;
    if (!isAvailable(bullet)) continue;
    if (!/\d/.test(bullet)) continue;
    if (/акб|насад|батар|шт/i.test(bullet) || sidebar.length > 0) {
      const parsed = parseBullet(bullet);
      sidebar.push({ value: parsed.value, label: parsed.label });
      markUsed(bullet);
    }
  }

  const footer =
    clean.find(
      (b) =>
        isAvailable(b) &&
        (/технолог|немец|качеств|гарант|премиум/i.test(b) || b.split(/\s+/).length >= 3),
    ) ?? null;
  if (footer) markUsed(footer);

  const bottom =
    clean.find(
      (b) =>
        isAvailable(b) && /лёгк|легк|компакт|тих|удобн|эргоном/i.test(b),
    ) ??
    clean.find((b) => isAvailable(b) && !/\d/.test(b)) ??
    null;

  return { leftBullets, gift, sidebar, footer, bottom };
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
  const bullets = data.bullets.map(sanitizeBulletText).slice(0, 5);
  const isMarketplace = data.layout === "marketplace";

  if (isMarketplace) {
    const zones = splitMarketplaceBullets(bullets);
    const leftParsed = zones.leftBullets.map(parseBullet);
    const specBlocks = leftParsed.map((item, index) => ({
      value: item.value || zones.leftBullets[index],
      label: item.label || "параметр",
    }));

    while (specBlocks.length < 2) {
      specBlocks.push({ value: "—", label: "характеристика" });
    }

    const title = data.title.slice(0, 40);

    return {
      headline: title,
      productName: data.badge,
      categoryPill: data.subtitle,
      brandName: undefined,
      productVisual: inferProductVisual(data),
      backgroundScene: inferScene(data.backgroundPrompt, prompt),
      specBlocks: specBlocks.slice(0, 2),
      mainBanner: {
        icon: "★",
        title: zones.gift ?? "комплектация",
        description: zones.bottom ?? data.subtitle,
      },
      callouts:
        zones.sidebar.length > 0
          ? zones.sidebar.map((item, index) => ({
              text: `${item.value} ${item.label}`.trim(),
              position:
                (["middle-right", "middle-right", "bottom-right"] as const)[index] ??
                "middle-right",
            }))
          : [
              { text: "преимущество", position: "middle-right" as const },
              { text: "качество", position: "middle-right" as const },
            ],
      marketplaceGift: zones.gift ?? undefined,
      marketplaceSidebar: zones.sidebar.length > 0 ? zones.sidebar : undefined,
      marketplaceFooter: zones.footer ?? undefined,
      marketplaceBottom: zones.bottom ?? undefined,
      accentColor: inferAccentColor(data.colors),
    };
  }

  const parsed = bullets.map(parseBullet);
  const specBlocks = parsed.slice(0, 3).map((item, index) => ({
    value: item.value || bullets[index],
    label: item.label || "параметр",
  }));

  while (specBlocks.length < 2) {
    specBlocks.push({ value: "★", label: "качество" });
  }

  const bannerBullet = bullets[2] ?? bullets[1] ?? bullets[0] ?? data.subtitle;
  const bannerParsed = parseBullet(bannerBullet);

  return {
    headline: data.title.toUpperCase().slice(0, 40),
    productName: data.badge,
    categoryPill: data.subtitle,
    brandName: data.badge,
    productVisual: inferProductVisual(data),
    backgroundScene: inferScene(data.backgroundPrompt, prompt),
    specBlocks,
    mainBanner: {
      icon: /вт|квт|мощ|power/i.test(bannerBullet) ? "⚡" : "★",
      title: bannerBullet,
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

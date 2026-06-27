import type { FontIntelligenceProfile } from "./types";
import { GOOGLE_FONTS_POPULAR, FONTSHARE_FAMILIES } from "./config";

type GoogleFontMeta = { family: string; category?: string };

async function fetchGoogleFontsList(): Promise<GoogleFontMeta[]> {
  try {
    const res = await fetch("https://fonts.google.com/metadata/fonts", {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const json = JSON.parse(text.replace(/^\)\]\}'\n/, "")) as {
      familyMetadataList?: GoogleFontMeta[];
    };
    return json.familyMetadataList ?? [];
  } catch (error) {
    console.warn("[google-fonts-collector] metadata fetch failed:", error);
    return GOOGLE_FONTS_POPULAR.map((family) => ({ family, category: "sans-serif" }));
  }
}

export async function collectGoogleFonts(): Promise<FontIntelligenceProfile[]> {
  const list = await fetchGoogleFontsList();
  const popular = new Set(GOOGLE_FONTS_POPULAR.map((f) => f.toLowerCase()));

  return list
    .filter((f) => popular.has(f.family.toLowerCase()) || list.indexOf(f) < 40)
    .slice(0, 60)
    .map((f) => profileFromFamily(f.family, f.category ?? "sans-serif", "google"));
}

export async function collectFontshareFonts(): Promise<FontIntelligenceProfile[]> {
  try {
    const res = await fetch("https://api.fontshare.com/v2/fonts", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{ name?: string; family?: string }>;
      return data.slice(0, 30).map((f) =>
        profileFromFamily(f.family ?? f.name ?? "Satoshi", "sans-serif", "fontshare"),
      );
    }
  } catch {
    // fallback
  }
  return FONTSHARE_FAMILIES.map((family) =>
    profileFromFamily(family, "sans-serif", "fontshare"),
  );
}

function profileFromFamily(
  family: string,
  category: string,
  source: string,
): FontIntelligenceProfile {
  const lower = family.toLowerCase();
  const tags = classifyFontTags(lower, category);

  return {
    family,
    tags,
    marketplaceReadability: scoreReadability(lower, tags),
    visualImpact: scoreImpact(lower, tags),
    successScore: 0.55,
    categories: inferCategories(tags),
  };
}

function classifyFontTags(lower: string, category: string): FontIntelligenceProfile["tags"] {
  const tags: FontIntelligenceProfile["tags"] = ["Marketplace"];
  if (/playfair|cormorant|libre baskerville/i.test(lower)) tags.push("Luxury", "Premium");
  else if (/bebas|oswald|anton/i.test(lower)) tags.push("Bold", "Industrial");
  else if (/nunito|comic|fredoka/i.test(lower)) tags.push("Kids", "Friendly");
  else if (/space|jetbrains|ibm|roboto mono/i.test(lower)) tags.push("Technology");
  else if (/montserrat|inter|dm sans|manrope/i.test(lower)) tags.push("Modern", "Corporate");
  else if (/raleway|lato|open sans/i.test(lower)) tags.push("Minimal", "Soft");
  else if (/clash|cabinet|satoshi/i.test(lower)) tags.push("Modern", "Premium");
  else tags.push("Modern");

  if (category.includes("serif")) tags.push("Premium", "Luxury");
  return [...new Set(tags)];
}

function scoreReadability(lower: string, tags: FontIntelligenceProfile["tags"]): number {
  let s = 72;
  if (tags.includes("Bold")) s -= 8;
  if (tags.includes("Luxury")) s -= 5;
  if (/inter|roboto|open sans|montserrat|nunito/i.test(lower)) s += 15;
  return Math.min(98, s);
}

function scoreImpact(lower: string, tags: FontIntelligenceProfile["tags"]): number {
  let s = 65;
  if (tags.includes("Bold")) s += 18;
  if (tags.includes("Premium") || tags.includes("Luxury")) s += 12;
  if (/bebas|oswald|clash/i.test(lower)) s += 15;
  return Math.min(98, s);
}

function inferCategories(tags: FontIntelligenceProfile["tags"]): string[] {
  const cats: string[] = ["generic"];
  if (tags.includes("Technology")) cats.push("electronics");
  if (tags.includes("Kids")) cats.push("kids");
  if (tags.includes("Luxury") || tags.includes("Premium")) cats.push("cosmetics", "premium");
  if (tags.includes("Industrial")) cats.push("auto", "tools");
  if (tags.includes("Fashion")) cats.push("fashion");
  return cats;
}

export { profileFromFamily };

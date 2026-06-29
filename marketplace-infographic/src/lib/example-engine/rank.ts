import type { ProductCategory } from "@/lib/product-analysis";
import type { DesignExampleRecord } from "@/lib/select-relevant-examples";
import { scoreExamples } from "@/lib/reference-style-resolver";
import type { InfographicStyle } from "@/lib/design-trends";

const CATEGORY_KEYWORDS: Record<ProductCategory, string[]> = {
  garden_tools: ["триммер", "газон", "сад", "косил", "дач"],
  electronics: ["наушник", "электрон", "bluetooth", "акб", "usb"],
  cosmetics: ["крем", "космет", "spf", "уход", "кож"],
  home_appliances: ["пылесос", "чайник", "робот", "бытов"],
  fashion: ["куртк", "одежд", "размер", "ткан"],
  food: ["еда", "продукт", "органик", "вкус"],
  sport: ["спорт", "фитнес", "трениров"],
  kids: ["детск", "игруш", "ребён"],
  auto: ["авто", "машин", "мотор"],
  premium: ["премиум", "люкс", "premium"],
  generic: [],
};

export function inferExampleCategory(example: DesignExampleRecord): ProductCategory {
  const haystack = `${example.prompt} ${example.tags.join(" ")} ${example.notes ?? ""}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [ProductCategory, string[]]
  >) {
    if (keywords.some((kw) => haystack.includes(kw))) return category;
  }

  return "generic";
}

export function clusterExamplesByCategory(
  examples: DesignExampleRecord[],
): Map<ProductCategory, DesignExampleRecord[]> {
  const map = new Map<ProductCategory, DesignExampleRecord[]>();
  for (const example of examples) {
    const cat = inferExampleCategory(example);
    const list = map.get(cat) ?? [];
    list.push(example);
    map.set(cat, list);
  }
  return map;
}

export function rankExamplesForProduct(
  prompt: string,
  pool: DesignExampleRecord[],
  category: ProductCategory,
  style?: InfographicStyle,
  limit = 5,
): DesignExampleRecord[] {
  const scored = scoreExamples(prompt, pool, style).map(({ example, score }) => {
    let finalScore = score;
    const exCat = inferExampleCategory(example);
    if (exCat === category) finalScore += 6;
    if (example.imageUrl) finalScore += 2;
    if (example.fontId) finalScore += 1;
    if (example.badgeId) finalScore += 1;

    try {
      const parsed = JSON.parse(example.resultJson) as Record<string, unknown>;
      if (parsed.type === "reference_card") finalScore += 3;
      if (parsed.layoutBlueprint) finalScore += 2;
    } catch {
      // ignore
    }

    return { example, score: finalScore };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);
  const unique: DesignExampleRecord[] = [];
  const seen = new Set<string>();

  for (const { example, score } of sorted) {
    if (score <= 0 && unique.length >= 2) continue;
    if (seen.has(example.id)) continue;
    seen.add(example.id);
    unique.push(example);
    if (unique.length >= limit) break;
  }

  return unique;
}

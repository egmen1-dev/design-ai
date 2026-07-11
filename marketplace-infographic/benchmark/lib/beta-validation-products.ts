/**
 * Beta Validation 1 — real WB leader product selection (benchmark-only).
 */
import fs from "node:fs";
import path from "node:path";

export type BetaValidationProduct = {
  slot: string;
  productId: number;
  category: string;
  categoryLabel: string;
  name: string;
  brand: string;
  prompt: string;
  leaderImagePath: string;
  wbDominance: number;
};

const CATEGORY_ORDER = [
  { id: "power-tools", label: "Электроинструмент", perCategory: 3 },
  { id: "garden", label: "Сад", perCategory: 3 },
  { id: "construction", label: "Строительство", perCategory: 2 },
  { id: "home-appliances", label: "Бытовая техника", perCategory: 2 },
  { id: "home", label: "Дом", perCategory: 2 },
  { id: "auto", label: "Авто", perCategory: 2 },
  { id: "kitchen", label: "Кухня", perCategory: 2 },
  { id: "pressure-wash", label: "Мойка", perCategory: 2 },
  { id: "humidifier", label: "Климат", perCategory: 2 },
] as const;

const CYCLE1 = path.join("benchmark", "output", "quality-cycle-1");

export function selectBetaValidationProducts(limit?: number): BetaValidationProduct[] {
  const indexPath = path.join(CYCLE1, "wb-cards-index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as Array<{
    productId: number;
    category: string;
    categoryLabel: string;
    name: string;
    brand: string;
    productDominanceScore: number;
  }>;

  const selected: BetaValidationProduct[] = [];
  let slot = 1;

  for (const cat of CATEGORY_ORDER) {
    const pool = index
      .filter((r) => r.category === cat.id)
      .sort((a, b) => b.productDominanceScore - a.productDominanceScore);

    const take = Math.min(cat.perCategory, pool.length);
    for (let i = 0; i < take; i++) {
      const row = pool[i]!;
      const leaderPath = path.join(CYCLE1, "wb-cards", row.category, `${row.productId}.png`);
      if (!fs.existsSync(leaderPath)) continue;

      const shortName = row.name.slice(0, 80);
      selected.push({
        slot: `product-${String(slot).padStart(2, "0")}`,
        productId: row.productId,
        category: row.category,
        categoryLabel: row.categoryLabel || cat.label,
        name: row.name,
        brand: row.brand,
        prompt: `${shortName} — профессиональная карточка Wildberries, товар ${row.brand}`,
        leaderImagePath: leaderPath,
        wbDominance: row.productDominanceScore,
      });
      slot++;
      if (limit && selected.length >= limit) return selected;
    }
  }

  return selected;
}

export async function leaderImageToDataUrl(leaderPath: string): Promise<string> {
  const buf = await fs.promises.readFile(leaderPath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

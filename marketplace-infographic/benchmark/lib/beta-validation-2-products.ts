/**
 * Beta Validation 2 — full WB harvest selection (benchmark-only).
 */
import fs from "node:fs";
import path from "node:path";
import type { BetaValidationProduct } from "./beta-validation-products";

const CYCLE1 = path.join("benchmark", "output", "quality-cycle-1");

/** BV2 category coverage — maps harvest ids to market labels */
export const BV2_CATEGORY_SPEC = [
  { id: "power-tools", label: "Электроинструмент", marketGroup: "tools" },
  { id: "construction", label: "Строительство", marketGroup: "tools" },
  { id: "garden", label: "Сад", marketGroup: "outdoor" },
  { id: "auto", label: "Авто", marketGroup: "auto" },
  { id: "home", label: "Дом", marketGroup: "home" },
  { id: "humidifier", label: "Климат", marketGroup: "climate" },
  { id: "kitchen", label: "Кухня", marketGroup: "kitchen" },
  { id: "home-appliances", label: "Бытовая техника", marketGroup: "appliances" },
  { id: "pressure-wash", label: "Мойка", marketGroup: "cleaning" },
] as const;

/** Categories requested but not in current WB harvest */
export const BV2_MISSING_CATEGORIES = [
  "Освещение",
  "Хранение",
  "Электроника",
  "Товары для ремонта",
] as const;

export function selectBetaValidation2Products(limit?: number): BetaValidationProduct[] {
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

  for (const cat of BV2_CATEGORY_SPEC) {
    const pool = index
      .filter((r) => r.category === cat.id)
      .sort((a, b) => b.productDominanceScore - a.productDominanceScore);

    for (const row of pool) {
      const leaderPath = path.join(CYCLE1, "wb-cards", row.category, `${row.productId}.png`);
      if (!fs.existsSync(leaderPath)) continue;

      const shortName = row.name.slice(0, 80);
      selected.push({
        slot: `product-${String(slot).padStart(3, "0")}`,
        productId: row.productId,
        category: row.category,
        categoryLabel: cat.label,
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

export function countAvailableBv2Products(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of selectBetaValidation2Products()) {
    counts[p.categoryLabel] = (counts[p.categoryLabel] ?? 0) + 1;
  }
  return counts;
}

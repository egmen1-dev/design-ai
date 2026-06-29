import type { ProductCategory } from "@/lib/product-analysis";
import type { InfographicData } from "@/lib/infographic-template";

/** Извлекает 2–3 фактологичные характеристики для плашек WB */
export function extractMarketplaceSpecBlocks(
  prompt: string,
  category: ProductCategory,
  bullets: string[] = [],
): InfographicData["specBlocks"] {
  const blocks: InfographicData["specBlocks"] = [];
  const seen = new Set<string>();

  const pushBlock = (value: string, label: string, hint?: string) => {
    const key = `${value}|${label}`.toLowerCase();
    if (seen.has(key) || !value.trim()) return;
    seen.add(key);
    blocks.push({ value: value.trim(), label: label.trim(), hint });
  };

  const powerMatch = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:квт|кВт)/i);
  if (powerMatch) {
    pushBlock(powerMatch[1].replace(",", "."), "кВт", "Стабильная мощность");
  }

  const literMatch = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:л|литр)(?!\s*\/\s*час)/i);
  if (literMatch) {
    pushBlock(`${literMatch[1].replace(",", ".")} л`, "бак", "Долгая автономность");
  }

  const consumptionMatch = prompt.match(/(\d+(?:[.,]\d+)?)\s*л\s*\/\s*час/i);
  if (consumptionMatch) {
    pushBlock(consumptionMatch[1].replace(",", "."), "л/час", "Расход");
  }

  const patterns: [RegExp, string, string?, boolean?][] = [
    [/(\d+(?:[.,]\d+)?)\s*(?:вт|Вт)/i, "Вт", "Мощность", true],
    [/(\d+(?:[.,]\d+)?)\s*(?:дб|дБ|db)/i, "дБ", "Тихая работа", true],
    [/(\d+)\s*час/i, "ч", "Время работы", true],
    [/(\d+(?:[.,]\d+)?)\s*(?:па|Па)/i, "Па", "Всасывание"],
    [/(\d+(?:[.,]\d+)?)\s*(?:мл|ml)/i, "мл", "Объём"],
    [/spf\s*(\d+)/i, "SPF", "Защита", true],
  ];

  for (const [pattern, label, hint, numberOnly] of patterns) {
    if (blocks.length >= 3) break;
    const match = prompt.match(pattern);
    if (match) {
      pushBlock(numberOnly ? match[1] : match[0].trim().slice(0, 20), label, hint);
    }
  }

  for (const bullet of bullets) {
    if (blocks.length >= 3) break;
    const num = bullet.match(/(\d+(?:[.,]\d+)?)/);
    const rest = bullet.replace(/^[\d\s.,]+/, "").trim();
    if (num && rest) {
      pushBlock(num[1], rest.slice(0, 18));
    }
  }

  if (blocks.length >= 2) return blocks.slice(0, 3);

  const defaults: Record<ProductCategory, InfographicData["specBlocks"]> = {
    garden_tools: [
      { value: "3 кВт", label: "мощность" },
      { value: "15 л", label: "бак" },
      { value: "65 дБ", label: "шум" },
    ],
    home_appliances: [
      { value: "3 кВт", label: "мощность" },
      { value: "15 л", label: "бак" },
      { value: "8 ч", label: "работа" },
    ],
    electronics: [
      { value: "30 ч", label: "батарея" },
      { value: "BT 5.3", label: "связь" },
    ],
    cosmetics: [
      { value: "50 мл", label: "объём" },
      { value: "SPF 30", label: "защита" },
    ],
    fashion: [
      { value: "S–XXL", label: "размеры" },
      { value: "хлопок", label: "ткань" },
    ],
    food: [
      { value: "500 г", label: "вес" },
      { value: "0 г", label: "сахар" },
    ],
    kids: [
      { value: "3+", label: "возраст" },
      { value: "без BPA", label: "безопасность" },
    ],
    auto: [
      { value: "12 В", label: "питание" },
      { value: "IP67", label: "защита" },
    ],
    sport: [
      { value: "1.2 кг", label: "вес" },
      { value: "24 мес", label: "гарантия" },
    ],
    premium: [
      { value: "24 мес", label: "гарантия" },
      { value: "премиум", label: "класс" },
    ],
    generic: [
      { value: "12 мес", label: "гарантия" },
      { value: "1–3 дня", label: "доставка" },
    ],
  };

  for (const block of defaults[category] ?? defaults.generic) {
    if (blocks.length >= 3) break;
    pushBlock(block.value, block.label, block.hint);
  }

  return blocks.slice(0, 3);
}

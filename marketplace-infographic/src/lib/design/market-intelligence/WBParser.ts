import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import {
  CATEGORY_SEARCH_QUERIES,
  WB_TOP_LIMIT,
  type WBProductCard,
} from "./types";

const WB_SEARCH_BASE =
  "https://search.wb.ru/exactmatch/ru/common/v5/search?appType=1&curr=rub&dest=-1257786&resultset=catalog&sort=popular&spp=30";

function basketImageUrl(productId: number): string {
  const vol = Math.floor(productId / 100000);
  const part = Math.floor(productId / 1000);
  const shard = productId % 10;
  return `https://basket-${shard.toString().padStart(2, "0")}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/big/1.webp`;
}

function parseWbResponse(data: unknown): WBProductCard[] {
  const root = data as {
    data?: { products?: Array<Record<string, unknown>> };
    products?: Array<Record<string, unknown>>;
  };
  const products = root.data?.products ?? root.products ?? [];

  return products.slice(0, WB_TOP_LIMIT).map((p) => {
    const id = Number(p.id ?? 0);
    const name = String(p.name ?? p.title ?? "Товар");
    const brand = String(p.brand ?? p.supplier ?? "");
    const rating = Number(p.reviewRating ?? p.rating ?? 4.5);
    const feedbacks = Number(p.feedbacks ?? p.comments ?? 0);
    const price = Number((p.salePriceU ?? p.priceU ?? 0)) / 100;
    return {
      id,
      name,
      brand,
      rating,
      feedbacks,
      imageUrl: basketImageUrl(id),
      price,
    };
  });
}

export async function fetchTopWildberriesCards(
  category: KnowledgeCategory,
  queryOverride?: string,
): Promise<WBProductCard[]> {
  const queries = queryOverride
    ? [queryOverride]
    : CATEGORY_SEARCH_QUERIES[category] ?? CATEGORY_SEARCH_QUERIES.generic;

  for (const query of queries) {
    try {
      const url = `${WB_SEARCH_BASE}&query=${encodeURIComponent(query)}&limit=${WB_TOP_LIMIT}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "DesignAI-MarketIntelligence/1.0",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) continue;
      const data = await response.json();
      const cards = parseWbResponse(data).filter((c) => c.id > 0);
      if (cards.length >= 8) return cards;
    } catch (error) {
      console.warn(`[wb-parser] query "${query}" failed:`, error);
    }
  }

  return buildCategoryFallbackCards(category);
}

function buildCategoryFallbackCards(category: KnowledgeCategory): WBProductCard[] {
  const seeds: Record<KnowledgeCategory, string[]> = {
    tools: ["Триммер аккумуляторный", "Секатор садовый", "Газонокосилка"],
    electronics: ["Наушники беспроводные", "Портативная колонка", "Power bank"],
    cosmetics: ["Крем для лица SPF", "Сыворотка витамин C", "Тональный крем"],
    furniture: ["Стул офисный", "Полка настенная", "Тумба прикроватная"],
    kids: ["Конструктор детский", "Настольная игра", "Мягкая игрушка"],
    clothes: ["Куртка демисезонная", "Худи оверсайз", "Футболка хлопок"],
    auto: ["Автомобильный пылесос", "Держатель телефона", "Ароматизатор"],
    pets: ["Корм для собак", "Лежанка для кошки", "Поводок"],
    kitchen: ["Блендер погружной", "Чайник электрический", "Набор ножей"],
    sports: ["Гантели неопрен", "Коврик для йоги", "Фитнес-резинка"],
    home: ["Пылесос вертикальный", "Увлажнитель воздуха", "Органайзер"],
    generator: ["Генератор бензиновый", "Инверторный генератор", "Электростанция"],
    generic: ["Товар новинка", "Хит продаж", "Премиум товар"],
  };

  return (seeds[category] ?? seeds.generic).map((name, index) => ({
    id: 100000 + index,
    name,
    brand: "Market",
    rating: 4.6 - index * 0.1,
    feedbacks: 500 - index * 80,
    imageUrl: "",
    price: 4990 + index * 1000,
  }));
}

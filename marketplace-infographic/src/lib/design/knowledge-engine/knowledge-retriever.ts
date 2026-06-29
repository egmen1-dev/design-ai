import { prisma } from "@/lib/prisma";
import type { ProductCategory } from "@/lib/product-analysis";
import { resolveKnowledgeCategory } from "./category";
import { applyDiversityPenalties, getLayoutDiversityBoost } from "./diversity-manager";
import type { KnowledgeCategory, KnowledgeContext } from "./types";
import { RETRIEVAL_LIMIT } from "./types";
import { runPatternAnalysis } from "./pattern-analyzer";

const layoutWeightCache = new Map<string, number>();

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  tools: "Инструменты",
  electronics: "Электроника",
  cosmetics: "Косметика",
  furniture: "Мебель",
  kids: "Детские товары",
  clothes: "Одежда",
  auto: "Авто",
  pets: "Зоотовары",
  kitchen: "Кухня",
  sports: "Спорт",
  home: "Дом",
  generator: "Генераторы",
  generic: "Универсальные",
};

export async function retrieveTopPatterns(
  category: KnowledgeCategory,
  limit = RETRIEVAL_LIMIT,
) {
  const raw = await prisma.designPattern.findMany({
    where: { category },
    orderBy: { successWeight: "desc" },
    take: limit + 10,
  });

  if (raw.length === 0) return [];

  const diversified = applyDiversityPenalties(category, raw).slice(0, limit);
  refreshLayoutWeightCache(category, diversified);
  return diversified;
}

function refreshLayoutWeightCache(
  category: KnowledgeCategory,
  patterns: Awaited<ReturnType<typeof prisma.designPattern.findMany>>,
): void {
  const layoutAgg = new Map<string, { weight: number; count: number }>();
  for (const pattern of patterns) {
    const prev = layoutAgg.get(pattern.layoutTemplate) ?? { weight: 0, count: 0 };
    layoutAgg.set(pattern.layoutTemplate, {
      weight: prev.weight + pattern.successWeight,
      count: prev.count + 1,
    });
  }
  for (const [layout, agg] of layoutAgg) {
    layoutWeightCache.set(`${category}:${layout}`, agg.weight / agg.count);
  }
}

export function buildKnowledgePromptBlock(
  category: KnowledgeCategory,
  patterns: Awaited<ReturnType<typeof retrieveTopPatterns>>,
): string {
  if (patterns.length === 0) {
    return "";
  }

  const label = CATEGORY_LABELS[category] ?? category;
  const layoutCounts = countTop(patterns, (p) => p.layoutTemplate);
  const fontCounts = countTop(patterns, (p) => p.fontFamily);
  const bgCounts = countTop(patterns, (p) => p.backgroundType);
  const lightCounts = countTop(patterns, (p) => p.lightingType);
  const colorCounts = countTop(patterns, (p) => p.primaryColor);

  const scales = patterns.map((p) => p.productScale);
  const minScale = Math.round(Math.min(...scales) * 100);
  const maxScale = Math.round(Math.max(...scales) * 100);
  const avgScore =
    patterns.reduce((s, p) => s + p.designScore, 0) / Math.max(1, patterns.length);

  const lines = [
    `Лучшие решения для категории "${label}" (статистика ${patterns.length} паттернов):`,
    "",
    layoutCounts.length
      ? `— Layout: ${layoutCounts.map((l) => `${l.key} (вес ${l.weight})`).join(", ")}.`
      : null,
    `— Оптимальный масштаб товара: ${minScale}–${maxScale}%.`,
    bgCounts.length
      ? `— Успешные фоны: ${bgCounts.map((b) => b.key).join(", ")}.`
      : null,
    fontCounts.length
      ? `— Лучшие шрифты: ${fontCounts.map((f) => f.key).join(", ")}.`
      : null,
    colorCounts.length
      ? `— Успешные цвета: ${colorCounts.map((c) => c.key).join(", ")}.`
      : null,
    lightCounts.length
      ? `— Освещение: ${lightCounts.map((l) => l.key).join(", ")}.`
      : null,
    `— Средний Design Score лучших карточек: ${avgScore.toFixed(0)}.`,
    "",
    "Используй эти закономерности как ОРИЕНТИР. Не копируй паттерны буквально — создавай свежую композицию в том же духе.",
    "Минимум текста. Одна главная характеристика. Больше воздуха вокруг товара.",
  ].filter(Boolean);

  return lines.join("\n");
}

function countTop<T>(items: T[], keyFn: (item: T) => string, limit = 3) {
  const map = new Map<string, { weight: number; count: number }>();
  for (const item of items) {
    const key = keyFn(item);
    const w = (item as { successWeight: number }).successWeight;
    const prev = map.get(key) ?? { weight: 0, count: 0 };
    map.set(key, { weight: prev.weight + w, count: prev.count + 1 });
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      weight: Number((v.weight / v.count).toFixed(2)),
      count: v.count,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

export async function retrieveKnowledgeContext(
  prompt: string,
  productCategory: ProductCategory,
): Promise<KnowledgeContext> {
  const category = resolveKnowledgeCategory(prompt, productCategory);
  const patterns = await retrieveTopPatterns(category);

  return {
    category,
    patterns: patterns.map((p) => ({
      category: category,
      layoutTemplate: p.layoutTemplate,
      compositionType: p.compositionType,
      backgroundType: p.backgroundType,
      lightingType: p.lightingType,
      fontFamily: p.fontFamily,
      badgeStyle: p.badgeStyle,
      productScale: p.productScale,
      textDensity: p.textDensity,
      negativeSpace: p.negativeSpace,
      primaryColor: p.primaryColor,
      secondaryColor: p.secondaryColor,
    })),
    promptBlock: buildKnowledgePromptBlock(category, patterns),
  };
}

export function getKnowledgeLayoutBoost(
  category: KnowledgeCategory,
  layoutTemplate: string,
): number {
  const cached = layoutWeightCache.get(`${category}:${layoutTemplate}`) ?? 1;
  const weightBoost = (cached - 1) * 18;
  return weightBoost + getLayoutDiversityBoost(category, layoutTemplate);
}

export async function preloadKnowledgeAnalysis(): Promise<void> {
  const count = await prisma.designPattern.count();
  if (count === 0) return;
  await runPatternAnalysis().catch(() => undefined);
}

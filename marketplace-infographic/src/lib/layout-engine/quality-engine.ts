import type { CompositionLayout } from "@/lib/composition/types";
import type { ProductCategory } from "@/lib/product-analysis";
import type { CardMeaning, LayoutQualityResult } from "./types";
import { WHITESPACE_MIN_PCT } from "./constants";
import { hasWordBreakInsideWord } from "./headline";
import { isEnvironmentAllowed } from "./background-categories";

function zonesOverlap(
  a: { left: number; top: number; width: number; height: number },
  b: { left: number; top: number; width: number; height: number },
): boolean {
  return (
    a.width > 0 &&
    b.width > 0 &&
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

export function validateLayoutQuality(
  layout: CompositionLayout,
  meaning: CardMeaning,
  category: ProductCategory,
  backgroundHint?: string,
): LayoutQualityResult {
  const issues: LayoutQualityResult["issues"] = [];

  if (hasWordBreakInsideWord(meaning.title)) {
    issues.push({ id: "word_break", message: "Перенос внутри слова" });
  }

  const textZones = [layout.headline, layout.subtitle, layout.leftPanel];
  for (const z of textZones) {
    if (z.width > 0 && zonesOverlap(layout.product, z)) {
      issues.push({ id: "text_over_product", message: "Текст перекрывает товар" });
      break;
    }
  }

  if (layout.metrics.overlapPct > 3) {
    issues.push({ id: "overlap", message: "Пересечение зон" });
  }

  if (layout.metrics.whitespacePct < WHITESPACE_MIN_PCT) {
    issues.push({ id: "whitespace", message: "Недостаточно воздуха" });
  }

  if (layout.metrics.productAreaPct < 55) {
    issues.push({ id: "product_small", message: "Товар слишком мал" });
  }

  if (layout.metrics.productAreaPct > 75) {
    issues.push({ id: "product_large", message: "Товар слишком велик" });
  }

  if (Math.abs(layout.product.rotationDeg) > 5) {
    issues.push({ id: "rotation", message: "Поворот > 5°" });
  }

  if (backgroundHint && !isEnvironmentAllowed(category, backgroundHint)) {
    issues.push({ id: "background_category", message: "Фон не соответствует категории" });
  }

  if (meaning.title.length > 80) {
    issues.push({ id: "readability", message: "Заголовок слишком длинный" });
  }

  const balanced =
    layout.metrics.productAreaPct >= layout.metrics.textAreaPct * 2.5;
  if (!balanced) {
    issues.push({ id: "hierarchy", message: "Товар не доминирует" });
  }

  return { passed: issues.length === 0, issues };
}

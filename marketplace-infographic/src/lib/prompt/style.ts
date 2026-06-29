import type { InfographicStyle } from "@/lib/design-trends";
import { STYLE_LABELS } from "@/lib/design-trends";
import type { ProductAnalysis } from "@/lib/product-analysis";

export function buildStylePrompt(
  style: InfographicStyle,
  analysis: ProductAnalysis,
): string {
  return `СТИЛЬ И БРЕНД
appliedStyle: ${style} (${STYLE_LABELS[style]})
категория товара: ${analysis.category}
ценовой сегмент: ${analysis.priceSegment}
тон бренда: ${analysis.brandTone}
аудитория: ${analysis.audienceGender}

Выбери визуальный язык как коммерческий дизайнер WB/Ozon:
- premium → чистые линии, воздух, уверенные акценты
- eco → натуральные оттенки, мягкий свет
- sport → динамика, контраст, энергия
- modern electronics → техничность, холодный/нейтральный свет`;
}

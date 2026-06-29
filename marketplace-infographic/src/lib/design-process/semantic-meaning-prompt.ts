import type { DesignBrief } from "@/lib/design-brief/schema";
import type { CreativeDirectorResult } from "./creative-concept";

/**
 * ЭТАП 1 — LLM генерирует ТОЛЬКО смысл карточки.
 * Никаких координат, размеров, процентов, layout.
 */
export function buildSemanticMeaningPrompt(
  brief: DesignBrief,
  concept: CreativeDirectorResult,
): string {
  return `Сгенерируй смысл рекламной карточки маркетплейса.

ТОВАР: ${brief.headline ?? brief.title ?? "товар"}
КАТЕГОРИЯ: ${brief.designProcess?.stage1?.category ?? "generic"}
АРХЕТИП: ${concept.archetypeId ?? "hero"}
ЭМОЦИЯ: ${concept.creativeConcept.emotion}
ГЛАВНАЯ МЫСЛЬ: ${concept.oneThought.headline}
ВЫГОДА: ${concept.creativeConcept.mainIdea}
КЛЮЧЕВОЕ ЧИСЛО: ${concept.oneThought.answer} ${concept.oneThought.answerLabel}
СЛОГАН: ${concept.oneThought.badge ?? ""}

ЗАПРЕЩЕНО в ответе:
- x, y, width, height, scale, rotation, percent, px, layout, template, zone

РАЗРЕШЕНО только JSON:
{
  "title": "заголовок до 6 слов, одна мысль",
  "subtitle": "подзаголовок или пустая строка",
  "feature": "одна главная характеристика (число+единица)",
  "badge": "один бейдж доверия/гарантии",
  "emotion": "одно слово эмоции",
  "style": "Premium Lifestyle | Minimal | Technical | Luxury | Commercial",
  "priority": "product"
}

Правила:
- title — рекламный заголовок, не описание товара
- feature — только ОДНА цифра/характеристика
- badge — короткий (до 4 слов)
- priority всегда "product"

Ответ — только JSON, без markdown.`;
}

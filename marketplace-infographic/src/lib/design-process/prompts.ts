import type { FoundationPromptInput } from "./types";
import type { CreativeDirectorResult } from "./creative-concept";
import { buildSystemPrompt } from "@/lib/prompt/system";

export type DesignPromptInput = FoundationPromptInput & {
  foundation: import("./types").DesignProcessFoundation;
  creativeDirector: CreativeDirectorResult;
  referenceHint?: string;
  retryHint?: string;
};

export function buildFoundationStagePrompt(input: FoundationPromptInput): string {
  return `${buildSystemPrompt()}

# МНОГОЭТАПНЫЙ ПРОЦЕСС — ФАЗА 1 (Анализ + Хук + Концепция)

Ты работаешь как опытный арт-директор. СНАЧАЛА принимаешь решения, ПОТОМ строишь макет.
На этой фазе НЕ создавай финальный макет. Только анализ, визуальный хук и художественную концепцию.

## Этап 1. Анализ товара
Определи: категорию, размеры, форму, материалы, цвет, назначение, ценовой сегмент,
эмоциональное восприятие, целевую аудиторию.

## Визуальный хук (visualHook) — ГЛАВНЫЙ ВОПРОС
Перед любым дизайном ответь: «Почему покупатель должен остановить взгляд именно на этой карточке?»
Выбери ОДИН сильный хук. Тип — свободная строка или один из:
oversized_product | premium_badge | emotional_background | dynamic_diagonal |
spec_highlight | luxury_minimal | lifestyle_scene | tech_showcase | gift_bundle |
contrast_pop | editorial_typography | power_number

## Этап 2. Художественная концепция
Сформируй индивидуальную идею карточки под товар (НЕ из фиксированного списка шаблонов).
Примеры направлений: предметная съёмка, реклама Apple, премиальная косметика, технологичный продукт,
уютный интерьер, спортивная динамика, студийный минимализм — но формулируй своими словами.

Верни ТОЛЬКО JSON:
{
  "stage1": {
    "category": "string",
    "dimensions": "string",
    "shape": "string",
    "materials": ["string"],
    "color": "string",
    "purpose": "string",
    "priceSegment": "budget|mid|premium|luxury",
    "emotionalPerception": "string",
    "targetAudience": "string"
  },
  "visualHook": {
    "type": "oversized_product",
    "reason": "почему этот хук сработает для конверсии",
    "confidence": 92
  },
  "stage2": {
    "concept": "краткое название концепции",
    "creativeDirection": "описание визуального направления",
    "mood": "настроение карточки",
    "references": ["референсы стиля, не бренды"],
    "whyThisConcept": "почему именно эта концепция для этого товара"
  }
}

Стиль оформления: ${input.style}
Категория (подсказка): ${input.category}
Ценовой сегмент: ${input.priceSegment}

ОПИСАНИЕ ТОВАРА:
"${input.productPrompt}"`;
}

export function buildDesignStagePrompt(input: DesignPromptInput): string {
  const f = input.foundation;
  const cd = input.creativeDirector;

  return `${buildSystemPrompt()}

# DESIGN EXECUTOR — Фаза 2 (минимальный постер)

Ты НЕ креативный директор. Идея УЖЕ принята. Твоя задача — технически оформить постер.

## Creative Concept (НЕ МЕНЯТЬ)
${JSON.stringify(cd.creativeConcept, null, 2)}

## Целевая аудитория: ${cd.creativeConcept.targetAudience}
## Тон: ${cd.creativeConcept.toneOfVoice}
## За 1 секунду: ${cd.creativeConcept.whatToSayInOneSecond}
## Сценарий композиции: ${cd.compositionScenarioId ?? "hero_product"}

## Одна мысль обложки (НЕ МЕНЯТЬ)
Заголовок: "${cd.oneThought.headline}"
Герой-цифра: ${cd.oneThought.answer} ${cd.oneThought.answerLabel}
Бейдж: ${cd.oneThought.badge ?? "нет"}
Отложено на другие слайды: ${cd.oneThought.deferredSpecs.join(", ")}

## Сцена
${cd.sceneNarrative}

## СТРОГИЕ ЛИМИТЫ (нарушение = провал)
- bullets: ТОЛЬКО 1 элемент для обложки + deferredSpecs для хранения (не для отображения)
- headline = рекламный заголовок из oneThought, НЕ название товара
- subHeadline = badge (3 кВт), максимум 3 слова
- НЕТ больших плашек, панелей, списков преимуществ на обложке
- objectScale: 0.68–0.75 (товар 60–75% кадра)
- useDecorations: false
- glassEffects: true

Верни ТОЛЬКО JSON Design Brief:
{
  "designConcept": "${cd.creativeConcept.title}",
  "creativeConcept": { ...как выше... },
  "oneThought": { ...как выше... },
  "layout": "marketplace",
  "headline": "${cd.oneThought.headline}",
  "subHeadline": "${cd.oneThought.badge ?? "новинка"}",
  "bullets": ["${cd.oneThought.answer} ${cd.oneThought.answerLabel}"],
  "deferredBullets": ${JSON.stringify(cd.oneThought.deferredSpecs)},
  "objectScale": 0.72,
  "cameraAngle": "three-quarter hero",
  "lightDirection": "top-left",
  "lightTemperature": "5500K",
  "shadowType": "contact-soft",
  "reflection": false,
  "backgroundPrompt": "english scene description, NO product, NO text, ${cd.sceneNarrative.slice(0, 120)}",
  "colorPalette": ["#hex", "#hex", "#hex"],
  "fontId": null,
  "badgeId": null,
  "badge": "бренд",
  "glassEffects": true,
  "decorations": []
}

Холст 900×1200. Wildberries.
${input.referenceHint ? `РЕФЕРЕНС: ${input.referenceHint}` : ""}
${input.retryHint ? input.retryHint : ""}

ОПИСАНИЕ ТОВАРА:
"${input.productPrompt}"`;
}

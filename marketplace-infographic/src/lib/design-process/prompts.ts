import type { FoundationPromptInput, DesignPromptInput } from "./types";
import { buildSystemPrompt } from "@/lib/prompt/system";

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

  return `${buildSystemPrompt()}

# МНОГОЭТАПНЫЙ ПРОЦЕСС — ФАЗА 2 (Композиция → Финальный Design Brief)

На основе завершённой Фазы 1 пройди этапы 3–7 и собери финальный Design Brief.
Вся композиция должна строиться вокруг visualHook: ${f.visualHook.type} — ${f.visualHook.reason}

## Уже принято (не меняй без веской причины)
Анализ: ${JSON.stringify(f.stage1)}
Концепция: ${f.stage2.concept} — ${f.stage2.creativeDirection}
Хук: ${f.visualHook.type} (confidence ${f.visualHook.confidence})

## Этап 3. Композиция
Главный объект, направление взгляда, текст, плашки, свободное пространство, баланс, глубина, перспектива.

## Этап 4. Типографика
Шрифт, насыщенность, размер, интервалы, цвет, контраст, акценты + обоснование.

## Этап 5. Цветовая система
Основной, вторичный, акцент, фон, текст, плашки, контрастность — единая система.

## Этап 6. Декоративные элементы
Реши, нужны ли геометрия, стекло, частицы, линии, градиенты, текстуры.
Если не улучшают — useDecorations: false.

## Этап 7. Самопроверка
Оцени 0–100: баланс, читаемость, профессиональность, соответствие категории, премиальность, конверсия.
overallScore = среднее. Если overallScore < 90 — пересмотри композицию и параметры в JSON.

Верни ТОЛЬКО JSON Design Brief:
{
  "designConcept": "из stage2.concept",
  "designProcess": {
    "stage1": { ...как в фазе 1... },
    "visualHook": { ... },
    "stage2": { ... },
    "stage3": {
      "mainSubject": "", "eyeFlow": "", "textPlacement": "", "plaquePlacement": "",
      "negativeSpace": "", "balance": "", "depth": "", "perspective": ""
    },
    "stage4": {
      "fontStyle": "", "weight": "", "sizeStrategy": "", "spacing": "",
      "textColor": "", "contrastLevel": "", "accents": "", "rationale": ""
    },
    "stage5": {
      "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "описание",
      "textColor": "#hex", "plaqueColor": "#hex", "contrastLevel": "", "systemRationale": ""
    },
    "stage6": { "useDecorations": false, "elements": [], "rationale": "" },
    "stage7": {
      "visualBalance": 95, "readability": 94, "professionalism": 96,
      "categoryFit": 93, "premiumFeel": 95, "conversionPotential": 94,
      "overallScore": 94, "revisions": []
    }
  },
  "audienceAnalysis": { "category": "", "priceSegment": "" },
  "marketingStrategy": "УТП",
  "composition": { "rule": "rule-of-thirds", "focusPoint": "product", "visualFlow": "Z-pattern" },
  "layout": "marketplace",
  "cameraAngle": "three-quarter",
  "objectScale": 0.58,
  "lightDirection": "top-left",
  "lightTemperature": "5500K",
  "shadowType": "contact-soft",
  "reflection": false,
  "backgroundPrompt": "english only, premium scene, NO product, NO text",
  "colorPalette": ["#hex", "#hex", "#hex"],
  "fontId": null,
  "fontReason": "почему этот шрифт",
  "badgeId": null,
  "badgeReason": "почему этот badge",
  "headline": "Title Case",
  "subHeadline": "короткий тип",
  "bullets": ["5 уникальных УТП на русском"],
  "badge": "бренд",
  "negativePrompt": "no product in background",
  "qualityChecklist": ["композиция сбалансирована", "хук ${f.visualHook.type} реализован"]
}

Холст Wildberries: 900×1200. objectScale 0.55–0.72 для marketplace.
${input.referenceHint ? `РЕФЕРЕНС: ${input.referenceHint}` : ""}
${input.retryHint ? input.retryHint : ""}

ОПИСАНИЕ ТОВАРА:
"${input.productPrompt}"`;
}

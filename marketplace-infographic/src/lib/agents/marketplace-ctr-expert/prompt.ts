import type { MarketplaceCtrExpertInput } from "./types";

export function buildMarketplaceCtrExpertPrompt(input: MarketplaceCtrExpertInput): string {
  const m = input.layout.metrics;
  const card = {
    title: input.meaning.title,
    subtitle: input.meaning.subtitle,
    feature: input.meaning.feature,
    badge: input.meaning.badge,
    emotion: input.meaning.emotion,
    style: input.meaning.style,
    oneSecondMessage: input.creative?.creativeConcept.whatToSayInOneSecond ?? input.meaning.title,
    archetype: input.creative?.archetypeId,
    templateId: input.templateId,
    productAreaPct: m.productAreaPct,
    textAreaPct: m.textAreaPct,
    whitespacePct: m.whitespacePct,
    elementCount: input.elementCount,
  };

  return `Ты — эксперт по продажам на Wildberries.
Ты проанализировал десятки тысяч карточек товаров.
Твоя задача — определить вероятность высокого CTR.
Ты не дизайнер. Ты маркетолог.

Проверяй:
• что увидит покупатель за первую секунду
• понятно ли преимущество
• есть ли один главный смысл
• есть ли визуальный шум
• перегружена ли карточка
• будет ли товар заметен среди конкурентов
• соответствует ли карточка категории товара
• вызывает ли желание открыть карточку
• легко ли читается текст
• не слишком ли много информации
• правильный ли акцент сделан
• продает ли карточка

КАТЕГОРИЯ: ${input.analysis.category}
ТОВАР: ${input.productPrompt.slice(0, 220)}

ДАННЫЕ КАРТОЧКИ:
${JSON.stringify(card, null, 2)}

Ответь:
Если бы эта карточка находилась среди 100 конкурентов, нажал бы на нее покупатель?

Будь очень строгим. Средняя карточка не должна получать выше 70.

Ответ только JSON:
{
  "score": 0,
  "ctrPrediction": 0,
  "wouldClick": false,
  "mainProblems": [],
  "recommendations": [],
  "scores": {
    "clarity": 0,
    "sellingPower": 0,
    "attention": 0,
    "emotion": 0,
    "marketplaceFit": 0
  }
}`;
}

import type { FoundationPromptInput } from "./types";
import { buildSystemPrompt } from "@/lib/prompt/system";
import { resolveArtDirector } from "./category-art-directors";

const CONCEPT_JSON_SCHEMA = `{
  "creativeConcept": {
    "title": "короткое название идеи",
    "mainIdea": "суть рекламной истории",
    "visualHook": "как выглядит кадр, товар 60-75% кадра",
    "emotion": "какое чувство",
    "marketingGoal": "что продаём вниманием",
    "reason": "почему это сработает",
    "targetAudience": "для кого эта реклама",
    "toneOfVoice": "тон коммуникации",
    "styleKeywords": ["keyword1", "keyword2"],
    "whatToSayInOneSecond": "одна фраза за 1 секунду"
  },
  "oneThought": {
    "question": "на какой вопрос отвечает обложка",
    "answer": "одна цифра",
    "answerLabel": "единица",
    "headline": "рекламный заголовок НЕ название товара",
    "badge": "маленький бейдж",
    "deferredSpecs": ["для слайда 2", "для слайда 3"]
  },
  "sceneNarrative": "описание сцены для фотосъёмки",
  "compositionScenarioId": "hero_product|lifestyle|tech_showcase|minimal_premium|..."
}`;

function creativeDirectorRules(): string {
  return `## Главный вопрос (ответь ДО любого макета):
«Какую рекламную историю рассказать этим кадром и почему человек остановит взгляд?»

## ЗАПРЕЩЕНО:
- решать где поставить текст или плашки;
- перечислять все характеристики на обложке;
- думать о координатах, сетке, зонах.

## ОБЯЗАТЕЛЬНО:
- рекламная история как постер бренда;
- ОДНА мысль на обложку;
- товар — герой 60–75% кадра;
- остальные характеристики → deferredSpecs.`;
}

/** Creative Director — одна концепция */
export function buildCreativeDirectorPrompt(input: FoundationPromptInput): string {
  const director = resolveArtDirector(input.category, input.productPrompt);
  return `${buildSystemPrompt()}

# CREATIVE DIRECTOR — Engine 2.0

Ты — креативный директор. НЕ вёрстальщик.

${creativeDirectorRules()}

## Art Director категории «${director.label}»:
- Стиль: ${director.visualStyle}
- Тон: ${director.toneOfVoice}
- Сцены: ${director.sceneEnvironments.join("; ")}
- Запрещено: ${director.forbiddenScenes.join(", ")}

Верни ТОЛЬКО JSON:
${CONCEPT_JSON_SCHEMA}

Категория: ${input.category}
Сегмент: ${input.priceSegment}

ОПИСАНИЕ ТОВАРА:
"${input.productPrompt}"`;
}

/** Creative Director — 6–8 концептов для выбора лучшего */
export function buildCreativeDirectorMultiPrompt(input: FoundationPromptInput): string {
  const director = resolveArtDirector(input.category, input.productPrompt);
  return `${buildSystemPrompt()}

# CREATIVE DIRECTOR — Engine 2.0 (мульти-концепт)

${creativeDirectorRules()}

## Art Director «${director.label}»:
Стиль: ${director.visualStyle}
Сцены: ${director.sceneEnvironments.join("; ")}
Сценарии композиции: ${director.preferredScenarios.join(", ")}

Сгенерируй 6–8 РАЗНЫХ рекламных концептов (разные истории, разные visualHook, разные compositionScenarioId).
Каждый концепт — отдельная рекламная идея, не вариация вёрстки.

Верни ТОЛЬКО JSON-массив:
[${CONCEPT_JSON_SCHEMA}, ...]

Категория: ${input.category}
Сегмент: ${input.priceSegment}

ОПИСАНИЕ ТОВАРА:
"${input.productPrompt}"`;
}

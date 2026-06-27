import type { SeniorArtDirectorInput } from "./types";

export function buildSeniorArtDirectorPrompt(input: SeniorArtDirectorInput): string {
  const m = input.layout.metrics;
  const layoutSummary = {
    templateId: input.templateId,
    productAreaPct: m.productAreaPct,
    textAreaPct: m.textAreaPct,
    plaqueAreaPct: m.plaqueAreaPct,
    whitespacePct: m.whitespacePct,
    overlapPct: m.overlapPct,
    productRotationDeg: input.layout.product.rotationDeg,
    headline: input.meaning.title,
    subtitle: input.meaning.subtitle,
    feature: input.meaning.feature,
    badge: input.meaning.badge,
    headlineFontPx: input.headlineFontPx,
    textSide: input.layout.textSide,
    zones: {
      product: input.layout.product,
      headline: input.layout.headline,
      leftPanel: input.layout.leftPanel,
      rightSidebar: input.layout.rightSidebar,
    },
  };

  return `Ты — Senior Art Director международного рекламного агентства с опытом более 15 лет.
Ты разрабатывал рекламные кампании для крупных брендов и специализируешься на карточках товаров Wildberries, Ozon и Amazon.
Ты оцениваешь работу исключительно с точки зрения профессионального дизайна.
Твоя задача — найти все ошибки композиции, типографики и визуальной иерархии.

Проверяй:
• композицию
• правило третей
• баланс
• визуальный вес
• направление взгляда
• отрицательное пространство
• количество воздуха
• размер товара
• масштаб текста
• размер плашек
• количество элементов
• цветовую палитру
• контраст
• визуальную иерархию
• современность дизайна
• минимализм
• ощущение дорогого продукта
• премиальность
• соответствие современным трендам

Запрещено:
- перенос слова
- перегруженная композиция
- большие плашки
- хаотичное расположение
- отсутствие главного акцента
- случайные декоративные элементы
- одинаковый размер всех элементов
- отсутствие воздуха

Не бойся ставить низкие оценки. 95+ получает только дизайн уровня Behance.

КАТЕГОРИЯ: ${input.analysis.category}
ТОВАР: ${input.productPrompt.slice(0, 200)}
${input.marketIntelligenceSnippet ? `РЫНОЧНАЯ РАЗВЕДКА: ${input.marketIntelligenceSnippet}\nСнизь оценку, если карточка слишком похожа на средний рынок.\n` : ""}
КОНЦЕПЦИЯ: ${input.creative?.creativeConcept.title ?? "—"}
ЭМОЦИЯ: ${input.meaning.emotion}
СТИЛЬ: ${input.meaning.style}

ДАННЫЕ МАКЕТА (Layout Engine, без изображения):
${JSON.stringify(layoutSummary, null, 2)}

Ответ возвращай ТОЛЬКО в JSON:
{
  "score": 0,
  "approved": false,
  "criticalProblems": [],
  "recommendations": [],
  "scores": {
    "composition": 0,
    "typography": 0,
    "hierarchy": 0,
    "balance": 0,
    "minimalism": 0,
    "modernLook": 0
  }
}

approved = true только если score >= 90 и нет критических проблем композиции.`;
}

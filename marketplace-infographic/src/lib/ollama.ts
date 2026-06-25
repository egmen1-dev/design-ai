import { infographicDataSchema, type InfographicData } from "./infographic-template";
import { renderInfographicHtml } from "./infographic-template";
import { DEFAULT_STYLE, type InfographicStyle } from "./design-trends";
import { getOllamaStatus, OLLAMA_BASE_URL, OLLAMA_MODEL } from "./ai-status";
import { generateMockInfographicData } from "./ollama-mock";

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ollama не вернула валидный JSON");
  }
  return text.slice(start, end + 1);
}

const INFOGRAPHIC_EXAMPLE = `{
  "headline": "ГЕНЕРАТОР",
  "productName": "Бензиновый генератор Kronwerk 3 кВт",
  "categoryPill": "бензиновый",
  "brandName": "Kronwerk",
  "productEmoji": "⚡",
  "productVisual": "generator",
  "backgroundScene": "outdoor_home",
  "specBlocks": [
    {"value": "3", "label": "кВт мощность", "hint": "Стабильная работа дома и на даче"},
    {"value": "15 литров", "label": "объём бака", "hint": "Долгая работа без дозаправки"}
  ],
  "mainBanner": {
    "icon": "⚡",
    "title": "3000 Вт стабильная мощность",
    "description": "Хватает для холодильника, освещения и инструмента"
  },
  "callouts": [
    {"text": "Защита от перегрузки", "position": "bottom-left"},
    {"text": "Автоотключение при низком масле", "position": "middle-right"}
  ],
  "accentColor": "red"
}`;

async function callOllama(prompt: string, style: InfographicStyle): Promise<InfographicData> {
  const systemPrompt = `Ты — арт-директор инфографики для Wildberries и Ozon.

ВАЖНО: это профессиональный слайд 1200×1200 как на WB/Ozon:
- крупное фото товара по центру на траве
- заголовок — ОДНО СЛОВО типа товара (ГЕНЕРАТОР, КРЕМ, НАУШНИКИ)
- красная плашка с подтипом (бензиновый, для лица)
- 3 бейджа с цифрами вокруг товара

Стиль дизайна: ${style}.

Поля JSON:
1. headline — ОДНО СЛОВО КАПСОМ, тип товара: "ГЕНЕРАТОР", "ПЫЛЕСОС", "КРЕМ", "НАУШНИКИ" (НЕ слоган!)
2. productName — полное название с брендом
3. categoryPill — короткий подтип строчными: "бензиновый", "беспроводные", "для лица"
4. brandName — бренд одним словом: "Kronwerk", "Samsung"
5. productVisual — generator | appliance | cosmetic | generic
6. backgroundScene — outdoor_home для генераторов/дачи, kitchen, bathroom, office, nature, studio
7. specBlocks — 2 блока:
   - первый: value = ОДНА ЦИФРА или короткое число ("3", "7", "5000"), label = единица ("кВт мощность", "л/с двигатель")
   - второй: value = объём/факт ("15 литров"), label = подпись ("объём бака")
8. mainBanner — горизонтальный бейдж справа: icon (эмодзи), title = мощность/главная фишка с цифрой ("3000 Вт стабильная мощность"), description
9. callouts — 2 функции (для резерва, можно кратко)
10. accentColor — red | blue | purple | green

Правила:
- Факты ТОЛЬКО из описания товара
- headline НИКОГДА не слоган — только категория товара
- specBlocks[0].value — максимально короткая цифра для крупного бейджа
- mainBanner.title — ключевая характеристика с цифрой

Пример:
${INFOGRAPHIC_EXAMPLE}

Товар:
"${prompt}"

Верни ТОЛЬКО JSON.`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: { temperature: 0.35, num_predict: 1536 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama недоступна: ${response.status}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) {
    throw new Error("Пустой ответ от Ollama");
  }

  const parsed = JSON.parse(extractJson(data.response)) as unknown;
  return infographicDataSchema.parse(parsed);
}

export async function generateInfographicData(
  prompt: string,
  style: InfographicStyle = DEFAULT_STYLE,
): Promise<{ data: InfographicData; source: "ollama" | "mock" }> {
  const status = await getOllamaStatus();

  if (status.mockMode || !status.available) {
    return { data: generateMockInfographicData(prompt), source: "mock" };
  }

  try {
    const data = await callOllama(prompt, style);
    return { data, source: "ollama" };
  } catch (error) {
    console.warn("Ollama failed, using mock fallback:", error);
    return { data: generateMockInfographicData(prompt), source: "mock" };
  }
}

export async function generateInfographicHtml(
  prompt: string,
  options?: {
    productImageSrc?: string;
    productImageCutout?: boolean;
    style?: InfographicStyle;
  },
): Promise<{ html: string; source: "ollama" | "mock"; appliedStyle: InfographicStyle }> {
  const appliedStyle = options?.style ?? DEFAULT_STYLE;
  const { data, source } = await generateInfographicData(prompt, appliedStyle);
  return {
    html: renderInfographicHtml(data, options),
    source,
    appliedStyle,
  };
}

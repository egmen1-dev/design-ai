import { sanitizeSdInput } from "@/lib/sd-sanitize";
import {
  DEFAULT_STYLE,
  STYLE_LABELS,
  TRENDS,
  type InfographicStyle,
} from "@/lib/design-trends";
import type { DesignLibrary } from "@/lib/design-library";
import { formatLibraryForPrompt } from "@/lib/design-library";
import {
  formatExamplesForPrompt,
  selectRelevantExamples,
} from "@/lib/select-relevant-examples";
import { infographicSdSchema, type InfographicSdInput } from "@/lib/validations";
import { applyStyleToSdColors } from "@/lib/sd-style-theme";
import { getOllamaStatus, OLLAMA_BASE_URL, OLLAMA_MODEL } from "./ai-status";

export type InfographicSdData = InfographicSdInput;

export type OllamaSdContext = {
  library?: DesignLibrary;
  examples?: Awaited<ReturnType<typeof selectRelevantExamples>>;
};

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ollama не вернула валидный JSON");
  }
  return text.slice(start, end + 1);
}

const SD_EXAMPLE = `{
  "layout": "hero",
  "title": "ГЕНЕРАТОР",
  "subtitle": "бензиновый",
  "bullets": ["3 кВт мощность", "15 литров бак", "3000 Вт стабильная мощность", "тихая работа 65 дБ"],
  "colors": ["#e31e24", "#2563eb", "#0f172a"],
  "badge": "Kronwerk",
  "backgroundPrompt": "professional marketplace product photo background, suburban garden with lush green grass, soft natural daylight, shallow depth of field, space in center for gasoline generator, photorealistic, 2025 ecommerce trend, high CTR, no text, no people, 8k",
  "fontId": null,
  "badgeId": null
}`;

export function generateMockSdData(
  prompt: string,
  style: InfographicStyle = DEFAULT_STYLE,
  library?: DesignLibrary,
): InfographicSdData {
  const lower = prompt.toLowerCase();
  const isGenerator = /генератор|бензин|квт/.test(lower);
  const trend = TRENDS[style];

  const styleFont = library?.fonts.find((font) => font.styleTags.includes(style));
  const styleBadge = library?.badges.find((badge) => badge.styleTags.includes(style));

  const base = infographicSdSchema.parse({
    layout: "hero",
    title: isGenerator ? "ГЕНЕРАТОР" : "ТОВАР",
    subtitle: isGenerator ? "бензиновый" : "новинка",
    bullets: isGenerator
      ? ["3 кВт мощность", "15 литров бак", "3000 Вт стабильная мощность"]
      : ["Премиум качество", "Быстрая доставка", "Гарантия 12 месяцев"],
    colors: [trend.accent, "#2563eb", "#0f172a"],
    badge: isGenerator ? "Kronwerk" : "Brand",
    backgroundPrompt: isGenerator
      ? "professional product photography background, suburban garden with green grass, soft daylight, center space for generator, photorealistic, marketplace infographic 2025, no text, no words, no letters"
      : "clean studio product photography background, soft gradient, professional lighting, center space for product, photorealistic, ecommerce 2025, no text, no words, no letters",
    fontId: styleFont?.id ?? null,
    badgeId: styleBadge?.id ?? null,
  });

  return applyStyleToSdColors(base, style);
}

async function callOllamaSd(
  prompt: string,
  style: InfographicStyle,
  context: OllamaSdContext = {},
): Promise<InfographicSdData> {
  const trend = TRENDS[style];
  const libraryBlock = context.library
    ? formatLibraryForPrompt(context.library)
    : "Библиотека шрифтов и плашек пуста — используй fontId: null, badgeId: null.";
  const examplesBlock = formatExamplesForPrompt(context.examples ?? []);

  const systemPrompt = `Ты — арт-директор для Wildberries.

Стиль дизайна слайда: ${style} (${STYLE_LABELS[style]}).
Акцентный цвет стиля: ${trend.accent}. Используй его в colors[0].

Для каждого товара придумай текст и стиль инфографики 1200×1200, а также промпт на АНГЛИЙСКОМ для Stable Diffusion — идеальный фотореалистичный фон.
Фон должен соответствовать трендам 2025, повышать кликабельность, передавать контекст использования товара.
В backgroundPrompt: только описание сцены на английском, СТРОГО без текста/надписей/букв на изображении, без людей, с местом по центру для товара.
Визуальная атмосфера фона должна соответствовать стилю ${style}: ${trend.css}

Весь видимый текст слайда — ТОЛЬКО на русском (title, subtitle, bullets, badge).

${libraryBlock}

Выбирай fontId и badgeId только из списков выше. Если ничего не подходит — null.
Предпочитай ассеты, у которых styleTags содержит "${style}".

Референсы выше — реальные карточки маркетплейса. Повторяй их композицию: структуру заголовка, УТП, акценты, баланс текста и товара.

Верни ТОЛЬКО JSON:
{
  "layout": "hero" | "cards" | "split" | "minimal",
  "title": "одно слово КАПСОМ — тип товара",
  "subtitle": "короткий подтип строчными",
  "bullets": ["2-5 УТП с цифрами из описания"],
  "colors": ["#hex", "#hex", "#hex"],
  "badge": "бренд",
  "backgroundPrompt": "english prompt for SD XL, 10-200 chars, photorealistic scene",
  "fontId": "uuid из библиотеки или null",
  "badgeId": "uuid из библиотеки или null"
}

Правила:
- Факты только из описания товара
- backgroundPrompt строго на английском
- colors: accent, secondary, dark tone
- fontId/badgeId — только из библиотеки или null

Пример:
${SD_EXAMPLE}

Товар:
"${prompt}"`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: { temperature: 0.4, num_predict: 1536 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama недоступна: ${response.status}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Пустой ответ от Ollama");

  const parsed = JSON.parse(extractJson(data.response)) as unknown;
  const raw = sanitizeSdInput(parsed);
  return applyStyleToSdColors(raw, style);
}

function clampLibraryIds(
  data: InfographicSdData,
  library?: DesignLibrary,
): InfographicSdData {
  if (!library) return data;

  const fontIds = new Set(library.fonts.map((font) => font.id));
  const badgeIds = new Set(library.badges.map((badge) => badge.id));

  return {
    ...data,
    fontId: data.fontId && fontIds.has(data.fontId) ? data.fontId : null,
    badgeId: data.badgeId && badgeIds.has(data.badgeId) ? data.badgeId : null,
  };
}

export async function generateSdInfographicData(
  prompt: string,
  style: InfographicStyle = DEFAULT_STYLE,
  context: OllamaSdContext = {},
): Promise<{ data: InfographicSdData; source: "ollama" | "mock" }> {
  const status = await getOllamaStatus();
  if (status.mockMode || !status.available) {
    const data = clampLibraryIds(generateMockSdData(prompt, style, context.library), context.library);
    return { data, source: "mock" };
  }
  try {
    const data = clampLibraryIds(
      await callOllamaSd(prompt, style, context),
      context.library,
    );
    return { data, source: "ollama" };
  } catch (error) {
    console.warn("Ollama SD failed, mock fallback:", error);
    const data = clampLibraryIds(generateMockSdData(prompt, style, context.library), context.library);
    return { data, source: "mock" };
  }
}

export async function buildOllamaSdContext(
  prompt: string,
  library?: DesignLibrary,
): Promise<OllamaSdContext> {
  const [loadedLibrary, examples] = await Promise.all([
    library ? Promise.resolve(library) : import("@/lib/design-library").then((m) => m.loadDesignLibrary()),
    selectRelevantExamples(prompt, 5),
  ]);

  return {
    library: loadedLibrary,
    examples,
  };
}

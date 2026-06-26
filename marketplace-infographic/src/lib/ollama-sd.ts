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
import {
  applyReferenceToSdData,
  defaultMarketplaceColors,
  resolveReferenceContext,
  type ResolvedReferenceContext,
} from "@/lib/reference-style-resolver";
import { infographicSdSchema, type InfographicSdInput } from "@/lib/validations";
import { applyStyleToSdColors } from "@/lib/sd-style-theme";
import { getOllamaStatus, OLLAMA_BASE_URL, OLLAMA_MODEL } from "./ai-status";

export type InfographicSdData = InfographicSdInput;

export type OllamaSdContext = {
  library?: DesignLibrary;
  examples?: Awaited<ReturnType<typeof selectRelevantExamples>>;
  referenceContext?: ResolvedReferenceContext;
};

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ollama не вернула валидный JSON");
  }
  return text.slice(start, end + 1);
}

const SD_EXAMPLE_MARKETPLACE = `{
  "layout": "marketplace",
  "title": "Садовый триммер",
  "subtitle": "аккумуляторный",
  "bullets": ["1300 Вт мощность", "65 дБ тихая работа", "3 мощных АКБ", "8 насадок", "лёгкий и компактный"],
  "colors": ["#00a8b5", "#ffffff", "#0f172a"],
  "badge": "GardenPro",
  "backgroundPrompt": "professional marketplace product photo, sunny suburban backyard with green lawn, wooden house blurred in background, soft natural daylight, shallow depth of field, center space for garden trimmer, photorealistic, no text, no people, 8k",
  "fontId": null,
  "badgeId": null
}`;

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
  referenceContext?: ResolvedReferenceContext,
): InfographicSdData {
  const lower = prompt.toLowerCase();
  const isTrimmer = /триммер|газон|косил|садов/.test(lower);
  const isGenerator = /генератор|бензин|квт/.test(lower);
  const trend = TRENDS[style];
  const useMarketplace = true;

  const styleFont = library?.fonts.find((font) => font.styleTags.includes(style));
  const styleBadge = library?.badges.find((badge) => badge.styleTags.includes(style));

  const colors = referenceContext?.colors?.length
    ? referenceContext.colors
    : useMarketplace
      ? defaultMarketplaceColors()
      : [trend.accent, "#2563eb", "#0f172a"];

  const base = infographicSdSchema.parse({
    layout: useMarketplace ? "marketplace" : "hero",
    title: isTrimmer ? "Садовый триммер" : isGenerator ? "ГЕНЕРАТОР" : "ТОВАР",
    subtitle: isTrimmer ? "аккумуляторный" : isGenerator ? "бензиновый" : "новинка",
    bullets: isTrimmer
      ? ["1300 Вт мощность", "65 дБ тихая работа", "3 мощных АКБ", "8 насадок", "лёгкий и компактный"]
      : isGenerator
        ? ["3 кВт мощность", "15 литров бак", "3000 Вт стабильная мощность"]
        : ["Премиум качество", "Быстрая доставка", "Гарантия 12 месяцев"],
    colors,
    badge: isTrimmer ? "GardenPro" : isGenerator ? "Kronwerk" : "Brand",
    backgroundPrompt: isTrimmer
      ? "professional marketplace product photo, sunny suburban backyard with green lawn, wooden house blurred in background, soft natural daylight, shallow depth of field, center space for garden trimmer, photorealistic, no text, no people, 8k"
      : isGenerator
        ? "professional product photography background, suburban garden with green grass, soft daylight, center space for generator, photorealistic, marketplace infographic 2025, no text, no words, no letters"
        : "clean studio product photography background, soft gradient, professional lighting, center space for product, photorealistic, ecommerce 2025, no text, no words, no letters",
    fontId: styleFont?.id ?? null,
    badgeId: styleBadge?.id ?? null,
  });

  if (referenceContext?.hasStrongReference) {
    return applyReferenceToSdData(base, referenceContext);
  }

  return applyStyleToSdColors(base, style);
}

async function callOllamaSd(
  prompt: string,
  style: InfographicStyle,
  context: OllamaSdContext = {},
): Promise<InfographicSdData> {
  const ref = context.referenceContext ?? resolveReferenceContext(
    prompt,
    style,
    context.examples ?? [],
  );
  const effectiveStyle = ref.hasStrongReference ? ref.style : style;
  const trend = TRENDS[effectiveStyle];
  const libraryBlock = context.library
    ? formatLibraryForPrompt(context.library)
    : "Библиотека шрифтов и плашек пуста — используй fontId: null, badgeId: null.";
  const examplesBlock = formatExamplesForPrompt(context.examples ?? []);
  const useMarketplace = true;
  const referenceColors = ref.colors?.join(", ") ?? defaultMarketplaceColors().join(", ");

  const layoutInstruction = useMarketplace
    ? `ОБЯЗАТЕЛЬНО layout: "marketplace" — профессиональная карточка Wildberries/Ozon.
title — с заглавной буквы (НЕ КАПСОМ), например "Садовый триммер".
subtitle — короткий тип товара для pill-кнопки, например "аккумуляторный".
bullets — РОВНО 5 строк, каждая уникальна, без повторов:
  [0] левая карточка: мощность/обороты (например "1300 Вт мощность")
  [1] левая карточка: второй тех. параметр (например "65 дБ тихая работа")
  [2] правая колонка: кол-во АКБ (например "3 мощных АКБ")
  [3] правая колонка: кол-во насадок (например "8 насадок")
  [4] низ слайда: качество (например "лёгкий и компактный")
Опционально вместо [1] можно подарок: "Очки и перчатки в подарок".
Пиши грамотно по-русски: "литра", не "итра". Не дублируй один параметр в разных bullets.
colors — палитра референса: [${referenceColors}].
НЕ добавляй watermark "WILDBERRIES" на слайд.`
    : `layout: "hero" | "cards" | "split" | "minimal"`;

  const compositionHint = ref.compositionHint
    ? `\nКомпозиция лучшего референса: ${ref.compositionHint}`
    : "";

  const systemPrompt = `Ты — арт-директор для Wildberries/Ozon.

Стиль дизайна слайда: ${effectiveStyle} (${STYLE_LABELS[effectiveStyle]}).
${useMarketplace ? `Акцентный цвет из референса: ${ref.colors?.[0] ?? "#00a8b5"}.` : `Акцентный цвет стиля: ${trend.accent}. Используй его в colors[0].`}

Для каждого товара придумай текст и стиль инфографики 1200×1200, а также промпт на АНГЛИЙСКОМ для Stable Diffusion — идеальный фотореалистичный фон.
Фон должен соответствовать трендам 2025, повышать кликабельность, передавать контекст использования товара.
В backgroundPrompt: только описание сцены на английском, СТРОГО без текста/надписей/букв на изображении, без людей, с местом по центру для товара.
Визуальная атмосфера фона должна соответствовать стилю ${effectiveStyle}: ${trend.css}

Весь видимый текст слайда — ТОЛЬКО на русском (title, subtitle, bullets, badge).

${examplesBlock}

${libraryBlock}

Выбирай fontId и badgeId только из списков выше. Если ничего не подходит — null.
Предпочитай ассеты, у которых styleTags содержит "${effectiveStyle}".

Референсы выше — реальные карточки маркетплейса. Повторяй их композицию: структуру заголовка, УТП, акценты, баланс текста и товара.${compositionHint}

Верни ТОЛЬКО JSON:
{
  "layout": ${useMarketplace ? '"marketplace"' : '"hero" | "cards" | "split" | "minimal"'},
  "title": "тип товара",
  "subtitle": "короткий подтип строчными",
  "bullets": ["2-5 УТП с цифрами из описания"],
  "colors": ["#hex", "#hex", "#hex"],
  "badge": "бренд",
  "backgroundPrompt": "english prompt for SD XL, 10-200 chars, photorealistic scene",
  "fontId": "uuid из библиотеки или null",
  "badgeId": "uuid из библиотеки или null"
}

Правила:
- ${layoutInstruction}
- Факты только из описания товара
- backgroundPrompt строго на английском
- colors: accent, secondary, dark tone
- fontId/badgeId — только из библиотеки или null

Пример:
${useMarketplace ? SD_EXAMPLE_MARKETPLACE : SD_EXAMPLE}

Товар:
"${prompt}"`;

  const ollamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 120_000);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: { temperature: 0.35, num_predict: 1536 },
    }),
    signal: AbortSignal.timeout(ollamaTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Ollama недоступна: ${response.status}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Пустой ответ от Ollama");

  const parsed = JSON.parse(extractJson(data.response)) as unknown;
  const raw = sanitizeSdInput(parsed);
  const withReference = applyReferenceToSdData(raw, ref);

  if (ref.hasStrongReference) {
    return withReference;
  }

  return applyStyleToSdColors(withReference, effectiveStyle);
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
  const referenceContext =
    context.referenceContext ??
    resolveReferenceContext(prompt, style, context.examples ?? []);

  const enrichedContext: OllamaSdContext = {
    ...context,
    referenceContext,
  };

  const status = await getOllamaStatus();
  if (status.mockMode || !status.available) {
    const data = clampLibraryIds(
      generateMockSdData(prompt, style, context.library, referenceContext),
      context.library,
    );
    return { data, source: "mock" };
  }
  try {
    const data = clampLibraryIds(
      await callOllamaSd(prompt, style, enrichedContext),
      context.library,
    );
    return { data, source: "ollama" };
  } catch (error) {
    console.warn("Ollama SD failed, mock fallback:", error);
    const data = clampLibraryIds(
      generateMockSdData(prompt, style, context.library, referenceContext),
      context.library,
    );
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

  const referenceContext = resolveReferenceContext(prompt, DEFAULT_STYLE, examples);

  return {
    library: loadedLibrary,
    examples,
    referenceContext,
  };
}

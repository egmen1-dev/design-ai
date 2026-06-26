import sharp from "sharp";
import {
  DEFAULT_STYLE,
  STYLE_KEYS,
  STYLE_LABELS,
  type InfographicStyle,
} from "@/lib/design-trends";
import { getOllamaStatus, OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ai-status";

export type ReferenceEnrichment = {
  appliedStyle: InfographicStyle;
  styleReason: string;
  synonyms: string[];
  tags: string[];
  compositionNotes: string | null;
  dominantColors: string[];
  layoutBlueprint: {
    layout: "marketplace";
    titleCase: boolean;
    subtitlePill: boolean;
    leftStatCards: boolean;
    rightVerticalBar: boolean;
    productDiagonal: boolean;
    dominantColors: string[];
  };
};

type VisualStats = {
  dominantHex: string[];
  backgroundLightRatio: number;
  avgSaturation: number;
  contrast: number;
  warmRatio: number;
};

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("JSON not found in model response");
  }
  return text.slice(start, end + 1);
}

function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function uniqueTerms(terms: string[], max = 30): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms) {
    const term = normalizeTerm(raw);
    if (term.length < 2 || seen.has(term)) continue;
    seen.add(term);
    out.push(term);
    if (out.length >= max) break;
  }
  return out;
}

async function analyzeImageVisualStats(imageBuffer: Buffer): Promise<VisualStats> {
  const { data, info } = await sharp(imageBuffer)
    .resize(320, 320, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const colorCounts = new Map<string, number>();
  let lightPixels = 0;
  let warmPixels = 0;
  let saturationSum = 0;
  const luminances: number[] = [];

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    luminances.push(lum);

    const sat = max === 0 ? 0 : (max - min) / max;
    saturationSum += sat;

    if (lum > 200) lightPixels += 1;
    if (r > g + 15 && r > b + 10) warmPixels += 1;

    const bucket = `#${[r, g, b]
      .map((v) => Math.round(v / 32) * 32)
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`;
    colorCounts.set(bucket, (colorCounts.get(bucket) ?? 0) + 1);
  }

  const totalPixels = width * height;
  const avgLum = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance =
    luminances.reduce((sum, lum) => sum + (lum - avgLum) ** 2, 0) / luminances.length;

  const dominantHex = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hex]) => hex);

  return {
    dominantHex,
    backgroundLightRatio: lightPixels / totalPixels,
    avgSaturation: saturationSum / totalPixels,
    contrast: Math.sqrt(variance),
    warmRatio: warmPixels / totalPixels,
  };
}

function heuristicStyle(stats: VisualStats): InfographicStyle {
  const scores: Record<InfographicStyle, number> = {
    glassmorphism: 0,
    minimal: 0,
    modern: 0,
    neumorphism: 0,
    brutalism: 0,
    "3d": 0,
    retro: 0,
    swiss: 0,
  };

  if (stats.backgroundLightRatio > 0.55) {
    scores.minimal += 3;
    scores.swiss += 1;
  }
  if (stats.contrast > 70) {
    scores.brutalism += 2;
    scores.swiss += 2;
  }
  if (stats.avgSaturation < 0.2) {
    scores.minimal += 2;
    scores.neumorphism += 2;
  }
  if (stats.avgSaturation > 0.45) {
    scores.modern += 2;
    scores.brutalism += 1;
  }
  if (stats.warmRatio > 0.2) {
    scores.retro += 3;
  }
  if (stats.dominantHex.some((hex) => hex.startsWith("#00") || hex.startsWith("#a0"))) {
    scores.glassmorphism += 2;
    scores.modern += 1;
  }
  if (stats.contrast > 45 && stats.avgSaturation > 0.3) {
    scores["3d"] += 2;
  }

  const ranked = STYLE_KEYS.map((key) => ({ key, score: scores[key] })).sort(
    (a, b) => b.score - a.score,
  );

  return ranked[0]?.score > 0 ? ranked[0].key : DEFAULT_STYLE;
}

async function callOllamaJson(prompt: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.35, num_predict: 1200 },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Empty Ollama response");

  return JSON.parse(extractJson(data.response)) as Record<string, unknown>;
}

function parseStyle(value: unknown, fallback: InfographicStyle): InfographicStyle {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  return STYLE_KEYS.includes(normalized as InfographicStyle)
    ? (normalized as InfographicStyle)
    : fallback;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function detectStyleWithOllama(
  prompt: string,
  notes: string | null,
  stats: VisualStats,
  heuristic: InfographicStyle,
): Promise<{ style: InfographicStyle; reason: string; compositionNotes: string | null }> {
  const styleList = STYLE_KEYS.map((key) => `${key} (${STYLE_LABELS[key]})`).join(", ");

  const ollamaPrompt = `Ты — арт-директор карточек Wildberries/Ozon.

Описание товара от продавца: "${prompt}"
${notes ? `Заметки: "${notes}"` : ""}

Визуальный анализ загруженной карточки (автоматически):
- доминирующие цвета: ${stats.dominantHex.join(", ")}
- светлый фон: ${Math.round(stats.backgroundLightRatio * 100)}%
- средняя насыщенность: ${stats.avgSaturation.toFixed(2)}
- контраст: ${stats.contrast.toFixed(1)}
- тёплые оттенки: ${Math.round(stats.warmRatio * 100)}%
- эвристика стиля: ${heuristic} (${STYLE_LABELS[heuristic]})

Выбери ОДИН стиль карточки из списка: ${styleList}

Верни ТОЛЬКО JSON:
{
  "appliedStyle": "один ключ из списка",
  "styleReason": "кратко по-русски почему (1 предложение)",
  "compositionNotes": "кратко по-русски: композиция карточки (заголовок, УТП, товар)"
}`;

  const parsed = await callOllamaJson(ollamaPrompt);
  return {
    style: parseStyle(parsed.appliedStyle, heuristic),
    reason:
      typeof parsed.styleReason === "string" && parsed.styleReason.trim()
        ? parsed.styleReason.trim()
        : `Определён стиль ${STYLE_LABELS[heuristic]}`,
    compositionNotes:
      typeof parsed.compositionNotes === "string" && parsed.compositionNotes.trim()
        ? parsed.compositionNotes.trim()
        : null,
  };
}

async function generateSynonymsWithOllama(
  prompt: string,
  notes: string | null,
  appliedStyle: InfographicStyle,
): Promise<string[]> {
  const ollamaPrompt = `Товар для маркетплейса WB/Ozon: "${prompt}"
${notes ? `Контекст: "${notes}"` : ""}
Стиль карточки: ${appliedStyle} (${STYLE_LABELS[appliedStyle]})

Сгенерируй синонимы и похожие поисковые запросы покупателей (только русский).
Нужны: синонимы товара, смежные категории, бытовые формулировки, сленг, запросы с характеристиками.
Минимум 18, максимум 28 коротких фраз (1-4 слова).

Верни ТОЛЬКО JSON:
{ "synonyms": ["фраза1", "фраза2"] }`;

  const parsed = await callOllamaJson(ollamaPrompt);
  return parseStringArray(parsed.synonyms);
}

function mockSynonyms(prompt: string): string[] {
  const base = prompt
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2);

  const extras: string[] = [];
  if (base.some((w) => /триммер|косил|газон/.test(w))) {
    extras.push(
      "газонокосилка",
      "кусторез",
      "садовый инструмент",
      "электрокоса",
      "подрезка травы",
      "дачный триммер",
    );
  }
  if (base.some((w) => /генератор|электр/.test(w))) {
    extras.push("электростанция", "бензогенератор", "источник питания", "резервное электричество");
  }

  return uniqueTerms([...base, ...extras, prompt], 25);
}

export async function enrichReferenceUpload(input: {
  prompt: string;
  notes: string | null;
  imageBuffer: Buffer;
}): Promise<ReferenceEnrichment> {
  const stats = await analyzeImageVisualStats(input.imageBuffer);
  const heuristic = heuristicStyle(stats);

  const status = await getOllamaStatus();
  let appliedStyle = heuristic;
  let styleReason = `Авто: ${STYLE_LABELS[heuristic]} (анализ цветов карточки)`;
  let compositionNotes = input.notes;
  let synonyms: string[] = [];

  if (!status.mockMode && status.available) {
    try {
      const styleResult = await detectStyleWithOllama(
        input.prompt,
        input.notes,
        stats,
        heuristic,
      );
      appliedStyle = styleResult.style;
      styleReason = styleResult.reason;
      if (styleResult.compositionNotes) {
        compositionNotes = input.notes
          ? `${input.notes}\n${styleResult.compositionNotes}`
          : styleResult.compositionNotes;
      }

      synonyms = await generateSynonymsWithOllama(input.prompt, compositionNotes, appliedStyle);
    } catch (error) {
      console.warn("Reference enrichment via Ollama failed:", error);
      synonyms = mockSynonyms(input.prompt);
    }
  } else {
    synonyms = mockSynonyms(input.prompt);
  }

  const promptTokens = input.prompt
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2);

  const tags = uniqueTerms(
    [
      appliedStyle,
      ...synonyms,
      ...promptTokens,
      ...(compositionNotes
        ? compositionNotes
            .toLowerCase()
            .split(/[^\p{L}\p{N}]+/u)
            .filter((w) => w.length > 2)
        : []),
    ],
    35,
  );

  return {
    appliedStyle,
    styleReason,
    synonyms: uniqueTerms(synonyms, 28),
    tags,
    compositionNotes,
    dominantColors: stats.dominantHex.slice(0, 5),
    layoutBlueprint: {
      layout: "marketplace",
      titleCase: true,
      subtitlePill: true,
      leftStatCards: true,
      rightVerticalBar: true,
      productDiagonal: true,
      dominantColors: stats.dominantHex.slice(0, 5),
    },
  };
}

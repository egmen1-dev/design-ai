import { infographicSdSchema, type InfographicSdInput } from "@/lib/validations";
import { getOllamaStatus, OLLAMA_BASE_URL, OLLAMA_MODEL } from "./ai-status";

export type InfographicSdData = InfographicSdInput;

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
  "backgroundPrompt": "professional marketplace product photo background, suburban garden with lush green grass, soft natural daylight, shallow depth of field, space in center for gasoline generator, photorealistic, 2025 ecommerce trend, high CTR, no text, no people, 8k"
}`;

export function generateMockSdData(prompt: string): InfographicSdData {
  const lower = prompt.toLowerCase();
  const isGenerator = /генератор|бензин|квт/.test(lower);

  return infographicSdSchema.parse({
    layout: "hero",
    title: isGenerator ? "ГЕНЕРАТОР" : "ТОВАР",
    subtitle: isGenerator ? "бензиновый" : "новинка",
    bullets: isGenerator
      ? ["3 кВт мощность", "15 литров бак", "3000 Вт стабильная мощность"]
      : ["Премиум качество", "Быстрая доставка", "Гарантия 12 месяцев"],
    colors: ["#e31e24", "#2563eb", "#0f172a"],
    badge: isGenerator ? "Kronwerk" : "Brand",
    backgroundPrompt: isGenerator
      ? "professional product photography background, suburban garden with green grass, soft daylight, center space for generator, photorealistic, marketplace infographic 2025, no text"
      : "clean studio product photography background, soft gradient, professional lighting, center space for product, photorealistic, ecommerce 2025, no text",
  });
}

async function callOllamaSd(prompt: string): Promise<InfographicSdData> {
  const systemPrompt = `Ты — арт-директор для Wildberries.

Для каждого товара придумай текст и стиль инфографики 1200×1200, а также промпт на АНГЛИЙСКОМ для Stable Diffusion — идеальный фотореалистичный фон.
Фон должен соответствовать трендам 2025, повышать кликабельность, передавать контекст использования товара.
В backgroundPrompt: только описание сцены на английском, без текста на изображении, без людей, с местом по центру для товара.

Верни ТОЛЬКО JSON:
{
  "layout": "hero" | "cards" | "split" | "minimal",
  "title": "одно слово КАПСОМ — тип товара",
  "subtitle": "короткий подтип строчными",
  "bullets": ["2-5 УТП с цифрами из описания"],
  "colors": ["#hex", "#hex", "#hex"],
  "badge": "бренд",
  "backgroundPrompt": "english prompt for SD XL, 10-200 chars, photorealistic scene"
}

Правила:
- Факты только из описания товара
- backgroundPrompt строго на английском
- colors: accent, secondary, dark tone

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
  return infographicSdSchema.parse(parsed);
}

export async function generateSdInfographicData(
  prompt: string,
): Promise<{ data: InfographicSdData; source: "ollama" | "mock" }> {
  const status = await getOllamaStatus();
  if (status.mockMode || !status.available) {
    return { data: generateMockSdData(prompt), source: "mock" };
  }
  try {
    return { data: await callOllamaSd(prompt), source: "ollama" };
  } catch (error) {
    console.warn("Ollama SD failed, mock fallback:", error);
    return { data: generateMockSdData(prompt), source: "mock" };
  }
}

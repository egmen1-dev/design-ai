import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ai-status";
import { OLLAMA_NUM_PREDICT, OLLAMA_TIMEOUT_MS } from "@/lib/pipeline-config";
import type { CardMeaning } from "@/lib/layout-engine/types";
import { buildSemanticMeaningPrompt } from "./semantic-meaning-prompt";
import type { CreativeDirectorResult } from "./creative-concept";
import type { DesignBrief } from "@/lib/design-brief/schema";

async function callOllamaCardMeaning(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.45, num_predict: Math.min(400, OLLAMA_NUM_PREDICT) },
    }),
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Ollama недоступна: ${response.status}`);
  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Пустой ответ от Ollama");
  return data.response;
}

function parseCardMeaning(raw: string): CardMeaning | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const p = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    if (!title) return null;
    return {
      title,
      subtitle: String(p.subtitle ?? "").trim(),
      feature: String(p.feature ?? "").trim(),
      badge: String(p.badge ?? "").trim(),
      emotion: String(p.emotion ?? "Надёжность").trim(),
      style: String(p.style ?? "Premium Lifestyle").trim(),
      priority: "product",
    };
  } catch {
    return null;
  }
}

/** Map winning creative concept → CardMeaning without extra LLM call. */
export function creativeConceptToCardMeaning(
  concept: CreativeDirectorResult,
  brief: DesignBrief,
): CardMeaning {
  const ot = concept.oneThought;
  const cc = concept.creativeConcept;
  const feature =
    ot.answer && ot.answerLabel ? `${ot.answer} ${ot.answerLabel}`.trim() : brief.bullets?.[0] ?? "";

  return {
    title: ot.headline || cc.whatToSayInOneSecond || cc.title || brief.headline || "Товар",
    subtitle: cc.mainIdea || brief.subtitle || "",
    feature,
    badge: ot.badge || "",
    emotion: cc.emotion || "Надёжность",
    style: cc.styleKeywords?.[0] || concept.archetypeId || "Premium Lifestyle",
    priority: "product",
  };
}

export async function generateCardMeaning(
  brief: DesignBrief,
  concept: CreativeDirectorResult,
): Promise<CardMeaning> {
  const prompt = `${buildSemanticMeaningPrompt(brief, concept)}

Система: ты копирайтер маркетплейса. Отвечай ТОЛЬКО валидным JSON CardMeaning. Без координат, размеров, процентов, layout.`;
  const raw = await callOllamaCardMeaning(prompt);

  const parsed = parseCardMeaning(raw);
  if (parsed) return parsed;
  return creativeConceptToCardMeaning(concept, brief);
}

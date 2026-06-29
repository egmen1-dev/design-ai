import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ai-status";
import { OLLAMA_NUM_PREDICT, OLLAMA_TIMEOUT_MS } from "@/lib/pipeline-config";

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ollama не вернула валидный JSON");
  }
  return text.slice(start, end + 1);
}

export async function callOllamaJson<T>(
  prompt: string,
  options?: { temperature?: number; numPredict?: number; timeoutMs?: number },
): Promise<T> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.28,
        num_predict: options?.numPredict ?? Math.min(900, OLLAMA_NUM_PREDICT),
      },
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? OLLAMA_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Ollama недоступна: ${response.status}`);

  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Пустой ответ от Ollama");

  return JSON.parse(extractJson(data.response)) as T;
}

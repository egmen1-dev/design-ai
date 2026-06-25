const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

export type OllamaStatus = {
  available: boolean;
  model: string;
  mockMode: boolean;
  models: string[];
  message: string;
};

export async function getOllamaStatus(): Promise<OllamaStatus> {
  const mockMode = process.env.AI_MOCK_MODE === "true";

  if (mockMode) {
    return {
      available: true,
      model: "mock (демо)",
      mockMode: true,
      models: [],
      message: "Демо-режим: Ollama не нужна, ответы генерируются локально",
    };
  }

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return {
        available: false,
        model: OLLAMA_MODEL,
        mockMode: false,
        models: [],
        message: "Ollama не отвечает. Запустите: ollama serve && ollama pull qwen2.5:7b",
      };
    }

    const data = (await res.json()) as {
      models?: { name: string }[];
    };
    const models = data.models?.map((m) => m.name) ?? [];
    const hasModel = models.some((m) => m.startsWith(OLLAMA_MODEL));

    return {
      available: hasModel,
      model: OLLAMA_MODEL,
      mockMode: false,
      models,
      message: hasModel
        ? `Модель ${OLLAMA_MODEL} готова к работе`
        : `Модель не найдена. Выполните: ollama pull ${OLLAMA_MODEL}`,
    };
  } catch {
    return {
      available: false,
      model: OLLAMA_MODEL,
      mockMode: false,
      models: [],
      message:
        "Ollama не запущена. Установите с https://ollama.com и выполните ollama pull qwen2.5:7b",
    };
  }
}

export { OLLAMA_BASE_URL, OLLAMA_MODEL };

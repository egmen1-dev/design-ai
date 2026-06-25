import { NextResponse } from "next/server";
import { getOllamaStatus } from "@/lib/ai-status";

export async function GET() {
  const status = await getOllamaStatus();

  return NextResponse.json({
    ...status,
    pipeline: [
      "1. Пользователь вводит описание товара",
      "2. Ollama (qwen2.5:7b) создаёт JSON-структуру",
      "3. Zod проверяет поля (title, bullets, цвета)",
      "4. HTML-шаблон собирает макет 1200×1200",
      "5. Puppeteer делает PNG + водяной знак",
    ],
  });
}

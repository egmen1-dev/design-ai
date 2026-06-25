import Link from "next/link";
import { getOllamaStatus } from "@/lib/ai-status";
import { FREE_DAILY_LIMIT, CREDIT_PACKAGE_AMOUNT, CREDIT_PACKAGE_PRICE_RUB } from "@/lib/pricing";

export default async function HowItWorksPage() {
  const ai = await getOllamaStatus();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-brand-500 hover:underline">
        ← На главную
      </Link>

      <h1 className="mt-6 text-4xl font-bold">Как работает AI</h1>
      <p className="mt-4 text-slate-400">
        Всё работает на вашем сервере. Никаких платных API вроде OpenAI или Yandex GPT.
      </p>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6 font-mono text-sm leading-relaxed text-slate-300">
        <pre className="whitespace-pre-wrap">{`
  Вы описываете товар
        │
        ▼
  ┌─────────────────┐
  │  Ollama (локально)│  ← qwen2.5:7b на VPS
  │  localhost:11434  │
  └────────┬────────┘
           │ JSON: title, subtitle, bullets...
           ▼
  ┌─────────────────┐
  │  Zod валидация   │  ← проверка структуры
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  HTML-шаблон     │  ← макет 1200×1200
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │  Puppeteer       │  ← PNG + водяной знак
  └────────┬────────┘
           ▼
     Готовая инфографика
`}</pre>
      </div>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">1. Ollama — мозг системы</h2>
          <p className="mt-2 text-slate-400">
            Модель <code className="text-brand-400">qwen2.5:7b</code> читает описание
            товара и возвращает структуру: заголовок, подзаголовок, список преимуществ,
            цветовую схему. Работает полностью локально на VPS — данные никуда не уходят.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Шаблон — предсказуемый дизайн</h2>
          <p className="mt-2 text-slate-400">
            AI не рисует картинку напрямую (это ненадёжно). Он заполняет JSON, а сайт
            собирает красивый макет по шаблону. Результат всегда читаемый и подходит
            для карточки маркетплейса.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Puppeteer — финальный PNG</h2>
          <p className="mt-2 text-slate-400">
            Headless Chrome открывает HTML и делает скриншот 1200×1200. Поверх
            накладывается водяной знак. Файл сохраняется в галерею пользователя.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Тарифы</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>Пробная версия: {FREE_DAILY_LIMIT} генераций в день бесплатно</li>
            <li>
              Пакет: {CREDIT_PACKAGE_AMOUNT} генераций за {CREDIT_PACKAGE_PRICE_RUB} ₽
              (Stripe — когда VPS будет готов)
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm font-medium">Статус AI сейчас</p>
          <p className="mt-1 text-sm text-slate-400">{ai.message}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Разработка без VPS</h2>
          <p className="mt-2 text-slate-400">
            Пока сервер не готов, включите демо-режим в{" "}
            <code className="text-brand-400">.env</code>:
          </p>
          <pre className="mt-3 rounded-lg bg-slate-950 p-4 text-sm text-green-400">
            AI_MOCK_MODE=true
          </pre>
          <p className="mt-2 text-sm text-slate-500">
            Генерация будет работать без Ollama — с демо-данными из вашего промпта.
          </p>
        </div>
      </section>
    </main>
  );
}

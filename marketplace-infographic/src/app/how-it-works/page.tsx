import Link from "next/link";

const steps = [
  {
    title: "1. Проверяем бриф",
    body: "API принимает короткое описание инфографики и валидирует его через Zod до запуска тяжёлых операций.",
  },
  {
    title: "2. Генерируем HTML через Ollama",
    body: "Сервер обращается к локальной модели qwen2.5:7b и получает самодостаточный HTML-макет 1200x1600.",
  },
  {
    title: "3. Рендерим через Puppeteer",
    body: "Puppeteer открывает HTML, делает PNG в высоком разрешении и добавляет настроенный водяной знак.",
  },
  {
    title: "4. Сохраняем и ограничиваем лимиты",
    body: "Prisma сохраняет запрос, HTML и путь к изображению, а in-memory limiter разделяет квоты Free и Pro без Redis.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/" className="text-sm text-brand-500 hover:underline">
        ← Назад
      </Link>

      <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
          Как это работает
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          От брифа до готовой инфографики
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Стек рассчитан на небольшой VPS: Next.js отвечает за UI и API,
          PostgreSQL хранит данные пользователей, Ollama работает локально, а
          PM2 держит приложение онлайн за Nginx.
        </p>
      </section>

      <section className="mt-10 grid gap-5">
        {steps.map((step) => (
          <article
            key={step.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <h2 className="text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-slate-400">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6">
        <h2 className="text-xl font-semibold">Локальный mock-режим</h2>
        <p className="mt-2 text-slate-300">
          Установите <code className="rounded bg-slate-950 px-2 py-1">AI_MOCK_MODE=true</code>{" "}
          когда нужно проверить интерфейс и рендеринг до установки или прогрева
          Ollama-модели.
        </p>
      </section>
    </main>
  );
}

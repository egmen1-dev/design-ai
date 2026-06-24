import Link from "next/link";
import { auth } from "@/lib/auth";
import { GenerateForm } from "@/components/GenerateForm";
import { SignInButton } from "@/components/SignInButton";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <header className="mb-16 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
            design-ai
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Инфографика для маркетплейсов
          </h1>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="text-sm text-slate-400 hover:text-white"
          >
            Как это работает
          </Link>
          <Link href="/pricing" className="text-sm text-slate-400 hover:text-white">
            Тарифы
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
            >
              Кабинет
            </Link>
          ) : (
            <SignInButton />
          )}
        </nav>
      </header>

      <section className="grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">
            AI-инфографика для карточек, витрин и отчётов
          </h2>
          <p className="mt-4 text-slate-400">
            Опишите товар, нишу или маркетплейс-аналитику — приложение
            соберёт готовую инфографику, отрендерит её через Puppeteer и
            добавит водяной знак. Генерация работает локально через Ollama
            qwen2.5:7b или через AI_MOCK_MODE.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-400">
            <li>• NextAuth и вход через GitHub</li>
            <li>• Stripe-подписки для Pro-тарифа</li>
            <li>• Rate-limit в памяти без Redis</li>
          </ul>
        </div>

        {session ? (
          <GenerateForm />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-slate-400">
              Войдите, чтобы создавать инфографику
            </p>
            <div className="mt-4">
              <SignInButton />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { GenerateForm } from "@/components/GenerateForm";
import { PromptHintsPreview } from "@/components/PromptHintsPreview";
import { AiStatusBanner } from "@/components/AiStatusBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FREE_DAILY_LIMIT } from "@/lib/pricing";

export default async function HomePage() {
  const session = await auth();
  const isAdmin = isAdminEmail(session?.user?.email);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <SiteHeader isAdmin={isAdmin} isLoggedIn={!!session} />

      <AiStatusBanner />

      <section className="grid flex-1 gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">
            AI-карточки товаров через Ollama
          </h2>
          <p className="mt-4 text-slate-400">
            Опишите товар — получите готовую инфографику 1200×1200 для Wildberries
            и Ozon. Локальная модель qwen2.5:7b, без платных API.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-400">
            <li>• Загрузите фото товара — встанет на слайд с фоном и УТП</li>
            <li>• JSON-структура → шаблон → PNG с водяным знаком</li>
            <li>• Превью WB / Ozon перед скачиванием</li>
            <li>• {FREE_DAILY_LIMIT} бесплатных генераций в день</li>
            <li>• Пакет 20 генераций за 500 ₽</li>
          </ul>
        </div>

        {session ? (
          <GenerateForm />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
            <p className="text-center text-slate-400">
              Войдите, чтобы генерировать инфографику
            </p>
            <PromptHintsPreview />
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/login"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
              >
                Вход
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
              >
                Регистрация
              </Link>
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

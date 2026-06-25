import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

type Props = {
  isAdmin?: boolean;
  isLoggedIn?: boolean;
};

export function SiteHeader({ isAdmin, isLoggedIn }: Props) {
  return (
    <header className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-sm font-medium uppercase tracking-widest text-brand-500">
          {SITE_NAME}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Инфографика для маркетплейсов
        </h1>
      </div>
      <nav className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Link href="/how-it-works" className="text-sm text-slate-400 hover:text-white">
          Как работает AI
        </Link>
        <Link href="/pricing" className="text-sm text-slate-400 hover:text-white">
          Тарифы
        </Link>
        {isAdmin && (
          <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
            Админ
          </Link>
        )}
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
          >
            Дашборд
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white">
              Вход
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
            >
              Регистрация
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

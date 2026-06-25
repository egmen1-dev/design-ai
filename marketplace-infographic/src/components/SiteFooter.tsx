import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800 pt-8 text-sm text-slate-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {SITE_NAME} — карточки для Wildberries и Ozon</p>
        <div className="flex gap-4">
          <Link href="/how-it-works" className="hover:text-slate-300">
            Как работает
          </Link>
          <Link href="/pricing" className="hover:text-slate-300">
            Тарифы
          </Link>
        </div>
      </div>
    </footer>
  );
}

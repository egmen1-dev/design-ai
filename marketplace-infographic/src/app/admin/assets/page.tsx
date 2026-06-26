import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AddBadgeForm,
  AddFontForm,
  BadgesList,
  FontsList,
} from "@/components/admin/AssetForms";
import { isAdminEmail } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { fontCategoryFromPrisma } from "@/lib/library-validations";
import { prisma } from "@/lib/prisma";

export default async function AdminAssetsPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const [fonts, badges] = await Promise.all([
    prisma.libraryFont.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.libraryBadge.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const fontRows = fonts.map((font) => ({
    id: font.id,
    name: font.name,
    cssImport: font.cssImport,
    fontFamily: font.fontFamily,
    category: fontCategoryFromPrisma(font.category),
    styleTags: font.styleTags,
    createdAt: font.createdAt.toISOString(),
  }));

  const badgeRows = badges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    htmlTemplate: badge.htmlTemplate,
    svgTemplate: badge.svgTemplate,
    pngUrl: badge.pngUrl,
    styleTags: badge.styleTags,
    createdAt: badge.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-500">Админ</p>
          <h1 className="text-3xl font-bold">Библиотека ассетов</h1>
          <p className="mt-1 text-sm text-slate-500">
            Шрифты и плашки для инфографики по стилям
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin" className="text-brand-500 hover:underline">
            Статистика
          </Link>
          <Link href="/admin/references" className="text-amber-400 hover:text-amber-300">
            Референсы
          </Link>
          <Link href="/" className="text-slate-400 hover:text-slate-300">
            На главную
          </Link>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Шрифты</h2>
          <FontsList fonts={fontRows} />
          <AddFontForm />
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Плашки</h2>
          <BadgesList badges={badgeRows} />
          <AddBadgeForm />
        </section>
      </div>
    </main>
  );
}

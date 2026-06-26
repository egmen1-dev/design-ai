import Link from "next/link";
import { redirect } from "next/navigation";
import { ReferenceUploadForm } from "@/components/admin/ReferenceUploadForm";
import { isAdminEmail } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminReferencesPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const references = await prisma.referenceImage.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-500">Админ</p>
          <h1 className="text-3xl font-bold">Референсы</h1>
          <p className="mt-1 text-sm text-slate-500">
            Загрузка Pinterest/WB-референсов: вырезка плашки и подсказка по шрифту
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/assets" className="text-brand-500 hover:underline">
            Библиотека
          </Link>
          <Link href="/admin" className="text-slate-400 hover:text-slate-300">
            Статистика
          </Link>
        </div>
      </header>

      <ReferenceUploadForm />

      {references.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Недавние референсы</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {references.map((reference) => (
              <li
                key={reference.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reference.originalUrl}
                  alt="Референс"
                  className="h-40 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-xs text-slate-500">
                    {reference.createdAt.toLocaleString("ru-RU")}
                  </p>
                  {reference.notes && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                      {reference.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

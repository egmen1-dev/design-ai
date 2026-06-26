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

  const examples = await prisma.designExample.findMany({
    where: { imageUrl: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const initialExamples = examples.map((example) => ({
    id: example.id,
    prompt: example.prompt,
    imageUrl: example.imageUrl!,
    notes: example.notes,
    appliedStyle: example.appliedStyle,
    tags: example.tags,
    createdAt: example.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-500">Админ</p>
          <h1 className="text-3xl font-bold">Референсы</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Загрузите карточки товаров — система сама определит стиль, сгенерирует синонимы и
            будет подбирать их при похожих запросах при генерации инфографики.
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

      <ReferenceUploadForm initialExamples={initialExamples} />
    </main>
  );
}

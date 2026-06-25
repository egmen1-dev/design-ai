import Link from "next/link";
import { redirect } from "next/navigation";
import { GeneratedImagePreview } from "@/components/GeneratedImagePreview";
import { auth } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isActiveSubscription } from "@/lib/stripe";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      generatedImages: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!user) redirect("/");

  const hasPro = isActiveSubscription(user.subscription?.status);
  const isAdmin = isAdminSession(session);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Кабинет</h1>
          <p className="mt-1 text-slate-400">
            {session.user.name ?? session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin" className="text-sm text-brand-500 hover:underline">
              Админка
            </Link>
          )}
          <Link href="/" className="text-sm text-brand-500 hover:underline">
            ← Назад
          </Link>
        </div>
      </header>

      {params.checkout === "success" && (
        <div className="mb-6 rounded-lg border border-green-800 bg-green-950/50 p-4 text-green-300">
          Подписка активирована. Спасибо!
        </div>
      )}

      <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <p className="text-sm text-slate-400">Тариф</p>
        <p className="mt-1 text-xl font-semibold">
          {hasPro ? "Pro" : "Free"}
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Кредиты: <span className="font-semibold text-slate-200">{user.credits}</span>
        </p>
        {!hasPro && (
          <Link
            href="/pricing"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
          >
            Перейти на Pro
          </Link>
        )}
      </div>

      <h2 className="mb-4 text-xl font-semibold">Готовая инфографика</h2>
      {user.generatedImages.length === 0 ? (
        <p className="text-slate-400">
          Пока нет изображений. Создайте первую инфографику на главной странице.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {user.generatedImages.map((img) => (
            <article
              key={img.id}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50"
            >
              <GeneratedImagePreview
                src={img.imagePath}
                alt={img.prompt.slice(0, 80)}
                className="w-full object-cover"
              />
              <p className="p-4 text-sm text-slate-400 line-clamp-2">{img.prompt}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

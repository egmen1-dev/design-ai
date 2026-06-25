import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserBalance } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { FREE_DAILY_LIMIT } from "@/lib/pricing";
import { ImageGalleryCard } from "@/components/ImageGalleryCard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const [user, balance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        generatedImages: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    getUserBalance(session.user.id),
  ]);

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Дашборд</h1>
          <p className="mt-1 text-slate-400">
            {session.user.name ?? session.user.email}
          </p>
        </div>
        <Link href="/" className="text-sm text-brand-500 hover:underline">
          ← На главную
        </Link>
      </header>

      {params.checkout === "success" && (
        <div className="mb-6 rounded-lg border border-green-800 bg-green-950/50 p-4 text-green-300">
          Оплата прошла успешно! Кредиты зачислены на баланс.
        </div>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-400">Бесплатно сегодня</p>
          <p className="mt-1 text-2xl font-semibold">
            {balance.unlimited ? "∞" : `${balance.freeRemaining} / ${FREE_DAILY_LIMIT}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {balance.unlimited ? "Админ: безлимитные генерации" : "Сброс в полночь"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-400">Купленные генерации</p>
          <p className="mt-1 text-2xl font-semibold">
            {balance.unlimited ? "—" : balance.credits}
          </p>
          {!balance.unlimited && balance.credits === 0 && (
            <Link
              href="/pricing"
              className="mt-3 inline-block text-sm text-brand-500 hover:underline"
            >
              Купить 20 за 500 ₽ →
            </Link>
          )}
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Галерея</h2>
      {user.generatedImages.length === 0 ? (
        <p className="text-slate-400">
          Пока нет изображений. Создайте на главной странице.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {user.generatedImages.map((img) => (
            <ImageGalleryCard
              key={img.id}
              id={img.id}
              prompt={img.prompt}
              imagePath={img.imagePath}
              showPreview
            />
          ))}
        </div>
      )}
    </main>
  );
}

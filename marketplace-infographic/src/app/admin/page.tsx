import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCreditGrantForm } from "@/components/AdminCreditGrantForm";
import { auth } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!isAdminSession(session)) redirect("/dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    usersCount,
    generatedImagesCount,
    generatedTodayCount,
    trainingSamplesCount,
    creditPurchasesCount,
    creditsSum,
    recentImages,
    recentPurchases,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.generatedImage.count(),
    prisma.generatedImage.count({ where: { createdAt: { gte: today } } }),
    prisma.trainingSample.count(),
    prisma.creditPurchase.count(),
    prisma.creditPurchase.aggregate({ _sum: { credits: true } }),
    prisma.generatedImage.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        prompt: true,
        imagePath: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.creditPurchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        credits: true,
        provider: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Пользователи", value: usersCount },
    { label: "Всего генераций", value: generatedImagesCount },
    { label: "Генераций сегодня", value: generatedTodayCount },
    { label: "Training samples", value: trainingSamplesCount },
    { label: "Операций кредитов", value: creditPurchasesCount },
    { label: "Кредитов начислено", value: creditsSum._sum.credits ?? 0 },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-bold">Админка</h1>
          <p className="mt-2 text-slate-400">{session.user.email}</p>
        </div>
        <Link href="/dashboard" className="text-sm text-brand-500 hover:underline">
          ← В кабинет
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <AdminCreditGrantForm />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold">Последние генерации</h2>
          <div className="mt-5 space-y-4">
            {recentImages.map((image) => (
              <article key={image.id} className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.imagePath}
                  alt={image.prompt.slice(0, 60)}
                  className="h-20 w-16 rounded border border-slate-800 object-cover"
                />
                <div>
                  <p className="line-clamp-2 text-sm text-slate-200">
                    {image.prompt}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {image.user.email ?? "no-email"} ·{" "}
                    {image.createdAt.toLocaleString("ru-RU")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold">Последние кредиты</h2>
          <div className="mt-5 space-y-3">
            {recentPurchases.map((purchase) => (
              <article
                key={purchase.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">+{purchase.credits}</p>
                  <p className="text-xs uppercase text-slate-500">
                    {purchase.status}
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {purchase.user?.email ?? "без пользователя"} · {purchase.provider}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {purchase.createdAt.toLocaleString("ru-RU")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

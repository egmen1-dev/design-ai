import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  adminActivityFilter,
  adminPurchaseFilter,
  adminUserFilter,
  getAdminEmails,
  isAdminEmail,
} from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const adminUsers = await prisma.user.findMany({
    where: { email: { in: getAdminEmails() } },
    select: { id: true },
  });
  const adminUserIds = adminUsers.map((u) => u.id);
  const activityFilter = adminActivityFilter(adminUserIds);
  const purchaseFilter = adminPurchaseFilter(adminUserIds);

  const [
    totalUsers,
    totalImages,
    imagesToday,
    creditPurchases,
    totalCreditsSold,
    recentImages,
    topUsers,
  ] = await Promise.all([
    prisma.user.count({ where: adminUserFilter() }),
    prisma.generatedImage.count({ where: activityFilter }),
    prisma.generatedImage.count({
      where: { ...activityFilter, createdAt: { gte: today } },
    }),
    prisma.creditPurchase.count({ where: purchaseFilter }),
    prisma.creditPurchase.aggregate({
      where: purchaseFilter,
      _sum: { credits: true },
    }),
    prisma.generatedImage.findMany({
      where: activityFilter,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.generatedImage.groupBy({
      by: ["userId"],
      where: activityFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const topUserIds = topUsers.map((u) => u.userId);
  const topUserDetails = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(topUserDetails.map((u) => [u.id, u]));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">Админ</p>
          <h1 className="text-3xl font-bold">Статистика</h1>
          <p className="mt-1 text-sm text-slate-500">
            Только реальные пользователи — ваши тестовые генерации скрыты
          </p>
        </div>
        <Link href="/" className="text-sm text-brand-500 hover:underline">
          ← На главную
        </Link>
      </header>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Пользователей", value: totalUsers },
          { label: "Всего генераций", value: totalImages },
          { label: "Сегодня", value: imagesToday },
          { label: "Продано пакетов", value: creditPurchases },
          { label: "Кредитов выдано", value: totalCreditsSold._sum.credits ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Последние генерации</h2>
          {recentImages.length === 0 ? (
            <p className="text-sm text-slate-500">Пока нет генераций от пользователей</p>
          ) : (
            <div className="space-y-3">
              {recentImages.map((img) => (
                <div
                  key={img.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                >
                  <p className="text-sm font-medium">
                    {img.user.name ?? img.user.email}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                    {img.prompt}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {img.createdAt.toLocaleString("ru-RU")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Топ пользователей</h2>
          {topUsers.length === 0 ? (
            <p className="text-sm text-slate-500">Пока нет активности</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((entry, i) => {
                const user = userMap.get(entry.userId);
                return (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                  >
                    <div>
                      <span className="mr-2 text-slate-500">#{i + 1}</span>
                      <span className="text-sm">
                        {user?.name ?? user?.email ?? entry.userId}
                      </span>
                    </div>
                    <span className="rounded-full bg-brand-600/20 px-3 py-1 text-sm text-brand-400">
                      {entry._count.id}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

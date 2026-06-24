import Link from "next/link";
import { PricingCard } from "@/components/PricingCard";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12 text-center">
        <Link href="/" className="text-sm text-brand-500 hover:underline">
          ← Назад
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Тарифы</h1>
        <p className="mt-2 text-slate-400">
          Free для проверки идеи, Pro для регулярной генерации
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <PricingCard
          name="Free"
          price="$0"
          features={[
            "3 генерации в день",
            "Экспорт с водяным знаком",
            "Вход через GitHub",
          ]}
          cta="Текущий тариф"
          disabled
        />
        <PricingCard
          name="Pro"
          price="$9/mo"
          features={[
            "30 генераций в день",
            "Экспорт с водяным знаком",
            "Приоритетный рендеринг",
          ]}
          cta="Подключить через Stripe"
          checkout
          highlighted
        />
      </div>
    </main>
  );
}

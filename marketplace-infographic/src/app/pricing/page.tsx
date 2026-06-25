import Link from "next/link";
import { PricingCard } from "@/components/PricingCard";
import {
  CREDIT_PACKAGE_AMOUNT,
  CREDIT_PACKAGE_PRICE_RUB,
  FREE_DAILY_LIMIT,
} from "@/lib/pricing";
import { isStripeConfigured, PAYMENTS_UNAVAILABLE_MESSAGE } from "@/lib/payments";

export default function PricingPage() {
  const paymentsReady = isStripeConfigured();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12 text-center">
        <Link href="/" className="text-sm text-brand-500 hover:underline">
          ← На главную
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Тарифы</h1>
        <p className="mt-2 text-slate-400">
          Пробная версия бесплатно, пакет генераций — разовая оплата
        </p>
      </header>

      {!paymentsReady && (
        <div className="mb-8 rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {PAYMENTS_UNAVAILABLE_MESSAGE}. Пока доступны {FREE_DAILY_LIMIT} бесплатных
          генераций в день.
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <PricingCard
          name="Пробная"
          price="0 ₽"
          features={[
            `${FREE_DAILY_LIMIT} генераций в день`,
            "Водяной знак на изображениях",
            "Email или GitHub вход",
            "Сброс лимита в полночь",
          ]}
          cta="Текущий тариф"
          disabled
        />
        <PricingCard
          name="Пакет генераций"
          price={`${CREDIT_PACKAGE_PRICE_RUB} ₽`}
          features={[
            `${CREDIT_PACKAGE_AMOUNT} генераций`,
            "Разовая оплата, без подписки",
            "Кредиты не сгорают",
            "Используются после дневного лимита",
            "Водяной знак на изображениях",
          ]}
          cta={
            paymentsReady
              ? `Купить ${CREDIT_PACKAGE_AMOUNT} генераций`
              : "Скоро — после запуска сайта"
          }
          checkout={paymentsReady}
          disabled={!paymentsReady}
          highlighted
        />
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Сначала тратятся бесплатные {FREE_DAILY_LIMIT} генераций в день, затем — купленные
        кредиты.
      </p>
    </main>
  );
}

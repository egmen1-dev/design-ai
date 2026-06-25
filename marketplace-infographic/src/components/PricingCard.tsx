"use client";

import { useState } from "react";

type Props = {
  name: string;
  price: string;
  features: string[];
  cta: string;
  checkout?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
};

export function PricingCard({
  name,
  price,
  features,
  cta,
  checkout,
  disabled,
  highlighted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Не удалось открыть оплату");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border p-8 ${
        highlighted
          ? "border-brand-500 bg-brand-500/10"
          : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 text-3xl font-bold">{price}</p>
      <ul className="mt-6 space-y-2 text-sm text-slate-400">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      {checkout ? (
        <>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || disabled}
            className="mt-8 w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Перенаправление..." : cta}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </>
      ) : (
        <button
          type="button"
          disabled={disabled}
          className="mt-8 w-full rounded-lg border border-slate-700 py-3 text-sm font-medium text-slate-500 disabled:cursor-not-allowed"
        >
          {cta}
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

export function GenerateForm() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imagePath: string; remaining: number } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сгенерировать инфографику");
        return;
      }

      setResult({ imagePath: data.imagePath, remaining: data.remaining });
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
    >
      <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
        Опишите инфографику
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        required
        minLength={10}
        maxLength={2000}
        placeholder="Например: инфографика для карточки товара на Ozon с преимуществами, цифрами и CTA..."
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading || prompt.length < 10}
        className="mt-4 w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Генерируем..." : "Создать инфографику"}
      </button>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-slate-400">
            Осталось генераций сегодня: {result.remaining}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.imagePath}
            alt="Сгенерированная инфографика"
            className="w-full rounded-lg border border-slate-700"
          />
        </div>
      )}
    </form>
  );
}

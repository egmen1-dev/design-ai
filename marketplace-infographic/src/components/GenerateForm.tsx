"use client";

import { useState } from "react";
import { ApprovalButton } from "./ApprovalButton";
import { GeneratedImagePreview } from "./GeneratedImagePreview";
import { STYLE_KEYS, type InfographicStyle } from "@/lib/design-trends";
import type { InfographicResult } from "@/lib/validations";

export function GenerateForm() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<InfographicStyle>("modern");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imageUrl: string;
    generatedJson: InfographicResult;
    appliedStyle: InfographicStyle;
    remaining: number;
    credits: number;
    prompt: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-infographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сгенерировать инфографику");
        return;
      }

      setResult({
        imageUrl: data.imageUrl ?? data.imagePath,
        generatedJson: data.generatedJson,
        appliedStyle: data.appliedStyle,
        remaining: data.remaining,
        credits: data.credits,
        prompt,
      });
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
      <label htmlFor="style" className="mt-4 block text-sm font-medium text-slate-300">
        Стиль дизайна
      </label>
      <select
        id="style"
        value={style}
        onChange={(e) => setStyle(e.target.value as InfographicStyle)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
      >
        {STYLE_KEYS.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Осталось генераций сегодня: {result.remaining}. Стиль:{" "}
              {result.appliedStyle}. Кредиты: {result.credits}
            </p>
            <ApprovalButton
              prompt={result.prompt}
              generatedJson={result.generatedJson}
            />
          </div>
          <GeneratedImagePreview
            src={result.imageUrl}
            alt="Сгенерированная инфографика"
            className="w-full rounded-lg border border-slate-700"
          />
        </div>
      )}
    </form>
  );
}

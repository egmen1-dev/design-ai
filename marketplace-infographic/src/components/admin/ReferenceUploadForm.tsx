"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STYLE_KEYS, STYLE_LABELS } from "@/lib/design-trends";
import type { FontCategoryApi } from "@/lib/library-validations";
import { suggestGoogleFontCss } from "@/lib/google-font-suggest";

const FONT_CATEGORIES: FontCategoryApi[] = [
  "sans-serif",
  "serif",
  "display",
  "monospace",
];

type AnalyzeResult = {
  referenceId: string;
  originalUrl: string;
  badgeDraft: {
    id: string;
    pngUrl: string;
    svgUrl: string;
    htmlTemplate: string;
    svgTemplate: string;
  };
  fontSuggestion: {
    text: string;
    fontName: string | null;
  };
};

function StyleTagPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter((item) => item !== tag)
        : [...selected, tag],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_KEYS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`rounded-full px-3 py-1 text-xs ${
            selected.includes(tag)
              ? "bg-brand-600 text-white"
              : "border border-slate-700 text-slate-400 hover:border-brand-500"
          }`}
        >
          {STYLE_LABELS[tag]}
        </button>
      ))}
    </div>
  );
}

export function ReferenceUploadForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [badgeName, setBadgeName] = useState("Плашка из референса");
  const [badgeStyleTags, setBadgeStyleTags] = useState<string[]>(["modern"]);
  const [fontName, setFontName] = useState("");
  const [fontCategory, setFontCategory] = useState<FontCategoryApi>("sans-serif");
  const [fontStyleTags, setFontStyleTags] = useState<string[]>(["modern"]);
  const [savingBadge, setSavingBadge] = useState(false);
  const [savingFont, setSavingFont] = useState(false);
  const router = useRouter();

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 150_000);

    try {
      const response = await fetch("/api/admin/references/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      let data: AnalyzeResult & { error?: string };
      try {
        data = (await response.json()) as AnalyzeResult & { error?: string };
      } catch {
        setError(
          response.status >= 500
            ? "Сервер перезагрузился во время анализа. Попробуйте снова."
            : "Неожиданный ответ сервера",
        );
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Ошибка анализа");
        return;
      }

      setResult(data);
      setBadgeName("Плашка из референса");
      setFontName(data.fontSuggestion.fontName ?? "");
      setFontCategory("sans-serif");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("Анализ занял слишком много времени. Попробуйте снова или уменьшите изображение.");
        return;
      }
      setError("Не удалось связаться с сервером");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function handleAddBadge() {
    if (!result) return;
    setSavingBadge(true);
    try {
      const response = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: badgeName,
          htmlTemplate: result.badgeDraft.htmlTemplate,
          svgTemplate: result.badgeDraft.svgTemplate,
          pngUrl: result.badgeDraft.pngUrl,
          styleTags: badgeStyleTags,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        alert(data.error ?? "Не удалось сохранить плашку");
        return;
      }

      await fetch(`/api/admin/badges/${result.badgeDraft.id}`, {
        method: "DELETE",
      });

      router.refresh();
      alert("Плашка добавлена в библиотеку");
    } finally {
      setSavingBadge(false);
    }
  }

  async function handleAddFont() {
    if (!result) return;
    const resolvedName = fontName.trim() || "Шрифт из референса";
    const google = suggestGoogleFontCss(resolvedName);

    setSavingFont(true);
    try {
      const response = await fetch("/api/admin/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resolvedName,
          cssImport: google.cssImport,
          fontFamily: google.fontFamily,
          category: fontCategory,
          styleTags: fontStyleTags,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        alert(data.error ?? "Не удалось сохранить шрифт");
        return;
      }

      router.refresh();
      alert("Шрифт добавлен в библиотеку");
    } finally {
      setSavingFont(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleAnalyze}
        className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5"
      >
        <h2 className="text-lg font-semibold">Загрузить референс</h2>
        <label className="block text-sm">
          <span className="text-slate-400">Изображение (PNG, JPEG, WebP)</span>
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="mt-1 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Заметки (опционально)</span>
          <textarea
            name="notes"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Откуда референс, для какого стиля..."
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? "Анализ…" : "Анализировать"}
        </button>
      </form>

      {result && (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="font-semibold">Плашка</h3>
            <p className="mb-2 text-xs text-slate-500">
              Лучше загружать крупный кадр плашки/бейджа на прозрачном или однотонном фоне.
              На полной карточке товара вырезка и OCR будут неточными.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                <p className="mb-2 text-xs text-slate-500">PNG (без фона)</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.badgeDraft.pngUrl}
                  alt="Вырезанная плашка"
                  className="mx-auto max-h-48 object-contain"
                />
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                <p className="mb-2 text-xs text-slate-500">SVG (potrace)</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.badgeDraft.svgUrl}
                  alt="SVG плашки"
                  className="mx-auto max-h-48 object-contain"
                />
              </div>
            </div>
            <label className="block text-sm">
              <span className="text-slate-400">Название</span>
              <input
                value={badgeName}
                onChange={(event) => setBadgeName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </label>
            <div>
              <p className="mb-2 text-sm text-slate-400">Стили</p>
              <StyleTagPicker selected={badgeStyleTags} onChange={setBadgeStyleTags} />
            </div>
            <button
              type="button"
              onClick={handleAddBadge}
              disabled={savingBadge || badgeStyleTags.length === 0}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {savingBadge ? "Сохранение…" : "Добавить плашку"}
            </button>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="font-semibold">Шрифт</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm">
              <p className="text-slate-400">Распознанный текст (Tesseract)</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-200">
                {result.fontSuggestion.text || "—"}
              </p>
              {result.fontSuggestion.fontName && (
                <p className="mt-3 text-xs text-brand-400">
                  WhatTheFont: {result.fontSuggestion.fontName}
                </p>
              )}
            </div>
            <label className="block text-sm">
              <span className="text-slate-400">Название шрифта</span>
              <input
                value={fontName}
                onChange={(event) => setFontName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                placeholder="Inter"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Категория</span>
              <select
                value={fontCategory}
                onChange={(event) =>
                  setFontCategory(event.target.value as FontCategoryApi)
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                {FONT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="mb-2 text-sm text-slate-400">Стили</p>
              <StyleTagPicker selected={fontStyleTags} onChange={setFontStyleTags} />
            </div>
            <button
              type="button"
              onClick={handleAddFont}
              disabled={savingFont || fontStyleTags.length === 0}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {savingFont ? "Сохранение…" : "Добавить шрифт"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

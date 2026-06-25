"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { MarketplacePreview } from "@/components/MarketplacePreview";
import { PromptHints } from "@/components/PromptHints";
import {
  DEFAULT_STYLE,
  STYLE_KEYS,
  STYLE_LABELS,
  TRENDS,
  type InfographicStyle,
} from "@/lib/design-trends";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const TEMPLATES = [
  {
    label: "Генератор",
    prompt:
      "Бензиновый генератор Kronwerk 3 кВт, бак 15 литров, расход 1,25 л/час, низкий уровень шума 65 дБ. Защита от перегрузки и короткого замыкания. Автоматическое отключение при низком уровне масла.",
  },
  {
    label: "Косметика",
    prompt:
      "Увлажняющий крем для лица с гиалуроновой кислотой и витамином E. Подходит для чувствительной кожи, SPF 30, объём 50 мл.",
  },
  {
    label: "Электроника",
    prompt:
      "Беспроводные наушники TWS с активным шумоподавлением, 30 часов автономности, Bluetooth 5.3, влагозащита IPX5.",
  },
  {
    label: "Одежда",
    prompt:
      "Мужская зимняя куртка из мембранной ткани, утеплитель 200г, капюшон, 6 карманов, размеры S-XXL.",
  },
  {
    label: "Для дома",
    prompt:
      "Робот-пылесос с лазерной навигацией, всасывание 5000 Па, влажная уборка, управление через приложение.",
  },
];

const GENERATION_STEPS = [
  "AI анализирует описание товара",
  "Придумываем промпт фона (Ollama)",
  "Генерируем фотореалистичный фон (Stable Diffusion)",
  "Вырезаем фон у фото товара",
  "Собираем инфографику 1200×1200",
];

export function GenerateForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<InfographicStyle>(DEFAULT_STYLE);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productFileName, setProductFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    imagePath: string;
    freeRemaining: number;
    credits: number;
    unlimited?: boolean;
    aiSource?: string;
    appliedStyle?: InfographicStyle;
    backgroundSource?: "sd" | "fallback";
    pipelineVersion?: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !regenLoading) {
      setStepIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setStepIndex((current) =>
        current < GENERATION_STEPS.length - 1 ? current + 1 : current,
      );
    }, 1800);

    return () => clearInterval(timer);
  }, [loading, regenLoading]);

  async function handleApiError(res: Response, data: { error?: string }) {
    if (res.status === 402) {
      setError(
        "Лимит исчерпан. Бесплатно — 5 в день. Купите пакет 20 генераций за 500 ₽ на странице «Тарифы».",
      );
      return;
    }
    setError(data.error ?? "Ошибка генерации");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productImage) {
      setError("Загрузите фото товара — без него инфографика не соберётся");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-infographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          productImage,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        id?: string;
        imagePath?: string;
        freeRemaining: number;
        credits: number;
        unlimited?: boolean;
        aiSource?: string;
        appliedStyle?: InfographicStyle;
        backgroundSource?: "sd" | "fallback";
        pipelineVersion?: string;
      };

      if (!res.ok) {
        await handleApiError(res, data);
        return;
      }

      setResult({
        id: data.id!,
        imagePath: data.imagePath!,
        freeRemaining: data.freeRemaining ?? 0,
        credits: data.credits ?? 0,
        unlimited: data.unlimited,
        aiSource: data.aiSource,
        appliedStyle: data.appliedStyle ?? style,
        backgroundSource: data.backgroundSource,
        pipelineVersion: data.pipelineVersion,
      });
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateBackground() {
    if (!result?.id) return;

    if (!productImage) {
      setError(
        "Загрузите фото товара — без него перегенерация фона невозможна",
      );
      return;
    }

    setRegenLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/regenerate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: result.id,
          style,
          productImage,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        imagePath?: string;
        freeRemaining: number;
        credits: number;
        appliedStyle?: InfographicStyle;
        backgroundSource?: "sd" | "fallback";
        pipelineVersion?: string;
      };

      if (!res.ok) {
        await handleApiError(res, data);
        return;
      }

      setResult((prev) =>
        prev
          ? {
              ...prev,
              imagePath: data.imagePath ?? prev.imagePath,
              freeRemaining: data.freeRemaining ?? prev.freeRemaining,
              credits: data.credits ?? prev.credits,
              backgroundSource: data.backgroundSource ?? prev.backgroundSource,
              appliedStyle: data.appliedStyle ?? style,
              pipelineVersion: data.pipelineVersion ?? prev.pipelineVersion,
            }
          : prev,
      );
    } catch {
      setError("Ошибка сети");
    } finally {
      setRegenLoading(false);
    }
  }

  function clearProductImage() {
    setProductImage(null);
    setProductFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Формат: JPG, PNG или WebP");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Фото до 4 МБ");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setProductImage(reader.result as string);
      setProductFileName(file.name);
    };
    reader.onerror = () => setError("Не удалось прочитать файл");
    reader.readAsDataURL(file);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
    >
      <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
        Опишите товар для инфографики
      </label>
      <p className="mt-1 text-xs text-slate-500">
        AI возьмёт из текста название, цифры и УТП, придумает фон для Stable Diffusion
        и соберёт слайд 1200×1200
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setPrompt(t.prompt)}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-brand-500 hover:text-brand-400"
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        required
        minLength={10}
        maxLength={2000}
        placeholder="Бренд и модель. 2 цифры (объём, мощность…). Главная выгода. 2–3 функции через запятую."
        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
      />

      <PromptHints prompt={prompt} onInsert={setPrompt} />

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-300">Стиль дизайна</p>
        <p className="mt-1 text-xs text-slate-500">
          Влияет на фон, шрифты, блоки УТП и общее настроение слайда
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STYLE_KEYS.map((key) => {
            const trend = TRENDS[key];
            const selected = style === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStyle(key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                  selected
                    ? "border-brand-500 bg-brand-600/10 text-brand-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-white/20"
                  style={{ background: trend.accent }}
                  aria-hidden
                />
                <span className="font-medium">{STYLE_LABELS[key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-300">
              Фото товара <span className="text-red-400">*</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Обязательно. Фон автоматически вырежется (imgly), товар встанет на
              сгенерированный Stable Diffusion фон. Лучше JPG/PNG на белом или однотонном фоне.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-brand-500"
            >
              {productImage ? "Заменить" : "Загрузить"}
            </button>
            {productImage && (
              <button
                type="button"
                onClick={clearProductImage}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-red-400"
              >
                Убрать
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
          required
        />

        {productImage && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImage}
              alt="Превью товара"
              className="h-20 w-20 rounded-lg border border-slate-700 object-contain bg-white"
            />
            <p className="text-xs text-slate-400">{productFileName}</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || regenLoading || prompt.length < 10 || !productImage}
        className="mt-4 w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Генерация..." : "Сгенерировать инфографику"}
      </button>

      {(loading || regenLoading) && (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-3">
          <p className="text-sm text-brand-400">{GENERATION_STEPS[stepIndex]}</p>
          <div className="mt-2 flex gap-1">
            {GENERATION_STEPS.map((_, index) => (
              <span
                key={GENERATION_STEPS[index]}
                className={`h-1 flex-1 rounded-full ${
                  index <= stepIndex ? "bg-brand-500" : "bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-400">
              {result.unlimited ? (
                <span>Безлимит · Админ</span>
              ) : (
                <>
                  Бесплатно сегодня: {result.freeRemaining} · Кредиты: {result.credits}
                </>
              )}
              {result.aiSource === "mock" && (
                <span className="ml-2 text-amber-400">· демо-режим</span>
              )}
              {result.backgroundSource === "fallback" && (
                <span className="ml-2 text-amber-400">· градиент вместо SD</span>
              )}
              {result.appliedStyle && (
                <span className="ml-2 text-slate-500">
                  · стиль: {STYLE_LABELS[result.appliedStyle]}
                </span>
              )}
              {result.pipelineVersion && (
                <span className="ml-2 text-emerald-500">
                  · {result.pipelineVersion}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRegenerateBackground}
                disabled={loading || regenLoading || !productImage}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {regenLoading ? "Перегенерация..." : "Перегенерировать фон"}
              </button>
              <DownloadButton imageId={result.id} />
            </div>
          </div>
          <MarketplacePreview imagePath={result.imagePath} />
        </div>
      )}
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { MarketplacePreview } from "@/components/MarketplacePreview";
import { PromptHints } from "@/components/PromptHints";

import { COVER_CONCEPTS, type CoverConceptId } from "@/lib/cover-concepts";
import { ART_DIRECTOR_MODES, type ArtDirectorModeId } from "@/lib/design-process/art-director-modes";

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
  "Анализ товара",
  "Генерация 8 концепций",
  "Оценка и выбор лучшей",
  "Scene Planner + композиция",
  "Stable Diffusion + композитинг",
  "Финальная проверка и рендер",
];

const HOOK_LABELS: Record<string, string> = {
  oversized_product: "Крупный товар",
  premium_badge: "Премиальная плашка",
  emotional_background: "Эмоциональный фон",
  dynamic_diagonal: "Динамичная диагональ",
  spec_highlight: "Акцент на характеристиках",
  luxury_minimal: "Люкс-минимализм",
  lifestyle_scene: "Lifestyle-сцена",
  tech_showcase: "Техно-витрина",
  gift_bundle: "Подарочный комплект",
  contrast_pop: "Контрастный акцент",
  editorial_typography: "Редакционная типографика",
  power_number: "Сильная цифра",
};

function hookLabel(type: string): string {
  return HOOK_LABELS[type] ?? type.replace(/_/g, " ");
}

export function GenerateForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productFileName, setProductFileName] = useState<string | null>(null);
  const [coverConcept, setCoverConcept] = useState<CoverConceptId | "auto">("auto");
  const [artDirectorMode, setArtDirectorMode] = useState<ArtDirectorModeId>("marketplace_ctr");
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    imagePath: string;
    freeRemaining: number;
    credits: number;
    unlimited?: boolean;
    aiSource?: string;
    designConcept?: string;
    creativeMainIdea?: string;
    oneThoughtHeadline?: string;
    visualHook?: { type: string; reason: string; confidence?: number };
    backgroundSource?: "sd" | "fallback";
    selectedArchetypeId?: string;
    conceptCandidates?: number;
    pipelineVersion?: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !regenLoading) {
      setStepIndex(0);
      setElapsedSec(0);
      return;
    }

    const startedAt = Date.now();
    const stepTimer = setInterval(() => {
      setStepIndex((current) =>
        current < GENERATION_STEPS.length - 1 ? current + 1 : current,
      );
    }, 2800);

    const clockTimer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(clockTimer);
    };
  }, [loading, regenLoading]);

  function formatElapsed(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleApiError(res: Response, data: { error?: string }) {
    if (res.status === 402) {
      setError(
        "Лимит исчерпан. Бесплатно — 5 в день. Купите пакет 20 генераций за 500 ₽ на странице «Тарифы».",
      );
      return;
    }
    setError(data.error ?? "Ошибка генерации");
  }

  function networkErrorMessage(err: unknown): string {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "Превышено время ожидания (12 мин). Попробуйте ещё раз или упростите описание.";
    }
    if (err instanceof TypeError) {
      return "Соединение прервано. Сервер ещё может дорабатывать картинку — подождите 30 сек и обновите страницу «Мои генерации», либо попробуйте снова.";
    }
    return "Ошибка сети. Попробуйте ещё раз через минуту.";
  }

  async function parseJsonResponse<T>(res: Response): Promise<T | null> {
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 720_000);

      const res = await fetch("/api/generate-infographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          productImage,
          ...(coverConcept !== "auto" ? { coverConcept } : {}),
          artDirectorMode,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      const data = await parseJsonResponse<{
        error?: string;
        id?: string;
        imagePath?: string;
        freeRemaining: number;
        credits: number;
        unlimited?: boolean;
        aiSource?: string;
        designConcept?: string;
        creativeMainIdea?: string;
        oneThoughtHeadline?: string;
        selectedArchetypeId?: string;
        conceptCandidates?: number;
        visualHook?: { type: string; reason: string; confidence?: number };
        backgroundSource?: "sd" | "fallback";
        pipelineVersion?: string;
      }>(res);

      if (!data) {
        if (res.status === 502 || res.status === 503) {
          setError(
            "Сервер перезапустился во время генерации (ошибка 502). Попробуйте ещё раз — мы уже отключили нестабильную вырезку фона.",
          );
        } else if (res.status >= 500) {
          setError(
            "Внутренняя ошибка сервера. Попробуйте ещё раз через 30 секунд.",
          );
        } else {
          setError("Пустой ответ сервера");
        }
        return;
      }

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
        designConcept: data.designConcept,
        creativeMainIdea: data.creativeMainIdea,
        oneThoughtHeadline: data.oneThoughtHeadline,
        visualHook: data.visualHook,
        backgroundSource: data.backgroundSource,
        pipelineVersion: data.pipelineVersion,
        selectedArchetypeId: data.selectedArchetypeId,
        conceptCandidates: data.conceptCandidates,
      });
    } catch (err) {
      setError(networkErrorMessage(err));
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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 720_000);

      const res = await fetch("/api/regenerate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: result.id,
          productImage,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      const data = await parseJsonResponse<{
        error?: string;
        imagePath?: string;
        freeRemaining: number;
        credits: number;
        designConcept?: string;
        visualHook?: { type: string; reason: string };
        backgroundSource?: "sd" | "fallback";
        pipelineVersion?: string;
      }>(res);

      if (!data) {
        if (res.status === 502 || res.status === 503) {
          setError("Сервер перезапустился (502). Попробуйте перегенерацию ещё раз.");
        } else {
          setError("Сервер не успел ответить при перегенерации фона");
        }
        return;
      }

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
              designConcept: data.designConcept ?? prev.designConcept,
              visualHook: data.visualHook ?? prev.visualHook,
              pipelineVersion: data.pipelineVersion ?? prev.pipelineVersion,
            }
          : prev,
      );
    } catch (err) {
      setError(networkErrorMessage(err));
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
        AI проанализирует товар, определит визуальный хук и соберёт уникальную
        карточку 900×1200 для Wildberries
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

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
        <p className="text-sm font-medium text-slate-300">Дизайн подбирается автоматически</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Вместо фиксированных стилей AI строит уникальную композицию: анализ товара →
          визуальный хук → Design DNA → параметрический макет. Каждая карточка — новая
          комбинация, как у профессионального арт-директора.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
        <p className="text-sm font-medium text-slate-300">Режим арт-директора</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Система сгенерирует 8 разных концепций, оценит их и отрендерит лучшую.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ART_DIRECTOR_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setArtDirectorMode(mode.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                artDirectorMode === mode.id
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-slate-700 hover:border-slate-500"
              }`}
            >
              <span className="block text-xs font-medium text-slate-200">{mode.label}</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                {mode.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
        <p className="text-sm font-medium text-slate-300">Сцена обложки</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Creative Director сначала придумывает рекламную историю (не вёрстку), затем на обложке
          остаётся одна мысль: заголовок + одна цифра + компактный бейдж.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setCoverConcept("auto")}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              coverConcept === "auto"
                ? "border-brand-500 bg-brand-500/10"
                : "border-slate-700 hover:border-slate-500"
            }`}
          >
            <span className="block text-xs font-medium text-slate-200">Авто</span>
            <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
              По категории товара
            </span>
          </button>
          {COVER_CONCEPTS.map((concept) => (
            <button
              key={concept.id}
              type="button"
              onClick={() => setCoverConcept(concept.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                coverConcept === concept.id
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-slate-700 hover:border-slate-500"
              }`}
            >
              <span className="block text-xs font-medium text-slate-200">{concept.label}</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                {concept.description}
              </span>
            </button>
          ))}
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
          <p className="mt-3 text-xs text-slate-500">
            Прошло: <span className="font-mono text-slate-300">{formatElapsed(elapsedSec)}</span>
            {" · "}
            обычно 2–5 минут. Не закрывайте вкладку.
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-400">
              <p>
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
                {result.pipelineVersion && (
                  <span className="ml-2 text-emerald-500">· {result.pipelineVersion}</span>
                )}
              </p>
              {result.oneThoughtHeadline && (
                <p className="mt-1 text-sm font-medium text-slate-200">
                  «{result.oneThoughtHeadline}»
                </p>
              )}
              {result.creativeMainIdea && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Идея: <span className="text-slate-300">{result.creativeMainIdea}</span>
                </p>
              )}
              {result.designConcept && (
                <p className="mt-1 text-xs text-slate-500">
                  Концепция: <span className="text-slate-300">{result.designConcept}</span>
                </p>
              )}
              {result.selectedArchetypeId && (
                <p className="mt-0.5 text-xs text-emerald-500">
                  Концепт: {result.selectedArchetypeId.replace(/_/g, " ")}
                  {result.conceptCandidates ? ` · из ${result.conceptCandidates} вариантов` : ""}
                </p>
              )}
              {result.visualHook && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Хук:{" "}
                  <span className="text-brand-300">{hookLabel(result.visualHook.type)}</span>
                  {" — "}
                  {result.visualHook.reason}
                </p>
              )}
            </div>
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

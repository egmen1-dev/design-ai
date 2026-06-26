"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STYLE_LABELS, type InfographicStyle } from "@/lib/design-trends";

type UploadedExample = {
  id: string;
  prompt: string;
  imageUrl: string;
  notes: string | null;
  appliedStyle: string;
  tags: string[];
  synonyms?: string[];
  styleReason?: string;
  createdAt: string;
};

type UploadResponse = {
  example?: UploadedExample;
  error?: string;
};

export function ReferenceUploadForm({
  initialExamples,
}: {
  initialExamples: UploadedExample[];
}) {
  const [examples, setExamples] = useState(initialExamples);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEnrichment, setLastEnrichment] = useState<UploadResponse["example"] | null>(null);
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLastEnrichment(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("prompt", prompt.trim());

    try {
      const response = await fetch("/api/admin/references", {
        method: "POST",
        body: formData,
      });

      let data: UploadResponse;
      try {
        data = (await response.json()) as UploadResponse;
      } catch {
        setError("Неожиданный ответ сервера");
        return;
      }

      if (!response.ok || !data.example) {
        setError(data.error ?? "Не удалось сохранить пример");
        return;
      }

      setExamples((prev) => [data.example!, ...prev]);
      setLastEnrichment(data.example);
      setPrompt("");
      setNotes("");
      form.reset();
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить этот пример из обучения?")) return;

    const response = await fetch(`/api/admin/examples/${id}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Не удалось удалить");
      return;
    }

    setExamples((prev) => prev.filter((item) => item.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5"
      >
        <div>
          <h2 className="text-lg font-semibold">Добавить карточку в обучение</h2>
          <p className="mt-1 text-sm text-slate-500">
            Загрузите карточку WB/Ozon и кратко опишите товар. Стиль и синонимы для поиска
            подберутся автоматически — вручную выбирать не нужно.
          </p>
        </div>

        <label className="block text-sm">
          <span className="text-slate-400">Карточка товара (PNG, JPEG, WebP)</span>
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="mt-1 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:text-white"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-400">Описание товара / запрос покупателя</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            required
            minLength={3}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="триммер садовый электрический, 1300 Вт, для дачи..."
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-400">Заметки (опционально)</span>
          <textarea
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Если хотите уточнить контекст — иначе система опишет композицию сама"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? "Анализ карточки и подбор синонимов…" : "Добавить в обучение"}
        </button>
      </form>

      {lastEnrichment && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-950/20 p-5 text-sm">
          <p className="font-medium text-brand-300">Автоматически определено</p>
          <p className="mt-2 text-slate-300">
            Стиль:{" "}
            <span className="text-white">
              {STYLE_LABELS[lastEnrichment.appliedStyle as InfographicStyle] ??
                lastEnrichment.appliedStyle}
            </span>
          </p>
          {lastEnrichment.styleReason && (
            <p className="mt-1 text-slate-400">{lastEnrichment.styleReason}</p>
          )}
          {lastEnrichment.synonyms && lastEnrichment.synonyms.length > 0 && (
            <p className="mt-3 text-slate-400">
              Синонимы и похожие запросы ({lastEnrichment.synonyms.length}):{" "}
              <span className="text-slate-300">
                {lastEnrichment.synonyms.slice(0, 10).join(", ")}
                {lastEnrichment.synonyms.length > 10 ? "…" : ""}
              </span>
            </p>
          )}
        </div>
      )}

      {examples.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Примеры для генерации ({examples.length})
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((example) => (
              <li
                key={example.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50"
              >
                {example.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={example.imageUrl}
                    alt="Референс карточки"
                    className="h-48 w-full object-cover object-top"
                  />
                )}
                <div className="space-y-2 p-4">
                  <p className="line-clamp-2 text-sm text-slate-200">{example.prompt}</p>
                  <p className="text-xs text-brand-400">
                    {STYLE_LABELS[example.appliedStyle as InfographicStyle] ??
                      example.appliedStyle}
                  </p>
                  {example.tags.length > 0 && (
                    <p className="line-clamp-2 text-xs text-slate-500">
                      {example.tags.slice(0, 8).join(" · ")}
                      {example.tags.length > 8 ? "…" : ""}
                    </p>
                  )}
                  <p className="text-xs text-slate-600">
                    {new Date(example.createdAt).toLocaleString("ru-RU")}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(example.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

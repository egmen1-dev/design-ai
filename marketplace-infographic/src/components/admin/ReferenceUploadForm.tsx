"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DEFAULT_STYLE,
  STYLE_KEYS,
  STYLE_LABELS,
  type InfographicStyle,
} from "@/lib/design-trends";

type UploadedExample = {
  id: string;
  prompt: string;
  imageUrl: string;
  notes: string | null;
  appliedStyle: string;
  tags: string[];
  createdAt: string;
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

export function ReferenceUploadForm({
  initialExamples,
}: {
  initialExamples: UploadedExample[];
}) {
  const [examples, setExamples] = useState(initialExamples);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [appliedStyle, setAppliedStyle] = useState<InfographicStyle>(DEFAULT_STYLE);
  const [styleTags, setStyleTags] = useState<string[]>([DEFAULT_STYLE]);
  const [notes, setNotes] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("prompt", prompt.trim());
    formData.set("appliedStyle", appliedStyle);
    formData.set("tags", JSON.stringify(styleTags));

    try {
      const response = await fetch("/api/admin/references", {
        method: "POST",
        body: formData,
      });

      let data: { example?: UploadedExample; error?: string };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        setError("Неожиданный ответ сервера");
        return;
      }

      if (!response.ok || !data.example) {
        setError(data.error ?? "Не удалось сохранить пример");
        return;
      }

      setExamples((prev) => [data.example!, ...prev]);
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
            Загрузите готовую карточку WB/Ozon. При генерации система подберёт похожие
            примеры по описанию товара, стилю и тегам.
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
          <span className="text-slate-400">Стиль карточки</span>
          <select
            value={appliedStyle}
            onChange={(event) => setAppliedStyle(event.target.value as InfographicStyle)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            {STYLE_KEYS.map((style) => (
              <option key={style} value={style}>
                {STYLE_LABELS[style]}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="mb-2 text-sm text-slate-400">Теги для подбора (стили дизайна)</p>
          <StyleTagPicker selected={styleTags} onChange={setStyleTags} />
        </div>

        <label className="block text-sm">
          <span className="text-slate-400">Заметки о композиции (опционально)</span>
          <textarea
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Крупный заголовок сверху, 3 УТП слева, товар справа..."
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || styleTags.length === 0}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? "Сохранение…" : "Добавить в обучение"}
        </button>
      </form>

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
                    <p className="text-xs text-slate-500">{example.tags.join(" · ")}</p>
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

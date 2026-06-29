"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STYLE_KEYS, STYLE_LABELS } from "@/lib/design-trends";
import type { FontCategoryApi } from "@/lib/library-validations";

const FONT_CATEGORIES: FontCategoryApi[] = [
  "sans-serif",
  "serif",
  "display",
  "monospace",
];

type FontRow = {
  id: string;
  name: string;
  cssImport: string;
  fontFamily: string;
  category: FontCategoryApi;
  styleTags: string[];
  createdAt: string;
};

type BadgeRow = {
  id: string;
  name: string;
  htmlTemplate: string;
  svgTemplate: string | null;
  pngUrl: string | null;
  styleTags: string[];
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
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
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

function DeleteButton({
  endpoint,
  label,
}: {
  endpoint: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Удалить «${label}»?`)) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Не удалось удалить");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {loading ? "…" : "Удалить"}
    </button>
  );
}

export function AddFontForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [styleTags, setStyleTags] = useState<string[]>(["modern"]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      cssImport: String(form.get("cssImport") ?? ""),
      fontFamily: String(form.get("fontFamily") ?? ""),
      category: String(form.get("category") ?? "sans-serif"),
      styleTags,
    };

    try {
      const res = await fetch("/api/admin/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ошибка сохранения");
        return;
      }
      event.currentTarget.reset();
      setStyleTags(["modern"]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="font-semibold">Добавить шрифт</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Название</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Inter"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">font-family</span>
          <input
            name="fontFamily"
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="'Inter', sans-serif"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-slate-400">cssImport (тег link)</span>
        <input
          name="cssImport"
          required
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-xs"
          placeholder='<link href="https://fonts.googleapis.com/css2?family=Inter...'
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Категория</span>
        <select
          name="category"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          {FONT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>
      <div>
        <p className="mb-2 text-sm text-slate-400">Стили</p>
        <StyleTagPicker selected={styleTags} onChange={setStyleTags} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || styleTags.length === 0}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
      >
        {loading ? "Сохранение…" : "Добавить шрифт"}
      </button>
    </form>
  );
}

export function AddBadgeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [styleTags, setStyleTags] = useState<string[]>(["modern"]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const svg = String(form.get("svgTemplate") ?? "").trim();
    const png = String(form.get("pngUrl") ?? "").trim();

    const body = {
      name: String(form.get("name") ?? ""),
      htmlTemplate: String(form.get("htmlTemplate") ?? ""),
      svgTemplate: svg || null,
      pngUrl: png || null,
      styleTags,
    };

    try {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ошибка сохранения");
        return;
      }
      event.currentTarget.reset();
      setStyleTags(["modern"]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="font-semibold">Добавить плашку</h3>
      <label className="block text-sm">
        <span className="text-slate-400">Название</span>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Синяя лента"
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">
          htmlTemplate (плейсхолдеры {"{{text}}"} и {"{{color}}"})
        </span>
        <textarea
          name="htmlTemplate"
          required
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"
          placeholder='<div style="background:{{color}}">{{text}}</div>'
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">svgTemplate (опционально)</span>
        <textarea
          name="svgTemplate"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">pngUrl (опционально)</span>
        <input
          name="pngUrl"
          type="url"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="https://..."
        />
      </label>
      <div>
        <p className="mb-2 text-sm text-slate-400">Стили</p>
        <StyleTagPicker selected={styleTags} onChange={setStyleTags} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || styleTags.length === 0}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
      >
        {loading ? "Сохранение…" : "Добавить плашку"}
      </button>
    </form>
  );
}

export function FontsList({ fonts }: { fonts: FontRow[] }) {
  if (fonts.length === 0) {
    return <p className="text-sm text-slate-500">Шрифтов пока нет</p>;
  }

  return (
    <ul className="space-y-3">
      {fonts.map((font) => (
        <li
          key={font.id}
          className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{font.name}</p>
              <p className="mt-1 font-mono text-xs text-slate-400">{font.fontFamily}</p>
              <p className="mt-1 text-xs text-slate-500">
                {font.category} · {new Date(font.createdAt).toLocaleString("ru-RU")}
              </p>
              <p className="mt-2 flex flex-wrap gap-1">
                {font.styleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {STYLE_LABELS[tag as keyof typeof STYLE_LABELS] ?? tag}
                  </span>
                ))}
              </p>
            </div>
            <DeleteButton endpoint={`/api/admin/fonts/${font.id}`} label={font.name} />
          </div>
          <p className="mt-3 line-clamp-2 font-mono text-xs text-slate-500">{font.cssImport}</p>
        </li>
      ))}
    </ul>
  );
}

export function BadgesList({ badges }: { badges: BadgeRow[] }) {
  if (badges.length === 0) {
    return <p className="text-sm text-slate-500">Плашек пока нет</p>;
  }

  return (
    <ul className="space-y-3">
      {badges.map((badge) => (
        <li
          key={badge.id}
          className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{badge.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(badge.createdAt).toLocaleString("ru-RU")}
              </p>
              <p className="mt-2 flex flex-wrap gap-1">
                {badge.styleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {STYLE_LABELS[tag as keyof typeof STYLE_LABELS] ?? tag}
                  </span>
                ))}
              </p>
              {badge.pngUrl && (
                <p className="mt-2 truncate text-xs text-brand-400">{badge.pngUrl}</p>
              )}
            </div>
            <DeleteButton endpoint={`/api/admin/badges/${badge.id}`} label={badge.name} />
          </div>
          <pre className="mt-3 max-h-24 overflow-auto rounded bg-slate-950 p-2 font-mono text-xs text-slate-400">
            {badge.htmlTemplate}
          </pre>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";
import type { UserFeedbackValue } from "@/lib/feedback/types";

type Props = {
  imageId: string;
  initialFeedback?: UserFeedbackValue | null;
  compact?: boolean;
};

export function FeedbackButtons({ imageId, initialFeedback = null, compact = false }: Props) {
  const [feedback, setFeedback] = useState<UserFeedbackValue | null>(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(next: UserFeedbackValue) {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/images/${imageId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: next }),
      });
      const data = (await res.json()) as { error?: string; feedback?: UserFeedbackValue };
      if (!res.ok) {
        setMessage(data.error ?? "Не удалось сохранить оценку");
        return;
      }
      setFeedback(data.feedback ?? next);
      setMessage(next === "like" ? "Спасибо! Учтём в обучении." : "Поняли, скорректируем подход.");
    } catch {
      setMessage("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  const btnBase = compact
    ? "rounded-lg border px-2.5 py-1.5 text-base transition"
    : "rounded-lg border px-3 py-2 text-lg transition";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={loading}
          onClick={() => submit("like")}
          title="Нравится"
          aria-label="Нравится"
          aria-pressed={feedback === "like"}
          className={`${btnBase} ${
            feedback === "like"
              ? "border-emerald-500 bg-emerald-950/60 text-emerald-300"
              : "border-slate-600 text-slate-300 hover:border-emerald-600 hover:text-emerald-400"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          👍
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => submit("dislike")}
          title="Не нравится"
          aria-label="Не нравится"
          aria-pressed={feedback === "dislike"}
          className={`${btnBase} ${
            feedback === "dislike"
              ? "border-red-500 bg-red-950/60 text-red-300"
              : "border-slate-600 text-slate-300 hover:border-red-600 hover:text-red-400"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          👎
        </button>
      </div>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}

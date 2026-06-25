"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { InfographicResult } from "@/lib/validations";

type ApprovalButtonProps = {
  prompt: string;
  generatedJson: InfographicResult;
};

export function ApprovalButton({ prompt, generatedJson }: ApprovalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  async function handleApprove() {
    setLoading(true);

    try {
      const response = await fetch("/api/training/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, result: generatedJson }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не удалось сохранить пример");
      }

      setApproved(true);
      toast.success("Спасибо! Пример добавлен в обучение.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={loading || approved}
      className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {approved ? "👍 Сохранено" : loading ? "Сохраняем..." : "👍 Хороший результат"}
    </button>
  );
}

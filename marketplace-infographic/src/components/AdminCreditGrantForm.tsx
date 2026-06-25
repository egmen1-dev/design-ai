"use client";

import { useState } from "react";
import { toast } from "sonner";

export function AdminCreditGrantForm() {
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState(10);
  const [reason, setReason] = useState("manual");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, credits, reason }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось начислить кредиты");
      }

      toast.success(
        `Начислено ${credits} кредитов. Баланс: ${data.user.credits}`,
      );
      setEmail("");
      setCredits(10);
      setReason("manual");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка начисления");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
    >
      <h2 className="text-xl font-semibold">Начислить кредиты</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_140px]">
        <label className="block">
          <span className="text-sm text-slate-300">Email пользователя</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
            placeholder="user@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-300">Кредиты</span>
          <input
            type="number"
            min={1}
            max={10_000}
            required
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-sm text-slate-300">Причина</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
          placeholder="manual"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="mt-5 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Начисляем..." : "Начислить"}
      </button>
    </form>
  );
}

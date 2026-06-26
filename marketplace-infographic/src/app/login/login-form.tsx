"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Неверный email или пароль");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-8"
      >
        <h1 className="text-2xl font-bold">Вход</h1>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Вход..." : "Войти"}
        </button>

        <p className="text-center text-sm text-slate-400">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-brand-500 hover:underline">
            Регистрация
          </Link>
        </p>

        <div className="relative py-2 text-center text-xs text-slate-500">или</div>

        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="w-full rounded-lg border border-slate-700 py-2.5 text-sm hover:bg-slate-800"
        >
          Войти через GitHub
        </button>
      </form>
    </main>
  );
}

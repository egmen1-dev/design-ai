import Link from "next/link";
import { auth } from "@/lib/auth";
import { GenerateForm } from "@/components/GenerateForm";
import { SignInButton } from "@/components/SignInButton";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <header className="mb-16 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
            design-ai
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Infographic Marketplace
          </h1>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-slate-400 hover:text-white">
            Pricing
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
            >
              Dashboard
            </Link>
          ) : (
            <SignInButton />
          )}
        </nav>
      </header>

      <section className="grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">
            AI-powered infographics with Ollama
          </h2>
          <p className="mt-4 text-slate-400">
            Describe your topic and get a polished infographic rendered with
            Puppeteer and a watermark. Powered by qwen2.5:7b locally via Ollama.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-400">
            <li>• NextAuth + GitHub sign-in</li>
            <li>• Stripe subscriptions for Pro tier</li>
            <li>• In-memory rate limiting (no Redis)</li>
          </ul>
        </div>

        {session ? (
          <GenerateForm />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-slate-400">Sign in to generate infographics</p>
            <div className="mt-4">
              <SignInButton />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

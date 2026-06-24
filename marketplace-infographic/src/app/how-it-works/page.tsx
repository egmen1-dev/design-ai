import Link from "next/link";

const steps = [
  {
    title: "1. Validate the prompt",
    body: "The API accepts a concise generation brief and validates it with Zod before doing any expensive work.",
  },
  {
    title: "2. Generate HTML with Ollama",
    body: "The server calls a local Ollama qwen2.5:7b model to produce a self-contained 1200x1600 HTML infographic.",
  },
  {
    title: "3. Render with Puppeteer",
    body: "Puppeteer loads the generated HTML, captures a high-resolution PNG, and overlays the configured watermark.",
  },
  {
    title: "4. Store and rate-limit",
    body: "Prisma stores the prompt, HTML and image path. An in-memory limiter keeps Free and Pro quotas separate without Redis.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/" className="text-sm text-brand-500 hover:underline">
        ← Back
      </Link>

      <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
          How it works
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          From prompt to watermarked infographic
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          The stack is designed for a small VPS: Next.js handles the UI and API,
          PostgreSQL stores user data, Ollama runs locally, and PM2 keeps the app
          online behind Nginx.
        </p>
      </section>

      <section className="mt-10 grid gap-5">
        {steps.map((step) => (
          <article
            key={step.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <h2 className="text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-slate-400">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6">
        <h2 className="text-xl font-semibold">Local mock mode</h2>
        <p className="mt-2 text-slate-300">
          Set <code className="rounded bg-slate-950 px-2 py-1">OLLAMA_MOCK=true</code>{" "}
          when you need deterministic HTML generation before the Ollama model is
          installed or warmed up.
        </p>
      </section>
    </main>
  );
}

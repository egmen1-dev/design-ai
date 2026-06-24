export function generateMockInfographicHtml(prompt: string): string {
  const title = escapeHtml(prompt.slice(0, 90));
  const summary = escapeHtml(prompt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      width: 1200px;
      height: 1600px;
      margin: 0;
      padding: 64px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #f8fafc;
      background:
        radial-gradient(circle at 15% 10%, rgba(14, 165, 233, 0.35), transparent 30%),
        radial-gradient(circle at 80% 15%, rgba(168, 85, 247, 0.25), transparent 26%),
        linear-gradient(135deg, #020617 0%, #0f172a 52%, #111827 100%);
    }
    .shell {
      height: 100%;
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 42px;
      padding: 56px;
      background: rgba(15, 23, 42, 0.72);
      box-shadow: 0 32px 120px rgba(0, 0, 0, 0.35);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(14, 165, 233, 0.35);
      border-radius: 999px;
      padding: 10px 16px;
      color: #7dd3fc;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 900px;
      margin: 42px 0 24px;
      font-size: 76px;
      line-height: 0.98;
      letter-spacing: -0.06em;
    }
    .lead {
      max-width: 920px;
      color: #cbd5e1;
      font-size: 28px;
      line-height: 1.45;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 22px;
      margin-top: 64px;
    }
    .card {
      min-height: 240px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 30px;
      padding: 30px;
      background: rgba(2, 6, 23, 0.58);
    }
    .value {
      display: block;
      margin-bottom: 18px;
      color: #38bdf8;
      font-size: 54px;
      font-weight: 800;
      letter-spacing: -0.05em;
    }
    .label {
      color: #e2e8f0;
      font-size: 24px;
      font-weight: 700;
    }
    .copy {
      margin-top: 12px;
      color: #94a3b8;
      font-size: 18px;
      line-height: 1.5;
    }
    .timeline {
      margin-top: 64px;
      border-radius: 34px;
      padding: 34px;
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.18), rgba(168, 85, 247, 0.16));
    }
    .step {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 22px;
      padding: 22px 0;
      border-bottom: 1px solid rgba(226, 232, 240, 0.14);
    }
    .step:last-child { border-bottom: 0; }
    .step strong {
      color: #f8fafc;
      font-size: 30px;
    }
    .step p {
      margin: 0;
      color: #cbd5e1;
      font-size: 24px;
      line-height: 1.4;
    }
    .footer {
      margin-top: 58px;
      color: #64748b;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="eyebrow">Mock render · qwen2.5:7b compatible</div>
    <h1>${title || "AI infographic preview"}</h1>
    <p class="lead">${summary}</p>

    <section class="grid">
      <article class="card">
        <span class="value">01</span>
        <div class="label">Prompt</div>
        <p class="copy">Structured input is validated before generation.</p>
      </article>
      <article class="card">
        <span class="value">02</span>
        <div class="label">Design</div>
        <p class="copy">The model composes HTML with inline CSS for consistent rendering.</p>
      </article>
      <article class="card">
        <span class="value">03</span>
        <div class="label">Export</div>
        <p class="copy">Puppeteer renders PNG output and applies the watermark.</p>
      </article>
    </section>

    <section class="timeline">
      <div class="step">
        <strong>Free</strong>
        <p>Generate three watermarked infographics per day with local rate limits.</p>
      </div>
      <div class="step">
        <strong>Pro</strong>
        <p>Stripe subscriptions unlock a higher daily quota when payments are enabled.</p>
      </div>
      <div class="step">
        <strong>VPS</strong>
        <p>Run Next.js, PostgreSQL, PM2, Nginx and Ollama on a small server.</p>
      </div>
    </section>

    <p class="footer">Set OLLAMA_MOCK=true to use this deterministic generator without a running model.</p>
  </main>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

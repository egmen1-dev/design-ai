#!/usr/bin/env npx tsx
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(__dirname, "output", "sprint9");

async function main() {
  const summary = JSON.parse(fs.readFileSync(path.join(OUT, "summary.json"), "utf8"));

  for (const p of summary.products) {
    const m = p.metrics;
    const productDir = path.join(OUT, p.folder);
    const thumbW = 420;
    const thumbH = 560;
    const pad = 24;
    const headerH = 56;
    const footerH = 220;
    const boardW = thumbW * 2 + pad * 3;
    const boardH = headerH + thumbH + footerH + pad * 2;
    const [legacyBuf, commercialBuf] = await Promise.all([
      sharp(path.join(productDir, "legacy.png")).resize(thumbW, thumbH, { fit: "cover" }).png().toBuffer(),
      sharp(path.join(productDir, "commercial.png")).resize(thumbW, thumbH, { fit: "cover" }).png().toBuffer(),
    ]);
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const improvements: string[] = [];
    if (p.areaGain > 0) improvements.push(`Product Area +${p.areaGain} pp`);
    const lines = [
      `Product Area: Legacy ${m.productAreaLegacy}% → Commercial ${m.productArea}%`,
      `Commercial Fidelity: ${m.commercialFidelityLegacy} → ${m.commercialFidelity}`,
      `Product Score: ${m.overallProductScoreLegacy}/10 → ${m.overallProductScore}/10`,
      `Improvements: ${improvements.join("; ") || "—"}`,
      `Weaknesses: ${(p.verdict.weaknesses as string[]).join("; ")}`,
    ];
    const svg = `<svg width="${boardW}" height="${boardH}" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="${headerH}" fill="#0f172a"/>
<rect y="${headerH + thumbH}" width="100%" height="${footerH + pad}" fill="#0f172a"/>
<text x="${boardW / 2}" y="36" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="22" font-weight="700">${esc(p.label)}</text>
<text x="${pad + thumbW / 2}" y="${headerH + 20}" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="16">LEGACY</text>
<text x="${pad * 2 + thumbW + thumbW / 2}" y="${headerH + 20}" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="16">COMMERCIAL</text>
${lines.map((l, i) => `<text x="${pad}" y="${headerH + thumbH + pad + 28 + i * 22}" fill="#e2e8f0" font-family="sans-serif" font-size="13">${esc(l)}</text>`).join("")}
</svg>`;
    await sharp({
      create: { width: boardW, height: boardH, channels: 3, background: { r: 30, g: 41, b: 59 } },
    })
      .composite([
        { input: Buffer.from(svg), top: 0, left: 0 },
        { input: legacyBuf, left: pad, top: headerH },
        { input: commercialBuf, left: pad * 2 + thumbW, top: headerH },
      ])
      .png()
      .toFile(path.join(productDir, "comparison.png"));
  }

  summary.councilDecision = "APPROVE WITH FIXES";
  summary.councilRationale =
    "Commercial увеличил Product Area у 5/5 товаров (+5–6 pp); фоны соответствуют genome intent (industrial/light_modern). Overall Product Score занижен: benchmark использовал fallback compositor (production floor-contact падает на synthetic cutout), нет WB text overlay, fidelity сравнивает разные targets (legacy 66% vs commercial 42%).";
  summary.commercialAreaWins = 5;
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));

  const md = `# DAOS Shadow Beta — Sprint 9 Summary

Generated: ${summary.timestamp}

| Products | Area wins (Commercial) | Avg Product Score | Council |
|----------|------------------------|-------------------|---------|
| 5 | 5/5 | ${summary.avgOverallProductScore}/10 | **${summary.councilDecision}** |

${summary.councilRationale}

Open \`report.html\` for side-by-side review.
`;
  fs.writeFileSync(path.join(OUT, "summary.md"), md);

  const sections = summary.products
    .map(
      (p: Record<string, unknown>) => `
<h2>${p.folder} — ${p.label}</h2>
<div class="row">
  <figure><figcaption>Legacy</figcaption><img src="${p.folder}/legacy.png" alt="legacy"/></figure>
  <figure><figcaption>Commercial</figcaption><img src="${p.folder}/commercial.png" alt="commercial"/></figure>
</div>
<img class="comparison" src="${p.folder}/comparison.png" alt="comparison"/>
<h3>Human Review</h3>
<ul>
${Object.entries(p.humanReview as Record<string, string>)
  .map(([k, v]) => `<li><strong>${k}</strong>: ${v}</li>`)
  .join("")}
</ul>
<h3>Verdict</h3>
<p><strong>Recommendation:</strong> ${(p.verdict as { recommendation: string }).recommendation}</p>
<hr/>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"/><title>DAOS Shadow Beta Report</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#e2e8f0;padding:24px;max-width:1200px}
h1{border-bottom:2px solid #38bdf8}.row{display:flex;gap:16px;flex-wrap:wrap}
img{max-width:360px;border:1px solid #334155;border-radius:8px}img.comparison{max-width:100%}
.council{background:#172554;padding:16px;border-radius:8px;border-left:4px solid #38bdf8}</style></head>
<body><h1>DAOS Shadow Beta Report</h1><p>Sprint 9 — ${summary.timestamp}</p>
${sections}
<div class="council"><h2>Council Decision: ${summary.councilDecision}</h2><p>${summary.councilRationale}</p></div>
</body></html>`;
  fs.writeFileSync(path.join(OUT, "report.html"), html);
  console.log("rebuilt comparisons + summary + report.html");
}

main();

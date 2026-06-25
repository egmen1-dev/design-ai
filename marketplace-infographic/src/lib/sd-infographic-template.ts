import type { InfographicSdInput as InfographicSdData } from "@/lib/validations";

export type { InfographicSdData };

export type RenderSdOptions = {
  /** Готовый композит фон+товар (sharp) */
  mergedImageDataUrl?: string;
  backgroundDataUrl?: string;
  backgroundCss?: string;
  /** Fallback: отдельный слой товара поверх фона */
  productImageSrc?: string;
  productCutout?: boolean;
  watermarkText?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderSdInfographicHtml(
  data: InfographicSdData,
  options: RenderSdOptions,
): string {
  const accent = data.colors[0] ?? "#e31e24";
  const accent2 = data.colors[1] ?? "#2563eb";

  const useMerged = Boolean(options.mergedImageDataUrl);
  const bgStyle = useMerged
    ? `background-image: url('${options.mergedImageDataUrl}'); background-size: cover; background-position: center;`
    : options.backgroundDataUrl
      ? `background-image: url('${options.backgroundDataUrl}'); background-size: cover; background-position: center;`
      : `background: ${options.backgroundCss ?? "linear-gradient(145deg, #0f172a, #1e293b)"};`;

  const productClass = options.productCutout
    ? "product-photo product-cutout"
    : "product-photo product-blend";

  const productStageHtml =
    !useMerged && options.productImageSrc
      ? `
    <div class="product-stage">
      <div class="product-shadow"></div>
      <img class="${productClass}" src="${options.productImageSrc}" alt="${escapeHtml(data.title)}" />
    </div>`
      : "";

  const bullets = data.bullets.slice(0, 4);
  const badgePositions = [
    { className: "badge-tl", style: `background:${accent2}` },
    { className: "badge-tr", style: `background:${accent2}` },
    { className: "badge-br", style: `border-color:${accent};color:${accent}` },
    { className: "badge-bl", style: `background:${accent}` },
  ];

  const bulletsHtml = bullets
    .map((text, i) => {
      const pos = badgePositions[i] ?? badgePositions[0];
      if (pos.className === "badge-br") {
        return `
          <div class="badge ${pos.className}">
            <div class="badge-circle" style="${pos.style}">
              <div class="badge-circle-val">${escapeHtml(text)}</div>
            </div>
          </div>`;
      }
      const parts = text.split(/\s+/);
      const big = parts[0] ?? text;
      const sub = parts.slice(1).join(" ") || "";
      return `
        <div class="badge ${pos.className}" style="${pos.style}">
          <div class="badge-big">${escapeHtml(big)}</div>
          ${sub ? `<div class="badge-sub">${escapeHtml(sub)}</div>` : ""}
        </div>`;
    })
    .join("");

  const watermark = options.watermarkText ?? process.env.WATERMARK_TEXT ?? "design-ai";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, height=1200" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1200px; height: 1200px; overflow: hidden; font-family: "Segoe UI", Inter, sans-serif; }
    .slide {
      position: relative; width: 1200px; height: 1200px; overflow: hidden;
      ${bgStyle}
    }
    .overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.25) 100%);
      z-index: 1;
    }
    .hero-header {
      position: absolute; top: 40px; left: 48px; right: 48px;
      display: flex; justify-content: space-between; align-items: flex-start;
      z-index: 10;
    }
    .hero-title {
      font-size: 68px; font-weight: 900; color: #fff; line-height: 0.95;
      text-transform: uppercase; letter-spacing: 0.04em;
      text-shadow: 0 4px 24px rgba(0,0,0,0.5);
    }
    .hero-pill {
      display: inline-block; margin-top: 12px;
      background: ${accent}; color: #fff;
      font-size: 22px; font-weight: 700; padding: 8px 22px; border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .hero-brand {
      font-size: 24px; font-weight: 800; color: #fff;
      text-transform: uppercase; letter-spacing: 0.08em;
      text-shadow: 0 2px 8px rgba(0,0,0,0.4); padding-top: 8px;
    }
    .badge { position: absolute; z-index: 8; color: #fff; border-radius: 18px; box-shadow: 0 12px 32px rgba(0,0,0,0.35); }
    .badge-tl { top: 200px; left: 44px; width: 150px; min-height: 140px; padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .badge-tr { top: 210px; right: 40px; max-width: 300px; padding: 16px 20px; }
    .badge-bl { bottom: 320px; left: 48px; padding: 14px 20px; font-size: 15px; font-weight: 700; }
    .badge-br { bottom: 300px; right: 52px; }
    .badge-big { font-size: 56px; font-weight: 900; line-height: 1; }
    .badge-sub { margin-top: 6px; font-size: 14px; font-weight: 700; text-align: center; }
    .badge-circle {
      width: 130px; height: 130px; border-radius: 50%; border: 5px solid;
      background: #fff; display: flex; align-items: center; justify-content: center;
      padding: 10px; box-shadow: 0 10px 28px rgba(0,0,0,0.25);
    }
    .badge-circle-val { font-size: 16px; font-weight: 800; text-align: center; line-height: 1.2; }
    .product-stage {
      position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
      z-index: 5; width: 900px; height: 720px;
      display: flex; align-items: flex-end; justify-content: center;
    }
    .product-photo {
      max-width: 100%; max-height: 700px; object-fit: contain; object-position: center bottom;
      position: relative; z-index: 2;
      filter: drop-shadow(0 36px 48px rgba(0,0,0,0.55));
    }
    .product-cutout { mix-blend-mode: normal; }
    .product-blend { mix-blend-mode: multiply; }
    .product-shadow {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      width: 60%; height: 48px;
      background: radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%);
      z-index: 1;
    }
    .watermark {
      position: absolute; bottom: 24px; right: 24px; z-index: 12;
      font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9);
      background: rgba(0,0,0,0.35); padding: 8px 14px; border-radius: 6px;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="slide">
    <div class="overlay"></div>
    <header class="hero-header">
      <div>
        <h1 class="hero-title">${escapeHtml(data.title)}</h1>
        <div class="hero-pill">${escapeHtml(data.subtitle)}</div>
      </div>
      <div class="hero-brand">${escapeHtml(data.badge)}</div>
    </header>
    ${bulletsHtml}
    ${productStageHtml}
    <div class="watermark">${escapeHtml(watermark)}</div>
  </div>
</body>
</html>`;
}

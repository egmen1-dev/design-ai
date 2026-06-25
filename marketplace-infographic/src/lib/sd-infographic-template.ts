import type { InfographicSdInput as InfographicSdData } from "@/lib/validations";
import { DEFAULT_STYLE, type InfographicStyle } from "@/lib/design-trends";
import {
  badgeFill,
  buildSdVisualTheme,
  type SdVisualTheme,
} from "@/lib/sd-style-theme";

export type { InfographicSdData };

export type RenderSdOptions = {
  style?: InfographicStyle;
  mergedImageDataUrl?: string;
  backgroundDataUrl?: string;
  backgroundCss?: string;
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

function renderBadges(data: InfographicSdData, visual: SdVisualTheme): string {
  const bullets = data.bullets.slice(0, 4);
  const accent = visual.accent;

  return bullets
    .map((text, i) => {
      if (i === 2) {
        return `
          <div class="badge badge-br">
            <div class="badge-circle" style="border-color:${accent};color:${accent};${badgeFill(visual, "circle")}">
              <div class="badge-circle-val">${escapeHtml(text)}</div>
            </div>
          </div>`;
      }

      const posClass =
        i === 0 ? "badge-tl" : i === 1 ? "badge-tr" : "badge-bl";
      const fill = badgeFill(visual, i === 1 ? "banner" : "square");

      if (i === 1) {
        const icon = /вт|квт|мощ/i.test(text) ? "⚡" : "★";
        return `
          <div class="badge ${posClass} badge-banner" style="${fill} color:${visual.badgeTextColor};">
            <div class="badge-icon-wrap">${icon}</div>
            <div class="badge-tr-text">${escapeHtml(text)}</div>
          </div>`;
      }

      const parts = text.split(/\s+/);
      const big = parts[0] ?? text;
      const sub = parts.slice(1).join(" ") || "";
      return `
        <div class="badge ${posClass}" style="${fill} color:${visual.badgeTextColor};">
          <div class="badge-big">${escapeHtml(big)}</div>
          ${sub ? `<div class="badge-sub">${escapeHtml(sub)}</div>` : ""}
        </div>`;
    })
    .join("");
}

export function renderSdInfographicHtml(
  data: InfographicSdData,
  options: RenderSdOptions,
): string {
  const style = options.style ?? DEFAULT_STYLE;
  const visual = buildSdVisualTheme(data, style);

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

  const bulletsHtml = renderBadges(data, visual);
  const watermark = options.watermarkText ?? process.env.WATERMARK_TEXT ?? "design-ai";
  const brutalTitle = style === "brutalism" ? "text-transform: uppercase; letter-spacing: 0.06em;" : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, height=1200" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1200px; height: 1200px; overflow: hidden;
      font-family: ${visual.fontFamily}, "Segoe UI", sans-serif;
    }
    .slide {
      position: relative; width: 1200px; height: 1200px; overflow: hidden;
      ${bgStyle}
    }
    .overlay {
      position: absolute; inset: 0;
      background: ${visual.overlayCss};
      z-index: 1;
    }
    .style-tint {
      position: absolute; inset: 0; z-index: 2; pointer-events: none;
      background: ${visual.isLight ? "rgba(255,255,255,0.08)" : "transparent"};
    }
    .hero-header {
      position: absolute; top: 40px; left: 48px; right: 48px;
      display: flex; justify-content: space-between; align-items: flex-start;
      z-index: 10;
    }
    .hero-title {
      font-size: 72px; font-weight: 900; line-height: 0.95;
      letter-spacing: 0.04em; text-transform: uppercase;
      ${visual.titleCss} ${brutalTitle}
    }
    .hero-pill {
      display: inline-block; margin-top: 12px;
      font-size: 22px; font-weight: 700; padding: 8px 22px;
      border-radius: ${visual.badgeRadius};
      ${visual.pillCss}
    }
    .hero-brand {
      font-size: 26px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.08em; padding-top: 8px;
      ${visual.brandCss}
    }
    .badge {
      position: absolute; z-index: 8;
      border-radius: ${visual.badgeRadius};
      ${visual.badgeExtraCss} ${visual.badgeGlassCss}
    }
    .badge-tl {
      top: 200px; left: 44px; width: 148px; min-height: 148px;
      padding: 16px 12px; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }
    .badge-tr, .badge-banner {
      top: 210px; right: 40px; max-width: 300px;
    }
    .badge-banner {
      padding: 16px 20px; display: flex; align-items: center; gap: 14px;
    }
    .badge-bl { bottom: 320px; left: 48px; padding: 14px 20px; font-size: 15px; font-weight: 700; }
    .badge-br { bottom: 300px; right: 52px; }
    .badge-big { font-size: 64px; font-weight: 900; line-height: 1; }
    .badge-sub { margin-top: 6px; font-size: 15px; font-weight: 700; text-align: center; line-height: 1.2; }
    .badge-icon-wrap {
      width: 44px; height: 44px; flex-shrink: 0;
      background: rgba(255,255,255,0.22); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 22px;
    }
    .badge-tr-text { font-size: 17px; font-weight: 800; line-height: 1.25; }
    .badge-circle {
      width: 130px; height: 130px; border-radius: 50%; border: 5px solid;
      display: flex; align-items: center; justify-content: center;
      padding: 10px;
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
      font-size: 16px; font-weight: 600; padding: 8px 14px; border-radius: 6px;
      letter-spacing: 0.05em; ${visual.watermarkCss}
    }
  </style>
</head>
<body>
  <div class="slide" data-style="${style}">
    <div class="overlay"></div>
    <div class="style-tint"></div>
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

import { z } from "zod";
import {
  buildSlideTheme,
  DEFAULT_STYLE,
  type InfographicStyle,
} from "./design-trends";
import { getSceneLayers, SCENE_PROPS_CSS } from "./scene-backgrounds";

const backgroundSceneSchema = z.enum([
  "outdoor_home",
  "kitchen",
  "bathroom",
  "office",
  "nature",
  "studio",
]);

const calloutPositionSchema = z.enum([
  "bottom-left",
  "bottom-right",
  "middle-left",
  "middle-right",
]);

const productVisualSchema = z.enum([
  "generator",
  "appliance",
  "cosmetic",
  "generic",
]);

export const infographicDataSchema = z.object({
  /** Одно слово КАПСОМ — тип товара: ГЕНЕРАТОР, КРЕМ, НАУШНИКИ */
  headline: z.string().min(1).max(40),
  productName: z.string().min(1).max(80),
  categoryPill: z.string().min(1).max(30).optional(),
  brandName: z.string().min(1).max(40).optional(),
  productEmoji: z.string().min(1).max(8).optional(),
  productVisual: productVisualSchema.optional(),
  backgroundScene: backgroundSceneSchema,
  specBlocks: z
    .array(
      z.object({
        value: z.string().min(1).max(30),
        label: z.string().min(1).max(40),
        hint: z.string().max(80).optional(),
      }),
    )
    .min(2)
    .max(4),
  mainBanner: z.object({
    icon: z.string().max(4).optional(),
    title: z.string().min(1).max(60),
    description: z.string().min(1).max(120),
  }),
  callouts: z
    .array(
      z.object({
        text: z.string().min(1).max(80),
        position: calloutPositionSchema,
      }),
    )
    .min(2)
    .max(4),
  accentColor: z.enum(["red", "blue", "purple", "green"]).optional(),
});

export type InfographicData = z.infer<typeof infographicDataSchema>;

const ACCENT = {
  red: { primary: "#e31e24", dark: "#b91c1c", badge: "#2563eb" },
  blue: { primary: "#2563eb", dark: "#1d4ed8", badge: "#2563eb" },
  purple: { primary: "#7c3aed", dark: "#6d28d9", badge: "#6366f1" },
  green: { primary: "#16a34a", dark: "#15803d", badge: "#2563eb" },
} as const;

export type RenderInfographicOptions = {
  productImageSrc?: string;
  productImageCutout?: boolean;
  style?: InfographicStyle;
  /** Готовый композит фон+товар (sharp) — скрывает слои сцены и товар */
  mergedImageDataUrl?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detectProductVisual(data: InfographicData): z.infer<typeof productVisualSchema> {
  if (data.productVisual) return data.productVisual;
  const text = `${data.productName} ${data.headline}`.toLowerCase();
  if (/генератор|бензин|квт|инвертор/.test(text)) return "generator";
  if (/крем|сыворот|космет|spf|шампун/.test(text)) return "cosmetic";
  if (/пылесос|чайник|робот|техник/.test(text)) return "appliance";
  return "generic";
}

function extractBrandName(data: InfographicData): string {
  if (data.brandName) return data.brandName;
  const match = data.productName.match(
    /\b([A-ZА-Я][a-zа-яA-ZА-Я0-9-]{1,20})\b/,
  );
  if (match) return match[1];
  return data.productName.split(/\s+/).slice(0, 1)[0] ?? "Brand";
}

function extractCategoryPill(data: InfographicData): string {
  if (data.categoryPill) return data.categoryPill;
  const lower = data.productName.toLowerCase();
  if (/бензин|генератор/.test(lower)) return "бензиновый";
  if (/крем|сыворот/.test(lower)) return "для лица";
  if (/наушник/.test(lower)) return "беспроводные";
  if (/пылесос/.test(lower)) return "для дома";
  if (/куртк|одежд/.test(lower)) return "зимний";
  return data.productName.split(/\s+/).slice(-1)[0]?.toLowerCase() ?? "новинка";
}

function extractBigNumber(value: string): string {
  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(",", ".") : value.slice(0, 6);
}


function renderLeaves(): string {
  return `
    <svg class="leaf leaf-tl" viewBox="0 0 120 80" aria-hidden="true">
      <path d="M10 70 C30 10, 90 20, 110 60 C70 50, 40 80, 10 70Z" fill="rgba(74,222,128,0.55)"/>
      <path d="M25 55 C45 25, 75 30, 85 50" stroke="rgba(34,197,94,0.6)" stroke-width="2" fill="none"/>
    </svg>
    <svg class="leaf leaf-tr" viewBox="0 0 100 70" aria-hidden="true">
      <path d="M5 50 C25 5, 80 15, 95 45 C60 40, 30 60, 5 50Z" fill="rgba(134,239,172,0.45)"/>
    </svg>`;
}

function renderProductPhoto(
  imageSrc: string,
  productName: string,
  cutout: boolean,
): string {
  const cls = cutout
    ? "product-photo product-photo-cutout"
    : "product-photo product-photo-fallback";
  return `
    <div class="product-photo-stage">
      <div class="product-ground-glow" aria-hidden="true"></div>
      <div class="product-photo-shadow" aria-hidden="true"></div>
      <img class="${cls}" src="${imageSrc}" alt="${escapeHtml(productName)}" />
    </div>`;
}

function renderProductVisual(
  visual: z.infer<typeof productVisualSchema>,
  accent: string,
  productName: string,
): string {
  if (visual === "generator") {
    return `
      <div class="product-generator">
        <div class="gen-top" style="background:${accent}"></div>
        <div class="gen-body">
          <div class="gen-side-vent"></div>
          <div class="gen-panel">
            <div class="gen-panel-line"></div>
            <div class="gen-panel-line short"></div>
            <div class="gen-panel-dot"></div>
          </div>
          <div class="gen-handle" style="background:${accent}"></div>
        </div>
        <div class="gen-wheel gen-wheel-l"></div>
        <div class="gen-wheel gen-wheel-r"></div>
      </div>`;
  }

  if (visual === "appliance") {
    return `
      <div class="product-appliance">
        <div class="appl-body">
          <div class="appl-screen"></div>
          <div class="appl-btn" style="background:${accent}"></div>
        </div>
      </div>`;
  }

  if (visual === "cosmetic") {
    return `
      <div class="product-cosmetic">
        <div class="cosm-cap" style="background:${accent}"></div>
        <div class="cosm-tube"></div>
      </div>`;
  }

  return `
    <div class="product-generic">
      <div class="generic-box" style="border-color:${accent}">
        <div class="generic-shine"></div>
      </div>
    </div>`;
}

function renderBadgeTopLeft(
  spec: InfographicData["specBlocks"][number],
  badgeBg: string,
  badgeExtraCss: string,
): string {
  const big = extractBigNumber(spec.value);
  const unit = spec.label;
  return `
    <div class="badge badge-tl" style="background:${badgeBg}; ${badgeExtraCss}">
      <div class="badge-big">${escapeHtml(big)}</div>
      <div class="badge-sub">${escapeHtml(unit)}</div>
    </div>`;
}

function renderBadgeTopRight(
  banner: InfographicData["mainBanner"],
  badgeBg: string,
  badgeExtraCss: string,
): string {
  const icon = banner.icon ?? "⚡";
  return `
    <div class="badge badge-tr" style="background:${badgeBg}; ${badgeExtraCss}">
      <div class="badge-icon-wrap">${escapeHtml(icon)}</div>
      <div class="badge-tr-text">${escapeHtml(banner.title)}</div>
    </div>`;
}

function renderBadgeBottomRight(
  spec: InfographicData["specBlocks"][number],
  accentRed: string,
  badgeExtraCss: string,
): string {
  const icon = /литр|л\/|объём|бак/i.test(spec.label + spec.value) ? "💧" : "★";
  return `
    <div class="badge badge-br">
      <div class="badge-circle" style="border-color:${accentRed};color:${accentRed}; ${badgeExtraCss}">
        <div class="badge-circle-icon">${icon}</div>
        <div class="badge-circle-val">${escapeHtml(spec.value)}</div>
        <div class="badge-circle-lbl">${escapeHtml(spec.label)}</div>
      </div>
    </div>`;
}

export function renderInfographicHtml(
  data: InfographicData,
  options?: RenderInfographicOptions,
): string {
  const style = options?.style ?? DEFAULT_STYLE;
  const theme = buildSlideTheme(style);
  const accent = ACCENT[data.accentColor ?? "red"];
  const useMerged = Boolean(options?.mergedImageDataUrl);
  const hasPhoto = !useMerged && Boolean(options?.productImageSrc);
  const cutout = Boolean(options?.productImageCutout);
  const scene = getSceneLayers(data.backgroundScene);
  const showLeaves =
    !useMerged &&
    (data.backgroundScene === "outdoor_home" || data.backgroundScene === "nature");
  const visual = detectProductVisual(data);
  const brand = extractBrandName(data);
  const pill = extractCategoryPill(data);
  const spec0 = data.specBlocks[0];
  const spec1 = data.specBlocks[1] ?? data.specBlocks[0];

  const badgeRadius =
    style === "brutalism" || style === "swiss"
      ? "0"
      : style === "3d"
        ? "28px"
        : style === "glassmorphism"
          ? "24px"
          : "20px";

  const badgeGlass =
    style === "glassmorphism"
      ? "backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgba(37,99,235,0.78) !important;"
      : style === "neumorphism"
        ? "background: linear-gradient(145deg, #eef2f7, #d5dce6) !important; color: #1f2937 !important;"
        : "";

  const badgeExtraCss = `border: ${theme.trend.border}; box-shadow: ${theme.trend.shadow}; border-radius: ${badgeRadius}; ${badgeGlass}`;
  const badgeBg =
    style === "brutalism"
      ? theme.trend.accent
      : style === "retro"
        ? theme.trend.accent
        : accent.badge;
  const pillBg = style === "brutalism" ? theme.trend.foreground : theme.trend.accent;
  const pillColor = style === "brutalism" ? theme.trend.background : "#fff";
  const pillRadius = style === "brutalism" || style === "swiss" ? "0" : "8px";
  const pillShadow =
    style === "brutalism" ? theme.trend.shadow : "0 4px 16px rgba(0,0,0,0.25)";

  const productHtml =
    !useMerged && options?.productImageSrc
      ? renderProductPhoto(options.productImageSrc, data.productName, cutout)
      : !useMerged
        ? renderProductVisual(visual, accent.primary, data.productName)
        : "";

  const titleColor =
    style === "minimal" || style === "swiss" || style === "neumorphism" || style === "retro"
      ? theme.trend.foreground
      : "#ffffff";

  const mergedOverlay =
    style === "minimal" || style === "swiss"
      ? "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 40%, rgba(15,23,42,0.2) 100%)"
      : style === "glassmorphism"
        ? "linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.08) 42%, rgba(15,23,42,0.42) 100%)"
        : style === "brutalism"
          ? "linear-gradient(180deg, rgba(250,204,21,0.35) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.35) 100%)"
          : "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.06) 38%, rgba(0,0,0,0.28) 100%)";

  const slideBg = useMerged
    ? `background-image: url('${options!.mergedImageDataUrl}'); background-size: cover; background-position: center bottom;`
    : "";

  const sceneLayers = useMerged
    ? `<div class="merged-overlay"></div>`
    : `<div class="sky"></div>
    <div class="sky-decor"></div>
    <div class="grass"></div>
    <div class="grass-line"></div>
    ${scene.props}
    ${showLeaves ? renderLeaves() : ""}`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, height=1200" />
  <title>${escapeHtml(data.productName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1200px; height: 1200px; overflow: hidden;
      font-family: ${theme.fontFamily}, "Segoe UI", Arial, sans-serif;
    }

    .slide { position: relative; width: 1200px; height: 1200px; overflow: hidden; ${slideBg} }

    .merged-overlay {
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: ${mergedOverlay};
    }

    .sky {
      position: absolute; top: 0; left: 0; right: 0; height: 62%;
      background: ${scene.sky};
    }
    .sky-decor {
      position: absolute; top: 0; left: 0; right: 0; height: 62%;
      background: ${scene.decor};
      pointer-events: none; z-index: 1;
    }
    .grass {
      position: absolute; bottom: 0; left: 0; right: 0; height: ${scene.groundHeight};
      background: ${scene.ground};
    }
    .grass-line {
      position: absolute; left: 0; right: 0; top: 62%; height: 3px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      z-index: 2;
    }

    .leaf { position: absolute; z-index: 3; pointer-events: none; }
    .leaf-tl { top: 120px; left: -10px; width: 140px; height: 90px; transform: rotate(-12deg); }
    .leaf-tr { top: 280px; right: 20px; width: 110px; height: 75px; transform: rotate(18deg); }

    .hero-header {
      position: absolute; top: 36px; left: 48px; right: 48px;
      display: flex; justify-content: space-between; align-items: flex-start;
      z-index: 10;
    }
    .hero-title {
      font-size: 72px; font-weight: 900; line-height: 0.95;
      letter-spacing: 0.04em; text-transform: uppercase;
      color: ${titleColor};
      text-shadow: 0 4px 24px rgba(0,0,0,0.35);
    }
    .hero-pill {
      display: inline-block; margin-top: 10px;
      background: ${pillBg};
      color: ${pillColor}; font-size: 22px; font-weight: 700;
      padding: 8px 22px; border-radius: ${pillRadius};
      box-shadow: ${pillShadow};
      border: ${style === "brutalism" ? theme.trend.border : "none"};
    }
    .hero-brand {
      font-size: 26px; font-weight: 800; color: ${titleColor};
      opacity: 0.92; letter-spacing: 0.06em;
      text-transform: uppercase;
      text-shadow: 0 2px 8px rgba(0,0,0,0.3);
      padding-top: 8px;
    }

    .badge { position: absolute; z-index: 8; }

    .badge-tl {
      top: 200px; left: 44px;
      width: 148px; min-height: 148px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 16px 12px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.28);
      color: #fff;
    }
    .badge-big {
      font-size: 64px; font-weight: 900; line-height: 1;
    }
    .badge-sub {
      margin-top: 6px; font-size: 15px; font-weight: 700;
      text-align: center; line-height: 1.2; opacity: 0.95;
    }

    .badge-tr {
      top: 210px; right: 40px;
      max-width: 300px;
      padding: 16px 20px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.28);
      color: #fff;
    }
    .badge-icon-wrap {
      width: 44px; height: 44px; flex-shrink: 0;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }
    .badge-tr-text {
      font-size: 17px; font-weight: 800; line-height: 1.25;
    }

    .badge-br { bottom: 300px; right: 52px; }
    .badge-circle {
      width: 130px; height: 130px;
      border-radius: 50%;
      border: 5px solid;
      background: #fff;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      box-shadow: 0 10px 28px rgba(0,0,0,0.22);
      padding: 8px;
    }
    .badge-circle-icon { font-size: 22px; margin-bottom: 2px; }
    .badge-circle-val {
      font-size: 20px; font-weight: 900; line-height: 1.1;
      text-align: center;
    }
    .badge-circle-lbl {
      font-size: 11px; font-weight: 700; text-align: center;
      opacity: 0.85; margin-top: 2px;
    }

    .product-stage {
      position: absolute;
      left: 50%; bottom: 0;
      transform: translateX(-50%);
      z-index: 5;
      width: ${hasPhoto ? "920px" : "520px"};
      height: ${hasPhoto ? "720px" : "480px"};
      display: flex; align-items: flex-end; justify-content: center;
    }

    .product-photo-stage {
      position: relative; width: 100%; height: 100%;
      display: flex; align-items: flex-end; justify-content: center;
    }
    .product-photo {
      max-width: 100%;
      max-height: ${hasPhoto ? "700px" : "460px"};
      width: auto; height: auto;
      object-fit: contain;
      object-position: center bottom;
      position: relative; z-index: 2;
      filter: drop-shadow(0 30px 40px rgba(0,0,0,0.5)) contrast(1.05) saturate(1.08);
    }
    .product-photo-cutout {
      mix-blend-mode: normal;
      filter: drop-shadow(0 38px 48px rgba(0,0,0,0.55)) contrast(1.06) saturate(1.1);
    }
    .product-photo-fallback {
      mix-blend-mode: multiply;
    }
    .product-ground-glow {
      position: absolute; bottom: 12px; left: 50%;
      transform: translateX(-50%);
      width: 75%; height: 80px;
      background: radial-gradient(ellipse, rgba(0,0,0,0.28) 0%, transparent 72%);
      z-index: 0;
    }
    .product-photo-shadow {
      position: absolute; bottom: 8px; left: 50%;
      transform: translateX(-50%);
      width: 55%; height: 36px;
      background: radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%);
      z-index: 1;
    }

    ${SCENE_PROPS_CSS}

    /* CSS product fallbacks */
    .product-generator { position: relative; width: 480px; height: 340px; margin-bottom: 40px; }
    .gen-top { position: absolute; top: 20px; left: 60px; right: 60px; height: 24px; border-radius: 8px 8px 0 0; }
    .gen-body {
      position: absolute; top: 44px; left: 40px; right: 40px; height: 220px;
      background: linear-gradient(160deg, #2a2a2a, #111);
      border-radius: 12px; box-shadow: 0 28px 60px rgba(0,0,0,0.5);
      border: 2px solid #444;
    }
    .gen-side-vent {
      position: absolute; left: 18px; top: 30px; bottom: 30px; width: 30px;
      background: repeating-linear-gradient(180deg, #111 0 6px, #333 6px 12px);
      border-radius: 4px;
    }
    .gen-panel {
      position: absolute; right: 28px; top: 32px; width: 110px; height: 86px;
      background: linear-gradient(180deg, #f0f0f0, #ccc);
      border-radius: 8px; border: 2px solid #999; padding: 12px;
    }
    .gen-panel-line { height: 4px; background: #555; border-radius: 2px; margin-bottom: 8px; }
    .gen-panel-line.short { width: 60%; }
    .gen-panel-dot { width: 14px; height: 14px; border-radius: 50%; background: #22c55e; margin-top: 10px; }
    .gen-handle { position: absolute; top: -8px; right: 70px; width: 56px; height: 16px; border-radius: 4px; }
    .gen-wheel {
      position: absolute; bottom: 0; width: 48px; height: 48px;
      border-radius: 50%; background: #1a1a1a; border: 5px solid #555;
    }
    .gen-wheel-l { left: 80px; }
    .gen-wheel-r { right: 80px; }

    .product-appliance { width: 360px; height: 300px; margin-bottom: 50px; }
    .appl-body {
      width: 320px; height: 240px; margin: 0 auto;
      background: linear-gradient(180deg, #eee, #ccc);
      border-radius: 24px; box-shadow: 0 24px 48px rgba(0,0,0,0.4);
      position: relative;
    }
    .appl-screen { position: absolute; top: 36px; left: 36px; right: 36px; height: 90px; background: #1e293b; border-radius: 12px; }
    .appl-btn { position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%); width: 64px; height: 64px; border-radius: 50%; }

    .product-cosmetic { width: 220px; height: 340px; margin-bottom: 60px; }
    .cosm-cap { width: 90px; height: 44px; margin: 0 auto; border-radius: 10px 10px 0 0; }
    .cosm-tube {
      width: 110px; height: 260px; margin: 0 auto;
      background: linear-gradient(90deg, #f8fafc, #e2e8f0, #f8fafc);
      border-radius: 0 0 24px 24px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.35);
    }

    .product-generic { width: 380px; height: 300px; margin-bottom: 50px; }
    .generic-box {
      width: 340px; height: 250px; margin: 0 auto;
      background: linear-gradient(145deg, #374151, #1f2937);
      border-radius: 20px; border: 4px solid;
      box-shadow: 0 28px 56px rgba(0,0,0,0.45);
      overflow: hidden; position: relative;
    }
    .generic-shine {
      position: absolute; inset: -50%;
      background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
    }
  </style>
</head>
<body>
  <div class="slide" data-style="${style}">
    ${sceneLayers}

    <header class="hero-header">
      <div>
        <h1 class="hero-title">${escapeHtml(data.headline)}</h1>
        <div class="hero-pill">${escapeHtml(pill)}</div>
      </div>
      <div class="hero-brand">${escapeHtml(brand)}</div>
    </header>

    ${renderBadgeTopLeft(spec0, badgeBg, badgeExtraCss)}
    ${renderBadgeTopRight(data.mainBanner, badgeBg, badgeExtraCss)}
    ${renderBadgeBottomRight(spec1, accent.primary, badgeExtraCss)}

    ${productHtml ? `<div class="product-stage">${productHtml}</div>` : ""}
  </div>
</body>
</html>`;
}

import { readFileSync } from "fs";
import path from "path";
import type { InfographicStyle } from "@/lib/design-trends";
import {
  buildPlaqueSkinCss,
  buildPromoPlaqueHtml,
  buildSideBadgesLeftHtml,
  buildSideBadgesRightHtml,
  buildSpecPlaquesHtml,
} from "@/lib/marketplace-badges";
import { buildStyleSlideSkin } from "@/lib/style-slide-css";
import { getSceneLayers } from "@/lib/scene-backgrounds";
import type { InfographicData, RenderInfographicOptions } from "@/lib/infographic-template";
import type { InfographicSdInput } from "@/lib/validations";

export type LayoutType = InfographicSdInput["layout"];

const BULLET_ICONS = ["check_circle", "star", "bolt", "eco"] as const;

const ACCENT_HEX = {
  red: { primary: "#e31e24", dark: "#b91c1c", badge: "#2563eb" },
  blue: { primary: "#2563eb", dark: "#1d4ed8", badge: "#3b82f6" },
  purple: { primary: "#7c3aed", dark: "#6d28d9", badge: "#8b5cf6" },
  green: { primary: "#16a34a", dark: "#15803d", badge: "#22c55e" },
} as const;

let designSystemCssCache: string | null = null;
const templateCache = new Map<string, string>();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function templatesDir(): string {
  return path.join(process.cwd(), "templates");
}

function loadDesignSystemCss(): string {
  if (designSystemCssCache) return designSystemCssCache;
  designSystemCssCache = readFileSync(
    path.join(templatesDir(), "design-system.css"),
    "utf8",
  );
  return designSystemCssCache;
}

function loadTemplate(layout: LayoutType): string {
  const file =
    layout === "cards"
      ? "cards.html"
      : layout === "split"
        ? "split.html"
        : "hero.html";

  const cached = templateCache.get(file);
  if (cached) return cached;

  const html = readFileSync(path.join(templatesDir(), file), "utf8");
  templateCache.set(file, html);
  return html;
}

function replaceAll(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function uniqueBullets(bullets: string[], exclude?: string): string[] {
  const excludeKey = exclude?.trim().toLowerCase() ?? "";
  const seen = new Set<string>();
  return bullets.filter((raw) => {
    const text = raw.trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return false;
    if (excludeKey && (key === excludeKey || excludeKey.includes(key) || key.includes(excludeKey))) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildBulletsHtml(
  bullets: string[],
  excludeBanner?: string,
  alsoExclude: string[] = [],
): string {
  let list = uniqueBullets(bullets, excludeBanner);
  if (alsoExclude.length > 0) {
    const blocklist = new Set(alsoExclude.map((t) => t.trim().toLowerCase()).filter(Boolean));
    list = list.filter((text) => {
      const key = text.trim().toLowerCase();
      return ![...blocklist].some((ex) => key.includes(ex) || ex.includes(key));
    });
  }
  const items = list.slice(0, 3).map((text, index) => {
    const icon = BULLET_ICONS[index % BULLET_ICONS.length];
    return `
      <li class="bullet-item">
        <span class="material-symbols-outlined bullet-icon" aria-hidden="true">${icon}</span>
        <span class="bullet-text">${escapeHtml(text)}</span>
      </li>`;
  });

  return `<ul class="bullet-list">${items.join("")}</ul>`;
}

function buildSkinCss(
  style: InfographicStyle,
  accent: (typeof ACCENT_HEX)[keyof typeof ACCENT_HEX],
): string {
  const skin = buildStyleSlideSkin(style);
  return `
    :root {
      --accent: ${accent.primary};
      --accent-dark: ${accent.dark};
      --accent-badge: ${accent.badge};
      --title-color: ${skin.titleColor};
      --brand-color: ${skin.brandColor};
      --subtitle-color: ${skin.badgeTextColor === "#111" ? "rgba(17,24,39,0.85)" : "rgba(255,255,255,0.9)"};
    }
    .canvas { ${skin.slideFrameCss} filter: ${skin.slideFilter}; }
    .display-title { ${skin.titleExtraCss} }
    .accent-pill { background: ${skin.badgeBg}; color: ${skin.badgeTextColor}; border-radius: ${skin.pillRadius}; box-shadow: ${skin.pillShadow}; }
    .bullet-item { border-radius: ${skin.badgeRadius}; background: ${skin.badgeBg}; color: ${skin.badgeTextColor}; ${skin.badgeExtraCss} }
    ${buildPlaqueSkinCss(style, skin)}
  `;
}

function buildProductHtml(
  productHtml: string,
  hasPhoto: boolean,
  layout: LayoutType,
): string {
  if (!productHtml) {
    return `<div class="product-frame" style="min-height:200px;"></div>`;
  }
  const frameClass = hasPhoto
    ? "product-frame product-frame--has-photo"
    : "product-frame";
  const inner = `<div class="${frameClass}">${productHtml}</div>`;
  if (layout === "hero" || layout === "minimal") {
    return inner;
  }
  return `<div class="product-wrap">${inner}</div>`;
}

function buildBackgroundLayers(
  data: InfographicData,
  options: RenderInfographicOptions | undefined,
  skin: ReturnType<typeof buildStyleSlideSkin>,
): { backgroundStyle: string; overlayHtml: string } {
  const useMerged = Boolean(options?.mergedImageDataUrl);
  const useSdBg = !useMerged && Boolean(options?.backgroundDataUrl);

  if (useMerged) {
    return {
      backgroundStyle: `background-image: url('${options!.mergedImageDataUrl}'); background-size: cover; background-position: center bottom;`,
      overlayHtml: `<div class="canvas-overlay" style="background:${skin.mergedOverlay};"></div>`,
    };
  }

  if (useSdBg) {
    return {
      backgroundStyle: `background-image: url('${options!.backgroundDataUrl}'); background-size: cover; background-position: center bottom;`,
      overlayHtml: `<div class="canvas-overlay" style="background:${skin.mergedOverlay};"></div>
        <div class="canvas-overlay ground-vignette"></div>`,
    };
  }

  if (options?.backgroundCss) {
    return {
      backgroundStyle: `background: ${options.backgroundCss};`,
      overlayHtml: "",
    };
  }

  const scene = getSceneLayers(data.backgroundScene);
  return {
    backgroundStyle: `background: ${scene.ground};`,
    overlayHtml: `
      <div class="canvas-overlay" style="height:62%;background:${scene.sky};"></div>
      <div class="canvas-overlay" style="top:62%;height:38%;background:${scene.ground};opacity:0.85;"></div>
      ${scene.props}`,
  };
}

export type RenderLayoutOptions = RenderInfographicOptions & {
  layout?: LayoutType;
  productStageHtml?: string;
  hasPhoto?: boolean;
};

export function renderLayoutHtml(
  data: InfographicData,
  options?: RenderLayoutOptions,
): string {
  const layout = options?.layout ?? "hero";
  const style = options?.style ?? "modern";
  const skin = buildStyleSlideSkin(style);
  const accent = ACCENT_HEX[data.accentColor ?? "red"];

  const bullets = data.callouts.map((c) => c.text);
  const specExclude =
    layout === "hero" || layout === "minimal"
      ? data.specBlocks.flatMap((s) => [s.value, s.label, `${s.value} ${s.label}`])
      : [];
  const { backgroundStyle, overlayHtml } = buildBackgroundLayers(data, options, skin);

  const productInner = options?.productStageHtml ?? "";
  const hasPhoto = Boolean(options?.hasPhoto ?? options?.productImageSrc);

  const template = loadTemplate(layout);
  const designCss = loadDesignSystemCss();

  const vars: Record<string, string> = {
    PRODUCT_NAME: escapeHtml(data.productName),
    STYLE: style,
    HEADLINE: escapeHtml(data.headline),
    SUBTITLE: escapeHtml(data.categoryPill ?? data.productName),
    BRAND: escapeHtml(data.brandName ?? data.productName),
    BULLETS_HTML: buildBulletsHtml(bullets, data.mainBanner.title, specExclude),
    SPEC_CARDS_HTML: buildSpecPlaquesHtml(data.specBlocks, skin, accent.primary, style),
    PROMO_HTML:
      layout === "hero" || layout === "minimal"
        ? ""
        : buildPromoPlaqueHtml(data.mainBanner, skin, accent.primary, style),
    SIDE_BADGES_LEFT:
      layout === "hero" || layout === "minimal"
        ? buildSideBadgesLeftHtml(data, skin, accent.primary, style)
        : "",
    SIDE_BADGES_RIGHT:
      layout === "hero" || layout === "minimal"
        ? buildSideBadgesRightHtml(data, skin, accent.primary, style)
        : "",
    PRODUCT_HTML: buildProductHtml(productInner, hasPhoto, layout),
    BACKGROUND_STYLE: backgroundStyle,
    OVERLAY_HTML: overlayHtml,
    DESIGN_SYSTEM_CSS: designCss,
    SKIN_CSS: buildSkinCss(style, accent),
  };

  return replaceAll(template, vars);
}

export function renderProductPhotoHtml(
  imageSrc: string,
  productName: string,
  cutout: boolean,
): string {
  const cls = cutout ? "product-photo product-photo--cutout" : "product-photo";
  return `<img class="${cls}" src="${imageSrc}" alt="${escapeHtml(productName)}" />`;
}

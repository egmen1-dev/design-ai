import type { BadgeBuildInput } from "./types";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function estimateTextWidth(text: string, fontSizePx: number): number {
  return Math.max(fontSizePx * 0.55 * text.length, fontSizePx * 2);
}

function gradientDef(model: BadgeBuildInput["model"], accent: string, id: string): string {
  if (model.gradient === "flat" || model.gradient === "transparent") return "";
  const c1 = model.fillColor ?? accent;
  const c2 = accent;
  return `<defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${c1}" stop-opacity="${model.opacity / 100}"/>
    <stop offset="100%" stop-color="${c2}" stop-opacity="${Math.min(1, model.opacity / 100 + 0.05)}"/>
  </linearGradient></defs>`;
}

function shadowFilter(shadow: BadgeBuildInput["model"]["shadow"], id: string): string {
  if (shadow === "none") return "";
  const blur = shadow === "soft" ? 8 : shadow === "medium" ? 14 : 4;
  const dy = shadow === "hard" ? 4 : 3;
  return `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-opacity="0.35"/>
  </filter></defs>`;
}

/** Параметрическая плашка — всегда строится заново под текст */
export function buildParametricBadgeSvg(input: BadgeBuildInput): string {
  const { model, text, fontSizePx, accentColor, icon } = input;
  const textW = estimateTextWidth(text, fontSizePx);
  const iconW = icon && model.iconPosition !== "none" ? fontSizePx * 1.4 : 0;
  const gap = iconW > 0 ? 8 : 0;

  let width = model.paddingX * 2 + textW + iconW + gap;
  const height = model.paddingY * 2 + fontSizePx * 1.15;
  let rx = model.cornerStyle === "sharp" ? 0 : model.radius;

  if (model.adaptive && text.length > 18) {
    width = Math.min(width, (input.maxWidthPct ?? 42) * 9);
  }
  if (model.cornerStyle === "pill") {
    rx = height / 2;
  }

  const gradId = "bgGrad";
  const filtId = "sh";
  const fill =
    model.gradient === "flat" || model.gradient === "transparent"
      ? model.fillColor ?? "transparent"
      : `url(#${gradId})`;
  const stroke = model.borderWidth > 0 ? model.borderColor ?? accentColor : "none";
  const filter = model.shadow !== "none" ? `filter="url(#${filtId})"` : "";

  const textX =
    model.iconPosition === "left" && iconW
      ? model.paddingX + iconW + gap
      : model.paddingX;
  const textColor = model.textColor ?? "#ffffff";

  const iconSvg =
    icon && model.iconPosition === "left"
      ? `<text x="${model.paddingX}" y="${height / 2 + fontSizePx * 0.35}" font-size="${fontSizePx * 0.9}" fill="${textColor}" font-family="Material Symbols Outlined">${escapeXml(icon)}</text>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="${Math.round(height)}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" role="img" aria-label="${escapeXml(text)}">
  ${gradientDef(model, accentColor, gradId)}
  ${shadowFilter(model.shadow, filtId)}
  <rect x="0" y="0" width="${Math.round(width)}" height="${Math.round(height)}" rx="${rx}" ry="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${model.borderWidth}" ${filter}/>
  ${iconSvg}
  <text x="${textX}" y="${height / 2 + fontSizePx * 0.35}" font-size="${fontSizePx}" font-weight="700" fill="${textColor}" font-family="inherit">${escapeXml(text)}</text>
</svg>`;
}

export function buildParametricBadgeHtml(input: BadgeBuildInput): string {
  const svg = buildParametricBadgeSvg(input);
  return `<div class="parametric-badge" style="display:inline-flex;align-items:center;max-width:100%;">${svg}</div>`;
}

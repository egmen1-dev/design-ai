import {
  DEFAULT_STYLE,
  TRENDS,
  buildSlideTheme,
  type InfographicStyle,
} from "@/lib/design-trends";
import type { InfographicSdInput } from "@/lib/validations";

export type SdVisualTheme = {
  style: InfographicStyle;
  fontFamily: string;
  accent: string;
  accentSecondary: string;
  foreground: string;
  badgeRadius: string;
  badgeExtraCss: string;
  badgeGlassCss: string;
  overlayCss: string;
  titleCss: string;
  brandCss: string;
  pillCss: string;
  badgeTextColor: string;
  watermarkCss: string;
  isLight: boolean;
};

function isLightStyle(style: InfographicStyle): boolean {
  return style === "minimal" || style === "swiss" || style === "neumorphism" || style === "retro";
}

export function applyStyleToSdColors(
  data: InfographicSdInput,
  style: InfographicStyle,
): InfographicSdInput {
  const trend = TRENDS[style];
  const dark = data.colors[2] ?? "#0f172a";
  const secondary =
    style === "modern" || style === "glassmorphism"
      ? "#2563eb"
      : data.colors[1] ?? trend.accent;
  return {
    ...data,
    colors: [trend.accent, secondary, dark],
  };
}

export function buildSdVisualTheme(
  data: InfographicSdInput,
  style: InfographicStyle = DEFAULT_STYLE,
): SdVisualTheme {
  const theme = buildSlideTheme(style);
  const trend = theme.trend;
  const isLight = isLightStyle(style);
  const accent = data.colors[0] ?? trend.accent;
  const accentSecondary = data.colors[1] ?? trend.accent;

  const badgeRadius =
    style === "brutalism" || style === "swiss" ? "0" : style === "3d" ? "28px" : "18px";

  const badgeGlassCss =
    style === "glassmorphism"
      ? "backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgba(255,255,255,0.16) !important;"
      : "";

  const overlayCss = isLight
    ? "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.2) 42%, rgba(15,23,42,0.18) 100%)"
    : style === "glassmorphism"
      ? "linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.12) 45%, rgba(15,23,42,0.45) 100%)"
      : "linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.38) 100%)";

  const titleCss = isLight
    ? `color: ${trend.foreground}; text-shadow: 0 2px 16px rgba(255,255,255,0.8);`
    : `color: #ffffff; text-shadow: 0 4px 28px rgba(0,0,0,0.55);`;

  const brandCss = isLight
    ? `color: ${trend.accent}; text-shadow: none;`
    : `color: #ffffff; text-shadow: 0 2px 12px rgba(0,0,0,0.45);`;

  const badgeTextColor = isLight && style !== "brutalism" ? trend.foreground : "#ffffff";

  return {
    style,
    fontFamily: theme.fontFamily,
    accent,
    accentSecondary,
    foreground: trend.foreground,
    badgeRadius,
    badgeExtraCss: `border: ${trend.border}; box-shadow: ${trend.shadow};`,
    badgeGlassCss,
    overlayCss,
    titleCss,
    brandCss,
    pillCss: `background: ${accent}; color: #fff; box-shadow: ${trend.shadow};`,
    badgeTextColor,
    watermarkCss: isLight
      ? "color: rgba(15,23,42,0.75); background: rgba(255,255,255,0.65);"
      : "color: rgba(255,255,255,0.92); background: rgba(0,0,0,0.38);",
    isLight,
  };
}

export function badgeFill(
  visual: SdVisualTheme,
  role: "square" | "banner" | "circle",
): string {
  if (visual.style === "glassmorphism") {
    return role === "circle"
      ? "background: rgba(255,255,255,0.92);"
      : "background: rgba(37,99,235,0.72);";
  }
  if (visual.style === "neumorphism") {
    return role === "circle"
      ? "background: #e0e5ec;"
      : "background: linear-gradient(145deg, #eef2f7, #d5dce6); color: #1f2937;";
  }
  if (visual.style === "brutalism") {
    return role === "circle"
      ? "background: #fff;"
      : `background: ${visual.accentSecondary};`;
  }
  if (visual.style === "retro") {
    return role === "circle"
      ? "background: #fff7ed;"
      : `background: ${visual.accentSecondary};`;
  }
  return role === "circle"
    ? "background: #ffffff;"
    : `background: ${visual.accentSecondary};`;
}

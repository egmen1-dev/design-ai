export const STYLE_KEYS = [
  "glassmorphism",
  "minimal",
  "modern",
  "neumorphism",
  "brutalism",
  "3d",
  "retro",
  "swiss",
] as const;

export type InfographicStyle = (typeof STYLE_KEYS)[number];

export const STYLE_LABELS: Record<InfographicStyle, string> = {
  glassmorphism: "Glassmorphism",
  minimal: "Минимализм",
  modern: "Modern",
  neumorphism: "Неоморфизм",
  brutalism: "Брутализм",
  "3d": "3D",
  retro: "Ретро",
  swiss: "Швейцарский",
};

export type TrendDefinition = {
  background: string;
  foreground: string;
  accent: string;
  border: string;
  shadow: string;
  css: string;
  font: string;
};

export const TRENDS = {
  glassmorphism: {
    background:
      "linear-gradient(135deg, rgba(14,165,233,0.28), rgba(168,85,247,0.28)), #0f172a",
    foreground: "#ffffff",
    accent: "#00c6ff",
    border: "1px solid rgba(255,255,255,0.3)",
    shadow: "0 8px 32px rgba(0,0,0,0.18)",
    css: "backdrop-filter: blur(10px); border-radius: 24px;",
    font: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  minimal: {
    background: "#fafafa",
    foreground: "#111827",
    accent: "#2563eb",
    border: "1px solid #e5e7eb",
    shadow: "0 10px 30px rgba(17,24,39,0.06)",
    css: "border-radius: 18px; letter-spacing: -0.02em;",
    font: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  modern: {
    background: "linear-gradient(135deg, #020617 0%, #111827 50%, #1e1b4b 100%)",
    foreground: "#f8fafc",
    accent: "#22d3ee",
    border: "1px solid rgba(148,163,184,0.22)",
    shadow: "0 28px 80px rgba(2,6,23,0.45)",
    css: "border-radius: 32px; overflow: hidden;",
    font: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  neumorphism: {
    background: "#e0e5ec",
    foreground: "#1f2937",
    accent: "#6366f1",
    border: "1px solid rgba(255,255,255,0.6)",
    shadow: "16px 16px 32px #bec3c9, -16px -16px 32px #ffffff",
    css: "border-radius: 28px;",
    font: "Avenir Next, Inter, ui-sans-serif, system-ui, sans-serif",
  },
  brutalism: {
    background: "#facc15",
    foreground: "#111111",
    accent: "#ef4444",
    border: "4px solid #111111",
    shadow: "10px 10px 0 #111111",
    css: "border-radius: 0; text-transform: uppercase;",
    font: "Arial Black, Impact, ui-sans-serif, system-ui, sans-serif",
  },
  "3d": {
    background:
      "radial-gradient(circle at 20% 20%, #f0abfc 0%, transparent 28%), linear-gradient(135deg, #312e81, #0f172a)",
    foreground: "#ffffff",
    accent: "#fbbf24",
    border: "1px solid rgba(255,255,255,0.22)",
    shadow: "0 40px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
    css: "border-radius: 34px; transform-style: preserve-3d;",
    font: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  retro: {
    background: "linear-gradient(135deg, #ffedd5, #fed7aa)",
    foreground: "#3b1d0f",
    accent: "#ea580c",
    border: "3px solid #7c2d12",
    shadow: "8px 8px 0 rgba(124,45,18,0.35)",
    css: "border-radius: 20px; filter: saturate(1.08);",
    font: "Georgia, ui-serif, serif",
  },
  swiss: {
    background: "#ffffff",
    foreground: "#0f172a",
    accent: "#e11d48",
    border: "1px solid #0f172a",
    shadow: "none",
    css: "border-radius: 0; letter-spacing: -0.04em;",
    font: "Helvetica Neue, Arial, ui-sans-serif, system-ui, sans-serif",
  },
} satisfies Record<InfographicStyle, TrendDefinition>;

export const DEFAULT_STYLE: InfographicStyle = "modern";

/** Мягкая атмосфера сцены — без «домиков» и детского неба/травы */
export const SCENE_ATMOSPHERE: Record<string, string> = {
  outdoor_home:
    "radial-gradient(ellipse 900px 500px at 50% 100%, rgba(34,197,94,0.18) 0%, transparent 55%), radial-gradient(ellipse 500px 300px at 20% 15%, rgba(255,255,255,0.12) 0%, transparent 70%)",
  kitchen:
    "radial-gradient(ellipse 700px 400px at 80% 90%, rgba(251,146,60,0.15) 0%, transparent 60%), radial-gradient(circle at 15% 20%, rgba(255,255,255,0.2) 0%, transparent 45%)",
  bathroom:
    "radial-gradient(ellipse 800px 450px at 50% 100%, rgba(186,230,253,0.25) 0%, transparent 55%)",
  office:
    "radial-gradient(ellipse 600px 350px at 85% 30%, rgba(59,130,246,0.12) 0%, transparent 55%)",
  nature:
    "radial-gradient(ellipse 900px 500px at 50% 100%, rgba(74,222,128,0.2) 0%, transparent 55%), radial-gradient(circle at 75% 25%, rgba(255,255,255,0.15) 0%, transparent 40%)",
  studio:
    "radial-gradient(ellipse 700px 500px at 50% 55%, rgba(255,255,255,0.14) 0%, transparent 65%)",
};

export function getSceneAtmosphere(backgroundScene: string): string {
  return SCENE_ATMOSPHERE[backgroundScene] ?? SCENE_ATMOSPHERE.studio;
}

export function buildSlideTheme(style: InfographicStyle) {
  const trend = TRENDS[style];
  const isLight = trend.foreground.startsWith("#0") || trend.foreground.startsWith("#1") || trend.foreground.startsWith("#3");

  return {
    trend,
    slideBackground: trend.background,
    fontFamily: trend.font,
    headlineCss: isLight
      ? `color: ${trend.foreground}; text-shadow: none; background: none; -webkit-text-fill-color: ${trend.foreground};`
      : `background: linear-gradient(180deg, #ffffff 10%, ${trend.accent}88 55%, ${trend.accent} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`,
    specValueBg: trend.accent,
    specLabelBg: isLight ? "#ffffff" : "rgba(255,255,255,0.95)",
    specLabelColor: isLight ? trend.foreground : "#111827",
    specLabelHintColor: isLight ? "#6b7280" : "#6b7280",
    specsRowCss: `border: ${trend.border}; box-shadow: ${trend.shadow}; ${trend.css}`,
    bannerCss: `background: linear-gradient(135deg, ${trend.accent} 0%, ${shadeColor(trend.accent, -20)} 100%); border: ${trend.border}; box-shadow: ${trend.shadow}; ${trend.css}`,
    calloutCss: isLight
      ? `background: ${trend.foreground}; color: ${trend.background}; border: ${trend.border}; box-shadow: ${trend.shadow};`
      : `background: rgba(15,23,42,0.88); color: #fff; border: ${trend.border};`,
    pointerStroke: isLight ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.85)",
  };
}

function shadeColor(hex: string, percent: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const num = parseInt(normalized, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

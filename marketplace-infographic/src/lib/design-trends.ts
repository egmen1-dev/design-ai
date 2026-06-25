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

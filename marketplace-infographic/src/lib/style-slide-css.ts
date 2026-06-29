import { TRENDS, type InfographicStyle } from "@/lib/design-trends";

export type StyleSlideSkin = {
  slideFrameCss: string;
  mergedOverlay: string;
  slideFilter: string;
  titleColor: string;
  titleExtraCss: string;
  pillBg: string;
  pillColor: string;
  pillRadius: string;
  pillShadow: string;
  pillBorder: string;
  badgeRadius: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeExtraCss: string;
  circleRadius: string;
  circleBg: string;
  brandColor: string;
  styleLabel: string;
};

export function buildStyleSlideSkin(style: InfographicStyle): StyleSlideSkin {
  const trend = TRENDS[style];

  switch (style) {
    case "brutalism":
      return {
        slideFrameCss:
          "border: 12px solid #111; outline: 6px solid #facc15; background-color: #facc15;",
        mergedOverlay:
          "linear-gradient(180deg, rgba(250,204,21,0.72) 0%, rgba(250,204,21,0.18) 42%, rgba(0,0,0,0.55) 100%)",
        slideFilter: "contrast(1.15) saturate(0.85)",
        titleColor: "#111",
        titleExtraCss:
          "background: #facc15; display: inline-block; padding: 8px 16px; border: 4px solid #111; box-shadow: 8px 8px 0 #111;",
        pillBg: "#111",
        pillColor: "#facc15",
        pillRadius: "0",
        pillShadow: "6px 6px 0 #111",
        pillBorder: "4px solid #111",
        badgeRadius: "0",
        badgeBg: "#ef4444",
        badgeTextColor: "#111",
        badgeExtraCss: `border: 4px solid #111; box-shadow: 8px 8px 0 #111; background: #ef4444;`,
        circleRadius: "0",
        circleBg: "#fff",
        brandColor: "#111",
        styleLabel: "БРУТАЛИЗМ",
      };
    case "minimal":
      return {
        slideFrameCss: "border: 1px solid #e5e7eb; background: #fafafa;",
        mergedOverlay:
          "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.2) 45%, rgba(15,23,42,0.22) 100%)",
        slideFilter: "saturate(0.92) brightness(1.04)",
        titleColor: "#111827",
        titleExtraCss: "letter-spacing: -0.03em;",
        pillBg: "#2563eb",
        pillColor: "#fff",
        pillRadius: "999px",
        pillShadow: "0 8px 24px rgba(37,99,235,0.25)",
        pillBorder: "none",
        badgeRadius: "18px",
        badgeBg: "#111827",
        badgeTextColor: "#fff",
        badgeExtraCss: `border: 1px solid #e5e7eb; box-shadow: ${trend.shadow}; background: #111827;`,
        circleRadius: "50%",
        circleBg: "#fff",
        brandColor: "#2563eb",
        styleLabel: "МИНИМАЛИЗМ",
      };
    case "glassmorphism":
      return {
        slideFrameCss: "border: 1px solid rgba(255,255,255,0.25);",
        mergedOverlay:
          "linear-gradient(180deg, rgba(14,165,233,0.45) 0%, rgba(168,85,247,0.12) 45%, rgba(15,23,42,0.5) 100%)",
        slideFilter: "saturate(1.1)",
        titleColor: "#fff",
        titleExtraCss: "text-shadow: 0 4px 24px rgba(0,198,255,0.45);",
        pillBg: "rgba(0,198,255,0.85)",
        pillColor: "#fff",
        pillRadius: "24px",
        pillShadow: "0 8px 32px rgba(0,0,0,0.25)",
        pillBorder: "1px solid rgba(255,255,255,0.35)",
        badgeRadius: "24px",
        badgeBg: "rgba(37,99,235,0.72)",
        badgeTextColor: "#fff",
        badgeExtraCss:
          "backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.35); box-shadow: 0 8px 32px rgba(0,0,0,0.22);",
        circleRadius: "50%",
        circleBg: "rgba(255,255,255,0.92)",
        brandColor: "#00c6ff",
        styleLabel: "GLASS",
      };
    case "neumorphism":
      return {
        slideFrameCss: "background: #e0e5ec; border: 1px solid rgba(255,255,255,0.7);",
        mergedOverlay:
          "linear-gradient(180deg, rgba(224,229,236,0.75) 0%, rgba(224,229,236,0.2) 50%, rgba(99,102,241,0.18) 100%)",
        slideFilter: "brightness(1.03)",
        titleColor: "#1f2937",
        titleExtraCss: "text-shadow: 2px 2px 4px #fff, -2px -2px 4px #bec3c9;",
        pillBg: "#6366f1",
        pillColor: "#fff",
        pillRadius: "28px",
        pillShadow: "8px 8px 16px #bec3c9, -8px -8px 16px #ffffff",
        pillBorder: "none",
        badgeRadius: "28px",
        badgeBg: "linear-gradient(145deg, #eef2f7, #d5dce6)",
        badgeTextColor: "#1f2937",
        badgeExtraCss: "box-shadow: 12px 12px 24px #bec3c9, -12px -12px 24px #ffffff; border: 1px solid rgba(255,255,255,0.65);",
        circleRadius: "50%",
        circleBg: "#e0e5ec",
        brandColor: "#6366f1",
        styleLabel: "NEUMORPH",
      };
    case "retro":
      return {
        slideFrameCss: "border: 4px solid #7c2d12; background: #ffedd5;",
        mergedOverlay:
          "linear-gradient(180deg, rgba(255,237,213,0.65) 0%, rgba(234,88,12,0.12) 50%, rgba(60,29,15,0.35) 100%)",
        slideFilter: "sepia(0.22) saturate(1.15)",
        titleColor: "#3b1d0f",
        titleExtraCss: "font-style: italic;",
        pillBg: "#ea580c",
        pillColor: "#fff7ed",
        pillRadius: "20px",
        pillShadow: "8px 8px 0 rgba(124,45,18,0.35)",
        pillBorder: "3px solid #7c2d12",
        badgeRadius: "20px",
        badgeBg: "#ea580c",
        badgeTextColor: "#fff7ed",
        badgeExtraCss: "border: 3px solid #7c2d12; box-shadow: 8px 8px 0 rgba(124,45,18,0.35);",
        circleRadius: "50%",
        circleBg: "#fff7ed",
        brandColor: "#7c2d12",
        styleLabel: "РЕТРО",
      };
    case "swiss":
      return {
        slideFrameCss: "border: 3px solid #0f172a; background: #fff;",
        mergedOverlay:
          "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 50%, rgba(225,29,72,0.15) 100%)",
        slideFilter: "none",
        titleColor: "#0f172a",
        titleExtraCss: "letter-spacing: -0.05em;",
        pillBg: "#e11d48",
        pillColor: "#fff",
        pillRadius: "0",
        pillShadow: "none",
        pillBorder: "2px solid #0f172a",
        badgeRadius: "0",
        badgeBg: "#e11d48",
        badgeTextColor: "#fff",
        badgeExtraCss: "border: 2px solid #0f172a; box-shadow: none;",
        circleRadius: "0",
        circleBg: "#fff",
        brandColor: "#e11d48",
        styleLabel: "SWISS",
      };
    case "3d":
      return {
        slideFrameCss: "border: 1px solid rgba(255,255,255,0.2);",
        mergedOverlay:
          "linear-gradient(180deg, rgba(49,46,129,0.55) 0%, rgba(251,191,36,0.12) 45%, rgba(15,23,42,0.55) 100%)",
        slideFilter: "saturate(1.2) contrast(1.08)",
        titleColor: "#fff",
        titleExtraCss: "text-shadow: 0 6px 0 rgba(0,0,0,0.35);",
        pillBg: "linear-gradient(135deg, #fbbf24, #f59e0b)",
        pillColor: "#111",
        pillRadius: "34px",
        pillShadow: "0 20px 40px rgba(0,0,0,0.35)",
        pillBorder: "none",
        badgeRadius: "28px",
        badgeBg: "linear-gradient(135deg, #7c3aed, #4f46e5)",
        badgeTextColor: "#fff",
        badgeExtraCss: "box-shadow: 0 24px 48px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.22);",
        circleRadius: "50%",
        circleBg: "#fff",
        brandColor: "#fbbf24",
        styleLabel: "3D",
      };
    default:
      return {
        slideFrameCss: "",
        mergedOverlay:
          "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.06) 38%, rgba(0,0,0,0.28) 100%)",
        slideFilter: "none",
        titleColor: "#fff",
        titleExtraCss: "",
        pillBg: trend.accent,
        pillColor: "#fff",
        pillRadius: "8px",
        pillShadow: "0 4px 16px rgba(0,0,0,0.25)",
        pillBorder: "none",
        badgeRadius: "20px",
        badgeBg: "#2563eb",
        badgeTextColor: "#fff",
        badgeExtraCss: `border: ${trend.border}; box-shadow: ${trend.shadow};`,
        circleRadius: "50%",
        circleBg: "#fff",
        brandColor: "#fff",
        styleLabel: "MODERN",
      };
  }
}

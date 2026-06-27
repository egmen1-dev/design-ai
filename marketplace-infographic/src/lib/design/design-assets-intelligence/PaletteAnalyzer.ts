import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type { PaletteModel } from "./types";

const CATEGORY_PALETTES: Record<KnowledgeCategory, PaletteModel[]> = {
  tools: [
    {
      name: "Industrial Graphite",
      primary: "#1f2937",
      secondary: "#4b5563",
      accent: "#f97316",
      background: "#f3f4f6",
      contrast: 8.2,
      premiumScore: 72,
      marketplaceScore: 88,
      emotion: "надёжность",
      categories: ["tools", "auto"],
    },
  ],
  electronics: [
    {
      name: "Tech Midnight",
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#06b6d4",
      background: "#0b1220",
      contrast: 9.1,
      premiumScore: 85,
      marketplaceScore: 91,
      emotion: "технологичность",
      categories: ["electronics"],
    },
  ],
  cosmetics: [
    {
      name: "Rose Premium",
      primary: "#831843",
      secondary: "#be185d",
      accent: "#fda4af",
      background: "#fff1f2",
      contrast: 7.5,
      premiumScore: 92,
      marketplaceScore: 86,
      emotion: "красота",
      categories: ["cosmetics", "premium"],
    },
  ],
  furniture: [
    {
      name: "Warm Home",
      primary: "#44403c",
      secondary: "#78716c",
      accent: "#ca8a04",
      background: "#fafaf9",
      contrast: 7.8,
      marketplaceScore: 84,
      premiumScore: 78,
      emotion: "уют",
      categories: ["furniture", "home"],
    },
  ],
  kids: [
    {
      name: "Playful Pop",
      primary: "#7c3aed",
      secondary: "#a78bfa",
      accent: "#facc15",
      background: "#fef9c3",
      contrast: 6.9,
      marketplaceScore: 90,
      premiumScore: 70,
      emotion: "радость",
      categories: ["kids"],
    },
  ],
  clothes: [
    {
      name: "Editorial Noir",
      primary: "#18181b",
      secondary: "#3f3f46",
      accent: "#e11d48",
      background: "#fafafa",
      contrast: 8.5,
      marketplaceScore: 87,
      premiumScore: 88,
      emotion: "стиль",
      categories: ["clothes", "fashion"],
    },
  ],
  auto: [
    {
      name: "Garage Steel",
      primary: "#111827",
      secondary: "#374151",
      accent: "#ef4444",
      background: "#e5e7eb",
      contrast: 8.8,
      marketplaceScore: 89,
      premiumScore: 80,
      emotion: "мощь",
      categories: ["auto"],
    },
  ],
  pets: [
    {
      name: "Friendly Warm",
      primary: "#92400e",
      secondary: "#b45309",
      accent: "#34d399",
      background: "#fffbeb",
      contrast: 7.2,
      marketplaceScore: 85,
      premiumScore: 74,
      emotion: "забота",
      categories: ["pets"],
    },
  ],
  kitchen: [
    {
      name: "Clean Kitchen",
      primary: "#1e3a5f",
      secondary: "#2563eb",
      accent: "#22c55e",
      background: "#ffffff",
      contrast: 8.0,
      marketplaceScore: 88,
      premiumScore: 76,
      emotion: "чистота",
      categories: ["kitchen", "home"],
    },
  ],
  sports: [
    {
      name: "Energy Dynamic",
      primary: "#0c4a6e",
      secondary: "#0369a1",
      accent: "#f97316",
      background: "#e0f2fe",
      contrast: 7.9,
      marketplaceScore: 90,
      premiumScore: 82,
      emotion: "энергия",
      categories: ["sports"],
    },
  ],
  home: [
    {
      name: "Soft Neutral",
      primary: "#334155",
      secondary: "#64748b",
      accent: "#0ea5e9",
      background: "#f8fafc",
      contrast: 7.6,
      marketplaceScore: 86,
      premiumScore: 75,
      emotion: "комфорт",
      categories: ["home"],
    },
  ],
  generator: [
    {
      name: "Power Orange",
      primary: "#1a1a2e",
      secondary: "#16213e",
      accent: "#f97316",
      background: "#0f172a",
      contrast: 9.0,
      marketplaceScore: 93,
      premiumScore: 84,
      emotion: "мощность",
      categories: ["generator", "tools"],
    },
  ],
  generic: [
    {
      name: "Marketplace Default",
      primary: "#1e293b",
      secondary: "#475569",
      accent: "#2563eb",
      background: "#ffffff",
      contrast: 8.1,
      marketplaceScore: 85,
      premiumScore: 72,
      emotion: "доверие",
      categories: ["generic"],
    },
  ],
};

export function getPalettesForCategory(category: KnowledgeCategory): PaletteModel[] {
  return CATEGORY_PALETTES[category] ?? CATEGORY_PALETTES.generic;
}

export function rankPalettes(
  palettes: PaletteModel[],
  category: KnowledgeCategory,
): PaletteModel[] {
  return [...palettes].sort((a, b) => {
    const aCat = a.categories.includes(category) ? 1 : 0;
    const bCat = b.categories.includes(category) ? 1 : 0;
    if (aCat !== bCat) return bCat - aCat;
    return b.marketplaceScore - a.marketplaceScore;
  });
}

export function paletteToColors(p: PaletteModel): string[] {
  return [p.primary, p.secondary, p.accent, p.background];
}

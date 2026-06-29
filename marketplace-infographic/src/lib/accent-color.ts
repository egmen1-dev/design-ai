import type { ProductCategory } from "@/lib/product-analysis";

const CATEGORY_ACCENT: Partial<Record<ProductCategory, string>> = {
  garden_tools: "#00a8b5",
  electronics: "#2563eb",
  cosmetics: "#d946ef",
  home_appliances: "#0ea5e9",
  fashion: "#7c3aed",
  food: "#16a34a",
  sport: "#ea580c",
  kids: "#f59e0b",
  auto: "#dc2626",
  premium: "#b45309",
  generic: "#00a8b5",
};

export function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** Акцент для текста на белых карточках и цветных плашках — никогда белый/светло-серый */
export function resolveMarketplaceAccent(
  colors: string[],
  category: ProductCategory = "generic",
): string {
  const fallback = CATEGORY_ACCENT[category] ?? CATEGORY_ACCENT.generic!;
  const candidates = colors.filter(isValidHex);

  const saturated = candidates.find((c) => {
    const lum = hexLuminance(c);
    return lum >= 0.12 && lum <= 0.58;
  });
  if (saturated) return saturated;

  return fallback;
}

/** Палитра: [accent, light, dark] — accent всегда читаемый */
export function normalizeMarketplacePalette(
  colors: string[],
  category: ProductCategory = "generic",
): [string, string, string] {
  const accent = resolveMarketplaceAccent(colors, category);
  const dark =
    colors.find((c) => isValidHex(c) && hexLuminance(c) < 0.22) ?? "#0f172a";
  return [accent, "#ffffff", dark];
}

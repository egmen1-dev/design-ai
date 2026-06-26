import type { InfographicStyle } from "@/lib/design-trends";
import type { ProductCategory } from "@/lib/product-analysis";
import type { DesignDNA } from "./types";
import { applyJitter, createSeededRng, pickRange, type Rng } from "./variability";

function dnaValue(rng: Rng, center: number, spread = 18): number {
  return Math.round(pickRange(rng, center - spread, center + spread));
}

function clampDna(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

const CATEGORY_DNA: Partial<Record<ProductCategory, Partial<DesignDNA>>> = {
  cosmetics: { luxury: 78, productDominance: 76, minimalism: 62 },
  electronics: { visualEnergy: 68, contrast: 72, depth: 70 },
  garden_tools: { visualEnergy: 58, productDominance: 70, depth: 55 },
  premium: { luxury: 85, minimalism: 70, negativeSpace: 32 },
  kids: { visualEnergy: 72, decorDensity: 28, symmetry: 55 },
  sport: { visualEnergy: 75, contrast: 70 },
  fashion: { luxury: 65, symmetry: 48, minimalism: 58 },
  home_appliances: { productDominance: 58, symmetry: 50 },
  food: { productDominance: 72, colorMood: 62 },
  auto: { contrast: 75, visualEnergy: 65 },
  generic: {},
};

const STYLE_HINT: Partial<Record<InfographicStyle, Partial<DesignDNA>>> = {
  minimal: { minimalism: 88, decorDensity: 8, negativeSpace: 34 },
  modern: { visualEnergy: 55, contrast: 65, symmetry: 52 },
  glassmorphism: { depth: 82, luxury: 60, decorDensity: 22 },
  brutalism: { contrast: 92, symmetry: 28, visualEnergy: 78 },
  retro: { decorDensity: 35, visualEnergy: 62 },
  neumorphism: { depth: 70, minimalism: 65 },
  swiss: { minimalism: 80, symmetry: 72, decorDensity: 10 },
  "3d": { depth: 90, visualEnergy: 70, lightingDrama: 75 },
};

const BASE_DNA: DesignDNA = {
  productDominance: 68,
  negativeSpace: 28,
  symmetry: 45,
  visualEnergy: 58,
  minimalism: 50,
  luxury: 55,
  decorDensity: 18,
  textDensity: 24,
  lightingDrama: 58,
  depth: 62,
  contrast: 68,
  colorMood: 55,
  typographyWeight: 72,
};

export function generateDesignDNA(
  category: ProductCategory,
  seed: string,
  styleHint?: InfographicStyle,
): DesignDNA {
  const rng = createSeededRng(`dna:${seed}:${category}`);
  const cat = CATEGORY_DNA[category] ?? {};
  const style = styleHint ? STYLE_HINT[styleHint] ?? {} : {};
  const merged = { ...BASE_DNA, ...cat, ...style };

  const raw: DesignDNA = {
    productDominance: dnaValue(rng, merged.productDominance),
    negativeSpace: dnaValue(rng, merged.negativeSpace, 12),
    symmetry: dnaValue(rng, merged.symmetry),
    visualEnergy: dnaValue(rng, merged.visualEnergy),
    minimalism: dnaValue(rng, merged.minimalism),
    luxury: dnaValue(rng, merged.luxury),
    decorDensity: dnaValue(rng, merged.decorDensity, 14),
    textDensity: dnaValue(rng, merged.textDensity, 12),
    lightingDrama: dnaValue(rng, merged.lightingDrama),
    depth: dnaValue(rng, merged.depth),
    contrast: dnaValue(rng, merged.contrast),
    colorMood: dnaValue(rng, merged.colorMood),
    typographyWeight: dnaValue(rng, merged.typographyWeight),
  };

  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, clampDna(applyJitter(rng, v as number, 3))]),
  ) as DesignDNA;
}

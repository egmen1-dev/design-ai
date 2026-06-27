import type { ProductCategory } from "@/lib/product-analysis";
import type { RenderingProfileId, RenderingStrategy } from "./types";

export type RenderingProfile = {
  id: RenderingProfileId;
  camera: string;
  lighting: string;
  background: string;
  materials: string;
  colorDiscipline: string;
};

export const RENDERING_PROFILES: Record<RenderingProfileId, RenderingProfile> = {
  premium_product: {
    id: "premium_product",
    camera: "70mm lens, eye level, medium distance, shallow depth of field",
    lighting: "large softbox key, low fill, warm rim, cool separation back light",
    background: "dark graphite gradient studio, vast designed negative space",
    materials: "matte graphite floor, subtle reflections only on hero zone",
    colorDiscipline: "max 4 muted premium tones, high contrast headline zone",
  },
  luxury: {
    id: "luxury",
    camera: "85mm editorial lens, slight low angle, intimate medium shot",
    lighting: "luxury softbox, feathered falloff, gold rim accent",
    background: "beige cream gradient void, editorial luxury catalog",
    materials: "frosted acrylic surface, glass reflections controlled",
    colorDiscipline: "analogous luxury palette, no oversaturation",
  },
  technical: {
    id: "technical",
    camera: "65mm technical hero, table level, precise catalog angle",
    lighting: "top product key, balanced fill, cool rim",
    background: "cool grey technical gradient, clean demo stage",
    materials: "matte aluminum platform, precision engineering surface",
    colorDiscipline: "cool neutrals plus one accent, max 4 colors",
  },
  industrial: {
    id: "industrial",
    camera: "wide medium, low hero angle, rugged catalog framing",
    lighting: "hard cool key from side, low blue fill, steel rim",
    background: "industrial neutral backdrop, workshop bokeh",
    materials: "dark steel, soft concrete, contact shadows",
    colorDiscipline: "desaturated industrial palette",
  },
  minimal: {
    id: "minimal",
    camera: "50mm minimal lens, eye level, generous negative space",
    lighting: "soft even studio key, minimal shadows",
    background: "white cyclorama, clean gradient",
    materials: "matte white surface, no reflections",
    colorDiscipline: "2-3 colors maximum, whitespace dominates",
  },
  medical: {
    id: "medical",
    camera: "60mm clinical lens, straight-on trust angle",
    lighting: "soft neutral studio, even fill, no harsh shadows",
    background: "clinical white soft gradient",
    materials: "premium polymer matte surface",
    colorDiscipline: "white blue grey only, hygiene trust",
  },
  construction: {
    id: "construction",
    camera: "70mm, low power angle, medium-wide",
    lighting: "directional warm key, industrial fill",
    background: "neutral construction studio",
    materials: "soft concrete, earth tones",
    colorDiscipline: "earth neutrals plus safety accent",
  },
  electronics: {
    id: "electronics",
    camera: "65mm tech hero, slight low angle, close medium",
    lighting: "high contrast commercial key, specular rim",
    background: "dark blue tech gradient",
    materials: "carbon fiber mat, controlled gloss",
    colorDiscipline: "cool tech palette max 4 colors",
  },
  fashion: {
    id: "fashion",
    camera: "85mm editorial, chest level, fashion catalog distance",
    lighting: "soft beauty key, subtle fill, editorial rim",
    background: "neutral fashion studio gradient",
    materials: "fabric matte floor, soft texture",
    colorDiscipline: "editorial restrained palette",
  },
  tools: {
    id: "tools",
    camera: "70mm three-quarter, waist level, workshop context",
    lighting: "warm spotlight key, practical fill",
    background: "workshop wall soft bokeh",
    materials: "wood and steel surfaces",
    colorDiscipline: "rugged 3-color palette",
  },
  home: {
    id: "home",
    camera: "50mm lifestyle lens, eye level, domestic medium",
    lighting: "warm domestic key, cozy fill",
    background: "home interior soft bokeh",
    materials: "wood stone home surfaces",
    colorDiscipline: "warm neutral lifestyle palette",
  },
  kitchen: {
    id: "kitchen",
    camera: "55mm counter level, culinary hero angle",
    lighting: "warm kitchen key, soft overhead fill",
    background: "modern kitchen bokeh",
    materials: "stone counter, ceramic tile",
    colorDiscipline: "clean domestic max 4 colors",
  },
};

const CATEGORY_PROFILE: Partial<Record<ProductCategory, RenderingProfileId>> = {
  electronics: "electronics",
  cosmetics: "luxury",
  premium: "premium_product",
  home_appliances: "kitchen",
  garden_tools: "tools",
  sport: "industrial",
  auto: "industrial",
  kids: "home",
  food: "kitchen",
  fashion: "fashion",
  generic: "premium_product",
};

export function resolveRenderingProfile(input: {
  category: ProductCategory;
  priceSegment: string;
  sceneType?: string;
  compositionTemplate?: string;
}): RenderingStrategy {
  let profile: RenderingProfileId =
    CATEGORY_PROFILE[input.category] ?? "premium_product";

  if (input.priceSegment === "premium") profile = "luxury";
  if (input.sceneType === "technology") profile = "electronics";
  if (input.compositionTemplate === "premium_minimal") profile = "minimal";
  if (input.compositionTemplate === "technical") profile = "technical";

  return {
    profile,
    quality: "8k",
    photorealistic: true,
    marketplaceOptimized: true,
  };
}

export function getProfile(id: RenderingProfileId): RenderingProfile {
  return RENDERING_PROFILES[id];
}

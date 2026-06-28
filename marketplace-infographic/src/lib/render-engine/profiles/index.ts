import type {
  RenderCameraBlock,
  RenderLightingBlock,
  RenderMaterialsBlock,
  RenderModelId,
  RenderNegativeBlock,
  RenderProfileId,
  RenderQualityBlock,
} from "../types";

export type RenderProfile = {
  id: RenderProfileId;
  label: string;
  preferredModel: RenderModelId;
  lighting: Partial<RenderLightingBlock>;
  materials: Partial<RenderMaterialsBlock>;
  camera: Partial<RenderCameraBlock>;
  quality: Partial<RenderQualityBlock>;
  negativeExtras: string[];
  environmentHint: string;
};

export const RENDER_PROFILES: Record<RenderProfileId, RenderProfile> = {
  industrial: {
    id: "industrial",
    label: "Industrial",
    preferredModel: "kontext",
    environmentHint: "industrial workshop backdrop, steel and concrete surfaces",
    lighting: { key: "hard cool side key", fill: "low blue fill", temperatureK: 5500 },
    materials: { surface: "dark steel", floor: "soft concrete", reflection: "subtle", atmosphere: "rugged" },
    camera: { lensMm: 70, height: "low hero angle", distance: "medium-wide", angle: "three-quarter" },
    quality: { colorDiscipline: "desaturated industrial palette max 4 colors" },
    negativeExtras: ["glossy luxury", "warm cozy interior", "particles"],
  },
  kitchen: {
    id: "kitchen",
    label: "Kitchen",
    preferredModel: "flux",
    environmentHint: "modern kitchen counter, stone surface, domestic bokeh",
    lighting: { key: "warm kitchen spotlight", fill: "soft overhead", temperatureK: 4200 },
    materials: { surface: "stone counter", floor: "ceramic tile", reflection: "subtle", atmosphere: "clean domestic" },
    camera: { lensMm: 55, height: "counter level", distance: "medium", angle: "culinary hero" },
    quality: { colorDiscipline: "clean domestic max 4 colors" },
    negativeExtras: ["industrial grime", "outdoor grass"],
  },
  beauty: {
    id: "beauty",
    label: "Beauty",
    preferredModel: "gptimage",
    environmentHint: "editorial beauty studio, soft gradient void",
    lighting: { key: "soft beauty key", fill: "feathered fill", temperatureK: 5000 },
    materials: { surface: "frosted acrylic", floor: "matte white", reflection: "controlled gloss", atmosphere: "editorial" },
    camera: { lensMm: 85, height: "chest level", distance: "intimate medium", angle: "editorial catalog" },
    quality: { colorDiscipline: "restrained editorial palette" },
    negativeExtras: ["harsh shadows", "clutter", "industrial"],
  },
  medical: {
    id: "medical",
    label: "Medical",
    preferredModel: "flux",
    environmentHint: "clinical white soft gradient studio",
    lighting: { key: "even neutral studio", fill: "soft fill", temperatureK: 5600 },
    materials: { surface: "premium polymer matte", floor: "clinical white", reflection: "none", atmosphere: "hygiene trust" },
    camera: { lensMm: 60, height: "straight-on", distance: "medium", angle: "trust angle" },
    quality: { colorDiscipline: "white blue grey only" },
    negativeExtras: ["warm cozy", "particles", "decorative"],
  },
  construction: {
    id: "construction",
    label: "Construction",
    preferredModel: "kontext",
    environmentHint: "neutral construction studio, earth tones",
    lighting: { key: "directional warm key", fill: "industrial fill", temperatureK: 4800 },
    materials: { surface: "soft concrete", floor: "earth tones", reflection: "matte", atmosphere: "power tools" },
    camera: { lensMm: 70, height: "low power angle", distance: "medium-wide", angle: "rugged catalog" },
    quality: { colorDiscipline: "earth neutrals plus safety accent" },
    negativeExtras: ["luxury marble", "beauty editorial"],
  },
  luxury: {
    id: "luxury",
    label: "Luxury",
    preferredModel: "gptimage",
    environmentHint: "beige cream editorial void, vast negative space",
    lighting: { key: "luxury softbox", fill: "feathered falloff", rim: "gold accent", temperatureK: 4500 },
    materials: { surface: "frosted acrylic", floor: "matte graphite", reflection: "controlled", atmosphere: "editorial luxury" },
    camera: { lensMm: 85, height: "slight low angle", distance: "intimate medium", angle: "editorial" },
    quality: { colorDiscipline: "analogous luxury palette no oversaturation" },
    negativeExtras: ["cheap plastic", "busy patterns", "oversaturated"],
  },
  electronics: {
    id: "electronics",
    label: "Electronics",
    preferredModel: "kontext",
    environmentHint: "dark blue tech gradient studio, reflective pedestal",
    lighting: { key: "high contrast commercial key", fill: "cool fill", rim: "specular rim", temperatureK: 6500 },
    materials: { surface: "carbon fiber mat", floor: "controlled gloss", reflection: "specular", atmosphere: "tech showcase" },
    camera: { lensMm: 65, height: "slight low angle", distance: "close medium", angle: "tech hero" },
    quality: { colorDiscipline: "cool tech palette max 4 colors" },
    negativeExtras: ["warm domestic", "rustic wood"],
  },
  furniture: {
    id: "furniture",
    label: "Furniture",
    preferredModel: "seedream",
    environmentHint: "modern interior lifestyle, wood and fabric textures",
    lighting: { key: "warm domestic key", fill: "cozy fill", temperatureK: 4300 },
    materials: { surface: "wood stone", floor: "home surfaces", reflection: "natural", atmosphere: "lifestyle interior" },
    camera: { lensMm: 50, height: "eye level", distance: "room context medium", angle: "lifestyle catalog" },
    quality: { colorDiscipline: "warm neutral lifestyle palette" },
    negativeExtras: ["clinical", "industrial"],
  },
  outdoor: {
    id: "outdoor",
    label: "Outdoor",
    preferredModel: "seedream",
    environmentHint: "authentic outdoor lifestyle, natural surroundings bokeh",
    lighting: { key: "natural golden hour", fill: "ambient sky fill", temperatureK: 5200 },
    materials: { surface: "natural grass", floor: "earth path", reflection: "natural", atmosphere: "outdoor lifestyle" },
    camera: { lensMm: 50, height: "eye level", distance: "environmental medium", angle: "lifestyle" },
    quality: { colorDiscipline: "natural earth greens and warm neutrals" },
    negativeExtras: ["studio cyclorama", "clinical white"],
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    preferredModel: "flux",
    environmentHint: "white cyclorama, clean gradient, vast negative space",
    lighting: { key: "soft even studio", fill: "minimal shadows", temperatureK: 5600 },
    materials: { surface: "matte white", floor: "no reflections", reflection: "none", atmosphere: "minimal catalog" },
    camera: { lensMm: 50, height: "eye level", distance: "generous negative space", angle: "minimal catalog" },
    quality: { colorDiscipline: "2-3 colors maximum whitespace dominates" },
    negativeExtras: ["clutter", "busy background", "decorative objects"],
  },
  premium_product: {
    id: "premium_product",
    label: "Premium Product",
    preferredModel: "flux",
    environmentHint: "dark graphite gradient studio, polished floor subtle reflection",
    lighting: { key: "large softbox key", fill: "low fill", rim: "warm rim", temperatureK: 4800 },
    materials: { surface: "matte graphite", floor: "subtle reflections hero zone", reflection: "subtle", atmosphere: "premium catalog" },
    camera: { lensMm: 70, height: "eye level", distance: "medium", angle: "commercial hero" },
    quality: { colorDiscipline: "max 4 muted premium tones" },
    negativeExtras: ["cheap", "oversaturated", "clutter"],
  },
  lifestyle: {
    id: "lifestyle",
    label: "Lifestyle",
    preferredModel: "seedream",
    environmentHint: "home interior soft bokeh, warm domestic atmosphere",
    lighting: { key: "warm domestic key", fill: "cozy ambient", temperatureK: 4200 },
    materials: { surface: "wood fabric", floor: "home interior", reflection: "soft", atmosphere: "cozy lifestyle" },
    camera: { lensMm: 50, height: "eye level", distance: "domestic medium", angle: "lifestyle catalog" },
    quality: { colorDiscipline: "warm neutral lifestyle palette" },
    negativeExtras: ["clinical", "industrial", "dark tech"],
  },
};

export function getRenderProfile(id: RenderProfileId): RenderProfile {
  return RENDER_PROFILES[id] ?? RENDER_PROFILES.premium_product;
}

export function resolveRenderProfileId(input: {
  category: string;
  priceSegment?: string;
  sceneType?: string;
  compositionTemplate?: string;
}): RenderProfileId {
  const cat = input.category;
  if (input.priceSegment === "premium") return "luxury";
  if (input.compositionTemplate === "premium_minimal") return "minimal";
  if (cat === "electronics") return "electronics";
  if (cat === "cosmetics" || cat === "fashion") return "beauty";
  if (cat === "home_appliances") return "kitchen";
  if (cat === "garden_tools" || cat === "sport" || cat === "auto") return "industrial";
  if (cat === "food") return "kitchen";
  if (input.sceneType?.includes("lifestyle") || input.sceneType?.includes("outdoor")) return "lifestyle";
  if (input.sceneType?.includes("garden")) return "outdoor";
  return "premium_product";
}

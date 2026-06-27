import type { ProductCategory } from "@/lib/product-analysis";
import type {
  DecorativeDiscipline,
  LightingPresetId,
  MaterialId,
  ProductInteraction,
  SceneBlueprint,
  SceneTypeId,
} from "./types";
import { resolveLighting } from "./lighting";

export type SceneTemplate = {
  id: SceneTypeId;
  label: string;
  environment: string;
  background: string;
  atmosphere: string;
  material: MaterialId;
  lighting: LightingPresetId;
  decorative: DecorativeDiscipline;
  productInteraction: ProductInteraction;
  premiumFeeling: number;
  coverConceptMap: import("@/lib/cover-concepts").CoverConceptId;
};

const BASE_DECORATIVE: DecorativeDiscipline = {
  maxDensity: 0.12,
  maxParticles: 0,
  maxShapes: 1,
  maxGradients: 1,
  backgroundComplexity: "minimal",
  whitespaceDominates: true,
};

const GROUNDED_INTERACTION: ProductInteraction = {
  groundPlane: true,
  softShadow: true,
  ambientOcclusion: true,
  backgroundInteraction: "subtle",
  lightWrapping: true,
  reflections: false,
  edgeHighlights: true,
  depthSeparation: "high",
};

export const SCENE_TEMPLATES: Record<SceneTypeId, SceneTemplate> = {
  premium_studio: {
    id: "premium_studio",
    label: "Premium Studio",
    environment: "graphite studio",
    background: "dark charcoal gradient",
    atmosphere: "refined commercial premium",
    material: "graphite",
    lighting: "luxury_softbox",
    decorative: BASE_DECORATIVE,
    productInteraction: { ...GROUNDED_INTERACTION, reflections: true },
    premiumFeeling: 92,
    coverConceptMap: "premium_minimal",
  },
  industrial_studio: {
    id: "industrial_studio",
    label: "Industrial Studio",
    environment: "industrial workshop studio",
    background: "dark steel gradient",
    atmosphere: "rugged professional",
    material: "dark_steel",
    lighting: "cold_industrial",
    decorative: { ...BASE_DECORATIVE, maxDensity: 0.08 },
    productInteraction: GROUNDED_INTERACTION,
    premiumFeeling: 78,
    coverConceptMap: "commercial_studio",
  },
  luxury_minimal: {
    id: "luxury_minimal",
    label: "Luxury Minimal",
    environment: "minimal luxury void",
    background: "soft beige gradient",
    atmosphere: "editorial luxury calm",
    material: "frosted_acrylic",
    lighting: "luxury_softbox",
    decorative: { ...BASE_DECORATIVE, maxParticles: 0, maxShapes: 0 },
    productInteraction: { ...GROUNDED_INTERACTION, reflections: true },
    premiumFeeling: 95,
    coverConceptMap: "premium_minimal",
  },
  technical_presentation: {
    id: "technical_presentation",
    label: "Technical Presentation",
    environment: "technical demo stage",
    background: "cool grey gradient",
    atmosphere: "precise trustworthy",
    material: "matte_aluminum",
    lighting: "top_product",
    decorative: BASE_DECORATIVE,
    productInteraction: GROUNDED_INTERACTION,
    premiumFeeling: 82,
    coverConceptMap: "tech_showcase",
  },
  lifestyle: {
    id: "lifestyle",
    label: "Lifestyle",
    environment: "modern home interior",
    background: "warm interior bokeh",
    atmosphere: "aspirational lifestyle",
    material: "wood",
    lighting: "warm_spotlight",
    decorative: { ...BASE_DECORATIVE, backgroundComplexity: "low" },
    productInteraction: { ...GROUNDED_INTERACTION, backgroundInteraction: "moderate" },
    premiumFeeling: 80,
    coverConceptMap: "home_interior",
  },
  modern_dark: {
    id: "modern_dark",
    label: "Modern Dark",
    environment: "dark modern studio",
    background: "deep navy gradient",
    atmosphere: "sleek modern",
    material: "graphite",
    lighting: "high_contrast_commercial",
    decorative: BASE_DECORATIVE,
    productInteraction: { ...GROUNDED_INTERACTION, edgeHighlights: true },
    premiumFeeling: 88,
    coverConceptMap: "tech_showcase",
  },
  modern_white: {
    id: "modern_white",
    label: "Modern White",
    environment: "bright white cyclorama",
    background: "clean white gradient",
    atmosphere: "fresh clinical clean",
    material: "frosted_acrylic",
    lighting: "soft_studio",
    decorative: BASE_DECORATIVE,
    productInteraction: GROUNDED_INTERACTION,
    premiumFeeling: 84,
    coverConceptMap: "commercial_studio",
  },
  technology: {
    id: "technology",
    label: "Technology",
    environment: "tech showcase stage",
    background: "dark blue tech gradient",
    atmosphere: "innovation forward",
    material: "carbon_fiber",
    lighting: "high_contrast_commercial",
    decorative: BASE_DECORATIVE,
    productInteraction: { ...GROUNDED_INTERACTION, reflections: true },
    premiumFeeling: 86,
    coverConceptMap: "tech_showcase",
  },
  construction: {
    id: "construction",
    label: "Construction",
    environment: "construction site studio",
    background: "neutral industrial backdrop",
    atmosphere: "power reliability",
    material: "soft_concrete",
    lighting: "cold_industrial",
    decorative: { ...BASE_DECORATIVE, maxDensity: 0.1 },
    productInteraction: GROUNDED_INTERACTION,
    premiumFeeling: 74,
    coverConceptMap: "commercial_studio",
  },
  medical: {
    id: "medical",
    label: "Medical",
    environment: "clinical presentation",
    background: "soft white clinical gradient",
    atmosphere: "trust hygiene",
    material: "premium_plastic",
    lighting: "soft_studio",
    decorative: { ...BASE_DECORATIVE, maxShapes: 0 },
    productInteraction: GROUNDED_INTERACTION,
    premiumFeeling: 83,
    coverConceptMap: "commercial_studio",
  },
  kitchen: {
    id: "kitchen",
    label: "Kitchen",
    environment: "modern kitchen counter",
    background: "kitchen interior bokeh",
    atmosphere: "domestic premium",
    material: "stone",
    lighting: "warm_spotlight",
    decorative: { ...BASE_DECORATIVE, backgroundComplexity: "low" },
    productInteraction: { ...GROUNDED_INTERACTION },
    premiumFeeling: 79,
    coverConceptMap: "home_interior",
  },
  workshop: {
    id: "workshop",
    label: "Workshop",
    environment: "professional workshop",
    background: "workshop wall bokeh",
    atmosphere: "craft reliability",
    material: "wood",
    lighting: "warm_spotlight",
    decorative: BASE_DECORATIVE,
    productInteraction: GROUNDED_INTERACTION,
    premiumFeeling: 76,
    coverConceptMap: "commercial_studio",
  },
  nature: {
    id: "nature",
    label: "Nature",
    environment: "outdoor natural setting",
    background: "garden foliage bokeh",
    atmosphere: "organic fresh",
    material: "stone",
    lighting: "sunset_rim",
    decorative: { ...BASE_DECORATIVE, backgroundComplexity: "low" },
    productInteraction: { ...GROUNDED_INTERACTION, groundPlane: true },
    premiumFeeling: 77,
    coverConceptMap: "garden_scene",
  },
  corporate: {
    id: "corporate",
    label: "Corporate",
    environment: "corporate office studio",
    background: "neutral corporate gradient",
    atmosphere: "professional trust",
    material: "matte_aluminum",
    lighting: "soft_studio",
    decorative: BASE_DECORATIVE,
    productInteraction: GROUNDED_INTERACTION,
    premiumFeeling: 81,
    coverConceptMap: "commercial_studio",
  },
};

const CATEGORY_SCENE: Partial<Record<ProductCategory, SceneTypeId>> = {
  electronics: "technology",
  cosmetics: "luxury_minimal",
  premium: "premium_studio",
  home_appliances: "kitchen",
  garden_tools: "nature",
  sport: "modern_dark",
  auto: "industrial_studio",
  kids: "lifestyle",
  food: "kitchen",
  fashion: "luxury_minimal",
  generic: "premium_studio",
};

export function resolveSceneType(
  category: ProductCategory,
  priceSegment: string,
  storySceneType?: string,
): SceneTypeId {
  if (storySceneType && storySceneType in SCENE_TEMPLATES) {
    return storySceneType as SceneTypeId;
  }
  if (priceSegment === "premium") return "premium_studio";
  return CATEGORY_SCENE[category] ?? "premium_studio";
}

export function buildBlueprintFromTemplate(
  sceneType: SceneTypeId,
  overrides?: Partial<SceneBlueprint>,
): SceneBlueprint {
  const t = SCENE_TEMPLATES[sceneType];
  const lighting = resolveLighting(t.lighting);
  return {
    version: "1.0",
    scene: {
      type: sceneType,
      environment: t.environment,
      floor: t.material === "graphite" ? "matte graphite" : t.material.replace(/_/g, " "),
      background: t.background,
      depth: "medium",
      atmosphere: t.atmosphere,
      material: t.material,
      visualDensity: t.decorative.maxDensity,
    },
    lighting,
    hero: {
      position: "bottom-right",
      rotationDeg: -4,
      scale: 0.46,
      anchor: "ground",
    },
    headline: { position: "top-left", widthRatio: 0.34 },
    accent: {
      glow: false,
      particles: false,
      shapes: "minimal",
      maxGradients: t.decorative.maxGradients,
    },
    camera: {
      lensMm: 70,
      height: "eye level",
      distance: "medium",
      angle: "three-quarter hero",
    },
    productInteraction: t.productInteraction,
    decorative: t.decorative,
    premiumFeeling: t.premiumFeeling,
    shadowStrategy: "contact-soft",
    ...overrides,
  };
}

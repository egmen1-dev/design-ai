/**
 * Chapter 4.16 — Material Director types
 */
import type { MaterialBlueprint } from "./types";

export const SurfaceMaterialId = {
  OAK: "oak",
  WALNUT: "walnut",
  CONCRETE: "concrete",
  WHITE_MARBLE: "white_marble",
  BRUSHED_STEEL: "brushed_steel",
  GLASS: "glass",
  CERAMIC: "ceramic",
  LINEN: "linen",
  MATTE_PLASTIC: "matte_plastic",
  STONE: "stone",
  WHITE_PLASTER: "white_plaster",
  BRASS: "brass",
} as const;

export type SurfaceMaterialKind = (typeof SurfaceMaterialId)[keyof typeof SurfaceMaterialId];

export type SurfaceMaterial = {
  id: SurfaceMaterialKind;
  role: "floor" | "wall" | "accent" | "decor";
  finish: string;
};

export const ReflectionProfile = {
  MATTE: "matte",
  SOFT_SATIN: "soft_satin",
  SEMI_GLOSS: "semi_gloss",
  HIGH_GLOSS: "high_gloss",
  MIRROR: "mirror",
} as const;

export type ReflectionProfileId = (typeof ReflectionProfile)[keyof typeof ReflectionProfile];

export const RoughnessProfile = {
  VERY_SMOOTH: "very_smooth",
  SMOOTH: "smooth",
  NATURAL: "natural",
  TEXTURED: "textured",
  ROUGH: "rough",
} as const;

export type RoughnessProfileId = (typeof RoughnessProfile)[keyof typeof RoughnessProfile];

export const BackgroundMaterial = {
  STUDIO_PLASTER: "studio_plaster",
  MARBLE_WALL: "marble_wall",
  CONCRETE_WALL: "concrete_wall",
  WOOD_PANEL: "wood_panel",
  NEUTRAL_FABRIC: "neutral_fabric",
  TECH_PANEL: "tech_panel",
} as const;

export type BackgroundMaterialId = (typeof BackgroundMaterial)[keyof typeof BackgroundMaterial];

export const ContactSurface = {
  WOOD_TABLE: "wood_table",
  STONE_COUNTERTOP: "stone_countertop",
  STUDIO_FLOOR: "studio_floor",
  FABRIC: "fabric",
  GLASS_SURFACE: "glass_surface",
  FLOATING_PLATFORM: "floating_platform",
} as const;

export type ContactSurfaceId = (typeof ContactSurface)[keyof typeof ContactSurface];

export const TextureComplexity = {
  MINIMAL: "minimal",
  STANDARD: "standard",
  RICH: "rich",
} as const;

export type TextureComplexityId = (typeof TextureComplexity)[keyof typeof TextureComplexity];

export const MicroDetailLevel = {
  NONE: "none",
  WOOD_GRAIN: "wood_grain",
  STONE_VEINS: "stone_veins",
  BRUSHED_METAL: "brushed_metal",
  FABRIC_FIBERS: "fabric_fibers",
  CERAMIC_SURFACE: "ceramic_surface",
} as const;

export type MicroDetailLevelId = (typeof MicroDetailLevel)[keyof typeof MicroDetailLevel];

export const MaterialWorld = {
  LUXURY_INTERIOR: "luxury_interior",
  MINIMAL_STUDIO: "minimal_studio",
  MODERN_DOMESTIC: "modern_domestic",
  TECHNOLOGY_LAB: "technology_lab",
  MARKETPLACE_NEUTRAL: "marketplace_neutral",
  NATURAL_WARM: "natural_warm",
} as const;

export type MaterialWorldId = (typeof MaterialWorld)[keyof typeof MaterialWorld];

export type MaterialWorldDefinition = {
  id: MaterialWorldId;
  name: string;
  summary: string;
};

/** Chapter 4.16 — material section (physics model, not light/camera/prompt) */
export type MaterialSection = {
  materialWorld: MaterialWorldId;
  surfacePalette: SurfaceMaterial[];
  reflectionProfile: ReflectionProfileId;
  roughnessProfile: RoughnessProfileId;
  backgroundMaterial: BackgroundMaterialId;
  contactSurface: ContactSurfaceId;
  textureComplexity: TextureComplexityId;
  microDetailLevel: MicroDetailLevelId;
  providerHints: string[];
  materialBlueprint: MaterialBlueprint;
  /** Normalized 0.0..1.0 */
  confidence: number;
};

export type MaterialDirectorContext = {
  productCategory: string;
  marketplace: string;
  productCutout?: boolean;
  storyType?: string;
  primaryEmotion?: string;
  sceneType?: string;
  sceneMaterialPalette?: string[];
  photographyStyle?: string;
  materialIntent?: string;
  lightingScheme?: string;
  lightingStyle?: string;
  cameraStyle?: string;
  cameraDistance?: string;
  providerId?: string;
};

export type MaterialExplainabilityReport = {
  agentId: "material-director";
  selectedWorld: MaterialWorldId;
  alternativesConsidered: MaterialWorldId[];
  rejectedAlternatives: { id: MaterialWorldId; reason: string }[];
  storyInfluences: string[];
  sceneInfluences: string[];
  photographyInfluences: string[];
  lightingInfluences: string[];
  commercialValue: string;
  reasoning: string[];
};

export type MaterialValidationReport = {
  valid: boolean;
  violations: string[];
  section?: MaterialSection;
};

export type MaterialFailureCode =
  | "STORY_CONFLICT"
  | "TOO_MANY_SURFACES"
  | "DISTRACTING_MATERIALS"
  | "ARTIFICIAL_ENVIRONMENT"
  | "MISSING_CAMERA_INPUT"
  | "CONTAINS_LIGHTING_DECISION"
  | "CONTAINS_PROMPT"
  | "COMPOSITION_VIOLATION"
  | "CUTOUT_INCOMPATIBLE";

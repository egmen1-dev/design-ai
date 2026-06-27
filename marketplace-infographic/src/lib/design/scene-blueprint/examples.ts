import type { SceneBlueprint } from "./types";

/** Example Scene Blueprints for documentation and tests */
export const EXAMPLE_PREMIUM_STUDIO: SceneBlueprint = {
  version: "1.0",
  scene: {
    type: "premium_studio",
    environment: "graphite studio",
    floor: "matte graphite",
    background: "dark gradient",
    depth: "medium",
    atmosphere: "refined commercial premium",
    material: "graphite",
    visualDensity: 0.1,
  },
  lighting: {
    preset: "luxury_softbox",
    key: "large softbox key from top-left",
    fill: "very low fill",
    rim: "warm orange rim",
    back: "cool blue separation",
    temperatureK: 4800,
  },
  hero: {
    position: "bottom-right",
    rotationDeg: -4,
    scale: 0.46,
    anchor: "ground",
  },
  headline: { position: "top-left", widthRatio: 0.34 },
  accent: { glow: false, particles: false, shapes: "minimal", maxGradients: 1 },
  camera: {
    lensMm: 70,
    height: "eye level",
    distance: "medium",
    angle: "three-quarter hero",
  },
  productInteraction: {
    groundPlane: true,
    softShadow: true,
    ambientOcclusion: true,
    backgroundInteraction: "subtle",
    lightWrapping: true,
    reflections: true,
    edgeHighlights: true,
    depthSeparation: "high",
  },
  decorative: {
    maxDensity: 0.1,
    maxParticles: 0,
    maxShapes: 1,
    maxGradients: 1,
    backgroundComplexity: "minimal",
    whitespaceDominates: true,
  },
  premiumFeeling: 92,
  shadowStrategy: "contact-soft",
};

export const EXAMPLE_TECHNOLOGY: SceneBlueprint = {
  ...EXAMPLE_PREMIUM_STUDIO,
  scene: {
    ...EXAMPLE_PREMIUM_STUDIO.scene,
    type: "technology",
    environment: "tech showcase stage",
    background: "dark blue tech gradient",
    material: "carbon_fiber",
    atmosphere: "innovation forward",
  },
  lighting: {
    preset: "high_contrast_commercial",
    key: "strong directional key",
    fill: "minimal fill",
    rim: "bright specular rim",
    back: "high contrast backlight",
    temperatureK: 5600,
  },
};

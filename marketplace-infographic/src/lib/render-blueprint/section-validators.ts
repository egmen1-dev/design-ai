/**
 * Chapter 3.1 — section validation barriers
 */
import type { RenderBlueprint } from "./types";
import type { LifecycleManagedSection } from "./lifecycle-types";

export type SectionValidationResult = {
  ok: boolean;
  missing: string[];
};

function hasText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateProductSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  const p = bp.product;
  if (!hasText(p.category)) missing.push("product.category");
  if (!hasText(p.subCategory)) missing.push("product.subCategory");
  if (!p.dominantColor?.length) missing.push("product.dominantColor");
  if (!hasText(p.shape)) missing.push("product.shape");
  return { ok: missing.length === 0, missing };
}

export function validateCreativeSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!hasText(bp.creative.audience)) missing.push("creative.audience");
  if (!hasText(bp.creative.emotion)) missing.push("creative.emotion");
  return { ok: missing.length === 0, missing };
}

export function validateStorySection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!hasText(bp.story.hook)) missing.push("story.hook");
  if (!hasText(bp.story.visualPromise)) missing.push("story.visualPromise");
  if (!hasText(bp.story.narrative)) missing.push("story.narrative");
  return { ok: missing.length === 0, missing };
}

export function validateSceneSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!bp.scene.environment) missing.push("scene.environment");
  if (!bp.scene.architecture) missing.push("scene.architecture");
  if (!bp.scene.timeOfDay) missing.push("scene.timeOfDay");
  if (!bp.scene.weather) missing.push("scene.weather");
  if (!bp.scene.depth) missing.push("scene.depth");
  if (!hasText(bp.scene.surface)) missing.push("scene.surface");
  return { ok: missing.length === 0, missing };
}

export function validatePhotographySection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!bp.photography.style) missing.push("photography.style");
  if (!hasText(bp.photography.visualMood)) missing.push("photography.visualMood");
  if (bp.photography.realism <= 0) missing.push("photography.realism");
  return { ok: missing.length === 0, missing };
}

export function validateCameraSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!bp.camera.lens) missing.push("camera.lens");
  if (!bp.camera.distance) missing.push("camera.distance");
  return { ok: missing.length === 0, missing };
}

export function validateLightingSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!bp.lighting.preset) missing.push("lighting.preset");
  if (!bp.lighting.temperature) missing.push("lighting.temperature");
  return { ok: missing.length === 0, missing };
}

export function validateMaterialsSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!hasText(bp.materials.floor)) missing.push("materials.floor");
  if (!hasText(bp.materials.walls)) missing.push("materials.walls");
  return { ok: missing.length === 0, missing };
}

export function validateCompositionSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  if (!bp.composition.template) missing.push("composition.template");
  if (bp.composition.heroWeight <= 0) missing.push("composition.heroWeight");
  if (!bp.composition.eyeFlow?.length) missing.push("composition.eyeFlow");
  return { ok: missing.length === 0, missing };
}

export function validateConstraintsSection(bp: RenderBlueprint): SectionValidationResult {
  return { ok: true, missing: [] };
}

export function validateValidationSection(bp: RenderBlueprint): SectionValidationResult {
  const missing: string[] = [];
  const v = bp.validation;
  if (!v.storyApproved) missing.push("validation.storyApproved");
  if (!v.sceneApproved) missing.push("validation.sceneApproved");
  if (!v.photoApproved) missing.push("validation.photoApproved");
  if (!v.layoutApproved) missing.push("validation.layoutApproved");
  if (!v.chiefApproved) missing.push("validation.chiefApproved");
  return { ok: missing.length === 0, missing };
}

export const SECTION_VALIDATORS: Record<
  LifecycleManagedSection,
  (bp: RenderBlueprint) => SectionValidationResult
> = {
  product: validateProductSection,
  creative: validateCreativeSection,
  story: validateStorySection,
  scene: validateSceneSection,
  photography: validatePhotographySection,
  camera: validateCameraSection,
  lighting: validateLightingSection,
  materials: validateMaterialsSection,
  composition: validateCompositionSection,
  constraints: validateConstraintsSection,
  validation: validateValidationSection,
};

/** Sections locked when a lifecycle stage completes */
export const STAGE_LOCK_SECTIONS: Record<
  import("./lifecycle-types").BlueprintLifecycle,
  LifecycleManagedSection[]
> = {
  NEW: [],
  PRODUCT_ANALYZED: ["product"],
  CREATIVE_DEFINED: ["creative"],
  STORY_DEFINED: ["story"],
  SCENE_DEFINED: ["scene"],
  PHOTO_DEFINED: ["photography", "camera", "lighting", "materials"],
  COMPOSITION_DEFINED: ["composition"],
  CONSTRAINTS_DEFINED: ["constraints"],
  VALIDATED: ["validation"],
  FROZEN: [],
  RENDERING: [],
  COMPOSITING: [],
  VISION_QA: [],
  FINISHED: [],
};

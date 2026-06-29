import { randomUUID } from "crypto";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import type { CoverConceptId } from "@/lib/cover-concepts";
import { WB_COVER } from "@/lib/composition/canvas";
import { environmentFromCoverConcept } from "./environment";
import type {
  CameraLensId,
  RenderBlueprint,
  RenderBlueprintInput,
  SceneEnvironmentId,
} from "./types";
import { createInitialLifecycleMeta } from "./lifecycle";
import { RENDER_BLUEPRINT_VERSION } from "./types";

function snapLens(mm: number): CameraLensId {
  const options: CameraLensId[] = [35, 50, 70, 85];
  return options.reduce((best, cur) =>
    Math.abs(cur - mm) < Math.abs(best - mm) ? cur : best,
  );
}

function mapArchitecture(arch: string): RenderBlueprint["scene"]["architecture"] {
  if (arch === "corporate" || arch === "tech_stage") return "modern";
  if (arch === "workshop") return "industrial";
  return "modern";
}

function mapTimeOfDay(time: string): RenderBlueprint["scene"]["timeOfDay"] {
  if (time === "golden_hour") return "golden_hour";
  if (time === "morning") return "morning";
  if (time === "noon") return "day";
  if (time === "studio_neutral") return "day";
  return "day";
}

function mapWeather(weather: string): RenderBlueprint["scene"]["weather"] {
  if (weather === "overcast") return "cloudy";
  if (weather === "indoor_controlled") return "clear";
  if (weather === "clear") return "clear";
  return "clear";
}

function mapEnvironmentFromVisual(arch: string, coverConceptId?: CoverConceptId): SceneEnvironmentId {
  if (coverConceptId) return environmentFromCoverConcept(coverConceptId);
  const table: Record<string, SceneEnvironmentId> = {
    studio: "studio",
    workshop: "workshop",
    kitchen: "kitchen",
    outdoor: "garden",
    home_interior: "living_room",
    tech_stage: "studio",
    nature: "garden",
    corporate: "studio",
  };
  return table[arch] ?? "studio";
}

function layoutToComposition(layoutSpec?: LayoutSpec): RenderBlueprint["composition"] {
  const heroPosition = layoutSpec?.heroPosition ?? "right";
  const template =
    heroPosition === "left" ? "hero_left" : heroPosition === "center" ? "center" : "hero_right";
  const heroWeight = Math.round((layoutSpec?.heroScale ?? 0.65) * 100);
  const negativeSpace = layoutSpec?.whitespaceTarget ?? 28;

  return {
    template,
    heroWeight,
    negativeSpace,
    balance: 0.55,
    eyeFlow: ["hero", "headline", "benefits"],
    foreground: true,
    midground: false,
    background: true,
  };
}

export function createEmptyRenderBlueprint(input: RenderBlueprintInput): RenderBlueprint {
  const now = Date.now();
  const environment = input.environment ?? "studio";

  return {
    meta: {
      id: input.id ?? randomUUID(),
      version: RENDER_BLUEPRINT_VERSION,
      generator: "flux",
      createdAt: now,
      seed: input.seed,
      retry: 0,
      layout: "marketplace",
      locked: false,
      audit: [{ agentId: "system", section: "meta", action: "set", at: now }],
    },
    lifecycle: createInitialLifecycleMeta(),
    creative: {
      marketplace: input.marketplace ?? "WB",
      goal: "Lifestyle",
      priceSegment: "middle",
      audience: "покупатели маркетплейса",
      emotion: "confidence",
    },
    story: {
      hook: "",
      customerProblem: "",
      customerDesire: "",
      visualPromise: "",
      emotionalTone: "confident",
      narrative: "",
    },
    product: {
      category: input.category,
      subCategory: input.subCategory ?? input.category,
      dominantColor: input.dominantColor ?? ["#1a1a2e", "#ffffff"],
      materials: [],
      finish: "matte",
      shape: "rectangular",
      cutout: true,
    },
    scene: {
      environment,
      architecture: "modern",
      timeOfDay: "day",
      weather: "clear",
      depth: "medium",
      surface: "concrete",
    },
    photography: {
      style: "commercial",
      shotType: "hero",
      backgroundBlur: 0.35,
      contrast: "medium",
      visualMood: "clean daylight",
      realism: 0.85,
    },
    camera: {
      lens: 50,
      height: "eye",
      angle: "three-quarter",
      distance: "medium",
      perspective: "natural",
    },
    lighting: {
      preset: "softbox",
      temperature: 5600,
      key: "soft_key_left",
      fill: "balanced",
      rim: "subtle",
      back: "none",
      shadowSoftness: 0.6,
      reflectionStrength: 0.25,
    },
    materials: {
      floor: "concrete",
      walls: "neutral plaster",
      decor: [],
      reflection: "soft",
      roughness: 0.45,
    },
    composition: layoutToComposition(),
    background: {
      complexity: "minimal",
      containsPeople: false,
      containsAnimals: false,
      containsVehicles: false,
      decorDensity: 0.15,
      secondaryObjects: [],
    },
    render: {
      provider: "pollinations",
      quality: "production",
      aspectRatio: "3:4",
      resolution: { width: WB_COVER.width, height: WB_COVER.height },
      negativePromptProfile: "marketplace_backdrop_v1",
    },
    constraints: {
      mustLeaveHeadlineSpace: true,
      mustLeaveBadgeSpace: true,
      mustLeaveBenefitsSpace: true,
      mustAvoidText: true,
      mustAvoidDuplicateObjects: true,
      mustAvoidHeroOverlap: true,
    },
    validation: {
      storyApproved: false,
      sceneApproved: false,
      photoApproved: false,
      layoutApproved: false,
      chiefApproved: false,
      professionalScore: 0,
      warnings: [],
    },
  };
}

/** Мост v17 VisualSceneBlueprint → v18 RenderBlueprint (Chapter 3) */
export function renderBlueprintFromVisualPipeline(
  visual: VisualSceneBlueprint,
  layoutSpec: LayoutSpec | undefined,
  seed: number,
  coverConceptId?: CoverConceptId,
): RenderBlueprint {
  const environment = mapEnvironmentFromVisual(visual.scene.architecture, coverConceptId);
  const base = createEmptyRenderBlueprint({
    seed,
    category: visual.category,
    environment,
    dominantColor: visual.palette,
  });

  return {
    ...base,
    story: {
      hook: visual.story.storyType,
      customerProblem: "",
      customerDesire: visual.story.usageContext,
      visualPromise: "",
      emotionalTone:
        visual.story.targetEmotion === "luxury"
          ? "luxury"
          : visual.story.targetEmotion === "calm"
            ? "calm"
            : "confident",
      narrative: "",
    },
    scene: {
      environment,
      architecture: mapArchitecture(visual.scene.architecture),
      timeOfDay: mapTimeOfDay(visual.scene.time),
      weather: mapWeather(visual.scene.weather),
      depth: visual.scene.depth,
      surface: visual.materials.floor,
    },
    photography: {
      style: "advertising",
      shotType: visual.camera.framing === "environment_context" ? "wide" : "hero",
      backgroundBlur: visual.scene.depth === "shallow" ? 0.55 : 0.3,
      contrast: visual.lighting.contrast,
      visualMood: "directional commercial",
      realism: 0.88,
    },
    camera: {
      lens: snapLens(visual.camera.lensMm),
      height:
        visual.camera.angle === "low_hero"
          ? "low"
          : visual.camera.angle === "top_down"
            ? "high"
            : "eye",
      angle:
        visual.camera.angle === "three_quarter"
          ? "three-quarter"
          : visual.camera.angle === "eye_level"
            ? "front"
            : "three-quarter",
      distance:
        visual.camera.distance === "close"
          ? "close"
          : visual.camera.distance === "wide"
            ? "far"
            : "medium",
      perspective: visual.camera.perspective === "compressed" ? "dramatic" : "natural",
    },
    lighting: {
      preset:
        visual.lighting.preset === "luxury_softbox"
          ? "softbox"
          : visual.lighting.preset === "sunset_rim"
            ? "golden_hour"
            : "studio",
      temperature: visual.lighting.temperatureK,
      key: visual.lighting.keyLight,
      fill: visual.lighting.fill,
      rim: visual.lighting.rim,
      back: "ambient",
      shadowSoftness: visual.lighting.shadowStyle === "soft" ? 0.7 : 0.4,
      reflectionStrength: visual.materials.reflection === "none" ? 0 : 0.3,
    },
    materials: {
      floor: visual.materials.floor,
      walls: visual.materials.background,
      decor: [],
      reflection:
        visual.materials.reflection === "none"
          ? "none"
          : visual.materials.reflection === "subtle"
            ? "soft"
            : "medium",
      roughness: visual.materials.texture === "matte" ? 0.6 : 0.3,
    },
    composition: layoutToComposition(layoutSpec),
    product: {
      ...base.product,
      dominantColor: visual.palette,
    },
  };
}

/** Обратный мост для v17 PollinationsCompiler (пока handler на v17) */
export function renderBlueprintToVisualSceneBlueprint(
  blueprint: RenderBlueprint,
): VisualSceneBlueprint {
  const envToSceneType: Record<SceneEnvironmentId, VisualSceneBlueprint["scene"]["sceneType"]> = {
    kitchen: "kitchen",
    bathroom: "lifestyle",
    garage: "industrial_studio",
    garden: "nature",
    living_room: "lifestyle",
    studio: "premium_studio",
    workshop: "workshop",
  };

  const lensMm = blueprint.camera.lens;

  return {
    version: "2.0",
    category: blueprint.product.category as VisualSceneBlueprint["category"],
    story: {
      storyType: "lifestyle",
      targetEmotion:
        blueprint.story.emotionalTone === "luxury" ? "luxury" : "confidence",
      usageContext: "home",
    },
    scene: {
      sceneType: envToSceneType[blueprint.scene.environment] ?? "lifestyle",
      architecture: blueprint.scene.architecture === "industrial" ? "workshop" : "outdoor",
      depth: blueprint.scene.depth,
      weather: blueprint.scene.weather === "cloudy" ? "overcast" : "clear",
      time:
        blueprint.scene.timeOfDay === "golden_hour"
          ? "golden_hour"
          : blueprint.scene.timeOfDay === "morning"
            ? "morning"
            : "noon",
      visualDensity: 1 - blueprint.background.decorDensity,
    },
    lighting: {
      preset: "luxury_softbox",
      keyLight: "soft",
      fill: "balanced",
      rim: "subtle",
      temperatureK: blueprint.lighting.temperature,
      contrast: blueprint.photography.contrast,
      shadowStyle: "soft",
    },
    camera: {
      lensMm,
      angle:
        blueprint.camera.height === "low"
          ? "low_hero"
          : blueprint.camera.height === "high"
            ? "top_down"
            : "eye_level",
      distance:
        blueprint.camera.distance === "close"
          ? "close"
          : blueprint.camera.distance === "far"
            ? "wide"
            : "medium",
      framing: blueprint.photography.shotType === "wide" ? "environment_context" : "product_hero",
      perspective: blueprint.camera.perspective === "dramatic" ? "compressed" : "natural",
    },
    materials: {
      floor: "soft_concrete",
      background: "graphite",
      surface: "matte_aluminum",
      reflection:
        blueprint.materials.reflection === "none"
          ? "none"
          : blueprint.materials.reflection === "soft"
            ? "subtle"
            : "moderate",
      texture: "matte",
    },
    mood: "confidence",
    palette: blueprint.product.dominantColor,
    composition: {
      heroPosition:
        blueprint.composition.template === "hero_left" ? "bottom-left" : "bottom-right",
      negativeSpace: blueprint.composition.template === "hero_left" ? "right" : "left",
      balance: "asymmetric_hero_right",
      visualWeight: {
        hero: blueprint.composition.heroWeight,
        background: 25,
        headline: 20,
      },
      safeZones: [],
    },
    negative: { terms: [] },
    constraints: {
      noProduct: true,
      noText: true,
      noLogos: true,
      noPeople: true,
      backdropOnly: true,
    },
  };
}

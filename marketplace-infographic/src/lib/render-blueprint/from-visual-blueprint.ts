import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import type { ProductCategory } from "@/lib/product-analysis";
import { buildGeometryFromTemplate } from "@/lib/design/composition-director/geometry";
import { COMPOSITION_TEMPLATES } from "@/lib/design/composition-director/templates";
import { environmentFromCoverConcept, type SceneEnvironmentId } from "./environment";
import type { RenderBlueprint, RenderBlueprintInput } from "./types";
import { RENDER_BLUEPRINT_VERSION } from "./types";
import type { CoverConceptId } from "@/lib/cover-concepts";

const DEFAULT_CONSTRAINTS = {
  noProduct: true as const,
  noText: true as const,
  noLogos: true as const,
  noPeople: true as const,
  backdropOnly: true as const,
};

function mapArchitectureToEnvironment(arch: string): SceneEnvironmentId {
  const table: Record<string, SceneEnvironmentId> = {
    studio: "studio_commercial",
    workshop: "workshop",
    kitchen: "kitchen",
    outdoor: "outdoor_lifestyle",
    corporate: "studio_commercial",
    home_interior: "home_interior",
    tech_stage: "tech_showcase",
    nature: "nature",
  };
  return table[arch] ?? "studio_commercial";
}

export function createEmptyRenderBlueprint(input: RenderBlueprintInput): RenderBlueprint {
  const environment = input.environment ?? "studio_commercial";
  const defaultGeometry = buildGeometryFromTemplate(COMPOSITION_TEMPLATES.hero_right, input.seed);

  return {
    version: RENDER_BLUEPRINT_VERSION,
    meta: {
      category: input.category,
      seed: input.seed,
      locked: false,
      trace: [{ agentId: "system", section: "scene", action: "set", at: new Date().toISOString() }],
    },
    knowledge: { category: input.category },
    creativeIntent: {
      customerNeed: input.customerNeed ?? "",
      sellingAngle: "",
      priceSegment: "mid",
    },
    story: {
      emotion: "confidence",
      customerNeed: input.customerNeed ?? "",
      visualNarrative: "",
    },
    scene: {
      environment,
      time: "studio_neutral",
      weather: "indoor_controlled",
      depth: "medium",
      visualDensity: 0.35,
    },
    photography: {
      lensMm: 50,
      cameraHeight: "eye_level",
      distance: "medium",
      depthOfField: "medium",
      lightingPreset: "luxury_softbox",
    },
    layout: {
      templateId: "modern",
      geometry: defaultGeometry,
      whitespaceTarget: 28,
      heroScale: 0.58,
      heroPosition: "right",
      negativeSpace: "left",
    },
    lighting: {
      preset: "luxury_softbox",
      keyLight: "soft",
      fill: "balanced",
      rim: "subtle",
      temperatureK: 5600,
      contrast: "medium",
      shadowStyle: "soft",
    },
    camera: {
      lensMm: 50,
      angle: "eye_level",
      distance: "medium",
      framing: "product_hero",
      perspective: "natural",
    },
    materials: {
      floor: "soft_concrete",
      background: "graphite",
      surface: "matte_aluminum",
      reflection: "subtle",
      texture: "matte",
    },
    palette: input.palette ?? ["#1a1a2e", "#ffffff", "#e94560", "#f5f5f5"],
    constraints: DEFAULT_CONSTRAINTS,
    render: { model: "flux" },
  };
}

/** Мост v17 VisualSceneBlueprint + LayoutSpec → RenderBlueprint */
export function renderBlueprintFromVisualPipeline(
  visual: VisualSceneBlueprint,
  layoutSpec: LayoutSpec | undefined,
  seed: string,
  coverConceptId?: CoverConceptId,
): RenderBlueprint {
  const environment = coverConceptId
    ? environmentFromCoverConcept(coverConceptId)
    : mapArchitectureToEnvironment(visual.scene.architecture);

  const base = createEmptyRenderBlueprint({
    category: visual.category,
    seed,
    environment,
    palette: visual.palette,
  });

  return {
    ...base,
    story: {
      emotion: visual.story.targetEmotion,
      customerNeed: base.story.customerNeed,
      visualNarrative: "",
      storyType: visual.story.storyType,
      usageContext: visual.story.usageContext,
    },
    scene: {
      environment,
      time: visual.scene.time,
      weather: visual.scene.weather,
      depth: visual.scene.depth,
      visualDensity: visual.scene.visualDensity,
    },
    photography: {
      lensMm: visual.camera.lensMm,
      cameraHeight: visual.camera.angle,
      distance: visual.camera.distance,
      depthOfField: "medium",
      lightingPreset: visual.lighting.preset,
      framing: visual.camera.framing,
    },
    lighting: { ...visual.lighting },
    camera: { ...visual.camera },
    materials: { ...visual.materials },
    layout: layoutSpec?.geometry
      ? {
          templateId:
            (layoutSpec.compositionTemplateId as RenderBlueprint["layout"]["templateId"]) ?? "modern",
          geometry: layoutSpec.geometry,
          whitespaceTarget: layoutSpec.whitespaceTarget,
          heroScale: layoutSpec.heroScale,
          heroPosition:
            layoutSpec.heroPosition === "left"
              ? "left"
              : layoutSpec.heroPosition === "right"
                ? "right"
                : "center",
          negativeSpace: layoutSpec.headlineArea === "left" ? "right" : "left",
        }
      : base.layout,
    palette: visual.palette,
    constraints: {
      noProduct: true,
      noText: true,
      noLogos: true,
      noPeople: true,
      backdropOnly: true,
    },
  };
}

export function renderBlueprintToVisualSceneBlueprint(
  blueprint: RenderBlueprint,
): Pick<VisualSceneBlueprint, "story" | "scene" | "lighting" | "camera" | "materials" | "palette" | "mood" | "composition" | "negative" | "constraints" | "category" | "version"> {
  const sceneTypeMap: Record<SceneEnvironmentId, VisualSceneBlueprint["scene"]["sceneType"]> = {
    studio_commercial: "premium_studio",
    studio_premium: "premium_studio",
    outdoor_lifestyle: "nature",
    residential_backyard: "nature",
    garden_lawn: "nature",
    home_interior: "lifestyle",
    kitchen: "kitchen",
    workshop: "workshop",
    tech_showcase: "technology",
    nature: "nature",
    industrial_floor: "industrial_studio",
    retail_shelf: "lifestyle",
  };

  return {
    version: "2.0",
    category: blueprint.meta.category,
    story: {
      storyType: blueprint.story.storyType ?? "lifestyle",
      targetEmotion:
        blueprint.story.emotion === "security" || blueprint.story.emotion === "reliability"
          ? "trust"
          : blueprint.story.emotion,
      usageContext: blueprint.story.usageContext ?? "home",
    },
    scene: {
      sceneType: sceneTypeMap[blueprint.scene.environment] ?? "lifestyle",
      architecture: "outdoor",
      depth: blueprint.scene.depth,
      weather: blueprint.scene.weather,
      time: blueprint.scene.time,
      visualDensity: blueprint.scene.visualDensity,
    },
    lighting: blueprint.lighting,
    camera: blueprint.camera,
    materials: blueprint.materials,
    mood: blueprint.story.emotion === "security" ? "trust" : (blueprint.story.emotion as VisualSceneBlueprint["mood"]),
    palette: blueprint.palette,
    composition: {
      heroPosition: blueprint.layout.heroPosition === "left" ? "bottom-left" : "bottom-right",
      negativeSpace: blueprint.layout.negativeSpace,
      balance: "asymmetric_hero_right",
      visualWeight: { hero: 55, background: 25, headline: 20 },
      safeZones: [],
    },
    negative: { terms: [] },
    constraints: blueprint.constraints,
  };
}

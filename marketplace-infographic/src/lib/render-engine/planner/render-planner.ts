import { createHash } from "crypto";
import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type {
  RenderRequest,
  RenderProviderId,
  RenderNegativeBlock,
  RenderEngineVersion,
} from "../types";
import {
  RENDER_ENGINE_VERSION,
} from "../types";
import { RENDER_ENGINE_CONFIG } from "../config";
import { resolveRenderProfileId, getRenderProfile } from "../profiles";
import { selectRenderModel } from "./model-selection";
import { compileNegativeTerms } from "../adapters/negative";

export type RenderPlannerInput = {
  analysis: ProductAnalysis;
  scenePlan: ScenePlan;
  layoutSpec?: LayoutSpec;
  sceneBlueprint?: SceneBlueprint;
  visualBlueprint?: import("@/lib/design/visual-pipeline/types").VisualSceneBlueprint;
  providerId?: RenderProviderId;
  attemptIndex?: number;
  modelOverride?: import("../types").RenderModelId;
  luxuryScore?: number;
  compositionScore?: number;
  sceneScore?: number;
  constitutionPassed?: boolean;
};

function requestId(input: RenderPlannerInput): string {
  const raw = `${input.analysis.category}:${input.scenePlan.coverConceptId}:${input.attemptIndex ?? 0}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function buildNegative(
  scenePlan: ScenePlan,
  layoutSpec?: LayoutSpec,
  profileExtras: string[] = [],
): RenderNegativeBlock {
  return {
    terms: compileNegativeTerms({ layoutSpec, profileExtras }),
    zoneExclusions: scenePlan.textSafeZones.map((z) => `objects in ${z.purpose} area`),
  };
}

/**
 * Render Planner — NEVER writes prompts.
 * Creates structured RenderRequest from pipeline outputs.
 */
export function planRenderRequest(input: RenderPlannerInput): RenderRequest {
  const bp = input.sceneBlueprint;
  const spec = input.layoutSpec;
  const profileId = resolveRenderProfileId({
    category: input.analysis.category,
    priceSegment: input.analysis.priceSegment,
    sceneType: bp?.scene.type,
    compositionTemplate: spec?.compositionTemplateId,
  });
  const profile = getRenderProfile(profileId);
  const modelId = selectRenderModel({
    profileId,
    attemptIndex: input.attemptIndex,
    override: input.modelOverride,
  });
  const providerId =
    input.providerId ??
    (RENDER_ENGINE_CONFIG.defaultProvider as RenderProviderId);

  const pz = input.scenePlan.productSafeZone;
  const cx = Math.round((pz.centerX[0] + pz.centerX[1]) / 2);
  const cy = Math.round((pz.centerY[0] + pz.centerY[1]) / 2);

  return {
    version: RENDER_ENGINE_VERSION as RenderEngineVersion,
    requestId: requestId(input),
    profileId,
    modelId,
    providerId,
    category: input.analysis.category,
    canvas: {
      width: RENDER_ENGINE_CONFIG.canvas.width,
      height: RENDER_ENGINE_CONFIG.canvas.height,
    },
    scene: {
      type: bp?.scene.type ?? input.scenePlan.coverConceptId,
      atmosphere: bp?.scene.atmosphere ?? input.scenePlan.visualMood,
      depth: bp?.scene.depth ?? "medium",
      environment: bp?.scene.environment ?? profile.environmentHint,
      floor: bp?.scene.floor ?? input.scenePlan.surfaceType,
      background: bp?.scene.background ?? input.scenePlan.backgroundType,
      visualDensity: bp?.scene.visualDensity ?? 0.1,
    },
    layout: {
      templateId: spec?.compositionTemplateId,
      heroPosition: spec?.heroPosition ?? "right",
      whitespaceTarget: spec?.whitespaceTarget ?? 28,
      heroZone: spec?.geometry?.hero
        ? {
            x: spec.geometry.hero.x,
            y: spec.geometry.hero.y,
            width: spec.geometry.hero.width,
            height: spec.geometry.hero.height,
          }
        : undefined,
      headlineZone: spec?.geometry?.headline
        ? {
            x: spec.geometry.headline.x,
            y: spec.geometry.headline.y,
            width: spec.geometry.headline.width,
            height: spec.geometry.headline.height,
          }
        : undefined,
      productPlacementPct: { cx, cy },
      textSafeZones: input.scenePlan.textSafeZones.map((z) => ({
        purpose: z.purpose,
        left: z.left,
        top: z.top,
        width: z.width,
        height: z.height,
      })),
      palette: (spec?.palette ?? []).slice(0, spec?.maxColors ?? 4),
      maxColors: spec?.maxColors ?? 4,
    },
    lighting: {
      preset: bp?.lighting.preset,
      key: bp?.lighting.key ?? profile.lighting.key ?? "soft commercial key",
      fill: bp?.lighting.fill ?? profile.lighting.fill ?? "ambient fill",
      rim: bp?.lighting.rim ?? profile.lighting.rim,
      back: bp?.lighting.back ?? profile.lighting.back,
      temperatureK: bp?.lighting.temperatureK ?? profile.lighting.temperatureK ?? 5000,
      direction: input.scenePlan.lightingDirection,
    },
    materials: {
      surface: profile.materials.surface ?? input.scenePlan.surfaceType,
      floor: bp?.scene.floor ?? profile.materials.floor ?? "studio floor",
      reflection: profile.materials.reflection ?? "subtle",
      atmosphere: profile.materials.atmosphere ?? "commercial",
    },
    camera: {
      lensMm: bp?.camera.lensMm ?? profile.camera.lensMm ?? 70,
      height: bp?.camera.height ?? profile.camera.height ?? "eye level",
      distance: bp?.camera.distance ?? profile.camera.distance ?? "medium",
      angle: bp?.camera.angle ?? profile.camera.angle ?? "commercial hero",
      depthOfField: input.scenePlan.depthOfField,
    },
    quality: {
      target: "8k",
      photorealistic: true,
      marketplaceOptimized: true,
      colorDiscipline: profile.quality.colorDiscipline ?? "max 4 colors",
    },
    negative: buildNegative(input.scenePlan, spec, profile.negativeExtras),
    providerHints: {
      preferredModel: modelId,
      nologo: true,
      safe: true,
    },
    metadata: {
      constitutionPassed: input.constitutionPassed,
      compositionScore: input.compositionScore,
      sceneScore: input.sceneScore,
      luxuryScore: input.luxuryScore,
      visualBlueprint: input.visualBlueprint,
    },
  };
}

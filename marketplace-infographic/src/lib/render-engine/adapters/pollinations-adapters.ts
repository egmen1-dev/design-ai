import type { RenderAdapter, RenderRequest, CompiledRenderPayload } from "../types";
import { joinNegativeTerms } from "./negative";

const BACKDROP_ONLY =
  "empty foreground for product compositing, backdrop only, no objects in product zone, no text, no letters, no watermark";

function sceneModule(req: RenderRequest): string {
  return `${req.scene.environment}, ${req.scene.floor} surface, ${req.scene.atmosphere} atmosphere, depth ${req.scene.depth}`;
}

function lightingModule(req: RenderRequest): string {
  const parts = [
    `lighting ${req.lighting.key}`,
    req.lighting.fill,
    req.lighting.rim ? `rim ${req.lighting.rim}` : null,
    req.lighting.temperatureK ? `${req.lighting.temperatureK}K` : null,
  ].filter(Boolean);
  return parts.join(", ");
}

function environmentModule(req: RenderRequest): string {
  return `${req.scene.background}, ${req.materials.floor}, ${req.materials.reflection} reflections, ${req.materials.atmosphere}`;
}

function cameraModule(req: RenderRequest): string {
  return `${req.camera.lensMm}mm lens, ${req.camera.height}, ${req.camera.distance}, ${req.camera.angle}, ${req.camera.depthOfField}`;
}

function materialsModule(req: RenderRequest): string {
  return `${req.materials.surface} surface, physical accuracy, contact shadow area`;
}

function qualityModule(req: RenderRequest): string {
  return `${req.quality.colorDiscipline}, photorealistic commercial advertising photography, ${req.quality.target}`;
}

/** Flux adapter — compact modules, ignores coordinates */
export class PollinationsFluxAdapter implements RenderAdapter {
  readonly id = "pollinations-flux";
  readonly modelId = "flux" as const;
  readonly providerId = "pollinations" as const;

  compile(request: RenderRequest): CompiledRenderPayload {
    const modulesUsed = ["scene", "lighting", "environment", "camera", "materials", "quality"];
    const modulesIgnored = ["layout_coordinates", "hierarchy", "typography_zones"];

    const prompt = [
      "ultra realistic commercial product photography background",
      sceneModule(request),
      lightingModule(request),
      environmentModule(request),
      cameraModule(request),
      materialsModule(request),
      qualityModule(request),
      BACKDROP_ONLY,
    ].join(", ");

    return {
      model: "flux",
      prompt,
      negativePrompt: joinNegativeTerms([
        ...request.negative.terms,
        ...request.negative.zoneExclusions,
      ]),
      width: request.canvas.width,
      height: request.canvas.height,
      modulesUsed,
      modulesIgnored,
      extraParams: { safe: true },
    };
  }
}

export class PollinationsFluxKontextAdapter implements RenderAdapter {
  readonly id = "pollinations-kontext";
  readonly modelId = "kontext" as const;
  readonly providerId = "pollinations" as const;

  compile(request: RenderRequest): CompiledRenderPayload {
    const modulesUsed = ["scene", "environment", "lighting", "materials"];
    const modulesIgnored = ["camera_precision", "layout_coordinates"];

    const prompt = [
      "transform background for commercial product card",
      sceneModule(request),
      environmentModule(request),
      lightingModule(request),
      materialsModule(request),
      "preserve composition, reduce clutter, empty product zone",
      BACKDROP_ONLY,
    ].join(", ");

    return {
      model: "kontext",
      prompt,
      negativePrompt: joinNegativeTerms(request.negative.terms),
      width: request.canvas.width,
      height: request.canvas.height,
      referenceImageUrl: request.providerHints.referenceImageUrl,
      modulesUsed,
      modulesIgnored,
      extraParams: { safe: true },
    };
  }
}

export class PollinationsGPTImageAdapter implements RenderAdapter {
  readonly id = "pollinations-gptimage";
  readonly modelId = "gptimage" as const;
  readonly providerId = "pollinations" as const;

  compile(request: RenderRequest): CompiledRenderPayload {
    const modulesUsed = ["scene", "lighting", "quality"];
    const modulesIgnored = ["technical_camera", "layout_coordinates", "negative_prompt"];

    const prompt = [
      `Premium ${request.profileId} marketplace card background.`,
      sceneModule(request),
      lightingModule(request),
      qualityModule(request),
      "Editorial luxury advertising. Empty center for product. No text. No logos.",
    ].join(" ");

    return {
      model: "gptimage",
      prompt,
      width: request.canvas.width,
      height: request.canvas.height,
      modulesUsed,
      modulesIgnored: [...modulesIgnored, "negative_prompt"],
      extraParams: { quality: "high" },
    };
  }
}

export class PollinationsSeedreamAdapter implements RenderAdapter {
  readonly id = "pollinations-seedream";
  readonly modelId = "seedream" as const;
  readonly providerId = "pollinations" as const;

  compile(request: RenderRequest): CompiledRenderPayload {
    const modulesUsed = ["scene", "environment", "lighting"];
    const modulesIgnored = ["layout_coordinates", "hierarchy"];

    const prompt = [
      "lifestyle commercial photography background",
      sceneModule(request),
      environmentModule(request),
      lightingModule(request),
      "natural authentic atmosphere, empty foreground, no product, no text",
    ].join(", ");

    return {
      model: "seedream",
      prompt,
      negativePrompt: joinNegativeTerms(request.negative.terms.slice(0, 12)),
      width: Math.max(960, request.canvas.width),
      height: Math.max(960, request.canvas.height),
      modulesUsed,
      modulesIgnored,
      extraParams: { safe: true },
    };
  }
}

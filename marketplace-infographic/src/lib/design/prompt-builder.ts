import type { ProductAnalysis } from "@/lib/product-analysis";
import type { ScenePlan, SafeZone } from "./scene-planner";

function formatSafeZones(zones: SafeZone[]): string {
  return zones
    .map(
      (z) =>
        `${z.purpose} zone at ${z.left}% left ${z.top}% top (${z.width}%×${z.height}%), keep empty`,
    )
    .join("; ");
}

function productZonePrompt(zone: ScenePlan["productSafeZone"]): string {
  const cx = Math.round((zone.centerX[0] + zone.centerX[1]) / 2);
  const cy = Math.round((zone.centerY[0] + zone.centerY[1]) / 2);
  const w = Math.round((zone.widthPct[0] + zone.widthPct[1]) / 2);
  const h = Math.round((zone.heightPct[0] + zone.heightPct[1]) / 2);
  return `clear empty product placement area around ${cx}% horizontal ${cy}% vertical, approximately ${w}% width ${h}% height, no objects`;
}

/** Детальный промпт сцены для Stable Diffusion — не короткие описания */
export function buildSceneBackgroundPrompt(
  scene: ScenePlan,
  analysis: ProductAnalysis,
  productContext?: { dominantColors?: string[]; shape?: string },
): string {
  const categoryLabel = analysis.category.replace(/_/g, " ");
  const safeZones = formatSafeZones(scene.textSafeZones);
  const productZone = productZonePrompt(scene.productSafeZone);
  const colorHint = productContext?.dominantColors?.slice(0, 2).join(" and ") ?? "neutral";

  const lighting = [
    `key light from ${scene.lightingDirection}`,
    `color temperature ${scene.lightingTemperature}`,
    scene.shadowProfile === "ambient"
      ? "soft ambient fill, gentle shadow falloff"
      : scene.shadowProfile === "contact"
        ? "defined contact shadows on surface"
        : "balanced key and fill with natural shadow gradient",
  ].join(", ");

  const environment = (() => {
    switch (scene.coverConceptId) {
      case "commercial_studio":
        return "professional advertising photography studio, seamless gradient backdrop, polished floor with subtle reflection, commercial catalog atmosphere";
      case "outdoor_lifestyle":
        return "authentic outdoor lifestyle environment, natural surroundings blurred in background, realistic ground surface, environmental context for consumer product";
      case "home_interior":
        return "modern cozy home interior, tasteful furniture bokeh, warm domestic atmosphere, realistic floor or counter surface";
      case "garden_scene":
        return "sunny suburban garden, lush green lawn, soft natural path, wooden fence and foliage in deep bokeh, golden hour warmth";
      case "tech_showcase":
        return "premium tech product showcase, dark gradient studio, subtle rim lighting, reflective pedestal surface, futuristic commercial aesthetic";
      case "premium_minimal":
        return "luxury minimal catalog studio, vast negative space, soft beige and cream tones, high-end editorial photography";
      default:
        return "commercial product photography environment";
    }
  })();

  const surface = (() => {
    switch (scene.surfaceType) {
      case "glass":
        return "glass surface with subtle reflections";
      case "tile":
        return "clean ceramic tile floor";
      case "water":
        return "calm water surface with soft ripples";
      case "gloss":
        return "glossy reflective pedestal";
      case "grass":
        return "natural grass foreground, organic texture";
      case "earth":
        return "natural earth and soil texture";
      case "fabric":
        return "soft fabric surface, matte texture";
      case "matte":
        return "matte interior surface, no reflections";
      default:
        return "studio floor with soft contact shadow area";
    }
  })();

  const parts = [
    "ultra realistic commercial product photography background",
    `for ${categoryLabel} marketplace card`,
    environment,
    surface,
    `camera: ${scene.cameraAngle}, ${scene.cameraHeight}, ${scene.cameraDistance}`,
    `depth of field: ${scene.depthOfField}`,
    lighting,
    `visual mood: ${scene.visualMood}`,
    `color harmony: ${scene.colorHarmony}, complementing product tones ${colorHint}`,
    `horizon: ${scene.horizon}`,
    productZone,
    `reserved text areas: ${safeZones}`,
    "perspective lines leading to product zone",
    "atmospheric depth, layered foreground midground background",
    "materials rendered with physical accuracy",
    "subtle environmental reflections only on appropriate surfaces",
    "background bokeh, no busy patterns in text zones",
    "no text, no words, no letters, no typography, no watermark, no logo",
    "no product, no equipment, no objects in foreground placement area",
    "empty foreground ready for product compositing",
    "8k, photorealistic, advertising quality",
  ];

  return parts.join(", ");
}

/** Negative-prompt дополнения для safe zones */
export function buildSceneNegativeHints(scene: ScenePlan): string {
  const zones = scene.textSafeZones
    .map((z) => `no objects in ${z.purpose} area`)
    .join(", ");
  return `${zones}, no clutter in product zone, no duplicate objects`;
}

import type { ProductCategory } from "@/lib/product-analysis";
import type {
  SceneBlueprint,
  SceneDirectorInput,
  SceneDirectorResult,
  SceneTypeId,
} from "./types";
import { SCENE_QUALITY_PASS_THRESHOLD } from "./types";
import { buildBlueprintFromTemplate, resolveSceneType, SCENE_TEMPLATES } from "./templates";
import { scoreSceneBlueprint, applyQualityPatch } from "./quality";
import { resolveLighting } from "./lighting";

const MAX_SCENE_ATTEMPTS = 2;

function genomeSceneHint(genome?: SceneDirectorInput["genomeContext"]): SceneTypeId | undefined {
  const layout = genome?.mutatedGenome.composition.layoutTemplate;
  if (layout === "luxury" || layout === "premium") return "premium_studio";
  if (layout === "technical" || layout === "modern" || layout === "glass") return "technology";
  if (layout === "lifestyle") return "lifestyle";
  return undefined;
}

function marketSceneHint(snippet?: string): SceneTypeId | undefined {
  if (!snippet) return undefined;
  if (/dark|premium|luxury/i.test(snippet)) return "modern_dark";
  if (/lifestyle|home|interior/i.test(snippet)) return "lifestyle";
  if (/tech|electronic/i.test(snippet)) return "technology";
  return undefined;
}

function buildSceneDirectorBlueprint(
  input: SceneDirectorInput,
  sceneType: SceneTypeId,
  attempt: number,
): SceneBlueprint {
  const template = SCENE_TEMPLATES[sceneType];
  const pricePremium = input.analysis.priceSegment === "premium";

  const heroScale =
    input.genomeContext?.mutatedGenome.composition.productScalePct != null
      ? Math.min(0.65, Math.max(0.4, input.genomeContext.mutatedGenome.composition.productScalePct / 100))
      : 0.46;

  const heroPosition =
    input.storyDirection?.compositionScenarioId === "minimal_premium"
      ? "center-right"
      : "bottom-right";

  const lighting =
    attempt > 0
      ? resolveLighting("luxury_softbox")
      : resolveLighting(template.lighting);

  return buildBlueprintFromTemplate(sceneType, {
    lighting,
    hero: {
      position: heroPosition as SceneBlueprint["hero"]["position"],
      rotationDeg: -4,
      scale: heroScale,
      anchor: "ground",
    },
    headline: {
      position: "top-left",
      widthRatio: pricePremium ? 0.32 : 0.34,
    },
    accent: {
      glow: false,
      particles: false,
      shapes: attempt > 0 ? "none" : "minimal",
      maxGradients: 1,
    },
    camera: {
      lensMm: input.analysis.category === "electronics" ? 65 : 70,
      height: "eye level",
      distance: "medium",
      angle:
        input.analysis.category === "auto"
          ? "low hero angle"
          : "three-quarter commercial hero",
    },
    premiumFeeling: template.premiumFeeling + (pricePremium ? 4 : 0),
    scene: {
      type: sceneType,
      environment: template.environment,
      floor: template.material.replace(/_/g, " "),
      background: template.background,
      depth: attempt > 0 ? "medium" : "medium",
      atmosphere: template.atmosphere,
      material: template.material,
      visualDensity: attempt > 0 ? 0.08 : template.decorative.maxDensity,
    },
  });
}

/**
 * Scene Director — design decisions only, NO prompt generation.
 * Consumes Market + Knowledge + Genome + Story → SceneBlueprint
 */
export async function runSceneDirector(input: SceneDirectorInput): Promise<SceneDirectorResult> {
  const photoSceneType = input.genomeContext?.photoBlueprint?.sceneType;
  const sceneType = resolveSceneType(
    input.analysis.category,
    input.analysis.priceSegment,
    genomeSceneHint(input.genomeContext) ??
      marketSceneHint(input.marketSnippet) ??
      (photoSceneType && photoSceneType in SCENE_TEMPLATES ? (photoSceneType as SceneTypeId) : undefined),
  );

  let blueprint = buildSceneDirectorBlueprint(input, sceneType, 0);
  let quality = scoreSceneBlueprint(blueprint);
  let attempts = 1;

  while (!quality.passed && attempts < MAX_SCENE_ATTEMPTS) {
    blueprint = applyQualityPatch(buildSceneDirectorBlueprint(input, sceneType, attempts));
    quality = scoreSceneBlueprint(blueprint);
    attempts++;
  }

  const approved = quality.total >= SCENE_QUALITY_PASS_THRESHOLD;

  return {
    blueprint,
    quality,
    approved,
    attempts,
    sceneType,
    agentSnippet: `Scene:${sceneType} Q:${quality.total} L:${quality.lightingQuality}`,
    source: "template",
  };
}

export function categoryDefaultSceneType(category: ProductCategory): SceneTypeId {
  return resolveSceneType(category, "mid");
}

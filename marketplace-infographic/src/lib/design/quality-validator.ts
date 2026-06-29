import type { CompositionLayout } from "@/lib/composition/types";
import type { CompositionScore } from "@/lib/design/types";
import { scoreComposition } from "@/lib/design/score";
import type { DesignDNA } from "@/lib/design/types";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { SceneLightingProfile } from "@/lib/compositing/scene-analysis";

export type QualityDimension = {
  id: string;
  score: number;
  weight: number;
};

export type QualityValidationResult = {
  total: number;
  passed: boolean;
  dimensions: QualityDimension[];
  issues: string[];
  suggestions: string[];
};

export type QualityValidatorInput = {
  compositionLayout?: CompositionLayout;
  compositionScore?: CompositionScore;
  dna?: DesignDNA;
  scene: ScenePlan;
  lighting?: SceneLightingProfile;
  productAreaPct?: number;
  hasReflection?: boolean;
  hasShadows?: boolean;
};

const PASS_THRESHOLD = 90;

function scoreReadability(layout?: CompositionLayout): number {
  if (!layout) return 70;
  const headline = layout.headline;
  if (headline.fontSizePct < 3.8) return 55;
  if (headline.width < 32) return 65;
  const overlap = layout.metrics?.overlapPct ?? 0;
  if (overlap > 8) return 60;
  if (overlap > 4) return 75;
  return 92;
}

function scoreLightingConsistency(
  scene: ScenePlan,
  lighting?: SceneLightingProfile,
): number {
  if (!lighting) return 75;
  const expectedKelvin = Number(scene.lightingTemperature.replace(/\D/g, "")) || 5500;
  const kelvinDiff = Math.abs(lighting.temperatureKelvin - expectedKelvin);
  if (kelvinDiff > 1800) return 62;
  if (kelvinDiff > 900) return 78;
  return 94;
}

function scoreColorHarmony(scene: ScenePlan, lighting?: SceneLightingProfile): number {
  if (!lighting) return 80;
  const warmthMatch =
    scene.colorHarmony.includes("warm") && lighting.warmth > 0
      ? 92
      : scene.colorHarmony.includes("cool") && lighting.warmth < 0
        ? 92
        : 85;
  return Math.min(100, warmthMatch + (lighting.contrast < 0.25 ? 4 : 0));
}

function scoreDepth(scene: ScenePlan, lighting?: SceneLightingProfile): number {
  let score = 80;
  if (scene.depthOfField.includes("shallow")) score += 8;
  if (lighting && lighting.contrast > 0.08) score += 6;
  return Math.min(100, score);
}

function scoreShadowQuality(scene: ScenePlan, hasShadows?: boolean): number {
  if (!hasShadows) return scene.shadowProfile === "ambient" ? 85 : 60;
  return scene.shadowProfile === "mixed" ? 95 : 88;
}

/** Оценивает качество перед сохранением — 0..100 */
export function validateQuality(input: QualityValidatorInput): QualityValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const compScore = input.compositionScore?.total ?? 75;
  const readability = scoreReadability(input.compositionLayout);
  const lighting = scoreLightingConsistency(input.scene, input.lighting);
  const colorHarmony = scoreColorHarmony(input.scene, input.lighting);
  const depth = scoreDepth(input.scene, input.lighting);
  const shadows = scoreShadowQuality(input.scene, input.hasShadows);

  const productSize = (() => {
    const area = input.productAreaPct ?? input.compositionLayout?.metrics?.productAreaPct ?? 60;
    if (area < 55) {
      issues.push("product_too_small");
      suggestions.push("increase_product_scale");
      return 65;
    }
    if (area > 74) {
      issues.push("product_too_large");
      suggestions.push("decrease_product_scale");
      return 72;
    }
    return 95;
  })();

  const whitespace = (() => {
    const ws = input.compositionLayout?.metrics?.whitespacePct ?? 25;
    if (ws < 18) {
      issues.push("frame_too_busy");
      suggestions.push("regenerate_background");
      return 68;
    }
    if (ws > 42) {
      issues.push("too_much_empty_space");
      return 78;
    }
    return 90;
  })();

  const dimensions: QualityDimension[] = [
    { id: "composition_balance", score: compScore, weight: 0.16 },
    { id: "text_readability", score: readability, weight: 0.12 },
    { id: "frame_fill", score: whitespace, weight: 0.1 },
    { id: "whitespace", score: whitespace, weight: 0.08 },
    { id: "product_size", score: productSize, weight: 0.14 },
    { id: "lighting_consistency", score: lighting, weight: 0.14 },
    { id: "shadow_quality", score: shadows, weight: 0.1 },
    { id: "color_harmony", score: colorHarmony, weight: 0.1 },
    { id: "depth_feeling", score: depth, weight: 0.06 },
  ];

  const total = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) /
      dimensions.reduce((sum, d) => sum + d.weight, 0),
  );

  if (total < PASS_THRESHOLD) {
    if (!suggestions.includes("regenerate_background")) {
      suggestions.push("adjust_composition");
    }
  }

  return {
    total,
    passed: total >= PASS_THRESHOLD,
    dimensions,
    issues,
    suggestions,
  };
}

/** Пересчитывает composition score если есть layout + dna */
export function resolveCompositionScore(
  layout?: CompositionLayout,
  dna?: DesignDNA,
): CompositionScore | undefined {
  if (!layout || !dna) return undefined;
  return scoreComposition(layout, dna);
}

export { PASS_THRESHOLD as QUALITY_PASS_THRESHOLD };

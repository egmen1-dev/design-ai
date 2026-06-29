import type { ProductCategory } from "@/lib/product-analysis";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { KnowledgeCategory, PatternSnapshot } from "./types";
import { PRODUCT_TO_KNOWLEDGE } from "./types";

export function resolveKnowledgeCategory(
  prompt: string,
  productCategory: ProductCategory,
): KnowledgeCategory {
  if (/генератор|generator/i.test(prompt)) return "generator";
  if (/мебел|диван|кресл|стол|шкаф/i.test(prompt)) return "furniture";
  if (/питом|корм.*собак|корм.*кош|pet\b/i.test(prompt)) return "pets";
  return PRODUCT_TO_KNOWLEDGE[productCategory] ?? "generic";
}

export function lightingTypeFromScene(scene?: ScenePlan): string {
  if (!scene) return "studio_neutral";
  const temp = scene.lightingTemperature.toLowerCase();
  const warm =
    temp.includes("warm") || /\b[34]\d{3}\b/.test(temp)
      ? "warm"
      : temp.includes("cool") || /\b[678]\d{3}\b/.test(temp)
        ? "cool"
        : "neutral";
  const dir = scene.lightingDirection
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 20);
  return `${warm}_${dir || "studio"}`;
}

export function backgroundTypeFromScene(scene?: ScenePlan): string {
  if (!scene) return "studio";
  return scene.backgroundType
    ? scene.backgroundType.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32)
    : scene.surfaceType;
}

export function buildPatternKey(snapshot: PatternSnapshot): string {
  return [
    snapshot.category,
    snapshot.layoutTemplate,
    snapshot.compositionType,
    snapshot.backgroundType,
    snapshot.lightingType,
    snapshot.fontFamily,
    snapshot.badgeStyle,
  ].join("|");
}

export function buildPatternSnapshot(input: {
  category: KnowledgeCategory;
  layoutTemplate?: string;
  compositionType?: string;
  scenePlan?: ScenePlan;
  fontFamily?: string | null;
  badgeStyle?: string | null;
  productScale?: number;
  textDensity?: number;
  negativeSpace?: number;
  primaryColor?: string;
  secondaryColor?: string;
}): PatternSnapshot {
  return {
    category: input.category,
    layoutTemplate: input.layoutTemplate ?? "hero_left",
    compositionType: input.compositionType ?? "hero_product",
    backgroundType: backgroundTypeFromScene(input.scenePlan),
    lightingType: lightingTypeFromScene(input.scenePlan),
    fontFamily: input.fontFamily ?? "default",
    badgeStyle: input.badgeStyle ?? "none",
    productScale: clamp(input.productScale ?? 0.66, 0.4, 0.85),
    textDensity: clamp(input.textDensity ?? 0.3, 0.05, 0.8),
    negativeSpace: clamp(input.negativeSpace ?? 0.25, 0.05, 0.6),
    primaryColor: input.primaryColor ?? "#1a1a2e",
    secondaryColor: input.secondaryColor ?? "#f97316",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

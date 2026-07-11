/**
 * Product Execution Sprint 1 — Hero Visual Mass
 * Closes Runtime Execution gap: Commercial Genome intent → compositor product mass.
 * Does NOT modify Commercial Genome, Category Profiles, or Attention Laws.
 */
import type { CompositionLayout } from "@/lib/composition/types";
import { WB_COVER } from "@/lib/composition/canvas";

export const HERO_VISUAL_MASS_FLAG = "DAOS_HERO_VISUAL_MASS";
export const HERO_VISUAL_MASS_VERSION = "1.0.0-execution-sprint-1";

/** Flat wide silhouettes (organizers, storage) — home category signature */
export const FLAT_ASPECT_RATIO_THRESHOLD = 1.12;

export type HeroVisualMassPolicy = {
  enabled: boolean;
  objectScaleMultiplier: number;
  zoneScaleBoost: number;
  zoneScaleSlope: number;
  alphaMaxWidthPct: number;
  alphaMaxHeightPct: number;
  headerReservePct: number;
  allowAlphaEnlargement: boolean;
  flatWideWidthBoost: number;
  minAlphaFillRatio: number;
};

const DEFAULT_POLICY: HeroVisualMassPolicy = {
  enabled: false,
  objectScaleMultiplier: 1,
  zoneScaleBoost: 0.58,
  zoneScaleSlope: 0.05,
  alphaMaxWidthPct: 0.56,
  alphaMaxHeightPct: 0.5,
  headerReservePct: 0.2,
  allowAlphaEnlargement: false,
  flatWideWidthBoost: 1,
  minAlphaFillRatio: 0,
};

const SPRINT1_POLICY: HeroVisualMassPolicy = {
  enabled: true,
  objectScaleMultiplier: 1.14,
  zoneScaleBoost: 0.72,
  zoneScaleSlope: 0.2,
  alphaMaxWidthPct: 0.78,
  alphaMaxHeightPct: 0.68,
  headerReservePct: 0.12,
  allowAlphaEnlargement: true,
  flatWideWidthBoost: 1.18,
  minAlphaFillRatio: 0.72,
};

export function isHeroVisualMassEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[HERO_VISUAL_MASS_FLAG] === "1";
}

export function getHeroVisualMassPolicy(
  env: NodeJS.ProcessEnv = process.env,
): HeroVisualMassPolicy {
  return isHeroVisualMassEnabled(env) ? SPRINT1_POLICY : DEFAULT_POLICY;
}

export function resolveHeroObjectScale(
  baseObjectScale: number,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const policy = getHeroVisualMassPolicy(env);
  if (!policy.enabled) return baseObjectScale;
  return Math.min(0.92, baseObjectScale * policy.objectScaleMultiplier);
}

export function resolveHeroAlphaLimits(policy: HeroVisualMassPolicy): {
  maxAlphaW: number;
  maxAlphaH: number;
  headerReservePx: number;
} {
  return {
    maxAlphaW: Math.round(WB_COVER.width * policy.alphaMaxWidthPct),
    maxAlphaH: Math.round(WB_COVER.height * policy.alphaMaxHeightPct),
    headerReservePx: Math.round(WB_COVER.height * policy.headerReservePct),
  };
}

/** Detect flat-wide cutout — organizers, storage boxes */
export function isFlatWideSilhouette(alphaWidth: number, alphaHeight: number): boolean {
  if (alphaHeight <= 0) return false;
  return alphaWidth / alphaHeight >= FLAT_ASPECT_RATIO_THRESHOLD;
}

export function resolveZoneScaleFactors(
  objectScale: number,
  policy: HeroVisualMassPolicy,
  flatWide: boolean,
): { scaleBoost: number; widthMultiplier: number } {
  const scaleBoost = policy.zoneScaleBoost + objectScale * policy.zoneScaleSlope;
  const widthMultiplier = flatWide && policy.enabled ? policy.flatWideWidthBoost : 1;
  return { scaleBoost, widthMultiplier };
}

export function computeHeroMaxProductSize(input: {
  compositionLayout: CompositionLayout | undefined;
  objectScale: number;
  canvasMaxW: number;
  canvasMaxH: number;
  productMaxW: number;
  productMaxH: number;
  flatWide?: boolean;
  env?: NodeJS.ProcessEnv;
}): { maxW: number; maxH: number; policy: HeroVisualMassPolicy } {
  const policy = getHeroVisualMassPolicy(input.env);
  const { scaleBoost, widthMultiplier } = resolveZoneScaleFactors(
    input.objectScale,
    policy,
    input.flatWide ?? false,
  );

  const comp = input.compositionLayout?.product;
  if (comp) {
    const zoneW = Math.round((comp.maxWidthPct / 100) * WB_COVER.width);
    const zoneH = Math.round((comp.maxHeightPct / 100) * WB_COVER.height);
    return {
      maxW: Math.min(
        input.canvasMaxW,
        input.productMaxW,
        Math.round(zoneW * scaleBoost * widthMultiplier),
      ),
      maxH: Math.min(input.canvasMaxH, input.productMaxH, Math.round(zoneH * scaleBoost)),
      policy,
    };
  }

  const scale = 0.55 + input.objectScale * (policy.enabled ? 0.28 : 0.18);
  return {
    maxW: Math.min(
      input.canvasMaxW,
      Math.round(input.canvasMaxW * scale * widthMultiplier),
    ),
    maxH: Math.min(input.canvasMaxH, Math.round(input.canvasMaxH * scale)),
    policy,
  };
}

import type { HierarchyMap, LayoutSpec } from "@/lib/design/layout-spec/types";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";
import { ASPIRATIONAL_PRODUCT_AREA_TARGET } from "@/lib/daos/commercial-genome-beta/product-area-targets";
import type { FidelityParameterId } from "./types";

export type CommercialExpectations = Record<FidelityParameterId, number>;

const SCENE_EXPECTATION: Record<
  NonNullable<LayoutSpec["scenePreference"]>,
  number
> = {
  industrial_technical: 72,
  outdoor_natural: 78,
  light_modern: 80,
  commercial_studio: 85,
};

const PALETTE_SEPARATION_EXPECTATION: Record<
  NonNullable<LayoutSpec["backgroundPalettePreference"]>,
  number
> = {
  cool_neutral: 70,
  green_neutral: 68,
  light_neutral: 75,
  medium_contrast: 82,
};

function hierarchyExpectation(hierarchy?: HierarchyMap): number {
  if (!hierarchy) return 70;
  const heroLeads = hierarchy.hero === "hero";
  const headlineLeads = hierarchy.headline === "H1";
  if (heroLeads && headlineLeads) return 78;
  if (heroLeads) return 85;
  if (headlineLeads) return 62;
  return 70;
}

function dominanceExpectation(primaryObject?: string): number {
  if (primaryObject === "product") return 85;
  if (primaryObject) return 70;
  return 65;
}

export type ProductAreaTargets = {
  reachableTarget: number;
  aspirationalTarget: number;
};

export function deriveProductAreaTargets(input: {
  layoutSpec?: LayoutSpec;
  visualBlueprint?: VisualSceneBlueprint;
}): ProductAreaTargets {
  const layout = input.layoutSpec;
  const snapshot = input.visualBlueprint?.commercial?.snapshot;

  const reachableTarget =
    layout?.reachableProductAreaPct ??
    layout?.productAreaPct ??
    (layout?.heroScale != null ? Math.round(layout.heroScale * 100) : undefined) ??
    snapshot?.productAreaPct ??
    (snapshot?.heroScale != null ? Math.round(snapshot.heroScale * 100) : 68);

  const aspirationalTarget =
    layout?.aspirationalProductAreaPct ??
    Math.round(ASPIRATIONAL_PRODUCT_AREA_TARGET * 100);

  return {
    reachableTarget,
    aspirationalTarget,
  };
}

/**
 * Derives expected fidelity targets from stabilized LayoutSpec / blueprint snapshot.
 * Product area uses reachable target (Sprint 8C), not aspirational EKB goal.
 */
export function deriveCommercialExpectations(input: {
  layoutSpec?: LayoutSpec;
  visualBlueprint?: VisualSceneBlueprint;
}): CommercialExpectations {
  const layout = input.layoutSpec;
  const snapshot = input.visualBlueprint?.commercial?.snapshot;
  const { reachableTarget } = deriveProductAreaTargets(input);

  const scenePreference =
    layout?.scenePreference ?? snapshot?.scenePreference ?? "commercial_studio";
  const palettePreference =
    layout?.backgroundPalettePreference ??
    snapshot?.backgroundPalettePreference ??
    "medium_contrast";
  const primaryObject = layout?.primaryObject ?? snapshot?.primaryObject;
  const hierarchy = layout?.hierarchy ?? snapshot?.hierarchy;

  return {
    product_area: reachableTarget,
    product_dominance: dominanceExpectation(primaryObject),
    visual_hierarchy: hierarchyExpectation(hierarchy),
    background_separation:
      PALETTE_SEPARATION_EXPECTATION[palettePreference] ?? 70,
    scene_consistency: SCENE_EXPECTATION[scenePreference] ?? 75,
  };
}

export type HeroZoneGeometry = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ZoneGeometry = HeroZoneGeometry;

/** Normalized 0–1 zones for marketplace hero-right layout */
export function resolveMeasurementZones(layoutSpec?: LayoutSpec): {
  hero: HeroZoneGeometry;
  headline: ZoneGeometry;
} {
  const hero = layoutSpec?.geometry?.hero;
  const headline = layoutSpec?.geometry?.headline;

  return {
    hero: hero
      ? {
          left: hero.x,
          top: hero.y,
          width: hero.width,
          height: hero.height,
        }
      : { left: 0.42, top: 0.3, width: 0.54, height: 0.58 },
    headline: headline
      ? {
          left: headline.x,
          top: headline.y,
          width: headline.width,
          height: headline.height,
        }
      : { left: 0.04, top: 0.05, width: 0.36, height: 0.28 },
  };
}

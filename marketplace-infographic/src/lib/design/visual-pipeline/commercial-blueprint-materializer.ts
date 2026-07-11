import type {
  BackgroundPalettePreference,
  HierarchyMap,
  LayoutSpec,
  ScenePreference,
} from "@/lib/design/layout-spec/types";
import type {
  CameraDecision,
  CommercialBlueprintDiagnostics,
  CommercialBlueprintExtension,
  CommercialBlueprintGuidance,
  CommercialBlueprintSnapshot,
  EnvironmentArchitectureId,
  VisualSceneBlueprint,
} from "./types";

export const PROVIDER_COMMERCIAL_VERSION = "1.0.0-sprint4";

const READABLE_COMMERCIAL_FIELDS = [
  "scenePreference",
  "backgroundPalettePreference",
  "heroScale",
  "productAreaPct",
  "primaryObject",
  "hierarchy",
] as const;

export type ReadableCommercialBlueprintField = (typeof READABLE_COMMERCIAL_FIELDS)[number];

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function scenePreferenceToArchitecture(pref: ScenePreference): EnvironmentArchitectureId {
  switch (pref) {
    case "industrial_technical":
      return "workshop";
    case "outdoor_natural":
      return "nature";
    case "light_modern":
      return "studio";
    case "commercial_studio":
      return "studio";
    default:
      return "studio";
  }
}

function scenePreferencePhrase(pref: ScenePreference): string {
  switch (pref) {
    case "industrial_technical":
      return "technical showcase stage with concrete floor plane, neutral walls";
    case "outdoor_natural":
      return "outdoor fresh natural ground plane backdrop";
    case "light_modern":
      return "light modern seamless studio cyclorama";
    case "commercial_studio":
      return "clean commercial photography studio cyclorama";
    default:
      return "commercial studio backdrop";
  }
}

function backgroundPalettePhrase(pref: BackgroundPalettePreference): string {
  switch (pref) {
    case "cool_neutral":
      return "cool neutral grey backdrop separation";
    case "green_neutral":
      return "green-neutral muted backdrop separation";
    case "light_neutral":
      return "light neutral bright backdrop for dark product separation";
    case "medium_contrast":
      return "medium contrast backdrop with readable floor plane";
    default:
      return "neutral backdrop separation";
  }
}

function heroEmphasisPhrase(heroScale: number): string {
  if (heroScale >= 0.7) return "tight hero framing with dominant product zone";
  if (heroScale >= 0.6) return "balanced hero framing with clear product anchor";
  return "wide hero framing with generous product presence";
}

function heroScaleToVisualWeight(heroScale: number): number {
  return Math.round(Math.max(40, Math.min(75, heroScale * 100)));
}

function heroScaleToCameraDistance(heroScale: number): CameraDecision["distance"] {
  if (heroScale >= 0.68) return "close";
  if (heroScale <= 0.58) return "wide";
  return "medium";
}

function productDominancePhrase(primaryObject: string): string {
  if (primaryObject === "product") {
    return "single hero product as the visual anchor";
  }
  return `primary object focus on ${primaryObject}`;
}

function visualPriorityPhrase(hierarchy: HierarchyMap): string {
  const heroLeads = hierarchy.hero === "hero";
  const headlineLeads = hierarchy.headline === "H1";

  if (heroLeads && !headlineLeads) {
    return "product-forward framing with hero emphasis";
  }
  if (headlineLeads && !heroLeads) {
    return "headline-forward negative space with supporting product";
  }
  return "balanced hero and headline priority";
}

function hierarchyCameraPatch(hierarchy: HierarchyMap): Partial<CameraDecision> {
  if (hierarchy.hero === "hero") {
    return { angle: "low_hero", framing: "product_hero" };
  }
  if (hierarchy.headline === "H1") {
    return { angle: "eye_level", framing: "environment_context" };
  }
  return {};
}

function paletteFromBackgroundPreference(
  palette: string[],
  pref: BackgroundPalettePreference,
): string[] {
  const next = [...palette];
  if (!next.length) return next;

  switch (pref) {
    case "cool_neutral":
      next[0] = "#e2e8f0";
      break;
    case "green_neutral":
      next[0] = "#d9e8dc";
      break;
    case "light_neutral":
      next[0] = "#f1f5f9";
      break;
    case "medium_contrast":
      next[0] = "#cbd5e1";
      break;
    default:
      break;
  }
  return next.slice(0, 4);
}

function buildSnapshot(layoutSpec: LayoutSpec): CommercialBlueprintSnapshot {
  return {
    scenePreference: layoutSpec.scenePreference,
    backgroundPalettePreference: layoutSpec.backgroundPalettePreference,
    heroScale: layoutSpec.heroScale,
    productAreaPct: layoutSpec.productAreaPct,
    primaryObject: layoutSpec.primaryObject,
    hierarchy: layoutSpec.hierarchy,
  };
}

function emptyDiagnostics(): CommercialBlueprintDiagnostics {
  return {
    commercialBlueprintMaterialized: false,
    commercialSceneApplied: false,
    commercialPaletteApplied: false,
    commercialHeroApplied: false,
    commercialFieldsIgnored: [...READABLE_COMMERCIAL_FIELDS],
    providerCommercialVersion: PROVIDER_COMMERCIAL_VERSION,
    commercialMaterializationWarnings: [],
  };
}

function commercialIntentFields(layoutSpec: LayoutSpec): Set<string> {
  return new Set(layoutSpec.commercialLayout?.commercialIntentApplied ?? []);
}

function hasCommercialIntent(layoutSpec: LayoutSpec): boolean {
  return (layoutSpec.commercialLayout?.commercialIntentApplied?.length ?? 0) > 0;
}

/**
 * Read-only materializer: transforms stabilized LayoutSpec commercial fields onto VisualSceneBlueprint.
 * MUST NOT import or read Commercial Genome — decisions are already on LayoutSpec.
 */
export function materializeCommercialBlueprintIntent(
  blueprint: VisualSceneBlueprint,
  layoutSpec?: LayoutSpec,
): VisualSceneBlueprint {
  const diagnostics = emptyDiagnostics();
  const guidance: CommercialBlueprintGuidance = {};
  const warnings: string[] = [];

  if (!layoutSpec || !hasCommercialIntent(layoutSpec)) {
    return {
      ...blueprint,
      commercial: {
        snapshot: layoutSpec ? buildSnapshot(layoutSpec) : {},
        guidance,
        diagnostics,
      },
    };
  }

  const applied = commercialIntentFields(layoutSpec);
  const snapshot = buildSnapshot(layoutSpec);
  const next: VisualSceneBlueprint = {
    ...blueprint,
    scene: { ...blueprint.scene },
    camera: { ...blueprint.camera },
    composition: {
      ...blueprint.composition,
      visualWeight: { ...blueprint.composition.visualWeight },
    },
    palette: [...blueprint.palette],
    commercial: {
      snapshot,
      guidance,
      diagnostics,
    },
  };

  const removeIgnored = (field: ReadableCommercialBlueprintField) => {
    diagnostics.commercialFieldsIgnored = diagnostics.commercialFieldsIgnored.filter(
      (f) => f !== field,
    );
  };

  if (applied.has("scenePreference") && hasValue(layoutSpec.scenePreference)) {
    const pref = layoutSpec.scenePreference!;
    next.scene.architecture = scenePreferenceToArchitecture(pref);
    if (pref === "outdoor_natural") {
      next.scene.weather = "clear";
      next.scene.time = "morning";
    } else if (pref === "light_modern" || pref === "commercial_studio") {
      next.scene.weather = "indoor_controlled";
      next.scene.time = "studio_neutral";
    } else {
      next.scene.weather = "indoor_controlled";
      next.scene.time = "noon";
    }
    guidance.environmentPhrase = scenePreferencePhrase(pref);
    diagnostics.commercialSceneApplied = true;
    removeIgnored("scenePreference");
  }

  if (applied.has("backgroundPalettePreference") && hasValue(layoutSpec.backgroundPalettePreference)) {
    const pref = layoutSpec.backgroundPalettePreference!;
    guidance.backgroundPhrase = backgroundPalettePhrase(pref);
    next.palette = paletteFromBackgroundPreference(next.palette, pref);
    next.composition.visualWeight.background = Math.max(
      8,
      Math.min(18, next.composition.visualWeight.background),
    );
    diagnostics.commercialPaletteApplied = true;
    removeIgnored("backgroundPalettePreference");
  }

  if (
    (applied.has("heroScale") || applied.has("productAreaPct")) &&
    (hasValue(layoutSpec.heroScale) || hasValue(layoutSpec.productAreaPct))
  ) {
    const heroScale =
      layoutSpec.heroScale ??
      (layoutSpec.productAreaPct != null ? layoutSpec.productAreaPct / 100 : undefined);
    if (heroScale != null) {
      guidance.heroEmphasisPhrase = heroEmphasisPhrase(heroScale);
      next.composition.visualWeight.hero = heroScaleToVisualWeight(heroScale);
      next.camera.distance = heroScaleToCameraDistance(heroScale);
      diagnostics.commercialHeroApplied = true;
      removeIgnored("heroScale");
      if (layoutSpec.productAreaPct != null) {
        removeIgnored("productAreaPct");
      }
    }
  }

  if (applied.has("primaryObject") && hasValue(layoutSpec.primaryObject)) {
    guidance.productDominancePhrase = productDominancePhrase(layoutSpec.primaryObject!);
    next.composition.visualWeight.hero = Math.min(
      78,
      next.composition.visualWeight.hero + 4,
    );
    removeIgnored("primaryObject");
  }

  if (applied.has("hierarchy") && hasValue(layoutSpec.hierarchy)) {
    const hierarchy = layoutSpec.hierarchy!;
    guidance.visualPriorityPhrase = visualPriorityPhrase(hierarchy);
    Object.assign(next.camera, hierarchyCameraPatch(hierarchy));
    if (hierarchy.hero === "hero") {
      next.composition.negativeSpace = "left";
      next.composition.balance = "asymmetric_hero_right";
    }
    removeIgnored("hierarchy");
  }

  const materialized =
    diagnostics.commercialSceneApplied ||
    diagnostics.commercialPaletteApplied ||
    diagnostics.commercialHeroApplied ||
    hasValue(guidance.productDominancePhrase) ||
    hasValue(guidance.visualPriorityPhrase);

  diagnostics.commercialBlueprintMaterialized = materialized;
  diagnostics.commercialMaterializationWarnings = warnings;

  next.commercial = {
    snapshot,
    guidance,
    diagnostics,
  };

  return next;
}

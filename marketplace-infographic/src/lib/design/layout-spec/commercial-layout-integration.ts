import type { FeatureFlagDefinition } from "@/lib/daos/feature-flag-registry";
import type {
  BackgroundContrastDirection,
  CommercialDecisionBeta,
  EnvironmentDirection,
  VisualHierarchyOrder,
} from "@/lib/daos/commercial-genome-beta/types";
import type { HierarchyMap, LayoutSpec } from "./types";

export const COMMERCIAL_LAYOUT_INTEGRATION_FLAG = "DAOS_COMMERCIAL_LAYOUT_INTEGRATION";
export const LAYOUT_COMMERCIAL_VERSION = "1.0.0-sprint1";

export type CommercialLayoutMapping = {
  source: keyof CommercialDecisionBeta;
  target: keyof LayoutSpec | string;
  from: unknown;
  to: unknown;
};

export type CommercialLayoutDiagnostics = {
  commercialLayoutApplied: boolean;
  commercialDecisionId: string;
  commercialMappings: CommercialLayoutMapping[];
  ignoredCommercialMappings: string[];
  layoutCommercialVersion: string;
};

export type CommercialLayoutDebugBundle = {
  commercialLayoutIntegration: boolean;
  appliedMappings: Record<string, unknown>;
  ignoredMappings: string[];
  layoutVersion: string;
};

export type ApplyCommercialIntentResult = {
  layout: LayoutSpec;
  diagnostics: CommercialLayoutDiagnostics;
  debugBundle?: CommercialLayoutDebugBundle;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function isCommercialLayoutIntegrationEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] === "1";
}

export const COMMERCIAL_LAYOUT_INTEGRATION_FLAG_DEFINITION: FeatureFlagDefinition = {
  FlagId: COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  Name: "DAOS_COMMERCIAL_LAYOUT_INTEGRATION",
  Owner: "Layout Runtime",
  Description:
    "Applies CommercialDecisionBeta intent to production LayoutSpec fields (hero scale, hierarchy, badges, typography, scene preference).",
  DefaultValue: "0",
  CurrentValue: process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] ?? "0",
  Scope: "runtime",
  Category: "runtime",
  LifecycleState: "Shadow",
  IntroducedInWave: 44,
  PlannedRemovalWave: null,
  Consumers: ["layout-spec", "generate-infographic-handler"],
  Dependencies: ["DAOS_COMMERCIAL_GENOME_BETA"],
  Diagnostics: [
    "commercialLayoutApplied",
    "commercialDecisionId",
    "commercialMappings",
    "ignoredCommercialMappings",
    "layoutCommercialVersion",
  ],
  Deprecated: false,
  Notes: "Sprint 1 — Genome → LayoutSpec bridge. Layout runtime owns application; Genome supplies intent only.",
};

export function registerCommercialLayoutIntegrationFlag(
  register: (def: FeatureFlagDefinition) => void,
  env: NodeJS.ProcessEnv = process.env,
): void {
  register({
    ...COMMERCIAL_LAYOUT_INTEGRATION_FLAG_DEFINITION,
    CurrentValue: env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] ?? "0",
  });
}

export function deriveCommercialDecisionId(decision: CommercialDecisionBeta): string {
  const parts = [
    ...decision.selectedRules.slice().sort(),
    decision.environmentDirection,
    decision.backgroundContrastDirection,
    String(decision.productAreaTarget),
    String(decision.badgeLimit),
    String(decision.maxCharacteristics),
    decision.heroDominance,
    decision.typographyDirection,
    decision.visualHierarchy.join(","),
  ];
  let hash = 0;
  const joined = parts.join("|");
  for (let i = 0; i < joined.length; i++) {
    hash = (hash * 31 + joined.charCodeAt(i)) >>> 0;
  }
  return `cdb-${hash.toString(16).padStart(8, "0")}`;
}

function mapVisualHierarchy(visualHierarchy: VisualHierarchyOrder[]): HierarchyMap {
  const rankOf = (key: VisualHierarchyOrder) => {
    const index = visualHierarchy.indexOf(key);
    return index < 0 ? 99 : index;
  };

  const productRank = rankOf("product");
  const headlineRank = rankOf("headline");

  return {
    headline:
      headlineRank === 0
        ? "H1"
        : headlineRank < productRank
          ? "H1"
          : headlineRank === 1
            ? "H1"
            : "supporting",
    hero: productRank <= headlineRank ? "hero" : "supporting",
    benefits: rankOf("characteristics") <= 2 ? "supporting" : "decorative",
    cta: "cta",
    decorative: rankOf("logo") <= 3 ? "decorative" : "decorative",
  };
}

function mapBackgroundPalettePreference(
  direction: BackgroundContrastDirection,
): LayoutSpec["backgroundPalettePreference"] {
  switch (direction) {
    case "cool_neutral_separation":
      return "cool_neutral";
    case "green_neutral_separation":
      return "green_neutral";
    case "light_background":
      return "light_neutral";
    case "medium_contrast_background":
      return "medium_contrast";
    default:
      return undefined;
  }
}

function mapScenePreference(
  direction: EnvironmentDirection,
): LayoutSpec["scenePreference"] {
  switch (direction) {
    case "clean_industrial_technical":
      return "industrial_technical";
    case "outdoor_fresh_natural":
      return "outdoor_natural";
    case "light_modern_clean":
      return "light_modern";
    case "clean_commercial_studio":
      return "commercial_studio";
    default:
      return undefined;
  }
}

function mapHeroDominance(dominance: CommercialDecisionBeta["heroDominance"]): string {
  return dominance === "product_first" ? "product" : dominance;
}

function buildDebugBundle(
  applied: CommercialLayoutMapping[],
  ignored: string[],
): CommercialLayoutDebugBundle {
  const appliedMappings: Record<string, unknown> = {};
  for (const mapping of applied) {
    appliedMappings[`${mapping.source}→${mapping.target}`] = mapping.to;
  }
  return {
    commercialLayoutIntegration: true,
    appliedMappings,
    ignoredMappings: ignored,
    layoutVersion: LAYOUT_COMMERCIAL_VERSION,
  };
}

/**
 * Layout runtime accepts Commercial Genome intent and maps it onto LayoutSpec.
 * Genome does not mutate layout directly — this function is the integration gate.
 */
export function applyCommercialIntentToLayoutSpec(
  layout: LayoutSpec,
  decision?: CommercialDecisionBeta,
  options?: { env?: NodeJS.ProcessEnv; includeDebugBundle?: boolean },
): ApplyCommercialIntentResult {
  const env = options?.env ?? process.env;
  const ignored: string[] = [];
  const mappings: CommercialLayoutMapping[] = [];

  const baseDiagnostics: CommercialLayoutDiagnostics = {
    commercialLayoutApplied: false,
    commercialDecisionId: decision ? deriveCommercialDecisionId(decision) : "",
    commercialMappings: [],
    ignoredCommercialMappings: [],
    layoutCommercialVersion: LAYOUT_COMMERCIAL_VERSION,
  };

  if (!isCommercialLayoutIntegrationEnabled(env)) {
    return { layout, diagnostics: baseDiagnostics };
  }

  if (!decision) {
    ignored.push("commercialDecision:missing");
    return {
      layout,
      diagnostics: {
        ...baseDiagnostics,
        ignoredCommercialMappings: ignored,
      },
    };
  }

  const next: LayoutSpec = { ...layout };

  const heroScale = clamp(decision.productAreaTarget, 0.5, 0.8);
  mappings.push({
    source: "productAreaTarget",
    target: "heroScale",
    from: decision.productAreaTarget,
    to: heroScale,
  });
  next.heroScale = heroScale;
  next.productAreaPct = Math.round(heroScale * 100);

  const primaryObject = mapHeroDominance(decision.heroDominance);
  mappings.push({
    source: "heroDominance",
    target: "primaryObject",
    from: decision.heroDominance,
    to: primaryObject,
  });
  next.primaryObject = primaryObject;

  const hierarchy = mapVisualHierarchy(decision.visualHierarchy);
  mappings.push({
    source: "visualHierarchy",
    target: "hierarchy",
    from: decision.visualHierarchy,
    to: hierarchy,
  });
  next.hierarchy = hierarchy;

  mappings.push({
    source: "maxCharacteristics",
    target: "maxCharacteristics",
    from: decision.maxCharacteristics,
    to: decision.maxCharacteristics,
  });
  next.maxCharacteristics = decision.maxCharacteristics;

  mappings.push({
    source: "typographyDirection",
    target: "typographyStrategy",
    from: decision.typographyDirection,
    to: decision.typographyDirection,
  });
  next.typographyStrategy = decision.typographyDirection;

  const badgeLimit = clamp(decision.badgeLimit, 0, 4);
  mappings.push({
    source: "badgeLimit",
    target: "maxIcons",
    from: decision.badgeLimit,
    to: badgeLimit,
  });
  next.maxIcons = badgeLimit;
  mappings.push({
    source: "badgeLimit",
    target: "maxBadges",
    from: decision.badgeLimit,
    to: badgeLimit,
  });
  next.maxBadges = badgeLimit;

  const backgroundPalettePreference = mapBackgroundPalettePreference(
    decision.backgroundContrastDirection,
  );
  if (backgroundPalettePreference) {
    mappings.push({
      source: "backgroundContrastDirection",
      target: "backgroundPalettePreference",
      from: decision.backgroundContrastDirection,
      to: backgroundPalettePreference,
    });
    next.backgroundPalettePreference = backgroundPalettePreference;
  } else {
    ignored.push("backgroundContrastDirection:unmapped");
  }

  const scenePreference = mapScenePreference(decision.environmentDirection);
  if (scenePreference) {
    mappings.push({
      source: "environmentDirection",
      target: "scenePreference",
      from: decision.environmentDirection,
      to: scenePreference,
    });
    next.scenePreference = scenePreference;
  } else {
    ignored.push("environmentDirection:unmapped");
  }

  ignored.push("mainMessage:layout_not_owner");
  ignored.push("antiRules:prompt_domain");
  ignored.push("selectedRules:diagnostics_only");
  ignored.push("decisionTrace:diagnostics_only");

  const diagnostics: CommercialLayoutDiagnostics = {
    commercialLayoutApplied: mappings.length > 0,
    commercialDecisionId: deriveCommercialDecisionId(decision),
    commercialMappings: mappings,
    ignoredCommercialMappings: ignored,
    layoutCommercialVersion: LAYOUT_COMMERCIAL_VERSION,
  };

  next.commercialLayout = diagnostics;

  return {
    layout: next,
    diagnostics,
    debugBundle: options?.includeDebugBundle
      ? buildDebugBundle(mappings, ignored)
      : undefined,
  };
}

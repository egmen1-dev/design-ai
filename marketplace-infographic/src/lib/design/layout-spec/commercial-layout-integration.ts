import type { FeatureFlagDefinition } from "@/lib/daos/feature-flag-registry";
import type {
  BackgroundContrastDirection,
  CommercialDecisionBeta,
  EnvironmentDirection,
  VisualHierarchyOrder,
} from "@/lib/daos/commercial-genome-beta/types";
import { LAYOUT_SPEC_DEFAULTS, type HierarchyMap, type LayoutSpec } from "./types";

export const COMMERCIAL_LAYOUT_INTEGRATION_FLAG = "DAOS_COMMERCIAL_LAYOUT_INTEGRATION";
export const COMMERCIAL_INTEGRATION_VERSION = "1.1.0-sprint1";

/** Production LayoutSpec keys discovered at runtime (existing fields first). */
export const KNOWN_LAYOUT_SPEC_KEYS = new Set<string>([
  ...Object.keys(LAYOUT_SPEC_DEFAULTS),
  "compositionTemplateId",
  "geometry",
  "visualWeight",
  "hierarchy",
  "productAreaPct",
  "primaryObject",
  "maxCharacteristics",
  "typographyStrategy",
  "maxBadges",
  "backgroundPalettePreference",
  "scenePreference",
  "commercialLayout",
]);

export type CommercialIntentDiagnostics = {
  commercialIntentReceived: boolean;
  commercialIntentApplied: string[];
  commercialIntentIgnored: string[];
  commercialIntentReason: Record<string, string>;
  commercialIntegrationVersion: string;
  commercialDecisionId: string;
};

export type CommercialLayoutDebugBundle = {
  commercialIntentReceived: boolean;
  commercialIntentApplied: string[];
  commercialIntentIgnored: string[];
  commercialIntentReason: Record<string, string>;
  commercialIntegrationVersion: string;
  appliedFieldValues: Record<string, unknown>;
};

export type ApplyCommercialIntentResult = {
  layout: LayoutSpec;
  diagnostics: CommercialIntentDiagnostics;
  debugBundle?: CommercialLayoutDebugBundle;
};

type IntentBinding = {
  source: keyof CommercialDecisionBeta;
  preferredTargets: (keyof LayoutSpec)[];
  extensionTarget?: keyof LayoutSpec;
  apply: (
    layout: LayoutSpec,
    decision: CommercialDecisionBeta,
    target: keyof LayoutSpec,
  ) => unknown;
  reason: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function layoutHasField(field: keyof LayoutSpec): boolean {
  return KNOWN_LAYOUT_SPEC_KEYS.has(field);
}

function resolveTarget(binding: IntentBinding): {
  target: keyof LayoutSpec;
  usedExtension: boolean;
} | null {
  for (const candidate of binding.preferredTargets) {
    if (layoutHasField(candidate)) {
      return { target: candidate, usedExtension: false };
    }
  }
  if (binding.extensionTarget && layoutHasField(binding.extensionTarget)) {
    return { target: binding.extensionTarget, usedExtension: true };
  }
  return null;
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
    "Applies CommercialDecisionBeta intent to production LayoutSpec at the terminal layout stabilization boundary.",
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
    "commercialIntentReceived",
    "commercialIntentApplied",
    "commercialIntentIgnored",
    "commercialIntentReason",
    "commercialIntegrationVersion",
  ],
  Deprecated: false,
  Notes:
    "Sprint 1 — single terminal integration gate. Layout runtime owns application; Genome supplies intent only.",
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

function buildIntentBindings(): IntentBinding[] {
  return [
    {
      source: "productAreaTarget",
      preferredTargets: ["heroScale"],
      extensionTarget: "productAreaPct",
      reason: "heroScale is the existing production field for product area ratio",
      apply: (_layout, decision, target) => {
        const heroScale = clamp(decision.productAreaTarget, 0.5, 0.8);
        if (target === "productAreaPct") return Math.round(heroScale * 100);
        return heroScale;
      },
    },
    {
      source: "heroDominance",
      preferredTargets: [],
      extensionTarget: "primaryObject",
      reason: "no existing LayoutSpec owner for dominance; primaryObject extension stores intent",
      apply: (_layout, decision) =>
        decision.heroDominance === "product_first" ? "product" : decision.heroDominance,
    },
    {
      source: "visualHierarchy",
      preferredTargets: ["hierarchy"],
      reason: "hierarchy is the existing production field for visual priority order",
      apply: (_layout, decision) => mapVisualHierarchy(decision.visualHierarchy),
    },
    {
      source: "maxCharacteristics",
      preferredTargets: ["maxSecondaryObjects"],
      extensionTarget: "maxCharacteristics",
      reason: "maxSecondaryObjects is closest existing limit; maxCharacteristics extension when needed",
      apply: (_layout, decision, target) => {
        if (target === "maxSecondaryObjects") {
          return clamp(decision.maxCharacteristics, 0, 4);
        }
        return decision.maxCharacteristics;
      },
    },
    {
      source: "typographyDirection",
      preferredTargets: [],
      extensionTarget: "typographyStrategy",
      reason: "no existing typography owner on LayoutSpec; typographyStrategy extension stores intent",
      apply: (_layout, decision) => decision.typographyDirection,
    },
    {
      source: "badgeLimit",
      preferredTargets: ["maxIcons"],
      extensionTarget: "maxBadges",
      reason: "maxIcons is the existing badge/icon ceiling on LayoutSpec",
      apply: (_layout, decision) => clamp(decision.badgeLimit, 0, 4),
    },
    {
      source: "backgroundContrastDirection",
      preferredTargets: ["backgroundStyle"],
      extensionTarget: "backgroundPalettePreference",
      reason:
        "backgroundStyle exists but is scene-owned; backgroundPalettePreference extension preserves contrast intent without mutating scene",
      apply: (layout, decision, target) => {
        if (target === "backgroundStyle") {
          return layout.backgroundStyle;
        }
        return mapBackgroundPalettePreference(decision.backgroundContrastDirection);
      },
    },
    {
      source: "environmentDirection",
      preferredTargets: ["backgroundStyle"],
      extensionTarget: "scenePreference",
      reason:
        "backgroundStyle is closest existing environment-adjacent field; scenePreference extension stores environment intent without mutating Scene",
      apply: (layout, decision, target) => {
        if (target === "backgroundStyle") {
          return layout.backgroundStyle;
        }
        return mapScenePreference(decision.environmentDirection);
      },
    },
  ];
}

const PROMPT_OWNED_INTENTS: Array<{
  source: keyof CommercialDecisionBeta;
  reason: string;
}> = [
  { source: "mainMessage", reason: "prompt_copy_domain" },
  { source: "antiRules", reason: "prompt_negative_domain" },
  { source: "selectedRules", reason: "diagnostics_trace_only" },
  { source: "decisionTrace", reason: "diagnostics_trace_only" },
];

function buildDebugBundle(
  diagnostics: CommercialIntentDiagnostics,
  appliedFieldValues: Record<string, unknown>,
): CommercialLayoutDebugBundle {
  return {
    commercialIntentReceived: diagnostics.commercialIntentReceived,
    commercialIntentApplied: diagnostics.commercialIntentApplied,
    commercialIntentIgnored: diagnostics.commercialIntentIgnored,
    commercialIntentReason: diagnostics.commercialIntentReason,
    commercialIntegrationVersion: diagnostics.commercialIntegrationVersion,
    appliedFieldValues,
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

  const baseDiagnostics: CommercialIntentDiagnostics = {
    commercialIntentReceived: !!decision,
    commercialIntentApplied: [],
    commercialIntentIgnored: [],
    commercialIntentReason: {},
    commercialIntegrationVersion: COMMERCIAL_INTEGRATION_VERSION,
    commercialDecisionId: decision ? deriveCommercialDecisionId(decision) : "",
  };

  if (!isCommercialLayoutIntegrationEnabled(env)) {
    baseDiagnostics.commercialIntentReason.flag = "DAOS_COMMERCIAL_LAYOUT_INTEGRATION disabled";
    return { layout, diagnostics: baseDiagnostics };
  }

  if (!decision) {
    baseDiagnostics.commercialIntentIgnored.push("commercialDecision");
    baseDiagnostics.commercialIntentReason.commercialDecision = "missing_decision";
    return { layout, diagnostics: baseDiagnostics };
  }

  const next: LayoutSpec = { ...layout };
  const appliedFieldValues: Record<string, unknown> = {};
  const diagnostics: CommercialIntentDiagnostics = {
    ...baseDiagnostics,
    commercialIntentReceived: true,
  };

  for (const binding of buildIntentBindings()) {
    const resolved = resolveTarget(binding);
    if (!resolved) {
      diagnostics.commercialIntentIgnored.push(binding.source);
      diagnostics.commercialIntentReason[binding.source] = "no_layout_field_match";
      continue;
    }

    const value = binding.apply(next, decision, resolved.target);
    if (value === undefined) {
      diagnostics.commercialIntentIgnored.push(binding.source);
      diagnostics.commercialIntentReason[binding.source] = "resolver_returned_undefined";
      continue;
    }

    if (
      binding.source === "backgroundContrastDirection" &&
      resolved.target === "backgroundStyle"
    ) {
      diagnostics.commercialIntentIgnored.push(binding.source);
      diagnostics.commercialIntentReason[binding.source] =
        "backgroundStyle scene-owned; using backgroundPalettePreference extension";
      const extension = resolveTarget({
        ...binding,
        preferredTargets: [],
        extensionTarget: "backgroundPalettePreference",
      });
      if (extension) {
        const extValue = mapBackgroundPalettePreference(decision.backgroundContrastDirection);
        if (extValue) {
          next.backgroundPalettePreference = extValue;
          diagnostics.commercialIntentApplied.push("backgroundPalettePreference");
          appliedFieldValues.backgroundPalettePreference = extValue;
          diagnostics.commercialIntentReason.backgroundPalettePreference = binding.reason;
        }
      }
      continue;
    }

    if (binding.source === "environmentDirection" && resolved.target === "backgroundStyle") {
      diagnostics.commercialIntentIgnored.push(binding.source);
      diagnostics.commercialIntentReason[binding.source] =
        "backgroundStyle scene-owned; using scenePreference extension";
      const extValue = mapScenePreference(decision.environmentDirection);
      if (extValue) {
        next.scenePreference = extValue;
        diagnostics.commercialIntentApplied.push("scenePreference");
        appliedFieldValues.scenePreference = extValue;
        diagnostics.commercialIntentReason.scenePreference = binding.reason;
      }
      continue;
    }

    (next as Record<string, unknown>)[resolved.target] = value;
    diagnostics.commercialIntentApplied.push(String(resolved.target));
    appliedFieldValues[String(resolved.target)] = value;
    diagnostics.commercialIntentReason[binding.source] = resolved.usedExtension
      ? `${binding.reason} (extension field ${String(resolved.target)})`
      : binding.reason;

    if (binding.source === "productAreaTarget" && layoutHasField("productAreaPct")) {
      const pct = Math.round(clamp(decision.productAreaTarget, 0.5, 0.8) * 100);
      next.productAreaPct = pct;
      diagnostics.commercialIntentApplied.push("productAreaPct");
      appliedFieldValues.productAreaPct = pct;
      diagnostics.commercialIntentReason.productAreaPct =
        "mirror of heroScale for layout-engine metrics alignment";
    }

    if (binding.source === "badgeLimit" && layoutHasField("maxBadges")) {
      next.maxBadges = clamp(decision.badgeLimit, 0, 4);
      diagnostics.commercialIntentApplied.push("maxBadges");
      appliedFieldValues.maxBadges = next.maxBadges;
      diagnostics.commercialIntentReason.badgeLimit =
        "maxIcons is primary existing field; maxBadges extension mirrors badgeLimit";
    }

    if (
      binding.source === "maxCharacteristics" &&
      resolved.target === "maxSecondaryObjects" &&
      layoutHasField("maxCharacteristics")
    ) {
      next.maxCharacteristics = decision.maxCharacteristics;
      diagnostics.commercialIntentApplied.push("maxCharacteristics");
      appliedFieldValues.maxCharacteristics = decision.maxCharacteristics;
      diagnostics.commercialIntentReason.maxCharacteristics =
        "explicit characteristics cap stored alongside maxSecondaryObjects";
    }
  }

  for (const promptOwned of PROMPT_OWNED_INTENTS) {
    diagnostics.commercialIntentIgnored.push(promptOwned.source);
    diagnostics.commercialIntentReason[promptOwned.source] = promptOwned.reason;
  }

  next.commercialLayout = diagnostics;

  return {
    layout: next,
    diagnostics,
    debugBundle: options?.includeDebugBundle
      ? buildDebugBundle(diagnostics, appliedFieldValues)
      : undefined,
  };
}

/**
 * Single production terminal boundary:
 * call once after LayoutSpec stabilization (agent review + governance lock).
 */
export function stabilizeLayoutSpecWithCommercialIntent(
  layout: LayoutSpec,
  decision?: CommercialDecisionBeta,
  options?: { env?: NodeJS.ProcessEnv; includeDebugBundle?: boolean },
): ApplyCommercialIntentResult {
  return applyCommercialIntentToLayoutSpec(layout, decision, options);
}

/** @deprecated use COMMERCIAL_INTEGRATION_VERSION */
export const LAYOUT_COMMERCIAL_VERSION = COMMERCIAL_INTEGRATION_VERSION;

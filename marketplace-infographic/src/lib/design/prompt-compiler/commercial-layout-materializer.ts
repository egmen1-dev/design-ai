import type { LayoutSpec } from "@/lib/design/layout-spec/types";

export const PROMPT_COMMERCIAL_VERSION = "1.0.0-sprint2";

const READABLE_COMMERCIAL_FIELDS = [
  "heroScale",
  "productAreaPct",
  "primaryObject",
  "hierarchy",
  "maxIcons",
  "maxBadges",
  "maxCharacteristics",
  "scenePreference",
  "backgroundPalettePreference",
  "typographyStrategy",
] as const;

export type ReadableCommercialField = (typeof READABLE_COMMERCIAL_FIELDS)[number];

export type PromptCommercialMapping = {
  layoutField: ReadableCommercialField | string;
  section: string;
  excerpt: string;
};

export type PromptCommercialDiagnostics = {
  commercialIntentRead: string[];
  commercialIntentIgnored: string[];
  promptCommercialMappings: PromptCommercialMapping[];
  promptCommercialVersion: string;
};

export type CommercialLayoutMaterialized = {
  diagnostics: PromptCommercialDiagnostics;
  compositionClauses: string[];
  productIdentityClauses: string[];
  typographyClauses: string[];
  environmentClauses: string[];
  backgroundClauses: string[];
  hierarchyClauses: string[];
  marketplaceClauses: string[];
};

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function recordMapping(
  diagnostics: PromptCommercialDiagnostics,
  layoutField: string,
  section: string,
  excerpt: string,
): void {
  diagnostics.commercialIntentRead.push(layoutField);
  diagnostics.promptCommercialMappings.push({ layoutField, section, excerpt });
}

function scenePreferenceLabel(value: NonNullable<LayoutSpec["scenePreference"]>): string {
  switch (value) {
    case "industrial_technical":
      return "clean industrial technical environment";
    case "outdoor_natural":
      return "outdoor fresh natural environment";
    case "light_modern":
      return "light modern clean environment";
    case "commercial_studio":
      return "clean commercial studio environment";
    default:
      return value;
  }
}

function backgroundPreferenceLabel(
  value: NonNullable<LayoutSpec["backgroundPalettePreference"]>,
): string {
  switch (value) {
    case "cool_neutral":
      return "cool neutral background separation from product";
    case "green_neutral":
      return "green-neutral background separation from product";
    case "light_neutral":
      return "light neutral background for dark product separation";
    case "medium_contrast":
      return "medium contrast background separation";
    default:
      return value;
  }
}

/**
 * Read-only materializer: formats stabilized LayoutSpec commercial fields for prompt sections.
 * MUST NOT compute commercial decisions — only reads existing production LayoutSpec values.
 */
export function materializeCommercialLayoutIntent(
  layoutSpec?: LayoutSpec,
): CommercialLayoutMaterialized {
  const diagnostics: PromptCommercialDiagnostics = {
    commercialIntentRead: [],
    commercialIntentIgnored: [...READABLE_COMMERCIAL_FIELDS],
    promptCommercialMappings: [],
    promptCommercialVersion: PROMPT_COMMERCIAL_VERSION,
  };

  const empty: CommercialLayoutMaterialized = {
    diagnostics,
    compositionClauses: [],
    productIdentityClauses: [],
    typographyClauses: [],
    environmentClauses: [],
    backgroundClauses: [],
    hierarchyClauses: [],
    marketplaceClauses: [],
  };

  if (!layoutSpec) {
    diagnostics.commercialIntentIgnored = [...READABLE_COMMERCIAL_FIELDS];
    return empty;
  }

  const result: CommercialLayoutMaterialized = {
    diagnostics,
    compositionClauses: [],
    productIdentityClauses: [],
    typographyClauses: [],
    environmentClauses: [],
    backgroundClauses: [],
    hierarchyClauses: [],
    marketplaceClauses: [],
  };

  const removeIgnored = (field: ReadableCommercialField) => {
    diagnostics.commercialIntentIgnored = diagnostics.commercialIntentIgnored.filter(
      (f) => f !== field,
    );
  };

  if (hasValue(layoutSpec.heroScale) || hasValue(layoutSpec.productAreaPct)) {
    const pct =
      layoutSpec.productAreaPct ?? Math.round((layoutSpec.heroScale ?? 0) * 100);
    const excerpt = `product hero target area ${pct}% of frame`;
    result.compositionClauses.push(excerpt);
    recordMapping(diagnostics, "heroScale", "composition", excerpt);
    if (layoutSpec.productAreaPct != null) {
      removeIgnored("productAreaPct");
      recordMapping(
        diagnostics,
        "productAreaPct",
        "composition",
        `product area ${layoutSpec.productAreaPct}%`,
      );
    }
    removeIgnored("heroScale");
  }

  if (hasValue(layoutSpec.primaryObject)) {
    const excerpt =
      layoutSpec.primaryObject === "product"
        ? "product-first dominance, single hero product is the visual anchor"
        : `primary object preference ${layoutSpec.primaryObject}`;
    result.productIdentityClauses.push(excerpt);
    result.hierarchyClauses.push(excerpt);
    recordMapping(diagnostics, "primaryObject", "product_identity", excerpt);
    removeIgnored("primaryObject");
  }

  if (hasValue(layoutSpec.hierarchy)) {
    recordMapping(
      diagnostics,
      "hierarchy",
      "visual_hierarchy",
      "hierarchy map from LayoutSpec applied in visual_hierarchy section",
    );
    removeIgnored("hierarchy");
  }

  if (layoutSpec.maxIcons != null) {
    const badgeCap = layoutSpec.maxBadges ?? layoutSpec.maxIcons;
    const excerpt = `maximum ${layoutSpec.maxIcons} icon elements, maximum ${badgeCap} badge elements`;
    result.compositionClauses.push(excerpt);
    result.marketplaceClauses.push(excerpt);
    recordMapping(diagnostics, "maxIcons", "composition", excerpt);
    removeIgnored("maxIcons");
    if (layoutSpec.maxBadges != null) {
      removeIgnored("maxBadges");
    }
  }

  if (layoutSpec.maxCharacteristics != null) {
    const excerpt = `maximum ${layoutSpec.maxCharacteristics} characteristic lines on card`;
    result.typographyClauses.push(excerpt);
    result.marketplaceClauses.push(excerpt);
    recordMapping(diagnostics, "maxCharacteristics", "typography_safe_zone", excerpt);
    removeIgnored("maxCharacteristics");
  }

  if (hasValue(layoutSpec.typographyStrategy)) {
    const excerpt = `typography strategy: ${layoutSpec.typographyStrategy}`;
    result.typographyClauses.push(excerpt);
    recordMapping(diagnostics, "typographyStrategy", "typography_safe_zone", excerpt);
    removeIgnored("typographyStrategy");
  }

  if (hasValue(layoutSpec.scenePreference)) {
    const excerpt = `scene preference from layout: ${scenePreferenceLabel(layoutSpec.scenePreference!)}`;
    result.environmentClauses.push(excerpt);
    recordMapping(diagnostics, "scenePreference", "environment", excerpt);
    removeIgnored("scenePreference");
  }

  if (hasValue(layoutSpec.backgroundPalettePreference)) {
    const excerpt = backgroundPreferenceLabel(layoutSpec.backgroundPalettePreference!);
    result.backgroundClauses.push(excerpt);
    result.marketplaceClauses.push(excerpt);
    recordMapping(diagnostics, "backgroundPalettePreference", "background", excerpt);
    removeIgnored("backgroundPalettePreference");
  }

  return result;
}

export function appendClauses(base: string, clauses: string[]): string {
  if (!clauses.length) return base;
  return `${base}, ${clauses.join(", ")}`;
}

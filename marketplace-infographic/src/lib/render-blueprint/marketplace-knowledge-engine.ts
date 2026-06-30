/**
 * Chapter 5.5 — Marketplace Knowledge engine.
 * Platform-specific requirements, restrictions, and commercial best practices.
 */
import { KnowledgeLayer } from "./knowledge-layers-types";
import type { MarketplaceId } from "./types";
import {
  MarketplaceImageContext,
  MarketplaceKnowledgeId,
  MarketplaceRegion,
  ProductCategoryKnowledge,
  type CategoryVisualGuidance,
  type MarketplaceBlueprintCheck,
  type MarketplaceBlueprintValidation,
  type MarketplaceFormat,
  type MarketplaceKnowledgeContext,
  type MarketplaceKnowledgeFailureCode,
  type MarketplaceKnowledgeIdValue,
  type MarketplaceKnowledgeReport,
  type MarketplaceKnowledgeViolation,
  type MarketplaceImageContextId,
  type MarketplacePractice,
  type MarketplaceProfile,
  type MarketplaceRankingFactor,
  type MarketplaceRegionId,
  type MarketplaceRequirement,
  type MarketplaceRestriction,
  type MarketplaceValidationViolation,
  type ProductCategoryKnowledgeId,
} from "./marketplace-knowledge-types";

export {
  MarketplaceKnowledgeId,
  MarketplaceImageContext,
  MarketplaceRegion,
  ProductCategoryKnowledge,
  type MarketplaceKnowledgeIdValue,
  type MarketplaceImageContextId,
  type MarketplaceRegionId,
  type ProductCategoryKnowledgeId,
  type MarketplaceFormat,
  type MarketplaceRequirement,
  type MarketplaceRestriction,
  type MarketplacePractice,
  type MarketplaceRankingFactor,
  type MarketplaceProfile,
  type CategoryVisualGuidance,
  type MarketplaceBlueprintCheck,
  type MarketplaceValidationViolation,
  type MarketplaceBlueprintValidation,
  type MarketplaceKnowledgeContext,
  type MarketplaceKnowledgeViolation,
  type MarketplaceKnowledgeReport,
  type MarketplaceKnowledgeFailureCode,
} from "./marketplace-knowledge-types";

export const MARKETPLACE_KNOWLEDGE_VERSION = "5.5.0";

export const MARKETPLACE_KNOWLEDGE_GOLDEN_RULE =
  "Commercially effective design simultaneously complies with marketplace requirements, " +
  "reflects product category expectations, matches buyer expectations, supports platform algorithms, " +
  "and increases purchase probability. Beautiful design alone does not guarantee sales.";

const AMAZON_FORMATS: MarketplaceFormat[] = [
  { id: "amazon-main", mime: "image/jpeg", minWidth: 1000, minHeight: 1000, maxFileSizeKb: 10000 },
  { id: "amazon-secondary", mime: "image/jpeg", minWidth: 1000, minHeight: 1000, maxFileSizeKb: 10000 },
];

const OZON_FORMATS: MarketplaceFormat[] = [
  { id: "ozon-main", mime: "image/jpeg", minWidth: 900, minHeight: 1200, maxFileSizeKb: 10240 },
  { id: "ozon-infographic", mime: "image/png", minWidth: 900, minHeight: 1200, maxFileSizeKb: 10240 },
];

const WB_FORMATS: MarketplaceFormat[] = [
  { id: "wb-main", mime: "image/jpeg", minWidth: 900, minHeight: 1200, maxFileSizeKb: 10240 },
  { id: "wb-infographic", mime: "image/jpeg", minWidth: 900, minHeight: 1200, maxFileSizeKb: 10240 },
];

const GENERIC_FORMATS: MarketplaceFormat[] = [
  { id: "generic-square", mime: "image/jpeg", minWidth: 1000, minHeight: 1000, maxFileSizeKb: 5000 },
];

const AMAZON_MAIN_REQUIREMENTS: MarketplaceRequirement[] = [
  {
    id: "amazon.main.white-bg",
    context: MarketplaceImageContext.MAIN_IMAGE,
    rule: "Pure white background (RGB 255,255,255)",
    mandatory: true,
    region: MarketplaceRegion.US,
  },
  {
    id: "amazon.main.product-fill",
    context: MarketplaceImageContext.MAIN_IMAGE,
    rule: "Product must fill at least 85% of frame",
    mandatory: true,
  },
];

const AMAZON_MAIN_RESTRICTIONS: MarketplaceRestriction[] = [
  {
    id: "amazon.main.no-badges",
    context: MarketplaceImageContext.MAIN_IMAGE,
    rule: "No promotional badges or text overlays",
    critical: true,
  },
  {
    id: "amazon.main.no-extra-products",
    context: MarketplaceImageContext.MAIN_IMAGE,
    rule: "No additional products in main image",
    critical: true,
  },
];

const AMAZON_SECONDARY_REQUIREMENTS: MarketplaceRequirement[] = [
  {
    id: "amazon.secondary.lifestyle-allowed",
    context: MarketplaceImageContext.SECONDARY_IMAGE,
    rule: "Lifestyle and infographic content permitted",
    mandatory: true,
  },
];

const OZON_INFOGRAPHIC_REQUIREMENTS: MarketplaceRequirement[] = [
  {
    id: "ozon.infographic.readable-text",
    context: MarketplaceImageContext.INFOGRAPHIC,
    rule: "Text must be readable at thumbnail size",
    mandatory: true,
    region: MarketplaceRegion.RU,
  },
];

const WB_INFOGRAPHIC_REQUIREMENTS: MarketplaceRequirement[] = [
  {
    id: "wb.infographic.badge-space",
    context: MarketplaceImageContext.INFOGRAPHIC,
    rule: "Reserve space for marketplace badges",
    mandatory: true,
    region: MarketplaceRegion.RU,
  },
];

const SHARED_RANKING_FACTORS: MarketplaceRankingFactor[] = [
  {
    id: "rank.main-image-quality",
    factor: "main_image_quality",
    weight: 0.3,
    description: "Sharp, well-lit hero image increases click-through",
  },
  {
    id: "rank.infographic-readability",
    factor: "infographic_readability",
    weight: 0.25,
    description: "Information must be parsed within 2 seconds",
  },
  {
    id: "rank.visual-cleanliness",
    factor: "visual_cleanliness",
    weight: 0.2,
    description: "Uncluttered composition improves conversion",
  },
  {
    id: "rank.category-fit",
    factor: "category_fit",
    weight: 0.25,
    description: "Visual style must match category buyer expectations",
  },
];

export const CATEGORY_VISUAL_GUIDANCE: readonly CategoryVisualGuidance[] = [
  {
    category: ProductCategoryKnowledge.KITCHEN,
    visualDirection: "home comfort and warmth",
    lightingHint: "warm natural lighting",
    backgroundHint: "cozy kitchen environment",
  },
  {
    category: ProductCategoryKnowledge.ELECTRONICS,
    visualDirection: "technology and precision",
    lightingHint: "minimal clean lighting",
    backgroundHint: "minimal neutral background",
  },
  {
    category: ProductCategoryKnowledge.BEAUTY,
    visualDirection: "premium softness",
    lightingHint: "soft premium lighting",
    backgroundHint: "clean elegant backdrop",
  },
  {
    category: ProductCategoryKnowledge.FURNITURE,
    visualDirection: "spacious interior context",
    lightingHint: "natural ambient light",
    backgroundHint: "room-scale interior",
  },
  {
    category: ProductCategoryKnowledge.SPORTS,
    visualDirection: "energy and motion",
    lightingHint: "dynamic high-contrast lighting",
    backgroundHint: "active lifestyle context",
  },
] as const;

export const MARKETPLACE_PROFILE_VERSIONS: Record<MarketplaceKnowledgeIdValue, string> = {
  [MarketplaceKnowledgeId.AMAZON]: "12.0.0",
  [MarketplaceKnowledgeId.OZON]: "7.0.0",
  [MarketplaceKnowledgeId.WILDBERRIES]: "5.0.0",
  [MarketplaceKnowledgeId.SHOPIFY]: "3.0.0",
  [MarketplaceKnowledgeId.ETSY]: "4.0.0",
  [MarketplaceKnowledgeId.WALMART]: "6.0.0",
  [MarketplaceKnowledgeId.EBAY]: "5.0.0",
  [MarketplaceKnowledgeId.ALIEXPRESS]: "4.0.0",
};

function buildAmazonProfile(region: MarketplaceRegionId): MarketplaceProfile {
  const regionSuffix = region === MarketplaceRegion.GLOBAL ? "" : `.${region}`;
  return {
    id: MarketplaceKnowledgeId.AMAZON,
    name: `Amazon${region === MarketplaceRegion.US ? " US" : region === MarketplaceRegion.JP ? " Japan" : region === MarketplaceRegion.DE ? " Germany" : ""}`,
    version: MARKETPLACE_PROFILE_VERSIONS[MarketplaceKnowledgeId.AMAZON],
    region,
    requirements: [
      ...AMAZON_MAIN_REQUIREMENTS.map((r) => ({
        ...r,
        id: `${r.id}${regionSuffix}`,
        region: region !== MarketplaceRegion.GLOBAL ? region : r.region,
      })),
      ...AMAZON_SECONDARY_REQUIREMENTS,
    ],
    restrictions: AMAZON_MAIN_RESTRICTIONS,
    bestPractices: [
      {
        id: "amazon.practice.beauty-soft",
        category: ProductCategoryKnowledge.BEAUTY,
        context: MarketplaceImageContext.SECONDARY_IMAGE,
        rule: "Soft premium lighting for beauty secondary images",
        impact: "high",
      },
      {
        id: "amazon.practice.electronics-minimal",
        category: ProductCategoryKnowledge.ELECTRONICS,
        rule: "Minimal background for electronics listings",
        impact: "medium",
      },
    ],
    rankingFactors: SHARED_RANKING_FACTORS,
    supportedFormats: AMAZON_FORMATS,
  };
}

function buildOzonProfile(): MarketplaceProfile {
  return {
    id: MarketplaceKnowledgeId.OZON,
    name: "Ozon",
    version: MARKETPLACE_PROFILE_VERSIONS[MarketplaceKnowledgeId.OZON],
    region: MarketplaceRegion.RU,
    requirements: [
      {
        id: "ozon.main.min-resolution",
        context: MarketplaceImageContext.MAIN_IMAGE,
        rule: "Minimum 900×1200 resolution",
        mandatory: true,
      },
      ...OZON_INFOGRAPHIC_REQUIREMENTS,
    ],
    restrictions: [
      {
        id: "ozon.main.no-watermark",
        context: MarketplaceImageContext.MAIN_IMAGE,
        rule: "No watermarks on main image",
        critical: true,
      },
    ],
    bestPractices: [
      {
        id: "ozon.practice.kitchen-warm",
        category: ProductCategoryKnowledge.KITCHEN,
        context: MarketplaceImageContext.INFOGRAPHIC,
        rule: "Warm natural lighting for kitchen infographics",
        impact: "high",
      },
    ],
    rankingFactors: SHARED_RANKING_FACTORS,
    supportedFormats: OZON_FORMATS,
  };
}

function buildWildberriesProfile(): MarketplaceProfile {
  return {
    id: MarketplaceKnowledgeId.WILDBERRIES,
    name: "Wildberries",
    version: MARKETPLACE_PROFILE_VERSIONS[MarketplaceKnowledgeId.WILDBERRIES],
    region: MarketplaceRegion.RU,
    requirements: [
      {
        id: "wb.main.vertical",
        context: MarketplaceImageContext.MAIN_IMAGE,
        rule: "Vertical 3:4 aspect ratio preferred",
        mandatory: true,
      },
      ...WB_INFOGRAPHIC_REQUIREMENTS,
    ],
    restrictions: [
      {
        id: "wb.infographic.no-clutter",
        context: MarketplaceImageContext.INFOGRAPHIC,
        rule: "Avoid overcrowded infographic layouts",
        critical: false,
      },
    ],
    bestPractices: [
      {
        id: "wb.practice.sports-dynamic",
        category: ProductCategoryKnowledge.SPORTS,
        rule: "Dynamic energetic composition for sports goods",
        impact: "high",
      },
      {
        id: "wb.practice.simple-composition",
        rule: "Simple compositions often outperform complex studio shots",
        impact: "medium",
      },
    ],
    rankingFactors: SHARED_RANKING_FACTORS,
    supportedFormats: WB_FORMATS,
  };
}

function buildGenericProfile(
  id: MarketplaceKnowledgeIdValue,
  name: string,
  region: MarketplaceRegionId = MarketplaceRegion.GLOBAL,
): MarketplaceProfile {
  return {
    id,
    name,
    version: MARKETPLACE_PROFILE_VERSIONS[id],
    region,
    requirements: [
      {
        id: `${id}.main.min-resolution`,
        context: MarketplaceImageContext.MAIN_IMAGE,
        rule: "Minimum 1000×1000 resolution",
        mandatory: true,
      },
    ],
    restrictions: [],
    bestPractices: [
      {
        id: `${id}.practice.category-fit`,
        rule: "Match visual style to product category expectations",
        impact: "medium",
      },
    ],
    rankingFactors: SHARED_RANKING_FACTORS,
    supportedFormats: GENERIC_FORMATS,
  };
}

export const MARKETPLACE_PROFILES: readonly MarketplaceProfile[] = [
  buildAmazonProfile(MarketplaceRegion.US),
  buildAmazonProfile(MarketplaceRegion.JP),
  buildAmazonProfile(MarketplaceRegion.DE),
  buildOzonProfile(),
  buildWildberriesProfile(),
  buildGenericProfile(MarketplaceKnowledgeId.SHOPIFY, "Shopify"),
  buildGenericProfile(MarketplaceKnowledgeId.ETSY, "Etsy"),
  buildGenericProfile(MarketplaceKnowledgeId.WALMART, "Walmart Marketplace", MarketplaceRegion.US),
  buildGenericProfile(MarketplaceKnowledgeId.EBAY, "eBay"),
  buildGenericProfile(MarketplaceKnowledgeId.ALIEXPRESS, "AliExpress"),
] as const;

export const SUPPORTED_MARKETPLACE_PLATFORMS: readonly MarketplaceKnowledgeIdValue[] = [
  MarketplaceKnowledgeId.AMAZON,
  MarketplaceKnowledgeId.OZON,
  MarketplaceKnowledgeId.WILDBERRIES,
  MarketplaceKnowledgeId.SHOPIFY,
  MarketplaceKnowledgeId.ETSY,
  MarketplaceKnowledgeId.WALMART,
  MarketplaceKnowledgeId.EBAY,
  MarketplaceKnowledgeId.ALIEXPRESS,
] as const;

/** Maps RenderBlueprint MarketplaceId to knowledge profile id */
export const BLUEPRINT_MARKETPLACE_MAP: Record<MarketplaceId, MarketplaceKnowledgeIdValue> = {
  Amazon: MarketplaceKnowledgeId.AMAZON,
  Ozon: MarketplaceKnowledgeId.OZON,
  WB: MarketplaceKnowledgeId.WILDBERRIES,
};

function violation(
  code: MarketplaceKnowledgeViolation["code"],
  message: string,
  extras?: Pick<MarketplaceKnowledgeViolation, "marketplaceId">,
): MarketplaceKnowledgeViolation {
  return { code, message, ...extras };
}

function checkViolation(
  code: MarketplaceKnowledgeFailureCode,
  message: string,
  extras?: Pick<MarketplaceValidationViolation, "requirementId" | "restrictionId">,
): MarketplaceValidationViolation {
  return { code, message, ...extras };
}

export function getMarketplaceKnowledgeProfile(
  marketplaceId: MarketplaceKnowledgeIdValue,
  region: MarketplaceRegionId = MarketplaceRegion.GLOBAL,
): MarketplaceProfile | undefined {
  const regional = MARKETPLACE_PROFILES.find(
    (p) => p.id === marketplaceId && p.region === region,
  );
  if (regional) return regional;
  return MARKETPLACE_PROFILES.find((p) => p.id === marketplaceId);
}

export function getCategoryVisualGuidance(
  category: ProductCategoryKnowledgeId,
): CategoryVisualGuidance | undefined {
  return CATEGORY_VISUAL_GUIDANCE.find((g) => g.category === category);
}

export function getContextRules(
  profile: MarketplaceProfile,
  context: MarketplaceImageContextId,
): {
  requirements: MarketplaceRequirement[];
  restrictions: MarketplaceRestriction[];
  practices: MarketplacePractice[];
} {
  return {
    requirements: profile.requirements.filter((r) => r.context === context),
    restrictions: profile.restrictions.filter((r) => r.context === context),
    practices: profile.bestPractices.filter((p) => !p.context || p.context === context),
  };
}

export function getBestPracticesForCategory(
  profile: MarketplaceProfile,
  category: ProductCategoryKnowledgeId,
): MarketplacePractice[] {
  return profile.bestPractices.filter((p) => !p.category || p.category === category);
}

export function getCriticalRestrictions(
  profile: MarketplaceProfile,
  context: MarketplaceImageContextId,
): MarketplaceRestriction[] {
  return profile.restrictions.filter((r) => r.context === context && r.critical);
}

export function publishMarketplaceProfileVersion(
  marketplaceId: MarketplaceKnowledgeIdValue,
  currentVersion: string,
): { marketplaceId: MarketplaceKnowledgeIdValue; previousVersion: string; version: string } {
  const parts = currentVersion.split(".").map(Number);
  const next = `${parts[0]}.${parts[1]}.${(parts[2] ?? 0) + 1}`;
  return { marketplaceId, previousVersion: currentVersion, version: next };
}

export function validateMarketplaceBlueprint(
  check: MarketplaceBlueprintCheck,
): MarketplaceBlueprintValidation {
  const profile = getMarketplaceKnowledgeProfile(check.marketplaceId, check.region);
  const violations: MarketplaceValidationViolation[] = [];

  if (!profile) {
    return {
      valid: false,
      readyForRenderPipeline: false,
      violations: [checkViolation("UNKNOWN_MARKETPLACE", `Unknown marketplace: ${check.marketplaceId}`)],
      appliedPractices: [],
      rankingHints: [],
    };
  }

  const { requirements, restrictions, practices } = getContextRules(profile, check.context);

  if (check.context === MarketplaceImageContext.MAIN_IMAGE) {
    if (check.marketplaceId === MarketplaceKnowledgeId.AMAZON) {
      if (check.background && check.background !== "white" && check.background !== "#ffffff") {
        violations.push(
          checkViolation(
            "REQUIREMENT_NOT_MET",
            "Amazon main image requires pure white background",
            { requirementId: "amazon.main.white-bg" },
          ),
        );
      }
      if (check.hasPromotionalBadges) {
        violations.push(
          checkViolation(
            "CRITICAL_RESTRICTION_VIOLATED",
            "Promotional badges forbidden on Amazon main image",
            { restrictionId: "amazon.main.no-badges" },
          ),
        );
      }
      if (check.hasAdditionalProducts) {
        violations.push(
          checkViolation(
            "CRITICAL_RESTRICTION_VIOLATED",
            "Additional products forbidden on Amazon main image",
            { restrictionId: "amazon.main.no-extra-products" },
          ),
        );
      }
    }
  }

  if (check.context === MarketplaceImageContext.MAIN_IMAGE && check.hasTextOverlay) {
    const textRestriction = restrictions.find((r) => r.rule.toLowerCase().includes("text"));
    if (textRestriction?.critical) {
      violations.push(
        checkViolation(
          "CRITICAL_RESTRICTION_VIOLATED",
          textRestriction.rule,
          { restrictionId: textRestriction.id },
        ),
      );
    }
  }

  if (check.formatId && check.width && check.height) {
    const format = profile.supportedFormats.find((f) => f.id === check.formatId);
    if (format && (check.width < format.minWidth || check.height < format.minHeight)) {
      violations.push(
        checkViolation(
          "REQUIREMENT_NOT_MET",
          `Resolution below minimum ${format.minWidth}×${format.minHeight}`,
          { requirementId: requirements[0]?.id },
        ),
      );
    }
  }

  const criticalViolations = violations.filter((v) => v.code === "CRITICAL_RESTRICTION_VIOLATED");
  const appliedPractices = check.category
    ? getBestPracticesForCategory(profile, check.category)
    : practices;

  const rankingHints = profile.rankingFactors
    .sort((a, b) => b.weight - a.weight)
    .map((f) => f.description);

  return {
    valid: violations.length === 0,
    readyForRenderPipeline: criticalViolations.length === 0 && violations.length === 0,
    violations,
    appliedPractices,
    rankingHints,
  };
}

export function resolveMarketplaceFromBlueprint(marketplace: MarketplaceId): MarketplaceKnowledgeIdValue {
  return BLUEPRINT_MARKETPLACE_MAP[marketplace];
}

export function profilesHaveDistinctRules(): boolean {
  const signatures = MARKETPLACE_PROFILES.map((p) => {
    const reqIds = p.requirements.map((r) => r.id).sort().join("|");
    const resIds = p.restrictions.map((r) => r.id).sort().join("|");
    return `${p.id}:${reqIds}:${resIds}`;
  });
  return new Set(signatures).size === signatures.length;
}

export function validateMarketplaceKnowledge(
  ctx: MarketplaceKnowledgeContext = {},
): MarketplaceKnowledgeReport {
  const violations: MarketplaceKnowledgeViolation[] = [];

  if (ctx.identicalRulesAcrossPlatforms) {
    violations.push(
      violation(
        "IDENTICAL_RULES_ACROSS_PLATFORMS",
        "All marketplaces must not share identical rule sets",
      ),
    );
  }

  if (ctx.missingCategoryKnowledge) {
    violations.push(
      violation("MISSING_CATEGORY_KNOWLEDGE", "Category visual guidance is required"),
    );
  }

  if (ctx.staticKnowledgeBase) {
    violations.push(
      violation("STATIC_KNOWLEDGE_BASE", "Marketplace knowledge must support evolution"),
    );
  }

  if (ctx.mixedMandatoryAndRecommendations) {
    violations.push(
      violation(
        "MANDATORY_MIXED_WITH_RECOMMENDATIONS",
        "Mandatory requirements must be separate from best practices",
      ),
    );
  }

  if (ctx.blueprintBypassesValidation) {
    violations.push(
      violation(
        "BLUEPRINT_BYPASSES_VALIDATION",
        "Blueprint must not bypass marketplace validation before render pipeline",
      ),
    );
  }

  const amazonUs = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.US);
  const amazonJp = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.JP);
  const amazonDe = getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.AMAZON, MarketplaceRegion.DE);

  if (!amazonUs || !amazonJp || !amazonDe) {
    violations.push(
      violation("REGION_PROFILE_MISSING", "Amazon regional profiles US/JP/DE must exist"),
    );
  }

  if (!profilesHaveDistinctRules()) {
    violations.push(
      violation(
        "IDENTICAL_RULES_ACROSS_PLATFORMS",
        "Detected identical rule signatures across marketplace profiles",
      ),
    );
  }

  const mandatoryTagged = MARKETPLACE_PROFILES.every((p) =>
    p.requirements.every((r) => r.mandatory === true),
  );
  const practicesUntagged = MARKETPLACE_PROFILES.every((p) =>
    p.bestPractices.every((bp) => !("mandatory" in bp)),
  );

  if (!mandatoryTagged || !practicesUntagged) {
    violations.push(
      violation(
        "MANDATORY_MIXED_WITH_RECOMMENDATIONS",
        "Requirements and best practices must remain in separate collections",
      ),
    );
  }

  const sampleValidation = validateMarketplaceBlueprint({
    marketplaceId: MarketplaceKnowledgeId.AMAZON,
    context: MarketplaceImageContext.MAIN_IMAGE,
    region: MarketplaceRegion.US,
    background: "white",
    category: ProductCategoryKnowledge.BEAUTY,
  });

  if (!sampleValidation.readyForRenderPipeline) {
    violations.push(
      violation(
        "BLUEPRINT_BYPASSES_VALIDATION",
        "Valid compliant blueprint must pass validation before render pipeline",
      ),
    );
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    profiles: [...MARKETPLACE_PROFILES],
    supportedPlatforms: [...SUPPORTED_MARKETPLACE_PLATFORMS],
    goldenRuleSatisfied: unique.length === 0,
    contextAware: MARKETPLACE_PROFILES.some((p) =>
      p.requirements.some((r) => r.context === MarketplaceImageContext.INFOGRAPHIC),
    ),
    regionalProfilesSupported: Boolean(amazonUs && amazonJp && amazonDe),
    versioningIndependent: new Set(MARKETPLACE_PROFILES.map((p) => p.version)).size >= 3,
  };
}

export function assertMarketplaceKnowledge(
  ctx?: MarketplaceKnowledgeContext,
): MarketplaceKnowledgeReport {
  const report = validateMarketplaceKnowledge(ctx);
  if (!report.valid) {
    throw new Error(
      `Marketplace knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runMarketplaceKnowledge(input: {
  ctx?: MarketplaceKnowledgeContext;
}): MarketplaceKnowledgeReport {
  return validateMarketplaceKnowledge(input.ctx);
}

export function isMarketplaceKnowledgeFailure(code: string): code is MarketplaceKnowledgeFailureCode {
  return [
    "IDENTICAL_RULES_ACROSS_PLATFORMS",
    "MISSING_CATEGORY_KNOWLEDGE",
    "STATIC_KNOWLEDGE_BASE",
    "MANDATORY_MIXED_WITH_RECOMMENDATIONS",
    "BLUEPRINT_BYPASSES_VALIDATION",
    "CRITICAL_RESTRICTION_VIOLATED",
    "REQUIREMENT_NOT_MET",
    "UNKNOWN_MARKETPLACE",
    "UNKNOWN_CONTEXT",
    "REGION_PROFILE_MISSING",
  ].includes(code);
}

/** Integrates with Ch 5.4 Knowledge Layer.MARKETPLACE */
export function getMarketplaceKnowledgeLayerBinding(): {
  layer: typeof KnowledgeLayer.MARKETPLACE;
  moduleVersion: string;
  profileCount: number;
} {
  return {
    layer: KnowledgeLayer.MARKETPLACE,
    moduleVersion: MARKETPLACE_KNOWLEDGE_VERSION,
    profileCount: MARKETPLACE_PROFILES.length,
  };
}

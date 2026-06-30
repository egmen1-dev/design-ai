/**
 * Chapter 5.7 — Style Knowledge engine.
 * Structured visual style profiles for business-driven aesthetic decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import {
  MarketplaceImageContext,
  MarketplaceKnowledgeId,
  ProductCategoryKnowledge,
} from "./marketplace-knowledge-types";
import {
  StyleFamily,
  StyleTaxonomyRoot,
  type AgentStyleGuidance,
  type ComposedStyleProfile,
  type StyleBlueprintCheck,
  type StyleBlueprintValidation,
  type StyleConsistencyViolation,
  type StyleFamilyId,
  type StyleKnowledgeContext,
  type StyleKnowledgeFailureCode,
  type StyleKnowledgeReport,
  type StyleKnowledgeViolation,
  type StyleProfile,
  type StyleSelectionContext,
} from "./style-knowledge-types";

export {
  StyleFamily,
  StyleTaxonomyRoot,
  type StyleFamilyId,
  type StyleTaxonomyRootId,
  type StyleProfile,
  type StyleSelectionContext,
  type ComposedStyleProfile,
  type StyleBlueprintCheck,
  type StyleConsistencyViolation,
  type StyleBlueprintValidation,
  type AgentStyleGuidance,
  type StyleKnowledgeContext,
  type StyleKnowledgeViolation,
  type StyleKnowledgeReport,
  type StyleKnowledgeFailureCode,
} from "./style-knowledge-types";

export const STYLE_KNOWLEDGE_VERSION = "5.7.0";

export const STYLE_KNOWLEDGE_GOLDEN_RULE =
  "Style is not image decoration. Style is a way to convey business meaning through visual language. " +
  "Good style does not draw attention to itself — it strengthens perception of the product, brand, and commercial offer.";

export const STYLE_FAMILY_TAXONOMY: Record<StyleFamilyId, { root: string; path: string[] }> = {
  [StyleFamily.LUXURY]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "luxury"] },
  [StyleFamily.MINIMAL]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "minimal"] },
  [StyleFamily.MODERN]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "modern"] },
  [StyleFamily.PREMIUM]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "premium"] },
  [StyleFamily.TECHNICAL]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "technical"] },
  [StyleFamily.LIFESTYLE]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "lifestyle"] },
  [StyleFamily.NATURAL]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "natural"] },
  [StyleFamily.INDUSTRIAL]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "industrial"] },
  [StyleFamily.MEDICAL]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "medical"] },
  [StyleFamily.ECO]: { root: StyleTaxonomyRoot.COMMERCIAL, path: ["commercial", "eco"] },
};

function profile(partial: StyleProfile): StyleProfile {
  return partial;
}

export const SEED_STYLE_PROFILES: readonly StyleProfile[] = [
  profile({
    id: "luxury",
    name: "Luxury",
    family: StyleFamily.LUXURY,
    description: "Premium materials, controlled reflections, and high perceived value",
    visualCharacteristics: [
      "premium materials",
      "soft lighting",
      "high detail level",
      "controlled reflections",
      "expensive color palette",
    ],
    recommendedCategories: ["cosmetics", "watches", "jewelry", "premium_electronics", ProductCategoryKnowledge.BEAUTY],
    forbiddenCategories: ["construction_supplies", "budget_household", "industrial_bulk"],
    psychologicalEffects: ["status", "exclusivity", "trust", "high_value"],
    constraints: ["no cheap materials", "no harsh lighting", "no random scene elements"],
    confidence: 0.92,
    version: "1.0.0",
  }),
  profile({
    id: "minimal",
    name: "Minimal",
    family: StyleFamily.MINIMAL,
    description: "Clean composition with generous negative space and limited palette",
    visualCharacteristics: [
      "generous negative space",
      "low visual density",
      "limited palette",
      "simple forms",
      "high readability",
    ],
    recommendedCategories: ["electronics", ProductCategoryKnowledge.ELECTRONICS, "home", "premium"],
    forbiddenCategories: ["multi_sku_bundles", "complex_toolkits"],
    psychologicalEffects: ["clarity", "focus", "sophistication"],
    constraints: ["no visual noise", "no overcrowding", "no excessive objects"],
    confidence: 0.9,
    version: "1.0.0",
  }),
  profile({
    id: "modern",
    name: "Modern",
    family: StyleFamily.MODERN,
    description: "Contemporary aesthetic with clean lines and dynamic energy",
    visualCharacteristics: ["clean lines", "contemporary forms", "balanced contrast", "sleek surfaces"],
    recommendedCategories: ["electronics", "fashion", "tech_accessories"],
    forbiddenCategories: ["antique", "heritage_crafts"],
    psychologicalEffects: ["innovation", "freshness", "relevance"],
    constraints: ["avoid dated visual tropes", "no ornate decoration"],
    confidence: 0.88,
    version: "1.0.0",
  }),
  profile({
    id: "premium",
    name: "Premium",
    family: StyleFamily.PREMIUM,
    description: "Elevated commercial aesthetic between luxury and mainstream",
    visualCharacteristics: ["refined composition", "quality materials", "polished finish"],
    recommendedCategories: ["cosmetics", "kitchen", ProductCategoryKnowledge.KITCHEN, "appliances"],
    forbiddenCategories: ["disposable_goods", "bulk_commodities"],
    psychologicalEffects: ["quality", "reliability", "aspiration"],
    constraints: ["no budget visual cues", "maintain polish"],
    confidence: 0.87,
    version: "1.0.0",
  }),
  profile({
    id: "technical",
    name: "Technical",
    family: StyleFamily.TECHNICAL,
    description: "Precision-focused visual language emphasizing function and reliability",
    visualCharacteristics: ["precise geometry", "functional layout", "neutral palette", "sharp detail"],
    recommendedCategories: [ProductCategoryKnowledge.ELECTRONICS, "tools", "industrial", "professional"],
    forbiddenCategories: ["romantic_gifts", "decorative_only"],
    psychologicalEffects: ["precision", "professionalism", "reliability"],
    constraints: ["no whimsical elements", "no emotional overload"],
    confidence: 0.89,
    version: "1.0.0",
  }),
  profile({
    id: "lifestyle",
    name: "Lifestyle",
    family: StyleFamily.LIFESTYLE,
    description: "Product shown in real-life context conveying aspiration and use",
    visualCharacteristics: ["contextual scenes", "human-scale environments", "warm atmosphere"],
    recommendedCategories: [ProductCategoryKnowledge.SPORTS, "fashion", "home", "outdoor"],
    forbiddenCategories: ["medical_devices", "industrial_parts"],
    psychologicalEffects: ["aspiration", "belonging", "desire"],
    constraints: ["scene must support product story", "no distracting lifestyle props"],
    confidence: 0.86,
    version: "1.0.0",
  }),
  profile({
    id: "natural",
    name: "Natural",
    family: StyleFamily.NATURAL,
    description: "Organic textures and earthy tones conveying authenticity",
    visualCharacteristics: ["organic textures", "earthy tones", "natural light", "soft shadows"],
    recommendedCategories: ["food", "organic_beauty", "home_textiles"],
    forbiddenCategories: ["synthetic_industrial", "high_tech"],
    psychologicalEffects: ["authenticity", "comfort", "wholesomeness"],
    constraints: ["no artificial neon colors", "no sterile studio look"],
    confidence: 0.85,
    version: "1.0.0",
  }),
  profile({
    id: "industrial",
    name: "Industrial",
    family: StyleFamily.INDUSTRIAL,
    description: "Robust visual language for durability and professional use",
    visualCharacteristics: ["raw materials", "strong contrast", "functional staging"],
    recommendedCategories: ["tools", "hardware", "workshop", "construction"],
    forbiddenCategories: ["luxury_cosmetics", "jewelry"],
    psychologicalEffects: ["durability", "strength", "utility"],
    constraints: ["no delicate styling", "no luxury cues"],
    confidence: 0.84,
    version: "1.0.0",
  }),
  profile({
    id: "medical",
    name: "Medical",
    family: StyleFamily.MEDICAL,
    description: "Clean clinical aesthetic conveying safety and trust",
    visualCharacteristics: ["clinical cleanliness", "soft neutral palette", "high readability"],
    recommendedCategories: ["medical", "health", "pharma", "wellness_devices"],
    forbiddenCategories: ["fashion", "entertainment", "luxury_decor"],
    psychologicalEffects: ["safety", "trust", "care"],
    constraints: ["no sensational imagery", "no luxury excess"],
    confidence: 0.91,
    version: "1.0.0",
  }),
  profile({
    id: "eco",
    name: "Eco",
    family: StyleFamily.ECO,
    description: "Sustainable visual language emphasizing natural responsibility",
    visualCharacteristics: ["green accents", "natural materials", "light airy composition"],
    recommendedCategories: ["eco_products", "organic", "sustainable_home"],
    forbiddenCategories: ["single_use_plastic", "wasteful_packaging"],
    psychologicalEffects: ["naturalness", "safety", "environmental_responsibility"],
    constraints: ["no wasteful visual cues", "no heavy industrial look"],
    confidence: 0.88,
    version: "1.0.0",
  }),
  profile({
    id: "modern-luxury",
    name: "Modern Luxury",
    family: StyleFamily.LUXURY,
    parentId: "luxury",
    description: "Contemporary luxury combining sleek modern lines with premium feel",
    visualCharacteristics: ["sleek surfaces", "premium materials", "controlled lighting", "modern geometry"],
    recommendedCategories: ["premium_electronics", "luxury_cosmetics", ProductCategoryKnowledge.BEAUTY],
    forbiddenCategories: ["budget_household", "construction_supplies"],
    psychologicalEffects: ["status", "innovation", "exclusivity"],
    constraints: ["no ornate classic luxury", "no budget cues"],
    confidence: 0.9,
    version: "1.0.0",
  }),
  profile({
    id: "minimal-luxury",
    name: "Minimal Luxury",
    family: StyleFamily.LUXURY,
    parentId: "luxury",
    description: "Refined luxury through restraint and generous negative space",
    visualCharacteristics: ["negative space", "premium materials", "soft lighting", "limited palette"],
    recommendedCategories: ["jewelry", "watches", "premium_cosmetics"],
    forbiddenCategories: ["multi_product_bundles", "budget_household"],
    psychologicalEffects: ["exclusivity", "sophistication", "trust"],
    constraints: ["no visual clutter", "no cheap materials", "no harsh lighting"],
    confidence: 0.91,
    version: "1.0.0",
  }),
  profile({
    id: "modern-technical",
    name: "Modern Technical",
    family: StyleFamily.TECHNICAL,
    parentId: "technical",
    description: "Contemporary technical aesthetic for cutting-edge products",
    visualCharacteristics: ["sleek geometry", "precise detail", "neutral palette", "clean staging"],
    recommendedCategories: [ProductCategoryKnowledge.ELECTRONICS, "professional_tools", "tech"],
    forbiddenCategories: ["handmade_crafts", "romantic"],
    psychologicalEffects: ["innovation", "precision", "reliability"],
    constraints: ["no vintage styling", "no decorative excess"],
    confidence: 0.89,
    version: "1.0.0",
  }),
] as const;

export const AUDIENCE_STYLE_PREFERENCES: Record<string, StyleFamilyId[]> = {
  young: [StyleFamily.MODERN, StyleFamily.LIFESTYLE],
  professional: [StyleFamily.TECHNICAL, StyleFamily.MINIMAL],
  luxury_buyer: [StyleFamily.LUXURY, StyleFamily.PREMIUM],
  eco_conscious: [StyleFamily.ECO, StyleFamily.NATURAL],
  medical_professional: [StyleFamily.MEDICAL, StyleFamily.TECHNICAL],
};

export const MARKETPLACE_STYLE_HINTS: Record<string, Partial<Record<string, StyleFamilyId[]>>> = {
  [MarketplaceKnowledgeId.AMAZON]: {
    [MarketplaceImageContext.MAIN_IMAGE]: [StyleFamily.MINIMAL, StyleFamily.TECHNICAL],
    [MarketplaceImageContext.SECONDARY_IMAGE]: [StyleFamily.LIFESTYLE, StyleFamily.PREMIUM, StyleFamily.LUXURY],
    [MarketplaceImageContext.INFOGRAPHIC]: [StyleFamily.MODERN, StyleFamily.TECHNICAL],
  },
  [MarketplaceKnowledgeId.OZON]: {
    [MarketplaceImageContext.INFOGRAPHIC]: [StyleFamily.MODERN, StyleFamily.PREMIUM],
  },
  [MarketplaceKnowledgeId.WILDBERRIES]: {
    [MarketplaceImageContext.INFOGRAPHIC]: [StyleFamily.LIFESTYLE, StyleFamily.MODERN],
  },
};

const AGENT_STYLE_ASPECTS: Record<AgentContractId, string> = {
  "lighting-director": "lighting",
  "composition-director": "composition",
  "scene-director": "scene",
  "material-director": "materials",
  "camera-director": "camera",
  "commercial-photo-director": "composition",
  "visual-story-director": "scene",
  "chief-design-director": "composition",
  "vision-quality-director": "composition",
  "product-analyzer": "scene",
  "creative-engine": "composition",
  "render-adapter": "composition",
  "governance": "composition",
  "consensus-engine": "composition",
};

function violation(
  code: StyleKnowledgeViolation["code"],
  message: string,
  styleId?: string,
): StyleKnowledgeViolation {
  return { code, message, styleId };
}

export function getStyleProfile(styleId: string): StyleProfile | undefined {
  return SEED_STYLE_PROFILES.find((p) => p.id === styleId);
}

export function getStylesByFamily(family: StyleFamilyId): StyleProfile[] {
  return SEED_STYLE_PROFILES.filter((p) => p.family === family);
}

export function getStyleTaxonomyPath(styleId: string): string[] {
  const p = getStyleProfile(styleId);
  if (!p) return [];
  const familyPath = STYLE_FAMILY_TAXONOMY[p.family]?.path ?? [];
  if (p.parentId) {
    return [...familyPath, p.parentId.replace(/-/g, "_"), p.id.replace(/-/g, "_")];
  }
  return familyPath;
}

export function composeStyles(styleA: string, styleB: string): ComposedStyleProfile | undefined {
  const a = getStyleProfile(styleA);
  const b = getStyleProfile(styleB);
  if (!a || !b) return undefined;

  const composedId = `${styleA}-${styleB}`.replace(/\s+/g, "-").toLowerCase();
  const existing = getStyleProfile(composedId);
  if (existing) {
    return { ...existing, composedFrom: [styleA, styleB] };
  }

  return {
    id: composedId,
    name: `${a.name} ${b.name}`,
    family: a.family,
    parentId: a.id,
    description: `Composed style combining ${a.name} and ${b.name}`,
    visualCharacteristics: [...new Set([...a.visualCharacteristics, ...b.visualCharacteristics])],
    recommendedCategories: a.recommendedCategories.filter((c) => b.recommendedCategories.includes(c)),
    forbiddenCategories: [...new Set([...a.forbiddenCategories, ...b.forbiddenCategories])],
    psychologicalEffects: [...new Set([...a.psychologicalEffects, ...b.psychologicalEffects])],
    constraints: [...new Set([...a.constraints, ...b.constraints])],
    confidence: Math.min(a.confidence, b.confidence) * 0.95,
    version: "1.0.0",
    composedFrom: [styleA, styleB],
  };
}

export function isStyleAllowedForCategory(styleId: string, category: string): boolean {
  const profile = getStyleProfile(styleId);
  if (!profile) return false;
  const cat = category.toLowerCase();
  if (profile.forbiddenCategories.some((f) => cat.includes(f.toLowerCase()) || f.toLowerCase().includes(cat))) {
    return false;
  }
  return profile.recommendedCategories.some(
    (r) => cat.includes(r.toLowerCase()) || r.toLowerCase().includes(cat),
  );
}

export function recommendStyleForContext(ctx: StyleSelectionContext): StyleProfile[] {
  const scores = new Map<string, number>();

  for (const p of SEED_STYLE_PROFILES) {
    let score = p.confidence * 10;

    if (ctx.category) {
      if (isStyleAllowedForCategory(p.id, ctx.category)) score += 30;
      else if (p.forbiddenCategories.some((f) => ctx.category!.toLowerCase().includes(f))) score -= 50;
    }

    if (ctx.audience) {
      const prefs = AUDIENCE_STYLE_PREFERENCES[ctx.audience.toLowerCase()] ?? [];
      if (prefs.includes(p.family)) score += 20;
    }

    if (ctx.marketplace && ctx.imageContext) {
      const hints = MARKETPLACE_STYLE_HINTS[ctx.marketplace]?.[ctx.imageContext] ?? [];
      if (hints.includes(p.family)) score += 15;
    }

    if (ctx.businessGoal) {
      const goal = ctx.businessGoal.toLowerCase();
      if (goal.includes("luxury") && p.family === StyleFamily.LUXURY) score += 25;
      if (goal.includes("minimal") && p.family === StyleFamily.MINIMAL) score += 25;
      if (goal.includes("technical") && p.family === StyleFamily.TECHNICAL) score += 25;
    }

    scores.set(p.id, score);
  }

  return [...scores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => getStyleProfile(id)!)
    .filter(Boolean);
}

export function getStyleConstraints(styleId: string): string[] {
  return getStyleProfile(styleId)?.constraints ?? [];
}

export function getAgentStyleGuidance(
  agentId: AgentContractId,
  styleId: string,
): AgentStyleGuidance | undefined {
  const profile = getStyleProfile(styleId);
  if (!profile) return undefined;

  const aspect = AGENT_STYLE_ASPECTS[agentId];
  if (!aspect) return undefined;

  return {
    agentId,
    styleId,
    directives: profile.visualCharacteristics.map((c) => `${aspect}: apply ${c}`),
    forbidden: profile.constraints,
  };
}

const STYLE_ASPECT_EXPECTATIONS: Record<string, Record<string, string[]>> = {
  minimal: {
    lighting: ["soft", "even", "neutral"],
    composition: ["negative space", "sparse", "clean"],
    scene: ["simple", "uncluttered"],
    materials: ["matte", "simple"],
    visualDensity: ["low"],
  },
  luxury: {
    lighting: ["soft", "premium", "controlled"],
    composition: ["refined", "detailed"],
    scene: ["elegant", "premium"],
    materials: ["premium", "rich"],
    visualDensity: ["medium"],
  },
  technical: {
    lighting: ["precise", "neutral", "sharp"],
    composition: ["geometric", "functional"],
    scene: ["clean", "neutral"],
    materials: ["precise", "metallic"],
    visualDensity: ["medium"],
  },
};

function aspectMatches(expected: string[], actual?: string): boolean {
  if (!actual) return true;
  const lower = actual.toLowerCase();
  return expected.some((e) => lower.includes(e));
}

export function validateStyleBlueprint(check: StyleBlueprintCheck): StyleBlueprintValidation {
  const profile = getStyleProfile(check.styleId);
  const violations: StyleConsistencyViolation[] = [];

  if (!profile) {
    return {
      valid: false,
      styleId: check.styleId,
      violations: [],
      readyForConsensus: false,
      retryRecommended: true,
    };
  }

  const expectations =
    STYLE_ASPECT_EXPECTATIONS[profile.family] ??
    STYLE_ASPECT_EXPECTATIONS[profile.id] ??
    {};

  const aspects: Array<{ key: keyof StyleBlueprintCheck; agent: string }> = [
    { key: "lighting", agent: "lighting-director" },
    { key: "composition", agent: "composition-director" },
    { key: "scene", agent: "scene-director" },
    { key: "materials", agent: "material-director" },
    { key: "camera", agent: "camera-director" },
    { key: "typography", agent: "composition-director" },
  ];

  for (const { key, agent } of aspects) {
    const actual = check[key];
    const expected = expectations[key as string];
    if (actual && expected && !aspectMatches(expected, actual)) {
      violations.push({
        agent,
        aspect: key,
        expected: expected.join(", "),
        actual,
      });
    }
  }

  if (check.visualDensity && expectations.visualDensity) {
    if (!expectations.visualDensity.includes(check.visualDensity)) {
      violations.push({
        agent: "composition-director",
        aspect: "visualDensity",
        expected: expectations.visualDensity.join(", "),
        actual: check.visualDensity,
      });
    }
  }

  return {
    valid: violations.length === 0,
    styleId: check.styleId,
    violations,
    readyForConsensus: violations.length === 0,
    retryRecommended: violations.length > 0,
  };
}

export function validateNewStyle(candidate: StyleProfile): StyleKnowledgeViolation[] {
  const issues: StyleKnowledgeViolation[] = [];

  if (!candidate.visualCharacteristics.length) {
    issues.push(violation("DECORATIVE_STYLE_ONLY", "Style lacks visual characteristics", candidate.id));
  }
  if (!candidate.constraints.length) {
    issues.push(violation("MISSING_STYLE_CONSTRAINTS", "Style lacks constraints", candidate.id));
  }
  if (!candidate.recommendedCategories.length) {
    issues.push(violation("NO_CATEGORY_LINK", "Style lacks category recommendations", candidate.id));
  }
  if (!candidate.psychologicalEffects.length) {
    issues.push(violation("NO_AUDIENCE_LINK", "Style lacks psychological effects for audience", candidate.id));
  }
  if (candidate.confidence < 0.5) {
    issues.push(violation("UNVALIDATED_NEW_STYLE", "Style confidence too low for adoption", candidate.id));
  }

  return issues;
}

export function validateAgentStyleConsistency(styleId: string): boolean {
  const agents = Object.keys(AGENT_STYLE_ASPECTS) as AgentContractId[];
  const guidances = agents
    .map((a) => getAgentStyleGuidance(a, styleId))
    .filter((g): g is AgentStyleGuidance => g !== undefined);

  if (guidances.length === 0) return false;

  const forbiddenSets = guidances.map((g) => g.forbidden.sort().join("|"));
  return new Set(forbiddenSets).size === 1;
}

export function validateStyleKnowledge(ctx: StyleKnowledgeContext = {}): StyleKnowledgeReport {
  const violations: StyleKnowledgeViolation[] = [];

  if (ctx.decorativeOnlyStyle) {
    violations.push(violation("DECORATIVE_STYLE_ONLY", "Style must not be decorative words without structure"));
  }
  if (ctx.missingConstraints) {
    violations.push(violation("MISSING_STYLE_CONSTRAINTS", "Every style must have constraints"));
  }
  if (ctx.noAudienceLink) {
    violations.push(violation("NO_AUDIENCE_LINK", "Style must link to audience expectations"));
  }
  if (ctx.noCategoryLink) {
    violations.push(violation("NO_CATEGORY_LINK", "Style must link to product categories"));
  }
  if (ctx.inconsistentAgentInterpretation) {
    violations.push(violation("INCONSISTENT_AGENT_INTERPRETATION", "Agents must interpret style consistently"));
  }
  if (ctx.unvalidatedNewStyle) {
    violations.push(violation("UNVALIDATED_NEW_STYLE", "New styles must pass validation before adoption"));
  }

  for (const p of SEED_STYLE_PROFILES) {
    const newStyleIssues = validateNewStyle(p);
    violations.push(...newStyleIssues);
  }

  const luxuryForConstruction = isStyleAllowedForCategory("luxury", "construction_supplies");
  if (luxuryForConstruction) {
    violations.push(violation("FORBIDDEN_CATEGORY_STYLE", "Luxury must not be recommended for construction supplies", "luxury"));
  }

  const minimalLuxury = composeStyles("minimal", "luxury");
  if (!minimalLuxury || minimalLuxury.id !== "minimal-luxury") {
    if (!getStyleProfile("minimal-luxury")) {
      violations.push(violation("DECORATIVE_STYLE_ONLY", "Style composition must produce valid profiles"));
    }
  }

  const youngRecs = recommendStyleForContext({ audience: "young", category: ProductCategoryKnowledge.SPORTS });
  const proRecs = recommendStyleForContext({ audience: "professional", category: ProductCategoryKnowledge.ELECTRONICS });
  if (youngRecs.length === 0 || proRecs.length === 0) {
    violations.push(violation("NO_AUDIENCE_LINK", "Audience must influence style recommendations"));
  }
  if (youngRecs[0]?.family === proRecs[0]?.family && youngRecs[0]?.id === proRecs[0]?.id) {
    violations.push(violation("NO_AUDIENCE_LINK", "Different audiences must produce different style recommendations"));
  }

  const amazonMain = recommendStyleForContext({
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    category: ProductCategoryKnowledge.ELECTRONICS,
  });
  if (amazonMain.length === 0) {
    violations.push(violation("NO_CATEGORY_LINK", "Marketplace context must influence style selection"));
  }

  if (!validateAgentStyleConsistency("minimal-luxury")) {
    violations.push(violation("INCONSISTENT_AGENT_INTERPRETATION", "Agents must share consistent style constraints for minimal-luxury"));
  }

  const validBlueprint = validateStyleBlueprint({
    styleId: "minimal",
    lighting: "soft even neutral",
    composition: "clean negative space",
    scene: "simple uncluttered",
    visualDensity: "low",
  });
  if (!validBlueprint.valid) {
    violations.push(violation("STYLE_CONSISTENCY_VIOLATED", "Valid minimal blueprint must pass style validation"));
  }

  const invalidBlueprint = validateStyleBlueprint({
    styleId: "minimal",
    lighting: "harsh chaotic neon",
    composition: "overcrowded busy",
    visualDensity: "high",
  });
  if (invalidBlueprint.valid || !invalidBlueprint.retryRecommended) {
    violations.push(violation("STYLE_CONSISTENCY_VIOLATED", "Style violations must trigger consensus retry"));
  }

  const unvalidated = validateNewStyle({
    id: "random-pretty",
    name: "Random Pretty",
    family: StyleFamily.MODERN,
    description: "Just looks nice",
    visualCharacteristics: [],
    recommendedCategories: [],
    forbiddenCategories: [],
    psychologicalEffects: [],
    constraints: [],
    confidence: 0.3,
    version: "0.1.0",
  });
  if (unvalidated.length === 0) {
    violations.push(violation("UNVALIDATED_NEW_STYLE", "Unstructured styles must fail validation"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    profiles: [...SEED_STYLE_PROFILES],
    families: Object.values(StyleFamily),
    goldenRuleSatisfied: unique.length === 0,
    structured: SEED_STYLE_PROFILES.every((p) => p.visualCharacteristics.length > 0),
    compositionCapable: Boolean(getStyleProfile("minimal-luxury")),
    evolutionReady: validateNewStyle(SEED_STYLE_PROFILES[0]).length === 0,
  };
}

export function assertStyleKnowledge(ctx?: StyleKnowledgeContext): StyleKnowledgeReport {
  const report = validateStyleKnowledge(ctx);
  if (!report.valid) {
    throw new Error(`Style knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export function runStyleKnowledge(input: { ctx?: StyleKnowledgeContext }): StyleKnowledgeReport {
  return validateStyleKnowledge(input.ctx);
}

export function isStyleKnowledgeFailure(code: string): code is StyleKnowledgeFailureCode {
  return [
    "DECORATIVE_STYLE_ONLY",
    "MISSING_STYLE_CONSTRAINTS",
    "NO_AUDIENCE_LINK",
    "NO_CATEGORY_LINK",
    "INCONSISTENT_AGENT_INTERPRETATION",
    "UNVALIDATED_NEW_STYLE",
    "STYLE_CONSISTENCY_VIOLATED",
    "FORBIDDEN_CATEGORY_STYLE",
    "UNKNOWN_STYLE",
  ].includes(code);
}

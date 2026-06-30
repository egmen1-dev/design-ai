/**
 * Chapter 5.9 — Photography Knowledge engine.
 * Professional commercial product photography knowledge for Technical Directors.
 */
import { KnowledgeEvidenceSource } from "./design-knowledge-philosophy-types";
import { ProductCategoryKnowledge } from "./marketplace-knowledge-types";
import {
  ExposureMode,
  LensProfile,
  LightingKnowledgeScheme,
  MaterialType,
  PhotographyTopic,
  type PhotographyBlueprintCheck,
  type PhotographyBlueprintValidation,
  type PhotographyCondition,
  type PhotographyConsistencyViolation,
  type PhotographyKnowledge,
  type PhotographyKnowledgeContext,
  type PhotographyKnowledgeFailureCode,
  type PhotographyKnowledgeReference,
  type PhotographyKnowledgeReport,
  type PhotographyKnowledgeViolation,
  type PhotographySelectionContext,
  type PhotographyTopicId,
  type LensProfileId,
  type LightingKnowledgeSchemeId,
  type MaterialTypeId,
} from "./photography-knowledge-types";

export {
  PhotographyTopic,
  LightingKnowledgeScheme,
  LensProfile,
  ExposureMode,
  MaterialType,
  type PhotographyTopicId,
  type LightingKnowledgeSchemeId,
  type LensProfileId,
  type ExposureModeId,
  type MaterialTypeId,
  type PhotographyCondition,
  type PhotographyExample,
  type PhotographyKnowledgeReference,
  type PhotographyKnowledge,
  type PhotographySelectionContext,
  type PhotographyBlueprintCheck,
  type PhotographyConsistencyViolation,
  type PhotographyBlueprintValidation,
  type PhotographyKnowledgeContext,
  type PhotographyKnowledgeViolation,
  type PhotographyKnowledgeReport,
  type PhotographyKnowledgeFailureCode,
} from "./photography-knowledge-types";

export const PHOTOGRAPHY_KNOWLEDGE_VERSION = "5.9.0";

export const PHOTOGRAPHY_KNOWLEDGE_GOLDEN_RULE =
  "Professional photography does not begin with the camera. It begins with understanding what the buyer must feel when seeing the product. " +
  "Photography Knowledge teaches the system to create images that build trust, demonstrate product value, and support purchase decisions — not merely beautiful pictures.";

export const PRODUCT_FIRST_PRINCIPLE =
  "Product > Photography — photography never becomes the main subject; all photographic decisions serve product demonstration.";

function ref(id: string, label: string, evidenceLevel: number): PhotographyKnowledgeReference {
  return { id, label, evidenceLevel };
}

function cond(
  field: string,
  operator: PhotographyCondition["operator"],
  value: string | string[],
): PhotographyCondition {
  return { field, operator, value };
}

function knowledge(partial: PhotographyKnowledge): PhotographyKnowledge {
  return partial;
}

export const SEED_PHOTOGRAPHY_KNOWLEDGE: readonly PhotographyKnowledge[] = [
  knowledge({
    id: "product-first",
    topic: PhotographyTopic.COMMERCIAL,
    rule: PRODUCT_FIRST_PRINCIPLE,
    conditions: [],
    examples: [{ id: "ex-product-hero", description: "Hero product occupies visual and lighting priority" }],
    confidence: 0.99,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.95)],
    agentIds: ["lighting-director", "camera-director", "commercial-photo-director"],
    commercialRationale: "Commercial effectiveness requires product dominance over photographic artistry",
  }),
  knowledge({
    id: "soft-window-light",
    topic: PhotographyTopic.LIGHTING,
    rule: "Use soft window light for natural lifestyle and home-category products",
    conditions: [cond("category", "in", ["kitchen", "home", ProductCategoryKnowledge.KITCHEN, "natural"])],
    examples: [{ id: "ex-window-kitchen", description: "Warm window key with ambient fill in kitchen scene" }],
    confidence: 0.88,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.9)],
    agentIds: ["lighting-director"],
    commercialRationale: "Natural light increases warmth and trust for home products",
  }),
  knowledge({
    id: "studio-softbox",
    topic: PhotographyTopic.LIGHTING,
    rule: "Use studio softbox for clean marketplace main images with controlled shadows",
    conditions: [cond("imageContext", "eq", "main_image")],
    examples: [{ id: "ex-softbox-main", description: "Top softbox key for Amazon main image" }],
    confidence: 0.92,
    references: [ref(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Marketplace Research", 0.85)],
    agentIds: ["lighting-director"],
    commercialRationale: "Controlled studio light maximizes product clarity on white backgrounds",
  }),
  knowledge({
    id: "luxury-side-rim",
    topic: PhotographyTopic.LIGHTING,
    rule: "Combine luxury side key with subtle rim light for premium material definition",
    conditions: [cond("styleId", "in", ["luxury", "minimal-luxury", "premium"])],
    examples: [{ id: "ex-luxury-rim", description: "Side key plus rim on watch or cosmetics hero" }],
    confidence: 0.9,
    references: [ref(KnowledgeEvidenceSource.EXPERT_CURATED, "Expert Curated", 0.92)],
    agentIds: ["lighting-director", "commercial-photo-director"],
    commercialRationale: "Rim separation increases perceived material quality and premium value",
  }),
  knowledge({
    id: "three-point-studio",
    topic: PhotographyTopic.LIGHTING,
    rule: "Use three-point lighting when product cutout and edge separation are required",
    conditions: [cond("productCutout", "eq", "true")],
    examples: [{ id: "ex-three-point", description: "Key, fill, rim for cutout hero product" }],
    confidence: 0.87,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.88)],
    agentIds: ["lighting-director"],
    commercialRationale: "Edge definition improves product readability on complex backgrounds",
  }),
  knowledge({
    id: "lens-35mm-dynamic",
    topic: PhotographyTopic.LENS,
    rule: "35mm lens creates dynamic perspective suitable for lifestyle and sports contexts",
    conditions: [cond("storyEnergy", "in", ["dynamic", "lifestyle", "sports"])],
    examples: [{ id: "ex-35-lifestyle", description: "Wide dynamic angle for active lifestyle scene" }],
    confidence: 0.84,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.85)],
    agentIds: ["camera-director"],
    commercialRationale: "Dynamic perspective conveys energy and contextual use",
  }),
  knowledge({
    id: "lens-50mm-natural",
    topic: PhotographyTopic.LENS,
    rule: "50mm lens provides natural human-eye perspective for general product photography",
    conditions: [],
    examples: [{ id: "ex-50-natural", description: "Neutral perspective for everyday consumer goods" }],
    confidence: 0.9,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.9)],
    agentIds: ["camera-director"],
    commercialRationale: "Natural perspective avoids distortion and maintains product trust",
  }),
  knowledge({
    id: "lens-85mm-premium",
    topic: PhotographyTopic.LENS,
    rule: "85mm lens is preferred for premium product hero shots with flattering compression",
    conditions: [cond("styleId", "in", ["luxury", "premium", "minimal-luxury"])],
    examples: [{ id: "ex-85-cosmetics", description: "85mm compression on luxury cosmetics bottle" }],
    confidence: 0.91,
    references: [ref(KnowledgeEvidenceSource.EXPERT_CURATED, "Expert Curated", 0.9)],
    agentIds: ["camera-director", "commercial-photo-director"],
    commercialRationale: "Telephoto compression elevates premium product perception",
  }),
  knowledge({
    id: "lens-macro-texture",
    topic: PhotographyTopic.LENS,
    rule: "100mm macro reveals material texture for beauty, leather, and fine-detail products",
    conditions: [cond("category", "in", ["beauty", "cosmetics", ProductCategoryKnowledge.BEAUTY, "leather"])],
    examples: [{ id: "ex-macro-skin", description: "Macro detail of skincare cream texture" }],
    confidence: 0.89,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.88)],
    agentIds: ["camera-director", "material-director"],
    commercialRationale: "Texture detail increases perceived quality and trust",
  }),
  knowledge({
    id: "perspective-low-power",
    topic: PhotographyTopic.PERSPECTIVE,
    rule: "Low camera angle strengthens power and dominance for automotive and industrial products",
    conditions: [cond("category", "in", ["automotive", "industrial", "tools", "sports"])],
    examples: [{ id: "ex-low-angle", description: "Low hero angle on power tool or vehicle part" }],
    confidence: 0.83,
    references: [ref(KnowledgeEvidenceSource.MARKETING, "Marketing Analytics", 0.8)],
    agentIds: ["camera-director", "scene-director"],
    commercialRationale: "Low angle reinforces strength and capability messaging",
  }),
  knowledge({
    id: "perspective-front-technical",
    topic: PhotographyTopic.PERSPECTIVE,
    rule: "Frontal perspective suits technical products requiring dimensional clarity",
    conditions: [cond("category", "in", ["technical", ProductCategoryKnowledge.ELECTRONICS, "medical"])],
    examples: [{ id: "ex-front-electronics", description: "Front orthographic view of electronics device" }],
    confidence: 0.88,
    references: [ref(KnowledgeEvidenceSource.INDUSTRIAL_DESIGN, "Industrial Design", 0.85)],
    agentIds: ["camera-director"],
    commercialRationale: "Frontal view maximizes feature readability for technical buyers",
  }),
  knowledge({
    id: "dof-luxury-moderate",
    topic: PhotographyTopic.DEPTH_OF_FIELD,
    rule: "Luxury products use moderate background blur to isolate hero without losing context",
    conditions: [cond("styleId", "in", ["luxury", "premium", "minimal-luxury"])],
    examples: [{ id: "ex-dof-luxury", description: "f/4 shallow background on premium watch" }],
    confidence: 0.87,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.88)],
    agentIds: ["camera-director"],
    commercialRationale: "Selective focus directs attention while maintaining premium atmosphere",
  }),
  knowledge({
    id: "dof-technical-deep",
    topic: PhotographyTopic.DEPTH_OF_FIELD,
    rule: "Technical diagrams and spec imagery require maximum sharpness across the frame",
    conditions: [cond("storyType", "in", ["technical", "feature", "comparison"])],
    examples: [{ id: "ex-dof-deep", description: "f/16 deep focus on exploded technical view" }],
    confidence: 0.92,
    references: [ref(KnowledgeEvidenceSource.EXPERT_CURATED, "Expert Curated", 0.9)],
    agentIds: ["camera-director"],
    commercialRationale: "Full sharpness ensures every feature is legible for evaluation",
  }),
  knowledge({
    id: "exposure-high-key",
    topic: PhotographyTopic.EXPOSURE,
    rule: "High key exposure for bright marketplace main images with preserved highlights",
    conditions: [cond("imageContext", "eq", "main_image")],
    examples: [{ id: "ex-high-key", description: "Bright even exposure on white background main image" }],
    confidence: 0.91,
    references: [ref(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Marketplace Research", 0.88)],
    agentIds: ["lighting-director", "commercial-photo-director"],
    commercialRationale: "High key exposure matches marketplace white-background requirements",
  }),
  knowledge({
    id: "exposure-low-key-premium",
    topic: PhotographyTopic.EXPOSURE,
    rule: "Low key exposure with controlled highlights for dramatic premium storytelling",
    conditions: [cond("styleId", "in", ["luxury"])],
    examples: [{ id: "ex-low-key", description: "Controlled contrast on luxury fragrance hero" }],
    confidence: 0.85,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.86)],
    agentIds: ["lighting-director"],
    commercialRationale: "Controlled contrast increases exclusivity perception",
  }),
  knowledge({
    id: "reflection-controlled-metal",
    topic: PhotographyTopic.REFLECTION,
    rule: "Metal and glass require controlled specular highlights — never random blown reflections",
    conditions: [cond("material", "in", [MaterialType.METAL, MaterialType.GLASS])],
    examples: [{ id: "ex-metal-specular", description: "Strip softbox reflection on stainless appliance" }],
    confidence: 0.93,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.92)],
    agentIds: ["material-director", "lighting-director"],
    commercialRationale: "Controlled reflections signal expensive manufacturing quality",
  }),
  knowledge({
    id: "reflection-minimize-plastic",
    topic: PhotographyTopic.REFLECTION,
    rule: "Minimize harsh specular on matte plastic to avoid cheap appearance",
    conditions: [cond("material", "eq", MaterialType.PLASTIC)],
    examples: [{ id: "ex-plastic-soft", description: "Diffused key reducing plastic hot spots" }],
    confidence: 0.86,
    references: [ref(KnowledgeEvidenceSource.INDUSTRIAL_DESIGN, "Industrial Design", 0.84)],
    agentIds: ["material-director", "lighting-director"],
    commercialRationale: "Harsh plastic glare reduces perceived product quality",
  }),
  knowledge({
    id: "material-glass-backlight",
    topic: PhotographyTopic.MATERIAL,
    rule: "Glass benefits from controlled backlight or edge light to define transparency",
    conditions: [cond("material", "eq", MaterialType.GLASS)],
    examples: [{ id: "ex-glass-edge", description: "Edge light defining perfume bottle contours" }],
    confidence: 0.9,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.9)],
    agentIds: ["material-director", "lighting-director"],
    commercialRationale: "Edge definition communicates transparency and premium packaging",
  }),
  knowledge({
    id: "material-fabric-soft",
    topic: PhotographyTopic.MATERIAL,
    rule: "Fabric and leather require broad soft light to reveal texture without harsh shadow",
    conditions: [cond("material", "in", [MaterialType.FABRIC, MaterialType.LEATHER])],
    examples: [{ id: "ex-fabric-wrap", description: "Large soft source on leather bag texture" }],
    confidence: 0.88,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.87)],
    agentIds: ["material-director", "lighting-director"],
    commercialRationale: "Soft wrap light reveals tactile quality that drives purchase confidence",
  }),
  knowledge({
    id: "material-wood-warm",
    topic: PhotographyTopic.MATERIAL,
    rule: "Wood surfaces benefit from warm side light emphasizing grain and craftsmanship",
    conditions: [cond("material", "eq", MaterialType.WOOD)],
    examples: [{ id: "ex-wood-grain", description: "Warm side key on wooden furniture surface" }],
    confidence: 0.87,
    references: [ref(KnowledgeEvidenceSource.EXPERT_CURATED, "Expert Curated", 0.85)],
    agentIds: ["material-director", "lighting-director"],
    commercialRationale: "Grain emphasis communicates craftsmanship and natural quality",
  }),
  knowledge({
    id: "physics-shadow-direction",
    topic: PhotographyTopic.PHYSICAL_REALISM,
    rule: "Shadow direction must match key light direction — never contradictory",
    conditions: [],
    examples: [{ id: "ex-shadow-match", description: "Left key produces shadows falling right-down" }],
    confidence: 0.97,
    references: [ref(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.95)],
    agentIds: ["lighting-director", "material-director", "camera-director"],
    commercialRationale: "Physical inconsistency instantly breaks trust in product realism",
  }),
  knowledge({
    id: "physics-scale-consistency",
    topic: PhotographyTopic.PHYSICAL_REALISM,
    rule: "Object scale and perspective must remain consistent within the scene",
    conditions: [],
    examples: [{ id: "ex-scale", description: "Product scale matches scene furniture proportions" }],
    confidence: 0.95,
    references: [ref(KnowledgeEvidenceSource.INDUSTRIAL_DESIGN, "Industrial Design", 0.9)],
    agentIds: ["camera-director", "scene-director"],
    commercialRationale: "Scale errors make products appear untrustworthy or misleading",
  }),
] as const;

export const LIGHTING_SCHEME_KNOWLEDGE: Record<
  LightingKnowledgeSchemeId,
  { applications: string[]; constraints: string[]; psychologicalEffect: string }
> = {
  [LightingKnowledgeScheme.SOFT_WINDOW]: {
    applications: ["kitchen", "home", "lifestyle"],
    constraints: ["avoid harsh midday sun", "maintain soft shadow transition"],
    psychologicalEffect: "warmth and authenticity",
  },
  [LightingKnowledgeScheme.STUDIO_SOFTBOX]: {
    applications: ["main_image", "marketplace", "white_background"],
    constraints: ["preserve highlight detail", "control shadow density"],
    psychologicalEffect: "clarity and professionalism",
  },
  [LightingKnowledgeScheme.RIM]: {
    applications: ["premium", "cutout", "glass", "metal"],
    constraints: ["rim must not overpower key", "avoid halo artifacts"],
    psychologicalEffect: "separation and premium edge definition",
  },
  [LightingKnowledgeScheme.TOP]: {
    applications: ["marketplace", "flat_lay", "tabletop"],
    constraints: ["watch for under-chin shadows on tall products"],
    psychologicalEffect: "even commercial readability",
  },
  [LightingKnowledgeScheme.BACK]: {
    applications: ["glass", "translucent", "silhouette accent"],
    constraints: ["control flare", "preserve product edge readability"],
    psychologicalEffect: "transparency and form definition",
  },
  [LightingKnowledgeScheme.THREE_POINT]: {
    applications: ["cutout", "hero", "complex_materials"],
    constraints: ["balance key fill rim ratios", "maintain product-first hierarchy"],
    psychologicalEffect: "dimensional confidence",
  },
  [LightingKnowledgeScheme.PRODUCT_TABLE]: {
    applications: ["small_products", "jewelry", "cosmetics"],
    constraints: ["even table bounce", "minimal reflection hotspots"],
    psychologicalEffect: "precision and craft",
  },
};

export const LENS_KNOWLEDGE: Record<LensProfileId, { perception: string; bestFor: string[] }> = {
  [LensProfile.MM_35]: { perception: "dynamic perspective", bestFor: ["lifestyle", "sports", "contextual"] },
  [LensProfile.MM_50]: { perception: "natural human-eye view", bestFor: ["general", "consumer", "catalog"] },
  [LensProfile.MM_85]: { perception: "premium product compression", bestFor: ["luxury", "cosmetics", "hero"] },
  [LensProfile.MACRO_100]: { perception: "texture and detail revelation", bestFor: ["beauty", "leather", "material"] },
};

export const MATERIAL_LIGHTING_MAP: Record<MaterialTypeId, string> = {
  [MaterialType.GLASS]: "controlled backlight or edge light",
  [MaterialType.METAL]: "strip softbox with controlled specular",
  [MaterialType.PLASTIC]: "diffused key minimizing hot spots",
  [MaterialType.WOOD]: "warm side light emphasizing grain",
  [MaterialType.FABRIC]: "broad soft wrap light",
  [MaterialType.CERAMIC]: "soft top key with gentle fill",
  [MaterialType.LEATHER]: "broad soft light revealing texture",
};

function violation(
  code: PhotographyKnowledgeViolation["code"],
  message: string,
  knowledgeId?: string,
): PhotographyKnowledgeViolation {
  return { code, message, knowledgeId };
}

function evaluateCondition(
  condition: PhotographyCondition,
  ctx: Record<string, string | undefined>,
): boolean {
  const actual = ctx[condition.field]?.toLowerCase();
  if (!actual) return false;
  if (condition.operator === "eq") {
    return actual === String(condition.value).toLowerCase();
  }
  const values = Array.isArray(condition.value) ? condition.value : [condition.value];
  return values.map((v) => v.toLowerCase()).includes(actual);
}

export function getPhotographyKnowledge(id: string): PhotographyKnowledge | undefined {
  return SEED_PHOTOGRAPHY_KNOWLEDGE.find((k) => k.id === id);
}

export function getPhotographyKnowledgeByTopic(topic: PhotographyTopicId): PhotographyKnowledge[] {
  return SEED_PHOTOGRAPHY_KNOWLEDGE.filter((k) => k.topic === topic);
}

export function matchPhotographyKnowledge(
  ctx: Record<string, string | undefined>,
): PhotographyKnowledge[] {
  return SEED_PHOTOGRAPHY_KNOWLEDGE.filter((k) => {
    if (k.conditions.length === 0) return true;
    return k.conditions.every((c) => evaluateCondition(c, ctx));
  });
}

export function recommendPhotographyKnowledge(
  ctx: PhotographySelectionContext,
): PhotographyKnowledge[] {
  const map: Record<string, string | undefined> = {
    category: ctx.category,
    styleId: ctx.styleId,
    storyType: ctx.storyType,
    material: ctx.material,
    productGoal: ctx.productGoal,
    marketplace: ctx.marketplace,
  };
  const matched = matchPhotographyKnowledge(map);
  const universal = SEED_PHOTOGRAPHY_KNOWLEDGE.filter((k) => k.conditions.length === 0);
  const combined = [...new Map([...matched, ...universal].map((k) => [k.id, k])).values()];
  return combined.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

export function getLensRecommendation(ctx: PhotographySelectionContext): LensProfileId {
  if (ctx.styleId && ["luxury", "premium", "minimal-luxury"].includes(ctx.styleId)) {
    return LensProfile.MM_85;
  }
  if (ctx.category && ["beauty", "cosmetics", ProductCategoryKnowledge.BEAUTY].includes(ctx.category)) {
    return LensProfile.MACRO_100;
  }
  if (ctx.storyType === "lifestyle" || ctx.storyType === "sports") {
    return LensProfile.MM_35;
  }
  return LensProfile.MM_50;
}

export function getMaterialLightingAdvice(material: MaterialTypeId): string {
  return MATERIAL_LIGHTING_MAP[material];
}

function shadowMatchesLight(light: string, shadow: string): boolean {
  const pairs: Record<string, string> = {
    left: "right",
    right: "left",
    top: "bottom",
    front: "back",
  };
  for (const [lightDir, shadowDir] of Object.entries(pairs)) {
    if (light.includes(lightDir) && !shadow.includes(shadowDir)) return false;
  }
  return true;
}

export function validatePhotographyBlueprint(
  check: PhotographyBlueprintCheck,
): PhotographyBlueprintValidation {
  const violations: PhotographyConsistencyViolation[] = [];

  if (check.primarySubject && check.primarySubject !== "product" && check.storyFocus === "product") {
    violations.push({
      aspect: "product_first",
      message: "Photography must not overshadow product — Product > Photography",
      agents: ["commercial-photo-director", "lighting-director"],
    });
  }

  if (
    check.lightDirection &&
    check.shadowDirection &&
    !shadowMatchesLight(check.lightDirection, check.shadowDirection)
  ) {
    violations.push({
      aspect: "physical_realism",
      message: "Shadow direction contradicts key light direction",
      agents: ["lighting-director", "material-director"],
    });
  }

  if (check.material === MaterialType.METAL && check.reflections === "random_blown") {
    violations.push({
      aspect: "reflection",
      message: "Metal requires controlled specular highlights, not random blown reflections",
      agents: ["material-director", "lighting-director"],
    });
  }

  if (check.material === MaterialType.GLASS && check.lighting === "flat_front_only") {
    violations.push({
      aspect: "material_lighting",
      message: "Glass requires edge or backlight definition for transparency",
      agents: ["material-director", "lighting-director"],
    });
  }

  if (check.storyType === "technical" && check.depthOfField === "shallow_bokeh") {
    violations.push({
      aspect: "depth_of_field",
      message: "Technical story requires deep focus, not shallow bokeh",
      agents: ["camera-director"],
    });
  }

  if (check.perspective === "low_power" && check.storyFocus === "compact_portability") {
    violations.push({
      aspect: "perspective_story",
      message: "Low power perspective contradicts compact portability story",
      agents: ["camera-director", "scene-director"],
    });
  }

  if (check.physicsViolations && check.physicsViolations.length > 0) {
    violations.push({
      aspect: "physical_realism",
      message: `Physics violations: ${check.physicsViolations.join(", ")}`,
      agents: ["lighting-director", "camera-director", "material-director"],
    });
  }

  return {
    valid: violations.length === 0,
    violations,
    retryRecommended: violations.length > 0,
    explainable: violations.every((v) => v.message.length > 0),
  };
}

export function applyPhotographyLearningFeedback(
  items: PhotographyKnowledge[],
  feedback: { knowledgeId: string; visionScore?: number; commercialScore?: number },
): PhotographyKnowledge[] {
  return items.map((k) => {
    if (k.id !== feedback.knowledgeId) return k;
    let delta = 0;
    if (feedback.visionScore !== undefined) delta += (feedback.visionScore - 0.5) * 0.05;
    if (feedback.commercialScore !== undefined) delta += (feedback.commercialScore - 0.5) * 0.08;
    return { ...k, confidence: Math.max(0, Math.min(1, k.confidence + delta)) };
  });
}

export function validatePhotographyKnowledge(
  ctx: PhotographyKnowledgeContext = {},
): PhotographyKnowledgeReport {
  const violations: PhotographyKnowledgeViolation[] = [];

  if (ctx.randomLighting) {
    violations.push(violation("RANDOM_LIGHTING_SELECTION", "Lighting must not be selected randomly"));
  }
  if (ctx.physicsViolation) {
    violations.push(violation("PHYSICS_VIOLATION", "Photography must obey physical laws"));
  }
  if (ctx.perspectiveStoryMismatch) {
    violations.push(violation("PERSPECTIVE_STORY_MISMATCH", "Perspective must align with story"));
  }
  if (ctx.materialLightingDisconnect) {
    violations.push(violation("MATERIAL_LIGHTING_DISCONNECT", "Material and lighting must be linked"));
  }
  if (ctx.unexplainedDecision) {
    violations.push(violation("UNEXPLAINED_PHOTOGRAPHY_DECISION", "Every photographic decision must be explainable"));
  }

  const productFirst = getPhotographyKnowledge("product-first");
  if (!productFirst) {
    violations.push(violation("PRODUCT_NOT_FIRST", "Product-first principle must exist"));
  }

  for (const k of SEED_PHOTOGRAPHY_KNOWLEDGE) {
    if (!k.commercialRationale || k.commercialRationale.length < 10) {
      violations.push(
        violation("UNEXPLAINED_PHOTOGRAPHY_DECISION", `Missing commercial rationale: ${k.id}`, k.id),
      );
    }
  }

  const luxuryCtx = recommendPhotographyKnowledge({ styleId: "luxury", category: ProductCategoryKnowledge.BEAUTY });
  const technicalCtx = recommendPhotographyKnowledge({
    category: ProductCategoryKnowledge.ELECTRONICS,
    storyType: "technical",
  });
  const luxuryIds = luxuryCtx.map((k) => k.id).sort().join(",");
  const technicalIds = technicalCtx.map((k) => k.id).sort().join(",");
  if (luxuryIds === technicalIds) {
    violations.push(
      violation("RANDOM_LIGHTING_SELECTION", "Different contexts must produce different knowledge matches"),
    );
  }

  const luxuryLens = getLensRecommendation({ styleId: "luxury" });
  const lifestyleLens = getLensRecommendation({ storyType: "lifestyle" });
  if (luxuryLens === lifestyleLens) {
    violations.push(violation("RANDOM_LIGHTING_SELECTION", "Lens recommendation must vary by context"));
  }

  const validBlueprint = validatePhotographyBlueprint({
    primarySubject: "product",
    storyFocus: "product",
    lightDirection: "left",
    shadowDirection: "right",
    material: MaterialType.METAL,
    reflections: "controlled_specular",
  });
  if (!validBlueprint.valid) {
    violations.push(violation("PHOTOGRAPHY_INCONSISTENCY", "Valid photography blueprint must pass validation"));
  }

  const invalidBlueprint = validatePhotographyBlueprint({
    primarySubject: "background_art",
    storyFocus: "product",
    lightDirection: "left",
    shadowDirection: "left",
    material: MaterialType.GLASS,
    lighting: "flat_front_only",
    physicsViolations: ["impossible_reflection"],
  });
  if (invalidBlueprint.valid || !invalidBlueprint.retryRecommended) {
    violations.push(violation("PHOTOGRAPHY_INCONSISTENCY", "Invalid photography must trigger retry"));
  }

  if (!MATERIAL_LIGHTING_MAP[MaterialType.GLASS].includes("backlight")) {
    violations.push(violation("MATERIAL_LIGHTING_DISCONNECT", "Glass material must have lighting guidance"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    knowledge: [...SEED_PHOTOGRAPHY_KNOWLEDGE],
    topics: Object.values(PhotographyTopic),
    goldenRuleSatisfied: unique.length === 0,
    productFirst: Boolean(productFirst),
    physicallyRealistic: SEED_PHOTOGRAPHY_KNOWLEDGE.some((k) => k.id === "physics-shadow-direction"),
    evolutionReady: true,
  };
}

export function assertPhotographyKnowledge(
  ctx?: PhotographyKnowledgeContext,
): PhotographyKnowledgeReport {
  const report = validatePhotographyKnowledge(ctx);
  if (!report.valid) {
    throw new Error(
      `Photography knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runPhotographyKnowledge(input: {
  ctx?: PhotographyKnowledgeContext;
}): PhotographyKnowledgeReport {
  return validatePhotographyKnowledge(input.ctx);
}

export function isPhotographyKnowledgeFailure(code: string): code is PhotographyKnowledgeFailureCode {
  return [
    "RANDOM_LIGHTING_SELECTION",
    "PHYSICS_VIOLATION",
    "PERSPECTIVE_STORY_MISMATCH",
    "MATERIAL_LIGHTING_DISCONNECT",
    "UNEXPLAINED_PHOTOGRAPHY_DECISION",
    "PRODUCT_NOT_FIRST",
    "PHOTOGRAPHY_INCONSISTENCY",
    "UNKNOWN_KNOWLEDGE",
  ].includes(code);
}

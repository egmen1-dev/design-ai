/**
 * Chapter 4.16 — Material Director engine.
 * Designs physically plausible environment materials from Camera + Lighting + Scene — never light, camera, or prompt.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentDecisionSession, pickBestAlternative, scoreAlternative } from "./agent-decision-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { buildAgentMemoryPackage } from "./agent-memory-engine";
import { confidenceFromContext } from "./agent-confidence-engine";
import type { MaterialBlueprint, MaterialReflectionId } from "./types";
import { updatesToMutations } from "./universal-agent-bridge";
import type { BlueprintMutation } from "./mutation-types";
import { PhotographyStyle } from "./commercial-photo-director-types";
import { LightingScheme } from "./lighting-director-types";
import { CameraStyle } from "./camera-director-types";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import {
  BackgroundMaterial,
  ContactSurface,
  MaterialWorld,
  MicroDetailLevel,
  ReflectionProfile,
  RoughnessProfile,
  SurfaceMaterialId,
  TextureComplexity,
  type MaterialDirectorContext,
  type MaterialExplainabilityReport,
  type MaterialFailureCode,
  type MaterialSection,
  type MaterialValidationReport,
  type MaterialWorldDefinition,
  type MaterialWorldId,
  type SurfaceMaterial,
} from "./material-director-types";

export {
  SurfaceMaterialId,
  ReflectionProfile,
  RoughnessProfile,
  BackgroundMaterial,
  ContactSurface,
  TextureComplexity,
  MicroDetailLevel,
  MaterialWorld,
  type SurfaceMaterialKind,
  type SurfaceMaterial,
  type ReflectionProfileId,
  type RoughnessProfileId,
  type BackgroundMaterialId,
  type ContactSurfaceId,
  type TextureComplexityId,
  type MicroDetailLevelId,
  type MaterialWorldId,
  type MaterialWorldDefinition,
  type MaterialSection,
  type MaterialDirectorContext,
  type MaterialExplainabilityReport,
  type MaterialValidationReport,
  type MaterialFailureCode,
} from "./material-director-types";

export const MATERIAL_DIRECTOR_VERSION = "4.16.0";

export const MATERIAL_DIRECTOR_GOLDEN_RULE =
  "Material Director does not make the background beautiful — it makes the surrounding world physically convincing. " +
  "The buyer should subconsciously feel the product exists in real space.";

export const MATERIAL_DIRECTOR_ID: AgentContractId = "material-director";

export const MATERIAL_DIRECTOR_PIPELINE_POSITION = [
  "camera-director",
  MATERIAL_DIRECTOR_ID,
  "render-pipeline",
] as const;

export const MATERIAL_WORLD_CATALOG: readonly MaterialWorldDefinition[] = [
  { id: MaterialWorld.LUXURY_INTERIOR, name: "Luxury Interior", summary: "Marble, brass, dark wood — premium cohesion" },
  { id: MaterialWorld.MINIMAL_STUDIO, name: "Minimal Studio", summary: "Concrete, oak, white plaster — clean minimal" },
  { id: MaterialWorld.MODERN_DOMESTIC, name: "Modern Domestic", summary: "Oak, ceramic, linen — home lifestyle" },
  { id: MaterialWorld.TECHNOLOGY_LAB, name: "Technology Lab", summary: "Brushed steel, glass, matte plastic" },
  { id: MaterialWorld.MARKETPLACE_NEUTRAL, name: "Marketplace Neutral", summary: "Matte surfaces for cutout integration" },
  { id: MaterialWorld.NATURAL_WARM, name: "Natural Warm", summary: "Oak, stone, linen — trust and comfort" },
] as const;

const PROMPT_KEYWORDS = /\b(prompt|negative prompt|render prompt|cinematic)\b/i;
const LIGHTING_KEYWORDS = /\b(key light|fill light|rim light|softbox|kelvin|color temperature)\b/i;
const COMPOSITION_KEYWORDS = /\b(headline area|badge area|template layout|white space zone)\b/i;
const ARTIFICIAL_KEYWORDS = /\b(mirror room|chrome palace|holographic|neon surface|impossible glass maze)\b/i;

function worldAlternatives(ctx: MaterialDirectorContext): MaterialWorldId[] {
  const story = ctx.storyType;
  const photo = ctx.photographyStyle;

  if (ctx.productCutout) {
    return [MaterialWorld.MARKETPLACE_NEUTRAL, MaterialWorld.MINIMAL_STUDIO, MaterialWorld.MODERN_DOMESTIC];
  }

  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY || photo === PhotographyStyle.LUXURY_ADVERTISING) {
    return [MaterialWorld.LUXURY_INTERIOR, MaterialWorld.MINIMAL_STUDIO, MaterialWorld.MODERN_DOMESTIC];
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION || photo === PhotographyStyle.TECHNOLOGY_PRODUCT) {
    return [MaterialWorld.TECHNOLOGY_LAB, MaterialWorld.MINIMAL_STUDIO, MaterialWorld.MARKETPLACE_NEUTRAL];
  }
  if (story === StoryType.SAFETY || story === StoryType.FAMILY || story === StoryType.HEALTH) {
    return [MaterialWorld.NATURAL_WARM, MaterialWorld.MODERN_DOMESTIC, MaterialWorld.MARKETPLACE_NEUTRAL];
  }
  if (ctx.sceneType === SceneType.LUXURY) {
    return [MaterialWorld.LUXURY_INTERIOR, MaterialWorld.MINIMAL_STUDIO, MaterialWorld.MODERN_DOMESTIC];
  }
  if (ctx.marketplace === "WB" || photo === PhotographyStyle.MODERN_MARKETPLACE) {
    return [MaterialWorld.MARKETPLACE_NEUTRAL, MaterialWorld.MINIMAL_STUDIO, MaterialWorld.MODERN_DOMESTIC];
  }
  return [MaterialWorld.MINIMAL_STUDIO, MaterialWorld.MARKETPLACE_NEUTRAL, MaterialWorld.MODERN_DOMESTIC];
}

function selectWorld(ctx: MaterialDirectorContext): {
  selected: MaterialWorldId;
  alternatives: MaterialWorldId[];
  rejected: { id: MaterialWorldId; reason: string }[];
} {
  const alternatives = worldAlternatives(ctx);
  const scores = alternatives.map((id, index) => ({
    id,
    score:
      id === MaterialWorld.MARKETPLACE_NEUTRAL && (ctx.marketplace === "WB" || ctx.productCutout)
        ? 0.92
        : id === MaterialWorld.LUXURY_INTERIOR &&
            (ctx.storyType === StoryType.PREMIUM_LIFESTYLE || ctx.primaryEmotion === "luxury")
          ? 0.9
          : id === MaterialWorld.TECHNOLOGY_LAB && ctx.photographyStyle === PhotographyStyle.TECHNOLOGY_PRODUCT
            ? 0.88
            : id === MaterialWorld.NATURAL_WARM &&
                (ctx.storyType === StoryType.SAFETY || ctx.storyType === StoryType.FAMILY)
              ? 0.87
              : 0.82 - index * 0.06,
  }));
  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0].id;
  const rejected = scores.slice(1).map((s) => ({
    id: s.id,
    reason: `Lower material fit for scene ${ctx.sceneType ?? "generic"} and story ${ctx.storyType ?? "generic"}`,
  }));
  return { selected, alternatives, rejected };
}

type WorldParams = Pick<
  MaterialSection,
  | "surfacePalette"
  | "reflectionProfile"
  | "roughnessProfile"
  | "backgroundMaterial"
  | "contactSurface"
  | "textureComplexity"
  | "microDetailLevel"
>;

function surface(id: SurfaceMaterial["id"], role: SurfaceMaterial["role"], finish: string): SurfaceMaterial {
  return { id, role, finish };
}

function paramsForWorld(world: MaterialWorldId): WorldParams {
  switch (world) {
    case MaterialWorld.LUXURY_INTERIOR:
      return {
        surfacePalette: [
          surface(SurfaceMaterialId.WHITE_MARBLE, "floor", "polished matte marble"),
          surface(SurfaceMaterialId.WALNUT, "wall", "dark walnut panel"),
          surface(SurfaceMaterialId.BRASS, "accent", "brushed brass trim"),
        ],
        reflectionProfile: ReflectionProfile.SOFT_SATIN,
        roughnessProfile: RoughnessProfile.SMOOTH,
        backgroundMaterial: BackgroundMaterial.MARBLE_WALL,
        contactSurface: ContactSurface.STONE_COUNTERTOP,
        textureComplexity: TextureComplexity.STANDARD,
        microDetailLevel: MicroDetailLevel.STONE_VEINS,
      };
    case MaterialWorld.TECHNOLOGY_LAB:
      return {
        surfacePalette: [
          surface(SurfaceMaterialId.BRUSHED_STEEL, "floor", "brushed steel platform"),
          surface(SurfaceMaterialId.MATTE_PLASTIC, "wall", "matte neutral panel"),
          surface(SurfaceMaterialId.GLASS, "accent", "clear low-reflection glass"),
        ],
        reflectionProfile: ReflectionProfile.SEMI_GLOSS,
        roughnessProfile: RoughnessProfile.VERY_SMOOTH,
        backgroundMaterial: BackgroundMaterial.TECH_PANEL,
        contactSurface: ContactSurface.STUDIO_FLOOR,
        textureComplexity: TextureComplexity.STANDARD,
        microDetailLevel: MicroDetailLevel.BRUSHED_METAL,
      };
    case MaterialWorld.MODERN_DOMESTIC:
      return {
        surfacePalette: [
          surface(SurfaceMaterialId.OAK, "floor", "natural matte oak"),
          surface(SurfaceMaterialId.CERAMIC, "accent", "matte ceramic"),
          surface(SurfaceMaterialId.LINEN, "decor", "soft neutral linen"),
        ],
        reflectionProfile: ReflectionProfile.MATTE,
        roughnessProfile: RoughnessProfile.NATURAL,
        backgroundMaterial: BackgroundMaterial.WOOD_PANEL,
        contactSurface: ContactSurface.WOOD_TABLE,
        textureComplexity: TextureComplexity.STANDARD,
        microDetailLevel: MicroDetailLevel.WOOD_GRAIN,
      };
    case MaterialWorld.NATURAL_WARM:
      return {
        surfacePalette: [
          surface(SurfaceMaterialId.OAK, "floor", "warm natural oak"),
          surface(SurfaceMaterialId.STONE, "wall", "soft limestone"),
          surface(SurfaceMaterialId.LINEN, "decor", "woven linen"),
        ],
        reflectionProfile: ReflectionProfile.MATTE,
        roughnessProfile: RoughnessProfile.TEXTURED,
        backgroundMaterial: BackgroundMaterial.NEUTRAL_FABRIC,
        contactSurface: ContactSurface.FABRIC,
        textureComplexity: TextureComplexity.STANDARD,
        microDetailLevel: MicroDetailLevel.FABRIC_FIBERS,
      };
    case MaterialWorld.MARKETPLACE_NEUTRAL:
      return {
        surfacePalette: [
          surface(SurfaceMaterialId.CONCRETE, "floor", "matte light concrete"),
          surface(SurfaceMaterialId.MATTE_PLASTIC, "wall", "neutral matte backdrop"),
        ],
        reflectionProfile: ReflectionProfile.MATTE,
        roughnessProfile: RoughnessProfile.SMOOTH,
        backgroundMaterial: BackgroundMaterial.STUDIO_PLASTER,
        contactSurface: ContactSurface.STUDIO_FLOOR,
        textureComplexity: TextureComplexity.MINIMAL,
        microDetailLevel: MicroDetailLevel.NONE,
      };
    default:
      return {
        surfacePalette: [
          surface(SurfaceMaterialId.CONCRETE, "floor", "matte concrete"),
          surface(SurfaceMaterialId.OAK, "wall", "light oak"),
          surface(SurfaceMaterialId.WHITE_PLASTER, "accent", "matte white plaster"),
        ],
        reflectionProfile: ReflectionProfile.MATTE,
        roughnessProfile: RoughnessProfile.NATURAL,
        backgroundMaterial: BackgroundMaterial.CONCRETE_WALL,
        contactSurface: ContactSurface.STUDIO_FLOOR,
        textureComplexity: TextureComplexity.STANDARD,
        microDetailLevel: MicroDetailLevel.NONE,
      };
  }
}

function refineParams(params: WorldParams, ctx: MaterialDirectorContext): WorldParams {
  const refined = { ...params, surfacePalette: [...params.surfacePalette] };

  if (ctx.sceneMaterialPalette?.length) {
    const mapped = ctx.sceneMaterialPalette.slice(0, 3).map((name, index) => {
      const roles: SurfaceMaterial["role"][] = ["floor", "wall", "accent"];
      const id = name.toLowerCase().includes("marble")
        ? SurfaceMaterialId.WHITE_MARBLE
        : name.toLowerCase().includes("steel")
          ? SurfaceMaterialId.BRUSHED_STEEL
          : name.toLowerCase().includes("glass")
            ? SurfaceMaterialId.GLASS
            : name.toLowerCase().includes("ceramic")
              ? SurfaceMaterialId.CERAMIC
              : name.toLowerCase().includes("linen") || name.toLowerCase().includes("fabric")
                ? SurfaceMaterialId.LINEN
                : name.toLowerCase().includes("stone")
                  ? SurfaceMaterialId.STONE
                  : name.toLowerCase().includes("oak") || name.toLowerCase().includes("wood")
                    ? SurfaceMaterialId.OAK
                    : SurfaceMaterialId.MATTE_PLASTIC;
      return surface(id, roles[index] ?? "decor", `matte ${name}`);
    });
    if (mapped.length >= 2) {
      refined.surfacePalette = mapped;
    }
  }

  if (ctx.productCutout) {
    refined.reflectionProfile = ReflectionProfile.MATTE;
    refined.contactSurface = ContactSurface.STUDIO_FLOOR;
    if (refined.textureComplexity === TextureComplexity.RICH) {
      refined.textureComplexity = TextureComplexity.STANDARD;
    }
  }

  if (ctx.materialIntent?.toLowerCase().includes("contact")) {
    refined.contactSurface = ContactSurface.WOOD_TABLE;
    refined.roughnessProfile = RoughnessProfile.NATURAL;
  }

  if (ctx.lightingScheme === LightingScheme.LUXURY_SIDE_LIGHT) {
    refined.reflectionProfile = ReflectionProfile.SOFT_SATIN;
  }

  if (ctx.cameraStyle === CameraStyle.MACRO_DETAIL) {
    refined.microDetailLevel = MicroDetailLevel.CERAMIC_SURFACE;
    refined.textureComplexity = TextureComplexity.MINIMAL;
  }

  refined.textureComplexity =
    refined.surfacePalette.length <= 2
      ? TextureComplexity.MINIMAL
      : refined.surfacePalette.length <= 3
        ? TextureComplexity.STANDARD
        : TextureComplexity.RICH;

  return refined;
}

function legacyReflection(profile: ReflectionProfileId): MaterialReflectionId {
  if (profile === ReflectionProfile.MATTE) return "none";
  if (profile === ReflectionProfile.SOFT_SATIN) return "soft";
  return "medium";
}

function legacyRoughness(profile: RoughnessProfileId): number {
  switch (profile) {
    case RoughnessProfile.VERY_SMOOTH:
      return 0.15;
    case RoughnessProfile.SMOOTH:
      return 0.3;
    case RoughnessProfile.NATURAL:
      return 0.45;
    case RoughnessProfile.TEXTURED:
      return 0.6;
    default:
      return 0.75;
  }
}

function legacyFloor(params: WorldParams): string {
  const floor = params.surfacePalette.find((s) => s.role === "floor");
  return floor?.finish ?? "matte concrete floor";
}

function legacyWalls(params: WorldParams): string {
  const wall = params.surfacePalette.find((s) => s.role === "wall");
  return wall?.finish ?? "neutral matte plaster walls";
}

function legacyDecor(params: WorldParams): string[] {
  return params.surfacePalette
    .filter((s) => s.role === "accent" || s.role === "decor")
    .map((s) => s.finish);
}

function toLegacyBlueprint(params: WorldParams, world: MaterialWorldId): MaterialBlueprint {
  return {
    floor: legacyFloor(params),
    walls: legacyWalls(params),
    decor: legacyDecor(params),
    reflection: legacyReflection(params.reflectionProfile),
    roughness: legacyRoughness(params.roughnessProfile),
    materialWorld: world,
    surfacePalette: params.surfacePalette,
    reflectionProfile: params.reflectionProfile,
    roughnessProfile: params.roughnessProfile,
    backgroundMaterial: params.backgroundMaterial,
    contactSurface: params.contactSurface,
    textureComplexity: params.textureComplexity,
    microDetailLevel: params.microDetailLevel,
    providerHints: [],
  };
}

function providerHintsFor(world: MaterialWorldId, params: WorldParams, providerId?: string): string[] {
  const base = [
    "limited surface palette for stable generation",
    "physically plausible matte or soft satin finishes",
    "materials support product — never compete with hero",
    "avoid mirror rooms and procedural texture overload",
  ];
  if (world === MaterialWorld.MARKETPLACE_NEUTRAL) {
    base.push("matte contact surface for cutout compositing");
  }
  if (params.textureComplexity === TextureComplexity.MINIMAL) {
    base.push("1–2 dominant materials only");
  }
  if (providerId === "flux" || !providerId) {
    return [...base, "FLUX: simple physically readable surfaces", "no extreme gloss or complex glass structures"];
  }
  return base;
}

export function buildMaterialSection(
  ctx: MaterialDirectorContext,
  confidence: number,
): { section: MaterialSection; explainability: MaterialExplainabilityReport } {
  const { selected, alternatives, rejected } = selectWorld(ctx);
  const params = refineParams(paramsForWorld(selected), ctx);
  const hints = providerHintsFor(selected, params, ctx.providerId);
  const materialBlueprint = { ...toLegacyBlueprint(params, selected), providerHints: hints };

  const section: MaterialSection = {
    materialWorld: selected,
    surfacePalette: params.surfacePalette,
    reflectionProfile: params.reflectionProfile,
    roughnessProfile: params.roughnessProfile,
    backgroundMaterial: params.backgroundMaterial,
    contactSurface: params.contactSurface,
    textureComplexity: params.textureComplexity,
    microDetailLevel: params.microDetailLevel,
    providerHints: hints,
    materialBlueprint,
    confidence,
  };

  const explainability: MaterialExplainabilityReport = {
    agentId: MATERIAL_DIRECTOR_ID,
    selectedWorld: selected,
    alternativesConsidered: alternatives,
    rejectedAlternatives: rejected,
    storyInfluences: [
      ctx.storyType ? `Story type: ${ctx.storyType}` : "",
      ctx.primaryEmotion ? `Primary emotion: ${ctx.primaryEmotion}` : "",
    ].filter(Boolean),
    sceneInfluences: [
      ctx.sceneType ? `Scene type: ${ctx.sceneType}` : "",
      ctx.sceneMaterialPalette?.length ? `Scene palette: ${ctx.sceneMaterialPalette.join(", ")}` : "",
    ].filter(Boolean),
    photographyInfluences: [
      ctx.photographyStyle ? `Photography style: ${ctx.photographyStyle}` : "",
      ctx.materialIntent ? `Material intent: ${ctx.materialIntent.slice(0, 60)}` : "",
    ].filter(Boolean),
    lightingInfluences: [
      ctx.lightingScheme ? `Lighting scheme: ${ctx.lightingScheme}` : "",
      ctx.lightingStyle ? `Lighting style: ${ctx.lightingStyle}` : "",
    ].filter(Boolean),
    commercialValue: "Physically convincing environment that anchors the product without visual competition",
    reasoning: [
      `World ${selected} chosen from scene and photography — physics-first, not decorative`,
      `Surface palette (${params.surfacePalette.length} materials) stays within ${params.textureComplexity} complexity`,
      `Reflection ${params.reflectionProfile} integrates with lighting without stealing attention`,
      `Contact surface ${params.contactSurface} supports realistic product placement`,
      `Micro detail ${params.microDetailLevel} visible only at close inspection`,
      `Roughness ${params.roughnessProfile} matches lighting shadow behavior`,
    ],
  };

  return { section, explainability };
}

export function validateMaterialSection(
  section: MaterialSection,
  ctx: MaterialDirectorContext,
): MaterialValidationReport {
  const violations: string[] = [];
  const text = section.providerHints.join(" ");

  if (!ctx.cameraStyle && !ctx.photographyStyle) {
    violations.push("MISSING_CAMERA_INPUT");
  }
  if (PROMPT_KEYWORDS.test(text)) violations.push("CONTAINS_PROMPT");
  if (LIGHTING_KEYWORDS.test(text)) violations.push("CONTAINS_LIGHTING_DECISION");
  if (COMPOSITION_KEYWORDS.test(text)) violations.push("COMPOSITION_VIOLATION");
  if (ARTIFICIAL_KEYWORDS.test(text)) violations.push("ARTIFICIAL_ENVIRONMENT");

  if (section.surfacePalette.length > 4) {
    violations.push("TOO_MANY_SURFACES");
  }

  if (
    (section.reflectionProfile === ReflectionProfile.HIGH_GLOSS ||
      section.reflectionProfile === ReflectionProfile.MIRROR) &&
    (ctx.marketplace === "WB" || ctx.productCutout)
  ) {
    violations.push("DISTRACTING_MATERIALS");
  }

  if (
    ctx.productCutout &&
    section.contactSurface === ContactSurface.GLASS_SURFACE
  ) {
    violations.push("CUTOUT_INCOMPATIBLE");
  }

  if (
    ctx.storyType === StoryType.PREMIUM_LIFESTYLE &&
    section.materialWorld === MaterialWorld.TECHNOLOGY_LAB &&
    section.surfacePalette.some((s) => s.id === SurfaceMaterialId.BRUSHED_STEEL)
  ) {
    violations.push("STORY_CONFLICT");
  }

  return { valid: violations.length === 0, violations, section };
}

export function isMaterialFailure(code: string): code is MaterialFailureCode {
  return [
    "STORY_CONFLICT",
    "TOO_MANY_SURFACES",
    "DISTRACTING_MATERIALS",
    "ARTIFICIAL_ENVIRONMENT",
    "MISSING_CAMERA_INPUT",
    "CONTAINS_LIGHTING_DECISION",
    "CONTAINS_PROMPT",
    "COMPOSITION_VIOLATION",
    "CUTOUT_INCOMPATIBLE",
  ].includes(code);
}

export function materialSectionToMutations(
  section: MaterialSection,
  revision: number,
  reason: string,
): BlueprintMutation[] {
  return updatesToMutations(
    { materials: section.materialBlueprint },
    MATERIAL_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function runMaterialDirector(input: {
  context: AgentContextPackage;
  directorContext: MaterialDirectorContext;
}): {
  section: MaterialSection;
  explainability: MaterialExplainabilityReport;
  confidence: ReturnType<typeof confidenceFromContext>;
  decisionSession: AgentDecisionSession;
  mutations: BlueprintMutation[];
} {
  const memory = buildAgentMemoryPackage({
    agentId: MATERIAL_DIRECTOR_ID,
    working: input.context,
  });

  const worldAlts = worldAlternatives(input.directorContext);
  const alternatives = worldAlts.map((id) => {
    const def = MATERIAL_WORLD_CATALOG.find((d) => d.id === id);
    return {
      id,
      label: def?.name ?? id,
      summary: def?.summary ?? `Material: ${id}`,
      scores: {},
    };
  });

  const evaluations = worldAlts.map((id, index) => ({
    alternativeId: id,
    scores: scoreAlternative([`material world ${id}`], 0.82 - index * 0.07),
    weightedTotal: 0.82 - index * 0.07,
    notes: [`Evaluated material world ${id}`],
  }));

  const selectedAlternative = pickBestAlternative(alternatives, evaluations);
  const confidence = confidenceFromContext({
    agentId: MATERIAL_DIRECTOR_ID,
    context: input.context,
    evaluations,
    knowledgeAligned: true,
    reasoningSteps: 5,
    constraintsSatisfied: 5,
    constraintsTotal: 5,
  });

  const { section, explainability } = buildMaterialSection(
    input.directorContext,
    confidence.value,
  );

  const decisionSession = new AgentDecisionSession(MATERIAL_DIRECTOR_ID)
    .observeFromContext(input.context, memory)
    .interpret([
      `Scene: ${input.directorContext.sceneType ?? "pending"}`,
      `Lighting: ${input.directorContext.lightingScheme ?? "pending"}`,
      `Camera: ${input.directorContext.cameraStyle ?? "pending"}`,
      `Cutout: ${input.directorContext.productCutout}`,
    ])
    .reason(explainability.reasoning)
    .compare(alternatives)
    .evaluate(
      alternatives.map((alt, index) => ({
        alternativeId: alt.id,
        scores: scoreAlternative([alt.summary], 0.76 - index * 0.05),
        weightedTotal: 0.76 - index * 0.05,
        notes: [alt.summary],
      })),
    )
    .decide(selectedAlternative, confidence.value)
    .explain([
      ...explainability.reasoning,
      `Rejected: ${explainability.rejectedAlternatives.map((r) => r.id).join(", ")}`,
      `Commercial value: ${explainability.commercialValue}`,
    ]);

  const mutations = materialSectionToMutations(
    section,
    input.context.blueprint.meta.revision ?? 0,
    explainability.reasoning.join("; "),
  );

  decisionSession.publish(mutations);

  return { section, explainability, confidence, decisionSession, mutations };
}

export function directorContextFromBlueprint(
  blueprint: import("./types").RenderBlueprint,
): MaterialDirectorContext {
  return {
    productCategory: blueprint.product.category,
    marketplace: blueprint.creative.marketplace,
    productCutout: blueprint.product.cutout,
    storyType: blueprint.story.storyType,
    primaryEmotion: blueprint.story.primaryEmotion,
    sceneType: blueprint.scene.sceneType,
    sceneMaterialPalette: blueprint.scene.materialPalette,
    photographyStyle: blueprint.photography.photographyStyle,
    materialIntent: blueprint.photography.materialIntent,
    lightingScheme: blueprint.lighting.lightingScheme,
    lightingStyle: blueprint.lighting.lightingStyle,
    cameraStyle: blueprint.camera.cameraStyle,
    cameraDistance: blueprint.camera.distance,
    providerId: blueprint.meta.generator,
  };
}

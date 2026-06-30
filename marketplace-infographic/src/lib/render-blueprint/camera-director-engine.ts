/**
 * Chapter 4.15 — Camera Director engine.
 * Designs virtual camera viewpoint from Lighting + Photography + Composition — never light, materials, or prompt.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentDecisionSession, pickBestAlternative, scoreAlternative } from "./agent-decision-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { buildAgentMemoryPackage } from "./agent-memory-engine";
import { confidenceFromContext } from "./agent-confidence-engine";
import type {
  CameraAngleId,
  CameraBlueprint,
  CameraDistanceId,
  CameraHeightId,
  CameraLensId,
  CameraPerspectiveId,
} from "./types";
import { updatesToMutations } from "./universal-agent-bridge";
import type { BlueprintMutation } from "./mutation-types";
import { PhotographyStyle } from "./commercial-photo-director-types";
import { FocusStrategy } from "./commercial-photo-director-types";
import { LightingScheme } from "./lighting-director-types";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import {
  CameraAngleStyle,
  CameraDistanceStyle,
  CameraHeightStyle,
  CameraStyle,
  DepthOfFieldProfile,
  FramingProfile,
  PerspectiveProfile,
  type CameraDirectorContext,
  type CameraExplainabilityReport,
  type CameraFailureCode,
  type CameraSection,
  type CameraStyleDefinition,
  type CameraStyleId,
  type CameraValidationReport,
} from "./camera-director-types";

export {
  CameraStyle,
  CameraAngleStyle,
  CameraHeightStyle,
  CameraDistanceStyle,
  PerspectiveProfile,
  DepthOfFieldProfile,
  FramingProfile,
  type CameraStyleId,
  type CameraStyleDefinition,
  type CameraSection,
  type CameraDirectorContext,
  type CameraExplainabilityReport,
  type CameraValidationReport,
  type CameraFailureCode,
} from "./camera-director-types";

export const CAMERA_DIRECTOR_VERSION = "4.15.0";

export const CAMERA_DIRECTOR_GOLDEN_RULE =
  "Camera Director does not choose a beautiful angle — it chooses the viewpoint " +
  "from which the buyer fastest understands product value.";

export const CAMERA_DIRECTOR_ID: AgentContractId = "camera-director";

export const CAMERA_DIRECTOR_PIPELINE_POSITION = [
  "lighting-director",
  CAMERA_DIRECTOR_ID,
  "material-director",
] as const;

export const CAMERA_STYLE_CATALOG: readonly CameraStyleDefinition[] = [
  { id: CameraStyle.COMMERCIAL_PRODUCT, name: "Commercial Product", summary: "Standard marketplace product viewpoint" },
  { id: CameraStyle.PREMIUM_HERO, name: "Premium Hero", summary: "Low angle premium product hero" },
  { id: CameraStyle.LIFESTYLE_CONTEXT, name: "Lifestyle Context", summary: "Wider contextual lifestyle framing" },
  { id: CameraStyle.TECHNOLOGY_DETAIL, name: "Technology Detail", summary: "Controlled tech product angle" },
  { id: CameraStyle.MACRO_DETAIL, name: "Macro Detail", summary: "Close detail emphasis" },
  { id: CameraStyle.MARKETPLACE_THUMB, name: "Marketplace Thumb", summary: "Thumbnail-optimized legibility" },
] as const;

const PROMPT_KEYWORDS = /\b(prompt|negative prompt|render prompt|cinematic)\b/i;
const LIGHTING_KEYWORDS = /\b(key light|fill light|rim light|softbox|kelvin|color temperature)\b/i;
const COMPOSITION_KEYWORDS = /\b(headline area|badge area|template layout|white space zone)\b/i;

function styleAlternatives(ctx: CameraDirectorContext): CameraStyleId[] {
  const story = ctx.storyType;
  const photo = ctx.photographyStyle;

  if (photo === PhotographyStyle.MACRO_DETAIL) {
    return [CameraStyle.MACRO_DETAIL, CameraStyle.COMMERCIAL_PRODUCT, CameraStyle.PREMIUM_HERO];
  }
  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY || photo === PhotographyStyle.LUXURY_ADVERTISING) {
    return [CameraStyle.PREMIUM_HERO, CameraStyle.COMMERCIAL_PRODUCT, CameraStyle.LIFESTYLE_CONTEXT];
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION || photo === PhotographyStyle.TECHNOLOGY_PRODUCT) {
    return [CameraStyle.TECHNOLOGY_DETAIL, CameraStyle.COMMERCIAL_PRODUCT, CameraStyle.MARKETPLACE_THUMB];
  }
  if (photo === PhotographyStyle.LIFESTYLE_COMMERCIAL || ctx.sceneType === SceneType.LIFESTYLE) {
    return [CameraStyle.LIFESTYLE_CONTEXT, CameraStyle.COMMERCIAL_PRODUCT, CameraStyle.PREMIUM_HERO];
  }
  if (ctx.marketplace === "WB" || photo === PhotographyStyle.MODERN_MARKETPLACE) {
    return [CameraStyle.MARKETPLACE_THUMB, CameraStyle.COMMERCIAL_PRODUCT, CameraStyle.TECHNOLOGY_DETAIL];
  }
  return [CameraStyle.COMMERCIAL_PRODUCT, CameraStyle.MARKETPLACE_THUMB, CameraStyle.PREMIUM_HERO];
}

function selectStyle(ctx: CameraDirectorContext): {
  selected: CameraStyleId;
  alternatives: CameraStyleId[];
  rejected: { id: CameraStyleId; reason: string }[];
} {
  const alternatives = styleAlternatives(ctx);
  const scores = alternatives.map((id, index) => ({
    id,
    score:
      id === CameraStyle.MARKETPLACE_THUMB && ctx.marketplace === "WB"
        ? 0.92
        : id === CameraStyle.PREMIUM_HERO &&
            (ctx.storyType === StoryType.PREMIUM_LIFESTYLE || ctx.primaryEmotion === "luxury")
          ? 0.9
          : id === CameraStyle.TECHNOLOGY_DETAIL && ctx.photographyStyle === PhotographyStyle.TECHNOLOGY_PRODUCT
            ? 0.88
            : id === CameraStyle.MACRO_DETAIL && ctx.photographyStyle === PhotographyStyle.MACRO_DETAIL
              ? 0.91
              : 0.82 - index * 0.06,
  }));
  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0].id;
  const rejected = scores.slice(1).map((s) => ({
    id: s.id,
    reason: `Lower viewpoint fit for photography ${ctx.photographyStyle ?? "generic"} and story ${ctx.storyType ?? "generic"}`,
  }));
  return { selected, alternatives, rejected };
}

type CameraParams = Pick<
  CameraSection,
  | "cameraAngle"
  | "cameraHeight"
  | "cameraDistance"
  | "focalLength"
  | "perspectiveProfile"
  | "heroScale"
  | "depthOfField"
  | "framingProfile"
>;

function paramsForStyle(style: CameraStyleId, ctx: CameraDirectorContext): CameraParams {
  const heroFromComposition = ctx.compositionHeroWeight
    ? Math.min(0.65, Math.max(0.35, ctx.compositionHeroWeight / 100))
    : undefined;

  switch (style) {
    case CameraStyle.PREMIUM_HERO:
      return {
        cameraAngle: CameraAngleStyle.THREE_QUARTER,
        cameraHeight: CameraHeightStyle.LOW_ANGLE,
        cameraDistance: CameraDistanceStyle.CLOSE,
        focalLength: 85,
        perspectiveProfile: PerspectiveProfile.COMPRESSED,
        heroScale: heroFromComposition ?? 0.52,
        depthOfField: DepthOfFieldProfile.SOFT_BACKGROUND,
        framingProfile: FramingProfile.EDITORIAL_BALANCE,
      };
    case CameraStyle.TECHNOLOGY_DETAIL:
      return {
        cameraAngle: CameraAngleStyle.THREE_QUARTER,
        cameraHeight: CameraHeightStyle.EYE_LEVEL,
        cameraDistance: CameraDistanceStyle.MEDIUM,
        focalLength: 50,
        perspectiveProfile: PerspectiveProfile.TECHNICAL,
        heroScale: heroFromComposition ?? 0.48,
        depthOfField: DepthOfFieldProfile.ENTIRE_PRODUCT_SHARP,
        framingProfile: FramingProfile.CENTERED,
      };
    case CameraStyle.MACRO_DETAIL:
      return {
        cameraAngle: CameraAngleStyle.MACRO,
        cameraHeight: CameraHeightStyle.SLIGHTLY_ABOVE,
        cameraDistance: CameraDistanceStyle.CLOSE,
        focalLength: 85,
        perspectiveProfile: PerspectiveProfile.NATURAL,
        heroScale: heroFromComposition ?? 0.58,
        depthOfField: DepthOfFieldProfile.MACRO_FOCUS,
        framingProfile: FramingProfile.CENTERED,
      };
    case CameraStyle.LIFESTYLE_CONTEXT:
      return {
        cameraAngle: CameraAngleStyle.THREE_QUARTER,
        cameraHeight: CameraHeightStyle.EYE_LEVEL,
        cameraDistance: CameraDistanceStyle.WIDE,
        focalLength: 35,
        perspectiveProfile: PerspectiveProfile.EXPANDED,
        heroScale: heroFromComposition ?? 0.42,
        depthOfField: DepthOfFieldProfile.SOFT_BACKGROUND,
        framingProfile: FramingProfile.RULE_OF_THIRDS,
      };
    case CameraStyle.MARKETPLACE_THUMB:
      return {
        cameraAngle: CameraAngleStyle.FRONT,
        cameraHeight: CameraHeightStyle.SLIGHTLY_ABOVE,
        cameraDistance: CameraDistanceStyle.MEDIUM,
        focalLength: 50,
        perspectiveProfile: PerspectiveProfile.NATURAL,
        heroScale: heroFromComposition ?? 0.55,
        depthOfField: DepthOfFieldProfile.ENTIRE_PRODUCT_SHARP,
        framingProfile: FramingProfile.MARKETPLACE_FOCUS,
      };
    default:
      return {
        cameraAngle: CameraAngleStyle.THREE_QUARTER,
        cameraHeight: CameraHeightStyle.EYE_LEVEL,
        cameraDistance: CameraDistanceStyle.MEDIUM,
        focalLength: 50,
        perspectiveProfile: PerspectiveProfile.NATURAL,
        heroScale: heroFromComposition ?? 0.5,
        depthOfField: DepthOfFieldProfile.ENTIRE_PRODUCT_SHARP,
        framingProfile: FramingProfile.MARKETPLACE_FOCUS,
      };
  }
}

function refineParams(params: CameraParams, ctx: CameraDirectorContext): CameraParams {
  const refined = { ...params };

  if (ctx.focusStrategy === FocusStrategy.ENTIRE_PRODUCT_SHARP || ctx.focusStrategy === FocusStrategy.UNIFORM_FOCUS) {
    refined.depthOfField = DepthOfFieldProfile.ENTIRE_PRODUCT_SHARP;
  }
  if (ctx.focusStrategy === FocusStrategy.HERO_DETAIL) {
    refined.depthOfField = DepthOfFieldProfile.MACRO_FOCUS;
    refined.cameraDistance = CameraDistanceStyle.CLOSE;
  }

  if (ctx.lightingScheme === LightingScheme.TOP_SOFTBOX || ctx.lightingScheme === LightingScheme.HIGH_KEY) {
    refined.cameraHeight = CameraHeightStyle.SLIGHTLY_ABOVE;
  }
  if (ctx.lightingScheme === LightingScheme.LUXURY_SIDE_LIGHT) {
    refined.cameraHeight = CameraHeightStyle.LOW_ANGLE;
    refined.focalLength = 85;
  }

  if (ctx.layoutTemplateId === "hero_left" || ctx.layoutTemplateId === "hero_right") {
    refined.framingProfile = FramingProfile.OFFSET_HERO;
  }

  if (ctx.cameraIntent?.toLowerCase().includes("macro")) {
    refined.cameraAngle = CameraAngleStyle.MACRO;
    refined.cameraDistance = CameraDistanceStyle.CLOSE;
    refined.focalLength = 85;
  }

  return refined;
}

function nearestLens(focalLength: number): CameraLensId {
  const options: CameraLensId[] = [35, 50, 70, 85];
  return options.reduce((best, lens) =>
    Math.abs(lens - focalLength) < Math.abs(best - focalLength) ? lens : best,
  );
}

function toLegacyBlueprint(params: CameraParams, style: CameraStyleId): CameraBlueprint {
  const heightMap: Record<string, CameraHeightId> = {
    [CameraHeightStyle.EYE_LEVEL]: "eye",
    [CameraHeightStyle.SLIGHTLY_ABOVE]: "eye",
    [CameraHeightStyle.LOW_ANGLE]: "low",
    [CameraHeightStyle.HIGH_ANGLE]: "high",
  };

  const angleMap: Record<string, CameraAngleId> = {
    [CameraAngleStyle.FRONT]: "front",
    [CameraAngleStyle.THREE_QUARTER]: "three-quarter",
    [CameraAngleStyle.SIDE]: "side",
    [CameraAngleStyle.TOP]: "three-quarter",
    [CameraAngleStyle.MACRO]: "front",
    [CameraAngleStyle.ISOMETRIC]: "three-quarter",
  };

  const distanceMap: Record<string, CameraDistanceId> = {
    [CameraDistanceStyle.CLOSE]: "close",
    [CameraDistanceStyle.MEDIUM]: "medium",
    [CameraDistanceStyle.WIDE]: "far",
  };

  const perspectiveMap: Record<string, CameraPerspectiveId> = {
    [PerspectiveProfile.NATURAL]: "natural",
    [PerspectiveProfile.TECHNICAL]: "natural",
    [PerspectiveProfile.COMPRESSED]: "dramatic",
    [PerspectiveProfile.EXPANDED]: "dramatic",
    [PerspectiveProfile.ORTHOGRAPHIC_STYLE]: "dramatic",
  };

  return {
    lens: nearestLens(params.focalLength),
    height: heightMap[params.cameraHeight] ?? "eye",
    angle: angleMap[params.cameraAngle] ?? "three-quarter",
    distance: distanceMap[params.cameraDistance] ?? "medium",
    perspective: perspectiveMap[params.perspectiveProfile] ?? "natural",
    cameraStyle: style,
    cameraAngle: params.cameraAngle,
    cameraHeight: params.cameraHeight,
    focalLength: params.focalLength,
    perspectiveProfile: params.perspectiveProfile,
    heroScale: params.heroScale,
    depthOfField: params.depthOfField,
    framingProfile: params.framingProfile,
    providerHints: [],
  };
}

function providerHintsFor(style: CameraStyleId, params: CameraParams, providerId?: string): string[] {
  const base = [
    "natural eye-level or slightly above viewpoint",
    "moderate perspective without wide-angle distortion",
    "physically plausible lens and depth of field",
    "avoid impossible camera angles",
  ];
  if (style === CameraStyle.MARKETPLACE_THUMB) {
    base.push("hero silhouette readable at 150–300px thumbnail");
  }
  if (params.focalLength >= 85) {
    base.push("compressed perspective for premium product separation");
  }
  if (providerId === "flux" || !providerId) {
    return [...base, "FLUX: prefer 35–85mm equivalent lenses", "avoid extreme fisheye or orthographic experiments"];
  }
  return base;
}

export function buildCameraSection(
  ctx: CameraDirectorContext,
  confidence: number,
): { section: CameraSection; explainability: CameraExplainabilityReport } {
  const { selected, alternatives, rejected } = selectStyle(ctx);
  const params = refineParams(paramsForStyle(selected, ctx), ctx);
  const hints = providerHintsFor(selected, params, ctx.providerId);
  const cameraBlueprint = { ...toLegacyBlueprint(params, selected), providerHints: hints };

  const section: CameraSection = {
    cameraStyle: selected,
    cameraAngle: params.cameraAngle,
    cameraHeight: params.cameraHeight,
    cameraDistance: params.cameraDistance,
    focalLength: params.focalLength,
    perspectiveProfile: params.perspectiveProfile,
    heroScale: params.heroScale,
    depthOfField: params.depthOfField,
    framingProfile: params.framingProfile,
    providerHints: hints,
    cameraBlueprint,
    confidence,
  };

  const explainability: CameraExplainabilityReport = {
    agentId: CAMERA_DIRECTOR_ID,
    selectedStyle: selected,
    alternativesConsidered: alternatives,
    rejectedAlternatives: rejected,
    storyInfluences: [
      ctx.storyType ? `Story type: ${ctx.storyType}` : "",
      ctx.primaryEmotion ? `Primary emotion: ${ctx.primaryEmotion}` : "",
    ].filter(Boolean),
    photographyInfluences: [
      ctx.photographyStyle ? `Photography style: ${ctx.photographyStyle}` : "",
      ctx.cameraIntent ? `Camera intent: ${ctx.cameraIntent.slice(0, 60)}` : "",
      ctx.focusStrategy ? `Focus strategy: ${ctx.focusStrategy}` : "",
    ].filter(Boolean),
    lightingInfluences: [
      ctx.lightingScheme ? `Lighting scheme: ${ctx.lightingScheme}` : "",
    ].filter(Boolean),
    commercialValue: "Viewpoint that maximizes product value recognition in marketplace thumbnails",
    reasoning: [
      `Style ${selected} chosen from lighting and photography — viewpoint-first, not decorative`,
      `Angle ${params.cameraAngle} at ${params.cameraHeight} reinforces story perception`,
      `${params.focalLength}mm lens controls perspective without distorting product form`,
      `Hero scale ${params.heroScale.toFixed(2)} keeps product legible at thumbnail size`,
      `Depth of field ${params.depthOfField} — product stays primary focus`,
      `Framing ${params.framingProfile} aligns with layout without overriding composition`,
    ],
  };

  return { section, explainability };
}

export function validateCameraSection(
  section: CameraSection,
  ctx: CameraDirectorContext,
): CameraValidationReport {
  const violations: string[] = [];
  const text = section.providerHints.join(" ");

  if (!ctx.lightingScheme && !ctx.photographyStyle) {
    violations.push("MISSING_LIGHTING_INPUT");
  }
  if (PROMPT_KEYWORDS.test(text)) violations.push("CONTAINS_PROMPT");
  if (LIGHTING_KEYWORDS.test(text)) violations.push("CONTAINS_LIGHTING_DECISION");
  if (COMPOSITION_KEYWORDS.test(text)) violations.push("COMPOSITION_VIOLATION");

  if (section.heroScale < 0.35) {
    violations.push("HERO_TOO_SMALL");
  }

  if (section.focalLength < 28 || (section.perspectiveProfile === PerspectiveProfile.EXPANDED && section.focalLength <= 35)) {
    violations.push("PERSPECTIVE_DISTORTION");
  }

  if (
    section.cameraStyle === CameraStyle.MARKETPLACE_THUMB &&
    section.cameraAngle === CameraAngleStyle.ISOMETRIC
  ) {
    violations.push("AWKWARD_ANGLE");
  }

  if (
    ctx.storyType === StoryType.TRUST &&
    section.cameraHeight === CameraHeightStyle.LOW_ANGLE &&
    section.cameraStyle === CameraStyle.PREMIUM_HERO
  ) {
    violations.push("STORY_CONFLICT");
  }

  return { valid: violations.length === 0, violations, section };
}

export function isCameraFailure(code: string): code is CameraFailureCode {
  return [
    "PERSPECTIVE_DISTORTION",
    "HERO_TOO_SMALL",
    "STORY_CONFLICT",
    "MISSING_LIGHTING_INPUT",
    "CONTAINS_LIGHTING_DECISION",
    "CONTAINS_PROMPT",
    "COMPOSITION_VIOLATION",
    "AWKWARD_ANGLE",
  ].includes(code);
}

export function cameraSectionToMutations(
  section: CameraSection,
  revision: number,
  reason: string,
): BlueprintMutation[] {
  return updatesToMutations(
    { camera: section.cameraBlueprint },
    CAMERA_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function runCameraDirector(input: {
  context: AgentContextPackage;
  directorContext: CameraDirectorContext;
}): {
  section: CameraSection;
  explainability: CameraExplainabilityReport;
  confidence: ReturnType<typeof confidenceFromContext>;
  decisionSession: AgentDecisionSession;
  mutations: BlueprintMutation[];
} {
  const memory = buildAgentMemoryPackage({
    agentId: CAMERA_DIRECTOR_ID,
    working: input.context,
  });

  const styleAlts = styleAlternatives(input.directorContext);
  const alternatives = styleAlts.map((id) => {
    const def = CAMERA_STYLE_CATALOG.find((d) => d.id === id);
    return {
      id,
      label: def?.name ?? id,
      summary: def?.summary ?? `Camera: ${id}`,
      scores: {},
    };
  });

  const evaluations = styleAlts.map((id, index) => ({
    alternativeId: id,
    scores: scoreAlternative([`camera style ${id}`], 0.82 - index * 0.07),
    weightedTotal: 0.82 - index * 0.07,
    notes: [`Evaluated camera style ${id}`],
  }));

  const selectedAlternative = pickBestAlternative(alternatives, evaluations);
  const confidence = confidenceFromContext({
    agentId: CAMERA_DIRECTOR_ID,
    context: input.context,
    evaluations,
    knowledgeAligned: true,
    reasoningSteps: 5,
    constraintsSatisfied: 5,
    constraintsTotal: 5,
  });

  const { section, explainability } = buildCameraSection(
    input.directorContext,
    confidence.value,
  );

  const decisionSession = new AgentDecisionSession(CAMERA_DIRECTOR_ID)
    .observeFromContext(input.context, memory)
    .interpret([
      `Photography: ${input.directorContext.photographyStyle ?? "pending"}`,
      `Lighting: ${input.directorContext.lightingScheme ?? "pending"}`,
      `Story: ${input.directorContext.storyType ?? "pending"}`,
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

  const mutations = cameraSectionToMutations(
    section,
    input.context.blueprint.meta.revision ?? 0,
    explainability.reasoning.join("; "),
  );

  decisionSession.publish(mutations);

  return { section, explainability, confidence, decisionSession, mutations };
}

export function directorContextFromBlueprint(
  blueprint: import("./types").RenderBlueprint,
): CameraDirectorContext {
  return {
    productCategory: blueprint.product.category,
    marketplace: blueprint.creative.marketplace,
    storyType: blueprint.story.storyType,
    primaryEmotion: blueprint.story.primaryEmotion,
    sceneType: blueprint.scene.sceneType,
    photographyStyle: blueprint.photography.photographyStyle,
    focusStrategy: blueprint.photography.focusStrategy,
    cameraIntent: blueprint.photography.cameraIntent,
    lightingScheme: blueprint.lighting.lightingScheme,
    layoutTemplateId: blueprint.composition.templateId ?? blueprint.composition.template,
    compositionHeroWeight: blueprint.composition.heroWeight,
    providerId: blueprint.meta.generator,
  };
}

/**
 * Chapter 4.13 — Commercial Photo Director engine.
 * Designs a commercial photoshoot plan from Story + Scene + Composition — never prompt or render params.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentDecisionSession, pickBestAlternative, scoreAlternative } from "./agent-decision-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { buildAgentMemoryPackage } from "./agent-memory-engine";
import { confidenceFromContext } from "./agent-confidence-engine";
import type { ContrastLevelId, PhotographyBlueprint, PhotographyStyleId as LegacyStyleId, ShotTypeId } from "./types";
import { updatesToMutations } from "./universal-agent-bridge";
import type { BlueprintMutation } from "./mutation-types";
import { LayoutTemplate } from "./composition-director-types";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import {
  FocusStrategy,
  PhotoDepthProfile,
  PhotoMood,
  PhotographyStyle,
  ProductInteraction,
  type CommercialPhotoDirectorContext,
  type FocusStrategyId,
  type PhotoDepthProfileId,
  type PhotoMoodId,
  type PhotographyExplainabilityReport,
  type PhotographyFailureCode,
  type PhotographySection,
  type PhotographyStyleDefinition,
  type PhotographyStyleId,
  type PhotographyValidationReport,
  type ProductInteractionId,
} from "./commercial-photo-director-types";

export {
  PhotographyStyle,
  PhotoMood,
  PhotoDepthProfile,
  FocusStrategy,
  ProductInteraction,
  type PhotographyStyleId,
  type PhotoMoodId,
  type PhotoDepthProfileId,
  type FocusStrategyId,
  type ProductInteractionId,
  type PhotographyStyleDefinition,
  type PhotographySection,
  type CommercialPhotoDirectorContext,
  type PhotographyExplainabilityReport,
  type PhotographyValidationReport,
  type PhotographyFailureCode,
} from "./commercial-photo-director-types";

export const COMMERCIAL_PHOTO_DIRECTOR_VERSION = "4.13.0";

export const COMMERCIAL_PHOTO_DIRECTOR_GOLDEN_RULE =
  "Commercial Photo Director does not think like an image generator — it thinks like a professional " +
  "advertising photographer preparing a shoot before the shutter is pressed.";

export const COMMERCIAL_PHOTO_DIRECTOR_ID: AgentContractId = "commercial-photo-director";

export const COMMERCIAL_PHOTO_PIPELINE_POSITION = [
  "composition-director",
  COMMERCIAL_PHOTO_DIRECTOR_ID,
  "lighting-director",
] as const;

export const PHOTOGRAPHY_STYLE_CATALOG: readonly PhotographyStyleDefinition[] = [
  { id: PhotographyStyle.COMMERCIAL_PRODUCT, name: "Commercial Product", summary: "Standard product advertising" },
  { id: PhotographyStyle.LUXURY_ADVERTISING, name: "Luxury Advertising", summary: "High-end brand campaign look" },
  { id: PhotographyStyle.EDITORIAL, name: "Editorial", summary: "Magazine-quality product story" },
  { id: PhotographyStyle.LIFESTYLE_COMMERCIAL, name: "Lifestyle Commercial", summary: "Contextual everyday use" },
  { id: PhotographyStyle.STUDIO_PREMIUM, name: "Studio Premium", summary: "Controlled premium studio shoot" },
  { id: PhotographyStyle.MINIMAL_SHOWCASE, name: "Minimal Showcase", summary: "Clean isolated product focus" },
  { id: PhotographyStyle.MODERN_MARKETPLACE, name: "Modern Marketplace", summary: "Thumbnail-optimized WB photography" },
  { id: PhotographyStyle.TECHNOLOGY_PRODUCT, name: "Technology Product", summary: "Crisp tech product capture" },
  { id: PhotographyStyle.MEDICAL_PRODUCT, name: "Medical Product", summary: "Clinical trustworthy capture" },
  { id: PhotographyStyle.COSMETIC_BEAUTY, name: "Cosmetic Beauty", summary: "Beauty category lighting" },
  { id: PhotographyStyle.MACRO_DETAIL, name: "Macro Detail", summary: "Close surface detail emphasis" },
] as const;

const PROMPT_KEYWORDS = /\b(prompt|negative prompt|flux|soft cinematic lighting|8k|photorealistic|ultra realistic)\b/i;
const LAYOUT_KEYWORDS = /\b(hero area|headline area|template id|safe zone|white space)\b/i;
const AI_ART_KEYWORDS = /\b(ai art|dreamy fantasy|surreal|hyperreal masterpiece)\b/i;
const PNG_INSERT_KEYWORDS = /\b(floating cutout|pasted png|bad composite|harsh cutout edge)\b/i;

function styleAlternatives(ctx: CommercialPhotoDirectorContext): PhotographyStyleId[] {
  const story = ctx.storyType;
  const scene = ctx.sceneType;

  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY) {
    return [PhotographyStyle.LUXURY_ADVERTISING, PhotographyStyle.STUDIO_PREMIUM, PhotographyStyle.EDITORIAL];
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION) {
    return [PhotographyStyle.TECHNOLOGY_PRODUCT, PhotographyStyle.MODERN_MARKETPLACE, PhotographyStyle.COMMERCIAL_PRODUCT];
  }
  if (story === StoryType.SAFETY || story === StoryType.FAMILY) {
    return [PhotographyStyle.LIFESTYLE_COMMERCIAL, PhotographyStyle.COMMERCIAL_PRODUCT, PhotographyStyle.EDITORIAL];
  }
  if (story === StoryType.HEALTH) {
    return [PhotographyStyle.MEDICAL_PRODUCT, PhotographyStyle.COMMERCIAL_PRODUCT, PhotographyStyle.MINIMAL_SHOWCASE];
  }
  if (ctx.productCategory.includes("cosmetic") || ctx.productCategory.includes("beauty")) {
    return [PhotographyStyle.COSMETIC_BEAUTY, PhotographyStyle.LUXURY_ADVERTISING, PhotographyStyle.EDITORIAL];
  }
  if (scene === SceneType.LUXURY || scene === SceneType.PREMIUM_SHOWCASE) {
    return [PhotographyStyle.LUXURY_ADVERTISING, PhotographyStyle.STUDIO_PREMIUM, PhotographyStyle.EDITORIAL];
  }
  if (scene === SceneType.TECHNOLOGY) {
    return [PhotographyStyle.TECHNOLOGY_PRODUCT, PhotographyStyle.MODERN_MARKETPLACE, PhotographyStyle.COMMERCIAL_PRODUCT];
  }
  if (ctx.layoutTemplateId === LayoutTemplate.LUXURY_SHOWCASE) {
    return [PhotographyStyle.STUDIO_PREMIUM, PhotographyStyle.LUXURY_ADVERTISING, PhotographyStyle.MINIMAL_SHOWCASE];
  }
  if (ctx.marketplace === "WB" || ctx.creativeGoal === "CTR") {
    return [PhotographyStyle.MODERN_MARKETPLACE, PhotographyStyle.COMMERCIAL_PRODUCT, PhotographyStyle.LIFESTYLE_COMMERCIAL];
  }
  return [PhotographyStyle.COMMERCIAL_PRODUCT, PhotographyStyle.LIFESTYLE_COMMERCIAL, PhotographyStyle.STUDIO_PREMIUM];
}

function selectStyle(ctx: CommercialPhotoDirectorContext): {
  selected: PhotographyStyleId;
  alternatives: PhotographyStyleId[];
  rejected: { id: PhotographyStyleId; reason: string }[];
} {
  const alternatives = styleAlternatives(ctx);
  const scores = alternatives.map((id, index) => ({
    id,
    score:
      id === PhotographyStyle.LUXURY_ADVERTISING &&
      (ctx.storyType === StoryType.PREMIUM_LIFESTYLE || ctx.primaryEmotion === "luxury")
        ? 0.92
        : id === PhotographyStyle.TECHNOLOGY_PRODUCT && ctx.storyType === StoryType.TECHNOLOGY
          ? 0.9
          : id === PhotographyStyle.MODERN_MARKETPLACE && ctx.marketplace === "WB"
            ? 0.88
            : 0.82 - index * 0.06,
  }));
  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0].id;
  const rejected = scores.slice(1).map((s) => ({
    id: s.id,
    reason: `Lower shoot fit for story ${ctx.storyType ?? "generic"} and scene ${ctx.sceneType ?? "generic"}`,
  }));
  return { selected, alternatives, rejected };
}

function legacyStyleFor(style: PhotographyStyleId): LegacyStyleId {
  switch (style) {
    case PhotographyStyle.EDITORIAL:
    case PhotographyStyle.LIFESTYLE_COMMERCIAL:
      return "editorial";
    case PhotographyStyle.LUXURY_ADVERTISING:
    case PhotographyStyle.STUDIO_PREMIUM:
      return "advertising";
    case PhotographyStyle.MINIMAL_SHOWCASE:
    case PhotographyStyle.MACRO_DETAIL:
      return "catalog";
    default:
      return "commercial";
  }
}

function shotTypeFor(style: PhotographyStyleId): ShotTypeId {
  if (style === PhotographyStyle.MACRO_DETAIL) return "macro";
  if (style === PhotographyStyle.EDITORIAL || style === PhotographyStyle.LIFESTYLE_COMMERCIAL) return "wide";
  return "hero";
}

function photoMoodFor(style: PhotographyStyleId, ctx: CommercialPhotoDirectorContext): PhotoMoodId {
  if (style === PhotographyStyle.MEDICAL_PRODUCT) return PhotoMood.BRIGHT_CLINICAL;
  if (style === PhotographyStyle.TECHNOLOGY_PRODUCT) return PhotoMood.CRISP_NEUTRAL;
  if (style === PhotographyStyle.LIFESTYLE_COMMERCIAL || ctx.storyType === StoryType.FAMILY) {
    return PhotoMood.CALM_DOMESTIC;
  }
  if (style === PhotographyStyle.LUXURY_ADVERTISING || style === PhotographyStyle.STUDIO_PREMIUM) {
    return PhotoMood.WARM_MORNING;
  }
  if (style === PhotographyStyle.MINIMAL_SHOWCASE) return PhotoMood.SOFT_STUDIO;
  return PhotoMood.CLEAN_DAYLIGHT;
}

function visualMoodLabel(mood: PhotoMoodId): string {
  switch (mood) {
    case PhotoMood.WARM_MORNING:
      return "warm morning ambiance";
    case PhotoMood.SOFT_STUDIO:
      return "soft studio fill";
    case PhotoMood.CRISP_NEUTRAL:
      return "crisp neutral daylight";
    case PhotoMood.CALM_DOMESTIC:
      return "calm domestic light";
    case PhotoMood.BRIGHT_CLINICAL:
      return "bright clinical clarity";
    default:
      return "clean daylight";
  }
}

function depthProfileFor(style: PhotographyStyleId, scene?: string): PhotoDepthProfileId {
  if (style === PhotographyStyle.MACRO_DETAIL || style === PhotographyStyle.MINIMAL_SHOWCASE) {
    return PhotoDepthProfile.SHALLOW;
  }
  if (style === PhotographyStyle.LIFESTYLE_COMMERCIAL || scene === SceneType.NATURAL) {
    return PhotoDepthProfile.DEEP;
  }
  if (style === PhotographyStyle.STUDIO_PREMIUM) return PhotoDepthProfile.INFINITE;
  return PhotoDepthProfile.MEDIUM;
}

function focusStrategyFor(style: PhotographyStyleId): FocusStrategyId {
  if (style === PhotographyStyle.MACRO_DETAIL) return FocusStrategy.HERO_DETAIL;
  if (style === PhotographyStyle.MODERN_MARKETPLACE) return FocusStrategy.ENTIRE_PRODUCT_SHARP;
  if (style === PhotographyStyle.EDITORIAL) return FocusStrategy.CENTER_FOCUS;
  return FocusStrategy.FRONT_FOCUS;
}

function backgroundBlurFor(depth: PhotoDepthProfileId): number {
  switch (depth) {
    case PhotoDepthProfile.SHALLOW:
      return 0.15;
    case PhotoDepthProfile.DEEP:
      return 0.45;
    case PhotoDepthProfile.INFINITE:
      return 0.55;
    default:
      return 0.3;
  }
}

function productInteractionFor(style: PhotographyStyleId, ctx: CommercialPhotoDirectorContext): ProductInteractionId {
  if (style === PhotographyStyle.MINIMAL_SHOWCASE || style === PhotographyStyle.MACRO_DETAIL) {
    return ProductInteraction.ISOLATED_HERO;
  }
  if (style === PhotographyStyle.LIFESTYLE_COMMERCIAL) {
    return ProductInteraction.INTEGRATED_INTERIOR;
  }
  if (ctx.productCutout && style === PhotographyStyle.MODERN_MARKETPLACE) {
    return ProductInteraction.ON_SURFACE;
  }
  return ProductInteraction.ON_SURFACE;
}

function shootingNarrativeFor(style: PhotographyStyleId, ctx: CommercialPhotoDirectorContext): string {
  const product = ctx.subCategory ?? ctx.productCategory;
  switch (style) {
    case PhotographyStyle.LIFESTYLE_COMMERCIAL:
      return `${product} готовится к повседневному использованию — статичный кадр передаёт естественный момент перед применением`;
    case PhotographyStyle.TECHNOLOGY_PRODUCT:
      return `${product} демонстрируется как готовое технологичное решение — съёмка подчёркивает точность и инновацию`;
    case PhotographyStyle.LUXURY_ADVERTISING:
      return `Предметная съёмка ${product} в духе рекламной кампании дорогих брендов — утренний свет и контролируемая постановка`;
    case PhotographyStyle.MEDICAL_PRODUCT:
      return `${product} снят в чистой доверительной обстановке — кадр объясняет надёжность и гигиену`;
    case PhotographyStyle.COSMETIC_BEAUTY:
      return `${product} представлен в beauty-съёмке — мягкий свет раскрывает текстуру и форму без отвлекающих деталей`;
    default:
      return `Коммерческая предметная съёмка ${product} — кадр показывает товар как главный объект рекламной фотографии`;
  }
}

function lightingIntentFor(style: PhotographyStyleId, ctx: CommercialPhotoDirectorContext): string {
  if (style === PhotographyStyle.TECHNOLOGY_PRODUCT) {
    return "Even key with controlled reflections — emphasize product edges without harsh hotspots";
  }
  if (style === PhotographyStyle.LUXURY_ADVERTISING || style === PhotographyStyle.STUDIO_PREMIUM) {
    return "Soft natural morning key with gentle fill — advertising-grade product separation";
  }
  if (ctx.sceneLightingMood) {
    return `Translate scene mood (${ctx.sceneLightingMood}) into photographic key/fill balance`;
  }
  return "Balanced commercial key light with soft shadow falloff for marketplace readability";
}

function cameraIntentFor(style: PhotographyStyleId, focus: FocusStrategyId): string {
  if (style === PhotographyStyle.MACRO_DETAIL) {
    return "Close macro lens, shallow acceptable focus on hero detail, product fills frame";
  }
  if (focus === FocusStrategy.ENTIRE_PRODUCT_SHARP) {
    return "Standard product lens, entire product sharp for thumbnail legibility at 150–300px";
  }
  return "Three-quarter product angle, front-weighted focus, natural eye-level commercial framing";
}

function materialIntentFor(style: PhotographyStyleId, ctx: CommercialPhotoDirectorContext): string {
  if (style === PhotographyStyle.LUXURY_ADVERTISING) {
    return "Premium surface contact shadows — product sits naturally on scene materials without cutout artifacts";
  }
  if (ctx.productCutout) {
    return "Ground contact and ambient occlusion at product base — avoid floating PNG appearance";
  }
  return "Consistent scene materials with subtle contact shadows anchoring the product";
}

function providerHintsFor(providerId?: string): string[] {
  const base = [
    "avoid complex multi-light setups",
    "limit secondary objects in frame",
    "physically plausible reflections only",
    "stable commercial product silhouette",
  ];
  if (providerId === "flux" || !providerId) {
    return [...base, "prefer simple studio geometry for FLUX", "no extreme bokeh or impossible light physics"];
  }
  return base;
}

function contrastFor(style: PhotographyStyleId): ContrastLevelId {
  if (style === PhotographyStyle.TECHNOLOGY_PRODUCT || style === PhotographyStyle.MEDICAL_PRODUCT) {
    return "medium";
  }
  if (style === PhotographyStyle.LUXURY_ADVERTISING) return "soft";
  return "medium";
}

export function buildPhotographySection(
  ctx: CommercialPhotoDirectorContext,
  confidence: number,
): { section: PhotographySection; explainability: PhotographyExplainabilityReport } {
  const { selected, alternatives, rejected } = selectStyle(ctx);
  const photoMood = photoMoodFor(selected, ctx);
  const depthProfile = depthProfileFor(selected, ctx.sceneType);
  const focusStrategy = focusStrategyFor(selected);
  const backgroundBlur = backgroundBlurFor(depthProfile);
  const productInteraction = productInteractionFor(selected, ctx);
  const shootingNarrative = shootingNarrativeFor(selected, ctx);

  const photographyBlueprint: PhotographyBlueprint = {
    style: legacyStyleFor(selected),
    shotType: shotTypeFor(selected),
    backgroundBlur,
    contrast: contrastFor(selected),
    visualMood: visualMoodLabel(photoMood),
    realism: selected === PhotographyStyle.LUXURY_ADVERTISING ? 0.9 : 0.85,
    photographyStyle: selected,
    photoMood,
    depthProfile,
    focusStrategy,
    productInteraction,
    shootingNarrative,
    lightingIntent: lightingIntentFor(selected, ctx),
    cameraIntent: cameraIntentFor(selected, focusStrategy),
    materialIntent: materialIntentFor(selected, ctx),
    providerHints: providerHintsFor(ctx.providerId),
  };

  const section: PhotographySection = {
    photographyStyle: selected,
    photoMood,
    depthProfile,
    focusStrategy,
    backgroundBlur,
    productInteraction,
    shootingNarrative,
    lightingIntent: photographyBlueprint.lightingIntent ?? "",
    cameraIntent: photographyBlueprint.cameraIntent ?? "",
    materialIntent: photographyBlueprint.materialIntent ?? "",
    providerHints: photographyBlueprint.providerHints ?? [],
    photographyBlueprint,
    confidence,
  };

  const explainability: PhotographyExplainabilityReport = {
    agentId: COMMERCIAL_PHOTO_DIRECTOR_ID,
    selectedStyle: selected,
    alternativesConsidered: alternatives,
    rejectedAlternatives: rejected,
    storyInfluences: [
      ctx.storyType ? `Story type: ${ctx.storyType}` : "",
      ctx.commercialGoal ? `Commercial goal: ${ctx.commercialGoal}` : "",
    ].filter(Boolean),
    sceneInfluences: [
      ctx.sceneType ? `Scene type: ${ctx.sceneType}` : "",
      ctx.environment ? `Environment: ${ctx.environment}` : "",
    ].filter(Boolean),
    layoutInfluences: [
      ctx.layoutTemplateId ? `Layout: ${ctx.layoutTemplateId}` : "",
      ctx.compositionTemplate ? `Composition template: ${ctx.compositionTemplate}` : "",
    ].filter(Boolean),
    productFidelityNotes: [
      ctx.productCutout ? "Cutout product — contact shadows required" : "In-scene product integration",
      "Thumbnail-readable silhouette for marketplace",
    ],
    commercialValue: "Shoot plan reads as advertising photography, not AI art",
    reasoning: [
      `Style ${selected} chosen from story ${ctx.storyType ?? "context"} and scene ${ctx.sceneType ?? "context"}`,
      `Shooting narrative: ${shootingNarrative.slice(0, 80)}…`,
      `Lighting/camera/material intents guide technical directors — no prompt or render params`,
      `Product interaction: ${productInteraction} — supports natural integration`,
    ],
  };

  return { section, explainability };
}

export function validatePhotographySection(
  section: PhotographySection,
  ctx: CommercialPhotoDirectorContext,
): PhotographyValidationReport {
  const violations: string[] = [];
  const text = [
    section.shootingNarrative,
    section.lightingIntent,
    section.cameraIntent,
    section.materialIntent,
    section.photographyBlueprint.visualMood,
  ].join(" ");

  if (!section.photographyStyle) violations.push("MISSING_PHOTO_STYLE");
  if (!section.shootingNarrative || section.shootingNarrative.length < 25) {
    violations.push("MISSING_SHOOTING_NARRATIVE");
  }
  if (PROMPT_KEYWORDS.test(text)) violations.push("CONTAINS_PROMPT");
  if (LAYOUT_KEYWORDS.test(text)) violations.push("CONTAINS_LAYOUT_DECISION");
  if (AI_ART_KEYWORDS.test(text)) violations.push("AI_ART_NOT_COMMERCIAL");
  if (PNG_INSERT_KEYWORDS.test(text)) violations.push("PNG_INSERT_LOOK");

  if (
    ctx.storyType === StoryType.MINIMAL_LUXURY &&
    section.photographyStyle === PhotographyStyle.LIFESTYLE_COMMERCIAL &&
    ctx.primaryEmotion === "luxury"
  ) {
    violations.push("STORY_CONFLICT");
  }

  if (/\b(premium|luxury|ctr|minimal|marketplace|hierarchy)\b/i.test(section.photographyBlueprint.visualMood)) {
    violations.push("AI_ART_NOT_COMMERCIAL");
  }

  return { valid: violations.length === 0, violations, section };
}

export function isPhotographyFailure(code: string): code is PhotographyFailureCode {
  return [
    "STORY_CONFLICT",
    "MISSING_PHOTO_STYLE",
    "PNG_INSERT_LOOK",
    "AI_ART_NOT_COMMERCIAL",
    "MISSING_SHOOTING_NARRATIVE",
    "CONTAINS_LAYOUT_DECISION",
    "CONTAINS_PROMPT",
    "PROVIDER_INCOMPATIBLE",
  ].includes(code);
}

export function photographySectionToMutations(
  section: PhotographySection,
  revision: number,
  reason: string,
): BlueprintMutation[] {
  return updatesToMutations(
    { photography: section.photographyBlueprint },
    COMMERCIAL_PHOTO_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function runCommercialPhotoDirector(input: {
  context: AgentContextPackage;
  directorContext: CommercialPhotoDirectorContext;
}): {
  section: PhotographySection;
  explainability: PhotographyExplainabilityReport;
  confidence: ReturnType<typeof confidenceFromContext>;
  decisionSession: AgentDecisionSession;
  mutations: BlueprintMutation[];
} {
  const memory = buildAgentMemoryPackage({
    agentId: COMMERCIAL_PHOTO_DIRECTOR_ID,
    working: input.context,
  });

  const styleAlts = styleAlternatives(input.directorContext);
  const alternatives = styleAlts.map((id) => {
    const def = PHOTOGRAPHY_STYLE_CATALOG.find((d) => d.id === id);
    return {
      id,
      label: def?.name ?? id,
      summary: def?.summary ?? `Photo style: ${id}`,
      scores: {},
    };
  });

  const evaluations = styleAlts.map((id, index) => ({
    alternativeId: id,
    scores: scoreAlternative([`photo style ${id}`], 0.83 - index * 0.07),
    weightedTotal: 0.83 - index * 0.07,
    notes: [`Evaluated photography style ${id}`],
  }));

  const selectedAlternative = pickBestAlternative(alternatives, evaluations);
  const confidence = confidenceFromContext({
    agentId: COMMERCIAL_PHOTO_DIRECTOR_ID,
    context: input.context,
    evaluations,
    knowledgeAligned: true,
    reasoningSteps: 5,
    constraintsSatisfied: 5,
    constraintsTotal: 5,
  });

  const { section, explainability } = buildPhotographySection(
    input.directorContext,
    confidence.value,
  );

  const decisionSession = new AgentDecisionSession(COMMERCIAL_PHOTO_DIRECTOR_ID)
    .observeFromContext(input.context, memory)
    .interpret([
      `Story: ${input.directorContext.storyType ?? "pending"}`,
      `Scene: ${input.directorContext.sceneType ?? "pending"}`,
      `Layout: ${input.directorContext.layoutTemplateId ?? "pending"}`,
    ])
    .reason(explainability.reasoning)
    .compare(alternatives)
    .evaluate(
      alternatives.map((alt, index) => ({
        alternativeId: alt.id,
        scores: scoreAlternative([alt.summary], 0.77 - index * 0.05),
        weightedTotal: 0.77 - index * 0.05,
        notes: [alt.summary],
      })),
    )
    .decide(selectedAlternative, confidence.value)
    .explain([
      ...explainability.reasoning,
      `Rejected: ${explainability.rejectedAlternatives.map((r) => r.id).join(", ")}`,
      `Commercial value: ${explainability.commercialValue}`,
    ]);

  const mutations = photographySectionToMutations(
    section,
    input.context.blueprint.meta.revision ?? 0,
    explainability.reasoning.join("; "),
  );

  decisionSession.publish(mutations);

  return { section, explainability, confidence, decisionSession, mutations };
}

export function directorContextFromBlueprint(
  blueprint: import("./types").RenderBlueprint,
): CommercialPhotoDirectorContext {
  return {
    productCategory: blueprint.product.category,
    subCategory: blueprint.product.subCategory,
    marketplace: blueprint.creative.marketplace,
    creativeGoal: blueprint.creative.goal,
    priceSegment: blueprint.creative.priceSegment,
    productCutout: blueprint.product.cutout,
    providerId: blueprint.meta.generator,
    storyType: blueprint.story.storyType,
    primaryEmotion: blueprint.story.primaryEmotion,
    commercialGoal: blueprint.story.commercialGoal,
    storyHook: blueprint.story.hook,
    sceneType: blueprint.scene.sceneType,
    environment: blueprint.scene.environmentType ?? blueprint.scene.environment,
    sceneLightingMood: blueprint.scene.lightingMood,
    layoutTemplateId: blueprint.composition.templateId,
    compositionTemplate: blueprint.composition.template,
  };
}

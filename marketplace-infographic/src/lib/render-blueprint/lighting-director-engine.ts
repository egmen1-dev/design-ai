/**
 * Chapter 4.14 — Lighting Director engine.
 * Designs physically plausible lighting from Photography Section — never composition, camera, or prompt.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentDecisionSession, pickBestAlternative, scoreAlternative } from "./agent-decision-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { buildAgentMemoryPackage } from "./agent-memory-engine";
import { confidenceFromContext } from "./agent-confidence-engine";
import type { LightingBlueprint, LightingPresetId } from "./types";
import { updatesToMutations } from "./universal-agent-bridge";
import type { BlueprintMutation } from "./mutation-types";
import { PhotographyStyle } from "./commercial-photo-director-types";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import {
  ColorTemperature,
  LightingScheme,
  LightingStyle,
  type AmbientProfile,
  type ColorTemperatureId,
  type ContrastProfile,
  type LightProfile,
  type LightingDirectorContext,
  type LightingExplainabilityReport,
  type LightingFailureCode,
  type LightingSchemeDefinition,
  type LightingSchemeId,
  type LightingSection,
  type LightingStyleId,
  type LightingValidationReport,
  type ShadowProfile,
} from "./lighting-director-types";

export {
  LightingStyle,
  LightingScheme,
  ColorTemperature,
  type LightingStyleId,
  type LightingSchemeId,
  type ColorTemperatureId,
  type LightProfile,
  type AmbientProfile,
  type ShadowProfile,
  type ContrastProfile,
  type LightingSchemeDefinition,
  type LightingSection,
  type LightingDirectorContext,
  type LightingExplainabilityReport,
  type LightingValidationReport,
  type LightingFailureCode,
} from "./lighting-director-types";

export const LIGHTING_DIRECTOR_VERSION = "4.14.0";

export const LIGHTING_DIRECTOR_GOLDEN_RULE =
  "Lighting Director does not make lighting dramatic — it makes it plausible. " +
  "The buyer should notice the product, not the light.";

export const LIGHTING_DIRECTOR_ID: AgentContractId = "lighting-director";

export const LIGHTING_DIRECTOR_PIPELINE_POSITION = [
  "commercial-photo-director",
  LIGHTING_DIRECTOR_ID,
  "camera-director",
] as const;

export const LIGHTING_SCHEME_CATALOG: readonly LightingSchemeDefinition[] = [
  { id: LightingScheme.SINGLE_SOFT_LIGHT, name: "Single Soft Light", summary: "One dominant soft key" },
  { id: LightingScheme.TWO_POINT_STUDIO, name: "Two Point Studio", summary: "Key + controlled fill" },
  { id: LightingScheme.THREE_POINT_STUDIO, name: "Three Point Studio", summary: "Key, fill, optional rim" },
  { id: LightingScheme.NATURAL_WINDOW_LIGHT, name: "Natural Window Light", summary: "Window key with ambient fill" },
  { id: LightingScheme.TOP_SOFTBOX, name: "Top Softbox", summary: "Overhead marketplace key" },
  { id: LightingScheme.LUXURY_SIDE_LIGHT, name: "Luxury Side Light", summary: "Warm side key for premium products" },
  { id: LightingScheme.EDITORIAL_SOFT_LIGHT, name: "Editorial Soft Light", summary: "Magazine soft wrap" },
  { id: LightingScheme.HIGH_KEY, name: "High Key", summary: "Bright low-contrast commercial" },
  { id: LightingScheme.LOW_KEY, name: "Low Key", summary: "Controlled contrast studio" },
  { id: LightingScheme.DIFFUSED_AMBIENT, name: "Diffused Ambient", summary: "Even ambient-dominated light" },
] as const;

const PROMPT_KEYWORDS = /\b(prompt|negative prompt|flux|cinematic lighting|dramatic god rays)\b/i;
const COMPOSITION_KEYWORDS = /\b(hero area|template|layout|white space)\b/i;
const ARTIFICIAL_KEYWORDS = /\b(neon glow|rgb lights|laser beams|impossible reflections|ten light sources)\b/i;

function schemeAlternatives(ctx: LightingDirectorContext): LightingSchemeId[] {
  const story = ctx.storyType;
  const photo = ctx.photographyStyle;

  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY || photo === PhotographyStyle.LUXURY_ADVERTISING) {
    return [LightingScheme.LUXURY_SIDE_LIGHT, LightingScheme.EDITORIAL_SOFT_LIGHT, LightingScheme.TWO_POINT_STUDIO];
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION || photo === PhotographyStyle.TECHNOLOGY_PRODUCT) {
    return [LightingScheme.TWO_POINT_STUDIO, LightingScheme.TOP_SOFTBOX, LightingScheme.HIGH_KEY];
  }
  if (story === StoryType.HEALTH || photo === PhotographyStyle.MEDICAL_PRODUCT) {
    return [LightingScheme.HIGH_KEY, LightingScheme.DIFFUSED_AMBIENT, LightingScheme.NATURAL_WINDOW_LIGHT];
  }
  if (story === StoryType.SAFETY || story === StoryType.FAMILY) {
    return [LightingScheme.NATURAL_WINDOW_LIGHT, LightingScheme.DIFFUSED_AMBIENT, LightingScheme.SINGLE_SOFT_LIGHT];
  }
  if (ctx.marketplace === "WB" || photo === PhotographyStyle.MODERN_MARKETPLACE) {
    return [LightingScheme.TOP_SOFTBOX, LightingScheme.SINGLE_SOFT_LIGHT, LightingScheme.HIGH_KEY];
  }
  if (ctx.sceneType === SceneType.LUXURY) {
    return [LightingScheme.LUXURY_SIDE_LIGHT, LightingScheme.EDITORIAL_SOFT_LIGHT, LightingScheme.TWO_POINT_STUDIO];
  }
  return [LightingScheme.SINGLE_SOFT_LIGHT, LightingScheme.TWO_POINT_STUDIO, LightingScheme.TOP_SOFTBOX];
}

function selectScheme(ctx: LightingDirectorContext): {
  selected: LightingSchemeId;
  alternatives: LightingSchemeId[];
  rejected: { id: LightingSchemeId; reason: string }[];
} {
  const alternatives = schemeAlternatives(ctx);
  const scores = alternatives.map((id, index) => ({
    id,
    score:
      id === LightingScheme.LUXURY_SIDE_LIGHT &&
      (ctx.storyType === StoryType.PREMIUM_LIFESTYLE || ctx.primaryEmotion === "luxury")
        ? 0.92
        : id === LightingScheme.TOP_SOFTBOX && ctx.marketplace === "WB"
          ? 0.9
          : id === LightingScheme.HIGH_KEY && ctx.photographyStyle === PhotographyStyle.MEDICAL_PRODUCT
            ? 0.88
            : 0.82 - index * 0.06,
  }));
  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0].id;
  const rejected = scores.slice(1).map((s) => ({
    id: s.id,
    reason: `Lower lighting fit for photography ${ctx.photographyStyle ?? "generic"} and story ${ctx.storyType ?? "generic"}`,
  }));
  return { selected, alternatives, rejected };
}

function lightingStyleFor(scheme: LightingSchemeId, ctx: LightingDirectorContext): LightingStyleId {
  if (scheme === LightingScheme.LUXURY_SIDE_LIGHT || scheme === LightingScheme.EDITORIAL_SOFT_LIGHT) {
    return LightingStyle.LUXURY_WARM;
  }
  if (scheme === LightingScheme.HIGH_KEY || scheme === LightingScheme.TOP_SOFTBOX) {
    return LightingStyle.MARKETPLACE_HIGH_KEY;
  }
  if (ctx.photographyStyle === PhotographyStyle.TECHNOLOGY_PRODUCT) {
    return LightingStyle.TECHNOLOGY_COOL;
  }
  if (scheme === LightingScheme.NATURAL_WINDOW_LIGHT) {
    return LightingStyle.NATURAL_WINDOW;
  }
  return LightingStyle.COMMERCIAL_CLEAN;
}

function colorTemperatureFor(style: LightingStyleId): { id: ColorTemperatureId; kelvin: number } {
  switch (style) {
    case LightingStyle.LUXURY_WARM:
      return { id: ColorTemperature.EVENING_WARM, kelvin: 4200 };
    case LightingStyle.TECHNOLOGY_COOL:
      return { id: ColorTemperature.COOL_TECHNOLOGY, kelvin: 6500 };
    case LightingStyle.NATURAL_WINDOW:
      return { id: ColorTemperature.MORNING_SUN, kelvin: 5000 };
    case LightingStyle.EDITORIAL_SOFT:
      return { id: ColorTemperature.WARM_DAYLIGHT, kelvin: 5200 };
    default:
      return { id: ColorTemperature.NEUTRAL_STUDIO, kelvin: 5600 };
  }
}

function keyLightFor(scheme: LightingSchemeId): LightProfile {
  switch (scheme) {
    case LightingScheme.LUXURY_SIDE_LIGHT:
      return { direction: "camera-left", height: "mid", angle: "45deg", intensity: 0.85, sourceSize: "large softbox" };
    case LightingScheme.TOP_SOFTBOX:
      return { direction: "overhead", height: "high", angle: "down-30deg", intensity: 0.8, sourceSize: "large softbox" };
    case LightingScheme.NATURAL_WINDOW_LIGHT:
      return { direction: "camera-right", height: "mid", angle: "window-side", intensity: 0.75, sourceSize: "window panel" };
    case LightingScheme.TWO_POINT_STUDIO:
      return { direction: "camera-left", height: "mid", angle: "35deg", intensity: 0.82, sourceSize: "medium softbox" };
    default:
      return { direction: "front-left", height: "mid", angle: "40deg", intensity: 0.78, sourceSize: "soft key" };
  }
}

function fillLightFor(scheme: LightingSchemeId): LightProfile {
  return {
    direction: "front-right",
    height: "mid",
    angle: "opposite-key",
    intensity: scheme === LightingScheme.HIGH_KEY ? 0.65 : 0.35,
    sourceSize: "bounced fill",
  };
}

function needsRimLight(scheme: LightingSchemeId, ctx: LightingDirectorContext): boolean {
  if (scheme === LightingScheme.THREE_POINT_STUDIO) return true;
  if (ctx.productCutout && scheme !== LightingScheme.HIGH_KEY) return true;
  if (ctx.sceneType === SceneType.NATURAL || ctx.sceneType === SceneType.LIFESTYLE) return true;
  return false;
}

function rimLightFor(): LightProfile {
  return { direction: "behind-left", height: "mid", angle: "rim-edge", intensity: 0.25, sourceSize: "narrow strip" };
}

function ambientFor(scheme: LightingSchemeId): AmbientProfile {
  return {
    level: scheme === LightingScheme.DIFFUSED_AMBIENT || scheme === LightingScheme.HIGH_KEY ? 0.55 : 0.3,
    quality: scheme === LightingScheme.NATURAL_WINDOW_LIGHT ? "natural bounce" : "studio ambient",
  };
}

function shadowFor(scheme: LightingSchemeId, ctx: LightingDirectorContext): ShadowProfile {
  const soft = scheme === LightingScheme.SINGLE_SOFT_LIGHT || scheme === LightingScheme.EDITORIAL_SOFT_LIGHT ? 0.75 : 0.55;
  return {
    softness: soft,
    length: ctx.productCutout ? "short contact" : "medium",
    density: scheme === LightingScheme.LOW_KEY ? "dense" : "moderate",
    direction: "key-opposite",
    contactShadow: ctx.productCutout,
  };
}

function contrastFor(scheme: LightingSchemeId): ContrastProfile {
  if (scheme === LightingScheme.HIGH_KEY || scheme === LightingScheme.DIFFUSED_AMBIENT) {
    return { level: "low", ratio: 1.5 };
  }
  if (scheme === LightingScheme.LOW_KEY) {
    return { level: "high", ratio: 4 };
  }
  return { level: "medium", ratio: 2.5 };
}

function lightingMoodFor(style: LightingStyleId, ctx: LightingDirectorContext): string {
  if (style === LightingStyle.LUXURY_WARM) return "soft warm commercial light reinforcing premium story";
  if (style === LightingStyle.TECHNOLOGY_COOL) return "cool controlled studio light for technology story";
  if (style === LightingStyle.NATURAL_WINDOW) return "warm diffused domestic light for comfort and safety";
  if (ctx.lightingIntent) return `Execute photography intent: ${ctx.lightingIntent.slice(0, 80)}`;
  return "neutral clean commercial lighting for marketplace readability";
}

function legacyPresetFor(scheme: LightingSchemeId): LightingPresetId {
  switch (scheme) {
    case LightingScheme.NATURAL_WINDOW_LIGHT:
      return "window";
    case LightingScheme.LUXURY_SIDE_LIGHT:
      return "golden_hour";
    case LightingScheme.TOP_SOFTBOX:
    case LightingScheme.SINGLE_SOFT_LIGHT:
      return "softbox";
    case LightingScheme.HIGH_KEY:
    case LightingScheme.DIFFUSED_AMBIENT:
      return "overcast";
    default:
      return "studio";
  }
}

function legacyKeyFillRim(scheme: LightingSchemeId, key: LightProfile, fill: LightProfile, rim?: LightProfile) {
  return {
    key: `soft_key_${key.direction.replace(/-/g, "_")}`,
    fill: fill.intensity > 0.5 ? "bright" : "balanced",
    rim: rim ? "subtle" : "none",
    back: scheme === LightingScheme.THREE_POINT_STUDIO ? "subtle" : "none",
  };
}

function providerHintsFor(providerId?: string): string[] {
  const base = [
    "single dominant key source",
    "soft shadow falloff",
    "physically logical temperature",
    "avoid colored gels and multi-rim setups",
  ];
  if (providerId === "flux" || !providerId) {
    return [...base, "FLUX: keep one main light direction", "avoid complex colored bounce"];
  }
  return base;
}

export function buildLightingSection(
  ctx: LightingDirectorContext,
  confidence: number,
): { section: LightingSection; explainability: LightingExplainabilityReport } {
  const { selected, alternatives, rejected } = selectScheme(ctx);
  const style = lightingStyleFor(selected, ctx);
  const { kelvin } = colorTemperatureFor(style);
  const keyLight = keyLightFor(selected);
  const fillLight = fillLightFor(selected);
  const useRim = needsRimLight(selected, ctx);
  const rimLight = useRim ? rimLightFor() : undefined;
  const ambientLight = ambientFor(selected);
  const shadowProfile = shadowFor(selected, ctx);
  const contrastProfile = contrastFor(selected);
  const legacy = legacyKeyFillRim(selected, keyLight, fillLight, rimLight);

  const lightingBlueprint: LightingBlueprint = {
    preset: legacyPresetFor(selected),
    temperature: kelvin,
    key: legacy.key,
    fill: legacy.fill,
    rim: legacy.rim,
    back: legacy.back,
    shadowSoftness: shadowProfile.softness,
    reflectionStrength: style === LightingStyle.LUXURY_WARM ? 0.35 : 0.25,
    lightingStyle: style,
    lightingScheme: selected,
    keyLight,
    fillLight,
    rimLight,
    ambientLight,
    shadowProfile,
    contrastProfile,
    lightingMood: lightingMoodFor(style, ctx),
    providerHints: providerHintsFor(ctx.providerId),
  };

  const section: LightingSection = {
    lightingStyle: style,
    lightingScheme: selected,
    keyLight,
    fillLight,
    rimLight,
    ambientLight,
    shadowProfile,
    contrastProfile,
    colorTemperature: kelvin,
    lightingMood: lightingBlueprint.lightingMood ?? "",
    providerHints: lightingBlueprint.providerHints ?? [],
    lightingBlueprint,
    confidence,
  };

  const explainability: LightingExplainabilityReport = {
    agentId: LIGHTING_DIRECTOR_ID,
    selectedScheme: selected,
    alternativesConsidered: alternatives,
    rejectedAlternatives: rejected,
    storyInfluences: [
      ctx.storyType ? `Story type: ${ctx.storyType}` : "",
      ctx.primaryEmotion ? `Primary emotion: ${ctx.primaryEmotion}` : "",
    ].filter(Boolean),
    photographyInfluences: [
      ctx.photographyStyle ? `Photography style: ${ctx.photographyStyle}` : "",
      ctx.lightingIntent ? `Lighting intent: ${ctx.lightingIntent.slice(0, 60)}` : "",
    ].filter(Boolean),
    productFidelityNotes: [
      ctx.productCutout ? "Contact shadow required for PNG composite" : "In-scene product integration",
      "Marketplace-readable product edges",
    ],
    commercialValue: "Plausible studio light that sells the product, not the lighting setup",
    reasoning: [
      `Scheme ${selected} chosen from photography section — physics-first, not decorative`,
      `Key light ${keyLight.direction} at ${keyLight.angle} forms product volume`,
      `Fill controls contrast without destroying form — intensity ${fillLight.intensity}`,
      useRim ? "Rim light separates product from background" : "No rim — scene reads without edge light",
      `Contact shadow: ${shadowProfile.contactShadow} — supports composite fidelity`,
    ],
  };

  return { section, explainability };
}

export function validateLightingSection(
  section: LightingSection,
  ctx: LightingDirectorContext,
): LightingValidationReport {
  const violations: string[] = [];
  const text = [
    section.lightingMood,
    section.lightingBlueprint.key,
    section.lightingBlueprint.fill,
  ].join(" ");

  if (!ctx.lightingIntent && !ctx.photographyStyle) {
    violations.push("MISSING_PHOTOGRAPHY_INPUT");
  }
  if (!section.keyLight || section.keyLight.intensity <= 0) {
    violations.push("MISSING_LIGHT_SOURCE");
  }
  if (PROMPT_KEYWORDS.test(text)) violations.push("CONTAINS_PROMPT");
  if (COMPOSITION_KEYWORDS.test(text)) violations.push("CONTAINS_COMPOSITION_DECISION");
  if (ARTIFICIAL_KEYWORDS.test(text)) violations.push("ARTIFICIAL_LIGHTING");

  if (
    section.shadowProfile.direction === "key-opposite" &&
    section.keyLight.direction.includes("overhead") &&
    section.shadowProfile.length === "long"
  ) {
    violations.push("SHADOW_DIRECTION_CONFLICT");
  }

  if (ctx.productCutout && !section.shadowProfile.contactShadow) {
    violations.push("PRODUCT_COMPOSITE_INCOMPATIBLE");
  }

  if (section.rimLight && section.fillLight.intensity > 0.7 && section.keyLight.intensity < 0.5) {
    violations.push("TOO_MANY_EFFECTS");
  }

  return { valid: violations.length === 0, violations, section };
}

export function isLightingFailure(code: string): code is LightingFailureCode {
  return [
    "MISSING_LIGHT_SOURCE",
    "SHADOW_DIRECTION_CONFLICT",
    "PRODUCT_COMPOSITE_INCOMPATIBLE",
    "ARTIFICIAL_LIGHTING",
    "TOO_MANY_EFFECTS",
    "MISSING_PHOTOGRAPHY_INPUT",
    "CONTAINS_COMPOSITION_DECISION",
    "CONTAINS_PROMPT",
  ].includes(code);
}

export function lightingSectionToMutations(
  section: LightingSection,
  revision: number,
  reason: string,
): BlueprintMutation[] {
  return updatesToMutations(
    { lighting: section.lightingBlueprint },
    LIGHTING_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function runLightingDirector(input: {
  context: AgentContextPackage;
  directorContext: LightingDirectorContext;
}): {
  section: LightingSection;
  explainability: LightingExplainabilityReport;
  confidence: ReturnType<typeof confidenceFromContext>;
  decisionSession: AgentDecisionSession;
  mutations: BlueprintMutation[];
} {
  const memory = buildAgentMemoryPackage({
    agentId: LIGHTING_DIRECTOR_ID,
    working: input.context,
  });

  const schemeAlts = schemeAlternatives(input.directorContext);
  const alternatives = schemeAlts.map((id) => {
    const def = LIGHTING_SCHEME_CATALOG.find((d) => d.id === id);
    return {
      id,
      label: def?.name ?? id,
      summary: def?.summary ?? `Lighting: ${id}`,
      scores: {},
    };
  });

  const evaluations = schemeAlts.map((id, index) => ({
    alternativeId: id,
    scores: scoreAlternative([`lighting scheme ${id}`], 0.82 - index * 0.07),
    weightedTotal: 0.82 - index * 0.07,
    notes: [`Evaluated lighting scheme ${id}`],
  }));

  const selectedAlternative = pickBestAlternative(alternatives, evaluations);
  const confidence = confidenceFromContext({
    agentId: LIGHTING_DIRECTOR_ID,
    context: input.context,
    evaluations,
    knowledgeAligned: true,
    reasoningSteps: 5,
    constraintsSatisfied: 5,
    constraintsTotal: 5,
  });

  const { section, explainability } = buildLightingSection(
    input.directorContext,
    confidence.value,
  );

  const decisionSession = new AgentDecisionSession(LIGHTING_DIRECTOR_ID)
    .observeFromContext(input.context, memory)
    .interpret([
      `Photography: ${input.directorContext.photographyStyle ?? "pending"}`,
      `Story: ${input.directorContext.storyType ?? "pending"}`,
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

  const mutations = lightingSectionToMutations(
    section,
    input.context.blueprint.meta.revision ?? 0,
    explainability.reasoning.join("; "),
  );

  decisionSession.publish(mutations);

  return { section, explainability, confidence, decisionSession, mutations };
}

export function directorContextFromBlueprint(
  blueprint: import("./types").RenderBlueprint,
): LightingDirectorContext {
  return {
    productCategory: blueprint.product.category,
    marketplace: blueprint.creative.marketplace,
    productCutout: blueprint.product.cutout,
    storyType: blueprint.story.storyType,
    primaryEmotion: blueprint.story.primaryEmotion,
    sceneType: blueprint.scene.sceneType,
    sceneLightingMood: blueprint.scene.lightingMood,
    photographyStyle: blueprint.photography.photographyStyle,
    photoMood: blueprint.photography.photoMood,
    lightingIntent: blueprint.photography.lightingIntent,
    materialPalette: blueprint.scene.materialPalette,
    providerId: blueprint.meta.generator,
  };
}

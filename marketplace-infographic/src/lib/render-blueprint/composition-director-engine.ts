/**
 * Chapter 4.12 — Composition Director engine.
 * Organizes visual space from Story + Scene — never story, environment, lighting, or prompt.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentDecisionSession, pickBestAlternative, scoreAlternative } from "./agent-decision-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { buildAgentMemoryPackage } from "./agent-memory-engine";
import { confidenceFromContext } from "./agent-confidence-engine";
import type { CompositionBlueprint, CompositionTemplateId } from "./types";
import { updatesToMutations } from "./universal-agent-bridge";
import type { BlueprintMutation } from "./mutation-types";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import {
  EyeFlowProfile,
  HierarchyLevel,
  LayoutTemplate,
  type CompositionDirectorContext,
  type CompositionExplainabilityReport,
  type CompositionFailureCode,
  type CompositionValidationReport,
  type EyeFlowProfileId,
  type HierarchyLevelId,
  type LayoutRect,
  type LayoutSection,
  type LayoutTemplateDefinition,
  type LayoutTemplateId,
} from "./composition-director-types";

export {
  LayoutTemplate,
  EyeFlowProfile,
  HierarchyLevel,
  type LayoutTemplateId,
  type EyeFlowProfileId,
  type HierarchyLevelId,
  type LayoutRect,
  type LayoutTemplateDefinition,
  type LayoutSection,
  type CompositionDirectorContext,
  type CompositionExplainabilityReport,
  type CompositionValidationReport,
  type CompositionFailureCode,
} from "./composition-director-types";

export const COMPOSITION_DIRECTOR_VERSION = "4.12.0";

export const COMPOSITION_DIRECTOR_GOLDEN_RULE =
  "Composition Director does not place beautiful elements — it designs the buyer's attention path. " +
  "If the user cannot tell where to look in the first two seconds, the composition failed.";

export const COMPOSITION_DIRECTOR_ID: AgentContractId = "composition-director";

export const COMPOSITION_DIRECTOR_PIPELINE_POSITION = [
  "scene-director",
  COMPOSITION_DIRECTOR_ID,
  "commercial-photo-director",
] as const;

export const LAYOUT_TEMPLATE_CATALOG: readonly LayoutTemplateDefinition[] = [
  { id: LayoutTemplate.MINIMAL_LEFT_HERO, name: "Minimal Left Hero", summary: "Hero left, overlay right" },
  { id: LayoutTemplate.CENTERED_PREMIUM, name: "Centered Premium", summary: "Dominant centered hero" },
  { id: LayoutTemplate.DIAGONAL_FLOW, name: "Diagonal Flow", summary: "Dynamic diagonal eye path" },
  { id: LayoutTemplate.EDITORIAL_SPLIT, name: "Editorial Split", summary: "Magazine-style split" },
  { id: LayoutTemplate.MODERN_MARKETPLACE, name: "Modern Marketplace", summary: "Thumbnail-optimized WB layout" },
  { id: LayoutTemplate.LUXURY_SHOWCASE, name: "Luxury Showcase", summary: "Premium whitespace layout" },
  { id: LayoutTemplate.FEATURE_GRID, name: "Feature Grid", summary: "Structured benefits grid" },
] as const;

const SCENE_KEYWORDS = /\b(kitchen|bathroom|studio|outdoor|lighting|materials|marble|oak)\b/i;
const PROMPT_KEYWORDS = /\b(prompt|negative prompt|flux|beautiful premium|high quality render)\b/i;
const STORY_KEYWORDS = /\b(customer problem|commercial narrative|story type)\b/i;

const DEFAULT_HIERARCHY: HierarchyLevelId[] = [
  HierarchyLevel.HERO,
  HierarchyLevel.HEADLINE,
  HierarchyLevel.BENEFITS,
  HierarchyLevel.BADGE,
  HierarchyLevel.CTA,
  HierarchyLevel.BACKGROUND,
];

type TemplateLayout = Pick<
  LayoutSection,
  "heroArea" | "headlineArea" | "benefitsArea" | "badgeArea" | "ctaArea" | "safeZones" | "eyeFlow" | "whiteSpace"
>;

const TEMPLATE_LAYOUTS: Record<LayoutTemplateId, TemplateLayout> = {
  [LayoutTemplate.MINIMAL_LEFT_HERO]: {
    heroArea: { x: 0.05, y: 0.18, width: 0.44, height: 0.52 },
    headlineArea: { x: 0.54, y: 0.08, width: 0.4, height: 0.12 },
    benefitsArea: { x: 0.54, y: 0.24, width: 0.4, height: 0.28 },
    badgeArea: { x: 0.05, y: 0.06, width: 0.16, height: 0.08 },
    ctaArea: { x: 0.54, y: 0.78, width: 0.32, height: 0.08 },
    safeZones: [
      { x: 0.54, y: 0.06, width: 0.42, height: 0.5 },
      { x: 0.04, y: 0.04, width: 0.2, height: 0.1 },
    ],
    eyeFlow: EyeFlowProfile.HERO_FIRST,
    whiteSpace: 0.28,
  },
  [LayoutTemplate.CENTERED_PREMIUM]: {
    heroArea: { x: 0.22, y: 0.2, width: 0.56, height: 0.48 },
    headlineArea: { x: 0.1, y: 0.06, width: 0.8, height: 0.1 },
    benefitsArea: { x: 0.12, y: 0.72, width: 0.76, height: 0.14 },
    badgeArea: { x: 0.08, y: 0.08, width: 0.14, height: 0.07 },
    ctaArea: { x: 0.34, y: 0.88, width: 0.32, height: 0.07 },
    safeZones: [
      { x: 0.08, y: 0.04, width: 0.84, height: 0.14 },
      { x: 0.1, y: 0.7, width: 0.8, height: 0.2 },
    ],
    eyeFlow: EyeFlowProfile.HERO_FIRST,
    whiteSpace: 0.32,
  },
  [LayoutTemplate.DIAGONAL_FLOW]: {
    heroArea: { x: 0.12, y: 0.22, width: 0.5, height: 0.5 },
    headlineArea: { x: 0.58, y: 0.1, width: 0.34, height: 0.11 },
    benefitsArea: { x: 0.5, y: 0.58, width: 0.42, height: 0.2 },
    badgeArea: { x: 0.08, y: 0.08, width: 0.14, height: 0.07 },
    ctaArea: { x: 0.58, y: 0.82, width: 0.3, height: 0.08 },
    safeZones: [{ x: 0.5, y: 0.08, width: 0.44, height: 0.78 }],
    eyeFlow: EyeFlowProfile.DIAGONAL,
    whiteSpace: 0.24,
  },
  [LayoutTemplate.EDITORIAL_SPLIT]: {
    heroArea: { x: 0.05, y: 0.15, width: 0.48, height: 0.55 },
    headlineArea: { x: 0.56, y: 0.12, width: 0.38, height: 0.14 },
    benefitsArea: { x: 0.56, y: 0.3, width: 0.38, height: 0.3 },
    badgeArea: { x: 0.56, y: 0.06, width: 0.18, height: 0.06 },
    ctaArea: { x: 0.56, y: 0.78, width: 0.3, height: 0.08 },
    safeZones: [{ x: 0.54, y: 0.05, width: 0.4, height: 0.82 }],
    eyeFlow: EyeFlowProfile.HEADLINE_FIRST,
    whiteSpace: 0.26,
  },
  [LayoutTemplate.MODERN_MARKETPLACE]: {
    heroArea: { x: 0.08, y: 0.2, width: 0.42, height: 0.5 },
    headlineArea: { x: 0.54, y: 0.1, width: 0.38, height: 0.11 },
    benefitsArea: { x: 0.54, y: 0.26, width: 0.38, height: 0.24 },
    badgeArea: { x: 0.08, y: 0.08, width: 0.16, height: 0.08 },
    ctaArea: { x: 0.54, y: 0.8, width: 0.28, height: 0.08 },
    safeZones: [
      { x: 0.52, y: 0.08, width: 0.42, height: 0.48 },
      { x: 0.06, y: 0.06, width: 0.18, height: 0.1 },
    ],
    eyeFlow: EyeFlowProfile.HERO_FIRST,
    whiteSpace: 0.25,
  },
  [LayoutTemplate.LUXURY_SHOWCASE]: {
    heroArea: { x: 0.18, y: 0.22, width: 0.64, height: 0.46 },
    headlineArea: { x: 0.12, y: 0.08, width: 0.76, height: 0.1 },
    benefitsArea: { x: 0.16, y: 0.74, width: 0.68, height: 0.12 },
    badgeArea: { x: 0.1, y: 0.1, width: 0.12, height: 0.06 },
    ctaArea: { x: 0.36, y: 0.88, width: 0.28, height: 0.07 },
    safeZones: [
      { x: 0.1, y: 0.06, width: 0.8, height: 0.12 },
      { x: 0.14, y: 0.72, width: 0.72, height: 0.16 },
    ],
    eyeFlow: EyeFlowProfile.HERO_FIRST,
    whiteSpace: 0.35,
  },
  [LayoutTemplate.FEATURE_GRID]: {
    heroArea: { x: 0.1, y: 0.16, width: 0.38, height: 0.46 },
    headlineArea: { x: 0.52, y: 0.1, width: 0.4, height: 0.1 },
    benefitsArea: { x: 0.52, y: 0.24, width: 0.4, height: 0.36 },
    badgeArea: { x: 0.1, y: 0.08, width: 0.14, height: 0.07 },
    ctaArea: { x: 0.52, y: 0.82, width: 0.3, height: 0.08 },
    safeZones: [{ x: 0.5, y: 0.08, width: 0.44, height: 0.78 }],
    eyeFlow: EyeFlowProfile.VERTICAL_STACK,
    whiteSpace: 0.22,
  },
};

function layoutAlternatives(ctx: CompositionDirectorContext): LayoutTemplateId[] {
  const story = ctx.storyType;
  const scene = ctx.sceneType;

  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY) {
    return [LayoutTemplate.LUXURY_SHOWCASE, LayoutTemplate.CENTERED_PREMIUM, LayoutTemplate.EDITORIAL_SPLIT];
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION) {
    return [LayoutTemplate.FEATURE_GRID, LayoutTemplate.MINIMAL_LEFT_HERO, LayoutTemplate.MODERN_MARKETPLACE];
  }
  if (story === StoryType.SAFETY || story === StoryType.FAMILY) {
    return [LayoutTemplate.MODERN_MARKETPLACE, LayoutTemplate.MINIMAL_LEFT_HERO, LayoutTemplate.CENTERED_PREMIUM];
  }
  if (scene === SceneType.LUXURY || scene === SceneType.PREMIUM_SHOWCASE) {
    return [LayoutTemplate.LUXURY_SHOWCASE, LayoutTemplate.CENTERED_PREMIUM, LayoutTemplate.EDITORIAL_SPLIT];
  }
  if (scene === SceneType.TECHNOLOGY) {
    return [LayoutTemplate.FEATURE_GRID, LayoutTemplate.MINIMAL_LEFT_HERO, LayoutTemplate.MODERN_MARKETPLACE];
  }
  if (ctx.marketplace === "WB" || ctx.creativeGoal === "CTR") {
    return [LayoutTemplate.MODERN_MARKETPLACE, LayoutTemplate.MINIMAL_LEFT_HERO, LayoutTemplate.DIAGONAL_FLOW];
  }
  return [LayoutTemplate.MODERN_MARKETPLACE, LayoutTemplate.CENTERED_PREMIUM, LayoutTemplate.MINIMAL_LEFT_HERO];
}

function templateToCompositionTemplate(template: LayoutTemplateId): CompositionTemplateId {
  switch (template) {
    case LayoutTemplate.MINIMAL_LEFT_HERO:
    case LayoutTemplate.EDITORIAL_SPLIT:
    case LayoutTemplate.FEATURE_GRID:
      return "hero_left";
    case LayoutTemplate.CENTERED_PREMIUM:
    case LayoutTemplate.LUXURY_SHOWCASE:
      return "center";
    default:
      return "hero_right";
  }
}

function eyeFlowSteps(profile: EyeFlowProfileId): string[] {
  switch (profile) {
    case EyeFlowProfile.HEADLINE_FIRST:
      return ["headline", "hero", "benefits", "cta"];
    case EyeFlowProfile.DIAGONAL:
      return ["hero", "headline", "benefits", "badge"];
    case EyeFlowProfile.VERTICAL_STACK:
      return ["hero", "headline", "benefits", "cta"];
    default:
      return ["hero", "headline", "benefits", "badge", "cta"];
  }
}

function selectTemplate(ctx: CompositionDirectorContext): {
  selected: LayoutTemplateId;
  alternatives: LayoutTemplateId[];
  rejected: { id: LayoutTemplateId; reason: string }[];
} {
  const alternatives = layoutAlternatives(ctx);
  const scores = alternatives.map((id, index) => ({
    id,
    score:
      id === LayoutTemplate.LUXURY_SHOWCASE &&
      (ctx.storyType === StoryType.PREMIUM_LIFESTYLE || ctx.primaryEmotion === "luxury")
        ? 0.92
        : id === LayoutTemplate.MODERN_MARKETPLACE && ctx.marketplace === "WB"
          ? 0.9
          : id === LayoutTemplate.FEATURE_GRID && ctx.storyType === StoryType.TECHNOLOGY
            ? 0.88
            : 0.82 - index * 0.06,
  }));
  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0].id;
  const rejected = scores.slice(1).map((s) => ({
    id: s.id,
    reason: `Lower layout fit for story ${ctx.storyType ?? "generic"} and scene ${ctx.sceneType ?? "generic"}`,
  }));
  return { selected, alternatives, rejected };
}

export function rectsOverlap(a: LayoutRect, b: LayoutRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function buildLayoutSection(
  ctx: CompositionDirectorContext,
  confidence: number,
): { section: LayoutSection; explainability: CompositionExplainabilityReport } {
  const { selected, alternatives, rejected } = selectTemplate(ctx);
  const layout = TEMPLATE_LAYOUTS[selected];
  const eyeFlowStepsList = eyeFlowSteps(layout.eyeFlow);

  const compositionBlueprint: CompositionBlueprint = {
    template: templateToCompositionTemplate(selected),
    heroWeight: Math.round((1 - layout.whiteSpace) * 70),
    negativeSpace: Math.round(layout.whiteSpace * 100),
    balance: selected === LayoutTemplate.CENTERED_PREMIUM ? 0.6 : 0.55,
    eyeFlow: eyeFlowStepsList,
    foreground: true,
    midground: selected !== LayoutTemplate.LUXURY_SHOWCASE,
    background: true,
    templateId: selected,
    heroArea: layout.heroArea,
    headlineArea: layout.headlineArea,
    benefitsArea: layout.benefitsArea,
    badgeArea: layout.badgeArea,
    ctaArea: layout.ctaArea,
    safeZones: layout.safeZones,
    visualHierarchy: [...DEFAULT_HIERARCHY],
    eyeFlowProfile: layout.eyeFlow,
    whiteSpace: layout.whiteSpace,
  };

  const section: LayoutSection = {
    templateId: selected,
    heroArea: layout.heroArea,
    headlineArea: layout.headlineArea,
    benefitsArea: layout.benefitsArea,
    badgeArea: layout.badgeArea,
    ctaArea: layout.ctaArea,
    safeZones: layout.safeZones,
    visualHierarchy: [...DEFAULT_HIERARCHY],
    whiteSpace: layout.whiteSpace,
    eyeFlow: layout.eyeFlow,
    compositionBlueprint,
    confidence,
  };

  const explainability: CompositionExplainabilityReport = {
    agentId: COMPOSITION_DIRECTOR_ID,
    selectedTemplate: selected,
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
    constraintsApplied: [
      ctx.mustLeaveHeadlineSpace ? "headline safe zone reserved" : "",
      ctx.mustLeaveBenefitsSpace ? "benefits safe zone reserved" : "",
      ctx.mustLeaveBadgeSpace ? "badge safe zone reserved" : "",
      ctx.mustAvoidHeroOverlap ? "hero kept clear of overlay zones" : "",
      `thumbnail readability for ${ctx.marketplace}`,
    ].filter(Boolean),
    commercialValue: "Layout guides attention to product value within 2 seconds",
    reasoning: [
      `Template ${selected} chosen from story and scene — not decoration`,
      `Hero dominates at (${layout.heroArea.x}, ${layout.heroArea.y}) with ${Math.round(layout.heroArea.width * 100)}% width`,
      `Eye flow: ${eyeFlowStepsList.join(" → ")}`,
      `White space ${Math.round(layout.whiteSpace * 100)}% supports HTML overlay`,
      `No scene, lighting, material, or prompt decisions`,
    ],
  };

  return { section, explainability };
}

export function validateLayoutSection(
  section: LayoutSection,
  ctx: CompositionDirectorContext,
): CompositionValidationReport {
  const violations: string[] = [];

  if (!section.visualHierarchy?.length || section.visualHierarchy[0] !== HierarchyLevel.HERO) {
    violations.push("NO_VISUAL_HIERARCHY");
  }
  if (!section.eyeFlow) violations.push("MISSING_EYE_FLOW");
  if (section.whiteSpace < 0.2) violations.push("INSUFFICIENT_WHITE_SPACE");
  if (section.safeZones.length === 0) violations.push("OVERLOADED_LAYOUT");

  if (ctx.mustAvoidHeroOverlap) {
    if (rectsOverlap(section.heroArea, section.headlineArea)) {
      violations.push("HERO_OVERLAY_CONFLICT");
    }
    if (rectsOverlap(section.heroArea, section.benefitsArea)) {
      violations.push("HERO_OVERLAY_CONFLICT");
    }
  }

  const text = section.compositionBlueprint.eyeFlow.join(" ");
  if (SCENE_KEYWORDS.test(text)) violations.push("CONTAINS_SCENE_DECISION");
  if (PROMPT_KEYWORDS.test(text)) violations.push("CONTAINS_PROMPT");
  if (STORY_KEYWORDS.test(text)) violations.push("CONTAINS_SCENE_DECISION");

  return { valid: violations.length === 0, violations, section };
}

export function isCompositionFailure(code: string): code is CompositionFailureCode {
  return [
    "HERO_OVERLAY_CONFLICT",
    "MISSING_EYE_FLOW",
    "INSUFFICIENT_WHITE_SPACE",
    "OVERLOADED_LAYOUT",
    "NO_VISUAL_HIERARCHY",
    "CONTAINS_SCENE_DECISION",
    "CONTAINS_PROMPT",
  ].includes(code);
}

export function layoutSectionToMutations(
  section: LayoutSection,
  revision: number,
  reason: string,
): BlueprintMutation[] {
  return updatesToMutations(
    { composition: section.compositionBlueprint },
    COMPOSITION_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function runCompositionDirector(input: {
  context: AgentContextPackage;
  directorContext: CompositionDirectorContext;
}): {
  section: LayoutSection;
  explainability: CompositionExplainabilityReport;
  confidence: ReturnType<typeof confidenceFromContext>;
  decisionSession: AgentDecisionSession;
  mutations: BlueprintMutation[];
} {
  const memory = buildAgentMemoryPackage({
    agentId: COMPOSITION_DIRECTOR_ID,
    working: input.context,
  });

  const templateAlts = layoutAlternatives(input.directorContext);
  const alternatives = templateAlts.map((id) => {
    const def = LAYOUT_TEMPLATE_CATALOG.find((d) => d.id === id);
    return {
      id,
      label: def?.name ?? id,
      summary: def?.summary ?? `Layout: ${id}`,
      scores: {},
    };
  });

  const evaluations = templateAlts.map((id, index) => ({
    alternativeId: id,
    scores: scoreAlternative([`template ${id}`], 0.83 - index * 0.07),
    weightedTotal: 0.83 - index * 0.07,
    notes: [`Evaluated layout template ${id}`],
  }));

  const selectedAlternative = pickBestAlternative(alternatives, evaluations);
  const confidence = confidenceFromContext({
    agentId: COMPOSITION_DIRECTOR_ID,
    context: input.context,
    evaluations,
    knowledgeAligned: true,
    reasoningSteps: 4,
    constraintsSatisfied: 5,
    constraintsTotal: 5,
  });

  const { section, explainability } = buildLayoutSection(
    input.directorContext,
    confidence.value,
  );

  const decisionSession = new AgentDecisionSession(COMPOSITION_DIRECTOR_ID)
    .observeFromContext(input.context, memory)
    .interpret([
      `Story: ${input.directorContext.storyType ?? "pending"}`,
      `Scene: ${input.directorContext.sceneType ?? "pending"}`,
      `Marketplace: ${input.directorContext.marketplace}`,
    ])
    .reason(explainability.reasoning)
    .compare(alternatives)
    .evaluate(
      alternatives.map((alt, index) => ({
        alternativeId: alt.id,
        scores: scoreAlternative([alt.summary], 0.78 - index * 0.05),
        weightedTotal: 0.78 - index * 0.05,
        notes: [alt.summary],
      })),
    )
    .decide(selectedAlternative, confidence.value)
    .explain([
      ...explainability.reasoning,
      `Rejected: ${explainability.rejectedAlternatives.map((r) => r.id).join(", ")}`,
      `Commercial value: ${explainability.commercialValue}`,
    ]);

  const mutations = layoutSectionToMutations(
    section,
    input.context.blueprint.meta.revision ?? 0,
    explainability.reasoning.join("; "),
  );

  decisionSession.publish(mutations);

  return { section, explainability, confidence, decisionSession, mutations };
}

export function directorContextFromBlueprint(
  blueprint: import("./types").RenderBlueprint,
): CompositionDirectorContext {
  return {
    productCategory: blueprint.product.category,
    marketplace: blueprint.creative.marketplace,
    creativeGoal: blueprint.creative.goal,
    priceSegment: blueprint.creative.priceSegment,
    productCutout: blueprint.product.cutout,
    aspectRatio: blueprint.render.aspectRatio,
    storyType: blueprint.story.storyType,
    commercialGoal: blueprint.story.commercialGoal,
    primaryEmotion: blueprint.story.primaryEmotion,
    sceneType: blueprint.scene.sceneType,
    environment: blueprint.scene.environmentType ?? blueprint.scene.environment,
    mustLeaveHeadlineSpace: blueprint.constraints.mustLeaveHeadlineSpace,
    mustLeaveBadgeSpace: blueprint.constraints.mustLeaveBadgeSpace,
    mustLeaveBenefitsSpace: blueprint.constraints.mustLeaveBenefitsSpace,
    mustAvoidHeroOverlap: blueprint.constraints.mustAvoidHeroOverlap,
  };
}

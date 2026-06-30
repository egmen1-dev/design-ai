/**
 * Chapter 4.10 — Visual Story Director engine.
 * Creates commercial meaning — never scene, composition, or prompt.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentDecisionSession, pickBestAlternative, scoreAlternative } from "./agent-decision-engine";
import { buildAgentContextPackage } from "./agent-context-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { buildAgentMemoryPackage } from "./agent-memory-engine";
import { confidenceFromContext } from "./agent-confidence-engine";
import type { EmotionalToneId, StoryBlueprint } from "./types";
import { updatesToMutations } from "./universal-agent-bridge";
import type { BlueprintMutation } from "./mutation-types";
import {
  CommercialGoal,
  CustomerIntent,
  PrimaryEmotion,
  StoryType,
  VisualHook,
  type CommercialGoalId,
  type CustomerIntentId,
  type PrimaryEmotionId,
  type StoryDirectorContext,
  type StoryExplainabilityReport,
  type StoryFailureCode,
  type StorySection,
  type StoryTypeDefinition,
  type StoryTypeId,
  type StoryValidationReport,
  type VisualHookId,
} from "./visual-story-director-types";

export {
  StoryType,
  CommercialGoal,
  CustomerIntent,
  VisualHook,
  PrimaryEmotion,
  type StoryTypeId,
  type CommercialGoalId,
  type CustomerIntentId,
  type VisualHookId,
  type PrimaryEmotionId,
  type StoryTypeDefinition,
  type StorySection,
  type StoryDirectorContext,
  type StoryExplainabilityReport,
  type StoryValidationReport,
  type StoryFailureCode,
} from "./visual-story-director-types";

export const VISUAL_STORY_DIRECTOR_VERSION = "4.10.0";

export const VISUAL_STORY_DIRECTOR_GOLDEN_RULE =
  "Visual Story Director never creates an image — it creates meaning. " +
  "If Story can be removed without changing the infographic, the agent failed its job.";

export const VISUAL_STORY_DIRECTOR_ID: AgentContractId = "visual-story-director";

/** First Creative Director in pipeline — Analysis → Story → Scene */
export const VISUAL_STORY_PIPELINE_POSITION = [
  "product-analyzer",
  "creative-engine",
  VISUAL_STORY_DIRECTOR_ID,
  "scene-director",
] as const;

export const STORY_TYPE_CATALOG: readonly StoryTypeDefinition[] = [
  { id: StoryType.PROBLEM_SOLUTION, name: "Problem → Solution", summary: "Pain point resolved by product" },
  { id: StoryType.TRANSFORMATION, name: "Transformation", summary: "Before/after value shift" },
  { id: StoryType.PREMIUM_LIFESTYLE, name: "Premium Lifestyle", summary: "Aspirational ownership" },
  { id: StoryType.PROFESSIONAL_AUTHORITY, name: "Professional Authority", summary: "Expert-grade reliability" },
  { id: StoryType.COMFORT, name: "Comfort", summary: "Ease and everyday pleasure" },
  { id: StoryType.SAFETY, name: "Safety", summary: "Protection and peace of mind" },
  { id: StoryType.INNOVATION, name: "Innovation", summary: "Cutting-edge capability" },
  { id: StoryType.MINIMAL_LUXURY, name: "Minimal Luxury", summary: "Refined simplicity" },
  { id: StoryType.SPEED, name: "Speed", summary: "Instant results" },
  { id: StoryType.EFFICIENCY, name: "Efficiency", summary: "Time and effort saved" },
  { id: StoryType.EMOTIONAL_GIFT, name: "Emotional Gift", summary: "Gift-worthy delight" },
  { id: StoryType.TRUST, name: "Trust", summary: "Credibility and reassurance" },
  { id: StoryType.HEALTH, name: "Health", summary: "Wellbeing improvement" },
  { id: StoryType.FAMILY, name: "Family", summary: "Care for loved ones" },
  { id: StoryType.TECHNOLOGY, name: "Technology", summary: "Smart modern living" },
  { id: StoryType.BEFORE_AFTER, name: "Before → After", summary: "Visible improvement" },
] as const;

const SCENE_KEYWORDS =
  /\b(kitchen|bathroom|studio|outdoor|street|park|apartment|room|lighting|camera|composition|hero scale|template|badge|white space|flux|prompt)\b/i;

const PROMPT_KEYWORDS = /\b(prompt|negative prompt|beautiful premium|soft light|high quality render)\b/i;

function emotionToTone(emotion: PrimaryEmotionId): EmotionalToneId {
  const map: Partial<Record<PrimaryEmotionId, EmotionalToneId>> = {
    [PrimaryEmotion.TRUST]: "confident",
    [PrimaryEmotion.CONFIDENCE]: "confident",
    [PrimaryEmotion.LUXURY]: "luxury",
    [PrimaryEmotion.COMFORT]: "warm",
    [PrimaryEmotion.SAFETY]: "calm",
    [PrimaryEmotion.CALMNESS]: "calm",
    [PrimaryEmotion.EXCITEMENT]: "innovative",
    [PrimaryEmotion.CURIOSITY]: "innovative",
    [PrimaryEmotion.JOY]: "warm",
  };
  return map[emotion] ?? "confident";
}

function storyAlternatives(ctx: StoryDirectorContext): StoryTypeId[] {
  const base: StoryTypeId[] = [StoryType.PROBLEM_SOLUTION, StoryType.TRUST, StoryType.INNOVATION];
  if (ctx.productCategory.includes("baby") || ctx.productCategory.includes("child")) {
    return [StoryType.SAFETY, StoryType.FAMILY, StoryType.TRUST];
  }
  if (ctx.creativeGoal === "Luxury" || ctx.creativeGoal === "Premium") {
    return [StoryType.PREMIUM_LIFESTYLE, StoryType.MINIMAL_LUXURY, StoryType.TRUST];
  }
  if (ctx.creativeGoal === "Technical") {
    return [StoryType.PROFESSIONAL_AUTHORITY, StoryType.TECHNOLOGY, StoryType.EFFICIENCY];
  }
  if (ctx.creativeGoal === "Lifestyle") {
    return [StoryType.COMFORT, StoryType.FAMILY, StoryType.PREMIUM_LIFESTYLE];
  }
  return base;
}

function isChildCategory(ctx: StoryDirectorContext): boolean {
  return ctx.productCategory.includes("baby") || ctx.productCategory.includes("child");
}

function selectStoryType(ctx: StoryDirectorContext): {
  selected: StoryTypeId;
  alternatives: StoryTypeId[];
  rejected: { id: StoryTypeId; reason: string }[];
} {
  const alternatives = storyAlternatives(ctx);
  const childCategory = isChildCategory(ctx);
  const scores = alternatives.map((id, index) => ({
    id,
    score:
      childCategory && id === StoryType.SAFETY
        ? 0.92
        : id === StoryType.TRUST
          ? 0.85
          : 0.8 - index * 0.05 + (ctx.creativeGoal === "Technical" && id === StoryType.TECHNOLOGY ? 0.1 : 0),
  }));
  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0].id;
  const rejected = scores.slice(1).map((s) => ({
    id: s.id,
    reason: `Lower commercial fit for ${ctx.creativeGoal}/${ctx.productCategory}`,
  }));
  return { selected, alternatives, rejected };
}

function commercialGoalFor(storyType: StoryTypeId, creativeGoal: string): CommercialGoalId {
  if (storyType === StoryType.SAFETY || storyType === StoryType.TRUST) return CommercialGoal.INCREASE_TRUST;
  if (storyType === StoryType.INNOVATION || storyType === StoryType.TECHNOLOGY) {
    return CommercialGoal.HIGHLIGHT_INNOVATION;
  }
  if (creativeGoal === "CTR" || creativeGoal === "Lifestyle") return CommercialGoal.INCREASE_CTR;
  if (storyType === StoryType.PREMIUM_LIFESTYLE || storyType === StoryType.MINIMAL_LUXURY) {
    return CommercialGoal.INCREASE_PREMIUM;
  }
  return CommercialGoal.INCREASE_CONVERSION;
}

function customerIntentFor(ctx: StoryDirectorContext): CustomerIntentId {
  if (ctx.creativeGoal === "Technical") return CustomerIntent.VERIFY_QUALITY;
  if (ctx.priceSegment === "premium") return CustomerIntent.CHOOSE;
  return CustomerIntent.SOLVE_PROBLEM;
}

function visualHookFor(storyType: StoryTypeId): VisualHookId {
  switch (storyType) {
    case StoryType.MINIMAL_LUXURY:
    case StoryType.PREMIUM_LIFESTYLE:
      return VisualHook.LUXURY_SIMPLICITY;
    case StoryType.PROFESSIONAL_AUTHORITY:
    case StoryType.TECHNOLOGY:
      return VisualHook.PROFESSIONAL_DETAIL;
    case StoryType.SAFETY:
    case StoryType.FAMILY:
      return VisualHook.POWERFUL_EMOTION;
    case StoryType.INNOVATION:
      return VisualHook.UNEXPECTED_PERSPECTIVE;
    default:
      return VisualHook.STRONG_CONTRAST;
  }
}

function primaryEmotionFor(storyType: StoryTypeId): PrimaryEmotionId {
  switch (storyType) {
    case StoryType.SAFETY:
    case StoryType.TRUST:
      return PrimaryEmotion.TRUST;
    case StoryType.PREMIUM_LIFESTYLE:
    case StoryType.MINIMAL_LUXURY:
      return PrimaryEmotion.LUXURY;
    case StoryType.COMFORT:
    case StoryType.FAMILY:
      return PrimaryEmotion.COMFORT;
    case StoryType.INNOVATION:
    case StoryType.TECHNOLOGY:
      return PrimaryEmotion.CURIOSITY;
    default:
      return PrimaryEmotion.CONFIDENCE;
  }
}

function narrativeFor(storyType: StoryTypeId, ctx: StoryDirectorContext): {
  hook: string;
  problem: string;
  desire: string;
  promise: string;
  narrative: string;
} {
  const product = ctx.subCategory ?? ctx.productCategory;
  switch (storyType) {
    case StoryType.SAFETY:
      return {
        hook: `Безопасность ${product} для семьи`,
        problem: "родители ищут надёжную защиту",
        desire: "спокойствие в повседневных ситуациях",
        promise: "ощущение абсолютной надёжности",
        narrative: `История о безопасности ребёнка и уверенности родителей — ${product}`,
      };
    case StoryType.PREMIUM_LIFESTYLE:
      return {
        hook: `Премиальный образ жизни с ${product}`,
        problem: "стандартные решения не передают статус",
        desire: "ощущение исключительного качества",
        promise: "визуальное подтверждение премиальности",
        narrative: `Премиальная история для ${product} на ${ctx.marketplace}`,
      };
    case StoryType.TECHNOLOGY:
      return {
        hook: `Инновация ${product}`,
        problem: "сложно показать технологическое преимущество",
        desire: "понять прогрессивность продукта",
        promise: "ясная демонстрация инновации",
        narrative: `Технологическая история — ${product}`,
      };
    default:
      return {
        hook: `Ценность ${product} для покупателя`,
        problem: "нужно быстро понять пользу товара",
        desire: "уверенность в правильном выборе",
        promise: "мгновенное понимание главной выгоды",
        narrative: `Коммерческая история ${storyType.replace(/_/g, " ")} — ${product}`,
      };
  }
}

export function buildStorySection(
  ctx: StoryDirectorContext,
  confidence: number,
): { section: StorySection; explainability: StoryExplainabilityReport } {
  const { selected, alternatives, rejected } = selectStoryType(ctx);
  const commercialGoal = commercialGoalFor(selected, ctx.creativeGoal);
  const primaryEmotion = primaryEmotionFor(selected);
  const copy = narrativeFor(selected, ctx);

  const storyBlueprint: StoryBlueprint = {
    hook: copy.hook,
    customerProblem: copy.problem,
    customerDesire: copy.desire,
    visualPromise: copy.promise,
    emotionalTone: emotionToTone(primaryEmotion),
    narrative: copy.narrative,
    storyType: selected,
    customerIntent: customerIntentFor(ctx),
    visualHook: visualHookFor(selected),
    primaryEmotion,
    commercialGoal,
  };

  const section: StorySection = {
    storyType: selected,
    customerIntent: customerIntentFor(ctx),
    visualHook: visualHookFor(selected),
    primaryEmotion,
    storyBlueprint,
    commercialGoal,
    confidence,
  };

  const explainability: StoryExplainabilityReport = {
    agentId: VISUAL_STORY_DIRECTOR_ID,
    selectedStoryType: selected,
    commercialGoal,
    alternativesConsidered: alternatives,
    rejectedAlternatives: rejected,
    sectionsUsed: ["product", "creative"],
    commercialTask: commercialGoal.replace(/_/g, " "),
    reasoning: [
      `Story type ${selected} matches category ${ctx.productCategory} and goal ${ctx.creativeGoal}`,
      `Primary emotion: ${primaryEmotion} — no scene or composition decisions`,
      `Visual hook idea: ${visualHookFor(selected)} — realization deferred to downstream agents`,
    ],
  };

  return { section, explainability };
}

export function validateStorySection(section: StorySection, ctx: StoryDirectorContext): StoryValidationReport {
  const violations: string[] = [];

  if (!section.commercialGoal) violations.push("MISSING_COMMERCIAL_GOAL");
  if (!section.primaryEmotion) violations.push("MISSING_PRIMARY_EMOTION");

  const text = [
    section.storyBlueprint.narrative,
    section.storyBlueprint.hook,
    section.storyBlueprint.visualPromise,
  ].join(" ");

  if (SCENE_KEYWORDS.test(text)) violations.push("CONTAINS_SCENE_DECISION");
  if (PROMPT_KEYWORDS.test(text)) violations.push("CONTAINS_PROMPT");
  if (/\b(hero|badge|template|white space)\b/i.test(text)) {
    violations.push("CONTAINS_COMPOSITION_DECISION");
  }

  if (section.storyBlueprint.hook.length < 5) violations.push("NO_PURCHASE_HELP");
  if (ctx.productCategory === "electronics" && section.storyType === StoryType.FAMILY) {
    violations.push("CATEGORY_MISMATCH");
  }

  return { valid: violations.length === 0, violations, section };
}

export function isStoryFailure(code: string): code is StoryFailureCode {
  return [
    "MISSING_COMMERCIAL_GOAL",
    "CATEGORY_MISMATCH",
    "MISSING_PRIMARY_EMOTION",
    "PRODUCT_CONFLICT",
    "NOT_VISUALLY_REALIZABLE",
    "NO_PURCHASE_HELP",
    "CONTAINS_SCENE_DECISION",
    "CONTAINS_COMPOSITION_DECISION",
    "CONTAINS_PROMPT",
  ].includes(code);
}

export function storySectionToMutations(
  section: StorySection,
  revision: number,
  reason: string,
): BlueprintMutation[] {
  return updatesToMutations(
    { story: section.storyBlueprint },
    VISUAL_STORY_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function runVisualStoryDirector(input: {
  context: AgentContextPackage;
  directorContext: StoryDirectorContext;
}): {
  section: StorySection;
  explainability: StoryExplainabilityReport;
  confidence: ReturnType<typeof confidenceFromContext>;
  decisionSession: AgentDecisionSession;
  mutations: BlueprintMutation[];
} {
  const memory = buildAgentMemoryPackage({
    agentId: VISUAL_STORY_DIRECTOR_ID,
    working: input.context,
  });

  const storyAlts = storyAlternatives(input.directorContext);
  const alternatives = storyAlts.map((id) => {
    const def = STORY_TYPE_CATALOG.find((d) => d.id === id);
    return {
      id,
      label: def?.name ?? id,
      summary: def?.summary ?? `Story angle: ${id}`,
      scores: {},
    };
  });

  const evaluations = storyAlts.map((id, index) => ({
    alternativeId: id,
    scores: scoreAlternative([`story type ${id}`], 0.85 - index * 0.08),
    weightedTotal: 0.85 - index * 0.08,
    notes: [`Evaluated story type ${id}`],
  }));

  const selectedAlternative = pickBestAlternative(alternatives, evaluations);
  const confidence = confidenceFromContext({
    agentId: VISUAL_STORY_DIRECTOR_ID,
    context: input.context,
    evaluations,
    knowledgeAligned: true,
    reasoningSteps: 3,
    constraintsSatisfied: 5,
    constraintsTotal: 5,
  });

  const { section, explainability } = buildStorySection(
    input.directorContext,
    confidence.value,
  );

  const decisionSession = new AgentDecisionSession(VISUAL_STORY_DIRECTOR_ID)
    .observeFromContext(input.context, memory)
    .interpret([
      `Category: ${input.directorContext.productCategory}`,
      `Goal: ${input.directorContext.creativeGoal}`,
      `Marketplace: ${input.directorContext.marketplace}`,
    ])
    .reason(explainability.reasoning)
    .compare(alternatives)
    .evaluate(
      alternatives.map((alt, index) => ({
        alternativeId: alt.id,
        scores: scoreAlternative([alt.summary], 0.8 - index * 0.05),
        weightedTotal: 0.8 - index * 0.05,
        notes: [alt.summary],
      })),
    )
    .decide(selectedAlternative, confidence.value)
    .explain([
      ...explainability.reasoning,
      `Rejected: ${explainability.rejectedAlternatives.map((r) => r.id).join(", ")}`,
      `Commercial task: ${explainability.commercialTask}`,
    ]);

  const mutations = storySectionToMutations(
    section,
    input.context.blueprint.meta.revision ?? 0,
    explainability.reasoning.join("; "),
  );

  decisionSession.publish(mutations);

  return { section, explainability, confidence, decisionSession, mutations };
}

export function directorContextFromBlueprint(
  blueprint: import("./types").RenderBlueprint,
): StoryDirectorContext {
  return {
    productCategory: blueprint.product.category,
    subCategory: blueprint.product.subCategory,
    creativeGoal: blueprint.creative.goal,
    marketplace: blueprint.creative.marketplace,
    priceSegment: blueprint.creative.priceSegment,
    audience: blueprint.creative.audience,
  };
}

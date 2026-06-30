/**
 * Chapter 4.11 — Scene Director engine.
 * Projects physical world from Story — never composition or prompt.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentDecisionSession, pickBestAlternative, scoreAlternative } from "./agent-decision-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { buildAgentMemoryPackage } from "./agent-memory-engine";
import { confidenceFromContext } from "./agent-confidence-engine";
import type {
  SceneArchitectureId,
  SceneBlueprint,
  SceneDepthId,
  SceneEnvironmentId,
  SceneTimeOfDayId,
} from "./types";
import { updatesToMutations } from "./universal-agent-bridge";
import type { BlueprintMutation } from "./mutation-types";
import { StoryType, type StoryTypeId } from "./visual-story-director-types";
import {
  DepthProfile,
  EnvironmentType,
  SceneType,
  type DepthProfileId,
  type EnvironmentDefinition,
  type EnvironmentTypeId,
  type SceneDirectorContext,
  type SceneExplainabilityReport,
  type SceneFailureCode,
  type SceneSection,
  type SceneTypeDefinition,
  type SceneTypeId,
  type SceneValidationReport,
} from "./scene-director-types";

export {
  SceneType,
  EnvironmentType,
  DepthProfile,
  type SceneTypeId,
  type EnvironmentTypeId,
  type DepthProfileId,
  type SceneTypeDefinition,
  type EnvironmentDefinition,
  type SceneSection,
  type SceneDirectorContext,
  type SceneExplainabilityReport,
  type SceneValidationReport,
  type SceneFailureCode,
} from "./scene-director-types";

export const SCENE_DIRECTOR_VERSION = "4.11.0";

export const SCENE_DIRECTOR_GOLDEN_RULE =
  "Scene Director does not create a beautiful background — it designs a physical world " +
  "where the product naturally belongs. If removing the product leaves a random AI background, the agent failed.";

export const SCENE_DIRECTOR_ID: AgentContractId = "scene-director";

export const SCENE_DIRECTOR_PIPELINE_POSITION = [
  "visual-story-director",
  SCENE_DIRECTOR_ID,
  "composition-director",
] as const;

export const SCENE_TYPE_CATALOG: readonly SceneTypeDefinition[] = [
  { id: SceneType.LIFESTYLE, name: "Lifestyle", summary: "Contextual everyday use" },
  { id: SceneType.COMMERCIAL_STUDIO, name: "Commercial Studio", summary: "Controlled product showcase" },
  { id: SceneType.PREMIUM_SHOWCASE, name: "Premium Showcase", summary: "High-end presentation" },
  { id: SceneType.EDITORIAL, name: "Editorial", summary: "Magazine-quality context" },
  { id: SceneType.MINIMAL, name: "Minimal", summary: "Reduced visual noise" },
  { id: SceneType.ARCHITECTURAL, name: "Architectural", summary: "Spatial structure focus" },
  { id: SceneType.TECHNOLOGY, name: "Technology", summary: "Modern tech environment" },
  { id: SceneType.MEDICAL, name: "Medical", summary: "Clinical cleanliness" },
  { id: SceneType.INDUSTRIAL, name: "Industrial", summary: "Workshop-grade setting" },
  { id: SceneType.LUXURY, name: "Luxury", summary: "Premium material world" },
  { id: SceneType.MACRO, name: "Macro", summary: "Close surface context" },
  { id: SceneType.NATURAL, name: "Natural", summary: "Organic outdoor feel" },
  { id: SceneType.FLOATING_COMPOSITION, name: "Floating Composition", summary: "Isolated product space" },
] as const;

export const ENVIRONMENT_CATALOG: readonly EnvironmentDefinition[] = [
  { id: EnvironmentType.PREMIUM_STUDIO, name: "Premium Studio", summary: "Refined controlled set" },
  { id: EnvironmentType.MINIMAL_STUDIO, name: "Minimal Studio", summary: "Clean neutral volume" },
  { id: EnvironmentType.LUXURY_INTERIOR, name: "Luxury Interior", summary: "Aspirational living space" },
  { id: EnvironmentType.MODERN_KITCHEN, name: "Modern Kitchen", summary: "Bright domestic kitchen" },
  { id: EnvironmentType.LIVING_ROOM, name: "Living Room", summary: "Comfortable home interior" },
  { id: EnvironmentType.BATHROOM, name: "Bathroom", summary: "Spa-like hygiene space" },
  { id: EnvironmentType.OFFICE, name: "Office", summary: "Professional workspace" },
  { id: EnvironmentType.WORKSHOP, name: "Workshop", summary: "Functional work area" },
  { id: EnvironmentType.NATURE, name: "Nature", summary: "Organic outdoor context" },
  { id: EnvironmentType.OUTDOOR, name: "Outdoor", summary: "Open-air setting" },
  { id: EnvironmentType.GYM, name: "Gym", summary: "Active fitness space" },
  { id: EnvironmentType.CHILDREN_ROOM, name: "Children Room", summary: "Safe family interior" },
  { id: EnvironmentType.TECHNOLOGY_LAB, name: "Technology Lab", summary: "Precision tech bench" },
] as const;

const COMPOSITION_KEYWORDS = /\b(hero|badge|template|white space|headline|typography|text placement|layout)\b/i;
const PROMPT_KEYWORDS = /\b(prompt|negative prompt|flux|beautiful premium|high quality render)\b/i;
const OVERLOAD_KEYWORDS = /\b(50|dozens|many objects|cluttered|busy background|crowded)\b/i;
const IMPLAUSIBLE_KEYWORDS = /\b(impossible geometry|floating furniture|contradictory light|random objects)\b/i;

function environmentToBlueprint(environment: EnvironmentTypeId): Pick<
  SceneBlueprint,
  "environment" | "architecture" | "timeOfDay" | "weather" | "depth" | "surface"
> {
  const map: Record<
    EnvironmentTypeId,
    {
      environment: SceneEnvironmentId;
      architecture: SceneArchitectureId;
      timeOfDay: SceneTimeOfDayId;
      surface: string;
      depth: SceneDepthId;
    }
  > = {
    [EnvironmentType.PREMIUM_STUDIO]: {
      environment: "studio",
      architecture: "minimal",
      timeOfDay: "day",
      surface: "matte sweep",
      depth: "medium",
    },
    [EnvironmentType.MINIMAL_STUDIO]: {
      environment: "studio",
      architecture: "minimal",
      timeOfDay: "day",
      surface: "neutral plaster",
      depth: "shallow",
    },
    [EnvironmentType.LUXURY_INTERIOR]: {
      environment: "living_room",
      architecture: "modern",
      timeOfDay: "golden_hour",
      surface: "marble",
      depth: "medium",
    },
    [EnvironmentType.MODERN_KITCHEN]: {
      environment: "kitchen",
      architecture: "modern",
      timeOfDay: "morning",
      surface: "oak countertop",
      depth: "medium",
    },
    [EnvironmentType.LIVING_ROOM]: {
      environment: "living_room",
      architecture: "modern",
      timeOfDay: "day",
      surface: "soft fabric",
      depth: "medium",
    },
    [EnvironmentType.BATHROOM]: {
      environment: "bathroom",
      architecture: "minimal",
      timeOfDay: "day",
      surface: "ceramic tile",
      depth: "shallow",
    },
    [EnvironmentType.OFFICE]: {
      environment: "studio",
      architecture: "modern",
      timeOfDay: "day",
      surface: "concrete desk",
      depth: "medium",
    },
    [EnvironmentType.WORKSHOP]: {
      environment: "workshop",
      architecture: "industrial",
      timeOfDay: "day",
      surface: "steel bench",
      depth: "deep",
    },
    [EnvironmentType.NATURE]: {
      environment: "garden",
      architecture: "minimal",
      timeOfDay: "golden_hour",
      surface: "natural stone",
      depth: "deep",
    },
    [EnvironmentType.OUTDOOR]: {
      environment: "garden",
      architecture: "modern",
      timeOfDay: "day",
      surface: "grass",
      depth: "deep",
    },
    [EnvironmentType.GYM]: {
      environment: "workshop",
      architecture: "industrial",
      timeOfDay: "day",
      surface: "rubber mat",
      depth: "medium",
    },
    [EnvironmentType.CHILDREN_ROOM]: {
      environment: "living_room",
      architecture: "modern",
      timeOfDay: "morning",
      surface: "natural wood",
      depth: "shallow",
    },
    [EnvironmentType.TECHNOLOGY_LAB]: {
      environment: "studio",
      architecture: "modern",
      timeOfDay: "day",
      surface: "matte desk",
      depth: "shallow",
    },
  };

  const base = map[environment];
  return {
    environment: base.environment,
    architecture: base.architecture,
    timeOfDay: base.timeOfDay,
    weather: "clear",
    depth: base.depth,
    surface: base.surface,
  };
}

function sceneAlternatives(ctx: SceneDirectorContext): EnvironmentTypeId[] {
  const story = ctx.storyType as StoryTypeId | undefined;

  if (story === StoryType.SAFETY || story === StoryType.FAMILY) {
    return [EnvironmentType.CHILDREN_ROOM, EnvironmentType.MODERN_KITCHEN, EnvironmentType.LIVING_ROOM];
  }
  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY) {
    return [EnvironmentType.LUXURY_INTERIOR, EnvironmentType.PREMIUM_STUDIO, EnvironmentType.LIVING_ROOM];
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION) {
    return [EnvironmentType.TECHNOLOGY_LAB, EnvironmentType.MINIMAL_STUDIO, EnvironmentType.OFFICE];
  }
  if (story === StoryType.PROFESSIONAL_AUTHORITY) {
    return [EnvironmentType.OFFICE, EnvironmentType.PREMIUM_STUDIO, EnvironmentType.WORKSHOP];
  }
  if (story === StoryType.COMFORT || story === StoryType.EMOTIONAL_GIFT) {
    return [EnvironmentType.LIVING_ROOM, EnvironmentType.MODERN_KITCHEN, EnvironmentType.LUXURY_INTERIOR];
  }
  if (story === StoryType.TRUST || story === StoryType.MINIMAL_LUXURY) {
    return [EnvironmentType.MINIMAL_STUDIO, EnvironmentType.PREMIUM_STUDIO, EnvironmentType.LIVING_ROOM];
  }
  if (story === StoryType.HEALTH) {
    return [EnvironmentType.BATHROOM, EnvironmentType.LIVING_ROOM, EnvironmentType.MINIMAL_STUDIO];
  }
  if (story === StoryType.SPEED || story === StoryType.EFFICIENCY) {
    return [EnvironmentType.OFFICE, EnvironmentType.MODERN_KITCHEN, EnvironmentType.MINIMAL_STUDIO];
  }
  if (ctx.creativeGoal === "Lifestyle") {
    return [EnvironmentType.LIVING_ROOM, EnvironmentType.MODERN_KITCHEN, EnvironmentType.OUTDOOR];
  }
  return [EnvironmentType.MINIMAL_STUDIO, EnvironmentType.PREMIUM_STUDIO, EnvironmentType.LIVING_ROOM];
}

function sceneTypeFor(environment: EnvironmentTypeId, story?: StoryTypeId): SceneTypeId {
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION) return SceneType.TECHNOLOGY;
  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY) return SceneType.LUXURY;
  if (story === StoryType.PROFESSIONAL_AUTHORITY) return SceneType.COMMERCIAL_STUDIO;
  if (story === StoryType.SAFETY || story === StoryType.FAMILY) return SceneType.LIFESTYLE;
  if (story === StoryType.TRUST) return SceneType.MINIMAL;

  switch (environment) {
    case EnvironmentType.PREMIUM_STUDIO:
    case EnvironmentType.MINIMAL_STUDIO:
      return SceneType.COMMERCIAL_STUDIO;
    case EnvironmentType.LUXURY_INTERIOR:
      return SceneType.LUXURY;
    case EnvironmentType.TECHNOLOGY_LAB:
      return SceneType.TECHNOLOGY;
    case EnvironmentType.WORKSHOP:
      return SceneType.INDUSTRIAL;
    case EnvironmentType.NATURE:
    case EnvironmentType.OUTDOOR:
      return SceneType.NATURAL;
  }
  return SceneType.LIFESTYLE;
}

function depthProfileFor(environment: EnvironmentTypeId): DepthProfileId {
  switch (environment) {
    case EnvironmentType.MINIMAL_STUDIO:
    case EnvironmentType.BATHROOM:
    case EnvironmentType.TECHNOLOGY_LAB:
      return DepthProfile.COMPACT_SPACE;
    case EnvironmentType.CHILDREN_ROOM:
      return DepthProfile.INTIMATE_SPACE;
    case EnvironmentType.NATURE:
    case EnvironmentType.OUTDOOR:
      return DepthProfile.DEEP_PERSPECTIVE;
    case EnvironmentType.PREMIUM_STUDIO:
      return DepthProfile.INFINITE_BACKGROUND;
    case EnvironmentType.LUXURY_INTERIOR:
      return DepthProfile.INTERIOR_VOLUME;
    default:
      return DepthProfile.OPEN_SPACE;
  }
}

function materialPaletteFor(environment: EnvironmentTypeId, story?: StoryTypeId): string[] {
  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY) {
    return ["marble", "oak", "soft fabric"];
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION) {
    return ["matte plastic", "glass", "steel"];
  }
  if (story === StoryType.SAFETY || story === StoryType.FAMILY) {
    return ["natural wood", "soft fabric", "ceramic"];
  }

  switch (environment) {
    case EnvironmentType.MODERN_KITCHEN:
      return ["oak", "ceramic", "matte plastic"];
    case EnvironmentType.LUXURY_INTERIOR:
      return ["marble", "oak", "glass"];
    case EnvironmentType.WORKSHOP:
      return ["steel", "concrete", "stone"];
    case EnvironmentType.TECHNOLOGY_LAB:
      return ["steel", "glass", "matte plastic"];
    case EnvironmentType.NATURE:
    case EnvironmentType.OUTDOOR:
      return ["natural wood", "stone", "soft fabric"];
    default:
      return ["concrete", "natural wood", "matte plastic"];
  }
}

function lightingMoodFor(environment: EnvironmentTypeId, story?: StoryTypeId): string {
  if (story === StoryType.SAFETY || story === StoryType.FAMILY) {
    return "soft natural daylight, calm domestic atmosphere";
  }
  if (story === StoryType.PREMIUM_LIFESTYLE || story === StoryType.MINIMAL_LUXURY) {
    return "warm premium ambient light with gentle highlights";
  }
  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION) {
    return "crisp neutral daylight with controlled reflections";
  }
  if (environment === EnvironmentType.MINIMAL_STUDIO) {
    return "even softbox-style daylight";
  }
  return "balanced daylight with natural shadow falloff";
}

function backgroundNarrativeFor(
  environment: EnvironmentTypeId,
  ctx: SceneDirectorContext,
): string {
  const product = ctx.subCategory ?? ctx.productCategory;
  switch (environment) {
    case EnvironmentType.MODERN_KITCHEN:
      return `Продукт ${product} естественно находится в светлой современной кухне — логичное место для ежедневного использования`;
    case EnvironmentType.CHILDREN_ROOM:
      return `Продукт ${product} размещён в уютной детской комнате, где родители ощущают безопасность и заботу`;
    case EnvironmentType.TECHNOLOGY_LAB:
      return `Продукт ${product} представлен в чистой технологичной среде, подчёркивающей инновационность`;
    case EnvironmentType.LUXURY_INTERIOR:
      return `Продукт ${product} в премиальном интерьере — пространство подтверждает статус и качество`;
    case EnvironmentType.OFFICE:
      return `Продукт ${product} на рабочем столе — сцена объясняет продуктивное ежедневное использование`;
    case EnvironmentType.MINIMAL_STUDIO:
      return `Продукт ${product} в минимальной студии — окружение не конкурирует с товаром`;
    default:
      return `Продукт ${product} находится здесь, потому что история «${ctx.storyHook ?? ctx.storyNarrative ?? "ценность товара"}» требует правдоподобного контекста`;
  }
}

function providerHintsFor(providerId?: string): string[] {
  const base = [
    "simple geometry",
    "limited secondary objects",
    "physically plausible materials",
    "clear perspective",
  ];
  if (providerId === "flux" || !providerId) {
    return [...base, "avoid complex multi-room layouts", "prefer readable surfaces for FLUX"];
  }
  return base;
}

function selectEnvironment(ctx: SceneDirectorContext): {
  selected: EnvironmentTypeId;
  alternatives: EnvironmentTypeId[];
  rejected: { id: EnvironmentTypeId; reason: string }[];
} {
  const alternatives = sceneAlternatives(ctx);
  const story = ctx.storyType as StoryTypeId | undefined;
  const scores = alternatives.map((id, index) => ({
    id,
    score:
      story === StoryType.SAFETY && id === EnvironmentType.CHILDREN_ROOM
        ? 0.92
        : story === StoryType.TECHNOLOGY && id === EnvironmentType.TECHNOLOGY_LAB
          ? 0.9
          : story === StoryType.PREMIUM_LIFESTYLE && id === EnvironmentType.LUXURY_INTERIOR
            ? 0.9
            : 0.82 - index * 0.06,
  }));
  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0].id;
  const rejected = scores.slice(1).map((s) => ({
    id: s.id,
    reason: `Lower story-environment fit for ${ctx.storyType ?? "generic"} narrative`,
  }));
  return { selected, alternatives, rejected };
}

export function buildSceneSection(
  ctx: SceneDirectorContext,
  confidence: number,
): { section: SceneSection; explainability: SceneExplainabilityReport } {
  const { selected, alternatives, rejected } = selectEnvironment(ctx);
  const story = ctx.storyType as StoryTypeId | undefined;
  const sceneType = sceneTypeFor(selected, story);
  const depthProfile = depthProfileFor(selected);
  const materialPalette = materialPaletteFor(selected, story);
  const lightingMood = lightingMoodFor(selected, story);
  const backgroundNarrative = backgroundNarrativeFor(selected, ctx);
  const blueprintBase = environmentToBlueprint(selected);

  const sceneBlueprint: SceneBlueprint = {
    ...blueprintBase,
    sceneType,
    environmentType: selected,
    backgroundNarrative,
    lightingMood,
    materialPalette,
    depthProfile,
    cameraEnvironment: depthProfile === DepthProfile.DEEP_PERSPECTIVE ? "wide environmental framing" : "natural eye-level room context",
    realismProfile: "physically plausible commercial photography",
    providerHints: providerHintsFor(ctx.providerId),
  };

  const section: SceneSection = {
    sceneType,
    environment: selected,
    backgroundNarrative,
    lightingMood,
    materialPalette,
    depthProfile,
    cameraEnvironment: sceneBlueprint.cameraEnvironment ?? "natural eye-level room context",
    realismProfile: sceneBlueprint.realismProfile ?? "physically plausible commercial photography",
    providerHints: sceneBlueprint.providerHints ?? [],
    sceneBlueprint,
    confidence,
  };

  const explainability: SceneExplainabilityReport = {
    agentId: SCENE_DIRECTOR_ID,
    selectedSceneType: sceneType,
    selectedEnvironment: selected,
    alternativesConsidered: alternatives,
    rejectedAlternatives: rejected,
    storyInfluences: [
      ctx.storyType ? `Story type: ${ctx.storyType}` : "Story section pending",
      ctx.primaryEmotion ? `Primary emotion: ${ctx.primaryEmotion}` : "",
      ctx.commercialGoal ? `Commercial goal: ${ctx.commercialGoal}` : "",
    ].filter(Boolean),
    sectionsUsed: ["story", "product", "creative"],
    commercialValue: "Scene amplifies story without competing with the product",
    reasoning: [
      `Environment ${selected} selected from story ${ctx.storyType ?? "context"} — not from category alone`,
      `Materials: ${materialPalette.join(", ")} — consistent with ${sceneType} scene type`,
      `Background narrative explains why the product belongs here`,
      `No composition, hero placement, or prompt decisions`,
    ],
  };

  return { section, explainability };
}

export function validateSceneSection(section: SceneSection, ctx: SceneDirectorContext): SceneValidationReport {
  const violations: string[] = [];
  const text = [
    section.backgroundNarrative,
    section.lightingMood,
    section.realismProfile,
    section.cameraEnvironment,
    ...section.materialPalette,
  ].join(" ");

  if (!section.backgroundNarrative || section.backgroundNarrative.length < 20) {
    violations.push("MISSING_BACKGROUND_NARRATIVE");
  }
  if (COMPOSITION_KEYWORDS.test(text)) violations.push("CONTAINS_COMPOSITION_DECISION");
  if (PROMPT_KEYWORDS.test(text)) violations.push("CONTAINS_PROMPT");
  if (OVERLOAD_KEYWORDS.test(text) || section.materialPalette.length > 5) {
    violations.push("OVERLOADED_SCENE");
  }
  if (IMPLAUSIBLE_KEYWORDS.test(text)) violations.push("NOT_PHYSICALLY_PLAUSIBLE");
  if (!section.backgroundNarrative.includes("Продукт") && !section.backgroundNarrative.includes("product")) {
    violations.push("AI_BACKGROUND_RANDOM");
  }

  const luxuryStory =
    ctx.storyType === StoryType.PREMIUM_LIFESTYLE ||
    ctx.storyType === StoryType.MINIMAL_LUXURY ||
    ctx.primaryEmotion === "luxury";
  if (luxuryStory && section.environment === EnvironmentType.WORKSHOP) {
    violations.push("STORY_CONFLICT");
  }
  if (
    ctx.storyType === StoryType.MINIMAL_LUXURY &&
    section.materialPalette.some((m) => m.includes("plastic") && !m.includes("matte"))
  ) {
    violations.push("STORY_CONFLICT");
  }

  return { valid: violations.length === 0, violations, section };
}

export function isSceneFailure(code: string): code is SceneFailureCode {
  return [
    "STORY_CONFLICT",
    "MISSING_BACKGROUND_NARRATIVE",
    "OVERLOADED_SCENE",
    "NOT_PHYSICALLY_PLAUSIBLE",
    "CONTAINS_COMPOSITION_DECISION",
    "CONTAINS_PROMPT",
    "AI_BACKGROUND_RANDOM",
    "PROVIDER_INCOMPATIBLE",
  ].includes(code);
}

export function sceneSectionToMutations(
  section: SceneSection,
  revision: number,
  reason: string,
): BlueprintMutation[] {
  return updatesToMutations(
    { scene: section.sceneBlueprint },
    SCENE_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function runSceneDirector(input: {
  context: AgentContextPackage;
  directorContext: SceneDirectorContext;
}): {
  section: SceneSection;
  explainability: SceneExplainabilityReport;
  confidence: ReturnType<typeof confidenceFromContext>;
  decisionSession: AgentDecisionSession;
  mutations: BlueprintMutation[];
} {
  const memory = buildAgentMemoryPackage({
    agentId: SCENE_DIRECTOR_ID,
    working: input.context,
  });

  const envAlts = sceneAlternatives(input.directorContext);
  const alternatives = envAlts.map((id) => {
    const def = ENVIRONMENT_CATALOG.find((d) => d.id === id);
    return {
      id,
      label: def?.name ?? id,
      summary: def?.summary ?? `Environment: ${id}`,
      scores: {},
    };
  });

  const evaluations = envAlts.map((id, index) => ({
    alternativeId: id,
    scores: scoreAlternative([`environment ${id}`], 0.84 - index * 0.07),
    weightedTotal: 0.84 - index * 0.07,
    notes: [`Evaluated environment ${id}`],
  }));

  const selectedAlternative = pickBestAlternative(alternatives, evaluations);
  const confidence = confidenceFromContext({
    agentId: SCENE_DIRECTOR_ID,
    context: input.context,
    evaluations,
    knowledgeAligned: true,
    reasoningSteps: 4,
    constraintsSatisfied: 5,
    constraintsTotal: 5,
  });

  const { section, explainability } = buildSceneSection(
    input.directorContext,
    confidence.value,
  );

  const decisionSession = new AgentDecisionSession(SCENE_DIRECTOR_ID)
    .observeFromContext(input.context, memory)
    .interpret([
      `Story: ${input.directorContext.storyType ?? "pending"}`,
      `Category: ${input.directorContext.productCategory}`,
      `Marketplace: ${input.directorContext.marketplace}`,
    ])
    .reason(explainability.reasoning)
    .compare(alternatives)
    .evaluate(
      alternatives.map((alt, index) => ({
        alternativeId: alt.id,
        scores: scoreAlternative([alt.summary], 0.79 - index * 0.05),
        weightedTotal: 0.79 - index * 0.05,
        notes: [alt.summary],
      })),
    )
    .decide(selectedAlternative, confidence.value)
    .explain([
      ...explainability.reasoning,
      `Rejected: ${explainability.rejectedAlternatives.map((r) => r.id).join(", ")}`,
      `Commercial value: ${explainability.commercialValue}`,
    ]);

  const mutations = sceneSectionToMutations(
    section,
    input.context.blueprint.meta.revision ?? 0,
    explainability.reasoning.join("; "),
  );

  decisionSession.publish(mutations);

  return { section, explainability, confidence, decisionSession, mutations };
}

export function directorContextFromBlueprint(
  blueprint: import("./types").RenderBlueprint,
): SceneDirectorContext {
  return {
    productCategory: blueprint.product.category,
    subCategory: blueprint.product.subCategory,
    creativeGoal: blueprint.creative.goal,
    marketplace: blueprint.creative.marketplace,
    priceSegment: blueprint.creative.priceSegment,
    audience: blueprint.creative.audience,
    storyType: blueprint.story.storyType,
    primaryEmotion: blueprint.story.primaryEmotion,
    commercialGoal: blueprint.story.commercialGoal,
    storyNarrative: blueprint.story.narrative,
    storyHook: blueprint.story.hook,
    providerId: blueprint.meta.generator,
  };
}

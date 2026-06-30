/**
 * Chapter 6.6 — Visual Story Planning Stage engine.
 * Transforms commercial strategy into visual narrative — meaning only, never scene/lighting/photo.
 */
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import {
  runBusinessUnderstandingStage,
} from "./business-understanding-engine";
import { StoryStrategyArc } from "./business-understanding-types";
import {
  runKnowledgeRetrievalStage,
} from "./knowledge-retrieval-stage-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import type { EmotionalToneId } from "./types";
import type { BlueprintMutation } from "./mutation-types";
import { updatesToMutations } from "./universal-agent-bridge";
import {
  buildStorySection,
  validateStorySection,
  VISUAL_STORY_DIRECTOR_ID,
} from "./visual-story-director-engine";
import type { StoryDirectorContext } from "./visual-story-director-types";
import {
  StoryObjective,
  StoryPattern,
  VisualStoryPlanningStage,
  type PlannedStoryBlueprint,
  type StoryObjectiveId,
  type StoryPatternId,
  type StoryPlanningConstraints,
  type VisualStoryPlanningContext,
  type VisualStoryPlanningFailureCode,
  type VisualStoryPlanningInput,
  type VisualStoryPlanningReport,
  type VisualStoryPlanningSection,
  type VisualStoryPlanningStageId,
  type VisualStoryPlanningSystemReport,
  type VisualStoryPlanningViolation,
} from "./visual-story-planning-stage-types";

export {
  VisualStoryPlanningStage,
  StoryPattern,
  StoryObjective,
  type VisualStoryPlanningStageId,
  type StoryPatternId,
  type StoryObjectiveId,
  type PlannedStoryBlueprint,
  type StoryPlanningConstraints,
  type VisualStoryPlanningInput,
  type VisualStoryPlanningSection,
  type VisualStoryPlanningViolation,
  type VisualStoryPlanningReport,
  type VisualStoryPlanningContext,
  type VisualStoryPlanningSystemReport,
  type VisualStoryPlanningFailureCode,
} from "./visual-story-planning-stage-types";

export const VISUAL_STORY_PLANNING_VERSION = "6.6.0";

export const VISUAL_STORY_PLANNING_GOLDEN_RULE =
  "The buyer does not remember composition, lighting, or text placement — they remember the story " +
  "seen in the first seconds. Visual Story Planning creates that story, turning product characteristics " +
  "into a clear, emotional, commercially effective visual scenario for the entire Design AI Platform.";

export const VISUAL_STORY_PLANNING_PIPELINE: readonly VisualStoryPlanningStageId[] = [
  VisualStoryPlanningStage.INPUT_ASSEMBLY,
  VisualStoryPlanningStage.STORY_OBJECTIVE,
  VisualStoryPlanningStage.PATTERN_SELECTION,
  VisualStoryPlanningStage.PRIMARY_MESSAGE,
  VisualStoryPlanningStage.EMOTIONAL_TONE,
  VisualStoryPlanningStage.HERO_MOMENT,
  VisualStoryPlanningStage.NARRATIVE_STRUCTURE,
  VisualStoryPlanningStage.STORY_CONSTRAINTS,
  VisualStoryPlanningStage.BLUEPRINT_ASSEMBLY,
  VisualStoryPlanningStage.CONSISTENCY_CHECK,
  VisualStoryPlanningStage.VALIDATION,
  VisualStoryPlanningStage.AGENT_HANDOFF,
] as const;

export const VISUAL_STORY_PLANNING_POSITION = [
  "business-understanding",
  "visual-story-planning",
  "scene-director",
] as const;

const NARRATIVE_FLOWS: Record<StoryPatternId, string[]> = {
  [StoryPattern.PROBLEM_SOLUTION]: ["attention", "recognition", "benefit", "trust", "purchase_motivation"],
  [StoryPattern.HERO_PRODUCT]: ["attention", "product_focus", "benefit", "trust", "purchase_motivation"],
  [StoryPattern.LIFESTYLE]: ["attention", "context", "benefit", "desire", "purchase_motivation"],
  [StoryPattern.PREMIUM_EXPERIENCE]: ["premium", "quality", "materials", "status", "purchase"],
  [StoryPattern.FEATURE_SHOWCASE]: ["problem", "solution", "result", "confidence"],
};

function violation(
  code: VisualStoryPlanningFailureCode,
  message: string,
  stage?: VisualStoryPlanningStageId,
): VisualStoryPlanningViolation {
  return { code, message, stage };
}

export function selectStoryPatternFromBusiness(
  business: VisualStoryPlanningInput["business"],
): StoryPatternId {
  switch (business.storyStrategyArc) {
    case StoryStrategyArc.PREMIUM_QUALITY_MATERIALS_STATUS_PURCHASE:
      return StoryPattern.PREMIUM_EXPERIENCE;
    case StoryStrategyArc.EFFICIENCY_COMFORT_RESULT_ACTION:
      return StoryPattern.FEATURE_SHOWCASE;
    case StoryStrategyArc.TRUST_RELIABILITY_PROFESSIONAL_ACTION:
      return StoryPattern.HERO_PRODUCT;
    case StoryStrategyArc.PROBLEM_SOLUTION_BENEFIT_TRUST_ACTION:
    default:
      return StoryPattern.PROBLEM_SOLUTION;
  }
}

export function selectStoryObjective(
  business: VisualStoryPlanningInput["business"],
  pattern: StoryPatternId,
): StoryObjectiveId {
  if (business.model.businessPriority.includes("premium")) return StoryObjective.DEMONSTRATE_QUALITY;
  if (pattern === StoryPattern.PROBLEM_SOLUTION) return StoryObjective.SHOW_BENEFIT;
  if (pattern === StoryPattern.PREMIUM_EXPERIENCE) return StoryObjective.CREATE_DESIRE;
  if (pattern === StoryPattern.HERO_PRODUCT) return StoryObjective.BUILD_TRUST;
  return StoryObjective.SHOW_BENEFIT;
}

export function buildPrimaryMessage(
  input: VisualStoryPlanningInput,
  context: VisualStoryPlanningContext = {},
): string {
  if (context.missingPrimaryMessage) return "";
  const model = input.business.model;
  const sub = input.profile.subcategory.toLowerCase();

  if (sub.includes("sprayer")) {
    return "Treat tall trees without manual pumping";
  }
  if (sub.includes("blender")) {
    return model.primaryValue || "Smooth blends with quiet morning confidence";
  }
  return model.primaryValue || model.secondaryValues[0] || "Clear customer value in first seconds";
}

export function buildSecondaryMessages(input: VisualStoryPlanningInput): string[] {
  return [
    ...input.business.model.secondaryValues.slice(0, 2),
    ...input.business.rankedPriorities.slice(1, 3).map((p) => p.label),
  ].filter(Boolean);
}

export function buildHeroMoment(input: VisualStoryPlanningInput, pattern: StoryPatternId): string {
  const sub = input.profile.subcategory.toLowerCase();
  if (sub.includes("sprayer")) {
    return "User easily treats a tall tree without physical strain";
  }
  if (sub.includes("blender")) {
    return pattern === StoryPattern.PREMIUM_EXPERIENCE
      ? "Premium blender as calm morning ritual centerpiece"
      : "Smooth pour demonstrating reliable blend quality";
  }
  if (pattern === StoryPattern.HERO_PRODUCT) {
    return `Maximum focus on ${input.profile.subcategory} as unmistakable hero`;
  }
  return `Decisive moment proving ${input.business.model.primaryValue}`;
}

export function buildEmotionalTone(
  input: VisualStoryPlanningInput,
  context: VisualStoryPlanningContext = {},
): string {
  if (context.missingEmotionalTone) return "";
  const driver = input.business.model.emotionalDrivers[0] ?? "confidence";
  if (input.business.storyStrategyArc === StoryStrategyArc.PREMIUM_QUALITY_MATERIALS_STATUS_PURCHASE) {
    return "luxury";
  }
  return driver;
}

export function buildVisualFocus(pattern: StoryPatternId, input: VisualStoryPlanningInput): string {
  switch (pattern) {
    case StoryPattern.HERO_PRODUCT:
      return "product hero dominance";
    case StoryPattern.LIFESTYLE:
      return "natural use context with readable product";
    case StoryPattern.PREMIUM_EXPERIENCE:
      return "premium material and status cues";
    case StoryPattern.FEATURE_SHOWCASE:
      return "sequential benefit revelation";
    default:
      return `pain relief through ${input.profile.subcategory}`;
  }
}

export function buildStoryConstraints(pattern: StoryPatternId): StoryPlanningConstraints {
  if (pattern === StoryPattern.PREMIUM_EXPERIENCE) {
    return {
      avoid: ["cluttered badges", "cheap colors", "chaotic composition", "excessive text"],
      require: ["restraint", "premium spacing", "material quality cues"],
    };
  }
  if (pattern === StoryPattern.FEATURE_SHOWCASE) {
    return {
      avoid: ["complex lifestyle noise", "unreadable feature stack"],
      require: ["clear benefit hierarchy", "readable primary message"],
    };
  }
  return {
    avoid: ["contradictory emotions", "multiple competing heroes"],
    require: ["single primary message", "consistent emotional tone"],
  };
}

export function buildPlannedStoryBlueprint(
  input: VisualStoryPlanningInput,
  pattern: StoryPatternId,
  objective: StoryObjectiveId,
  context: VisualStoryPlanningContext = {},
): PlannedStoryBlueprint {
  const primaryMessage = buildPrimaryMessage(input, context);
  const secondaryMessages = context.multiplePrimaryMessages
    ? [primaryMessage, "second competing headline", "third competing headline"]
    : buildSecondaryMessages(input);

  return {
    storyPattern: pattern,
    primaryMessage,
    secondaryMessages,
    heroMoment: context.missingHeroMoment ? "" : buildHeroMoment(input, pattern),
    emotionalTone: buildEmotionalTone(input, context),
    visualFocus: buildVisualFocus(pattern, input),
    storyFlow: NARRATIVE_FLOWS[pattern],
    priority: 1,
  };
}

export function buildStoryDirectorContext(input: VisualStoryPlanningInput): StoryDirectorContext {
  return {
    productCategory: input.profile.category,
    subCategory: input.profile.subcategory,
    creativeGoal: input.business.model.businessPriority.includes("premium") ? "Premium" : "CTR",
    marketplace: input.marketplace,
    priceSegment: input.profile.priceSegment,
    audience: input.profile.targetAudience.segment,
    productEmotion: input.business.model.emotionalDrivers[0],
  };
}

export function validatePlannedStoryBlueprint(
  planned: PlannedStoryBlueprint,
  input: VisualStoryPlanningInput,
  context: VisualStoryPlanningContext = {},
): VisualStoryPlanningViolation[] {
  const violations: VisualStoryPlanningViolation[] = [];

  if (!planned.primaryMessage) {
    violations.push(
      violation("MISSING_PRIMARY_MESSAGE", "Story must have one primary message", VisualStoryPlanningStage.PRIMARY_MESSAGE),
    );
  }
  if (context.multiplePrimaryMessages) {
    violations.push(
      violation("MULTIPLE_PRIMARY_MESSAGES", "Only one primary message is allowed", VisualStoryPlanningStage.PRIMARY_MESSAGE),
    );
  }
  if (!planned.heroMoment || context.missingHeroMoment) {
    violations.push(
      violation("MISSING_HERO_MOMENT", "Hero moment must be defined", VisualStoryPlanningStage.HERO_MOMENT),
    );
  }
  if (!planned.emotionalTone || context.missingEmotionalTone) {
    violations.push(
      violation("MISSING_EMOTIONAL_TONE", "Emotional tone must be defined", VisualStoryPlanningStage.EMOTIONAL_TONE),
    );
  }
  if (context.businessModelConflict) {
    violations.push(
      violation("BUSINESS_MODEL_CONFLICT", "Story must align with Business Model", VisualStoryPlanningStage.CONSISTENCY_CHECK),
    );
  }
  if (!Object.values(StoryPattern).includes(planned.storyPattern as StoryPatternId)) {
    violations.push(
      violation("INVALID_STORY_PATTERN", "Story pattern must be selected from catalog", VisualStoryPlanningStage.PATTERN_SELECTION),
    );
  }
  if (
    input.business.model.primaryValue &&
    planned.primaryMessage &&
    input.profile.priceSegment === "premium" &&
    planned.storyPattern === StoryPattern.PROBLEM_SOLUTION &&
    context.businessModelConflict
  ) {
    violations.push(violation("BUSINESS_MODEL_CONFLICT", "Premium model conflicts with problem-only pattern"));
  }

  const sceneWords = /\b(lighting|camera|composition|studio|kitchen|badge|template)\b/i;
  if (sceneWords.test(planned.heroMoment) || sceneWords.test(planned.primaryMessage)) {
    violations.push(
      violation("DESIGN_DECISION_DETECTED", "Story planning must not decide scene or composition", VisualStoryPlanningStage.BLUEPRINT_ASSEMBLY),
    );
  }

  return violations;
}

function mapEmotionalTone(tone: string): EmotionalToneId {
  if (tone === "luxury") return "luxury";
  if (tone === "comfort" || tone === "warm") return "warm";
  if (tone === "calm") return "calm";
  if (tone === "innovative") return "innovative";
  return "confident";
}

export function runVisualStoryPlanningStage(
  input: VisualStoryPlanningInput,
  context: VisualStoryPlanningContext = {},
): VisualStoryPlanningReport {
  const started = Date.now();
  const stagesCompleted: VisualStoryPlanningStageId[] = [];

  if (!input.profile?.category) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Profile is required", VisualStoryPlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  if (!input.business?.model) {
    return {
      valid: false,
      violations: [violation("MISSING_BUSINESS_MODEL", "Business Model is required", VisualStoryPlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(VisualStoryPlanningStage.INPUT_ASSEMBLY);

  const pattern = selectStoryPatternFromBusiness(input.business);
  const objective = selectStoryObjective(input.business, pattern);
  stagesCompleted.push(VisualStoryPlanningStage.STORY_OBJECTIVE, VisualStoryPlanningStage.PATTERN_SELECTION);

  const planned = buildPlannedStoryBlueprint(input, pattern, objective, context);
  stagesCompleted.push(
    VisualStoryPlanningStage.PRIMARY_MESSAGE,
    VisualStoryPlanningStage.EMOTIONAL_TONE,
    VisualStoryPlanningStage.HERO_MOMENT,
    VisualStoryPlanningStage.NARRATIVE_STRUCTURE,
  );

  const constraints = buildStoryConstraints(pattern);
  stagesCompleted.push(VisualStoryPlanningStage.STORY_CONSTRAINTS);

  const directorCtx = buildStoryDirectorContext(input);
  const { section: directorSection } = buildStorySection(directorCtx, 0.9);
  stagesCompleted.push(VisualStoryPlanningStage.BLUEPRINT_ASSEMBLY);

  const renderStory = {
    ...directorSection.storyBlueprint,
    narrative: `${planned.primaryMessage}. ${planned.heroMoment}`,
    hook: planned.primaryMessage,
    visualPromise: planned.heroMoment,
    emotionalTone: mapEmotionalTone(planned.emotionalTone),
  };

  const violations = validatePlannedStoryBlueprint(planned, input, context);
  const directorValidation = validateStorySection(directorSection, directorCtx);
  if (!directorValidation.valid) {
    violations.push(
      ...directorValidation.violations.map((v) =>
        violation("DIRECTOR_VALIDATION_FAILED", v, VisualStoryPlanningStage.VALIDATION),
      ),
    );
  }

  stagesCompleted.push(VisualStoryPlanningStage.CONSISTENCY_CHECK, VisualStoryPlanningStage.VALIDATION);

  const section: VisualStoryPlanningSection = {
    plannedBlueprint: planned,
    storyObjective: objective,
    storyPattern: pattern,
    constraints,
    renderStory,
    directorSection: { ...directorSection, storyBlueprint: renderStory },
    stagesCompleted,
    confidence: violations.length === 0 ? 0.94 : 0.45,
  };

  stagesCompleted.push(VisualStoryPlanningStage.AGENT_HANDOFF);

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function storyPlanningToMutations(
  section: VisualStoryPlanningSection,
  revision = 0,
  reason = "Visual Story Planning Stage",
): BlueprintMutation[] {
  return updatesToMutations({ story: section.renderStory }, VISUAL_STORY_DIRECTOR_ID, revision, reason);
}

export function enrichPipelineContextWithStoryPlanning(
  ctx: GenerationPipelineContext,
  section: VisualStoryPlanningSection,
): { context: GenerationPipelineContext; violations: VisualStoryPlanningViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: VISUAL_STORY_DIRECTOR_ID,
    section: PipelineContextSection.CREATIVE,
    blueprintSection: "story",
    changes: {
      story: {
        ...section.renderStory,
        storyPattern: section.plannedBlueprint.storyPattern,
        primaryMessage: section.plannedBlueprint.primaryMessage,
        heroMoment: section.plannedBlueprint.heroMoment,
        storyFlow: section.plannedBlueprint.storyFlow,
      },
    },
    reason: "Visual Story Planning Stage enriched creative story context",
  });

  return {
    context: {
      ...patch.context,
      blueprint: { ...patch.context.blueprint, story: section.renderStory },
    },
    violations: patch.violations as VisualStoryPlanningViolation[],
  };
}

export function runVisualStoryPlanningStageFromPipeline(
  context: VisualStoryPlanningContext = {},
): VisualStoryPlanningReport {
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  if (!analysis.section) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Analysis must complete before Story Planning")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section.profile,
    marketplace: pipelineInput.marketplace,
    style: analysis.section.profile.priceSegment,
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section.profile,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  if (!business.section || !knowledge.package) {
    return {
      valid: false,
      violations: [violation("MISSING_BUSINESS_MODEL", "Business Understanding must complete before Story Planning")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }
  return runVisualStoryPlanningStage(
    {
      profile: analysis.section.profile,
      business: business.section,
      knowledge: knowledge.package,
      marketplace: pipelineInput.marketplace,
      brand: pipelineInput.brand,
    },
    context,
  );
}

export function validateVisualStoryPlanning(
  context: VisualStoryPlanningContext = {},
): VisualStoryPlanningSystemReport {
  const violations: VisualStoryPlanningViolation[] = [];

  const kitchen = runVisualStoryPlanningStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (kitchen.section.storyPattern !== StoryPattern.PREMIUM_EXPERIENCE) {
      violations.push(violation("INVALID_STORY_PATTERN", "Premium kitchen should use premium experience pattern"));
    }
  }

  const gardenAnalysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
    }),
  );
  const gardenKnowledge = runKnowledgeRetrievalStage({
    profile: gardenAnalysis.section!.profile,
    marketplace: "wildberries",
  });
  const gardenBusiness = runBusinessUnderstandingStage({
    profile: gardenAnalysis.section!.profile,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const garden = runVisualStoryPlanningStage(
    {
      profile: gardenAnalysis.section!.profile,
      business: gardenBusiness.section!,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    context,
  );
  if (!garden.valid || !garden.section) {
    violations.push(...garden.violations);
  } else {
    if (garden.section.storyPattern !== StoryPattern.PROBLEM_SOLUTION) {
      violations.push(violation("INVALID_STORY_PATTERN", "Garden sprayer should use problem-solution pattern"));
    }
    if (!garden.section.plannedBlueprint.heroMoment.toLowerCase().includes("tree")) {
      violations.push(violation("MISSING_HERO_MOMENT", "Sprayer hero moment must reference tall tree treatment"));
    }
    if (garden.section.plannedBlueprint.storyFlow.length < 4) {
      violations.push(violation("STORY_INCONSISTENT", "Narrative structure must include full story flow"));
    }
  }

  const multi = runVisualStoryPlanningStage(
    {
      profile: gardenAnalysis.section!.profile,
      business: gardenBusiness.section!,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    { multiplePrimaryMessages: true },
  );
  if (multi.valid) {
    violations.push(violation("MULTIPLE_PRIMARY_MESSAGES", "Multiple primary messages must fail validation"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    singleStoryIdea: !!garden.section && !!kitchen.section,
    businessGoalAligned: !!garden.section?.plannedBlueprint.primaryMessage,
    heroMomentDefined: !!garden.section?.plannedBlueprint.heroMoment,
    emotionalToneDefined: !!garden.section?.plannedBlueprint.emotionalTone,
    downstreamReady: !!garden.section?.renderStory.hook,
  };
}

export function assertVisualStoryPlanning(
  context: VisualStoryPlanningContext = {},
): VisualStoryPlanningSystemReport {
  const report = validateVisualStoryPlanning(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Visual Story Planning validation failed: ${messages}`);
  }
  return report;
}

export function runVisualStoryPlanning(
  context: VisualStoryPlanningContext = {},
): VisualStoryPlanningSystemReport {
  return validateVisualStoryPlanning(context);
}

export function isVisualStoryPlanningFailure(code: string): code is VisualStoryPlanningFailureCode {
  const codes: VisualStoryPlanningFailureCode[] = [
    "MISSING_BUSINESS_MODEL",
    "MISSING_PROFILE",
    "MISSING_PRIMARY_MESSAGE",
    "MULTIPLE_PRIMARY_MESSAGES",
    "MISSING_HERO_MOMENT",
    "MISSING_EMOTIONAL_TONE",
    "BUSINESS_MODEL_CONFLICT",
    "INVALID_STORY_PATTERN",
    "STORY_INCONSISTENT",
    "DESIGN_DECISION_DETECTED",
    "DIRECTOR_VALIDATION_FAILED",
  ];
  return codes.includes(code as VisualStoryPlanningFailureCode);
}

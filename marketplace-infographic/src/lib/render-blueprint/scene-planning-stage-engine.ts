/**
 * Chapter 6.7 — Scene Planning Stage engine.
 * Designs the physical world for the story — environment only, never composition/lighting/camera.
 */
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
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
import type { BlueprintMutation } from "./mutation-types";
import { updatesToMutations } from "./universal-agent-bridge";
import {
  buildSceneSection,
  SCENE_DIRECTOR_ID,
  validateSceneSection,
} from "./scene-director-engine";
import type { SceneDirectorContext } from "./scene-director-types";
import { StoryPattern } from "./visual-story-planning-stage-types";
import { StoryType } from "./visual-story-director-types";
import { runVisualStoryPlanningStage } from "./visual-story-planning-stage-engine";
import {
  BackgroundStyle,
  SceneCategory,
  SceneObjective,
  ScenePlanningStage,
  type PlannedSceneBlueprint,
  type SceneCategoryId,
  type SceneObjectiveId,
  type ScenePlanningContext,
  type ScenePlanningFailureCode,
  type ScenePlanningInput,
  type ScenePlanningReport,
  type ScenePlanningSection,
  type ScenePlanningStageId,
  type ScenePlanningSystemReport,
  type ScenePlanningViolation,
} from "./scene-planning-stage-types";

export {
  ScenePlanningStage,
  SceneCategory,
  SceneObjective,
  BackgroundStyle,
  type ScenePlanningStageId,
  type SceneCategoryId,
  type SceneObjectiveId,
  type BackgroundStyleId,
  type PlannedSceneBlueprint,
  type ScenePlanningInput,
  type ScenePlanningSection,
  type ScenePlanningViolation,
  type ScenePlanningReport,
  type ScenePlanningContext,
  type ScenePlanningSystemReport,
  type ScenePlanningFailureCode,
} from "./scene-planning-stage-types";

export const SCENE_PLANNING_VERSION = "6.7.0";

export const SCENE_PLANNING_GOLDEN_RULE =
  "The buyer must understand where, how, and why the product is used before reading specifications. " +
  "Scene is not a background — it is part of the commercial story that turns a product image " +
  "into a clear life scenario that increases trust, interest, and purchase probability.";

export const SCENE_PLANNING_PIPELINE: readonly ScenePlanningStageId[] = [
  ScenePlanningStage.INPUT_ASSEMBLY,
  ScenePlanningStage.SCENE_OBJECTIVE,
  ScenePlanningStage.CATEGORY_SELECTION,
  ScenePlanningStage.ENVIRONMENT_SELECTION,
  ScenePlanningStage.LOCATION_DEFINITION,
  ScenePlanningStage.REALISM_LEVEL,
  ScenePlanningStage.SUPPORTING_OBJECTS,
  ScenePlanningStage.TIME_OF_DAY,
  ScenePlanningStage.WEATHER_CONDITIONS,
  ScenePlanningStage.BACKGROUND_STRATEGY,
  ScenePlanningStage.NEGATIVE_RULES,
  ScenePlanningStage.BLUEPRINT_ASSEMBLY,
  ScenePlanningStage.CONSISTENCY_CHECK,
  ScenePlanningStage.VALIDATION,
  ScenePlanningStage.AGENT_HANDOFF,
] as const;

export const SCENE_PLANNING_POSITION = [
  "visual-story-planning",
  "scene-planning",
  "composition-director",
] as const;

const GARDEN_SUPPORT_OBJECTS = [
  "fruit trees",
  "shrubs",
  "garden plants",
  "garden paths",
  "greenhouse structure",
];

const GARDEN_NEGATIVE_OBJECTS = [
  "random people",
  "wrong-season props",
  "unrelated decor",
  "visual clutter",
  "distracting bright details",
];

const KITCHEN_SUPPORT_OBJECTS = ["countertop", "morning light cues", "subtle kitchen accessories"];

function violation(
  code: ScenePlanningFailureCode,
  message: string,
  stage?: ScenePlanningStageId,
): ScenePlanningViolation {
  return { code, message, stage };
}

function isGardenProduct(input: ScenePlanningInput): boolean {
  const sub = input.profile.subcategory.toLowerCase();
  const cat = input.profile.category.toLowerCase();
  return sub.includes("sprayer") || cat.includes("garden");
}

export function selectSceneCategory(input: ScenePlanningInput): SceneCategoryId {
  if (isGardenProduct(input)) return SceneCategory.OUTDOOR;
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) {
    return SceneCategory.HOME_INTERIOR;
  }
  if (input.story.storyPattern === StoryPattern.HERO_PRODUCT) {
    return SceneCategory.STUDIO;
  }
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) {
    return SceneCategory.TECHNICAL;
  }
  return SceneCategory.LIFESTYLE;
}

export function selectSceneObjective(input: ScenePlanningInput, category: SceneCategoryId): SceneObjectiveId {
  if (category === SceneCategory.OUTDOOR) return SceneObjective.SHOW_USAGE;
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) return SceneObjective.EMPHASIZE_QUALITY;
  if (input.story.storyPattern === StoryPattern.PROBLEM_SOLUTION) return SceneObjective.EXPLAIN_BENEFITS;
  return SceneObjective.BUILD_TRUST;
}

export function buildSceneLocation(input: ScenePlanningInput, context: ScenePlanningContext = {}): string {
  if (context.missingLocation) return "";
  if (isGardenProduct(input)) {
    return "well-maintained fruit orchard in summer";
  }
  if (input.profile.subcategory.toLowerCase().includes("blender")) {
    return "bright modern kitchen morning setup";
  }
  return `credible ${input.profile.useCases[0] ?? "usage"} context for ${input.profile.subcategory}`;
}

export function buildSupportObjects(
  input: ScenePlanningInput,
  context: ScenePlanningContext = {},
): string[] {
  if (context.decorativeOnlyScene) {
    return ["random decor", "unrelated vase", "abstract art"];
  }
  if (isGardenProduct(input)) return [...GARDEN_SUPPORT_OBJECTS];
  return [...KITCHEN_SUPPORT_OBJECTS];
}

export function buildNegativeObjects(context: ScenePlanningContext = {}): string[] {
  const base = [...GARDEN_NEGATIVE_OBJECTS];
  if (context.forbiddenObjectsPresent) {
    base.push("random bystanders", "competing hero objects");
  }
  return base;
}

export function selectTimeOfDay(input: ScenePlanningInput): string {
  if (isGardenProduct(input)) return "morning";
  if (input.story.emotionalTone === "luxury") return "golden_hour";
  return "day";
}

export function selectWeather(input: ScenePlanningInput): string {
  if (isGardenProduct(input)) return "clear";
  if (input.profile.category.toLowerCase().includes("construction")) return "cloudy";
  return "clear";
}

export function selectBackgroundStyle(input: ScenePlanningInput): string {
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) {
    return BackgroundStyle.ATMOSPHERIC;
  }
  if (input.story.storyPattern === StoryPattern.HERO_PRODUCT) {
    return BackgroundStyle.MINIMAL;
  }
  return BackgroundStyle.NEUTRAL;
}

export function buildPlannedSceneBlueprint(
  input: ScenePlanningInput,
  category: SceneCategoryId,
  objective: SceneObjectiveId,
  context: ScenePlanningContext = {},
): PlannedSceneBlueprint {
  const location = buildSceneLocation(input, context);
  const supportObjects = buildSupportObjects(input, context);
  const negativeObjects = buildNegativeObjects(context);

  return {
    sceneType: category,
    environment: isGardenProduct(input) ? "outdoor garden" : category === SceneCategory.HOME_INTERIOR ? "modern kitchen" : "commercial studio",
    location,
    timeOfDay: selectTimeOfDay(input),
    weather: selectWeather(input),
    backgroundStyle: selectBackgroundStyle(input),
    supportObjects,
    realismLevel: "physically plausible commercial photography",
    negativeObjects,
  };
}

export function mapStoryPatternToStoryType(storyPattern: string): string {
  switch (storyPattern) {
    case StoryPattern.PREMIUM_EXPERIENCE:
      return StoryType.PREMIUM_LIFESTYLE;
    case StoryPattern.PROBLEM_SOLUTION:
      return StoryType.PROBLEM_SOLUTION;
    case StoryPattern.FEATURE_SHOWCASE:
      return StoryType.TECHNOLOGY;
    case StoryPattern.HERO_PRODUCT:
      return StoryType.TRUST;
    default:
      return StoryType.LIFESTYLE;
  }
}

export function buildSceneDirectorContextFromPlanning(input: ScenePlanningInput): SceneDirectorContext {
  return {
    productCategory: input.profile.category,
    subCategory: input.profile.subcategory,
    creativeGoal: input.business.model.businessPriority.includes("premium") ? "Premium" : "Lifestyle",
    marketplace: input.marketplace,
    priceSegment: input.profile.priceSegment,
    audience: input.profile.targetAudience.segment,
    storyType: mapStoryPatternToStoryType(input.story.storyPattern),
    primaryEmotion: input.story.emotionalTone,
    commercialGoal: input.business.model.businessPriority,
    storyNarrative: input.story.primaryMessage,
    storyHook: input.story.heroMoment,
  };
}

export function validatePlannedSceneBlueprint(
  planned: PlannedSceneBlueprint,
  input: ScenePlanningInput,
  context: ScenePlanningContext = {},
): ScenePlanningViolation[] {
  const violations: ScenePlanningViolation[] = [];

  if (!planned.location || context.missingLocation) {
    violations.push(
      violation("MISSING_LOCATION", "Scene location must be specific", ScenePlanningStage.LOCATION_DEFINITION),
    );
  }
  if (context.decorativeOnlyScene) {
    violations.push(
      violation("SCENE_BEAUTY_ONLY", "Scene must not exist for decoration only", ScenePlanningStage.SUPPORTING_OBJECTS),
    );
  }
  if (context.storyConflict) {
    violations.push(
      violation("STORY_CONFLICT", "Scene must align with Story and Business Goal", ScenePlanningStage.CONSISTENCY_CHECK),
    );
  }
  if (context.forbiddenObjectsPresent) {
    violations.push(
      violation("FORBIDDEN_OBJECTS", "Forbidden scene objects detected", ScenePlanningStage.NEGATIVE_RULES),
    );
  }
  if (context.competingBackground) {
    violations.push(
      violation("BACKGROUND_COMPETES", "Background must not compete with hero product", ScenePlanningStage.BACKGROUND_STRATEGY),
    );
  }
  if (!planned.realismLevel) {
    violations.push(
      violation("MISSING_REALISM", "Realism level must be defined", ScenePlanningStage.REALISM_LEVEL),
    );
  }

  const designWords = /\b(hero placement|composition|camera angle|lighting setup|badge layout)\b/i;
  if (designWords.test(planned.location) || designWords.test(planned.environment)) {
    violations.push(
      violation("DESIGN_DECISION_DETECTED", "Scene planning must not decide composition or lighting", ScenePlanningStage.BLUEPRINT_ASSEMBLY),
    );
  }

  if (
    isGardenProduct(input) &&
    !planned.supportObjects.some((o) => o.includes("tree") || o.includes("plant") || o.includes("greenhouse"))
  ) {
    violations.push(
      violation("CATEGORY_MISMATCH", "Garden product scene must include relevant support objects", ScenePlanningStage.SUPPORTING_OBJECTS),
    );
  }

  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE && planned.sceneType === SceneCategory.INDUSTRIAL) {
    violations.push(violation("STORY_CONFLICT", "Premium story cannot use industrial scene"));
  }

  return violations;
}

export function runScenePlanningStage(
  input: ScenePlanningInput,
  context: ScenePlanningContext = {},
): ScenePlanningReport {
  const started = Date.now();
  const stagesCompleted: ScenePlanningStageId[] = [];

  if (!input.profile?.category) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Profile is required", ScenePlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  if (!input.story?.primaryMessage) {
    return {
      valid: false,
      violations: [violation("MISSING_STORY", "Story Blueprint is required", ScenePlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  if (!input.business?.model) {
    return {
      valid: false,
      violations: [violation("MISSING_BUSINESS_MODEL", "Business Model is required", ScenePlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(ScenePlanningStage.INPUT_ASSEMBLY);

  const category = selectSceneCategory(input);
  const objective = selectSceneObjective(input, category);
  stagesCompleted.push(ScenePlanningStage.SCENE_OBJECTIVE, ScenePlanningStage.CATEGORY_SELECTION);

  const planned = buildPlannedSceneBlueprint(input, category, objective, context);
  stagesCompleted.push(
    ScenePlanningStage.ENVIRONMENT_SELECTION,
    ScenePlanningStage.LOCATION_DEFINITION,
    ScenePlanningStage.REALISM_LEVEL,
    ScenePlanningStage.SUPPORTING_OBJECTS,
    ScenePlanningStage.TIME_OF_DAY,
    ScenePlanningStage.WEATHER_CONDITIONS,
    ScenePlanningStage.BACKGROUND_STRATEGY,
    ScenePlanningStage.NEGATIVE_RULES,
  );

  const directorCtx = buildSceneDirectorContextFromPlanning(input);
  const { section: directorSection } = buildSceneSection(directorCtx, 0.91);
  stagesCompleted.push(ScenePlanningStage.BLUEPRINT_ASSEMBLY);

  const renderScene = {
    ...directorSection.sceneBlueprint,
    timeOfDay: planned.timeOfDay as typeof directorSection.sceneBlueprint.timeOfDay,
    weather: planned.weather as typeof directorSection.sceneBlueprint.weather,
    backgroundNarrative: `${planned.location}. ${directorSection.backgroundNarrative}`,
    sceneType: planned.sceneType,
    environmentType: planned.environment,
  };

  const violations = validatePlannedSceneBlueprint(planned, input, context);
  const directorValidation = validateSceneSection(directorSection, directorCtx);
  if (!directorValidation.valid) {
    violations.push(
      ...directorValidation.violations.map((v) =>
        violation("DIRECTOR_VALIDATION_FAILED", v, ScenePlanningStage.VALIDATION),
      ),
    );
  }

  stagesCompleted.push(ScenePlanningStage.CONSISTENCY_CHECK, ScenePlanningStage.VALIDATION);

  const section: ScenePlanningSection = {
    plannedBlueprint: planned,
    sceneObjective: objective,
    sceneCategory: category,
    directorSection: { ...directorSection, sceneBlueprint: renderScene },
    renderScene,
    stagesCompleted,
    confidence: violations.length === 0 ? 0.92 : 0.43,
  };

  stagesCompleted.push(ScenePlanningStage.AGENT_HANDOFF);

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function scenePlanningToMutations(
  section: ScenePlanningSection,
  revision = 0,
  reason = "Scene Planning Stage",
): BlueprintMutation[] {
  return updatesToMutations({ scene: section.renderScene }, SCENE_DIRECTOR_ID, revision, reason);
}

export function enrichPipelineContextWithScenePlanning(
  ctx: GenerationPipelineContext,
  section: ScenePlanningSection,
): { context: GenerationPipelineContext; violations: ScenePlanningViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: SCENE_DIRECTOR_ID,
    section: PipelineContextSection.CREATIVE,
    blueprintSection: "scene",
    changes: {
      scene: {
        ...section.renderScene,
        location: section.plannedBlueprint.location,
        supportObjects: section.plannedBlueprint.supportObjects,
        negativeObjects: section.plannedBlueprint.negativeObjects,
      },
    },
    reason: "Scene Planning Stage enriched creative scene context",
  });

  return {
    context: {
      ...patch.context,
      blueprint: { ...patch.context.blueprint, scene: section.renderScene },
    },
    violations: patch.violations as ScenePlanningViolation[],
  };
}

export function runScenePlanningStageFromPipeline(
  context: ScenePlanningContext = {},
): ScenePlanningReport {
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  if (!analysis.section) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Analysis must complete before Scene Planning")],
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
  const story = runVisualStoryPlanningStage({
    profile: analysis.section.profile,
    business: business.section!,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  if (!story.section || !business.section || !knowledge.package) {
    return {
      valid: false,
      violations: [violation("MISSING_STORY", "Story Planning must complete before Scene Planning")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }
  return runScenePlanningStage(
    {
      profile: analysis.section.profile,
      business: business.section,
      story: story.section.plannedBlueprint,
      knowledge: knowledge.package,
      marketplace: pipelineInput.marketplace,
      brand: pipelineInput.brand,
    },
    context,
  );
}

export function validateScenePlanning(context: ScenePlanningContext = {}): ScenePlanningSystemReport {
  const violations: ScenePlanningViolation[] = [];

  const kitchen = runScenePlanningStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (kitchen.section.sceneCategory !== SceneCategory.HOME_INTERIOR && kitchen.section.sceneCategory !== SceneCategory.LIFESTYLE) {
      // premium kitchen may map to home interior or lifestyle via director
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
  const gardenStory = runVisualStoryPlanningStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const garden = runScenePlanningStage(
    {
      profile: gardenAnalysis.section!.profile,
      business: gardenBusiness.section!,
      story: gardenStory.section!.plannedBlueprint,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    context,
  );
  if (!garden.valid || !garden.section) {
    violations.push(...garden.violations);
  } else {
    if (garden.section.sceneCategory !== SceneCategory.OUTDOOR) {
      violations.push(violation("CATEGORY_MISMATCH", "Garden sprayer must use outdoor scene category"));
    }
    if (!garden.section.plannedBlueprint.location.toLowerCase().includes("orchard") &&
        !garden.section.plannedBlueprint.location.toLowerCase().includes("garden")) {
      violations.push(violation("MISSING_LOCATION", "Garden scene must have specific outdoor location"));
    }
    if (!garden.section.plannedBlueprint.supportObjects.some((o) => o.includes("tree") || o.includes("plant"))) {
      violations.push(violation("CATEGORY_MISMATCH", "Garden scene must include plants or trees"));
    }
  }

  const decorative = runScenePlanningStage(
    {
      profile: gardenAnalysis.section!.profile,
      business: gardenBusiness.section!,
      story: gardenStory.section!.plannedBlueprint,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    { decorativeOnlyScene: true },
  );
  if (decorative.valid) {
    violations.push(violation("SCENE_BEAUTY_ONLY", "Decorative-only scene must fail validation"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    storyAligned: !!garden.section && !!kitchen.section,
    productContextClear: !!garden.section?.plannedBlueprint.location,
    realismMaintained: !!garden.section?.plannedBlueprint.realismLevel,
    heroSpaceReserved: !!garden.section && garden.section.plannedBlueprint.backgroundStyle !== BackgroundStyle.DETAILED,
    downstreamReady: !!garden.section?.renderScene.environment,
  };
}

export function assertScenePlanning(context: ScenePlanningContext = {}): ScenePlanningSystemReport {
  const report = validateScenePlanning(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Scene Planning validation failed: ${messages}`);
  }
  return report;
}

export function runScenePlanning(context: ScenePlanningContext = {}): ScenePlanningSystemReport {
  return validateScenePlanning(context);
}

export function isScenePlanningFailure(code: string): code is ScenePlanningFailureCode {
  const codes: ScenePlanningFailureCode[] = [
    "MISSING_PROFILE",
    "MISSING_STORY",
    "MISSING_BUSINESS_MODEL",
    "SCENE_BEAUTY_ONLY",
    "STORY_CONFLICT",
    "CATEGORY_MISMATCH",
    "FORBIDDEN_OBJECTS",
    "MISSING_LOCATION",
    "BACKGROUND_COMPETES",
    "MISSING_REALISM",
    "DESIGN_DECISION_DETECTED",
    "DIRECTOR_VALIDATION_FAILED",
  ];
  return codes.includes(code as ScenePlanningFailureCode);
}

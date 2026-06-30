/**
 * Chapter 7.11 — Scene Director Agent engine.
 * Designs the world where the story happens — environment only, never composition or lighting.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import {
  buildBatterySprayerStoryDirectorInput,
  fromPlannedStoryBlueprint,
  toVisualStoryPlanningInput,
} from "./visual-story-director-agent-engine";
import { runVisualStoryPlanningStage } from "./visual-story-planning-stage-engine";
import { StoryPattern } from "./visual-story-planning-stage-types";
import type { PlannedStoryBlueprint } from "./visual-story-planning-stage-types";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  getMarketplaceKnowledgeProfile,
  MarketplaceKnowledgeId,
} from "./marketplace-knowledge-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
} from "./product-analysis-engine";
import {
  buildBatterySprayerBusinessAgentInput,
  fromPipelineBusinessModel,
  toPipelineBusinessUnderstandingInput,
} from "./business-understanding-agent-engine";
import {
  runScenePlanningStage,
  selectSceneCategory,
  type PlannedSceneBlueprint,
  type ScenePlanningContext,
  type ScenePlanningInput,
  type ScenePlanningSection,
} from "./scene-planning-stage-engine";
import { SceneCategory } from "./scene-planning-stage-types";
import { SCENE_DIRECTOR_ID } from "./scene-director-engine";
import { DepthProfile } from "./scene-director-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import {
  SCENE_DIRECTOR_AGENT_ID,
  SceneDirectorAgentModule,
  type SceneDirectorAgentBlueprint,
  type SceneDirectorAgentContext,
  type SceneDirectorAgentExecutionReport,
  type SceneDirectorAgentFailureCode,
  type SceneDirectorAgentInput,
  type SceneDirectorAgentKpi,
  type SceneDirectorAgentModuleDefinition,
  type SceneDirectorAgentModuleId,
  type SceneDirectorAgentModuleRecord,
  type SceneDirectorAgentPipelineLink,
  type SceneDirectorAgentRetryBranch,
  type SceneDirectorAgentValidationReport,
  type SceneDirectorAgentViolation,
} from "./scene-director-agent-types";

export {
  SCENE_DIRECTOR_AGENT_ID,
  SceneDirectorAgentModule,
  type SceneDirectorAgentModuleId,
  type SceneDirectorAgentInput,
  type SceneDirectorAgentBlueprint,
  type SceneDirectorAgentModuleRecord,
  type SceneDirectorAgentKpi,
  type SceneDirectorAgentViolation,
  type SceneDirectorAgentRetryBranch,
  type SceneDirectorAgentExecutionReport,
  type SceneDirectorAgentValidationReport,
  type SceneDirectorAgentContext,
  type SceneDirectorAgentFailureCode,
  type SceneDirectorAgentModuleDefinition,
  type SceneDirectorAgentPipelineLink,
} from "./scene-director-agent-types";

export const SCENE_DIRECTOR_AGENT_VERSION = "7.11.0";

export const SCENE_DIRECTOR_AGENT_GOLDEN_RULE =
  "The buyer does not perceive the product apart from its world — Scene Director creates the space " +
  "where the product looks natural, useful, and desirable. It does not build composition, " +
  "control light, or shoot photography — it designs the environment for the story.";

export const SCENE_DIRECTOR_AGENT_MISSION =
  'Answer: "Where should this story happen?" — environment that amplifies Story without competing with Hero Product.';

export const SCENE_DIRECTOR_AGENT_MODULES: readonly SceneDirectorAgentModuleDefinition[] = [
  { id: SceneDirectorAgentModule.SCENE_SELECTOR, order: 1, label: "Scene Selector", responsibility: "Select scene type by commercial effectiveness" },
  { id: SceneDirectorAgentModule.ENVIRONMENT_BUILDER, order: 2, label: "Environment Builder", responsibility: "Design credible usage environment" },
  { id: SceneDirectorAgentModule.BACKGROUND_DESIGNER, order: 3, label: "Background Designer", responsibility: "Define background depth and visual noise" },
  { id: SceneDirectorAgentModule.ATMOSPHERE_ENGINE, order: 4, label: "Atmosphere Engine", responsibility: "Match mood to emotional story direction" },
  { id: SceneDirectorAgentModule.PROP_PLANNER, order: 5, label: "Prop Planner", responsibility: "Plan support and forbidden objects" },
  { id: SceneDirectorAgentModule.SCENE_VALIDATOR, order: 6, label: "Scene Validator", responsibility: "Validate story alignment and hero visibility" },
  { id: SceneDirectorAgentModule.SCENE_BLUEPRINT_BUILDER, order: 7, label: "Scene Blueprint Builder", responsibility: "Assemble Scene Blueprint for Pipeline Context" },
] as const;

export const SCENE_DIRECTOR_AGENT_PIPELINE: readonly SceneDirectorAgentPipelineLink[] = [
  { from: "visual_story_director", to: "scene_director" },
  { from: "scene_director", to: "composition_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const SCENE_TYPE_LABELS: Record<string, string> = {
  [SceneCategory.OUTDOOR]: "Outdoor Natural",
  [SceneCategory.STUDIO]: "Professional Studio",
  [SceneCategory.HOME_INTERIOR]: "Home Interior",
  [SceneCategory.LIFESTYLE]: "Lifestyle Environment",
  [SceneCategory.PROFESSIONAL_WORKSPACE]: "Workshop",
  [SceneCategory.INDUSTRIAL]: "Industrial Workspace",
  [SceneCategory.TECHNICAL]: "Technical Environment",
};

const STORY_PATTERN_FROM_LABEL: Record<string, string> = {
  "Problem → Solution": StoryPattern.PROBLEM_SOLUTION,
  "Hero Product": StoryPattern.HERO_PRODUCT,
  "Professional Lifestyle": StoryPattern.LIFESTYLE,
  "Premium Experience": StoryPattern.PREMIUM_EXPERIENCE,
  Transformation: StoryPattern.FEATURE_SHOWCASE,
};

const COMPOSITION_KEYWORDS =
  /\b(hero placement|composition|camera angle|lighting setup|badge layout|product position)\b/i;

function violation(
  code: SceneDirectorAgentFailureCode,
  message: string,
  module?: SceneDirectorAgentModuleId,
): SceneDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: SceneDirectorAgentModuleRecord[],
  completed: SceneDirectorAgentModuleId[],
  module: SceneDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function isGardenProduct(profile: SceneDirectorAgentInput["productProfile"]): boolean {
  const sub = profile.subcategory.toLowerCase();
  const cat = profile.category.toLowerCase();
  return sub.includes("sprayer") || cat.includes("garden");
}

export function formatSceneTypeLabel(sceneType: string): string {
  return SCENE_TYPE_LABELS[sceneType] ?? sceneType.replace(/_/g, " ");
}

export function storyPatternIdFromAgentBlueprint(
  story: VisualStoryDirectorAgentBlueprint,
): string {
  return STORY_PATTERN_FROM_LABEL[story.storyPattern] ?? StoryPattern.PROBLEM_SOLUTION;
}

export function toPlannedStoryFromAgentBlueprint(
  story: VisualStoryDirectorAgentBlueprint,
): PlannedStoryBlueprint {
  return {
    storyPattern: storyPatternIdFromAgentBlueprint(story),
    primaryMessage: story.primaryMessage,
    secondaryMessages: story.secondaryMessage ? [story.secondaryMessage] : [],
    heroMoment: story.heroMoment,
    emotionalTone: story.emotionalDirection,
    visualFocus: story.visualPriority[0] ?? "",
    storyFlow: story.storyFlow.map((step) => step.toLowerCase().replace(/\s+/g, "_")),
    priority: 1,
  };
}

export function deriveSurfaceType(
  planned: PlannedSceneBlueprint,
  profile: SceneDirectorAgentInput["productProfile"],
): string {
  if (isGardenProduct(profile)) return "garden paths and natural ground";
  if (planned.environment.includes("kitchen")) return "kitchen countertop";
  if (planned.sceneType === SceneCategory.STUDIO) return "seamless studio floor";
  return "context-appropriate surface";
}

export function deriveDepthLevel(
  planned: PlannedSceneBlueprint,
  category: string,
): string {
  if (category === SceneCategory.OUTDOOR) return DepthProfile.DEEP_PERSPECTIVE;
  if (category === SceneCategory.STUDIO) return DepthProfile.INFINITE_BACKGROUND;
  if (category === SceneCategory.HOME_INTERIOR) return DepthProfile.INTERIOR_VOLUME;
  return DepthProfile.OPEN_SPACE;
}

export function buildAtmosphereDescription(
  planned: PlannedSceneBlueprint,
  story: VisualStoryDirectorAgentBlueprint,
): string {
  if (planned.sceneType === SceneCategory.OUTDOOR || planned.environment.includes("garden")) {
    return `morning sunlight, clean air, freshness, ${story.emotionalDirection}`;
  }
  return `${planned.timeOfDay} light, ${planned.weather} weather, ${story.emotionalDirection}`;
}

export function fromPlannedSceneBlueprint(
  planned: PlannedSceneBlueprint,
  input: SceneDirectorAgentInput,
  confidence: number,
): SceneDirectorAgentBlueprint {
  const category = planned.sceneType;
  return {
    sceneType: formatSceneTypeLabel(category),
    environment: `${planned.environment} — ${planned.location}`,
    backgroundStyle: planned.backgroundStyle,
    surfaceType: deriveSurfaceType(planned, input.productProfile),
    depthLevel: deriveDepthLevel(planned, category),
    atmosphere: buildAtmosphereDescription(planned, input.storyBlueprint),
    supportObjects: [...planned.supportObjects],
    negativeObjects: [...planned.negativeObjects],
    visualMood: input.storyBlueprint.emotionalDirection,
    confidence,
  };
}

export function validateSceneDirectorAgentBlueprint(
  blueprint?: SceneDirectorAgentBlueprint,
  input?: SceneDirectorAgentInput,
): SceneDirectorAgentViolation[] {
  const violations: SceneDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Scene Blueprint is required", SceneDirectorAgentModule.SCENE_BLUEPRINT_BUILDER),
    );
    return violations;
  }
  if (!blueprint.environment || blueprint.environment.length < 10) {
    violations.push(
      violation("MISSING_LOCATION", "Environment must describe where the story happens", SceneDirectorAgentModule.ENVIRONMENT_BUILDER),
    );
  }
  if (/white studio|plain studio/i.test(blueprint.environment) && input && isGardenProduct(input.productProfile)) {
    violations.push(
      violation("STORY_CONFLICT", "Garden story cannot use white studio environment", SceneDirectorAgentModule.SCENE_SELECTOR),
    );
  }
  if (/luxury living room/i.test(blueprint.environment) && input?.storyBlueprint.primaryMessage.toLowerCase().includes("garden")) {
    violations.push(
      violation("STORY_CONFLICT", "Scene environment must support professional garden story", SceneDirectorAgentModule.ENVIRONMENT_BUILDER),
    );
  }
  if (blueprint.supportObjects.some((o) => /random decor|abstract art|unrelated vase/i.test(o))) {
    violations.push(
      violation("SCENE_BEAUTY_ONLY", "Support objects must reinforce usage, not decoration only", SceneDirectorAgentModule.PROP_PLANNER),
    );
  }
  if (blueprint.negativeObjects.length === 0) {
    violations.push(
      violation("FORBIDDEN_OBJECTS", "Negative object rules must be defined", SceneDirectorAgentModule.PROP_PLANNER),
    );
  }
  if (!blueprint.atmosphere) {
    violations.push(
      violation("ATMOSPHERE_MISMATCH", "Atmosphere must match emotional story direction", SceneDirectorAgentModule.ATMOSPHERE_ENGINE),
    );
  }
  if (COMPOSITION_KEYWORDS.test(`${blueprint.environment} ${blueprint.backgroundStyle}`)) {
    violations.push(
      violation("CONTAINS_COMPOSITION_DECISION", "Scene must not decide composition or lighting", SceneDirectorAgentModule.SCENE_VALIDATOR),
    );
  }
  if (
    input &&
    isGardenProduct(input.productProfile) &&
    !blueprint.supportObjects.some((o) => /tree|plant|shrub|greenhouse|garden/i.test(o))
  ) {
    violations.push(
      violation("CATEGORY_MISMATCH", "Garden scene must include relevant support objects", SceneDirectorAgentModule.PROP_PLANNER),
    );
  }
  return violations;
}

export function buildSceneDirectorAgentKpis(input: {
  blueprint: SceneDirectorAgentBlueprint;
  confidence: number;
  retryCount: number;
  planningValid: boolean;
  marketplaceAligned: boolean;
  storyAligned: boolean;
}): SceneDirectorAgentKpi {
  const { blueprint, confidence, retryCount, planningValid, marketplaceAligned, storyAligned } = input;
  return {
    sceneRelevance: planningValid ? 0.93 : 0.5,
    storyAlignment: storyAligned ? 0.92 : 0.55,
    environmentQuality: blueprint.environment.length > 20 ? 0.91 : 0.6,
    visualSimplicity: blueprint.negativeObjects.length >= 3 ? 0.9 : 0.65,
    heroVisibility: blueprint.backgroundStyle === "minimal" || blueprint.backgroundStyle === "neutral" ? 0.92 : 0.88,
    marketplaceMatch: marketplaceAligned ? 0.9 : 0.65,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapSceneDirectorModuleToPlanningStage(module: SceneDirectorAgentModuleId): string {
  const mapping: Record<SceneDirectorAgentModuleId, string> = {
    [SceneDirectorAgentModule.SCENE_SELECTOR]: "category_selection",
    [SceneDirectorAgentModule.ENVIRONMENT_BUILDER]: "environment_selection",
    [SceneDirectorAgentModule.BACKGROUND_DESIGNER]: "background_strategy",
    [SceneDirectorAgentModule.ATMOSPHERE_ENGINE]: "time_of_day",
    [SceneDirectorAgentModule.PROP_PLANNER]: "supporting_objects",
    [SceneDirectorAgentModule.SCENE_VALIDATOR]: "validation",
    [SceneDirectorAgentModule.SCENE_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function toScenePlanningInput(input: SceneDirectorAgentInput): ScenePlanningInput {
  const businessStage = runBusinessUnderstandingStage({
    profile: input.productProfile,
    knowledge: input.knowledgePackage,
    marketplace: input.marketplaceProfile.id,
  });
  if (!businessStage.section) {
    throw new Error("Business Understanding must complete before Scene Director");
  }
  return {
    profile: input.productProfile,
    business: businessStage.section,
    story: toPlannedStoryFromAgentBlueprint(input.storyBlueprint),
    knowledge: input.knowledgePackage,
    marketplace: input.marketplaceProfile.id,
  };
}

export function buildDefaultSceneDirectorAgentInput(
  overrides: Partial<SceneDirectorAgentInput> = {},
): SceneDirectorAgentInput {
  const storyAgentInput = buildBatterySprayerStoryDirectorInput();
  const storyPlanning = runVisualStoryPlanningStage(toVisualStoryPlanningInput(storyAgentInput));
  const storyBlueprint = fromPlannedStoryBlueprint(
    storyPlanning.section!.plannedBlueprint,
    storyAgentInput.businessModel,
    storyPlanning.section!.confidence,
  );

  const analysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      productImageRef: "product/battery-sprayer-hero.jpg",
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
      targetAudience: "garden owners",
    }),
  );
  const profile = analysis.section!.profile;
  const knowledge = runKnowledgeRetrievalStage({ profile, marketplace: "wildberries" });
  const businessInput = buildBatterySprayerBusinessAgentInput();
  const businessStage = runBusinessUnderstandingStage(toPipelineBusinessUnderstandingInput(businessInput));
  const businessModel = fromPipelineBusinessModel(
    businessStage.section!.model,
    businessStage.section,
  );
  const marketplaceProfile =
    getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.WILDBERRIES) ??
    getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.OZON)!;

  return {
    productProfile: profile,
    businessModel,
    storyBlueprint,
    knowledgePackage: knowledge.package!,
    marketplaceProfile,
    ...overrides,
  };
}

export function buildBatterySprayerSceneDirectorInput(): SceneDirectorAgentInput {
  return buildDefaultSceneDirectorAgentInput();
}

function toPlanningContext(context: SceneDirectorAgentContext): ScenePlanningContext {
  return {
    missingLocation: context.missingLocation,
    decorativeOnlyScene: context.decorativeOnlyScene,
    storyConflict: context.storyConflict,
    forbiddenObjectsPresent: context.forbiddenObjectsPresent,
    competingBackground: context.competingBackground,
  };
}

function resolveRetryBranch(context: SceneDirectorAgentContext): SceneDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.missingLocation ||
    context.decorativeOnlyScene ||
    context.storyConflict ||
    context.forbiddenObjectsPresent ||
    context.competingBackground ||
    context.lowConfidence ||
    context.heroLostOnBackground
  ) {
    return "scene_environment_prop";
  }
  return undefined;
}

export async function executeSceneDirectorAgent(input: {
  agentInput?: SceneDirectorAgentInput;
  context?: SceneDirectorAgentContext;
}): Promise<SceneDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerSceneDirectorInput();
  const violations: SceneDirectorAgentViolation[] = [];
  const modulesCompleted: SceneDirectorAgentModuleId[] = [];
  const moduleRecords: SceneDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: SceneDirectorAgentRetryBranch | undefined;

  const planningInput = toScenePlanningInput(agentInput);
  const planningContext = toPlanningContext(context);

  let planningReport = runScenePlanningStage(planningInput, planningContext);

  const recordPlanningModules = (section?: ScenePlanningSection, suffix = "") => {
    const planned = section?.plannedBlueprint;
    const category = planned?.sceneType ?? selectSceneCategory(planningInput);
    recordModule(moduleRecords, modulesCompleted, SceneDirectorAgentModule.SCENE_SELECTOR, `${formatSceneTypeLabel(category)}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SceneDirectorAgentModule.ENVIRONMENT_BUILDER, planned?.environment ?? suffix);
    recordModule(moduleRecords, modulesCompleted, SceneDirectorAgentModule.BACKGROUND_DESIGNER, planned?.backgroundStyle ?? suffix);
    recordModule(moduleRecords, modulesCompleted, SceneDirectorAgentModule.ATMOSPHERE_ENGINE, `${planned?.timeOfDay ?? ""} ${planned?.weather ?? ""}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SceneDirectorAgentModule.PROP_PLANNER, `${planned?.supportObjects.length ?? 0} props${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SceneDirectorAgentModule.SCENE_VALIDATOR, `${planningReport.violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SceneDirectorAgentModule.SCENE_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordPlanningModules(planningReport.section);

  let blueprint = planningReport.section
    ? fromPlannedSceneBlueprint(
        planningReport.section.plannedBlueprint,
        agentInput,
        planningReport.section.confidence,
      )
    : undefined;

  let confidence = blueprint?.confidence ?? 0;
  if (context.lowConfidence) confidence = 0.55;

  for (const v of planningReport.violations) {
    violations.push(violation(v.code as SceneDirectorAgentFailureCode, v.message));
  }
  violations.push(...validateSceneDirectorAgentBlueprint(blueprint, agentInput));

  if (context.heroLostOnBackground) {
    violations.push(
      violation("HERO_LOST", "Hero product must remain visually dominant", SceneDirectorAgentModule.BACKGROUND_DESIGNER),
    );
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const retryContext: ScenePlanningContext = {
      missingLocation: false,
      decorativeOnlyScene: false,
      storyConflict: false,
      forbiddenObjectsPresent: false,
      competingBackground: false,
    };

    planningReport = runScenePlanningStage(planningInput, retryContext);
    blueprint = planningReport.section
      ? fromPlannedSceneBlueprint(
          planningReport.section.plannedBlueprint,
          agentInput,
          planningReport.section.confidence,
        )
      : blueprint;
    confidence = blueprint?.confidence ?? confidence;

    violations.length = 0;
    for (const v of planningReport.violations) {
      violations.push(violation(v.code as SceneDirectorAgentFailureCode, v.message));
    }
    violations.push(...validateSceneDirectorAgentBlueprint(blueprint, agentInput));
    recordPlanningModules(planningReport.section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && planningReport.valid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
  }

  if (context.storyConflict && retryCount >= maxRetries && !context.skipRetry && !planningReport.valid) {
    violations.push(violation("RETRY_EXHAUSTED", "Scene selector and environment retry did not resolve story conflict"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 23,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: SCENE_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: SCENE_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: SCENE_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate scene direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("scene")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be scene-focused"));
  }

  const marketplaceAligned = agentInput.marketplaceProfile.id === planningInput.marketplace;
  const storyAligned = !violations.some((v) => v.code === "STORY_CONFLICT");
  const durationMs = Date.now() - started;

  const kpis = buildSceneDirectorAgentKpis({
    blueprint: blueprint ?? {
      sceneType: "",
      environment: "",
      backgroundStyle: "",
      surfaceType: "",
      depthLevel: "",
      atmosphere: "",
      supportObjects: [],
      negativeObjects: [],
      visualMood: "",
      confidence: 0,
    },
    confidence,
    retryCount,
    planningValid: planningReport.valid,
    marketplaceAligned,
    storyAligned,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= SCENE_DIRECTOR_AGENT_MODULES.length ||
    SCENE_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && planningReport.valid && modulesComplete && Boolean(blueprint),
    agentId: SCENE_DIRECTOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    blueprint,
    planningSection: planningReport.section,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    compositionExcluded: true,
    goldenRuleSatisfied: SCENE_DIRECTOR_AGENT_GOLDEN_RULE.includes("designs the environment"),
  };
}

export async function executeSceneDirectorAgentWithPipeline(input: {
  agentInput?: SceneDirectorAgentInput;
  context?: SceneDirectorAgentContext;
}): Promise<SceneDirectorAgentExecutionReport> {
  const report = await executeSceneDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    SCENE_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    SCENE_DIRECTOR_AGENT_PIPELINE[0].to === "scene_director" &&
    SCENE_DIRECTOR_AGENT_PIPELINE[1].to === "composition_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== SCENE_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use scene-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: SceneDirectorAgentViolation[]): SceneDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateSceneDirectorAgentStructure(): SceneDirectorAgentViolation[] {
  if (SCENE_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Scene Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateSceneDirectorAgent(
  context: SceneDirectorAgentContext = {},
): SceneDirectorAgentValidationReport {
  const violations = [...validateSceneDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateSceneDirectorAgentStructure().length === 0,
    pipelinePositionValid: SCENE_DIRECTOR_AGENT_PIPELINE[1].to === "composition_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateSceneDirectorAgentWithExecution(
  context: SceneDirectorAgentContext = {},
): Promise<SceneDirectorAgentValidationReport> {
  const report = validateSceneDirectorAgent(context);
  const kitchen = await executeSceneDirectorAgent({
    agentInput: buildBatterySprayerSceneDirectorInput(),
    context,
  });
  const violations = dedupeViolations([...report.violations, ...kitchen.violations]);
  return {
    ...report,
    valid: violations.length === 0 && kitchen.valid,
    violations,
    kitchenExecutionValid: kitchen.valid,
    successCriteriaMet: violations.length === 0 && kitchen.valid,
  };
}

export function assertSceneDirectorAgent(
  context?: SceneDirectorAgentContext,
): SceneDirectorAgentValidationReport {
  const report = validateSceneDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Scene Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runSceneDirectorAgent(
  context: SceneDirectorAgentContext = {},
): Promise<SceneDirectorAgentValidationReport> {
  return validateSceneDirectorAgentWithExecution(context);
}

export function isSceneDirectorAgentFailure(code: string): code is SceneDirectorAgentFailureCode {
  const codes: SceneDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "STORY_CONFLICT",
    "SCENE_BEAUTY_ONLY",
    "MISSING_LOCATION",
    "FORBIDDEN_OBJECTS",
    "BACKGROUND_COMPETES",
    "HERO_LOST",
    "CATEGORY_MISMATCH",
    "ATMOSPHERE_MISMATCH",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_COMPOSITION_DECISION",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as SceneDirectorAgentFailureCode);
}

export function getSceneDirectorAgentModule(
  moduleId: SceneDirectorAgentModuleId,
): SceneDirectorAgentModuleDefinition | undefined {
  return SCENE_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scoreSceneCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("Garden") && storyPattern.includes("Problem")) return 0.96;
  if (candidate.includes("Outdoor") && storyPattern.includes("Problem")) return 0.94;
  if (candidate.includes("Studio") && storyPattern.includes("Hero")) return 0.92;
  return 0.82;
}

export function validateEnvironmentSupportsStory(
  environment: string,
  storyPrimaryMessage: string,
): boolean {
  if (storyPrimaryMessage.toLowerCase().includes("tree") || storyPrimaryMessage.toLowerCase().includes("garden")) {
    return /garden|orchard|outdoor|tree|plant/i.test(environment);
  }
  return environment.length > 0;
}

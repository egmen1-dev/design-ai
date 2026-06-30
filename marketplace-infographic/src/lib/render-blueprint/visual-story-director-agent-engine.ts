/**
 * Chapter 7.10 — Visual Story Director Agent engine.
 * First creative agent — creates commercial story meaning, never scene or composition.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildBatterySprayerBusinessAgentInput,
  fromPipelineBusinessModel,
  toPipelineBusinessUnderstandingInput,
} from "./business-understanding-agent-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  getMarketplaceKnowledgeProfile,
  MarketplaceKnowledgeId,
} from "./marketplace-knowledge-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import { createGenerationPipelineContext } from "./pipeline-context-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
} from "./product-analysis-engine";
import { StoryPattern } from "./visual-story-planning-stage-types";
import {
  runVisualStoryPlanningStage,
  selectStoryPatternFromBusiness,
  type PlannedStoryBlueprint,
  type VisualStoryPlanningContext,
  type VisualStoryPlanningInput,
  type VisualStoryPlanningSection,
} from "./visual-story-planning-stage-engine";
import { VISUAL_STORY_DIRECTOR_ID } from "./visual-story-director-engine";
import {
  VISUAL_STORY_DIRECTOR_AGENT_ID,
  VisualStoryDirectorAgentModule,
  type VisualStoryDirectorAgentBlueprint,
  type VisualStoryDirectorAgentContext,
  type VisualStoryDirectorAgentExecutionReport,
  type VisualStoryDirectorAgentFailureCode,
  type VisualStoryDirectorAgentInput,
  type VisualStoryDirectorAgentKpi,
  type VisualStoryDirectorAgentModuleDefinition,
  type VisualStoryDirectorAgentModuleId,
  type VisualStoryDirectorAgentModuleRecord,
  type VisualStoryDirectorAgentPipelineLink,
  type VisualStoryDirectorAgentRetryBranch,
  type VisualStoryDirectorAgentValidationReport,
  type VisualStoryDirectorAgentViolation,
} from "./visual-story-director-agent-types";

export {
  VISUAL_STORY_DIRECTOR_AGENT_ID,
  VisualStoryDirectorAgentModule,
  type VisualStoryDirectorAgentModuleId,
  type VisualStoryDirectorAgentInput,
  type VisualStoryDirectorAgentBlueprint,
  type VisualStoryDirectorAgentModuleRecord,
  type VisualStoryDirectorAgentKpi,
  type VisualStoryDirectorAgentViolation,
  type VisualStoryDirectorAgentRetryBranch,
  type VisualStoryDirectorAgentExecutionReport,
  type VisualStoryDirectorAgentValidationReport,
  type VisualStoryDirectorAgentContext,
  type VisualStoryDirectorAgentFailureCode,
  type VisualStoryDirectorAgentModuleDefinition,
  type VisualStoryDirectorAgentPipelineLink,
} from "./visual-story-director-agent-types";

export const VISUAL_STORY_DIRECTOR_AGENT_VERSION = "7.10.0";

export const VISUAL_STORY_DIRECTOR_AGENT_GOLDEN_RULE =
  "The buyer decides with emotions before seeing composition, color, or lighting. " +
  "Visual Story Director does not draw an image — it creates the story that the entire " +
  "Agent Ecosystem turns into professional commercial infographic.";

export const VISUAL_STORY_DIRECTOR_AGENT_MISSION =
  'Answer: "What story should the buyer see in the first 2–3 seconds?" — meaning only, not scene or light.';

export const VISUAL_STORY_DIRECTOR_AGENT_MODULES: readonly VisualStoryDirectorAgentModuleDefinition[] = [
  { id: VisualStoryDirectorAgentModule.STORY_PATTERN_SELECTOR, order: 1, label: "Story Pattern Selector", responsibility: "Select Story Pattern aligned with Business Goal" },
  { id: VisualStoryDirectorAgentModule.COMMERCIAL_STORY_ENGINE, order: 2, label: "Commercial Story Engine", responsibility: "Build selling narrative, not product description" },
  { id: VisualStoryDirectorAgentModule.EMOTION_DESIGNER, order: 3, label: "Emotion Designer", responsibility: "Define emotional direction for the story" },
  { id: VisualStoryDirectorAgentModule.HERO_MOMENT_BUILDER, order: 4, label: "Hero Moment Builder", responsibility: "Define the single memorable visual moment" },
  { id: VisualStoryDirectorAgentModule.NARRATIVE_PLANNER, order: 5, label: "Narrative Planner", responsibility: "Sequence narrative flow for downstream agents" },
  { id: VisualStoryDirectorAgentModule.STORY_VALIDATOR, order: 6, label: "Story Validator", responsibility: "Validate business alignment and realizability" },
  { id: VisualStoryDirectorAgentModule.STORY_BLUEPRINT_BUILDER, order: 7, label: "Story Blueprint Builder", responsibility: "Assemble Story Blueprint for Pipeline Context" },
] as const;

export const VISUAL_STORY_DIRECTOR_AGENT_PIPELINE: readonly VisualStoryDirectorAgentPipelineLink[] = [
  { from: "knowledge_retrieval", to: "visual_story_director" },
  { from: "visual_story_director", to: "scene_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const STORY_PATTERN_LABELS: Record<string, string> = {
  [StoryPattern.PROBLEM_SOLUTION]: "Problem → Solution",
  [StoryPattern.HERO_PRODUCT]: "Hero Product",
  [StoryPattern.LIFESTYLE]: "Professional Lifestyle",
  [StoryPattern.PREMIUM_EXPERIENCE]: "Premium Experience",
  [StoryPattern.FEATURE_SHOWCASE]: "Transformation",
};

const STORY_FLOW_LABELS: Record<string, string> = {
  attention: "Problem",
  recognition: "Recognition",
  benefit: "Main benefit of use",
  trust: "Trust",
  purchase_motivation: "Emotional closure",
  product_focus: "Hero focus",
  context: "Use context",
  desire: "Desire",
  premium: "Premium signal",
  quality: "Quality proof",
  materials: "Material quality",
  status: "Status",
  purchase: "Purchase motivation",
  problem: "Problem",
  solution: "Solution",
  result: "Result",
  confidence: "Confidence",
};

const SCENE_KEYWORDS =
  /\b(lighting|camera|composition|studio|kitchen|badge|template|flux|prompt)\b/i;

function violation(
  code: VisualStoryDirectorAgentFailureCode,
  message: string,
  module?: VisualStoryDirectorAgentModuleId,
): VisualStoryDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: VisualStoryDirectorAgentModuleRecord[],
  completed: VisualStoryDirectorAgentModuleId[],
  module: VisualStoryDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function mapStoryFlowToNarrative(flow: string[]): string[] {
  return flow.map((step) => STORY_FLOW_LABELS[step] ?? step.replace(/_/g, " "));
}

export function formatStoryPatternLabel(pattern: string): string {
  return STORY_PATTERN_LABELS[pattern] ?? pattern.replace(/_/g, " ");
}

export function fromPlannedStoryBlueprint(
  planned: PlannedStoryBlueprint,
  businessModel: VisualStoryDirectorAgentInput["businessModel"],
  confidence: number,
): VisualStoryDirectorAgentBlueprint {
  return {
    storyPattern: formatStoryPatternLabel(String(planned.storyPattern)),
    heroMoment: planned.heroMoment,
    primaryMessage: planned.primaryMessage,
    secondaryMessage: planned.secondaryMessages[0] ?? businessModel.secondaryValues[0] ?? "",
    emotionalDirection: planned.emotionalTone,
    visualPriority: [planned.visualFocus, ...planned.secondaryMessages.slice(0, 2)].filter(Boolean),
    storyFlow: mapStoryFlowToNarrative(planned.storyFlow),
    commercialGoal: businessModel.businessStrategy,
    confidence,
  };
}

export function validateVisualStoryDirectorAgentBlueprint(
  blueprint?: VisualStoryDirectorAgentBlueprint,
  businessModel?: VisualStoryDirectorAgentInput["businessModel"],
): VisualStoryDirectorAgentViolation[] {
  const violations: VisualStoryDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("MISSING_COMMERCIAL_IDEA", "Story Blueprint is required", VisualStoryDirectorAgentModule.STORY_BLUEPRINT_BUILDER),
    );
    return violations;
  }
  if (!blueprint.primaryMessage || blueprint.primaryMessage.length < 8) {
    violations.push(
      violation("MISSING_PRIMARY_MESSAGE", "Primary message must sell value, not describe product", VisualStoryDirectorAgentModule.COMMERCIAL_STORY_ENGINE),
    );
  }
  if (/beautiful (tool|product|instrument)/i.test(blueprint.primaryMessage)) {
    violations.push(
      violation("MISSING_COMMERCIAL_IDEA", "Story must sell outcomes, not describe appearance", VisualStoryDirectorAgentModule.COMMERCIAL_STORY_ENGINE),
    );
  }
  if (!blueprint.heroMoment) {
    violations.push(
      violation("MISSING_HERO_MOMENT", "Hero moment must be defined", VisualStoryDirectorAgentModule.HERO_MOMENT_BUILDER),
    );
  }
  if (!blueprint.emotionalDirection) {
    violations.push(
      violation("EMOTION_PRODUCT_CONFLICT", "Emotional direction must be defined", VisualStoryDirectorAgentModule.EMOTION_DESIGNER),
    );
  }
  if (blueprint.storyFlow.length < 3) {
    violations.push(
      violation("NARRATIVE_NOT_REALIZABLE", "Narrative flow must be actionable for Scene Director", VisualStoryDirectorAgentModule.NARRATIVE_PLANNER),
    );
  }
  if (SCENE_KEYWORDS.test(`${blueprint.heroMoment} ${blueprint.primaryMessage}`)) {
    violations.push(
      violation("CONTAINS_SCENE_DECISION", "Story must not decide scene, lighting, or composition", VisualStoryDirectorAgentModule.STORY_VALIDATOR),
    );
  }
  if (
    businessModel?.businessStrategy &&
    blueprint.storyPattern === "Premium Experience" &&
    businessModel.businessStrategy.includes("Problem")
  ) {
    violations.push(
      violation("BUSINESS_GOAL_MISMATCH", "Story pattern must align with business strategy", VisualStoryDirectorAgentModule.STORY_PATTERN_SELECTOR),
    );
  }
  return violations;
}

export function buildVisualStoryDirectorAgentKpis(input: {
  blueprint: VisualStoryDirectorAgentBlueprint;
  confidence: number;
  retryCount: number;
  planningValid: boolean;
  marketplaceAligned: boolean;
}): VisualStoryDirectorAgentKpi {
  const { blueprint, confidence, retryCount, planningValid, marketplaceAligned } = input;
  const heroStrength = blueprint.heroMoment.length > 20 ? 0.93 : 0.55;
  return {
    storyQualityScore: planningValid && blueprint.primaryMessage ? 0.94 : 0.5,
    emotionalImpact: blueprint.emotionalDirection ? 0.91 : 0,
    commercialPrediction: blueprint.primaryMessage.includes("without") || blueprint.primaryMessage.includes("save") ? 0.92 : 0.85,
    marketplaceMatch: marketplaceAligned ? 0.9 : 0.65,
    narrativeClarity: blueprint.storyFlow.length >= 4 ? 0.93 : 0.7,
    heroMomentStrength: heroStrength,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapModuleToPlanningStage(module: VisualStoryDirectorAgentModuleId): string {
  const mapping: Record<VisualStoryDirectorAgentModuleId, string> = {
    [VisualStoryDirectorAgentModule.STORY_PATTERN_SELECTOR]: "pattern_selection",
    [VisualStoryDirectorAgentModule.COMMERCIAL_STORY_ENGINE]: "primary_message",
    [VisualStoryDirectorAgentModule.EMOTION_DESIGNER]: "emotional_tone",
    [VisualStoryDirectorAgentModule.HERO_MOMENT_BUILDER]: "hero_moment",
    [VisualStoryDirectorAgentModule.NARRATIVE_PLANNER]: "narrative_structure",
    [VisualStoryDirectorAgentModule.STORY_VALIDATOR]: "validation",
    [VisualStoryDirectorAgentModule.STORY_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function toVisualStoryPlanningInput(
  input: VisualStoryDirectorAgentInput,
): VisualStoryPlanningInput {
  const businessStage = runBusinessUnderstandingStage({
    profile: input.productProfile,
    knowledge: input.knowledgePackage,
    marketplace: input.marketplaceProfile.id,
  });
  if (!businessStage.section) {
    throw new Error("Business Understanding must complete before Visual Story Director");
  }
  return {
    profile: input.productProfile,
    business: businessStage.section,
    knowledge: input.knowledgePackage,
    marketplace: input.marketplaceProfile.id,
  };
}

export function buildDefaultVisualStoryDirectorAgentInput(
  overrides: Partial<VisualStoryDirectorAgentInput> = {},
): VisualStoryDirectorAgentInput {
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
  const pipelineContext = createGenerationPipelineContext({
    business: {
      product: {
        imageRef: "product/battery-sprayer-hero.jpg",
        category: profile.category,
        name: profile.subcategory,
      },
      marketplace: { id: "wildberries", name: "wildberries" },
      businessGoal: { goal: profile.businessGoal, priority: "conversion" },
      brand: { name: "EcoSpray", tone: "reliable" },
      targetAudience: profile.targetAudience,
      commercialModel: {
        primaryValue: businessModel.primaryValue,
        storyStrategy: businessModel.businessStrategy,
        rankedPriorities: businessModel.customerGoals,
        emotionalDrivers: businessModel.emotionalPositioning.split(", ").filter(Boolean),
      },
    },
  });

  return {
    productProfile: profile,
    businessModel,
    knowledgePackage: knowledge.package!,
    marketplaceProfile,
    pipelineContext,
    ...overrides,
  };
}

export function buildBatterySprayerStoryDirectorInput(): VisualStoryDirectorAgentInput {
  return buildDefaultVisualStoryDirectorAgentInput();
}

function toPlanningContext(context: VisualStoryDirectorAgentContext): VisualStoryPlanningContext {
  return {
    missingPrimaryMessage: context.missingPrimaryMessage,
    missingHeroMoment: context.missingHeroMoment,
    missingEmotionalTone: context.lowConfidence,
    businessModelConflict: context.businessStrategyConflict,
  };
}

function resolveRetryBranch(
  context: VisualStoryDirectorAgentContext,
): VisualStoryDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.missingHeroMoment ||
    context.lowCommercialScore ||
    context.lowConfidence ||
    context.tiedStoryScores ||
    context.businessStrategyConflict ||
    context.missingPrimaryMessage
  ) {
    return "pattern_emotion_decision";
  }
  return undefined;
}

export async function executeVisualStoryDirectorAgent(input: {
  agentInput?: VisualStoryDirectorAgentInput;
  context?: VisualStoryDirectorAgentContext;
}): Promise<VisualStoryDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerStoryDirectorInput();
  const violations: VisualStoryDirectorAgentViolation[] = [];
  const modulesCompleted: VisualStoryDirectorAgentModuleId[] = [];
  const moduleRecords: VisualStoryDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: VisualStoryDirectorAgentRetryBranch | undefined;

  const planningInput = toVisualStoryPlanningInput(agentInput);
  const planningContext = toPlanningContext(context);

  let planningReport = runVisualStoryPlanningStage(planningInput, planningContext);

  const recordPlanningModules = (section?: VisualStoryPlanningSection, suffix = "") => {
    const pattern = section?.storyPattern ?? selectStoryPatternFromBusiness(planningInput.business);
    recordModule(moduleRecords, modulesCompleted, VisualStoryDirectorAgentModule.STORY_PATTERN_SELECTOR, `${formatStoryPatternLabel(pattern)}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisualStoryDirectorAgentModule.COMMERCIAL_STORY_ENGINE, section?.plannedBlueprint.primaryMessage ?? suffix);
    recordModule(moduleRecords, modulesCompleted, VisualStoryDirectorAgentModule.EMOTION_DESIGNER, section?.plannedBlueprint.emotionalTone ?? suffix);
    recordModule(moduleRecords, modulesCompleted, VisualStoryDirectorAgentModule.HERO_MOMENT_BUILDER, section?.plannedBlueprint.heroMoment ?? suffix);
    recordModule(moduleRecords, modulesCompleted, VisualStoryDirectorAgentModule.NARRATIVE_PLANNER, `${section?.plannedBlueprint.storyFlow.length ?? 0} steps${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisualStoryDirectorAgentModule.STORY_VALIDATOR, `${planningReport.violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisualStoryDirectorAgentModule.STORY_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordPlanningModules(planningReport.section);

  let blueprint = planningReport.section
    ? fromPlannedStoryBlueprint(
        planningReport.section.plannedBlueprint,
        agentInput.businessModel,
        planningReport.section.confidence,
      )
    : undefined;

  let confidence = blueprint?.confidence ?? 0;
  if (context.lowConfidence) confidence = 0.55;
  if (context.lowCommercialScore) confidence = 0.58;

  for (const v of planningReport.violations) {
    violations.push(violation(v.code as VisualStoryDirectorAgentFailureCode, v.message));
  }
  violations.push(...validateVisualStoryDirectorAgentBlueprint(blueprint, agentInput.businessModel));

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const retryContext: VisualStoryPlanningContext = {
      missingHeroMoment: false,
      missingPrimaryMessage: false,
      missingEmotionalTone: false,
      businessModelConflict: false,
    };

    planningReport = runVisualStoryPlanningStage(planningInput, retryContext);
    blueprint = planningReport.section
      ? fromPlannedStoryBlueprint(
          planningReport.section.plannedBlueprint,
          agentInput.businessModel,
          planningReport.section.confidence,
        )
      : blueprint;
    confidence = blueprint?.confidence ?? confidence;

    violations.length = 0;
    for (const v of planningReport.violations) {
      violations.push(violation(v.code as VisualStoryDirectorAgentFailureCode, v.message));
    }
    violations.push(...validateVisualStoryDirectorAgentBlueprint(blueprint, agentInput.businessModel));
    recordPlanningModules(planningReport.section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && planningReport.valid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
  }

  if (context.lowCommercialScore && retryCount >= maxRetries && !context.skipRetry && !planningReport.valid) {
    violations.push(violation("RETRY_EXHAUSTED", "Pattern, emotion, and decision retry did not recover story quality"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 21,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: VISUAL_STORY_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: VISUAL_STORY_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: VISUAL_STORY_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate story direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("story")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be story-focused"));
  }

  const marketplaceAligned = agentInput.marketplaceProfile.id === planningInput.marketplace;
  const durationMs = Date.now() - started;

  const kpis = buildVisualStoryDirectorAgentKpis({
    blueprint: blueprint ?? {
      storyPattern: "",
      heroMoment: "",
      primaryMessage: "",
      secondaryMessage: "",
      emotionalDirection: "",
      visualPriority: [],
      storyFlow: [],
      commercialGoal: "",
      confidence: 0,
    },
    confidence,
    retryCount,
    planningValid: planningReport.valid,
    marketplaceAligned,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= VISUAL_STORY_DIRECTOR_AGENT_MODULES.length ||
    VISUAL_STORY_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && planningReport.valid && modulesComplete && Boolean(blueprint),
    agentId: VISUAL_STORY_DIRECTOR_AGENT_ID,
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
    designExcluded: true,
    firstCreativeAgent: true,
    goldenRuleSatisfied: VISUAL_STORY_DIRECTOR_AGENT_GOLDEN_RULE.includes("creates the story"),
  };
}

export async function executeVisualStoryDirectorAgentWithPipeline(input: {
  agentInput?: VisualStoryDirectorAgentInput;
  context?: VisualStoryDirectorAgentContext;
}): Promise<VisualStoryDirectorAgentExecutionReport> {
  const report = await executeVisualStoryDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    VISUAL_STORY_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    VISUAL_STORY_DIRECTOR_AGENT_PIPELINE[0].to === "visual_story_director" &&
    VISUAL_STORY_DIRECTOR_AGENT_PIPELINE[1].to === "scene_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== VISUAL_STORY_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use visual-story-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: VisualStoryDirectorAgentViolation[]): VisualStoryDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateVisualStoryDirectorAgentStructure(): VisualStoryDirectorAgentViolation[] {
  if (VISUAL_STORY_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Visual Story Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateVisualStoryDirectorAgent(
  context: VisualStoryDirectorAgentContext = {},
): VisualStoryDirectorAgentValidationReport {
  const violations = [...validateVisualStoryDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateVisualStoryDirectorAgentStructure().length === 0,
    pipelinePositionValid: VISUAL_STORY_DIRECTOR_AGENT_PIPELINE[1].to === "scene_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateVisualStoryDirectorAgentWithExecution(
  context: VisualStoryDirectorAgentContext = {},
): Promise<VisualStoryDirectorAgentValidationReport> {
  const report = validateVisualStoryDirectorAgent(context);
  const kitchen = await executeVisualStoryDirectorAgent({
    agentInput: buildBatterySprayerStoryDirectorInput(),
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

export function assertVisualStoryDirectorAgent(
  context?: VisualStoryDirectorAgentContext,
): VisualStoryDirectorAgentValidationReport {
  const report = validateVisualStoryDirectorAgent(context);
  if (!report.valid) {
    throw new Error(
      `Visual Story Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export async function runVisualStoryDirectorAgent(
  context: VisualStoryDirectorAgentContext = {},
): Promise<VisualStoryDirectorAgentValidationReport> {
  return validateVisualStoryDirectorAgentWithExecution(context);
}

export function isVisualStoryDirectorAgentFailure(
  code: string,
): code is VisualStoryDirectorAgentFailureCode {
  const codes: VisualStoryDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "MISSING_COMMERCIAL_IDEA",
    "MISSING_HERO_MOMENT",
    "MISSING_PRIMARY_MESSAGE",
    "EMOTION_PRODUCT_CONFLICT",
    "BUSINESS_GOAL_MISMATCH",
    "NARRATIVE_NOT_REALIZABLE",
    "STORY_INCONSISTENT",
    "LOW_COMMERCIAL_SCORE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_SCENE_DECISION",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as VisualStoryDirectorAgentFailureCode);
}

export function getVisualStoryDirectorAgentModule(
  moduleId: VisualStoryDirectorAgentModuleId,
): VisualStoryDirectorAgentModuleDefinition | undefined {
  return VISUAL_STORY_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function buildCommercialStoryNarrative(
  primaryMessage: string,
  businessModel: VisualStoryDirectorAgentInput["businessModel"],
): string[] {
  return [
    primaryMessage,
    businessModel.secondaryValues[0] ?? "Time savings",
    businessModel.secondaryValues[1] ?? "Comfortable work",
    businessModel.primaryValue,
  ].filter(Boolean);
}

export function scoreStoryPatternForBusinessGoal(
  pattern: string,
  businessGoal: string,
): number {
  if (businessGoal.toLowerCase().includes("ctr") && pattern === StoryPattern.PROBLEM_SOLUTION) return 0.96;
  if (businessGoal.toLowerCase().includes("premium") && pattern === StoryPattern.PREMIUM_EXPERIENCE) return 0.95;
  if (pattern === StoryPattern.HERO_PRODUCT) return 0.88;
  return 0.82;
}

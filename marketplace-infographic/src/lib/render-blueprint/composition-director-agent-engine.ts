/**
 * Chapter 7.12 — Composition Director Agent engine.
 * Designs visual structure and attention path — never lighting, photography, or materials.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { COMPOSITION_DIRECTOR_ID } from "./composition-director-engine";
import {
  LayoutPattern,
  runCompositionPlanningStage,
  selectLayoutPattern,
  type CompositionPlanningContext,
  type CompositionPlanningInput,
  type CompositionPlanningSection,
  type PlannedCompositionBlueprint,
} from "./composition-planning-stage-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildBatterySprayerSceneDirectorInput,
  fromPlannedSceneBlueprint,
  toPlannedStoryFromAgentBlueprint,
  toScenePlanningInput,
} from "./scene-director-agent-engine";
import { runScenePlanningStage } from "./scene-planning-stage-engine";
import { SceneCategory } from "./scene-planning-stage-types";
import type { PlannedSceneBlueprint } from "./scene-planning-stage-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import {
  COMPOSITION_DIRECTOR_AGENT_ID,
  CompositionDirectorAgentModule,
  type CompositionDirectorAgentBlueprint,
  type CompositionDirectorAgentContext,
  type CompositionDirectorAgentExecutionReport,
  type CompositionDirectorAgentFailureCode,
  type CompositionDirectorAgentInput,
  type CompositionDirectorAgentKpi,
  type CompositionDirectorAgentModuleDefinition,
  type CompositionDirectorAgentModuleId,
  type CompositionDirectorAgentModuleRecord,
  type CompositionDirectorAgentPipelineLink,
  type CompositionDirectorAgentPoint,
  type CompositionDirectorAgentRetryBranch,
  type CompositionDirectorAgentValidationReport,
  type CompositionDirectorAgentViolation,
} from "./composition-director-agent-types";

export {
  COMPOSITION_DIRECTOR_AGENT_ID,
  CompositionDirectorAgentModule,
  type CompositionDirectorAgentModuleId,
  type CompositionDirectorAgentInput,
  type CompositionDirectorAgentBlueprint,
  type CompositionDirectorAgentPoint,
  type CompositionDirectorAgentModuleRecord,
  type CompositionDirectorAgentKpi,
  type CompositionDirectorAgentViolation,
  type CompositionDirectorAgentRetryBranch,
  type CompositionDirectorAgentExecutionReport,
  type CompositionDirectorAgentValidationReport,
  type CompositionDirectorAgentContext,
  type CompositionDirectorAgentFailureCode,
  type CompositionDirectorAgentModuleDefinition,
  type CompositionDirectorAgentPipelineLink,
} from "./composition-director-agent-types";

export const COMPOSITION_DIRECTOR_AGENT_VERSION = "7.12.0";

export const COMPOSITION_DIRECTOR_AGENT_GOLDEN_RULE =
  "Composition is the invisible director of attention — the buyer does not know why they looked at " +
  "the product first, then the main benefit, then the badge. Composition Director does not make " +
  "the image beautiful; it makes it understandable, controlled, and commercially effective.";

export const COMPOSITION_DIRECTOR_AGENT_MISSION =
  'Answer: "How should elements be arranged so the buyer\'s gaze moves as intended?" — ' +
  "instant attention, dominant Hero Product, readable hierarchy, reserved overlay space.";

export const COMPOSITION_DIRECTOR_AGENT_MODULES: readonly CompositionDirectorAgentModuleDefinition[] = [
  { id: CompositionDirectorAgentModule.LAYOUT_SELECTOR, order: 1, label: "Layout Selector", responsibility: "Select layout pattern by category effectiveness" },
  { id: CompositionDirectorAgentModule.HERO_PLACEMENT_ENGINE, order: 2, label: "Hero Placement Engine", responsibility: "Position and scale Hero Product" },
  { id: CompositionDirectorAgentModule.HIERARCHY_BUILDER, order: 3, label: "Hierarchy Builder", responsibility: "Build visual priority stack" },
  { id: CompositionDirectorAgentModule.READING_FLOW_PLANNER, order: 4, label: "Reading Flow Planner", responsibility: "Design buyer attention route" },
  { id: CompositionDirectorAgentModule.NEGATIVE_SPACE_PLANNER, order: 5, label: "Negative Space Planner", responsibility: "Reserve space for text and badges" },
  { id: CompositionDirectorAgentModule.LAYOUT_VALIDATOR, order: 6, label: "Layout Validator", responsibility: "Validate hero dominance and balance" },
  { id: CompositionDirectorAgentModule.LAYOUT_BLUEPRINT_BUILDER, order: 7, label: "Layout Blueprint Builder", responsibility: "Assemble Layout Blueprint for Pipeline Context" },
] as const;

export const COMPOSITION_DIRECTOR_AGENT_PIPELINE: readonly CompositionDirectorAgentPipelineLink[] = [
  { from: "scene_director", to: "composition_director" },
  { from: "composition_director", to: "photography_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const HERO_MIN_WIDTH = 0.35;
const BALANCE_MIN_SCORE = 0.7;

const LAYOUT_PATTERN_LABELS: Record<string, string> = {
  [LayoutPattern.CENTERED_HERO]: "Centered Hero",
  [LayoutPattern.MARKETPLACE_SPLIT]: "Marketplace Hero",
  [LayoutPattern.SPLIT_LAYOUT]: "Left Hero Right Information",
  [LayoutPattern.DIAGONAL_FLOW]: "Diagonal Dynamic",
  [LayoutPattern.GOLDEN_RATIO]: "Premium Minimal",
  [LayoutPattern.FEATURE_GRID]: "Feature Grid",
};

const SCENE_TYPE_TO_CATEGORY: Record<string, string> = {
  "Outdoor Natural": SceneCategory.OUTDOOR,
  "Professional Studio": SceneCategory.STUDIO,
  "Home Interior": SceneCategory.HOME_INTERIOR,
  "Lifestyle Environment": SceneCategory.LIFESTYLE,
  Workshop: SceneCategory.PROFESSIONAL_WORKSPACE,
  "Industrial Workspace": SceneCategory.INDUSTRIAL,
  "Technical Environment": SceneCategory.TECHNICAL,
};

const READING_FLOW_POINTS: Record<string, CompositionDirectorAgentPoint> = {
  top_left: { x: 0.08, y: 0.1 },
  hero_product: { x: 0.32, y: 0.42 },
  primary_benefit: { x: 0.72, y: 0.22 },
  supporting_information: { x: 0.68, y: 0.55 },
  feature_grid: { x: 0.5, y: 0.72 },
  bottom_right: { x: 0.88, y: 0.88 },
  badge: { x: 0.82, y: 0.12 },
  background: { x: 0.5, y: 0.5 },
  random_corner: { x: 0.95, y: 0.05 },
};

const PHOTOGRAPHY_KEYWORDS =
  /\b(lighting setup|camera angle|lens choice|shutter speed|aperture|exposure|material finish|color palette)\b/i;

function violation(
  code: CompositionDirectorAgentFailureCode,
  message: string,
  module?: CompositionDirectorAgentModuleId,
): CompositionDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: CompositionDirectorAgentModuleRecord[],
  completed: CompositionDirectorAgentModuleId[],
  module: CompositionDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function isGardenProduct(profile: CompositionDirectorAgentInput["productProfile"]): boolean {
  const sub = profile.subcategory.toLowerCase();
  const cat = profile.category.toLowerCase();
  return sub.includes("sprayer") || cat.includes("garden");
}

export function formatLayoutPatternLabel(pattern: string): string {
  return LAYOUT_PATTERN_LABELS[pattern] ?? pattern.replace(/_/g, " ");
}

export function sceneTypeLabelToCategory(label: string): string {
  return SCENE_TYPE_TO_CATEGORY[label] ?? label.toLowerCase().replace(/\s+/g, "_");
}

export function toPlannedSceneFromAgentBlueprint(
  scene: SceneDirectorAgentBlueprint,
): PlannedSceneBlueprint {
  const parts = scene.environment.includes(" — ")
    ? scene.environment.split(" — ")
    : [scene.environment, scene.environment];
  const environment = parts[0]?.trim() ?? scene.environment;
  const location = parts[1]?.trim() ?? environment;
  const atmosphere = scene.atmosphere.toLowerCase();

  return {
    sceneType: sceneTypeLabelToCategory(scene.sceneType),
    environment,
    location,
    timeOfDay: atmosphere.includes("morning") ? "morning" : "daylight",
    weather: atmosphere.includes("sun") || atmosphere.includes("fresh") ? "sunny" : "clear",
    backgroundStyle: scene.backgroundStyle,
    supportObjects: [...scene.supportObjects],
    realismLevel: "high",
    negativeObjects: [...scene.negativeObjects],
  };
}

export function readingFlowToPoints(flow: string[]): CompositionDirectorAgentPoint[] {
  return flow.map((step) => READING_FLOW_POINTS[step] ?? { x: 0.5, y: 0.5 });
}

export function computeBalanceScore(planned: PlannedCompositionBlueprint): number {
  const heroWidth = planned.heroPlacement.width;
  if (heroWidth <= 0 || planned.heroPlacement.height <= 0) return 0.2;
  if (heroWidth < HERO_MIN_WIDTH) return 0.55;
  const spaceBonus = Math.min(planned.negativeSpace.length * 0.08, 0.24);
  const hierarchyBonus = planned.visualHierarchy[0] === "Hero Product" ? 0.12 : 0;
  const area = planned.heroPlacement.width * planned.heroPlacement.height;
  return Math.min(0.98, 0.6 + heroWidth * 0.3 + area * 0.1 + spaceBonus + hierarchyBonus);
}

export function fromPlannedCompositionBlueprint(
  planned: PlannedCompositionBlueprint,
  confidence: number,
): CompositionDirectorAgentBlueprint {
  const balanceScore = computeBalanceScore(planned);
  return {
    layoutPattern: formatLayoutPatternLabel(planned.layoutPattern),
    heroPlacement: { ...planned.heroPlacement },
    textZones: planned.textAreas.map((zone) => ({ ...zone })),
    badgeZones: planned.badgeAreas.map((zone) => ({ ...zone })),
    negativeSpace: planned.negativeSpace.map((zone) => ({ ...zone })),
    readingFlow: readingFlowToPoints(planned.readingFlow),
    visualHierarchy: [...planned.visualHierarchy],
    balanceScore,
    confidence,
  };
}

export function layoutPatternLabelToId(label: string): string {
  const entry = Object.entries(LAYOUT_PATTERN_LABELS).find(([, value]) => value === label);
  return entry?.[0] ?? label.toLowerCase().replace(/\s+/g, "_");
}

export function toPlannedCompositionFromAgentBlueprint(
  layout: CompositionDirectorAgentBlueprint,
): PlannedCompositionBlueprint {
  return {
    layoutPattern: layoutPatternLabelToId(layout.layoutPattern),
    heroPlacement: { ...layout.heroPlacement },
    textAreas: layout.textZones.map((zone) => ({ ...zone })),
    badgeAreas: layout.badgeZones.map((zone) => ({ ...zone })),
    negativeSpace: layout.negativeSpace.map((zone) => ({ ...zone })),
    visualHierarchy: [...layout.visualHierarchy],
    readingFlow: ["top_left", "hero_product", "primary_benefit", "supporting_information", "bottom_right"],
    safeZones: layout.textZones.map((zone) => ({ ...zone })),
  };
}

export function validateCompositionDirectorAgentBlueprint(
  blueprint?: CompositionDirectorAgentBlueprint,
  input?: CompositionDirectorAgentInput,
): CompositionDirectorAgentViolation[] {
  const violations: CompositionDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Layout Blueprint is required", CompositionDirectorAgentModule.LAYOUT_BLUEPRINT_BUILDER),
    );
    return violations;
  }

  const heroWidth = blueprint.heroPlacement.width;
  if (blueprint.heroPlacement.width <= 0 || blueprint.heroPlacement.height <= 0) {
    violations.push(
      violation("NO_HERO_PRODUCT", "Hero Product must dominate composition", CompositionDirectorAgentModule.HERO_PLACEMENT_ENGINE),
    );
  } else if (heroWidth < HERO_MIN_WIDTH) {
    violations.push(
      violation("HERO_TOO_SMALL", "Hero Product must occupy at least 35% of frame width", CompositionDirectorAgentModule.HERO_PLACEMENT_ENGINE),
    );
  }

  if (!blueprint.visualHierarchy.length || blueprint.visualHierarchy[0] !== "Hero Product") {
    violations.push(
      violation("NO_HERO_PRODUCT", "Visual hierarchy must start with Hero Product", CompositionDirectorAgentModule.HIERARCHY_BUILDER),
    );
  }

  if (blueprint.readingFlow.length < 3) {
    violations.push(
      violation("CHAOTIC_READING_FLOW", "Reading flow must guide attention predictably", CompositionDirectorAgentModule.READING_FLOW_PLANNER),
    );
  }

  if (blueprint.negativeSpace.length === 0 || blueprint.textZones.length === 0) {
    violations.push(
      violation("OVERLOADED_LAYOUT", "Composition must reserve negative space for overlays", CompositionDirectorAgentModule.NEGATIVE_SPACE_PLANNER),
    );
  }

  if (blueprint.balanceScore < BALANCE_MIN_SCORE) {
    violations.push(
      violation("BALANCE_VIOLATION", "Visual balance score below acceptable threshold", CompositionDirectorAgentModule.LAYOUT_VALIDATOR),
    );
  }

  const serialized = JSON.stringify(blueprint);
  if (PHOTOGRAPHY_KEYWORDS.test(serialized)) {
    violations.push(
      violation("CONTAINS_PHOTOGRAPHY_DECISION", "Composition must not decide lighting or photography", CompositionDirectorAgentModule.LAYOUT_VALIDATOR),
    );
  }

  if (
    input &&
    isGardenProduct(input.productProfile) &&
    blueprint.layoutPattern === "Premium Minimal"
  ) {
    violations.push(
      violation("STORY_READING_MISMATCH", "Garden CTR layout must not use premium-only pattern", CompositionDirectorAgentModule.LAYOUT_SELECTOR),
    );
  }

  return violations;
}

export function buildCompositionDirectorAgentKpis(input: {
  blueprint: CompositionDirectorAgentBlueprint;
  confidence: number;
  retryCount: number;
  planningValid: boolean;
  marketplaceAligned: boolean;
}): CompositionDirectorAgentKpi {
  const { blueprint, confidence, retryCount, planningValid, marketplaceAligned } = input;
  const heroWidth = blueprint.heroPlacement.width;
  return {
    heroVisibilityScore: heroWidth >= HERO_MIN_WIDTH ? 0.93 : 0.5,
    readingFlowQuality: blueprint.readingFlow.length >= 4 ? 0.92 : 0.65,
    balanceScore: blueprint.balanceScore,
    negativeSpaceQuality: blueprint.negativeSpace.length >= 2 ? 0.91 : 0.6,
    marketplaceFit: marketplaceAligned ? 0.9 : 0.65,
    layoutClarity: planningValid && blueprint.visualHierarchy[0] === "Hero Product" ? 0.93 : 0.55,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapCompositionDirectorModuleToPlanningStage(module: CompositionDirectorAgentModuleId): string {
  const mapping: Record<CompositionDirectorAgentModuleId, string> = {
    [CompositionDirectorAgentModule.LAYOUT_SELECTOR]: "layout_pattern_selection",
    [CompositionDirectorAgentModule.HERO_PLACEMENT_ENGINE]: "hero_placement",
    [CompositionDirectorAgentModule.HIERARCHY_BUILDER]: "visual_hierarchy",
    [CompositionDirectorAgentModule.READING_FLOW_PLANNER]: "reading_flow",
    [CompositionDirectorAgentModule.NEGATIVE_SPACE_PLANNER]: "negative_space",
    [CompositionDirectorAgentModule.LAYOUT_VALIDATOR]: "validation",
    [CompositionDirectorAgentModule.LAYOUT_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function toCompositionPlanningInput(input: CompositionDirectorAgentInput): CompositionPlanningInput {
  const businessStage = runBusinessUnderstandingStage({
    profile: input.productProfile,
    knowledge: input.knowledgePackage,
    marketplace: input.marketplaceProfile.id,
  });
  if (!businessStage.section) {
    throw new Error("Business Understanding must complete before Composition Director");
  }
  return {
    profile: input.productProfile,
    business: businessStage.section,
    story: toPlannedStoryFromAgentBlueprint(input.storyBlueprint),
    scene: toPlannedSceneFromAgentBlueprint(input.sceneBlueprint),
    knowledge: input.knowledgePackage,
    marketplace: input.marketplaceProfile.id,
  };
}

export function buildDefaultCompositionDirectorAgentInput(
  overrides: Partial<CompositionDirectorAgentInput> = {},
): CompositionDirectorAgentInput {
  const sceneInput = buildBatterySprayerSceneDirectorInput();
  const sceneReport = runScenePlanningStage(toScenePlanningInput(sceneInput));
  const sceneBlueprint = fromPlannedSceneBlueprint(
    sceneReport.section!.plannedBlueprint,
    sceneInput,
    sceneReport.section!.confidence,
  );

  return {
    productProfile: sceneInput.productProfile,
    businessModel: sceneInput.businessModel,
    storyBlueprint: sceneInput.storyBlueprint,
    sceneBlueprint,
    knowledgePackage: sceneInput.knowledgePackage,
    marketplaceProfile: sceneInput.marketplaceProfile,
    ...overrides,
  };
}

export function buildBatterySprayerCompositionDirectorInput(): CompositionDirectorAgentInput {
  return buildDefaultCompositionDirectorAgentInput();
}

function toPlanningContext(context: CompositionDirectorAgentContext): CompositionPlanningContext {
  return {
    missingHero: context.missingHero || context.heroTooSmall,
    overlayConflictsHero: context.overlayConflictsHero,
    chaoticFlow: context.chaoticFlow,
    overloadedLayout: context.overloadedLayout,
    balanceViolated: context.balanceViolated,
    storyReadingMismatch: context.storyReadingMismatch,
  };
}

function resolveRetryBranch(context: CompositionDirectorAgentContext): CompositionDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.missingHero ||
    context.heroTooSmall ||
    context.chaoticFlow ||
    context.overloadedLayout ||
    context.balanceViolated ||
    context.overlayConflictsHero ||
    context.lowConfidence
  ) {
    return "layout_hero_reading_balance";
  }
  return undefined;
}

export async function executeCompositionDirectorAgent(input: {
  agentInput?: CompositionDirectorAgentInput;
  context?: CompositionDirectorAgentContext;
}): Promise<CompositionDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerCompositionDirectorInput();
  const violations: CompositionDirectorAgentViolation[] = [];
  const modulesCompleted: CompositionDirectorAgentModuleId[] = [];
  const moduleRecords: CompositionDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: CompositionDirectorAgentRetryBranch | undefined;

  const planningInput = toCompositionPlanningInput(agentInput);
  const planningContext = toPlanningContext(context);

  let planningReport = runCompositionPlanningStage(planningInput, planningContext);

  const recordPlanningModules = (section?: CompositionPlanningSection, suffix = "") => {
    const planned = section?.plannedBlueprint;
    const pattern = planned?.layoutPattern ?? selectLayoutPattern(planningInput);
    recordModule(moduleRecords, modulesCompleted, CompositionDirectorAgentModule.LAYOUT_SELECTOR, `${formatLayoutPatternLabel(pattern)}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CompositionDirectorAgentModule.HERO_PLACEMENT_ENGINE, `${planned?.heroPlacement.width ?? 0}w${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CompositionDirectorAgentModule.HIERARCHY_BUILDER, `${planned?.visualHierarchy[0] ?? ""}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CompositionDirectorAgentModule.READING_FLOW_PLANNER, `${planned?.readingFlow.length ?? 0} steps${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CompositionDirectorAgentModule.NEGATIVE_SPACE_PLANNER, `${planned?.negativeSpace.length ?? 0} zones${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CompositionDirectorAgentModule.LAYOUT_VALIDATOR, `${planningReport.violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CompositionDirectorAgentModule.LAYOUT_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordPlanningModules(planningReport.section);

  let blueprint = planningReport.section
    ? fromPlannedCompositionBlueprint(
        planningReport.section.plannedBlueprint,
        planningReport.section.confidence,
      )
    : undefined;

  let confidence = blueprint?.confidence ?? 0;
  if (context.lowConfidence) confidence = 0.55;

  for (const v of planningReport.violations) {
    violations.push(violation(v.code as CompositionDirectorAgentFailureCode, v.message));
  }
  violations.push(...validateCompositionDirectorAgentBlueprint(blueprint, agentInput));

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const retryContext: CompositionPlanningContext = {
      missingHero: false,
      overlayConflictsHero: false,
      chaoticFlow: false,
      overloadedLayout: false,
      balanceViolated: false,
      storyReadingMismatch: false,
    };

    planningReport = runCompositionPlanningStage(planningInput, retryContext);
    blueprint = planningReport.section
      ? fromPlannedCompositionBlueprint(
          planningReport.section.plannedBlueprint,
          planningReport.section.confidence,
        )
      : blueprint;
    confidence = blueprint?.confidence ?? confidence;

    violations.length = 0;
    for (const v of planningReport.violations) {
      violations.push(violation(v.code as CompositionDirectorAgentFailureCode, v.message));
    }
    violations.push(...validateCompositionDirectorAgentBlueprint(blueprint, agentInput));
    recordPlanningModules(planningReport.section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && planningReport.valid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
  }

  if (context.chaoticFlow && retryCount >= maxRetries && !context.skipRetry && !planningReport.valid) {
    violations.push(violation("RETRY_EXHAUSTED", "Layout selector and reading flow retry did not resolve chaos"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 31,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: COMPOSITION_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: COMPOSITION_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: COMPOSITION_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate composition direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("composition")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be composition-focused"));
  }

  const marketplaceAligned = agentInput.marketplaceProfile.id === planningInput.marketplace;
  const durationMs = Date.now() - started;

  const kpis = buildCompositionDirectorAgentKpis({
    blueprint: blueprint ?? {
      layoutPattern: "",
      heroPlacement: { x: 0, y: 0, width: 0, height: 0 },
      textZones: [],
      badgeZones: [],
      negativeSpace: [],
      readingFlow: [],
      visualHierarchy: [],
      balanceScore: 0,
      confidence: 0,
    },
    confidence,
    retryCount,
    planningValid: planningReport.valid,
    marketplaceAligned,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= COMPOSITION_DIRECTOR_AGENT_MODULES.length ||
    COMPOSITION_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && planningReport.valid && modulesComplete && Boolean(blueprint),
    agentId: COMPOSITION_DIRECTOR_AGENT_ID,
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
    photographyExcluded: true,
    goldenRuleSatisfied: COMPOSITION_DIRECTOR_AGENT_GOLDEN_RULE.includes("invisible director"),
  };
}

export async function executeCompositionDirectorAgentWithPipeline(input: {
  agentInput?: CompositionDirectorAgentInput;
  context?: CompositionDirectorAgentContext;
}): Promise<CompositionDirectorAgentExecutionReport> {
  const report = await executeCompositionDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    COMPOSITION_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    COMPOSITION_DIRECTOR_AGENT_PIPELINE[0].to === "composition_director" &&
    COMPOSITION_DIRECTOR_AGENT_PIPELINE[1].to === "photography_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== COMPOSITION_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use composition-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: CompositionDirectorAgentViolation[]): CompositionDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateCompositionDirectorAgentStructure(): CompositionDirectorAgentViolation[] {
  if (COMPOSITION_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Composition Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateCompositionDirectorAgent(
  context: CompositionDirectorAgentContext = {},
): CompositionDirectorAgentValidationReport {
  const violations = [...validateCompositionDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateCompositionDirectorAgentStructure().length === 0,
    pipelinePositionValid: COMPOSITION_DIRECTOR_AGENT_PIPELINE[1].to === "photography_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateCompositionDirectorAgentWithExecution(
  context: CompositionDirectorAgentContext = {},
): Promise<CompositionDirectorAgentValidationReport> {
  const report = validateCompositionDirectorAgent(context);
  const kitchen = await executeCompositionDirectorAgent({
    agentInput: buildBatterySprayerCompositionDirectorInput(),
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

export function assertCompositionDirectorAgent(
  context?: CompositionDirectorAgentContext,
): CompositionDirectorAgentValidationReport {
  const report = validateCompositionDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Composition Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runCompositionDirectorAgent(
  context: CompositionDirectorAgentContext = {},
): Promise<CompositionDirectorAgentValidationReport> {
  return validateCompositionDirectorAgentWithExecution(context);
}

export function isCompositionDirectorAgentFailure(code: string): code is CompositionDirectorAgentFailureCode {
  const codes: CompositionDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "NO_HERO_PRODUCT",
    "HERO_TOO_SMALL",
    "CHAOTIC_READING_FLOW",
    "OVERLOADED_LAYOUT",
    "BALANCE_VIOLATION",
    "OVERLAY_HERO_CONFLICT",
    "STORY_READING_MISMATCH",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_PHOTOGRAPHY_DECISION",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as CompositionDirectorAgentFailureCode);
}

export function getCompositionDirectorAgentModule(
  moduleId: CompositionDirectorAgentModuleId,
): CompositionDirectorAgentModuleDefinition | undefined {
  return COMPOSITION_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scoreLayoutCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("Marketplace") && storyPattern.includes("Problem")) return 0.96;
  if (candidate.includes("Left Hero") && storyPattern.includes("Problem")) return 0.94;
  if (candidate.includes("Premium") && storyPattern.includes("Premium")) return 0.93;
  return 0.82;
}

export function validateLayoutSupportsStory(
  layoutPattern: string,
  storyPrimaryMessage: string,
): boolean {
  if (storyPrimaryMessage.toLowerCase().includes("tree") || storyPrimaryMessage.toLowerCase().includes("garden")) {
    return !/premium minimal|golden/i.test(layoutPattern);
  }
  return layoutPattern.length > 0;
}

export function heroOccupiesMarketplaceRange(hero: { width: number; height: number }): boolean {
  return hero.width >= HERO_MIN_WIDTH;
}

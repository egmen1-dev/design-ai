/**
 * Chapter 7.8 — Business Understanding Agent engine.
 * Transforms product understanding into commercial strategy — benefits, not specs.
 */
import {
  runBusinessUnderstandingStage,
  transformFeaturesToBenefits,
  type BusinessUnderstandingContext,
  type BusinessUnderstandingSection,
  type PipelineBusinessModel,
} from "./business-understanding-engine";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { analyzeDecisionProblem } from "./agent-professional-decision-engine";
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
  BUSINESS_UNDERSTANDING_AGENT_ID,
  BusinessUnderstandingAgentModule,
  type BusinessUnderstandingAgentCompetitorKnowledge,
  type BusinessUnderstandingAgentContext,
  type BusinessUnderstandingAgentExecutionReport,
  type BusinessUnderstandingAgentFailureCode,
  type BusinessUnderstandingAgentInput,
  type BusinessUnderstandingAgentKpi,
  type BusinessUnderstandingAgentModel,
  type BusinessUnderstandingAgentModuleDefinition,
  type BusinessUnderstandingAgentModuleId,
  type BusinessUnderstandingAgentModuleRecord,
  type BusinessUnderstandingAgentPipelineLink,
  type BusinessUnderstandingAgentRetryBranch,
  type BusinessUnderstandingAgentValidationReport,
  type BusinessUnderstandingAgentViolation,
} from "./business-understanding-agent-types";

export {
  BUSINESS_UNDERSTANDING_AGENT_ID,
  BusinessUnderstandingAgentModule,
  type BusinessUnderstandingAgentModuleId,
  type BusinessUnderstandingAgentCompetitorKnowledge,
  type BusinessUnderstandingAgentInput,
  type BusinessUnderstandingAgentModel,
  type BusinessUnderstandingAgentModuleRecord,
  type BusinessUnderstandingAgentKpi,
  type BusinessUnderstandingAgentViolation,
  type BusinessUnderstandingAgentRetryBranch,
  type BusinessUnderstandingAgentExecutionReport,
  type BusinessUnderstandingAgentValidationReport,
  type BusinessUnderstandingAgentContext,
  type BusinessUnderstandingAgentFailureCode,
  type BusinessUnderstandingAgentModuleDefinition,
  type BusinessUnderstandingAgentPipelineLink,
} from "./business-understanding-agent-types";

export const BUSINESS_UNDERSTANDING_AGENT_VERSION = "7.8.0";

export const BUSINESS_UNDERSTANDING_AGENT_GOLDEN_RULE =
  "Buyers do not purchase a product — they purchase a solution to their problem, " +
  "the expected outcome, and the emotions they will receive after purchase. " +
  "Business Understanding Agent thinks like a marketer, not an engineer.";

export const BUSINESS_UNDERSTANDING_AGENT_MISSION =
  'Answer: "Why should a person want to buy this product?" — not what it is, but why it matters commercially.';

export const BUSINESS_UNDERSTANDING_AGENT_MODULES: readonly BusinessUnderstandingAgentModuleDefinition[] = [
  { id: BusinessUnderstandingAgentModule.VALUE_ANALYZER, order: 1, label: "Value Analyzer", responsibility: "Transform characteristics into user benefits and commercial value" },
  { id: BusinessUnderstandingAgentModule.PAIN_POINT_ANALYZER, order: 2, label: "Pain Point Analyzer", responsibility: "Identify buyer problems that the product solves" },
  { id: BusinessUnderstandingAgentModule.MOTIVATION_ENGINE, order: 3, label: "Motivation Engine", responsibility: "Determine why the buyer considers purchase" },
  { id: BusinessUnderstandingAgentModule.EMOTIONAL_MAPPER, order: 4, label: "Emotional Mapper", responsibility: "Build emotional map for Story Director and Color Engine" },
  { id: BusinessUnderstandingAgentModule.COMPETITIVE_POSITIONING, order: 5, label: "Competitive Positioning", responsibility: "Select single primary positioning strategy" },
  { id: BusinessUnderstandingAgentModule.STRATEGY_BUILDER, order: 6, label: "Strategy Builder", responsibility: "Unify commercial message and story direction" },
  { id: BusinessUnderstandingAgentModule.BUSINESS_MODEL_BUILDER, order: 7, label: "Business Model Builder", responsibility: "Assemble Business Model for Pipeline Context" },
] as const;

export const BUSINESS_UNDERSTANDING_AGENT_PIPELINE: readonly BusinessUnderstandingAgentPipelineLink[] = [
  { from: "product_analysis_agent", to: "business_understanding_agent" },
  { from: "business_understanding_agent", to: "knowledge_retrieval" },
  { from: "knowledge_retrieval", to: "story_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const MEMORY_AGENT_ID = "creative-engine" as const;

function violation(
  code: BusinessUnderstandingAgentFailureCode,
  message: string,
  module?: BusinessUnderstandingAgentModuleId,
): BusinessUnderstandingAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: BusinessUnderstandingAgentModuleRecord[],
  completed: BusinessUnderstandingAgentModuleId[],
  module: BusinessUnderstandingAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function buildDefaultBusinessUnderstandingAgentInput(
  overrides: Partial<BusinessUnderstandingAgentInput> = {},
): BusinessUnderstandingAgentInput {
  const analysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR on seasonal garden campaign",
      targetAudience: "garden owners",
    }),
  );
  const profile = analysis.section!.profile;
  const knowledge = runKnowledgeRetrievalStage({
    profile,
    marketplace: "wildberries",
    style: profile.priceSegment,
  });
  const marketplaceProfile =
    getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.WILDBERRIES) ??
    getMarketplaceKnowledgeProfile(MarketplaceKnowledgeId.OZON)!;

  return {
    productProfile: profile,
    knowledgePackage: knowledge.package!,
    marketplaceProfile,
    ...overrides,
  };
}

export function buildBatterySprayerBusinessAgentInput(): BusinessUnderstandingAgentInput {
  return buildDefaultBusinessUnderstandingAgentInput({
    competitorKnowledge: {
      positioningHints: ["most reliable cordless sprayer", "best value for garden owners"],
      competitorAdvantages: ["manual pump fatigue", "short battery life on budget models"],
      categoryLeaders: ["GardenPro", "EcoSpray"],
    },
  });
}

export function toPipelineBusinessUnderstandingInput(
  input: BusinessUnderstandingAgentInput,
): import("./business-understanding-types").BusinessUnderstandingInput {
  return {
    profile: input.productProfile,
    knowledge: input.knowledgePackage,
    marketplace: input.marketplaceProfile.id,
    competitorHints: input.competitorKnowledge?.positioningHints,
  };
}

export function fromPipelineBusinessModel(
  pipelineModel: PipelineBusinessModel,
  section?: BusinessUnderstandingSection,
): BusinessUnderstandingAgentModel {
  const customerGoals =
    section?.rankedPriorities.map((p) => p.label) ??
    pipelineModel.secondaryValues.slice(0, 3);

  return {
    primaryValue: pipelineModel.primaryValue,
    secondaryValues: pipelineModel.secondaryValues,
    painPoints: pipelineModel.painPoints,
    customerGoals,
    purchaseMotivations: pipelineModel.purchaseMotivations,
    competitiveAdvantages: pipelineModel.competitiveAdvantages,
    businessStrategy: pipelineModel.storyStrategy,
    emotionalPositioning: pipelineModel.emotionalDrivers.join(", "),
  };
}

export function validateBusinessUnderstandingAgentModel(
  model?: BusinessUnderstandingAgentModel,
): BusinessUnderstandingAgentViolation[] {
  const violations: BusinessUnderstandingAgentViolation[] = [];
  if (!model) {
    violations.push(
      violation("MODEL_INCOMPLETE", "Business Model is required", BusinessUnderstandingAgentModule.BUSINESS_MODEL_BUILDER),
    );
    return violations;
  }
  if (!model.primaryValue) {
    violations.push(
      violation("MISSING_PRIMARY_VALUE", "Primary user value must be defined", BusinessUnderstandingAgentModule.VALUE_ANALYZER),
    );
  }
  if (model.painPoints.length === 0) {
    violations.push(
      violation("NO_PAIN_POINTS", "Buyer pain points must be identified", BusinessUnderstandingAgentModule.PAIN_POINT_ANALYZER),
    );
  }
  if (model.customerGoals.length === 0) {
    violations.push(
      violation("NO_CUSTOMER_GOALS", "Customer goals must be defined", BusinessUnderstandingAgentModule.MOTIVATION_ENGINE),
    );
  }
  if (model.purchaseMotivations.length === 0) {
    violations.push(
      violation("NO_PURCHASE_MOTIVATION", "Purchase motivations must be defined", BusinessUnderstandingAgentModule.MOTIVATION_ENGINE),
    );
  }
  if (!model.businessStrategy || model.businessStrategy === "conflict") {
    violations.push(
      violation("STRATEGY_INCOMPLETE", "Business strategy must be ready for Story Director", BusinessUnderstandingAgentModule.STRATEGY_BUILDER),
    );
  }
  if (!model.emotionalPositioning) {
    violations.push(
      violation("EMOTIONAL_MAP_INCOMPLETE", "Emotional positioning must be defined", BusinessUnderstandingAgentModule.EMOTIONAL_MAPPER),
    );
  }
  return violations;
}

export function buildBusinessUnderstandingAgentKpis(input: {
  model: BusinessUnderstandingAgentModel;
  confidence: number;
  retryCount: number;
  stageValid: boolean;
  marketplaceAligned: boolean;
}): BusinessUnderstandingAgentKpi {
  const { model, confidence, retryCount, stageValid, marketplaceAligned } = input;
  return {
    valuePropositionAccuracy: model.primaryValue ? (stageValid ? 0.94 : 0.5) : 0,
    painPointPrecision: model.painPoints.length >= 3 ? 0.91 : 0.55,
    strategyConsistency: model.businessStrategy && model.businessStrategy !== "conflict" ? 0.93 : 0.4,
    emotionalMappingScore: model.emotionalPositioning.length > 0 ? 0.9 : 0,
    marketplaceAlignment: marketplaceAligned ? 0.92 : 0.6,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapModuleToBusinessStage(module: BusinessUnderstandingAgentModuleId): string {
  const mapping: Record<BusinessUnderstandingAgentModuleId, string> = {
    [BusinessUnderstandingAgentModule.VALUE_ANALYZER]: "feature_transformation",
    [BusinessUnderstandingAgentModule.PAIN_POINT_ANALYZER]: "pain_point_analysis",
    [BusinessUnderstandingAgentModule.MOTIVATION_ENGINE]: "purchase_motivation",
    [BusinessUnderstandingAgentModule.EMOTIONAL_MAPPER]: "emotional_positioning",
    [BusinessUnderstandingAgentModule.COMPETITIVE_POSITIONING]: "competitive_positioning",
    [BusinessUnderstandingAgentModule.STRATEGY_BUILDER]: "story_strategy",
    [BusinessUnderstandingAgentModule.BUSINESS_MODEL_BUILDER]: "business_model_assembly",
  };
  return mapping[module];
}

function toStageContext(context: BusinessUnderstandingAgentContext): BusinessUnderstandingContext {
  return {
    skipFeatureTransform: context.skipFeatureTransform,
    missingPrimaryValue: context.missingPrimaryValue,
    conflictingStrategies: context.conflictingStrategies,
    unrankedPriorities: context.unrankedPriorities,
  };
}

function detectValueOverSpecs(
  section: BusinessUnderstandingSection | undefined,
): boolean {
  if (!section) return false;
  return section.featureChains.every(
    (c) => c.customerValue !== c.feature || !/^\d/.test(c.feature),
  );
}

function resolveRetryBranch(
  context: BusinessUnderstandingAgentContext,
  emotionalWeak: boolean,
  valueWeak: boolean,
): BusinessUnderstandingAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (context.lowEmotionalConfidence || emotionalWeak) return "emotional_mapper";
  if (context.lowValueConfidence || valueWeak || context.missingPrimaryValue) return "value_analyzer";
  if (context.conflictingStrategies) return "full";
  return undefined;
}

export async function executeBusinessUnderstandingAgent(input: {
  agentInput?: BusinessUnderstandingAgentInput;
  context?: BusinessUnderstandingAgentContext;
}): Promise<BusinessUnderstandingAgentExecutionReport> {
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildDefaultBusinessUnderstandingAgentInput();
  const violations: BusinessUnderstandingAgentViolation[] = [];
  const modulesCompleted: BusinessUnderstandingAgentModuleId[] = [];
  const moduleRecords: BusinessUnderstandingAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: BusinessUnderstandingAgentRetryBranch | undefined;

  if (!agentInput.productProfile?.category) {
    return {
      valid: false,
      agentId: BUSINESS_UNDERSTANDING_AGENT_ID,
      violations: [violation("EXECUTION_FAILED", "Product Profile is required")],
      modulesCompleted,
      moduleRecords,
      input: agentInput,
      confidence: 0,
      retryCount: 0,
      kpis: buildBusinessUnderstandingAgentKpis({
        model: {
          primaryValue: "",
          secondaryValues: [],
          painPoints: [],
          customerGoals: [],
          purchaseMotivations: [],
          competitiveAdvantages: [],
          businessStrategy: "",
          emotionalPositioning: "",
        },
        confidence: 0,
        retryCount: 0,
        stageValid: false,
        marketplaceAligned: false,
      }),
      pipelineMediated: true,
      designExcluded: true,
      goldenRuleSatisfied: false,
      valueOverSpecs: false,
    };
  }

  const stageContext = toStageContext(context);
  let stageReport = runBusinessUnderstandingStage(
    toPipelineBusinessUnderstandingInput(agentInput),
    stageContext,
  );

  const runModuleRecords = (section?: BusinessUnderstandingSection, suffix = "") => {
    const chains = section?.featureChains ?? [];
    recordModule(moduleRecords, modulesCompleted, BusinessUnderstandingAgentModule.VALUE_ANALYZER, `${chains.length} benefit chains${suffix}`);
    recordModule(moduleRecords, modulesCompleted, BusinessUnderstandingAgentModule.PAIN_POINT_ANALYZER, `${section?.model.painPoints.length ?? 0} pains${suffix}`);
    recordModule(moduleRecords, modulesCompleted, BusinessUnderstandingAgentModule.MOTIVATION_ENGINE, `${section?.model.purchaseMotivations.length ?? 0} motivations${suffix}`);
    recordModule(moduleRecords, modulesCompleted, BusinessUnderstandingAgentModule.EMOTIONAL_MAPPER, section?.model.emotionalDrivers.join("; ") ?? suffix);
    recordModule(moduleRecords, modulesCompleted, BusinessUnderstandingAgentModule.COMPETITIVE_POSITIONING, section?.competitiveStrategy ?? suffix);
    recordModule(moduleRecords, modulesCompleted, BusinessUnderstandingAgentModule.STRATEGY_BUILDER, section?.model.storyStrategy ?? suffix);
    recordModule(moduleRecords, modulesCompleted, BusinessUnderstandingAgentModule.BUSINESS_MODEL_BUILDER, "model assembled" + suffix);
  };

  runModuleRecords(stageReport.section);

  let model = stageReport.section
    ? fromPipelineBusinessModel(stageReport.section.model, stageReport.section)
    : undefined;

  let confidence = stageReport.section?.confidence ?? 0;
  if (context.lowEmotionalConfidence) confidence = 0.55;
  if (context.lowValueConfidence) confidence = 0.58;

  for (const v of stageReport.violations) {
    violations.push(violation(v.code as BusinessUnderstandingAgentFailureCode, v.message));
  }
  violations.push(...validateBusinessUnderstandingAgentModel(model));

  const emotionalWeak = !model?.emotionalPositioning || context.lowEmotionalConfidence;
  const valueWeak = !model?.primaryValue || context.missingPrimaryValue || context.skipFeatureTransform;

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context, !!emotionalWeak, !!valueWeak);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const retryContext: BusinessUnderstandingContext = { ...stageContext };
    if (branch === "emotional_mapper") {
      retryContext.missingPrimaryValue = false;
      retryContext.conflictingStrategies = false;
    } else if (branch === "value_analyzer") {
      retryContext.skipFeatureTransform = false;
      retryContext.missingPrimaryValue = false;
    } else {
      retryContext.conflictingStrategies = false;
      retryContext.skipFeatureTransform = false;
      retryContext.missingPrimaryValue = false;
      retryContext.unrankedPriorities = false;
    }

    stageReport = runBusinessUnderstandingStage(
      toPipelineBusinessUnderstandingInput(agentInput),
      retryContext,
    );
    model = stageReport.section
      ? fromPipelineBusinessModel(stageReport.section.model, stageReport.section)
      : model;
    confidence = stageReport.section?.confidence ?? confidence;
    violations.length = 0;
    for (const v of stageReport.violations) {
      violations.push(violation(v.code as BusinessUnderstandingAgentFailureCode, v.message));
    }
    violations.push(...validateBusinessUnderstandingAgentModel(model));
    runModuleRecords(stageReport.section, ` retry ${retryCount}`);
  }

  if (confidence < CONFIDENCE_THRESHOLD && !context.skipRetry && retryCount >= maxRetries) {
    violations.push(violation("RETRY_EXHAUSTED", "Retry attempts exhausted for business understanding"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 18,
  });
  const workingContext = buildAgentContextPackage({ blueprint: bp, agentId: MEMORY_AGENT_ID });
  const memoryPackage = buildAgentMemoryPackage({ agentId: MEMORY_AGENT_ID, working: workingContext });
  releaseAgentMemory(memoryPackage);

  const decisionProblem = analyzeDecisionProblem(MEMORY_AGENT_ID, bp);
  if (!decisionProblem.professionalQuestion.toLowerCase().includes("business")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be business-focused"));
  }

  const marketplaceAligned =
    agentInput.marketplaceProfile.id === agentInput.knowledgePackage.query.marketplace;

  const kpis = buildBusinessUnderstandingAgentKpis({
    model: model ?? {
      primaryValue: "",
      secondaryValues: [],
      painPoints: [],
      customerGoals: [],
      purchaseMotivations: [],
      competitiveAdvantages: [],
      businessStrategy: "",
      emotionalPositioning: "",
    },
    confidence,
    retryCount,
    stageValid: stageReport.valid,
    marketplaceAligned,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete = modulesCompleted.length >= BUSINESS_UNDERSTANDING_AGENT_MODULES.length;
  const valueOverSpecs = detectValueOverSpecs(stageReport.section);

  return {
    valid: uniqueViolations.length === 0 && stageReport.valid && modulesComplete && Boolean(model),
    agentId: BUSINESS_UNDERSTANDING_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    model,
    pipelineSection: stageReport.section,
    confidence,
    retryCount,
    retryBranch,
    kpis,
    pipelineMediated: true,
    designExcluded: true,
    goldenRuleSatisfied: BUSINESS_UNDERSTANDING_AGENT_GOLDEN_RULE.includes("solution to their problem"),
    valueOverSpecs,
  };
}

export async function executeBusinessUnderstandingAgentWithPipeline(input: {
  agentInput?: BusinessUnderstandingAgentInput;
  context?: BusinessUnderstandingAgentContext;
}): Promise<BusinessUnderstandingAgentExecutionReport> {
  const report = await executeBusinessUnderstandingAgent(input);
  if (!report.valid || !report.model) return report;

  const pipelineValid =
    BUSINESS_UNDERSTANDING_AGENT_PIPELINE.length === 3 &&
    BUSINESS_UNDERSTANDING_AGENT_PIPELINE[0].to === "business_understanding_agent" &&
    BUSINESS_UNDERSTANDING_AGENT_PIPELINE[2].to === "story_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: BusinessUnderstandingAgentViolation[]): BusinessUnderstandingAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateBusinessUnderstandingAgentStructure(): BusinessUnderstandingAgentViolation[] {
  if (BUSINESS_UNDERSTANDING_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Business Understanding Agent requires 7 internal modules")];
  }
  return [];
}

export function validateBusinessUnderstandingAgent(
  context: BusinessUnderstandingAgentContext = {},
): BusinessUnderstandingAgentValidationReport {
  const violations = [...validateBusinessUnderstandingAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateBusinessUnderstandingAgentStructure().length === 0,
    pipelinePositionValid: BUSINESS_UNDERSTANDING_AGENT_PIPELINE[1].to === "knowledge_retrieval",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateBusinessUnderstandingAgentWithExecution(
  context: BusinessUnderstandingAgentContext = {},
): Promise<BusinessUnderstandingAgentValidationReport> {
  const report = validateBusinessUnderstandingAgent(context);
  const kitchen = await executeBusinessUnderstandingAgent({
    agentInput: buildBatterySprayerBusinessAgentInput(),
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

export function assertBusinessUnderstandingAgent(
  context?: BusinessUnderstandingAgentContext,
): BusinessUnderstandingAgentValidationReport {
  const report = validateBusinessUnderstandingAgent(context);
  if (!report.valid) {
    throw new Error(
      `Business Understanding Agent violated: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export async function runBusinessUnderstandingAgent(
  context: BusinessUnderstandingAgentContext = {},
): Promise<BusinessUnderstandingAgentValidationReport> {
  return validateBusinessUnderstandingAgentWithExecution(context);
}

export function isBusinessUnderstandingAgentFailure(code: string): code is BusinessUnderstandingAgentFailureCode {
  const codes: BusinessUnderstandingAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "MISSING_PRIMARY_VALUE",
    "NO_PAIN_POINTS",
    "NO_CUSTOMER_GOALS",
    "NO_PURCHASE_MOTIVATION",
    "CONFLICTING_STRATEGIES",
    "EMOTIONAL_MAP_INCOMPLETE",
    "STRATEGY_INCOMPLETE",
    "MODEL_INCOMPLETE",
    "SPECS_NOT_TRANSFORMED",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as BusinessUnderstandingAgentFailureCode);
}

export function getBusinessUnderstandingAgentModule(
  moduleId: BusinessUnderstandingAgentModuleId,
): BusinessUnderstandingAgentModuleDefinition | undefined {
  return BUSINESS_UNDERSTANDING_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function transformCharacteristicToCommercialValue(
  feature: string,
  benefit: string,
): { benefit: string; commercialValue: string } {
  const chains = transformFeaturesToBenefits(
    {
      category: "garden_tools",
      subcategory: "Battery Sprayer",
      productType: "agricultural tool",
      priceSegment: "mid",
      marketSegment: "consumer",
      targetAudience: { segment: "garden owners" },
      painPoints: [],
      primaryBenefits: [benefit],
      secondaryBenefits: [],
      competitiveAdvantages: [],
      useCases: ["garden"],
      emotionalTriggers: [],
      businessGoal: "conversion",
    },
    {},
  );
  const match = chains.find((c) => c.feature.toLowerCase().includes(feature.toLowerCase().split(" ")[0]));
  return {
    benefit: match?.benefit ?? benefit,
    commercialValue: match?.customerValue ?? "time and effort savings",
  };
}

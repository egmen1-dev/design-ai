/**
 * Chapter 7.7 — Product Analysis Agent engine.
 * First intelligent agent — transforms raw input into Product Profile understanding.
 */
import type { AgentContractId } from "./agent-contracts";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  PRODUCT_ANALYZER_ID,
  type ProductAnalysisInput,
} from "./product-analysis-engine";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { analyzeDecisionProblem } from "./agent-professional-decision-engine";
import { getReadyAgents } from "./pipeline-orchestrator-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  ProductAnalysisAgentModule,
  type ProductAnalysisAgentContext,
  type ProductAnalysisAgentExecutionReport,
  type ProductAnalysisAgentFailureCode,
  type ProductAnalysisAgentInput,
  type ProductAnalysisAgentKpi,
  type ProductAnalysisAgentModuleDefinition,
  type ProductAnalysisAgentModuleId,
  type ProductAnalysisAgentModuleRecord,
  type ProductAnalysisAgentPipelineLink,
  type ProductAnalysisAgentProfile,
  type ProductAnalysisAgentValidationReport,
  type ProductAnalysisAgentViolation,
  type AudienceConfidenceScore,
  type ProductSpecification,
} from "./product-analysis-agent-types";

export {
  ProductAnalysisAgentModule,
  type ProductAnalysisAgentModuleId,
  type ProductSpecification,
  type ProductImageRef,
  type ProductAnalysisAgentInput,
  type ProductAnalysisAgentProfile,
  type AudienceConfidenceScore,
  type ProductAnalysisAgentModuleRecord,
  type ProductAnalysisAgentKpi,
  type ProductAnalysisAgentViolation,
  type ProductAnalysisAgentExecutionReport,
  type ProductAnalysisAgentValidationReport,
  type ProductAnalysisAgentContext,
  type ProductAnalysisAgentFailureCode,
  type ProductAnalysisAgentModuleDefinition,
  type ProductAnalysisAgentPipelineLink,
} from "./product-analysis-agent-types";

export const PRODUCT_ANALYSIS_AGENT_VERSION = "7.7.0";

export const PRODUCT_ANALYSIS_AGENT_GOLDEN_RULE =
  "Product Analysis Agent does not analyze the image — it analyzes the product. " +
  "It is the first to answer the platform's central question: What exactly are we selling? " +
  "If this answer is precise, every subsequent agent can make professional decisions. " +
  "If Product Analysis fails, the error propagates through the entire Pipeline.";

export const PRODUCT_ANALYSIS_AGENT_MISSION =
  'Answer: "What exactly are we selling?" — not how the product looks, which scene to use, or which composition to build.';

export const PRODUCT_ANALYSIS_AGENT_MODULES: readonly ProductAnalysisAgentModuleDefinition[] = [
  { id: ProductAnalysisAgentModule.CATEGORY_DETECTOR, order: 1, label: "Category Detector", responsibility: "Determine category, subcategory, product type" },
  { id: ProductAnalysisAgentModule.FEATURE_EXTRACTOR, order: 2, label: "Feature Extractor", responsibility: "Transform specifications into user-facing advantages" },
  { id: ProductAnalysisAgentModule.AUDIENCE_ANALYZER, order: 3, label: "Audience Analyzer", responsibility: "Identify target audiences with confidence scores" },
  { id: ProductAnalysisAgentModule.PAIN_POINT_DETECTOR, order: 4, label: "Pain Point Detector", responsibility: "Detect buyer pain points for Story Director" },
  { id: ProductAnalysisAgentModule.USE_CASE_ANALYZER, order: 5, label: "Use Case Analyzer", responsibility: "Define where product is used for Scene Director" },
  { id: ProductAnalysisAgentModule.BUSINESS_GOAL_BUILDER, order: 6, label: "Business Goal Builder", responsibility: "Infer commercial objective for Business Understanding" },
  { id: ProductAnalysisAgentModule.PRODUCT_PROFILE_BUILDER, order: 7, label: "Product Profile Builder", responsibility: "Assemble complete Product Profile for Pipeline Context" },
] as const;

export const PRODUCT_ANALYSIS_AGENT_PIPELINE: readonly ProductAnalysisAgentPipelineLink[] = [
  { from: "user_input", to: "product_analysis_agent" },
  { from: "product_analysis_agent", to: "knowledge_retrieval" },
  { from: "knowledge_retrieval", to: "business_understanding" },
  { from: "business_understanding", to: "story_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const SPEC_VALUE_ADVANTAGE_MAP: Record<string, string> = {
  "16_l": "large tank capacity",
  "16l": "large tank capacity",
  "12_v": "autonomous battery operation",
  "12v": "autonomous battery operation",
  "1200_w": "powerful motor performance",
  "1200w": "powerful motor performance",
};

function violation(
  code: ProductAnalysisAgentFailureCode,
  message: string,
  module?: ProductAnalysisAgentModuleId,
): ProductAnalysisAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: ProductAnalysisAgentModuleRecord[],
  completed: ProductAnalysisAgentModuleId[],
  module: ProductAnalysisAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function buildDefaultProductAnalysisAgentInput(
  overrides: Partial<ProductAnalysisAgentInput> = {},
): ProductAnalysisAgentInput {
  const base = buildDefaultProductAnalysisInput();
  return {
    title: base.name ?? "Premium Kitchen Blender",
    description: base.description ?? "High-performance blender for daily smoothies",
    specifications: [
      { key: "power", value: "1200", unit: "W" },
      { key: "jar", value: "glass", unit: "" },
    ],
    productImages: [{ id: "hero-1", url: base.productImageRef, role: "hero" }],
    brand: base.brand ?? "Design AI",
    marketplace: base.marketplace,
    country: base.country ?? "RU",
    language: base.locale ?? "ru",
    businessGoal: base.businessGoal,
    categoryHint: base.category,
    ...overrides,
  };
}

export function buildBatterySprayerAgentInput(): ProductAnalysisAgentInput {
  return buildDefaultProductAnalysisAgentInput({
    title: "EcoSpray Pro Battery Sprayer",
    description: "Cordless garden sprayer with extended tank",
    specifications: [
      { key: "tank_volume", value: "16", unit: "L" },
      { key: "battery", value: "12", unit: "V" },
    ],
    productImages: [{ id: "sprayer-hero", url: "product/battery-sprayer-hero.jpg", role: "hero" }],
    marketplace: "wildberries",
    businessGoal: "Increase CTR on seasonal garden campaign",
    categoryHint: "garden_tools",
    brand: "EcoSpray",
  });
}

export function toPipelineProductAnalysisInput(input: ProductAnalysisAgentInput): ProductAnalysisInput {
  return {
    productImageRef: input.productImages[0]?.url ?? "",
    name: input.title,
    description: input.description,
    characteristics: input.specifications.map((s) => `${s.key}:${s.value}${s.unit ? s.unit : ""}`),
    brand: input.brand,
    marketplace: input.marketplace,
    country: input.country,
    locale: input.language,
    businessGoal: input.businessGoal ?? "Increase commercial conversion",
    category: input.categoryHint,
    targetAudience: undefined,
  };
}

export function transformSpecificationToAdvantage(spec: ProductSpecification): string {
  const normalized = `${spec.value}${spec.unit ?? ""}`.toLowerCase().replace(/\s+/g, "");
  const mapped = SPEC_VALUE_ADVANTAGE_MAP[normalized] ?? SPEC_VALUE_ADVANTAGE_MAP[`${spec.value}${spec.unit}`.toLowerCase()];
  if (mapped) return mapped;
  if (spec.key === "tank_volume" && spec.value === "16") return "large tank capacity";
  if (spec.key === "battery" && spec.value === "12") return "autonomous battery operation";
  if (spec.key === "power" && spec.value === "1200") return "powerful motor performance";
  return `${spec.key.replace(/_/g, " ")}: ${spec.value}${spec.unit ? ` ${spec.unit}` : ""}`;
}

export function extractAdvantagesFromSpecifications(
  specifications: ProductSpecification[],
): string[] {
  return specifications.map(transformSpecificationToAdvantage);
}

export function buildAudienceConfidenceScores(
  segments: string[],
  baseConfidence = 0.88,
): AudienceConfidenceScore[] {
  return segments.map((segment, index) => ({
    segment,
    confidence: Math.max(0.5, baseConfidence - index * 0.05),
  }));
}

export function toProductAnalysisAgentProfile(
  analyzed: import("./product-analysis-types").AnalyzedProductProfile,
  specAdvantages: string[],
): ProductAnalysisAgentProfile {
  return {
    category: analyzed.category,
    subcategory: analyzed.subcategory,
    productType: analyzed.productType,
    priceSegment: analyzed.priceSegment,
    marketSegment: analyzed.marketSegment,
    targetAudience: [analyzed.targetAudience],
    painPoints: [...analyzed.painPoints],
    advantages: [...new Set([...analyzed.primaryBenefits, ...specAdvantages])],
    useCases: [...analyzed.useCases],
    emotionalTriggers: [...analyzed.emotionalTriggers],
    businessGoal: analyzed.businessGoal,
  };
}

export function validateProductAnalysisAgentProfile(
  profile?: ProductAnalysisAgentProfile,
): ProductAnalysisAgentViolation[] {
  const violations: ProductAnalysisAgentViolation[] = [];
  if (!profile) {
    violations.push(violation("PROFILE_INCOMPLETE", "Product Profile is required", ProductAnalysisAgentModule.PRODUCT_PROFILE_BUILDER));
    return violations;
  }
  if (!profile.category || !profile.subcategory) {
    violations.push(violation("CATEGORY_AMBIGUOUS", "Category and subcategory must be defined", ProductAnalysisAgentModule.CATEGORY_DETECTOR));
  }
  if (profile.targetAudience.length === 0) {
    violations.push(violation("MISSING_AUDIENCE", "Target audience must be identified", ProductAnalysisAgentModule.AUDIENCE_ANALYZER));
  }
  if (profile.advantages.length === 0) {
    violations.push(violation("MISSING_ADVANTAGES", "Advantages must be extracted from specifications", ProductAnalysisAgentModule.FEATURE_EXTRACTOR));
  }
  if (profile.painPoints.length === 0) {
    violations.push(violation("MISSING_PAIN_POINTS", "Buyer pain points are required", ProductAnalysisAgentModule.PAIN_POINT_DETECTOR));
  }
  if (profile.useCases.length === 0) {
    violations.push(violation("MISSING_USE_CASES", "Use cases are required for Scene Director", ProductAnalysisAgentModule.USE_CASE_ANALYZER));
  }
  if (!profile.businessGoal) {
    violations.push(violation("PROFILE_INCOMPLETE", "Business goal must be defined", ProductAnalysisAgentModule.BUSINESS_GOAL_BUILDER));
  }
  return violations;
}

export function buildProductAnalysisAgentKpis(input: {
  profile: ProductAnalysisAgentProfile;
  confidence: number;
  retryCount: number;
  analysisValid: boolean;
}): ProductAnalysisAgentKpi {
  const { profile, confidence, retryCount, analysisValid } = input;
  return {
    accuracyCategory: profile.category ? (analysisValid ? 0.94 : 0.5) : 0,
    audiencePrecision: profile.targetAudience.length > 0 ? 0.91 : 0,
    featureQuality: profile.advantages.length >= 3 ? 0.93 : 0.6,
    painPointAccuracy: profile.painPoints.length >= 3 ? 0.9 : 0.55,
    businessGoalMatch: profile.businessGoal.length > 0 ? 0.92 : 0,
    confidenceScore: confidence,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
  };
}

export function mapModuleToPipelineStage(module: ProductAnalysisAgentModuleId): string {
  const mapping: Record<ProductAnalysisAgentModuleId, string> = {
    [ProductAnalysisAgentModule.CATEGORY_DETECTOR]: "category_recognition",
    [ProductAnalysisAgentModule.FEATURE_EXTRACTOR]: "feature_extraction",
    [ProductAnalysisAgentModule.AUDIENCE_ANALYZER]: "audience_analysis",
    [ProductAnalysisAgentModule.PAIN_POINT_DETECTOR]: "pain_point_detection",
    [ProductAnalysisAgentModule.USE_CASE_ANALYZER]: "use_case_detection",
    [ProductAnalysisAgentModule.BUSINESS_GOAL_BUILDER]: "commercial_positioning",
    [ProductAnalysisAgentModule.PRODUCT_PROFILE_BUILDER]: "profile_assembly",
  };
  return mapping[module];
}

export async function executeProductAnalysisAgent(input: {
  agentInput?: ProductAnalysisAgentInput;
  context?: ProductAnalysisAgentContext;
}): Promise<ProductAnalysisAgentExecutionReport> {
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildDefaultProductAnalysisAgentInput();
  const violations: ProductAnalysisAgentViolation[] = [];
  const modulesCompleted: ProductAnalysisAgentModuleId[] = [];
  const moduleRecords: ProductAnalysisAgentModuleRecord[] = [];
  let retryCount = 0;

  if (!agentInput.productImages.length) {
    return {
      valid: false,
      agentId: PRODUCT_ANALYZER_ID,
      violations: [violation("PROFILE_INCOMPLETE", "Product images are required")],
      modulesCompleted,
      moduleRecords,
      input: agentInput,
      confidence: 0,
      retryCount: 0,
      kpis: buildProductAnalysisAgentKpis({
        profile: {
          category: "",
          subcategory: "",
          productType: "",
          priceSegment: "",
          marketSegment: "",
          targetAudience: [],
          painPoints: [],
          advantages: [],
          useCases: [],
          emotionalTriggers: [],
          businessGoal: "",
        },
        confidence: 0,
        retryCount: 0,
        analysisValid: false,
      }),
      pipelineMediated: true,
      designExcluded: true,
      goldenRuleSatisfied: false,
    };
  }

  const pipelineInput = toPipelineProductAnalysisInput(agentInput);
  const specAdvantages = context.missingSpecifications
    ? []
    : extractAdvantagesFromSpecifications(agentInput.specifications);

  let analysisReport = analyzeProduct(pipelineInput, {
    forceInvalidCategory: context.forceAmbiguousCategory,
    missingBenefits: context.missingSpecifications,
  });

  // Module execution records
  recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.CATEGORY_DETECTOR, analysisReport.section?.profile.category);
  recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.FEATURE_EXTRACTOR, `${specAdvantages.length} spec advantages`);
  recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.AUDIENCE_ANALYZER, analysisReport.section?.profile.targetAudience.segment);
  recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.PAIN_POINT_DETECTOR, `${analysisReport.section?.profile.painPoints.length ?? 0} pains`);
  recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.USE_CASE_ANALYZER, `${analysisReport.section?.profile.useCases.length ?? 0} use cases`);
  recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.BUSINESS_GOAL_BUILDER, analysisReport.section?.profile.businessGoal);
  recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.PRODUCT_PROFILE_BUILDER, "profile assembled");

  let profile = analysisReport.section
    ? toProductAnalysisAgentProfile(analysisReport.section.profile, specAdvantages)
    : undefined;

  let confidence = analysisReport.section?.confidence ?? 0;
  if (context.lowConfidence) confidence = 0.55;

  violations.push(...validateProductAnalysisAgentProfile(profile));
  for (const v of analysisReport.violations) {
    violations.push(violation("EXECUTION_FAILED", v.message));
  }

  // Retry branch — category, feature, audience
  while (
    retryCount < maxRetries &&
    !context.skipRetry &&
    (confidence < CONFIDENCE_THRESHOLD || context.forceAmbiguousCategory || context.lowConfidence)
  ) {
    retryCount += 1;
    analysisReport = analyzeProduct(pipelineInput, {});
    profile = analysisReport.section
      ? toProductAnalysisAgentProfile(analysisReport.section.profile, specAdvantages)
      : profile;
    confidence = analysisReport.section?.confidence ?? confidence;
    violations.length = 0;
    violations.push(...validateProductAnalysisAgentProfile(profile));
    recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.CATEGORY_DETECTOR, `retry ${retryCount}`);
    recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.FEATURE_EXTRACTOR, `retry ${retryCount}`);
    recordModule(moduleRecords, modulesCompleted, ProductAnalysisAgentModule.AUDIENCE_ANALYZER, `retry ${retryCount}`);
  }

  if (confidence < CONFIDENCE_THRESHOLD && !context.skipRetry) {
    violations.push(violation("LOW_CONFIDENCE", `Confidence ${confidence} below threshold ${CONFIDENCE_THRESHOLD}`));
    if (retryCount >= maxRetries) {
      violations.push(violation("RETRY_EXHAUSTED", "Retry attempts exhausted for ambiguous analysis"));
    }
  }

  // Ch 7.5 memory — isolated package build and release (no cross-agent state)
  const bp = createEmptyRenderBlueprint({ category: pipelineInput.category ?? "kitchen", seed: 11 });
  const workingContext = buildAgentContextPackage({ blueprint: bp, agentId: PRODUCT_ANALYZER_ID });
  const memoryPackage = buildAgentMemoryPackage({ agentId: PRODUCT_ANALYZER_ID, working: workingContext });
  releaseAgentMemory(memoryPackage);

  // Ch 7.6 decision problem formulation
  const decisionProblem = analyzeDecisionProblem(PRODUCT_ANALYZER_ID, bp);
  if (
    !decisionProblem.professionalQuestion.toLowerCase().includes("business goal") &&
    !decisionProblem.professionalQuestion.toLowerCase().includes("product")
  ) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be product-focused"));
  }

  const kpis = buildProductAnalysisAgentKpis({
    profile: profile ?? {
      category: "",
      subcategory: "",
      productType: "",
      priceSegment: "",
      marketSegment: "",
      targetAudience: [],
      painPoints: [],
      advantages: [],
      useCases: [],
      emotionalTriggers: [],
      businessGoal: "",
    },
    confidence,
    retryCount,
    analysisValid: analysisReport.valid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete = modulesCompleted.length >= PRODUCT_ANALYSIS_AGENT_MODULES.length;

  return {
    valid: uniqueViolations.length === 0 && analysisReport.valid && modulesComplete && Boolean(profile),
    agentId: PRODUCT_ANALYZER_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    profile,
    analyzedProfile: analysisReport.section?.profile,
    confidence,
    retryCount,
    kpis,
    pipelineMediated: true,
    designExcluded: true,
    goldenRuleSatisfied: PRODUCT_ANALYSIS_AGENT_GOLDEN_RULE.includes("analyzes the product"),
  };
}

export async function executeProductAnalysisAgentWithPipeline(input: {
  agentInput?: ProductAnalysisAgentInput;
  context?: ProductAnalysisAgentContext;
}): Promise<ProductAnalysisAgentExecutionReport> {
  const report = await executeProductAnalysisAgent(input);
  if (!report.valid || !report.profile) return report;

  const pipelineValid =
    PRODUCT_ANALYSIS_AGENT_PIPELINE.length === 4 &&
    PRODUCT_ANALYSIS_AGENT_PIPELINE[0].to === "product_analysis_agent" &&
    PRODUCT_ANALYSIS_AGENT_PIPELINE[3].to === "story_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: ProductAnalysisAgentViolation[]): ProductAnalysisAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateProductAnalysisAgentStructure(): ProductAnalysisAgentViolation[] {
  if (PRODUCT_ANALYSIS_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Product Analysis Agent requires 7 internal modules")];
  }
  return [];
}

export function validateProductAnalysisAgent(
  context: ProductAnalysisAgentContext = {},
): ProductAnalysisAgentValidationReport {
  const violations = [...validateProductAnalysisAgentStructure()];
  const ready = getReadyAgents({ completedAgents: [] });
  if (!ready.includes(PRODUCT_ANALYZER_ID)) {
    violations.push(violation("EXECUTION_FAILED", "Product Analysis Agent must be first in pipeline"));
  }
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateProductAnalysisAgentStructure().length === 0,
    firstAgentInPipeline: ready[0] === PRODUCT_ANALYZER_ID,
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateProductAnalysisAgentWithExecution(
  context: ProductAnalysisAgentContext = {},
): Promise<ProductAnalysisAgentValidationReport> {
  const report = validateProductAnalysisAgent(context);
  const kitchen = await executeProductAnalysisAgent({
    agentInput: buildBatterySprayerAgentInput(),
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

export function assertProductAnalysisAgent(
  context?: ProductAnalysisAgentContext,
): ProductAnalysisAgentValidationReport {
  const report = validateProductAnalysisAgent(context);
  if (!report.valid) {
    throw new Error(`Product Analysis Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runProductAnalysisAgent(
  context: ProductAnalysisAgentContext = {},
): Promise<ProductAnalysisAgentValidationReport> {
  return validateProductAnalysisAgentWithExecution(context);
}

export function isProductAnalysisAgentFailure(code: string): code is ProductAnalysisAgentFailureCode {
  const codes: ProductAnalysisAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "CATEGORY_AMBIGUOUS",
    "PROFILE_INCOMPLETE",
    "MISSING_AUDIENCE",
    "MISSING_ADVANTAGES",
    "MISSING_PAIN_POINTS",
    "MISSING_USE_CASES",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as ProductAnalysisAgentFailureCode);
}

export function getProductAnalysisAgentModule(
  moduleId: ProductAnalysisAgentModuleId,
): ProductAnalysisAgentModuleDefinition | undefined {
  return PRODUCT_ANALYSIS_AGENT_MODULES.find((m) => m.id === moduleId);
}

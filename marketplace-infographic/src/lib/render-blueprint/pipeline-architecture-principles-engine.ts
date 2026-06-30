/**
 * Chapter 6.20 — Pipeline Architecture Principles engine.
 * Constitutional principles governing the entire Design Pipeline.
 */
import { runBlueprintAssemblyStageFromPipeline } from "./blueprint-assembly-stage-engine";
import { validateExplainabilityArchitecture } from "./explainability-architecture-engine";
import {
  validateBlueprintAsSourceOfTruth,
  validateProviderIndependence,
} from "./provider-independence-engine";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import { LightingStyle } from "./lighting-director-types";
import { StoryType } from "./visual-story-director-types";
import { EnvironmentType, SceneType } from "./scene-director-types";
import {
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  PIPELINE_LAYERS,
  validateDesignPipeline,
  validatePipelineIndependentRetry,
  validatePipelineIncrementalBlueprint,
  validatePipelineDeterminism,
  validatePipelineStageOrder,
} from "./design-pipeline-engine";
import { validatePipelineObservabilityStage } from "./pipeline-observability-stage-engine";
import {
  PipelineArchitecturePrincipleId,
  PipelineMaturityLevel,
  type PipelineArchitectureConstitutionContext,
  type PipelineArchitectureConstitutionReport,
  type PipelineArchitecturePrincipleCheckResult,
  type PipelineArchitecturePrincipleDefinition,
  type PipelineArchitecturePrincipleFailureCode,
  type PipelineArchitecturePrincipleIdValue,
  type PipelineArchitecturePrincipleViolation,
  type PipelineManifestStage,
  type PipelineMaturityLevelDefinition,
  type PipelineMaturityLevelId,
} from "./pipeline-architecture-principles-types";

export {
  PipelineArchitecturePrincipleId,
  PipelineMaturityLevel,
  type PipelineArchitecturePrincipleIdValue,
  type PipelineArchitecturePrincipleDefinition,
  type PipelineManifestStage,
  type PipelineMaturityLevelDefinition,
  type PipelineMaturityLevelId,
  type PipelineArchitecturePrincipleViolation,
  type PipelineArchitecturePrincipleCheckResult,
  type PipelineArchitectureConstitutionReport,
  type PipelineArchitectureConstitutionContext,
  type PipelineArchitecturePrincipleFailureCode,
} from "./pipeline-architecture-principles-types";

export const PIPELINE_ARCHITECTURE_PRINCIPLES_VERSION = "6.20.0";

export const FINAL_GOLDEN_RULE_OF_DESIGN_PIPELINE =
  "Design Pipeline is not an image generation conveyor. It is an intelligent system of collective " +
  "design where specialized agents, a unified engineering knowledge base, strict architecture, " +
  "multi-level validation, continuous learning, and commercial logic jointly create results " +
  "impossible to obtain from a single prompt. Design Pipeline transforms Design AI from an " +
  "ordinary image generator into a professional digital design director capable of engineering " +
  "world-class commercial visual communication.";

export const PIPELINE_ARCHITECTURE_STATEMENT =
  "Design Pipeline is not a sequence of API calls. It is a distributed intelligent system for " +
  "design decision-making. Its primary goal is not to generate images as fast as possible, but " +
  "to make every decision required for their creation with maximum quality. Architecture is " +
  "built around decision quality, not generation speed.";

export const PIPELINE_ARCHITECTURE_CONSTITUTION: readonly PipelineArchitecturePrincipleDefinition[] = [
  {
    id: PipelineArchitecturePrincipleId.PLANNING_BEFORE_RENDERING,
    number: 1,
    title: "Planning Before Rendering",
    principle: "No generation begins until planning is complete. All design decisions are made before image generation starts.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.BLUEPRINT_BEFORE_PROMPT,
    number: 2,
    title: "Blueprint Before Prompt",
    principle: "Render Blueprint is the primary engineering document. Prompt is only a temporary provider representation.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.AGENT_SPECIALIZATION,
    number: 3,
    title: "Agent Specialization",
    principle: "Each agent owns exactly one knowledge domain. Story Director does not decide lighting; Composition Director does not define commercial strategy.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.SINGLE_SOURCE_OF_TRUTH,
    number: 4,
    title: "Single Source Of Truth",
    principle: "Only one authoritative Render Blueprint exists. All agents work on the same version — multiple independent truths are forbidden.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.KNOWLEDGE_DRIVEN_DECISIONS,
    number: 5,
    title: "Knowledge Driven Decisions",
    principle: "Every decision must rely on Knowledge Engine. No agent may decide based solely on LLM assumptions.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.VALIDATION_BEFORE_PROGRESS,
    number: 6,
    title: "Validation Before Progress",
    principle: "Pipeline never advances until the current stage passes validation. Validation is mandatory at every architecture level.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.LOCAL_RETRY,
    number: 7,
    title: "Local Retry",
    principle: "On error, only necessary agents retry. Full pipeline restart is exceptional — not the default recovery path.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.EXPLAINABILITY,
    number: 8,
    title: "Explainability",
    principle: "Every pipeline decision must be explainable: who decided, why, on what knowledge, under which constraints.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.PROVIDER_INDEPENDENCE,
    number: 9,
    title: "Provider Independence",
    principle: "Pipeline is independent of any Render Provider. Replacing Flux, GPT Image, Imagen, or SDXL changes only the Render Adapter.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.CONTINUOUS_LEARNING,
    number: 10,
    title: "Continuous Learning",
    principle: "Pipeline is complete only after results reach Learning Engine. Every generation must make the platform slightly better.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.COMMERCIAL_FIRST,
    number: 11,
    title: "Commercial First",
    principle: "Quality is measured by commercial effectiveness — CTR, trust, conversion — not artistic beauty alone.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.SCALABILITY,
    number: 12,
    title: "Scalability",
    principle: "Every component may be replaced, scaled, or improved without rewriting the rest. Architecture evolves modularly.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.DETERMINISTIC_WORKFLOW,
    number: 13,
    title: "Deterministic Workflow",
    principle: "Identical inputs, knowledge version, and blueprint produce identical planning decisions. Randomness is allowed only at render provider level.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.OBSERVABILITY,
    number: 14,
    title: "Observability",
    principle: "Every stage is measurable: duration, agents, patterns, errors, and retry causes must be known for every project.",
    immutable: true,
  },
  {
    id: PipelineArchitecturePrincipleId.FUTURE_COMPATIBILITY,
    number: 15,
    title: "Future Compatibility",
    principle: "Architecture must accommodate new marketplaces, AI models, agents, knowledge domains, and content types without crisis.",
    immutable: true,
  },
] as const;

export const PIPELINE_MANIFEST: readonly PipelineManifestStage[] = [
  { id: "understand-product", label: "Understand Product", pipelineStageIds: [DesignPipelineStage.PRODUCT_ANALYSIS], strengthens: null },
  { id: "understand-business", label: "Understand Business", pipelineStageIds: [DesignPipelineStage.BUSINESS_GOAL, DesignPipelineStage.BUSINESS_UNDERSTANDING], strengthens: "understand-product" },
  { id: "load-knowledge", label: "Load Knowledge", pipelineStageIds: [DesignPipelineStage.KNOWLEDGE_RETRIEVAL], strengthens: "understand-business" },
  { id: "create-story", label: "Create Story", pipelineStageIds: [DesignPipelineStage.VISUAL_STORY_PLANNING], strengthens: "load-knowledge" },
  { id: "create-scene", label: "Create Scene", pipelineStageIds: [DesignPipelineStage.SCENE_PLANNING], strengthens: "create-story" },
  { id: "create-composition", label: "Create Composition", pipelineStageIds: [DesignPipelineStage.COMPOSITION_PLANNING], strengthens: "create-scene" },
  { id: "create-photography", label: "Create Photography", pipelineStageIds: [DesignPipelineStage.PHOTOGRAPHY_PLANNING], strengthens: "create-composition" },
  { id: "assemble-blueprint", label: "Assemble Blueprint", pipelineStageIds: [DesignPipelineStage.BLUEPRINT_ASSEMBLY], strengthens: "create-photography" },
  { id: "validate-consensus", label: "Validate Consensus", pipelineStageIds: [DesignPipelineStage.CONSENSUS_VALIDATION], strengthens: "assemble-blueprint" },
  { id: "render", label: "Render", pipelineStageIds: [DesignPipelineStage.RENDER_ADAPTER, DesignPipelineStage.RENDER_PROVIDER], strengthens: "validate-consensus" },
  { id: "validate-vision", label: "Validate Vision", pipelineStageIds: [DesignPipelineStage.VISION_ANALYSIS], strengthens: "render" },
  { id: "validate-commercial", label: "Validate Commercial Value", pipelineStageIds: [DesignPipelineStage.COMMERCIAL_VALIDATION], strengthens: "validate-vision" },
  { id: "executive-review", label: "Executive Review", pipelineStageIds: [DesignPipelineStage.CHIEF_DESIGN_REVIEW], strengthens: "validate-commercial" },
  { id: "learn", label: "Learn", pipelineStageIds: [DesignPipelineStage.KNOWLEDGE_LEARNING], strengthens: "executive-review" },
  { id: "deliver", label: "Deliver", pipelineStageIds: [DesignPipelineStage.PIPELINE_COMPLETION, DesignPipelineStage.PIPELINE_OBSERVABILITY], strengthens: "learn" },
] as const;

export const PIPELINE_MATURITY_LEVELS: readonly PipelineMaturityLevelDefinition[] = [
  { level: PipelineMaturityLevel.PROMPT_BASED, label: "Prompt-Based Generation", summary: "Single prompt produces image — no structured planning." },
  { level: PipelineMaturityLevel.BLUEPRINT_BASED, label: "Blueprint Generation", summary: "Structured engineering blueprint before render." },
  { level: PipelineMaturityLevel.MULTI_AGENT, label: "Multi-Agent Pipeline", summary: "Independent specialist agents collaborate on blueprint." },
  { level: PipelineMaturityLevel.KNOWLEDGE_DRIVEN, label: "Knowledge-Driven Design", summary: "Unified engineering knowledge base drives every decision." },
  { level: PipelineMaturityLevel.SELF_IMPROVING, label: "Self-Improving Design Intelligence", summary: "Continuous learning improves platform after every generation." },
] as const;

function violation(
  code: PipelineArchitecturePrincipleFailureCode,
  principleId: PipelineArchitecturePrincipleIdValue,
  message: string,
  stageId?: string,
): PipelineArchitecturePrincipleViolation {
  return { code, principleId, message, stageId };
}

function result(
  principleId: PipelineArchitecturePrincipleIdValue,
  violations: PipelineArchitecturePrincipleViolation[],
): PipelineArchitecturePrincipleCheckResult {
  return { principleId, passed: violations.length === 0, violations };
}

function stageOrder(stageId: string): number {
  return HIGH_LEVEL_PIPELINE.find((s) => s.id === stageId)?.order ?? -1;
}

export function getPipelineArchitecturePrinciple(
  principleId: PipelineArchitecturePrincipleIdValue,
): PipelineArchitecturePrincipleDefinition | undefined {
  return PIPELINE_ARCHITECTURE_CONSTITUTION.find((p) => p.id === principleId);
}

export function validatePrinciplePlanningBeforeRendering(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.PLANNING_BEFORE_RENDERING;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const assembly = stageOrder(DesignPipelineStage.BLUEPRINT_ASSEMBLY);
  const render = stageOrder(DesignPipelineStage.RENDER_ADAPTER);
  if (assembly < 0 || render < 0 || assembly >= render) {
    violations.push(
      violation(
        "RENDER_BEFORE_PLANNING",
        principleId,
        "Blueprint assembly must complete before render adapter stage",
        DesignPipelineStage.RENDER_ADAPTER,
      ),
    );
  }

  if (context.promptOnlyPipeline || context.logicInPrompt) {
    violations.push(
      violation("RENDER_BEFORE_PLANNING", principleId, "Prompt-only pipeline skips planning before rendering"),
    );
  }

  return result(principleId, violations);
}

function kitchenBlueprint() {
  const assembly = runBlueprintAssemblyStageFromPipeline();
  return assembly.section!.blueprint;
}

function independentPipelineBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.photography.photographyStyle = "premium_hero";
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  return bp;
}

export function validatePrincipleBlueprintBeforePrompt(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.BLUEPRINT_BEFORE_PROMPT;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const blueprintViolations = validateBlueprintAsSourceOfTruth(kitchenBlueprint());
  if (blueprintViolations.length > 0) {
    violations.push(
      violation("PROMPT_AS_SOURCE", principleId, "Blueprint must be source of truth, not prompt"),
    );
  }

  if (context.logicInPrompt || context.promptOnlyPipeline) {
    violations.push(
      violation("PROMPT_AS_SOURCE", principleId, "Design logic concentrated in prompt violates Blueprint Before Prompt"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleAgentSpecialization(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.AGENT_SPECIALIZATION;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const agentStages = HIGH_LEVEL_PIPELINE.filter((s) => s.agentIds && s.agentIds.length > 0);
  for (const stage of agentStages) {
    if (stage.agentIds!.length > 2) {
      violations.push(
        violation(
          "AGENT_OVERLAP",
          principleId,
          `Stage ${stage.id} assigns too many agents — specialization violated`,
          stage.id,
        ),
      );
    }
  }

  if (context.chaoticAgents) {
    violations.push(
      violation("AGENT_OVERLAP", principleId, "Agents making cross-domain decisions violate specialization"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleSingleSourceOfTruth(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.SINGLE_SOURCE_OF_TRUTH;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const rewriteViolations = validatePipelineIncrementalBlueprint(context.multipleBlueprints ? { fullBlueprintRewrite: true } : {});
  for (const v of rewriteViolations) {
    violations.push(violation("MULTIPLE_BLUEPRINTS", principleId, v.message));
  }

  if (context.multipleBlueprints) {
    violations.push(
      violation("MULTIPLE_BLUEPRINTS", principleId, "Multiple independent blueprint variants are forbidden"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleKnowledgeDrivenDecisions(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.KNOWLEDGE_DRIVEN_DECISIONS;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const knowledge = stageOrder(DesignPipelineStage.KNOWLEDGE_RETRIEVAL);
  const story = stageOrder(DesignPipelineStage.VISUAL_STORY_PLANNING);
  if (knowledge < 0 || story < 0 || knowledge >= story) {
    violations.push(
      violation(
        "LLM_INTUITION_DECISION",
        principleId,
        "Knowledge retrieval must precede creative planning stages",
        DesignPipelineStage.KNOWLEDGE_RETRIEVAL,
      ),
    );
  }

  if (context.logicInPrompt || context.promptOnlyPipeline) {
    violations.push(
      violation("LLM_INTUITION_DECISION", principleId, "LLM-only decisions without Knowledge Engine are forbidden"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleValidationBeforeProgress(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.VALIDATION_BEFORE_PROGRESS;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const validationStages = [
    DesignPipelineStage.CONSENSUS_VALIDATION,
    DesignPipelineStage.VISION_ANALYSIS,
    DesignPipelineStage.COMMERCIAL_VALIDATION,
    DesignPipelineStage.CHIEF_DESIGN_REVIEW,
  ];

  for (const stageId of validationStages) {
    if (!HIGH_LEVEL_PIPELINE.some((s) => s.id === stageId)) {
      violations.push(
        violation("SKIPPED_VALIDATION", principleId, `Required validation stage ${stageId} missing`, stageId),
      );
    }
  }

  if (context.skipValidation) {
    violations.push(
      violation("SKIPPED_VALIDATION", principleId, "Pipeline cannot skip validation before advancing"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleLocalRetry(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.LOCAL_RETRY;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  for (const v of validatePipelineIndependentRetry()) {
    violations.push(violation("FULL_PIPELINE_RESTART", principleId, v.message, v.stage));
  }

  if (context.fullPipelineRestartOnly) {
    violations.push(
      violation("FULL_PIPELINE_RESTART", principleId, "Full pipeline restart must not be the default recovery strategy"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleExplainability(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.EXPLAINABILITY;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const explainability = validateExplainabilityArchitecture(independentPipelineBlueprint());
  if (!explainability.explainable) {
    for (const v of explainability.violations) {
      violations.push(violation("BLACK_BOX_DECISION", principleId, v.message));
    }
  }

  if (context.blackBoxPipeline) {
    violations.push(
      violation("BLACK_BOX_DECISION", principleId, "Pipeline must never operate as a black box"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleProviderIndependence(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.PROVIDER_INDEPENDENCE;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const adapterStage = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.RENDER_ADAPTER);
  const providerStage = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.RENDER_PROVIDER);
  if (!adapterStage || !providerStage) {
    violations.push(
      violation("PROVIDER_LOCK_IN", principleId, "Render Adapter must be a distinct pipeline stage"),
    );
  }

  const providerReport = validateProviderIndependence(independentPipelineBlueprint());
  if (!providerReport.independent) {
    for (const v of providerReport.violations) {
      violations.push(violation("PROVIDER_LOCK_IN", principleId, v.message));
    }
  }

  if (context.providerLocked) {
    violations.push(
      violation("PROVIDER_LOCK_IN", principleId, "Pipeline architecture must not depend on a single AI model"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleContinuousLearning(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.CONTINUOUS_LEARNING;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const learning = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.KNOWLEDGE_LEARNING);
  if (!learning) {
    violations.push(
      violation("LEARNING_SKIPPED", principleId, "Knowledge Learning stage is mandatory", DesignPipelineStage.KNOWLEDGE_LEARNING),
    );
  }

  const completion = stageOrder(DesignPipelineStage.PIPELINE_COMPLETION);
  const learningOrder = stageOrder(DesignPipelineStage.KNOWLEDGE_LEARNING);
  if (learningOrder >= completion) {
    violations.push(
      violation("LEARNING_SKIPPED", principleId, "Learning must precede pipeline completion", DesignPipelineStage.KNOWLEDGE_LEARNING),
    );
  }

  if (context.skipLearning) {
    violations.push(
      violation("LEARNING_SKIPPED", principleId, "Pipeline is incomplete without Learning Engine handoff"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleCommercialFirst(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.COMMERCIAL_FIRST;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const commercial = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.COMMERCIAL_VALIDATION);
  if (!commercial) {
    violations.push(
      violation("COMMERCIAL_IGNORED", principleId, "Commercial Validation stage is required", DesignPipelineStage.COMMERCIAL_VALIDATION),
    );
  }

  if (context.promptOnlyPipeline) {
    violations.push(
      violation("COMMERCIAL_IGNORED", principleId, "Prompt-only generation ignores commercial effectiveness criteria"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleScalability(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.SCALABILITY;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const agentStages = HIGH_LEVEL_PIPELINE.filter((s) => s.agentIds && s.agentIds.length > 0);
  if (agentStages.length < 8) {
    violations.push(
      violation("MONOLITHIC_PIPELINE", principleId, "Pipeline requires modular specialist agents for scalability"),
    );
  }

  if (PIPELINE_LAYERS.length < 8) {
    violations.push(
      violation("MONOLITHIC_PIPELINE", principleId, "Layered architecture required for modular evolution"),
    );
  }

  if (context.chaoticAgents) {
    violations.push(
      violation("MONOLITHIC_PIPELINE", principleId, "Chaotic agent overlap prevents modular scaling"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleDeterministicWorkflow(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.DETERMINISTIC_WORKFLOW;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  for (const v of validatePipelineDeterminism(
    context.nonDeterministicPlanning ? { nonDeterministic: true } : {},
  )) {
    violations.push(violation("NON_DETERMINISTIC_PLANNING", principleId, v.message));
  }

  if (context.nonDeterministicPlanning) {
    violations.push(
      violation("NON_DETERMINISTIC_PLANNING", principleId, "Planning stages must be deterministic for identical inputs"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleObservability(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.OBSERVABILITY;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const observability = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.PIPELINE_OBSERVABILITY);
  if (!observability) {
    violations.push(
      violation("MISSING_OBSERVABILITY", principleId, "Pipeline Observability stage is required", DesignPipelineStage.PIPELINE_OBSERVABILITY),
    );
  }

  const observabilityReport = validatePipelineObservabilityStage();
  if (!observabilityReport.valid) {
    violations.push(
      violation("MISSING_OBSERVABILITY", principleId, "Observability subsystem must capture telemetry and traces"),
    );
  }

  if (context.skipObservability || context.blackBoxPipeline) {
    violations.push(
      violation("MISSING_OBSERVABILITY", principleId, "Pipeline cannot evolve without observability"),
    );
  }

  return result(principleId, violations);
}

export function validatePrincipleFutureCompatibility(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const principleId = PipelineArchitecturePrincipleId.FUTURE_COMPATIBILITY;
  const violations: PipelineArchitecturePrincipleViolation[] = [];

  const pipelineReport = validateDesignPipeline();
  if (!pipelineReport.scalable || !pipelineReport.learningIntegrated) {
    violations.push(
      violation("NOT_FUTURE_COMPATIBLE", principleId, "Pipeline must be scalable and learning-integrated for long-term evolution"),
    );
  }

  if (validatePipelineStageOrder().length > 0) {
    violations.push(
      violation("NOT_FUTURE_COMPATIBLE", principleId, "Invalid stage order threatens future extensibility"),
    );
  }

  if (context.providerLocked || context.promptOnlyPipeline) {
    violations.push(
      violation("NOT_FUTURE_COMPATIBLE", principleId, "Provider or prompt lock-in prevents future platform evolution"),
    );
  }

  return result(principleId, violations);
}

const PRINCIPLE_VALIDATORS: Record<
  PipelineArchitecturePrincipleIdValue,
  (ctx: PipelineArchitectureConstitutionContext) => PipelineArchitecturePrincipleCheckResult
> = {
  [PipelineArchitecturePrincipleId.PLANNING_BEFORE_RENDERING]: validatePrinciplePlanningBeforeRendering,
  [PipelineArchitecturePrincipleId.BLUEPRINT_BEFORE_PROMPT]: validatePrincipleBlueprintBeforePrompt,
  [PipelineArchitecturePrincipleId.AGENT_SPECIALIZATION]: validatePrincipleAgentSpecialization,
  [PipelineArchitecturePrincipleId.SINGLE_SOURCE_OF_TRUTH]: validatePrincipleSingleSourceOfTruth,
  [PipelineArchitecturePrincipleId.KNOWLEDGE_DRIVEN_DECISIONS]: validatePrincipleKnowledgeDrivenDecisions,
  [PipelineArchitecturePrincipleId.VALIDATION_BEFORE_PROGRESS]: validatePrincipleValidationBeforeProgress,
  [PipelineArchitecturePrincipleId.LOCAL_RETRY]: validatePrincipleLocalRetry,
  [PipelineArchitecturePrincipleId.EXPLAINABILITY]: validatePrincipleExplainability,
  [PipelineArchitecturePrincipleId.PROVIDER_INDEPENDENCE]: validatePrincipleProviderIndependence,
  [PipelineArchitecturePrincipleId.CONTINUOUS_LEARNING]: validatePrincipleContinuousLearning,
  [PipelineArchitecturePrincipleId.COMMERCIAL_FIRST]: validatePrincipleCommercialFirst,
  [PipelineArchitecturePrincipleId.SCALABILITY]: validatePrincipleScalability,
  [PipelineArchitecturePrincipleId.DETERMINISTIC_WORKFLOW]: validatePrincipleDeterministicWorkflow,
  [PipelineArchitecturePrincipleId.OBSERVABILITY]: validatePrincipleObservability,
  [PipelineArchitecturePrincipleId.FUTURE_COMPATIBILITY]: validatePrincipleFutureCompatibility,
};

export function validatePipelineArchitecturePrinciple(
  principleId: PipelineArchitecturePrincipleIdValue,
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitecturePrincipleCheckResult {
  const validator = PRINCIPLE_VALIDATORS[principleId];
  if (!validator) {
    return result(principleId, [
      violation("CONSTITUTION_INCOMPLETE", principleId, `No validator for principle ${principleId}`),
    ]);
  }
  return validator(context);
}

export function detectPipelineMaturityLevel(): PipelineMaturityLevelId {
  const hasBlueprint = HIGH_LEVEL_PIPELINE.some((s) => s.id === DesignPipelineStage.BLUEPRINT_ASSEMBLY);
  const agentCount = HIGH_LEVEL_PIPELINE.filter((s) => s.agentIds?.length).length;
  const hasKnowledge = HIGH_LEVEL_PIPELINE.some((s) => s.id === DesignPipelineStage.KNOWLEDGE_RETRIEVAL);
  const hasLearning = HIGH_LEVEL_PIPELINE.some((s) => s.id === DesignPipelineStage.KNOWLEDGE_LEARNING);

  if (hasLearning && hasKnowledge && agentCount >= 8) return PipelineMaturityLevel.SELF_IMPROVING;
  if (hasKnowledge && agentCount >= 4) return PipelineMaturityLevel.KNOWLEDGE_DRIVEN;
  if (agentCount >= 4) return PipelineMaturityLevel.MULTI_AGENT;
  if (hasBlueprint) return PipelineMaturityLevel.BLUEPRINT_BASED;
  return PipelineMaturityLevel.PROMPT_BASED;
}

export function validatePipelineManifest(): boolean {
  if (PIPELINE_MANIFEST.length !== 15) return false;
  for (let i = 1; i < PIPELINE_MANIFEST.length; i++) {
    const stage = PIPELINE_MANIFEST[i];
    const prev = PIPELINE_MANIFEST[i - 1];
    if (stage.strengthens !== prev.id) return false;
    if (stage.pipelineStageIds.length === 0) return false;
  }
  return true;
}

export function validatePipelineArchitectureConstitution(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitectureConstitutionReport {
  const principleResults = PIPELINE_ARCHITECTURE_CONSTITUTION.map((p) =>
    validatePipelineArchitecturePrinciple(p.id, context),
  );
  const violations = principleResults.flatMap((r) => r.violations);
  const principlesPassed = principleResults.filter((r) => r.passed).length;
  const maturityLevel = detectPipelineMaturityLevel();

  return {
    valid: violations.length === 0,
    violations,
    principleResults,
    principlesPassed,
    principlesTotal: PIPELINE_ARCHITECTURE_CONSTITUTION.length,
    constitutionSatisfied: violations.length === 0,
    finalGoldenRuleSatisfied: FINAL_GOLDEN_RULE_OF_DESIGN_PIPELINE.includes("single prompt"),
    architectureStatementValid: PIPELINE_ARCHITECTURE_STATEMENT.includes("decision quality"),
    manifestValid: validatePipelineManifest(),
    maturityLevel,
    targetMaturityLevel: PipelineMaturityLevel.SELF_IMPROVING,
    successCriteriaMet:
      violations.length === 0 &&
      maturityLevel >= PipelineMaturityLevel.SELF_IMPROVING &&
      validatePipelineManifest(),
  };
}

export function assertPipelineArchitectureConstitution(
  context?: PipelineArchitectureConstitutionContext,
): PipelineArchitectureConstitutionReport {
  const report = validatePipelineArchitectureConstitution(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => `[${v.principleId}] ${v.message}`).join("; ");
    throw new Error(`Pipeline Architecture constitution violated: ${messages}`);
  }
  return report;
}

export function runPipelineArchitecturePrinciples(
  context: PipelineArchitectureConstitutionContext = {},
): PipelineArchitectureConstitutionReport {
  return validatePipelineArchitectureConstitution(context);
}

export function isPipelineArchitecturePrincipleFailure(
  code: string,
): code is PipelineArchitecturePrincipleFailureCode {
  const codes: PipelineArchitecturePrincipleFailureCode[] = [
    "RENDER_BEFORE_PLANNING",
    "PROMPT_AS_SOURCE",
    "AGENT_OVERLAP",
    "MULTIPLE_BLUEPRINTS",
    "LLM_INTUITION_DECISION",
    "SKIPPED_VALIDATION",
    "FULL_PIPELINE_RESTART",
    "BLACK_BOX_DECISION",
    "PROVIDER_LOCK_IN",
    "LEARNING_SKIPPED",
    "COMMERCIAL_IGNORED",
    "MONOLITHIC_PIPELINE",
    "NON_DETERMINISTIC_PLANNING",
    "MISSING_OBSERVABILITY",
    "NOT_FUTURE_COMPATIBLE",
    "CONSTITUTION_INCOMPLETE",
  ];
  return codes.includes(code as PipelineArchitecturePrincipleFailureCode);
}

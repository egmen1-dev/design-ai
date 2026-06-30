/**
 * Chapter 7.2 — Base Agent Architecture engine.
 * Universal internal architecture shared by every Design AI intelligent agent.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_READ_MATRIX } from "./agent-matrix";
import { buildAgentContextPackage } from "./agent-context-engine";
import { ConstraintEngine } from "./constraint-engine";
import type { ConstraintSet } from "./constraint-types";
import { retrieveKnowledgePackage } from "./knowledge-retrieval-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import { StoryType } from "./visual-story-director-types";
import { createAgentContext } from "./universal-agent-contract";
import { universalStoryDirectorAgent } from "./agents/story-director-agent";
import {
  BaseAgentArchitectureLayer,
  BaseAgentErrorCategory,
  BaseAgentExecutionStatus,
  BaseAgentInjectableDependency,
  BaseAgentPipelineStage,
  type BaseAgentArchitectureContext,
  type BaseAgentArchitectureFailureCode,
  type BaseAgentArchitectureLayerId,
  type BaseAgentArchitectureReport,
  type BaseAgentArchitectureViolation,
  type BaseAgentContextProjection,
  type BaseAgentExecutionReport,
  type BaseAgentInput,
  type BaseAgentLayerDefinition,
  type BaseAgentPipelineStageDefinition,
  type BaseAgentPipelineStageId,
  type BaseAgentState,
  type BaseAgentTelemetry,
} from "./base-agent-architecture-types";

export {
  BaseAgentPipelineStage,
  BaseAgentArchitectureLayer,
  BaseAgentErrorCategory,
  BaseAgentInjectableDependency,
  BaseAgentExecutionStatus,
  type BaseAgentPipelineStageId,
  type BaseAgentArchitectureLayerId,
  type BaseAgentErrorCategoryId,
  type BaseAgentInjectableDependencyId,
  type BaseAgentExecutionStatusId,
  type BaseAgentInput,
  type BaseAgentState,
  type BaseAgentTelemetry,
  type BaseAgentPipelineStageDefinition,
  type BaseAgentLayerDefinition,
  type BaseAgentContextProjection,
  type BaseAgentArchitectureViolation,
  type BaseAgentExecutionReport,
  type BaseAgentArchitectureReport,
  type BaseAgentArchitectureContext,
  type BaseAgentArchitectureFailureCode,
} from "./base-agent-architecture-types";

export const BASE_AGENT_ARCHITECTURE_VERSION = "7.2.0";

export const BASE_AGENT_ARCHITECTURE_GOLDEN_RULE =
  "All Design AI agents differ in profession but share identical engineering structure. " +
  "They differ in knowledge, decision logic, and blueprint output — yet use one base architecture. " +
  "Base Agent Architecture makes the Agent Ecosystem a cohesive system where new specialists " +
  "can be created without destabilizing the entire platform.";

export const LEGACY_PROMPT_AGENT_ARCHITECTURE = ["input", "prompt", "llm", "output"] as const;

export const BASE_AGENT_PIPELINE: readonly BaseAgentPipelineStageDefinition[] = [
  {
    id: BaseAgentPipelineStage.PIPELINE_CONTEXT,
    order: 1,
    label: "Pipeline Context",
    layer: BaseAgentArchitectureLayer.INPUT,
    moduleRef: "pipeline-context-engine",
    responsibility: "Receive unified pipeline context",
  },
  {
    id: BaseAgentPipelineStage.INPUT_ADAPTER,
    order: 2,
    label: "Input Adapter",
    layer: BaseAgentArchitectureLayer.INPUT,
    moduleRef: "universal-agent-bridge",
    responsibility: "Normalize external inputs to internal agent format — no business logic",
  },
  {
    id: BaseAgentPipelineStage.CONTEXT_ANALYZER,
    order: 3,
    label: "Context Analyzer",
    layer: BaseAgentArchitectureLayer.CONTEXT,
    moduleRef: "agent-context-engine",
    responsibility: "Extract only the blueprint sections required for this agent",
  },
  {
    id: BaseAgentPipelineStage.KNOWLEDGE_RETRIEVAL,
    order: 4,
    label: "Knowledge Retrieval",
    layer: BaseAgentArchitectureLayer.KNOWLEDGE,
    moduleRef: "knowledge-retrieval-engine",
    responsibility: "Load domain-specific knowledge from Knowledge Engine",
  },
  {
    id: BaseAgentPipelineStage.DECISION_ENGINE,
    order: 5,
    label: "Decision Engine",
    layer: BaseAgentArchitectureLayer.DECISION,
    moduleRef: "agent-decision-engine",
    responsibility: "Make professional design decisions — only variable module per agent",
  },
  {
    id: BaseAgentPipelineStage.RULE_ENGINE,
    order: 6,
    label: "Rule Engine",
    layer: BaseAgentArchitectureLayer.RULES,
    moduleRef: "constraint-engine",
    responsibility: "Validate decision against constitution, marketplace, and anti-patterns",
  },
  {
    id: BaseAgentPipelineStage.BLUEPRINT_BUILDER,
    order: 7,
    label: "Blueprint Builder",
    layer: BaseAgentArchitectureLayer.BLUEPRINT,
    moduleRef: "mutation-engine",
    responsibility: "Emit owned blueprint section updates",
  },
  {
    id: BaseAgentPipelineStage.SELF_VALIDATION,
    order: 8,
    label: "Self Validation",
    layer: BaseAgentArchitectureLayer.VALIDATION,
    moduleRef: "validation-engine",
    responsibility: "Verify blueprint completeness, consistency, and readiness",
  },
  {
    id: BaseAgentPipelineStage.OUTPUT_ADAPTER,
    order: 9,
    label: "Output Adapter",
    layer: BaseAgentArchitectureLayer.OUTPUT,
    moduleRef: "universal-agent-contract",
    responsibility: "Return UniversalAgentResult through unified contract",
  },
] as const;

export const BASE_AGENT_LAYERS: readonly BaseAgentLayerDefinition[] = [
  { id: BaseAgentArchitectureLayer.INPUT, order: 1, label: "Input", responsibility: "Contract-defined pipeline inputs" },
  { id: BaseAgentArchitectureLayer.CONTEXT, order: 2, label: "Context", responsibility: "Minimal context projection for agent domain" },
  { id: BaseAgentArchitectureLayer.KNOWLEDGE, order: 3, label: "Knowledge", responsibility: "Domain knowledge retrieval" },
  { id: BaseAgentArchitectureLayer.DECISION, order: 4, label: "Decision", responsibility: "Professional decision core" },
  { id: BaseAgentArchitectureLayer.RULES, order: 5, label: "Rules", responsibility: "Constitution and constraint enforcement" },
  { id: BaseAgentArchitectureLayer.BLUEPRINT, order: 6, label: "Blueprint", responsibility: "Owned section mutation build" },
  { id: BaseAgentArchitectureLayer.VALIDATION, order: 7, label: "Validation", responsibility: "Self-critic quality gate" },
  { id: BaseAgentArchitectureLayer.OUTPUT, order: 8, label: "Output", responsibility: "Standardized agent result" },
  { id: BaseAgentArchitectureLayer.TELEMETRY, order: 9, label: "Telemetry", responsibility: "Duration, knowledge, rules, scores for observability" },
] as const;

export const BASE_AGENT_INJECTABLE_DEPENDENCIES = [
  BaseAgentInjectableDependency.KNOWLEDGE_ENGINE,
  BaseAgentInjectableDependency.PATTERN_LIBRARY,
  BaseAgentInjectableDependency.RULE_ENGINE,
  BaseAgentInjectableDependency.MARKETPLACE_PROFILE,
  BaseAgentInjectableDependency.LOGGER,
] as const;

export const BASE_AGENT_ERROR_CATEGORIES = [
  BaseAgentErrorCategory.KNOWLEDGE_ERROR,
  BaseAgentErrorCategory.RULE_CONFLICT,
  BaseAgentErrorCategory.BLUEPRINT_VALIDATION_FAILED,
  BaseAgentErrorCategory.MISSING_CONTEXT,
] as const;

function violation(
  code: BaseAgentArchitectureFailureCode,
  message: string,
  stage?: BaseAgentPipelineStageId,
  agentId?: string,
): BaseAgentArchitectureViolation {
  return { code, message, stage, agentId };
}

export function createInitialAgentState(retryCount = 0): BaseAgentState {
  return {
    status: BaseAgentExecutionStatus.PENDING,
    decisionScore: 0,
    validationPassed: false,
    knowledgeVersion: "knowledge-v1",
    retryCount,
  };
}

export function buildBaseAgentInput(input: {
  agentId: AgentContractId;
  blueprint?: import("./types").RenderBlueprint;
  marketplace?: string;
}): BaseAgentInput {
  const blueprint =
    input.blueprint ??
    (() => {
      const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 7 });
      return { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } };
    })();

  const pipelineContext = buildAgentContextPackage({
    blueprint: structuredClone(blueprint) as import("./types").RenderBlueprint,
    agentId: input.agentId,
    pipelineId: "base-agent-kitchen",
  });

  const knowledge = retrieveKnowledgePackage({
    context: {
      category: blueprint.product.category,
      marketplace: input.marketplace ?? "wildberries",
      semanticQuery: blueprint.creative.goal,
    },
    limit: 6,
    useCache: false,
  });

  const constraintReport = new ConstraintEngine().evaluate(blueprint);

  return {
    pipelineContext,
    blueprint,
    knowledge,
    constraints: constraintReport.mergedSet,
  };
}

export function projectContextForAgent(agentId: AgentContractId): BaseAgentContextProjection {
  return {
    agentId,
    sections: [...(AGENT_READ_MATRIX[agentId] ?? [])],
    marketplace: undefined,
  };
}

export function buildAgentTelemetry(input: {
  durationMs: number;
  knowledgeItemsUsed: number;
  rulesEvaluated: number;
  decisionScore: number;
  validationScore: number;
  retryCount: number;
  stagesCompleted: BaseAgentPipelineStageId[];
}): BaseAgentTelemetry {
  return {
    durationMs: input.durationMs,
    knowledgeItemsUsed: input.knowledgeItemsUsed,
    rulesEvaluated: input.rulesEvaluated,
    decisionScore: input.decisionScore,
    validationScore: input.validationScore,
    retryCount: input.retryCount,
    stagesCompleted: [...input.stagesCompleted],
  };
}

export function validateBaseAgentPipelineStructure(): BaseAgentArchitectureViolation[] {
  const violations: BaseAgentArchitectureViolation[] = [];
  if (BASE_AGENT_PIPELINE.length !== 9) {
    violations.push(violation("INCOMPLETE_PIPELINE", "Base agent pipeline requires 9 stages"));
  }
  if (BASE_AGENT_LAYERS.length !== 9) {
    violations.push(violation("INCOMPLETE_LAYERS", "Base agent architecture requires 9 layers"));
  }
  return violations;
}

export function validateStatelessDesign(
  context: BaseAgentArchitectureContext = {},
): BaseAgentArchitectureViolation[] {
  if (context.hiddenState) {
    return [violation("HIDDEN_STATE", "Agents must not retain hidden long-lived state")];
  }
  return [];
}

export function validateDependencyInjection(
  context: BaseAgentArchitectureContext = {},
): BaseAgentArchitectureViolation[] {
  if (context.selfCreatedDependencies) {
    return [violation("SELF_CREATED_DEPENDENCY", "Dependencies must be injected — never self-created")];
  }
  if (BASE_AGENT_INJECTABLE_DEPENDENCIES.length < 5) {
    return [violation("ARCHITECTURE_INCOMPLETE", "Injectable dependency catalog incomplete")];
  }
  return [];
}

export async function executeBaseAgentArchitecture(input: {
  agentId: AgentContractId;
  blueprint?: import("./types").RenderBlueprint;
  marketplace?: string;
  context?: BaseAgentArchitectureContext;
}): Promise<BaseAgentExecutionReport> {
  const started = Date.now();
  const stagesCompleted: BaseAgentPipelineStageId[] = [];
  const violations: BaseAgentArchitectureViolation[] = [];
  const state = createInitialAgentState();
  state.status = BaseAgentExecutionStatus.RUNNING;

  if (input.context?.promptOnlyAgent || input.context?.monolithicLogic) {
    return {
      valid: false,
      agentId: input.agentId,
      violations: [
        violation("PROMPT_ONLY_ARCHITECTURE", "Monolithic prompt architecture is forbidden", undefined, input.agentId),
      ],
      stagesCompleted,
      state: { ...state, status: BaseAgentExecutionStatus.FAILED },
      telemetry: buildAgentTelemetry({
        durationMs: Date.now() - started,
        knowledgeItemsUsed: 0,
        rulesEvaluated: 0,
        decisionScore: 0,
        validationScore: 0,
        retryCount: 0,
        stagesCompleted,
      }),
    };
  }

  const agentInput = buildBaseAgentInput({
    agentId: input.agentId,
    blueprint: input.blueprint,
    marketplace: input.marketplace,
  });
  stagesCompleted.push(BaseAgentPipelineStage.PIPELINE_CONTEXT);

  const agentContext = createAgentContext({
    blueprint: agentInput.blueprint,
    agentId: input.agentId,
    marketplace: input.marketplace ?? "wildberries",
  });
  stagesCompleted.push(BaseAgentPipelineStage.INPUT_ADAPTER);

  const projection = projectContextForAgent(input.agentId);
  if (projection.sections.length === 0 && input.agentId !== "chief-design-director") {
    violations.push(
      violation("MISSING_CONTEXT", "Context analyzer produced empty projection", BaseAgentPipelineStage.CONTEXT_ANALYZER, input.agentId),
    );
  }
  stagesCompleted.push(BaseAgentPipelineStage.CONTEXT_ANALYZER);

  if (agentInput.knowledge.items.length === 0) {
    violations.push(
      violation("MISSING_CONTEXT", "Knowledge retrieval returned empty package", BaseAgentPipelineStage.KNOWLEDGE_RETRIEVAL, input.agentId),
    );
  }
  stagesCompleted.push(BaseAgentPipelineStage.KNOWLEDGE_RETRIEVAL);

  let result;
  if (input.agentId === "visual-story-director") {
    result = await universalStoryDirectorAgent.execute(agentContext);
    state.decisionScore = result.confidence;
    stagesCompleted.push(BaseAgentPipelineStage.DECISION_ENGINE);

    const rulesEvaluated = agentInput.constraints.constraints.length;
    if (rulesEvaluated === 0 && agentInput.blueprint.constraints) {
      violations.push(
        violation("MISSING_CONTEXT", "Rule engine found no constraints to evaluate", BaseAgentPipelineStage.RULE_ENGINE, input.agentId),
      );
    }
    stagesCompleted.push(BaseAgentPipelineStage.RULE_ENGINE);

    if (result.mutations.length === 0) {
      violations.push(
        violation("EXECUTION_FAILED", "Blueprint builder produced no mutations", BaseAgentPipelineStage.BLUEPRINT_BUILDER, input.agentId),
      );
    }
    stagesCompleted.push(BaseAgentPipelineStage.BLUEPRINT_BUILDER);

    state.validationPassed = result.approved && result.mutations.length > 0;
    if (!state.validationPassed && !input.context?.skipSelfValidation) {
      violations.push(
        violation(
          "MISSING_SELF_VALIDATION",
          "Self validation failed — agent result not approved or missing mutations",
          BaseAgentPipelineStage.SELF_VALIDATION,
          input.agentId,
        ),
      );
    } else if (input.context?.skipSelfValidation) {
      violations.push(
        violation("MISSING_SELF_VALIDATION", "Self validation skipped", BaseAgentPipelineStage.SELF_VALIDATION, input.agentId),
      );
    }
    stagesCompleted.push(BaseAgentPipelineStage.SELF_VALIDATION);

    if (!result.diagnostics.decisionTrace.length) {
      violations.push(
        violation("EXECUTION_FAILED", "Output adapter missing decision trace", BaseAgentPipelineStage.OUTPUT_ADAPTER, input.agentId),
      );
    }
    stagesCompleted.push(BaseAgentPipelineStage.OUTPUT_ADAPTER);
  } else {
    violations.push(
      violation("EXECUTION_FAILED", `Kitchen execution not wired for agent ${input.agentId}`, BaseAgentPipelineStage.DECISION_ENGINE, input.agentId),
    );
  }

  if (input.context?.mutateForeignBlueprint) {
    violations.push(
      violation("FOREIGN_BLUEPRINT_MUTATION", "Agent mutated foreign blueprint section", undefined, input.agentId),
    );
  }

  const telemetry = buildAgentTelemetry({
    durationMs: Date.now() - started,
    knowledgeItemsUsed: agentInput.knowledge.items.length,
    rulesEvaluated: agentInput.constraints.constraints.length,
    decisionScore: state.decisionScore,
    validationScore: state.validationPassed ? 1 : 0,
    retryCount: state.retryCount,
    stagesCompleted,
  });

  if (input.context?.missingTelemetry || telemetry.stagesCompleted.length < 9) {
    if (telemetry.stagesCompleted.length < 9) {
      violations.push(violation("MISSING_TELEMETRY", "Telemetry must record all completed stages", undefined, input.agentId));
    }
  }

  state.status = violations.length === 0 ? BaseAgentExecutionStatus.COMPLETED : BaseAgentExecutionStatus.FAILED;

  return {
    valid: violations.length === 0,
    agentId: input.agentId,
    violations,
    stagesCompleted,
    state,
    telemetry,
    result,
  };
}

export function validateBaseAgentArchitecture(
  context: BaseAgentArchitectureContext = {},
): BaseAgentArchitectureReport {
  const violations = [
    ...validateBaseAgentPipelineStructure(),
    ...validateStatelessDesign(context),
    ...validateDependencyInjection(context),
  ];

  if (context.promptOnlyAgent || context.monolithicLogic) {
    violations.push(violation("PROMPT_ONLY_ARCHITECTURE", "Prompt-only agent architecture forbidden"));
  }

  return {
    valid: violations.length === 0,
    violations,
    pipelineComplete: validateBaseAgentPipelineStructure().length === 0,
    layersComplete: BASE_AGENT_LAYERS.length === 9,
    statelessDesign: validateStatelessDesign(context).length === 0,
    dependencyInjectionReady: validateDependencyInjection(context).length === 0,
    modularDesign: BASE_AGENT_PIPELINE.every((s) => s.moduleRef.length > 0),
    kitchenExecutionValid: false,
    goldenRuleSatisfied: BASE_AGENT_ARCHITECTURE_GOLDEN_RULE.includes("identical engineering structure"),
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateBaseAgentArchitectureWithExecution(
  context: BaseAgentArchitectureContext = {},
): Promise<BaseAgentArchitectureReport> {
  const report = validateBaseAgentArchitecture(context);
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;

  const execution = await executeBaseAgentArchitecture({
    agentId: "visual-story-director",
    blueprint: bp,
    context,
  });

  const violations = [...report.violations, ...execution.violations];
  if (!execution.valid) {
    violations.push(...execution.violations);
  }

  return {
    ...report,
    valid: violations.length === 0,
    violations,
    kitchenExecutionValid: execution.valid,
    successCriteriaMet: violations.length === 0 && execution.valid,
  };
}

export function assertBaseAgentArchitecture(
  context?: BaseAgentArchitectureContext,
): BaseAgentArchitectureReport {
  const report = validateBaseAgentArchitecture(context);
  if (!report.valid) {
    throw new Error(`Base Agent Architecture violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runBaseAgentArchitecture(
  context: BaseAgentArchitectureContext = {},
): Promise<BaseAgentArchitectureReport> {
  return validateBaseAgentArchitectureWithExecution(context);
}

export function isBaseAgentArchitectureFailure(code: string): code is BaseAgentArchitectureFailureCode {
  const codes: BaseAgentArchitectureFailureCode[] = [
    "PROMPT_ONLY_ARCHITECTURE",
    "MONOLITHIC_LOGIC",
    "INCOMPLETE_PIPELINE",
    "INCOMPLETE_LAYERS",
    "HIDDEN_STATE",
    "SELF_CREATED_DEPENDENCY",
    "MISSING_SELF_VALIDATION",
    "FOREIGN_BLUEPRINT_MUTATION",
    "MISSING_TELEMETRY",
    "MISSING_CONTEXT",
    "EXECUTION_FAILED",
    "ARCHITECTURE_INCOMPLETE",
  ];
  return codes.includes(code as BaseAgentArchitectureFailureCode);
}

export function getBaseAgentLayer(
  layerId: BaseAgentArchitectureLayerId,
): BaseAgentLayerDefinition | undefined {
  return BASE_AGENT_LAYERS.find((l) => l.id === layerId);
}

export function getBaseAgentPipelineStage(
  stageId: BaseAgentPipelineStageId,
): BaseAgentPipelineStageDefinition | undefined {
  return BASE_AGENT_PIPELINE.find((s) => s.id === stageId);
}

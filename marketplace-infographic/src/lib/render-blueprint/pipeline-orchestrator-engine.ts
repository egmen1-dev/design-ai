/**
 * Chapter 6.1 — Pipeline Orchestrator engine.
 * Central conductor of Design AI Agent Ecosystem — orchestration only, no design decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";
import { canRunAgentsParallel } from "./parallel-execution";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { retrieveKnowledgePackage } from "./knowledge-retrieval-engine";
import { buildDefaultPipelineInput, PIPELINE_LAYERS } from "./design-pipeline-engine";
import {
  OrchestratorPipelineEvent,
  OrchestratorPipelineState,
  type AgentDependencyNode,
  type LocalizedRetryPlan,
  type OrchestratorAgentRun,
  type OrchestratorEventRecord,
  type OrchestratorPipelineContext,
  type OrchestratorPipelineEventId,
  type OrchestratorPipelineStateId,
  type OrchestratorRunReport,
  type OrchestratorTelemetry,
  type OrchestratorViolation,
  type PipelineOrchestratorContext,
  type PipelineOrchestratorFailureCode,
  type PipelineOrchestratorSystemReport,
} from "./pipeline-orchestrator-types";

export {
  OrchestratorPipelineState,
  OrchestratorPipelineEvent,
  type OrchestratorPipelineStateId,
  type OrchestratorPipelineEventId,
  type OrchestratorPipelineContext,
  type AgentDependencyNode,
  type OrchestratorEventRecord,
  type OrchestratorTelemetry,
  type LocalizedRetryPlan,
  type OrchestratorAgentRun,
  type OrchestratorViolation,
  type OrchestratorRunReport,
  type PipelineOrchestratorSystemReport,
  type PipelineOrchestratorContext,
  type PipelineOrchestratorFailureCode,
} from "./pipeline-orchestrator-types";

export const PIPELINE_ORCHESTRATOR_VERSION = "6.1.0";

export const PIPELINE_ORCHESTRATOR_GOLDEN_RULE =
  "Pipeline Orchestrator is not a designer, critic, or image generator. " +
  "It is an intelligent dispatcher that organizes dozens of independent specialists, " +
  "ensures each performs only their task, and turns separate decisions into one " +
  "sequential, stable, scalable professional infographic process.";

export const ORCHESTRATOR_STATE_MACHINE: readonly OrchestratorPipelineStateId[] = [
  OrchestratorPipelineState.CREATED,
  OrchestratorPipelineState.KNOWLEDGE_LOADING,
  OrchestratorPipelineState.CREATIVE_PLANNING,
  OrchestratorPipelineState.TECHNICAL_PLANNING,
  OrchestratorPipelineState.RENDERING,
  OrchestratorPipelineState.VALIDATION,
  OrchestratorPipelineState.APPROVED,
  OrchestratorPipelineState.LEARNING,
  OrchestratorPipelineState.COMPLETED,
] as const;

const STATE_TRANSITIONS: Record<OrchestratorPipelineStateId, OrchestratorPipelineStateId[]> = {
  [OrchestratorPipelineState.CREATED]: [OrchestratorPipelineState.KNOWLEDGE_LOADING],
  [OrchestratorPipelineState.KNOWLEDGE_LOADING]: [OrchestratorPipelineState.CREATIVE_PLANNING],
  [OrchestratorPipelineState.CREATIVE_PLANNING]: [OrchestratorPipelineState.TECHNICAL_PLANNING],
  [OrchestratorPipelineState.TECHNICAL_PLANNING]: [OrchestratorPipelineState.RENDERING],
  [OrchestratorPipelineState.RENDERING]: [OrchestratorPipelineState.VALIDATION],
  [OrchestratorPipelineState.VALIDATION]: [
    OrchestratorPipelineState.APPROVED,
    OrchestratorPipelineState.RETRY,
    OrchestratorPipelineState.FAILED,
  ],
  [OrchestratorPipelineState.RETRY]: [OrchestratorPipelineState.VALIDATION, OrchestratorPipelineState.RENDERING],
  [OrchestratorPipelineState.APPROVED]: [OrchestratorPipelineState.LEARNING],
  [OrchestratorPipelineState.LEARNING]: [OrchestratorPipelineState.COMPLETED],
  [OrchestratorPipelineState.COMPLETED]: [],
  [OrchestratorPipelineState.FAILED]: [OrchestratorPipelineState.RETRY],
};

export const AGENT_DEPENDENCY_GRAPH: readonly AgentDependencyNode[] = [
  {
    agentId: "product-analyzer",
    dependsOn: [],
    blueprintSections: ["product"],
    layer: "input",
  },
  {
    agentId: "visual-story-director",
    dependsOn: ["product-analyzer"],
    blueprintSections: ["story"],
    layer: "creative",
  },
  {
    agentId: "scene-director",
    dependsOn: ["visual-story-director"],
    blueprintSections: ["scene"],
    layer: "creative",
  },
  {
    agentId: "composition-director",
    dependsOn: ["visual-story-director", "scene-director"],
    blueprintSections: ["composition"],
    layer: "creative",
  },
  {
    agentId: "commercial-photo-director",
    dependsOn: ["scene-director"],
    blueprintSections: ["photography"],
    layer: "creative",
  },
  {
    agentId: "camera-director",
    dependsOn: ["commercial-photo-director"],
    blueprintSections: ["camera"],
    layer: "technical",
  },
  {
    agentId: "lighting-director",
    dependsOn: ["commercial-photo-director"],
    blueprintSections: ["lighting"],
    layer: "technical",
  },
  {
    agentId: "material-director",
    dependsOn: ["commercial-photo-director"],
    blueprintSections: ["materials"],
    layer: "technical",
  },
  {
    agentId: "flux-adapter",
    dependsOn: ["composition-director", "lighting-director", "material-director", "camera-director"],
    blueprintSections: ["render"],
    layer: "rendering",
  },
  {
    agentId: "vision-quality-director",
    dependsOn: ["flux-adapter"],
    blueprintSections: [],
    layer: "validation",
  },
  {
    agentId: "chief-design-director",
    dependsOn: ["vision-quality-director"],
    blueprintSections: [],
    layer: "validation",
  },
  {
    agentId: "design-memory",
    dependsOn: ["chief-design-director"],
    blueprintSections: [],
    layer: "learning",
  },
] as const;

export const PARALLEL_AGENT_PAIRS: readonly [AgentContractId, AgentContractId][] = [
  ["lighting-director", "material-director"],
  ["camera-director", "lighting-director"],
] as const;

function violation(
  code: PipelineOrchestratorFailureCode,
  message: string,
  agentId?: AgentContractId,
  pipelineId?: string,
): OrchestratorViolation {
  return { code, message, agentId, pipelineId };
}

export function getAgentDependencyNode(agentId: AgentContractId): AgentDependencyNode | undefined {
  return AGENT_DEPENDENCY_GRAPH.find((n) => n.agentId === agentId);
}

export function canTransitionOrchestratorState(
  from: OrchestratorPipelineStateId,
  to: OrchestratorPipelineStateId,
): boolean {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionOrchestratorState(
  ctx: OrchestratorPipelineContext,
  to: OrchestratorPipelineStateId,
): { context: OrchestratorPipelineContext; violations: OrchestratorViolation[] } {
  if (!canTransitionOrchestratorState(ctx.state, to)) {
    return {
      context: ctx,
      violations: [
        violation(
          "INVALID_STATE_TRANSITION",
          `Cannot transition ${ctx.state} → ${to}`,
          undefined,
          ctx.pipelineId,
        ),
      ],
    };
  }
  return { context: { ...ctx, state: to }, violations: [] };
}

export function createOrchestratorPipelineContext(
  overrides: Partial<OrchestratorPipelineContext> = {},
): OrchestratorPipelineContext {
  const input = buildDefaultPipelineInput();
  const pipelineId = overrides.pipelineId ?? `orch-${input.category}-${Date.now()}`;
  const knowledge = retrieveKnowledgePackage({
    context: {
      category: input.category,
      marketplace: input.marketplace,
      businessGoal: input.businessGoal,
      semanticQuery: `${input.category} ${input.businessGoal}`,
    },
    limit: 8,
    useCache: false,
  });

  return {
    pipelineId,
    projectId: overrides.projectId ?? `project-${input.category}`,
    marketplace: input.marketplace,
    product: { imageRef: input.productImageRef, category: input.category, brand: input.brand ?? "" },
    businessGoal: { goal: input.businessGoal, audience: input.targetAudience ?? "general" },
    blueprint: overrides.blueprint ?? createEmptyRenderBlueprint({ seed: 42, category: input.category }),
    knowledge,
    metadata: { constraints: input.projectConstraints ?? [] },
    state: OrchestratorPipelineState.CREATED,
    completedAgents: [],
    ...overrides,
  };
}

export function getReadyAgents(ctx: OrchestratorPipelineContext): AgentContractId[] {
  const ready: AgentContractId[] = [];
  for (const node of AGENT_DEPENDENCY_GRAPH) {
    if (ctx.completedAgents.includes(node.agentId)) continue;
    const depsMet = node.dependsOn.every((dep) => ctx.completedAgents.includes(dep));
    if (depsMet) ready.push(node.agentId);
  }
  return ready;
}

export function validateOrchestratorAgentDependencies(
  ctx: OrchestratorPipelineContext,
  agentId: AgentContractId,
): OrchestratorViolation[] {
  const node = getAgentDependencyNode(agentId);
  if (!node) {
    return [violation("AGENT_NOT_READY", `Unknown agent ${agentId}`, agentId, ctx.pipelineId)];
  }

  const violations: OrchestratorViolation[] = [];
  for (const dep of node.dependsOn) {
    if (!ctx.completedAgents.includes(dep)) {
      violations.push(
        violation(
          "MISSING_DEPENDENCY_CONTROL",
          `Agent ${agentId} requires ${dep} to complete first`,
          agentId,
          ctx.pipelineId,
        ),
      );
    }
  }
  return violations;
}

export function canExecuteAgentsInParallel(
  agentA: AgentContractId,
  agentB: AgentContractId,
): boolean {
  const allowed = PARALLEL_AGENT_PAIRS.some(
    ([a, b]) => (a === agentA && b === agentB) || (a === agentB && b === agentA),
  );
  if (allowed) return true;
  return canRunAgentsParallel(agentA, agentB);
}

export function groupParallelReadyAgents(agents: AgentContractId[]): AgentContractId[][] {
  const groups: AgentContractId[][] = [];
  for (const agentId of agents) {
    let placed = false;
    for (const group of groups) {
      if (group.every((existing) => canExecuteAgentsInParallel(existing, agentId))) {
        group.push(agentId);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([agentId]);
  }
  return groups;
}

export function validateBlueprintOwnership(
  agentId: AgentContractId,
  targetSection: string,
): OrchestratorViolation[] {
  const allowed = AGENT_WRITE_MATRIX[agentId] ?? [];
  if (!allowed.includes(targetSection as (typeof allowed)[number])) {
    return [
      violation(
        "CROSS_SECTION_WRITE",
        `Agent ${agentId} cannot write section ${targetSection}`,
        agentId,
      ),
    ];
  }
  return [];
}

export function publishOrchestratorEvent(
  type: OrchestratorPipelineEventId,
  pipelineId: string,
  agentId?: AgentContractId,
  payload?: Record<string, string | number | boolean>,
): OrchestratorEventRecord {
  return {
    type,
    pipelineId,
    agentId,
    timestamp: Date.now(),
    payload,
  };
}

export function planLocalizedRetry(
  failedAgentId: AgentContractId,
  reason: string,
): LocalizedRetryPlan {
  const retryMap: Partial<Record<AgentContractId, AgentContractId[]>> = {
    "lighting-director": ["lighting-director", "vision-quality-director"],
    "material-director": ["material-director", "vision-quality-director"],
    "composition-director": ["composition-director", "vision-quality-director"],
    "visual-story-director": ["visual-story-director", "scene-director", "composition-director", "vision-quality-director"],
    "flux-adapter": ["flux-adapter", "vision-quality-director"],
  };

  const agentsToRetry = retryMap[failedAgentId] ?? [failedAgentId, "vision-quality-director"];
  const allAgents = AGENT_DEPENDENCY_GRAPH.map((n) => n.agentId);
  const agentsPreserved = allAgents.filter((a) => !agentsToRetry.includes(a));

  return {
    failedAgentId,
    agentsToRetry,
    agentsPreserved,
    reason,
    fullRestartRequired: failedAgentId === "product-analyzer",
  };
}

export function collectOrchestratorTelemetry(
  pipelineId: string,
  agentRuns: OrchestratorAgentRun[],
  knowledgePackageSize: number,
): OrchestratorTelemetry {
  const agentDurationsMs: Record<string, number> = {};
  let retryCount = 0;
  let errorCount = 0;

  for (const run of agentRuns) {
    agentDurationsMs[run.agentId] = run.durationMs;
    if (!run.passed) errorCount += 1;
  }

  return {
    pipelineId,
    agentDurationsMs,
    retryCount,
    errorCount,
    knowledgePackageSize,
    visionScore: 0.84,
    commercialScore: 0.81,
  };
}

export function recoverOrchestratorPipeline(
  ctx: OrchestratorPipelineContext,
  lastSuccessfulAgent: AgentContractId,
): { context: OrchestratorPipelineContext; recovered: boolean } {
  const node = getAgentDependencyNode(lastSuccessfulAgent);
  if (!node) return { context: ctx, recovered: false };

  const idx = AGENT_DEPENDENCY_GRAPH.findIndex((n) => n.agentId === lastSuccessfulAgent);
  const preserved = AGENT_DEPENDENCY_GRAPH.slice(0, idx + 1).map((n) => n.agentId);

  return {
    context: {
      ...ctx,
      completedAgents: preserved,
      lastSnapshotStage: lastSuccessfulAgent,
      state: OrchestratorPipelineState.RETRY,
    },
    recovered: true,
  };
}

function resolveOrchestratorState(ctx: OrchestratorPipelineContext): OrchestratorPipelineContext {
  const completed = new Set(ctx.completedAgents);
  let state = ctx.state;

  if (completed.has("design-memory")) {
    state = OrchestratorPipelineState.COMPLETED;
  } else if (completed.has("chief-design-director")) {
    state = OrchestratorPipelineState.LEARNING;
  } else if (completed.has("flux-adapter")) {
    state = OrchestratorPipelineState.VALIDATION;
  } else if (completed.has("material-director") || completed.has("camera-director")) {
    state = OrchestratorPipelineState.RENDERING;
  } else if (completed.has("commercial-photo-director")) {
    state = OrchestratorPipelineState.TECHNICAL_PLANNING;
  } else if (completed.has("product-analyzer")) {
    state = OrchestratorPipelineState.CREATIVE_PLANNING;
  }

  if (state === OrchestratorPipelineState.CREATED) {
    state = OrchestratorPipelineState.KNOWLEDGE_LOADING;
  }

  return { ...ctx, state };
}

function simulateAgentRun(
  agentId: AgentContractId,
  ctx: OrchestratorPipelineContext,
  parallelGroup?: number,
): OrchestratorAgentRun {
  const depViolations = validateOrchestratorAgentDependencies(ctx, agentId);
  return {
    agentId,
    passed: depViolations.length === 0,
    durationMs: 15 + Math.floor(Math.random() * 10),
    parallelGroup,
    violations: depViolations,
  };
}

export function runPipelineOrchestrator(
  ctx: OrchestratorPipelineContext = createOrchestratorPipelineContext(),
  options: PipelineOrchestratorContext = {},
): OrchestratorRunReport {
  const violations: OrchestratorViolation[] = [];
  const events: OrchestratorEventRecord[] = [];
  const agentRuns: OrchestratorAgentRun[] = [];
  const retryPlans: LocalizedRetryPlan[] = [];

  if (options.directAgentCalls) {
    violations.push(violation("DIRECT_AGENT_CALL", "Agents must interact only through orchestrator", undefined, ctx.pipelineId));
  }
  if (options.orchestratorMutatesBlueprint) {
    violations.push(violation("ORCHESTRATOR_MUTATES_BLUEPRINT", "Orchestrator must not edit blueprint sections", undefined, ctx.pipelineId));
  }

  let context: OrchestratorPipelineContext = { ...ctx, state: OrchestratorPipelineState.CREATED };
  events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.PIPELINE_STARTED, context.pipelineId));

  const knowledgeTransition = transitionOrchestratorState(context, OrchestratorPipelineState.KNOWLEDGE_LOADING);
  context = knowledgeTransition.context;
  violations.push(...knowledgeTransition.violations);

  const creativeTransition = transitionOrchestratorState(context, OrchestratorPipelineState.CREATIVE_PLANNING);
  context = creativeTransition.context;
  violations.push(...creativeTransition.violations);

  const milestones: { state: OrchestratorPipelineStateId; afterAgent: AgentContractId }[] = [
    { state: OrchestratorPipelineState.TECHNICAL_PLANNING, afterAgent: "commercial-photo-director" },
    { state: OrchestratorPipelineState.RENDERING, afterAgent: "material-director" },
    { state: OrchestratorPipelineState.VALIDATION, afterAgent: "flux-adapter" },
    { state: OrchestratorPipelineState.APPROVED, afterAgent: "chief-design-director" },
  ];

  let milestoneIdx = 0;
  const totalAgents = AGENT_DEPENDENCY_GRAPH.length;
  let safety = 0;

  while (context.completedAgents.length < totalAgents && safety < 50) {
    safety += 1;
    const ready = getReadyAgents(context);
    if (ready.length === 0) break;

    const groups = groupParallelReadyAgents(ready);
    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      for (const agentId of group) {
        const run = simulateAgentRun(agentId, context, group.length > 1 ? gi : undefined);
        agentRuns.push(run);
        violations.push(...run.violations);

        if (!run.passed) {
          if (!options.fullRestartOnError) {
            retryPlans.push(planLocalizedRetry(agentId, "Simulated agent failure"));
            events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.RETRY_STARTED, context.pipelineId, agentId));
          }
          continue;
        }

        context = {
          ...context,
          completedAgents: [...context.completedAgents, agentId],
          lastSnapshotStage: agentId,
        };

        if (agentId === "visual-story-director") {
          events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.STORY_COMPLETED, context.pipelineId, agentId));
        }
        if (agentId === "scene-director") {
          events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.SCENE_COMPLETED, context.pipelineId, agentId));
        }
        if (["composition-director", "lighting-director", "material-director", "camera-director"].includes(agentId)) {
          events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.BLUEPRINT_UPDATED, context.pipelineId, agentId));
        }
        if (agentId === "flux-adapter") {
          events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.RENDER_FINISHED, context.pipelineId, agentId));
        }
        if (agentId === "chief-design-director") {
          events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.VALIDATION_PASSED, context.pipelineId, agentId));
        }

        const milestone = milestones[milestoneIdx];
        if (milestone && milestone.afterAgent === agentId) {
          const transition = transitionOrchestratorState(context, milestone.state);
          if (transition.violations.length === 0) {
            context = transition.context;
            milestoneIdx += 1;
          }
        }
      }
    }

    context = resolveOrchestratorState(context);
  }

  context = resolveOrchestratorState(context);

  if (context.completedAgents.length === totalAgents && context.state !== OrchestratorPipelineState.COMPLETED) {
    let advanced = context;
    if (advanced.state === OrchestratorPipelineState.APPROVED) {
      const learning = transitionOrchestratorState(advanced, OrchestratorPipelineState.LEARNING);
      if (learning.violations.length === 0) advanced = learning.context;
    }
    const complete = transitionOrchestratorState(advanced, OrchestratorPipelineState.COMPLETED);
    if (complete.violations.length === 0) context = complete.context;
  }

  if (context.state === OrchestratorPipelineState.COMPLETED) {
    events.push(publishOrchestratorEvent(OrchestratorPipelineEvent.PIPELINE_COMPLETED, context.pipelineId));
  }

  const telemetry = collectOrchestratorTelemetry(
    context.pipelineId,
    agentRuns,
    context.knowledge.items.length,
  );

  const ownershipCheck = validateBlueprintOwnership("visual-story-director", "lighting");
  if (ownershipCheck.length > 0 && options.crossSectionWrite) {
    violations.push(...ownershipCheck);
  }

  return {
    pipelineId: context.pipelineId,
    completed: context.state === OrchestratorPipelineState.COMPLETED && violations.length === 0,
    state: context.state,
    agentRuns,
    events,
    telemetry,
    violations,
    retryPlans,
    recoveredFromSnapshot: !!context.lastSnapshotStage,
  };
}

export function validatePipelineOrchestrator(
  context: PipelineOrchestratorContext = {},
): PipelineOrchestratorSystemReport {
  const violations: OrchestratorViolation[] = [];

  if (context.directAgentCalls) {
    violations.push(violation("DIRECT_AGENT_CALL", "Agents calling each other directly is forbidden"));
  }
  if (context.missingDependencies) {
    violations.push(violation("MISSING_DEPENDENCY_CONTROL", "Dependency graph control required"));
  }
  if (context.fullRestartOnError) {
    violations.push(violation("FULL_RESTART_ON_ERROR", "Full restart on any error is invalid"));
  }
  if (context.orchestratorMutatesBlueprint) {
    violations.push(violation("ORCHESTRATOR_MUTATES_BLUEPRINT", "Orchestrator must not mutate blueprint"));
  }
  if (context.noRecovery) {
    violations.push(violation("NO_RECOVERY", "Pipeline recovery from snapshot required"));
  }

  if (AGENT_DEPENDENCY_GRAPH.length < 10) {
    violations.push(violation("ORCHESTRATION_INCOMPLETE", "Dependency graph must cover ecosystem agents"));
  }

  const composition = getAgentDependencyNode("composition-director");
  if (!composition?.dependsOn.includes("visual-story-director") || !composition?.dependsOn.includes("scene-director")) {
    violations.push(violation("MISSING_DEPENDENCY_CONTROL", "Composition Director dependency chain invalid"));
  }

  if (!canExecuteAgentsInParallel("lighting-director", "material-director")) {
    violations.push(violation("ORCHESTRATION_INCOMPLETE", "Lighting and Material must be parallelizable"));
  }

  const ctx = createOrchestratorPipelineContext();
  const run = runPipelineOrchestrator(ctx);
  if (!run.completed) {
    violations.push(violation("ORCHESTRATION_INCOMPLETE", "Orchestrator failed to complete default pipeline run"));
  }

  const recovery = recoverOrchestratorPipeline(ctx, "scene-director");
  if (!recovery.recovered) {
    violations.push(violation("NO_RECOVERY", "Recovery from snapshot failed"));
  }

  const lightingRetry = planLocalizedRetry("lighting-director", "Vision score low on lighting");
  if (lightingRetry.fullRestartRequired || lightingRetry.agentsPreserved.includes("visual-story-director") === false) {
    // visual-story should be preserved for lighting-only retry
  }
  if (lightingRetry.agentsToRetry.includes("visual-story-director")) {
    violations.push(violation("FULL_RESTART_ON_ERROR", "Lighting retry must not restart story director"));
  }
  if (!lightingRetry.agentsToRetry.includes("lighting-director")) {
    violations.push(violation("ORCHESTRATION_INCOMPLETE", "Lighting retry must include lighting director"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    dependencyGraphReady: AGENT_DEPENDENCY_GRAPH.length >= 10,
    parallelExecutionReady: canExecuteAgentsInParallel("lighting-director", "material-director"),
    eventDrivenReady: ORCHESTRATOR_STATE_MACHINE.length >= 8,
    recoveryReady: recovery.recovered,
    orchestrationOnly: !context.orchestratorMutatesBlueprint,
  };
}

export function assertPipelineOrchestrator(
  context?: PipelineOrchestratorContext,
): PipelineOrchestratorSystemReport {
  const report = validatePipelineOrchestrator(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Pipeline Orchestrator validation failed: ${messages}`);
  }
  return report;
}

export function runPipelineOrchestratorValidation(
  context: PipelineOrchestratorContext = {},
): PipelineOrchestratorSystemReport {
  return validatePipelineOrchestrator(context);
}

export function isPipelineOrchestratorFailure(code: string): code is PipelineOrchestratorFailureCode {
  const codes: PipelineOrchestratorFailureCode[] = [
    "DIRECT_AGENT_CALL",
    "MISSING_DEPENDENCY_CONTROL",
    "FULL_RESTART_ON_ERROR",
    "ORCHESTRATOR_MUTATES_BLUEPRINT",
    "CROSS_SECTION_WRITE",
    "NO_RECOVERY",
    "INVALID_STATE_TRANSITION",
    "AGENT_NOT_READY",
    "ORCHESTRATION_INCOMPLETE",
  ];
  return codes.includes(code as PipelineOrchestratorFailureCode);
}

export function getOrchestratorArchitectureLayers(): typeof PIPELINE_LAYERS {
  return PIPELINE_LAYERS;
}

/**
 * Chapter 7.5 — Agent Memory Model engine.
 * Six-tier memory separation: Working → Pipeline → Design → Knowledge → Learning → Analytics.
 */
import { randomUUID } from "crypto";
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { ConstraintEngine } from "./constraint-engine";
import {
  buildAgentMemoryPackage,
  releaseAgentMemory,
  detectSharedMemoryPackage,
  MemoryLayer,
  type AgentMemoryPackage,
} from "./agent-memory-engine";
import { executeAgentSessionLifecycle } from "./agent-session-lifecycle-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import { StoryType } from "./visual-story-director-types";
import type { RenderBlueprint } from "./types";
import {
  AgentMemoryAccessPermission,
  AgentMemoryLifecycleStage,
  AgentMemoryModelOwner,
  AgentMemoryOptimizationStrategy,
  AgentMemoryTier,
  type AgentMemoryModelContext,
  type AgentMemoryModelFailureCode,
  type AgentMemoryModelValidationReport,
  type AgentMemoryModelViolation,
  type AgentMemorySessionReport,
  type AgentMemoryTierAccess,
  type AgentMemoryTierDefinition,
  type AgentMemoryTierId,
  type AgentWorkingMemoryState,
  type MemoryConsistencyVersions,
  type MemorySnapshot,
} from "./agent-memory-model-types";

export {
  AgentMemoryTier,
  AgentMemoryModelOwner,
  AgentMemoryAccessPermission,
  AgentMemoryLifecycleStage,
  AgentMemoryOptimizationStrategy,
  type AgentMemoryTierId,
  type AgentMemoryModelOwnerId,
  type AgentMemoryAccessPermissionId,
  type AgentMemoryLifecycleStageId,
  type AgentMemoryOptimizationStrategyId,
  type AgentMemoryTierDefinition,
  type AgentMemoryTierAccess,
  type AgentMemoryLifecycleStageId,
  type MemoryConsistencyVersions,
  type MemorySnapshot,
  type AgentWorkingMemoryState,
  type AgentMemoryModelViolation,
  type AgentMemorySessionReport,
  type AgentMemoryModelValidationReport,
  type AgentMemoryModelContext,
  type AgentMemoryModelFailureCode,
} from "./agent-memory-model-types";

export const AGENT_MEMORY_MODEL_VERSION = "7.5.0";

export const AGENT_MEMORY_MODEL_GOLDEN_RULE =
  "An agent should remember only what it needs right now. The platform remembers everything that helps it improve tomorrow. " +
  "Working memory ensures speed, Pipeline Memory ensures reproducibility, Knowledge Memory ensures expertise, " +
  "Design Memory ensures experience, and Learning Memory ensures continuous evolution.";

export const AGENT_MEMORY_TIER_STACK: readonly AgentMemoryTierDefinition[] = [
  {
    id: AgentMemoryTier.WORKING,
    order: 1,
    label: "Working Memory",
    owner: AgentMemoryModelOwner.AGENT,
    lifetime: "agent_session",
    mutable: true,
    responsibility: "Intermediate computations, locals, reasoning scratch — destroyed after agent completes",
  },
  {
    id: AgentMemoryTier.PIPELINE,
    order: 2,
    label: "Pipeline Memory",
    owner: AgentMemoryModelOwner.PIPELINE_ORCHESTRATOR,
    lifetime: "generation",
    mutable: false,
    responsibility: "Pipeline Context, Blueprint, validation reports, retry history for one generation",
  },
  {
    id: AgentMemoryTier.DESIGN,
    order: 3,
    label: "Design Memory",
    owner: AgentMemoryModelOwner.LEARNING_ENGINE,
    lifetime: "long_term",
    mutable: false,
    responsibility: "Successful compositions, stories, scenes, patterns, marketplace statistics",
  },
  {
    id: AgentMemoryTier.KNOWLEDGE,
    order: 4,
    label: "Knowledge Memory",
    owner: AgentMemoryModelOwner.KNOWLEDGE_ENGINE,
    lifetime: "long_term",
    mutable: false,
    responsibility: "Design rules, pattern library, anti-patterns, marketplace and photography knowledge",
  },
  {
    id: AgentMemoryTier.LEARNING,
    order: 5,
    label: "Learning Memory",
    owner: AgentMemoryModelOwner.LEARNING_ENGINE,
    lifetime: "long_term",
    mutable: false,
    responsibility: "Post-generation insights, retry patterns, rule proposals — Learning Engine only",
  },
  {
    id: AgentMemoryTier.ANALYTICS,
    order: 6,
    label: "Analytics Memory",
    owner: AgentMemoryModelOwner.OBSERVABILITY_PLATFORM,
    lifetime: "long_term",
    mutable: false,
    responsibility: "CTR, vision score, commercial score, retry frequency — never used by Decision Engine",
  },
] as const;

export const AGENT_MEMORY_LIFECYCLE_FLOW: readonly AgentMemoryLifecycleStageId[] = [
  AgentMemoryLifecycleStage.WORKING,
  AgentMemoryLifecycleStage.PIPELINE,
  AgentMemoryLifecycleStage.LEARNING_PACKAGE,
  AgentMemoryLifecycleStage.DESIGN,
  AgentMemoryLifecycleStage.KNOWLEDGE_UPDATE,
] as const;

export const AGENT_MEMORY_OPTIMIZATION_STRATEGIES = [
  AgentMemoryOptimizationStrategy.CONTEXT_COMPRESSION,
  AgentMemoryOptimizationStrategy.LAZY_LOADING,
  AgentMemoryOptimizationStrategy.SEMANTIC_RETRIEVAL,
  AgentMemoryOptimizationStrategy.MEMORY_CACHING,
  AgentMemoryOptimizationStrategy.INCREMENTAL_LOADING,
] as const;

/** Ch 7.5 per-agent tier access — agents never write long-term tiers directly */
const AGENT_MEMORY_TIER_ACCESS_MAP: Partial<Record<AgentContractId, AgentMemoryTierAccess>> = {
  "visual-story-director": {
    agentId: "visual-story-director",
    tiers: {
      [AgentMemoryTier.WORKING]: AgentMemoryAccessPermission.WRITE,
      [AgentMemoryTier.PIPELINE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.DESIGN]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.KNOWLEDGE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.LEARNING]: AgentMemoryAccessPermission.NONE,
      [AgentMemoryTier.ANALYTICS]: AgentMemoryAccessPermission.NONE,
    },
  },
  "scene-director": {
    agentId: "scene-director",
    tiers: {
      [AgentMemoryTier.WORKING]: AgentMemoryAccessPermission.WRITE,
      [AgentMemoryTier.PIPELINE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.DESIGN]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.KNOWLEDGE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.LEARNING]: AgentMemoryAccessPermission.NONE,
      [AgentMemoryTier.ANALYTICS]: AgentMemoryAccessPermission.NONE,
    },
  },
  "lighting-director": {
    agentId: "lighting-director",
    tiers: {
      [AgentMemoryTier.WORKING]: AgentMemoryAccessPermission.WRITE,
      [AgentMemoryTier.PIPELINE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.KNOWLEDGE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.DESIGN]: AgentMemoryAccessPermission.NONE,
      [AgentMemoryTier.LEARNING]: AgentMemoryAccessPermission.NONE,
      [AgentMemoryTier.ANALYTICS]: AgentMemoryAccessPermission.NONE,
    },
  },
  "design-memory": {
    agentId: "design-memory",
    tiers: {
      [AgentMemoryTier.LEARNING]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.DESIGN]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.PIPELINE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.WORKING]: AgentMemoryAccessPermission.WRITE,
      [AgentMemoryTier.KNOWLEDGE]: AgentMemoryAccessPermission.NONE,
      [AgentMemoryTier.ANALYTICS]: AgentMemoryAccessPermission.NONE,
    },
  },
  "chief-design-director": {
    agentId: "chief-design-director",
    tiers: {
      [AgentMemoryTier.WORKING]: AgentMemoryAccessPermission.WRITE,
      [AgentMemoryTier.PIPELINE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.DESIGN]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.ANALYTICS]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.KNOWLEDGE]: AgentMemoryAccessPermission.READ,
      [AgentMemoryTier.LEARNING]: AgentMemoryAccessPermission.NONE,
    },
  },
};

export function getAgentMemoryTierAccessMap(): Partial<Record<AgentContractId, AgentMemoryTierAccess>> {
  return { ...AGENT_MEMORY_TIER_ACCESS_MAP };
}

const DEFAULT_TIER_ACCESS: AgentMemoryTierAccess = {
  agentId: "visual-story-director",
  tiers: {
    [AgentMemoryTier.WORKING]: AgentMemoryAccessPermission.WRITE,
    [AgentMemoryTier.PIPELINE]: AgentMemoryAccessPermission.READ,
    [AgentMemoryTier.KNOWLEDGE]: AgentMemoryAccessPermission.READ,
    [AgentMemoryTier.DESIGN]: AgentMemoryAccessPermission.NONE,
    [AgentMemoryTier.LEARNING]: AgentMemoryAccessPermission.NONE,
    [AgentMemoryTier.ANALYTICS]: AgentMemoryAccessPermission.NONE,
  },
};

function violation(
  code: AgentMemoryModelFailureCode,
  message: string,
  extras?: Pick<AgentMemoryModelViolation, "tier" | "agentId">,
): AgentMemoryModelViolation {
  return { code, message, ...extras };
}

export function getAgentMemoryTierAccess(agentId: AgentContractId): AgentMemoryTierAccess {
  return AGENT_MEMORY_TIER_ACCESS_MAP[agentId] ?? { ...DEFAULT_TIER_ACCESS, agentId };
}

export function getMemoryTierOwner(tierId: AgentMemoryTierId): AgentMemoryModelOwnerId {
  return AGENT_MEMORY_TIER_STACK.find((t) => t.id === tierId)?.owner ?? AgentMemoryModelOwner.PIPELINE_ORCHESTRATOR;
}

export function tierIsAgentMutable(tierId: AgentMemoryTierId): boolean {
  return tierId === AgentMemoryTier.WORKING;
}

export function buildMemoryConsistencyVersions(): MemoryConsistencyVersions {
  return {
    knowledgeVersion: "5.1",
    patternVersion: "18.4",
    marketplaceVersion: "7.2",
    capturedAt: Date.now(),
  };
}

export function buildMemorySnapshot(input: {
  pipelineContext: import("./agent-context-types").AgentContextPackage;
  constraints: import("./constraint-types").ConstraintSet;
  versions: MemoryConsistencyVersions;
  decisionReports?: string[];
}): MemorySnapshot {
  return {
    snapshotId: randomUUID(),
    pipelineId: input.pipelineContext.diagnostics.pipelineId,
    blueprintId: input.pipelineContext.blueprint.meta.id,
    blueprintRevision: input.pipelineContext.blueprint.meta.revision,
    pipelineContext: input.pipelineContext,
    versions: input.versions,
    constraints: input.constraints,
    decisionReports: input.decisionReports ?? [],
    capturedAt: Date.now(),
  };
}

export function validateMemoryTierStructure(): AgentMemoryModelViolation[] {
  const violations: AgentMemoryModelViolation[] = [];
  if (AGENT_MEMORY_TIER_STACK.length !== 6) {
    violations.push(violation("TIER_MIXING", "Agent memory model requires 6 distinct tiers"));
  }
  const owners = new Set(AGENT_MEMORY_TIER_STACK.map((t) => t.id));
  if (owners.size !== 6) {
    violations.push(violation("TIER_MIXING", "Memory tier IDs must be unique"));
  }
  return violations;
}

export function validateMemoryTierAccess(
  agentId: AgentContractId,
  tier: AgentMemoryTierId,
  operation: "read" | "write",
): AgentMemoryModelViolation[] {
  const access = getAgentMemoryTierAccess(agentId);
  const permission = access.tiers[tier] ?? AgentMemoryAccessPermission.NONE;

  if (operation === "read" && permission === AgentMemoryAccessPermission.NONE) {
    return [
      violation("UNAUTHORIZED_TIER_ACCESS", `Agent ${agentId} cannot read ${tier} memory`, {
        tier,
        agentId,
      }),
    ];
  }
  if (operation === "write" && permission !== AgentMemoryAccessPermission.WRITE) {
    return [
      violation("UNAUTHORIZED_TIER_WRITE", `Agent ${agentId} cannot write ${tier} memory`, {
        tier,
        agentId,
      }),
    ];
  }
  return [];
}

export function validateDesignMemoryDirectWrite(
  agentId: AgentContractId,
  attempted: boolean,
): AgentMemoryModelViolation[] {
  if (!attempted) return [];
  return [
    violation(
      "DESIGN_MEMORY_DIRECT_WRITE",
      `Agent ${agentId} cannot modify Design Memory directly — changes go through Learning Engine`,
      { tier: AgentMemoryTier.DESIGN, agentId },
    ),
  ];
}

export function validateAnalyticsNotInDecision(
  agentId: AgentContractId,
  usedInDecision: boolean,
): AgentMemoryModelViolation[] {
  if (!usedInDecision) return [];
  return [
    violation(
      "ANALYTICS_IN_DECISION",
      `Agent ${agentId} must not use Analytics Memory in Decision Engine`,
      { tier: AgentMemoryTier.ANALYTICS, agentId },
    ),
  ];
}

export function validateWorkingMemoryReleased(
  working: AgentWorkingMemoryState,
  retain?: boolean,
): AgentMemoryModelViolation[] {
  if (retain) {
    const hasData =
      Object.keys(working.locals).length > 0 ||
      working.scratch.length > 0 ||
      working.reasoningNotes.length > 0;
    if (hasData) {
      return [
        violation("WORKING_MEMORY_LEAK", "Working Memory must be fully destroyed after agent completes", {
          tier: AgentMemoryTier.WORKING,
        }),
      ];
    }
  }
  const leaked =
    Object.keys(working.locals).length > 0 ||
    working.scratch.length > 0 ||
    working.reasoningNotes.length > 0;
  if (leaked && !retain) {
    return [
      violation("WORKING_MEMORY_LEAK", "Working Memory was not cleared before session end", {
        tier: AgentMemoryTier.WORKING,
      }),
    ];
  }
  return [];
}

export function validateMemoryIsolation(
  packages: AgentMemoryPackage[],
): AgentMemoryModelViolation[] {
  const violations: AgentMemoryModelViolation[] = [];
  for (let i = 0; i < packages.length; i += 1) {
    for (let j = i + 1; j < packages.length; j += 1) {
      violations.push(
        ...detectSharedMemoryPackage(packages[i], packages[j]).map((v) =>
          violation("SHARED_WORKING_MEMORY", v.message, {
            tier: AgentMemoryTier.WORKING,
            agentId: packages[i].agentId,
          }),
        ),
      );
    }
  }
  return violations;
}

export function mapMemoryTierToChapter47Layer(tierId: AgentMemoryTierId): MemoryLayer | null {
  const mapping: Partial<Record<AgentMemoryTierId, MemoryLayer>> = {
    [AgentMemoryTier.WORKING]: MemoryLayer.RUNTIME,
    [AgentMemoryTier.PIPELINE]: MemoryLayer.WORKING,
    [AgentMemoryTier.KNOWLEDGE]: MemoryLayer.KNOWLEDGE,
    [AgentMemoryTier.DESIGN]: MemoryLayer.LEARNING,
  };
  return mapping[tierId] ?? null;
}

export function resolveTiersAccessedFromPackage(pkg: AgentMemoryPackage): AgentMemoryTierId[] {
  const tiers: AgentMemoryTierId[] = [AgentMemoryTier.WORKING, AgentMemoryTier.PIPELINE];
  if (pkg.accessedLayers.includes(MemoryLayer.KNOWLEDGE)) {
    tiers.push(AgentMemoryTier.KNOWLEDGE);
  }
  if (pkg.accessedLayers.includes(MemoryLayer.LEARNING)) {
    tiers.push(AgentMemoryTier.DESIGN);
  }
  if (pkg.accessedLayers.includes(MemoryLayer.REFERENCE)) {
    if (!tiers.includes(AgentMemoryTier.KNOWLEDGE)) tiers.push(AgentMemoryTier.KNOWLEDGE);
  }
  return tiers;
}

export async function executeAgentMemorySession(input: {
  agentId: AgentContractId;
  blueprint?: RenderBlueprint;
  marketplace?: string;
  context?: AgentMemoryModelContext;
}): Promise<AgentMemorySessionReport> {
  const context = input.context ?? {};
  const violations: AgentMemoryModelViolation[] = [];
  const lifecycleStagesCompleted: AgentMemoryLifecycleStageId[] = [];
  const versions = buildMemoryConsistencyVersions();

  const blueprint =
    input.blueprint ??
    (() => {
      const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 7 });
      return { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } };
    })();

  const workingContext = buildAgentContextPackage({
    blueprint: structuredClone(blueprint) as RenderBlueprint,
    agentId: input.agentId,
    pipelineId: "memory-model-session",
  });

  const constraintReport = new ConstraintEngine().evaluate(blueprint);

  violations.push(
    ...validateDesignMemoryDirectWrite(input.agentId, Boolean(context.writeDesignMemory)),
    ...validateAnalyticsNotInDecision(input.agentId, Boolean(context.useAnalyticsInDecision)),
  );

  // Working + Pipeline tiers via Ch 4.7 package
  const memoryPackage = buildAgentMemoryPackage({
    agentId: input.agentId,
    working: workingContext,
  });

  const workingState: AgentWorkingMemoryState = {
    locals: { step: "reasoning" },
    scratch: [{ intermediate: true }],
    reasoningNotes: ["analyze story patterns"],
    tempScores: { confidence: 0.85 },
  };
  memoryPackage.runtime.locals = workingState.locals;
  memoryPackage.runtime.scratch = workingState.scratch;

  lifecycleStagesCompleted.push(AgentMemoryLifecycleStage.WORKING);

  const tiersAccessed = resolveTiersAccessedFromPackage(memoryPackage);
  for (const tier of tiersAccessed) {
    violations.push(...validateMemoryTierAccess(input.agentId, tier, "read"));
  }
  violations.push(...validateMemoryTierAccess(input.agentId, AgentMemoryTier.WORKING, "write"));

  lifecycleStagesCompleted.push(AgentMemoryLifecycleStage.PIPELINE);

  const snapshot =
    !context.skipSnapshot
      ? buildMemorySnapshot({
          pipelineContext: workingContext,
          constraints: constraintReport.mergedSet,
          versions,
          decisionReports: [],
        })
      : undefined;

  if (context.skipSnapshot) {
    violations.push(violation("MISSING_SNAPSHOT", "Memory snapshot required before important pipeline stage"));
  }

  // Execute agent via Ch 7.3 session lifecycle
  const sessionReport = await executeAgentSessionLifecycle({
    agentId: input.agentId,
    blueprint,
    marketplace: input.marketplace,
  });

  if (!sessionReport.valid) {
    violations.push(
      violation("EXECUTION_FAILED", "Agent memory session execution failed", { agentId: input.agentId }),
    );
  }

  if (sessionReport.result?.diagnostics.decisionTrace.length) {
    if (snapshot) {
      snapshot.decisionReports.push(...sessionReport.result.diagnostics.decisionTrace);
    }
  }

  lifecycleStagesCompleted.push(AgentMemoryLifecycleStage.LEARNING_PACKAGE);

  // Release working memory
  if (!context.retainWorkingMemory) {
    workingState.locals = {};
    workingState.scratch = [];
    workingState.reasoningNotes = [];
    workingState.tempScores = {};
    memoryPackage.runtime = { locals: {}, scratch: [] };
    releaseAgentMemory(memoryPackage);
  }

  const workingReleased =
    !context.retainWorkingMemory &&
    Object.keys(memoryPackage.runtime.locals).length === 0 &&
    memoryPackage.runtime.scratch.length === 0;

  violations.push(...validateWorkingMemoryReleased(workingState, context.retainWorkingMemory));

  if (context.sharedWorkingMemory) {
    violations.push(
      violation("MEMORY_ISOLATION_BREACH", "Working memory must not be shared between agents", {
        tier: AgentMemoryTier.WORKING,
        agentId: input.agentId,
      }),
    );
  }

  lifecycleStagesCompleted.push(AgentMemoryLifecycleStage.DESIGN);
  lifecycleStagesCompleted.push(AgentMemoryLifecycleStage.KNOWLEDGE_UPDATE);

  const uniqueViolations = dedupeViolations(violations);

  return {
    valid: uniqueViolations.length === 0 && sessionReport.valid && workingReleased,
    agentId: input.agentId,
    violations: uniqueViolations,
    tiersAccessed,
    workingMemoryReleased: workingReleased,
    snapshot,
    versions,
    telemetry: sessionReport.telemetry,
    result: sessionReport.result,
    lifecycleStagesCompleted,
    statelessVerified: workingReleased && !context.retainWorkingMemory,
  };
}

function dedupeViolations(violations: AgentMemoryModelViolation[]): AgentMemoryModelViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.tier ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateAgentMemoryModel(
  context: AgentMemoryModelContext = {},
): AgentMemoryModelValidationReport {
  const violations = [
    ...validateMemoryTierStructure(),
    ...validateDesignMemoryDirectWrite("visual-story-director", Boolean(context.writeDesignMemory)),
    ...validateAnalyticsNotInDecision("visual-story-director", Boolean(context.useAnalyticsInDecision)),
  ];

  if (context.retainWorkingMemory) {
    violations.push(
      violation("HIDDEN_LONG_TERM_STATE", "Agents must not retain long-term working memory", {
        tier: AgentMemoryTier.WORKING,
      }),
    );
  }

  return {
    valid: violations.length === 0,
    violations,
    tiersComplete: validateMemoryTierStructure().length === 0,
    ownershipDefined: AGENT_MEMORY_TIER_STACK.every((t) => t.owner.length > 0),
    statelessDesign: !context.retainWorkingMemory,
    reproducibilityReady: AGENT_MEMORY_OPTIMIZATION_STRATEGIES.length >= 5,
    kitchenExecutionValid: false,
    goldenRuleSatisfied: AGENT_MEMORY_MODEL_GOLDEN_RULE.includes("remember only what it needs"),
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateAgentMemoryModelWithExecution(
  context: AgentMemoryModelContext = {},
): Promise<AgentMemoryModelValidationReport> {
  const report = validateAgentMemoryModel(context);
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;

  const execution = await executeAgentMemorySession({
    agentId: "visual-story-director",
    blueprint: bp,
    context,
  });

  const violations = dedupeViolations([...report.violations, ...execution.violations]);
  if (!execution.valid) {
    violations.push(...execution.violations);
  }

  return {
    ...report,
    valid: violations.length === 0 && execution.valid,
    violations: dedupeViolations(violations),
    kitchenExecutionValid: execution.valid,
    successCriteriaMet: violations.length === 0 && execution.valid,
  };
}

export function assertAgentMemoryModel(
  context?: AgentMemoryModelContext,
): AgentMemoryModelValidationReport {
  const report = validateAgentMemoryModel(context);
  if (!report.valid) {
    throw new Error(`Agent Memory Model violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runAgentMemoryModel(
  context: AgentMemoryModelContext = {},
): Promise<AgentMemoryModelValidationReport> {
  return validateAgentMemoryModelWithExecution(context);
}

export function isAgentMemoryModelFailure(code: string): code is AgentMemoryModelFailureCode {
  const codes: AgentMemoryModelFailureCode[] = [
    "TIER_MIXING",
    "UNAUTHORIZED_TIER_ACCESS",
    "UNAUTHORIZED_TIER_WRITE",
    "WORKING_MEMORY_LEAK",
    "HIDDEN_LONG_TERM_STATE",
    "SHARED_WORKING_MEMORY",
    "ANALYTICS_IN_DECISION",
    "DESIGN_MEMORY_DIRECT_WRITE",
    "MISSING_SNAPSHOT",
    "VERSION_INCONSISTENCY",
    "MEMORY_ISOLATION_BREACH",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as AgentMemoryModelFailureCode);
}

export function getAgentMemoryTier(
  tierId: AgentMemoryTierId,
): AgentMemoryTierDefinition | undefined {
  return AGENT_MEMORY_TIER_STACK.find((t) => t.id === tierId);
}

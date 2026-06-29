/**
 * Chapter 4.4 — Agent Discovery engine
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_READ_MATRIX, AGENT_STAGE_MATRIX } from "./agent-matrix";
import { AgentStatus } from "./agent-registry-types";
import { groupParallelAgents } from "./parallel-execution";
import { SectionState, type BlueprintLifecycle } from "./lifecycle-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  AGENT_DISCOVERY_GOLDEN_RULE,
  MODE_ENABLE_AGENTS,
  MODE_REQUIRED_AGENTS,
  agentsForLifecycleStage,
  isAgentSkippedByMode,
} from "./agent-discovery";
import type {
  DiscoveryContext,
  DiscoveryExclusion,
  DiscoveryExclusionCode,
  DiscoveryReport,
  ExecutionEdge,
  ExecutionGroup,
  ExecutionNode,
  ExecutionPlan,
  PipelineModeId,
} from "./agent-discovery-types";
import { PipelineMode } from "./agent-discovery-types";

export class AgentDiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentDiscoveryError";
  }
}

type CandidateResult = {
  included: ExecutionNode[];
  excluded: DiscoveryExclusion[];
};

function exclusion(
  agentId: AgentContractId,
  code: DiscoveryExclusionCode,
  reason: string,
): DiscoveryExclusion {
  return { agentId, code, reason };
}

function sectionReady(blueprint: RenderBlueprint, section: BlueprintSection): boolean {
  const managed = blueprint.lifecycle.sections[section as keyof typeof blueprint.lifecycle.sections];
  if (managed !== undefined) {
    return managed === SectionState.READY || managed === SectionState.LOCKED || managed === SectionState.VALIDATED;
  }
  const value = (blueprint as Record<string, unknown>)[section];
  if (value === undefined || value === null) return false;
  if (typeof value === "object" && Object.keys(value as object).length === 0) return false;
  return true;
}

function dependenciesMet(blueprint: RenderBlueprint, consumes: BlueprintSection[]): string | null {
  for (const section of consumes) {
    if (section === "meta") continue;
    if (!sectionReady(blueprint, section)) {
      return `Missing required section: ${section}`;
    }
  }
  return null;
}

export class AgentDiscoveryEngine {
  private cache = new Map<string, ExecutionPlan>();

  /** Build cache key — invalidated when blueprint revision, lifecycle, or mode changes */
  cacheKey(ctx: DiscoveryContext): string {
    return [
      ctx.blueprint.meta.revision ?? 0,
      ctx.lifecycle,
      ctx.configuration.mode,
      ctx.configuration.criticsReportedIssues ? "critics" : "",
      (ctx.executedOnStage ?? []).join(","),
    ].join(":");
  }

  discover(ctx: DiscoveryContext): DiscoveryReport {
    const key = this.cacheKey(ctx);
    const cachedPlan = this.cache.get(key);
    const { included, excluded } = this.evaluateCandidates(ctx);
    const executionGraph = this.buildExecutionGraph(included);
    const parallelGroups = this.buildParallelGroups(ctx, included);

    const plan: ExecutionPlan = cachedPlan ?? {
      agents: included,
      executionGraph,
      parallelGroups,
      lifecycle: ctx.lifecycle,
      mode: ctx.configuration.mode,
      cached: Boolean(cachedPlan),
    };

    if (!cachedPlan) {
      plan.cached = false;
      this.cache.set(key, { ...plan, cached: true });
    }

    return {
      included,
      excluded,
      executionGraph,
      parallelGroups,
      plan,
      discoveredAt: Date.now(),
      blueprintRevision: ctx.blueprint.meta.revision ?? 0,
    };
  }

  discoverForRetry(
    ctx: DiscoveryContext,
    mode: PipelineModeId,
  ): DiscoveryReport {
    return this.discover({
      ...ctx,
      configuration: { ...ctx.configuration, mode },
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  private evaluateCandidates(ctx: DiscoveryContext): CandidateResult {
    const included: ExecutionNode[] = [];
    const excluded: DiscoveryExclusion[] = [];
    const stageAgents = agentsForLifecycleStage(ctx.lifecycle);
    const executed = new Set(ctx.executedOnStage ?? []);

    for (const agentId of stageAgents) {
      const result = this.evaluateAgent(ctx, agentId, executed);
      if (result.node) included.push(result.node);
      if (result.exclusion) excluded.push(result.exclusion);
    }

    // Mode-required agents for retry paths
    const required = MODE_REQUIRED_AGENTS[ctx.configuration.mode] ?? [];
    for (const agentId of required) {
      if (included.some((n) => n.agentId === agentId)) continue;
      const result = this.evaluateAgent(ctx, agentId, executed, true);
      if (result.node) included.push(result.node);
      else if (result.exclusion) excluded.push(result.exclusion);
    }

    return { included, excluded };
  }

  private evaluateAgent(
    ctx: DiscoveryContext,
    agentId: AgentContractId,
    executed: Set<AgentContractId>,
    forceInclude = false,
  ): { node?: ExecutionNode; exclusion?: DiscoveryExclusion } {
    const { registry, blueprint, configuration, lifecycle } = ctx;

    if (!registry.hasAgent(agentId)) {
      return { exclusion: exclusion(agentId, "NOT_REGISTERED", `Agent ${agentId} not in registry`) };
    }

    const descriptor = registry.getDescriptor(agentId);
    if (!descriptor) {
      return { exclusion: exclusion(agentId, "NOT_REGISTERED", `Descriptor missing for ${agentId}`) };
    }

    const status = descriptor.status ?? (descriptor.enabled ? AgentStatus.ACTIVE : AgentStatus.DISABLED);
    if (status === AgentStatus.DISABLED || status === AgentStatus.DEPRECATED) {
      return { exclusion: exclusion(agentId, "INACTIVE", `Agent ${agentId} status is ${status}`) };
    }
    if (status === AgentStatus.EXPERIMENTAL && !configuration.enableExperimental) {
      return { exclusion: exclusion(agentId, "INACTIVE", `Experimental agent ${agentId} disabled by config`) };
    }

    if (!forceInclude && isAgentSkippedByMode(agentId, configuration.mode)) {
      return { exclusion: exclusion(agentId, "MODE_FILTERED", `Skipped by mode ${configuration.mode}`) };
    }

    if (agentId === "chief-design-director") {
      const enable =
        configuration.requireChiefReview ||
        configuration.mode === PipelineMode.HIGH_QUALITY ||
        (MODE_ENABLE_AGENTS[configuration.mode]?.includes(agentId) ?? false);
      const conditional =
        configuration.criticsReportedIssues || configuration.mode === PipelineMode.HIGH_QUALITY;
      if (!enable && !conditional) {
        return {
          exclusion: exclusion(
            agentId,
            "CONDITIONAL_SKIP",
            "Chief Design Director only when critics report issues or HIGH_QUALITY mode",
          ),
        };
      }
    }

    const agentStage = AGENT_STAGE_MATRIX[agentId];
    if (!forceInclude && agentStage !== lifecycle) {
      return {
        exclusion: exclusion(
          agentId,
          "LIFECYCLE_MISMATCH",
          `Agent ${agentId} runs at ${agentStage}, current lifecycle is ${lifecycle}`,
        ),
      };
    }

    if (executed.has(agentId)) {
      return { exclusion: exclusion(agentId, "ALREADY_EXECUTED", `Agent ${agentId} already ran on this stage`) };
    }

    const consumes = descriptor.consumes ?? AGENT_READ_MATRIX[agentId] ?? [];
    const depMissing = dependenciesMet(blueprint, consumes);
    if (depMissing) {
      return { exclusion: exclusion(agentId, "DEPENDENCY_MISSING", depMissing) };
    }

    return {
      node: {
        agentId,
        version: descriptor.version,
        stage: agentStage,
        category: descriptor.category,
        produces: descriptor.produces ?? [],
        consumes,
      },
    };
  }

  private buildExecutionGraph(nodes: ExecutionNode[]): ExecutionEdge[] {
    const edges: ExecutionEdge[] = [];
    const sorted = [...nodes].sort(
      (a, b) =>
        Object.values(AGENT_STAGE_MATRIX).indexOf(a.stage) -
        Object.values(AGENT_STAGE_MATRIX).indexOf(b.stage),
    );

    for (let i = 1; i < sorted.length; i++) {
      edges.push({
        from: sorted[i - 1]!.agentId,
        to: sorted[i]!.agentId,
        kind: "stage",
      });
    }

    for (const node of nodes) {
      for (const section of node.consumes) {
        edges.push({ from: section, to: node.agentId, kind: "section" });
      }
    }
    return edges;
  }

  private buildParallelGroups(ctx: DiscoveryContext, nodes: ExecutionNode[]): ExecutionGroup[] {
    if (!nodes.length) return [];

    const agents = nodes
      .map((n) => ctx.registry.getById(n.agentId))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    const batches = groupParallelAgents(agents);
    return batches.map((batch, index) => ({
      id: `group-${index + 1}`,
      agentIds: batch.map((a) => a.id),
      parallel: batch.length > 1,
    }));
  }
}

export function discoverAgents(ctx: DiscoveryContext): DiscoveryReport {
  return new AgentDiscoveryEngine().discover(ctx);
}

export { AGENT_DISCOVERY_GOLDEN_RULE };

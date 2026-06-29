/**
 * Chapter 4.4 — Agent Discovery rules and pipeline mode filters
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_STAGE_MATRIX } from "./agent-matrix";
import { PipelineMode, type PipelineModeId } from "./agent-discovery-types";

export {
  PipelineMode,
  type PipelineModeId,
  type PipelineConfiguration,
  type DiscoveryContext,
  type ExecutionNode,
  type ExecutionEdge,
  type ExecutionGroup,
  type ExecutionPlan,
  type DiscoveryExclusion,
  type DiscoveryExclusionCode,
  type DiscoveryReport,
  type DiscoveryCacheKey,
} from "./agent-discovery-types";

export const AGENT_DISCOVERY_VERSION = "4.4.0";

export const AGENT_DISCOVERY_GOLDEN_RULE =
  "Agent Discovery never chooses the best design — it only determines which agents must participate in the current pipeline.";

/** Agents skipped per pipeline mode */
export const MODE_SKIP_AGENTS: Partial<Record<PipelineModeId, AgentContractId[]>> = {
  [PipelineMode.FAST_GENERATION]: ["commercial-photo-director", "chief-design-director"],
  [PipelineMode.BACKGROUND_RETRY]: [
    "product-analyzer",
    "creative-engine",
    "visual-story-director",
    "scene-director",
    "composition-director",
    "commercial-photo-director",
    "camera-director",
    "material-director",
    "governance",
    "critics",
    "chief-design-director",
  ],
  [PipelineMode.COMPOSITE_RETRY]: [
    "product-analyzer",
    "creative-engine",
    "visual-story-director",
    "scene-director",
    "composition-director",
    "commercial-photo-director",
    "camera-director",
    "lighting-director",
    "material-director",
    "governance",
    "critics",
    "chief-design-director",
    "flux-adapter",
  ],
};

/** Agents required per retry mode */
export const MODE_REQUIRED_AGENTS: Partial<Record<PipelineModeId, AgentContractId[]>> = {
  [PipelineMode.BACKGROUND_RETRY]: ["lighting-director", "flux-adapter"],
  [PipelineMode.COMPOSITE_RETRY]: ["flux-adapter"],
};

export const MODE_ENABLE_AGENTS: Partial<Record<PipelineModeId, AgentContractId[]>> = {
  [PipelineMode.HIGH_QUALITY]: ["chief-design-director", "critics"],
};

/** Stage-ordered agents for full marketplace path */
export const MARKETPLACE_AGENT_CHAIN: AgentContractId[] = [
  "product-analyzer",
  "creative-engine",
  "visual-story-director",
  "scene-director",
  "commercial-photo-director",
  "camera-director",
  "lighting-director",
  "material-director",
  "composition-director",
  "governance",
  "critics",
  "chief-design-director",
];

export function agentsForLifecycleStage(stage: import("./lifecycle-types").BlueprintLifecycle): AgentContractId[] {
  return (Object.entries(AGENT_STAGE_MATRIX) as [AgentContractId, import("./lifecycle-types").BlueprintLifecycle][])
    .filter(([, s]) => s === stage)
    .map(([id]) => id)
    .filter((id) => id !== "flux-adapter");
}

export function isAgentSkippedByMode(agentId: AgentContractId, mode: PipelineModeId): boolean {
  return MODE_SKIP_AGENTS[mode]?.includes(agentId) ?? false;
}

export function defaultPipelineConfiguration(
  overrides: Partial<import("./agent-discovery-types").PipelineConfiguration> = {},
): import("./agent-discovery-types").PipelineConfiguration {
  return {
    mode: PipelineMode.STANDARD,
    enableExperimental: false,
    enablePlugins: true,
    requireChiefReview: false,
    criticsReportedIssues: false,
    postGeneration: false,
    ...overrides,
  };
}

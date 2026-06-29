/**
 * Chapter 4.1 — Universal Agent Contract
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_READ_MATRIX, AGENT_WRITE_MATRIX } from "./agent-matrix";
import { AgentEcosystemCategory, getAgentCategory } from "./agent-ecosystem";
import {
  buildAgentContextPackage,
  bridgePipelineConfig,
} from "./agent-context-engine";
import { defaultPipelineConfiguration } from "./agent-discovery";
import type { BlueprintSection } from "./types";
import {
  AgentCategory,
  type AgentCategoryId,
  type AgentContext,
  type LegacyAgentAdapterOptions,
  type PipelineConfig,
  type UniversalBlueprintAgent,
} from "./universal-agent-contract-types";

export {
  AgentCategory,
  type AgentCategoryId,
  type AgentContext,
  type AgentRecommendation,
  type AgentDiagnostics,
  type UniversalAgentResult,
  type UniversalBlueprintAgent,
  type PipelineConfig,
  type UniversalContractViolation,
  type UniversalContractReport,
  type LegacyAgentAdapterOptions,
} from "./universal-agent-contract-types";

export const UNIVERSAL_AGENT_CONTRACT_VERSION = "4.1.0";

export const UNIVERSAL_AGENT_CONTRACT_GOLDEN_RULE =
  "All design agents are interchangeable components implementing one Universal Agent Contract. " +
  "If connecting a new agent requires changing Lifecycle, Mutation Engine, RenderBlueprint, or existing agents, the architecture is violated.";

/** Stable agent IDs — never change between versions */
export const STABLE_AGENT_IDS = [
  "product-analyzer",
  "creative-engine",
  "visual-story-director",
  "scene-director",
  "composition-director",
  "commercial-photo-director",
  "lighting-director",
  "camera-director",
  "material-director",
  "chief-design-director",
  "governance",
  "critics",
  // Reserved future IDs (Chapter 4.1)
  "senior-art-director",
  "marketplace-ctr-expert",
  "art-director",
  "commercial-photographer",
  "design-memory",
] as const;

export type StableAgentId = (typeof STABLE_AGENT_IDS)[number];

const ECOSYSTEM_TO_CONTRACT: Record<string, AgentCategoryId> = {
  [AgentEcosystemCategory.CREATIVE_DIRECTOR]: AgentCategory.CREATIVE_DIRECTOR,
  [AgentEcosystemCategory.TECHNICAL_DIRECTOR]: AgentCategory.TECHNICAL_DIRECTOR,
  [AgentEcosystemCategory.CRITIC]: AgentCategory.CRITIC,
  [AgentEcosystemCategory.ORCHESTRATOR]: AgentCategory.ORCHESTRATOR,
  [AgentEcosystemCategory.LEARNING_AGENT]: AgentCategory.LEARNING,
};

export function categoryForAgent(agentId: AgentContractId): AgentCategoryId | null {
  const eco = getAgentCategory(agentId);
  if (!eco) return null;
  return ECOSYSTEM_TO_CONTRACT[eco] ?? null;
}

export function consumesForAgent(agentId: AgentContractId): BlueprintSection[] {
  return [...(AGENT_READ_MATRIX[agentId] ?? [])];
}

export function producesForAgent(agentId: AgentContractId): BlueprintSection[] {
  return [...(AGENT_WRITE_MATRIX[agentId] ?? [])];
}

/** Normalize legacy 0..100 confidence to universal 0.0..1.0 */
export function normalizeConfidence(value: number): number {
  if (value > 1) return Math.min(1, Math.max(0, value / 100));
  return Math.min(1, Math.max(0, value));
}

/** Denormalize universal 0.0..1.0 to legacy 0..100 */
export function denormalizeConfidence(value: number): number {
  const n = normalizeConfidence(value);
  return Math.round(n * 100);
}

export function createAgentContext(input: {
  blueprint: Readonly<import("./types").RenderBlueprint>;
  snapshot?: import("./snapshot-types").BlueprintSnapshot;
  pipelineId?: string;
  marketplace?: string;
  debug?: boolean;
  seed?: number;
  configuration?: import("./agent-discovery-types").PipelineConfiguration;
  runtime?: import("./agent-context-types").RuntimeContext;
  diagnostics?: import("./agent-context-types").AgentDiagnosticContext;
  agentId?: AgentContractId;
  agentVersion?: string;
}): AgentContext {
  const pkg = buildAgentContextPackage({
    blueprint: structuredClone(input.blueprint) as import("./types").RenderBlueprint,
    snapshot: input.snapshot ? structuredClone(input.snapshot) : undefined,
    configuration: input.configuration ?? defaultPipelineConfiguration(),
    pipelineId: input.pipelineId,
    diagnostics: input.diagnostics,
    runtime: input.runtime,
    agentId: input.agentId,
    agentVersion: input.agentVersion,
  });

  return {
    blueprint: pkg.blueprint,
    snapshot: pkg.snapshot,
    configuration: pkg.configuration,
    diagnostics: pkg.diagnostics,
    runtime: pkg.runtime,
    config: bridgePipelineConfig(pkg, {
      pipelineId: input.pipelineId,
      marketplace: input.marketplace,
      debug: input.debug,
      seed: input.seed,
    }),
  };
}

export function preconditionsMet(
  agent: UniversalBlueprintAgent,
  context: AgentContext,
): boolean {
  for (const section of agent.consumes) {
    const value = (context.blueprint as Record<string, unknown>)[section];
    if (value === undefined || value === null) return false;
  }
  return agent.canExecute(context);
}

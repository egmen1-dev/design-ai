/**
 * Chapter 3.10 / 4.3 — Agent Registry types
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { AgentContractId, AgentResultBase, BlueprintAgent } from "./agent-contracts";
import type { AgentCategoryId } from "./universal-agent-contract-types";
import type { BlueprintSection } from "./types";

export const AgentType = {
  DIRECTOR: "DIRECTOR",
  CRITIC: "CRITIC",
  VALIDATOR: "VALIDATOR",
  ORCHESTRATOR: "ORCHESTRATOR",
  MEMORY: "MEMORY",
  ADAPTER: "ADAPTER",
} as const;

export type AgentTypeId = (typeof AgentType)[keyof typeof AgentType];

/** Chapter 4.3 — agent availability status */
export const AgentStatus = {
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  EXPERIMENTAL: "EXPERIMENTAL",
  DEPRECATED: "DEPRECATED",
} as const;

export type AgentStatusId = (typeof AgentStatus)[keyof typeof AgentStatus];

export const RegistryEventType = {
  AGENT_REGISTERED: "agent_registered",
  AGENT_UPDATED: "agent_updated",
  AGENT_DISABLED: "agent_disabled",
  AGENT_REMOVED: "agent_removed",
} as const;

export type RegistryEventTypeId = (typeof RegistryEventType)[keyof typeof RegistryEventType];

export type RegistryEvent = {
  type: RegistryEventTypeId;
  agentId: string;
  version: string;
  at: number;
  detail?: string;
};

export type AgentDescriptor = {
  id: AgentContractId;
  name: string;
  version: string;
  stage: BlueprintLifecycle;
  type: AgentTypeId;
  producer: string;
  enabled: boolean;
  /** Chapter 4.3 — ecosystem category */
  category?: AgentCategoryId;
  produces?: BlueprintSection[];
  consumes?: BlueprintSection[];
  capabilityTags?: string[];
  status?: AgentStatusId;
};

export type AgentCapabilities = {
  supportsRetry: boolean;
  supportsParallel: boolean;
  requiresLLM: boolean;
  requiresVision: boolean;
};

export type AgentMetadata = {
  author: string;
  description: string;
  supportedStages: BlueprintLifecycle[];
  dependencies: string[];
};

export type AgentFactory = {
  create(): BlueprintAgent<unknown, AgentResultBase>;
  dispose?(instance: BlueprintAgent<unknown, AgentResultBase>): void;
};

export type AgentRegistration = {
  descriptor: AgentDescriptor;
  factory: AgentFactory;
  capabilities: AgentCapabilities;
  metadata: AgentMetadata;
};

export type AgentInstanceRecord = {
  descriptor: AgentDescriptor;
  instance: BlueprintAgent<unknown, AgentResultBase>;
  createdAt: number;
  disposed: boolean;
};

export type RegistryHealthIssue = {
  code:
    | "DUPLICATE_ID"
    | "MISSING_FACTORY"
    | "STAGE_MISMATCH"
    | "CYCLIC_DEPENDENCY"
    | "VISION_UNAVAILABLE"
    | "DISABLED_STAGE_GAP"
    | "OWNERSHIP_CONFLICT"
    | "INVALID_CONTRACT"
    | "INVALID_VERSION";
  message: string;
  agentId?: AgentContractId;
};

export type RegistryValidationResult = {
  valid: boolean;
  issues: RegistryHealthIssue[];
  agentCount: number;
  versionCount: number;
};

export type RegistryHealthResult = {
  ok: boolean;
  issues: RegistryHealthIssue[];
};

export type RegistryAgentReport = {
  id: AgentContractId;
  version: string;
  stage: BlueprintLifecycle;
  durationMs?: number;
  result?: "success" | "failure" | "skipped";
  confidence?: number;
};

export type RegistryReport = {
  agents: RegistryAgentReport[];
  generatedAt: number;
};

export type RegistryRuntimeOptions = {
  visionEngineAvailable?: boolean;
};

export const DEFAULT_DIRECTOR_CAPABILITIES: AgentCapabilities = {
  supportsRetry: true,
  supportsParallel: false,
  requiresLLM: true,
  requiresVision: false,
};

export const DEFAULT_CRITIC_CAPABILITIES: AgentCapabilities = {
  supportsRetry: true,
  supportsParallel: true,
  requiresLLM: true,
  requiresVision: true,
};

export const DEFAULT_ADAPTER_CAPABILITIES: AgentCapabilities = {
  supportsRetry: false,
  supportsParallel: false,
  requiresLLM: false,
  requiresVision: false,
};

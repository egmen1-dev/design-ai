/**
 * Chapter 4.2 — Agent Lifecycle catalog
 */
import {
  AgentLifecycleStage,
  type AgentLifecycleGuarantee,
  type AgentLifecycleStageId,
} from "./agent-lifecycle-types";

export {
  AgentLifecycleStage,
  type AgentLifecycleStageId,
  type AgentLifecycleStageRecord,
  type AgentLifecycleFailure,
  type AgentLifecycleResult,
  type AgentLifecycleRunInput,
  type AgentLifecycleOrchestratorOptions,
  type AgentLifecycleGuarantee,
} from "./agent-lifecycle-types";

export const AGENT_LIFECYCLE_VERSION = "4.2.0";

export const AGENT_LIFECYCLE_GOLDEN_RULE =
  "Agent lifecycle is fully controlled by Lifecycle Manager. " +
  "An agent never controls its own launch, retry, or termination.";

/** Mandatory stage order — skipping forbidden */
export const AGENT_LIFECYCLE_STAGE_ORDER: readonly AgentLifecycleStageId[] = [
  AgentLifecycleStage.REGISTERED,
  AgentLifecycleStage.DISCOVERED,
  AgentLifecycleStage.VALIDATED,
  AgentLifecycleStage.INITIALIZED,
  AgentLifecycleStage.EXECUTE,
  AgentLifecycleStage.DECISION,
  AgentLifecycleStage.MUTATION,
  AgentLifecycleStage.VALIDATION,
  AgentLifecycleStage.COMPLETED,
  AgentLifecycleStage.DISPOSED,
] as const;

export const AGENT_LIFECYCLE_GUARANTEES: readonly AgentLifecycleGuarantee[] = [
  {
    id: "once_per_stage",
    description: "Agent executes at most once per pipeline stage per session",
  },
  {
    id: "stateless",
    description: "Agent retains no internal state between runs",
  },
  {
    id: "no_direct_agent_effects",
    description: "Agent does not affect other agents directly",
  },
  {
    id: "consistent_completion",
    description: "Agent completes in a coherent blueprint state or rolls back",
  },
] as const;

export function nextLifecycleStage(
  current: AgentLifecycleStageId,
): AgentLifecycleStageId | null {
  const idx = AGENT_LIFECYCLE_STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= AGENT_LIFECYCLE_STAGE_ORDER.length - 1) return null;
  return AGENT_LIFECYCLE_STAGE_ORDER[idx + 1]!;
}

export function assertStageOrder(
  completed: AgentLifecycleStageId[],
  next: AgentLifecycleStageId,
): void {
  const expected = AGENT_LIFECYCLE_STAGE_ORDER[completed.length];
  if (expected !== next) {
    throw new Error(
      `Agent lifecycle stage skip forbidden: expected ${expected}, got ${next}`,
    );
  }
}

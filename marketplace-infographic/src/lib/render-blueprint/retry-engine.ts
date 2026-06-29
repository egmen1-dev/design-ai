/**
 * Chapter 3.4 — Retry Engine
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { AgentContractId } from "./agent-contracts";
import {
  DEFAULT_RETRY_LIMITS,
  RetryKind,
  type RetryKindId,
  type RetryLimits,
} from "./lifecycle-manager-types";

export class RetryLimitExceededError extends Error {
  constructor(
    readonly kind: RetryKindId,
    readonly stage: BlueprintLifecycle,
    readonly agentId?: AgentContractId,
  ) {
    super(`Retry limit exceeded: ${kind} at stage ${stage}`);
    this.name = "RetryLimitExceededError";
  }
}

type RetryCounters = {
  agent: Map<string, number>;
  stage: Map<BlueprintLifecycle, number>;
  pipeline: number;
};

export class RetryEngine {
  private readonly limits: RetryLimits;
  private readonly counters: RetryCounters = {
    agent: new Map(),
    stage: new Map(),
    pipeline: 0,
  };

  constructor(limits: RetryLimits = DEFAULT_RETRY_LIMITS) {
    this.limits = limits;
  }

  private agentKey(stage: BlueprintLifecycle, agentId: AgentContractId): string {
    return `${stage}:${agentId}`;
  }

  canRetry(kind: RetryKindId, stage: BlueprintLifecycle, agentId?: AgentContractId): boolean {
    switch (kind) {
      case RetryKind.Agent:
        return (this.counters.agent.get(this.agentKey(stage, agentId!)) ?? 0) < this.limits.agent;
      case RetryKind.Stage:
        return (this.counters.stage.get(stage) ?? 0) < this.limits.stage;
      case RetryKind.Pipeline:
        return this.counters.pipeline < this.limits.pipeline;
      default:
        return false;
    }
  }

  recordRetry(kind: RetryKindId, stage: BlueprintLifecycle, agentId?: AgentContractId): void {
    if (!this.canRetry(kind, stage, agentId)) {
      throw new RetryLimitExceededError(kind, stage, agentId);
    }
    switch (kind) {
      case RetryKind.Agent: {
        const key = this.agentKey(stage, agentId!);
        this.counters.agent.set(key, (this.counters.agent.get(key) ?? 0) + 1);
        break;
      }
      case RetryKind.Stage:
        this.counters.stage.set(stage, (this.counters.stage.get(stage) ?? 0) + 1);
        break;
      case RetryKind.Pipeline:
        this.counters.pipeline += 1;
        break;
    }
  }

  getCount(kind: RetryKindId, stage: BlueprintLifecycle, agentId?: AgentContractId): number {
    switch (kind) {
      case RetryKind.Agent:
        return this.counters.agent.get(this.agentKey(stage, agentId!)) ?? 0;
      case RetryKind.Stage:
        return this.counters.stage.get(stage) ?? 0;
      case RetryKind.Pipeline:
        return this.counters.pipeline;
      default:
        return 0;
    }
  }

  reset(): void {
    this.counters.agent.clear();
    this.counters.stage.clear();
    this.counters.pipeline = 0;
  }
}

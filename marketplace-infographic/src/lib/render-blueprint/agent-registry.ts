/**
 * Chapter 3.4 — Agent Registry
 * Lifecycle Manager never imports agents directly — they register here.
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { AgentContractId, AgentResultBase, BlueprintAgent } from "./agent-contracts";

export class AgentRegistry {
  private readonly byStage = new Map<BlueprintLifecycle, BlueprintAgent<unknown, AgentResultBase>[]>();
  private readonly byId = new Map<AgentContractId, BlueprintAgent<unknown, AgentResultBase>>();

  register<TInput, TResult extends AgentResultBase>(
    agent: BlueprintAgent<TInput, TResult>,
  ): void {
    const list = this.byStage.get(agent.stage) ?? [];
    if (list.some((a) => a.id === agent.id)) {
      throw new Error(`Agent ${agent.id} already registered for stage ${agent.stage}`);
    }
    list.push(agent as BlueprintAgent<unknown, AgentResultBase>);
    this.byStage.set(agent.stage, list);
    this.byId.set(agent.id, agent as BlueprintAgent<unknown, AgentResultBase>);
  }

  getByStage(stage: BlueprintLifecycle): BlueprintAgent<unknown, AgentResultBase>[] {
    return [...(this.byStage.get(stage) ?? [])];
  }

  getById(id: AgentContractId): BlueprintAgent<unknown, AgentResultBase> | undefined {
    return this.byId.get(id);
  }

  has(stage: BlueprintLifecycle): boolean {
    return (this.byStage.get(stage)?.length ?? 0) > 0;
  }
}

export const defaultAgentRegistry = new AgentRegistry();

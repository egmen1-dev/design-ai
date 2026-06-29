/**
 * Chapter 3.4 — Parallel agent execution groups
 */
import { DEFAULT_DECISION_EDGES, DependencyKind } from "./decision-graph";
import type { AgentContractId, BlueprintAgent, AgentResultBase } from "./agent-contracts";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";

function nodeIdForSection(section: string): string {
  return section;
}

function hasHardPath(from: string, to: string): boolean {
  const children = new Map<string, string[]>();
  for (const edge of DEFAULT_DECISION_EDGES) {
    if (edge.kind !== DependencyKind.HARD) continue;
    const list = children.get(edge.from) ?? [];
    list.push(edge.to);
    children.set(edge.from, list);
  }

  const queue = [from];
  const visited = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (id === to) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const child of children.get(id) ?? []) queue.push(child);
  }
  return false;
}

export function canRunAgentsParallel(
  agentA: AgentContractId,
  agentB: AgentContractId,
): boolean {
  const writesA = AGENT_WRITE_MATRIX[agentA] ?? [];
  const writesB = AGENT_WRITE_MATRIX[agentB] ?? [];
  for (const sectionA of writesA) {
    for (const sectionB of writesB) {
      const nodeA = nodeIdForSection(sectionA);
      const nodeB = nodeIdForSection(sectionB);
      if (nodeA === nodeB) return false;
      if (hasHardPath(nodeA, nodeB) || hasHardPath(nodeB, nodeA)) return false;
    }
  }
  return true;
}

/** Greedy batching — agents in same group may run concurrently */
export function groupParallelAgents(
  agents: BlueprintAgent<unknown, AgentResultBase>[],
): BlueprintAgent<unknown, AgentResultBase>[][] {
  const groups: BlueprintAgent<unknown, AgentResultBase>[][] = [];
  for (const agent of agents) {
    let placed = false;
    for (const group of groups) {
      if (group.every((existing) => canRunAgentsParallel(existing.id, agent.id))) {
        group.push(agent);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([agent]);
  }
  return groups;
}

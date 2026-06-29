/**
 * Chapter 4.5 — Section dependency graph (data dependencies only)
 */
import { DEFAULT_DECISION_EDGES } from "./decision-graph";
import { DependencyKind } from "./decision-graph-types";
import type { BlueprintSection } from "./types";
import {
  DependencyRequirement,
  type DependencyGraphExport,
  type SectionDependencyEdge,
} from "./agent-dependency-types";

export {
  DependencyRequirement,
  type DependencyRequirementId,
  type AgentDependency,
  type ConditionalDependency,
  type SectionDependencyEdge,
  type DependencyValidationContext,
  type DependencyViolation,
  type DependencyValidationReport,
  type DependencyPropagationResult,
  type DependencyGraphExport,
} from "./agent-dependency-types";

export const AGENT_DEPENDENCY_VERSION = "4.5.0";

export const AGENT_DEPENDENCY_GOLDEN_RULE =
  "There are no dependencies between agents — only dependencies between data represented in RenderBlueprint.";

/** Default section chain — Analysis → Story → Scene → Photography → Composition → Render */
export const DEFAULT_SECTION_CHAIN: BlueprintSection[] = [
  "product",
  "creative",
  "story",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "constraints",
  "validation",
  "render",
];

export function buildSectionDependencyEdges(): SectionDependencyEdge[] {
  return DEFAULT_DECISION_EDGES.filter((e) => e.kind !== DependencyKind.INFO).map((edge) => ({
    from: edge.from as BlueprintSection,
    to: edge.to as BlueprintSection,
    kind:
      edge.kind === DependencyKind.SOFT
        ? DependencyRequirement.OPTIONAL
        : DependencyRequirement.REQUIRED,
    reason: edge.reason,
  }));
}

export function sectionAdjacency(): Map<BlueprintSection, BlueprintSection[]> {
  const adj = new Map<BlueprintSection, BlueprintSection[]>();
  for (const edge of buildSectionDependencyEdges()) {
    const list = adj.get(edge.from) ?? [];
    list.push(edge.to);
    adj.set(edge.from, list);
  }
  return adj;
}

export function detectSectionCycle(): BlueprintSection[] | null {
  const adj = sectionAdjacency();
  const visited = new Set<BlueprintSection>();
  const stack = new Set<BlueprintSection>();
  const path: BlueprintSection[] = [];

  function dfs(node: BlueprintSection): BlueprintSection[] | null {
    if (stack.has(node)) {
      const idx = path.indexOf(node);
      return path.slice(idx).concat(node);
    }
    if (visited.has(node)) return null;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const next of adj.get(node) ?? []) {
      const cycle = dfs(next);
      if (cycle) return cycle;
    }
    path.pop();
    stack.delete(node);
    return null;
  }

  for (const node of adj.keys()) {
    const cycle = dfs(node);
    if (cycle) return cycle;
  }
  return null;
}

export function topologicalSortSections(
  edges: SectionDependencyEdge[] = buildSectionDependencyEdges(),
): BlueprintSection[] {
  const inDegree = new Map<BlueprintSection, number>();
  const adj = new Map<BlueprintSection, BlueprintSection[]>();

  for (const edge of edges) {
    if (edge.kind === DependencyRequirement.OPTIONAL) continue;
    adj.set(edge.from, [...(adj.get(edge.from) ?? []), edge.to]);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    if (!inDegree.has(edge.from)) inDegree.set(edge.from, inDegree.get(edge.from) ?? 0);
  }

  const queue: BlueprintSection[] = [];
  for (const [node, deg] of inDegree) {
    if (deg === 0) queue.push(node);
  }

  const order: BlueprintSection[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const next of adj.get(node) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }

  if (order.length < inDegree.size) {
    throw new Error("Section dependency graph contains a cycle");
  }
  return order;
}

export function exportDependencyGraph(): DependencyGraphExport {
  const edges = buildSectionDependencyEdges();
  const cycle = detectSectionCycle();
  let topologicalOrder: BlueprintSection[] = [];
  try {
    topologicalOrder = cycle ? [] : topologicalSortSections(edges);
  } catch {
    topologicalOrder = [];
  }
  const nodes = [...new Set(edges.flatMap((e) => [e.from, e.to]))];
  return {
    nodes,
    edges,
    topologicalOrder,
    hasCycle: Boolean(cycle),
  };
}

export function downstreamSections(from: BlueprintSection): BlueprintSection[] {
  const adj = sectionAdjacency();
  const result = new Set<BlueprintSection>();
  const queue = [from];
  while (queue.length) {
    const node = queue.shift()!;
    for (const next of adj.get(node) ?? []) {
      if (!result.has(next)) {
        result.add(next);
        queue.push(next);
      }
    }
  }
  return [...result];
}

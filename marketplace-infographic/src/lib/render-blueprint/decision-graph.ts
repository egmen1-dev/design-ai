/**
 * Chapter 3.3 — Decision Dependency Graph
 * Stores why decisions were made; RenderBlueprint stores what is known.
 */
import type { RenderBlueprint } from "./types";
import type { LifecycleManagedSection } from "./lifecycle-types";
import { SectionState } from "./lifecycle-types";
import type { AgentContractId } from "./agent-contracts";
import { agentMayWriteSectionContract } from "./agent-matrix";
import type { BlueprintSection } from "./types";
import {
  DecisionType,
  DependencyKind,
  type DecisionConflict,
  type DecisionEdge,
  type DecisionNode,
  type DecisionProducerId,
  type DecisionTypeId,
  type GraphValidationIssue,
  type GraphValidationResult,
  type InvalidationResult,
} from "./decision-graph-types";

export {
  DecisionType,
  DependencyKind,
  type DecisionConflict,
  type DecisionEdge,
  type DecisionNode,
  type DecisionProducerId,
  type DecisionTypeId,
  type GraphValidationIssue,
  type GraphValidationResult,
  type InvalidationResult,
} from "./decision-graph-types";

export class DecisionGraphError extends Error {
  constructor(
    message: string,
    readonly issues: GraphValidationIssue[] = [],
  ) {
    super(message);
    this.name = "DecisionGraphError";
  }
}

/** Topological order for partial rebuild — first DIRTY node wins */
export const DECISION_EXECUTION_ORDER: DecisionTypeId[] = [
  DecisionType.CREATIVE,
  DecisionType.STORY,
  DecisionType.SCENE,
  DecisionType.PHOTOGRAPHY,
  DecisionType.CAMERA,
  DecisionType.MATERIAL,
  DecisionType.LIGHTING,
  DecisionType.COMPOSITION,
  DecisionType.BACKGROUND,
  DecisionType.CONSTRAINTS,
  DecisionType.VALIDATION,
];

export const DECISION_NODE_ID: Record<DecisionTypeId, string> = {
  CREATIVE: "creative",
  STORY: "story",
  SCENE: "scene",
  PHOTOGRAPHY: "photography",
  CAMERA: "camera",
  LIGHTING: "lighting",
  MATERIAL: "materials",
  COMPOSITION: "composition",
  BACKGROUND: "background",
  CONSTRAINTS: "constraints",
  VALIDATION: "validation",
};

const TYPE_BY_NODE_ID = Object.fromEntries(
  Object.entries(DECISION_NODE_ID).map(([type, id]) => [id, type as DecisionTypeId]),
) as Record<string, DecisionTypeId>;

export const DECISION_PRODUCERS: Record<DecisionTypeId, DecisionProducerId> = {
  CREATIVE: "creative-engine",
  STORY: "visual-story-director",
  SCENE: "scene-director",
  PHOTOGRAPHY: "commercial-photo-director",
  CAMERA: "commercial-photo-director",
  LIGHTING: "commercial-photo-director",
  MATERIAL: "commercial-photo-director",
  COMPOSITION: "composition-director",
  BACKGROUND: "scene-director",
  CONSTRAINTS: "governance",
  VALIDATION: "orchestrator",
};

const MANAGED_SECTION_BY_NODE: Partial<Record<string, LifecycleManagedSection>> = {
  creative: "creative",
  story: "story",
  scene: "scene",
  photography: "photography",
  camera: "camera",
  lighting: "lighting",
  materials: "materials",
  composition: "composition",
  constraints: "constraints",
  validation: "validation",
};

/** Default dependency edges — parents-only storage; children derived at runtime */
export const DEFAULT_DECISION_EDGES: DecisionEdge[] = [
  {
    from: "creative",
    to: "story",
    reason: "Creative goal defines narrative",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "story",
    to: "scene",
    reason: "Story defines environment context",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "scene",
    to: "photography",
    reason: "Scene defines shot context",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "photography",
    to: "camera",
    reason: "Photo style constrains lens",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "photography",
    to: "materials",
    reason: "Photo style affects surfaces",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "scene",
    to: "camera",
    reason: "Scene depth affects lens choice",
    weight: 0.8,
    kind: DependencyKind.HARD,
  },
  {
    from: "photography",
    to: "lighting",
    reason: "Photo mood constrains light",
    weight: 0.9,
    kind: DependencyKind.HARD,
  },
  {
    from: "scene",
    to: "lighting",
    reason: "Scene time and weather affect light",
    weight: 0.9,
    kind: DependencyKind.HARD,
  },
  {
    from: "materials",
    to: "lighting",
    reason: "Surface reflectance affects lighting",
    weight: 0.7,
    kind: DependencyKind.HARD,
  },
  {
    from: "scene",
    to: "composition",
    reason: "Scene layout affects framing",
    weight: 0.85,
    kind: DependencyKind.HARD,
  },
  {
    from: "camera",
    to: "composition",
    reason: "Lens affects hero scale and negative space",
    weight: 0.9,
    kind: DependencyKind.HARD,
  },
  {
    from: "story",
    to: "composition",
    reason: "Narrative drives eye flow",
    weight: 0.75,
    kind: DependencyKind.HARD,
  },
  {
    from: "lighting",
    to: "composition",
    reason: "Light shapes visual weight",
    weight: 0.35,
    kind: DependencyKind.SOFT,
  },
  {
    from: "scene",
    to: "background",
    reason: "Scene defines backdrop",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "composition",
    to: "constraints",
    reason: "Layout defines governance rules",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "constraints",
    to: "validation",
    reason: "Constraints must pass validation",
    weight: 1,
    kind: DependencyKind.HARD,
  },
  {
    from: "creative",
    to: "validation",
    reason: "Creative goal informs approval criteria",
    weight: 0.2,
    kind: DependencyKind.INFO,
  },
];

function parentsFromEdges(nodeId: string, edges: DecisionEdge[]): string[] {
  return edges.filter((e) => e.to === nodeId).map((e) => e.from);
}

function buildChildrenMap(edges: DecisionEdge[]): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.kind === DependencyKind.INFO) continue;
    const list = children.get(edge.from) ?? [];
    if (!list.includes(edge.to)) list.push(edge.to);
    children.set(edge.from, list);
  }
  return children;
}

function agentMayProposeNode(producer: DecisionProducerId, nodeId: string): boolean {
  if (producer === "orchestrator" || producer === "system") return true;
  const nodeProducer = Object.entries(DECISION_NODE_ID).find(([, id]) => id === nodeId)?.[0];
  if (nodeProducer && DECISION_PRODUCERS[nodeProducer as DecisionTypeId] === producer) return true;
  if (nodeId === "background") return producer === "scene-director";
  return agentMayWriteSectionContract(producer as AgentContractId, nodeId as BlueprintSection);
}

function sectionValueFromBlueprint(blueprint: RenderBlueprint, nodeId: string): unknown {
  switch (nodeId) {
    case "creative":
      return blueprint.creative;
    case "story":
      return blueprint.story;
    case "scene":
      return blueprint.scene;
    case "photography":
      return blueprint.photography;
    case "camera":
      return blueprint.camera;
    case "lighting":
      return blueprint.lighting;
    case "materials":
      return blueprint.materials;
    case "composition":
      return blueprint.composition;
    case "background":
      return blueprint.background;
    case "constraints":
      return blueprint.constraints;
    case "validation":
      return blueprint.validation;
    default:
      return null;
  }
}

function sectionStateFromBlueprint(blueprint: RenderBlueprint, nodeId: string): SectionState {
  const section = MANAGED_SECTION_BY_NODE[nodeId];
  if (section) return blueprint.lifecycle.sections[section];
  return SectionState.EMPTY;
}

export class DecisionGraph {
  private readonly nodes = new Map<string, DecisionNode>();
  private readonly edges: DecisionEdge[];
  private readonly childrenMap: Map<string, string[]>;
  private readonly pending = new Map<string, { producer: DecisionProducerId; value: unknown; confidence: number }>();

  constructor(edges: DecisionEdge[] = DEFAULT_DECISION_EDGES) {
    this.edges = edges;
    this.childrenMap = buildChildrenMap(edges);
    for (const type of DECISION_EXECUTION_ORDER) {
      const id = DECISION_NODE_ID[type];
      this.nodes.set(id, {
        id,
        type,
        value: null,
        state: SectionState.EMPTY,
        parents: parentsFromEdges(id, edges),
        children: [],
        producer: DECISION_PRODUCERS[type],
        confidence: 0,
      });
    }
    this.refreshChildren();
  }

  static fromBlueprint(blueprint: RenderBlueprint, edges?: DecisionEdge[]): DecisionGraph {
    const graph = new DecisionGraph(edges);
    graph.hydrateFromBlueprint(blueprint);
    return graph;
  }

  hydrateFromBlueprint(blueprint: RenderBlueprint): void {
    for (const [id, node] of this.nodes) {
      node.value = sectionValueFromBlueprint(blueprint, id);
      node.state = sectionStateFromBlueprint(blueprint, id);
      node.confidence = 0;
    }
    if (blueprint.lifecycle.stage === "FROZEN" || blueprint.meta.locked) {
      this.freezeAll();
    }
  }

  getNode(id: string): DecisionNode | undefined {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    this.refreshChildren();
    return { ...node, children: [...(this.childrenMap.get(id) ?? [])] };
  }

  /** Sync node state from blueprint lifecycle / orchestrator */
  setNodeState(nodeId: string, state: SectionState): void {
    const node = this.nodes.get(nodeId);
    if (!node) throw new DecisionGraphError(`Unknown decision node: ${nodeId}`);
    node.state = state;
  }

  getAllNodes(): DecisionNode[] {
    this.refreshChildren();
    return [...this.nodes.values()].map((node) => ({
      ...node,
      children: [...(this.childrenMap.get(node.id) ?? [])],
    }));
  }

  getEdges(): readonly DecisionEdge[] {
    return this.edges;
  }

  /** Agent proposes a decision — graph first, blueprint second (Golden Rule) */
  proposeUpdate(
    nodeId: string,
    producer: DecisionProducerId,
    value: unknown,
    confidence: number,
  ): DecisionConflict | null {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new DecisionGraphError(`Unknown decision node: ${nodeId}`);
    }
    if (node.state === SectionState.LOCKED) {
      throw new DecisionGraphError(`Decision node ${nodeId} is LOCKED`);
    }
    if (!agentMayProposeNode(producer, nodeId)) {
      throw new DecisionGraphError(
        `Producer ${producer} cannot own node ${nodeId} (owner: ${node.producer})`,
      );
    }

    const existing = this.pending.get(nodeId);
    if (existing && existing.producer !== producer) {
      return {
        nodeId,
        producers: [existing.producer, producer],
        reason: "Two agents proposed changes to the same decision node",
      };
    }

    this.pending.set(nodeId, { producer, value, confidence });
    return null;
  }

  /** Commit pending proposals after validation — returns dirtied downstream nodes */
  commitPending(): InvalidationResult[] {
    const results: InvalidationResult[] = [];
    for (const [nodeId, proposal] of this.pending) {
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      node.value = proposal.value;
      node.confidence = proposal.confidence;
      node.state = SectionState.DIRTY;
      results.push(this.invalidate(nodeId));
    }
    this.pending.clear();
    return results;
  }

  clearPending(): void {
    this.pending.clear();
  }

  hasPending(): boolean {
    return this.pending.size > 0;
  }

  /** Traverse descendants and mark HARD/SOFT dependents DIRTY */
  invalidate(sourceId: string): InvalidationResult {
    const dirtied: string[] = [];
    const skippedLocked: string[] = [];
    const queue = [...(this.childrenMap.get(sourceId) ?? [])];
    const visited = new Set<string>();

    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (!node) continue;

      if (node.state === SectionState.LOCKED) {
        skippedLocked.push(id);
        continue;
      }

      if (node.state !== SectionState.DIRTY) {
        node.state = SectionState.DIRTY;
      }
      dirtied.push(id);

      for (const child of this.childrenMap.get(id) ?? []) {
        queue.push(child);
      }
    }

    return { sourceId, dirtied, skippedLocked };
  }

  /** Partial rebuild entry — first DIRTY node in execution order */
  firstDirtyNode(): DecisionTypeId | null {
    for (const type of DECISION_EXECUTION_ORDER) {
      const node = this.nodes.get(DECISION_NODE_ID[type]);
      if (node?.state === SectionState.DIRTY) return type;
    }
    return null;
  }

  /** Nodes that need agent re-run (DIRTY, not LOCKED) */
  dirtyNodesInOrder(): DecisionTypeId[] {
    return DECISION_EXECUTION_ORDER.filter((type) => {
      const node = this.nodes.get(DECISION_NODE_ID[type]);
      return node?.state === SectionState.DIRTY;
    });
  }

  freezeAll(): void {
    for (const node of this.nodes.values()) {
      node.state = SectionState.LOCKED;
    }
    this.pending.clear();
  }

  validate(): GraphValidationResult {
    const issues: GraphValidationIssue[] = [];

    for (const node of this.nodes.values()) {
      if (!node.producer) {
        issues.push({
          code: "NODE_WITHOUT_OWNER",
          message: `Node ${node.id} has no producer`,
          nodeId: node.id,
        });
      }
      for (const parentId of node.parents) {
        if (!this.nodes.has(parentId)) {
          issues.push({
            code: "MISSING_PARENT",
            message: `Node ${node.id} references missing parent ${parentId}`,
            nodeId: node.id,
          });
        }
      }
    }

    const producersByNode = new Map<string, Set<DecisionProducerId>>();
    for (const node of this.nodes.values()) {
      const set = producersByNode.get(node.id) ?? new Set();
      set.add(node.producer);
      producersByNode.set(node.id, set);
    }
    for (const [nodeId, producers] of producersByNode) {
      if (producers.size > 1) {
        issues.push({
          code: "DUPLICATE_PRODUCER",
          message: `Node ${nodeId} has multiple producers: ${[...producers].join(", ")}`,
          nodeId,
        });
      }
    }

    const cycle = this.detectCycle();
    if (cycle.length) {
      issues.push({
        code: "CYCLE",
        message: `Cycle detected: ${cycle.join(" → ")}`,
      });
    }

    const unreachable = this.unreachableNodes();
    for (const nodeId of unreachable) {
      issues.push({
        code: "UNREACHABLE_NODE",
        message: `Node ${nodeId} is unreachable from creative root`,
        nodeId,
      });
    }

    return { ok: issues.length === 0, issues };
  }

  assertValid(): void {
    const result = this.validate();
    if (!result.ok) {
      throw new DecisionGraphError("Decision graph validation failed", result.issues);
    }
  }

  /** Sync graph node states into RenderBlueprint lifecycle sections */
  syncStatesToBlueprint(blueprint: RenderBlueprint): RenderBlueprint {
    const sections = { ...blueprint.lifecycle.sections };
    for (const [nodeId, section] of Object.entries(MANAGED_SECTION_BY_NODE)) {
      const node = this.nodes.get(nodeId);
      if (node) sections[section] = node.state;
    }
    return {
      ...blueprint,
      lifecycle: { ...blueprint.lifecycle, sections },
    };
  }

  /** Debug Report — Mermaid export */
  toMermaid(): string {
    const lines = ["graph TD"];
    for (const edge of this.edges) {
      if (edge.kind === DependencyKind.INFO) {
        lines.push(`  ${edge.from} -.->|info ${edge.weight}| ${edge.to}`);
      } else if (edge.kind === DependencyKind.SOFT) {
        lines.push(`  ${edge.from} -->|soft ${edge.weight}| ${edge.to}`);
      } else {
        lines.push(`  ${edge.from} -->|${edge.weight}| ${edge.to}`);
      }
    }
    return lines.join("\n");
  }

  decisionTypeForSection(section: string): DecisionTypeId | null {
    return TYPE_BY_NODE_ID[section] ?? null;
  }

  nodeIdForAgentSection(section: LifecycleManagedSection | "background"): string {
    if (section === "materials") return "materials";
    return section;
  }

  private refreshChildren(): void {
    for (const node of this.nodes.values()) {
      node.children = [...(this.childrenMap.get(node.id) ?? [])];
    }
  }

  private detectCycle(): string[] {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const path: string[] = [];

    const dfs = (id: string): string[] => {
      visited.add(id);
      stack.add(id);
      path.push(id);

      for (const child of this.childrenMap.get(id) ?? []) {
        if (!visited.has(child)) {
          const cycle = dfs(child);
          if (cycle.length) return cycle;
        } else if (stack.has(child)) {
          const start = path.indexOf(child);
          return [...path.slice(start), child];
        }
      }

      path.pop();
      stack.delete(id);
      return [];
    };

    const root = DECISION_NODE_ID[DecisionType.CREATIVE];
    return dfs(root);
  }

  private unreachableNodes(): string[] {
    const reachable = new Set<string>();
    const queue = [DECISION_NODE_ID[DecisionType.CREATIVE]];

    while (queue.length) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const child of this.childrenMap.get(id) ?? []) {
        queue.push(child);
      }
      for (const edge of this.edges) {
        if (edge.from === id && edge.kind === DependencyKind.INFO) {
          queue.push(edge.to);
        }
      }
    }

    return [...this.nodes.keys()].filter((id) => !reachable.has(id));
  }
}

export function agentIdToProducer(agentId: AgentContractId): DecisionProducerId {
  return agentId;
}

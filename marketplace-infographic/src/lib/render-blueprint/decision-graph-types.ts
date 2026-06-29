/**
 * Chapter 3.3 — Decision Dependency Graph types
 * Runtime-only decision architecture (not persisted to Prisma / Memory / JSON).
 */
import type { SectionState } from "./lifecycle-types";
import type { AgentContractId } from "./agent-contracts";

export const DecisionType = {
  CREATIVE: "CREATIVE",
  STORY: "STORY",
  SCENE: "SCENE",
  PHOTOGRAPHY: "PHOTOGRAPHY",
  CAMERA: "CAMERA",
  LIGHTING: "LIGHTING",
  MATERIAL: "MATERIAL",
  COMPOSITION: "COMPOSITION",
  BACKGROUND: "BACKGROUND",
  CONSTRAINTS: "CONSTRAINTS",
  VALIDATION: "VALIDATION",
} as const;

export type DecisionTypeId = (typeof DecisionType)[keyof typeof DecisionType];

export const DependencyKind = {
  HARD: "HARD",
  SOFT: "SOFT",
  INFO: "INFO",
} as const;

export type DependencyKindId = (typeof DependencyKind)[keyof typeof DependencyKind];

export type DecisionProducerId = AgentContractId | "orchestrator" | "system";

export type DecisionEdge = {
  from: string;
  to: string;
  reason: string;
  weight: number;
  kind: DependencyKindId;
};

export type DecisionNode<T = unknown> = {
  id: string;
  type: DecisionTypeId;
  value: T;
  state: SectionState;
  /** Stored — source of truth for upstream links */
  parents: string[];
  /** Computed at runtime from edges — never persisted */
  children: string[];
  producer: DecisionProducerId;
  confidence: number;
};

export type GraphValidationIssue = {
  code:
    | "CYCLE"
    | "MISSING_PARENT"
    | "DUPLICATE_PRODUCER"
    | "UNREACHABLE_NODE"
    | "NODE_WITHOUT_OWNER";
  message: string;
  nodeId?: string;
};

export type GraphValidationResult = {
  ok: boolean;
  issues: GraphValidationIssue[];
};

export type DecisionConflict = {
  nodeId: string;
  producers: DecisionProducerId[];
  reason: string;
};

export type InvalidationResult = {
  sourceId: string;
  /** All downstream nodes requiring re-computation (includes already DIRTY) */
  dirtied: string[];
  skippedLocked: string[];
};

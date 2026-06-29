/**
 * Chapter 4.5 — Agent Dependencies types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintSection } from "./types";

export const DependencyRequirement = {
  REQUIRED: "required",
  OPTIONAL: "optional",
  CONDITIONAL: "conditional",
} as const;

export type DependencyRequirementId =
  (typeof DependencyRequirement)[keyof typeof DependencyRequirement];

export type ConditionalDependency = {
  section: BlueprintSection;
  when: string;
  predicate?: (context: DependencyValidationContext) => boolean;
};

export type AgentDependency = {
  agentId: AgentContractId;
  consumes: BlueprintSection[];
  produces: BlueprintSection[];
  optional: BlueprintSection[];
  conditional: ConditionalDependency[];
};

export type SectionDependencyEdge = {
  from: BlueprintSection;
  to: BlueprintSection;
  kind: DependencyRequirementId;
  reason: string;
};

export type DependencyValidationContext = {
  blueprintRevision: number;
  compositeEnabled?: boolean;
  trendIntelligenceAvailable?: boolean;
};

export type DependencyViolation = {
  code:
    | "REQUIRED_MISSING"
    | "SECTION_INVALID"
    | "OWNERSHIP_CONFLICT"
    | "CIRCULAR_DEPENDENCY"
    | "AGENT_DEPENDENCY"
    | "CONDITIONAL_UNMET";
  message: string;
  section?: BlueprintSection;
  agentId?: AgentContractId;
};

export type DependencyValidationReport = {
  valid: boolean;
  agentId: AgentContractId;
  violations: DependencyViolation[];
  satisfied: BlueprintSection[];
  missing: BlueprintSection[];
};

export type DependencyPropagationResult = {
  changedSection: BlueprintSection;
  affectedSections: BlueprintSection[];
  agentsToRerun: AgentContractId[];
};

export type DependencyGraphExport = {
  nodes: BlueprintSection[];
  edges: SectionDependencyEdge[];
  topologicalOrder: BlueprintSection[];
  hasCycle: boolean;
};

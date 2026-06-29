/**
 * Chapter 4.5 — Agent Dependencies: DependencyEngine.
 *
 * Data dependencies only — agents depend on Blueprint sections, never on other agents.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintSection, RenderBlueprint } from "./types";
import { SectionState } from "./lifecycle-types";
import { AGENT_READ_MATRIX, AGENT_WRITE_MATRIX } from "./agent-matrix";
import {
  detectSectionCycle,
  downstreamSections,
  exportDependencyGraph,
  topologicalSortSections,
} from "./agent-dependency-graph";
import type {
  AgentDependency,
  ConditionalDependency,
  DependencyPropagationResult,
  DependencyValidationContext,
  DependencyValidationReport,
  DependencyViolation,
} from "./agent-dependency-types";

export {
  AGENT_DEPENDENCY_VERSION,
  AGENT_DEPENDENCY_GOLDEN_RULE,
  DEFAULT_SECTION_CHAIN,
  buildSectionDependencyEdges,
  detectSectionCycle,
  topologicalSortSections,
  downstreamSections,
  exportDependencyGraph,
} from "./agent-dependency-graph";

export type {
  AgentDependency,
  ConditionalDependency,
  DependencyRequirement,
  DependencyRequirementId,
  DependencyValidationContext,
  DependencyValidationReport,
  DependencyViolation,
  DependencyPropagationResult,
  DependencyGraphExport,
  SectionDependencyEdge,
} from "./agent-dependency-types";

/** Soft dependencies — quality boosters, pipeline continues when absent */
const AGENT_SOFT_DEPENDENCIES: Partial<Record<AgentContractId, BlueprintSection[]>> = {
  "scene-director": ["constraints"],
  "composition-director": ["background", "camera"],
};

/** Conditional dependencies — required only when predicate matches context */
const AGENT_CONDITIONAL_DEPENDENCIES: Partial<Record<AgentContractId, ConditionalDependency[]>> = {
  "commercial-photo-director": [
    {
      section: "background",
      when: "compositeEnabled",
      predicate: (ctx) => ctx.compositeEnabled === true,
    },
  ],
};

const AGENT_DEPENDENCY_CACHE = new Map<AgentContractId, AgentDependency>();

function sectionReady(blueprint: RenderBlueprint, section: BlueprintSection): boolean {
  const managed =
    blueprint.lifecycle.sections[section as keyof typeof blueprint.lifecycle.sections];
  if (managed !== undefined) {
    return (
      managed === SectionState.READY ||
      managed === SectionState.LOCKED ||
      managed === SectionState.VALIDATED
    );
  }
  const value = (blueprint as Record<string, unknown>)[section];
  if (value === undefined || value === null) return false;
  if (typeof value === "object" && Object.keys(value as object).length === 0) return false;
  return true;
}

function buildAgentDependency(agentId: AgentContractId): AgentDependency {
  const produces = [...(AGENT_WRITE_MATRIX[agentId] ?? [])];
  const reads = [...(AGENT_READ_MATRIX[agentId] ?? [])].filter((s) => s !== "meta");
  const optional = [...(AGENT_SOFT_DEPENDENCIES[agentId] ?? [])].filter(
    (s) => !reads.includes(s) && !produces.includes(s),
  );
  const consumes = reads.filter((s) => !optional.includes(s));
  const conditional = [...(AGENT_CONDITIONAL_DEPENDENCIES[agentId] ?? [])];

  return { agentId, consumes, produces, optional, conditional };
}

export function getAgentDependency(agentId: AgentContractId): AgentDependency {
  let dep = AGENT_DEPENDENCY_CACHE.get(agentId);
  if (!dep) {
    dep = buildAgentDependency(agentId);
    AGENT_DEPENDENCY_CACHE.set(agentId, dep);
  }
  return dep;
}

export function getAllAgentDependencies(): AgentDependency[] {
  return (Object.keys(AGENT_WRITE_MATRIX) as AgentContractId[]).map(getAgentDependency);
}

export function getSectionOwner(section: BlueprintSection): AgentContractId | null {
  const candidates: AgentContractId[] = [];
  for (const [agentId, writes] of Object.entries(AGENT_WRITE_MATRIX) as [
    AgentContractId,
    BlueprintSection[],
  ][]) {
    if (writes.includes(section)) candidates.push(agentId);
  }
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const stem = section === "materials" ? "material" : section;
  const specialized = candidates.find((id) => id.startsWith(`${stem}-`));
  return specialized ?? candidates[0];
}

export function validateOwnership(): string[] {
  const errors: string[] = [];
  const sections = new Set<BlueprintSection>();
  for (const writes of Object.values(AGENT_WRITE_MATRIX)) {
    for (const section of writes) sections.add(section);
  }

  for (const section of sections) {
    const candidates: AgentContractId[] = [];
    for (const [agentId, writes] of Object.entries(AGENT_WRITE_MATRIX) as [
      AgentContractId,
      BlueprintSection[],
    ][]) {
      if (writes.includes(section)) candidates.push(agentId);
    }
    if (candidates.length > 1 && getSectionOwner(section) === null) {
      errors.push(
        `Section "${section}" has unresolved multiple owners: ${candidates.join(", ")}`,
      );
    }
  }

  return errors;
}

function conditionalMet(
  req: ConditionalDependency,
  blueprint: RenderBlueprint,
  context: DependencyValidationContext,
): boolean {
  if (req.predicate && !req.predicate(context)) return true;
  return sectionReady(blueprint, req.section);
}

export function validateAgentDependencies(
  agentId: AgentContractId,
  blueprint: RenderBlueprint,
  context: DependencyValidationContext = { blueprintRevision: blueprint.meta.revision },
): DependencyValidationReport {
  const dep = getAgentDependency(agentId);
  const violations: DependencyViolation[] = [];
  const satisfied: BlueprintSection[] = [];
  const missing: BlueprintSection[] = [];

  for (const section of dep.consumes) {
    if (sectionReady(blueprint, section)) {
      satisfied.push(section);
    } else {
      missing.push(section);
      violations.push({
        code: "REQUIRED_MISSING",
        message: `Missing required section: ${section}`,
        section,
        agentId,
      });
    }
  }

  for (const req of dep.conditional) {
    const active = req.predicate?.(context) ?? false;
    if (!active) continue;
    if (conditionalMet(req, blueprint, context)) {
      satisfied.push(req.section);
    } else {
      missing.push(req.section);
      violations.push({
        code: "CONDITIONAL_UNMET",
        message: `Conditional section "${req.section}" required when ${req.when}`,
        section: req.section,
        agentId,
      });
    }
  }

  for (const section of dep.produces) {
    if (!AGENT_WRITE_MATRIX[agentId]?.includes(section)) {
      violations.push({
        code: "OWNERSHIP_CONFLICT",
        message: `Agent ${agentId} is not authorized to produce "${section}"`,
        section,
        agentId,
      });
    }
  }

  return {
    valid: violations.length === 0,
    agentId,
    violations,
    satisfied,
    missing,
  };
}

export function validateDependencyGraph(): {
  valid: boolean;
  cycle: BlueprintSection[] | null;
  topologicalOrder: BlueprintSection[];
  ownershipErrors: string[];
} {
  const cycle = detectSectionCycle();
  const ownershipErrors = validateOwnership();
  let topologicalOrder: BlueprintSection[] = [];
  if (!cycle) {
    try {
      topologicalOrder = topologicalSortSections();
    } catch {
      // cycle detected during sort
    }
  }

  return {
    valid: !cycle && ownershipErrors.length === 0,
    cycle,
    topologicalOrder,
    ownershipErrors,
  };
}

export function propagateSectionChange(
  changedSection: BlueprintSection,
): DependencyPropagationResult {
  const affectedSections = downstreamSections(changedSection);
  const agentsToRerun: AgentContractId[] = [];

  for (const section of affectedSections) {
    const owner = getSectionOwner(section);
    if (owner && !agentsToRerun.includes(owner)) {
      agentsToRerun.push(owner);
    }
  }

  return { changedSection, affectedSections, agentsToRerun };
}

export function buildExecutionPlanFromDependencies(): BlueprintSection[] {
  const cycle = detectSectionCycle();
  if (cycle) {
    throw new Error(`Circular section dependencies: ${cycle.join(" → ")}`);
  }
  return topologicalSortSections();
}

export function agentsUnaffectedBySectionChange(
  changedSection: BlueprintSection,
): AgentContractId[] {
  const { agentsToRerun } = propagateSectionChange(changedSection);
  return (Object.keys(AGENT_WRITE_MATRIX) as AgentContractId[]).filter(
    (id) => !agentsToRerun.includes(id),
  );
}

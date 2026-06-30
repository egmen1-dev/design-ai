/**
 * Chapter 4.6 — Agent Context engine.
 * Single entry point for all agent input data — read-only, isolated per execution.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_READ_MATRIX } from "./agent-matrix";
import { defaultPipelineConfiguration } from "./agent-discovery";
import { getAgentDependency } from "./agent-dependency-engine";
import { createDiagnosticContext } from "./observability-engine";
import { validateSerializable } from "./serialization";
import { SnapshotManager } from "./snapshot-manager";
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { PipelineConfig } from "./universal-agent-contract-types";
import {
  type AgentContextBuildInput,
  type AgentContextPackage,
  type AgentDiagnosticContext,
  type ContextExplainabilityEntry,
  type ContextExplainabilityReport,
  type ContextProjection,
  type ContextValidationReport,
  type ContextViolation,
  type RuntimeContext,
  type SerializedAgentContext,
} from "./agent-context-types";

export {
  type AgentContextPackage,
  type AgentContextBuildInput,
  type AgentDiagnosticContext,
  type RuntimeContext,
  type ContextValidationReport,
  type ContextViolation,
  type ContextProjection,
  type ContextExplainabilityReport,
  type ContextExplainabilityEntry,
  type SerializedAgentContext,
  type ContextViolationCode,
} from "./agent-context-types";

export const AGENT_CONTEXT_VERSION = "4.6.0";

export const AGENT_CONTEXT_GOLDEN_RULE =
  "Agent Context is the only input source for any intelligent agent. " +
  "If an agent receives information from outside Agent Context, the Agent Ecosystem architecture is violated.";

const CONTEXT_SERIALIZATION_VERSION = "4.6.0";

const SECTION_LABELS: Record<BlueprintSection, string> = {
  meta: "Metadata",
  creative: "Creative Direction",
  story: "Story",
  product: "Product Analysis",
  scene: "Scene",
  photography: "Photography",
  camera: "Camera",
  lighting: "Lighting",
  materials: "Materials",
  composition: "Composition",
  background: "Background",
  render: "Render Intent",
  constraints: "Layout Constraints",
  validation: "Validation",
};

const SECRET_FIELD_PATTERN =
  /(api[_-]?key|secret|password|token|credential|bearer|authorization|private[_-]?key)/i;

const DEFAULT_RUNTIME: RuntimeContext = {
  provider: "local",
  executionLimitMs: 120_000,
  timeoutMs: 60_000,
};

function deepFreeze<T extends object>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      const child = (value as Record<string, unknown>)[key];
      if (child && typeof child === "object" && !Object.isFrozen(child)) {
        deepFreeze(child);
      }
    }
  }
  return value;
}

function estimateBytes(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

function collectSecretViolations(value: unknown, path = "context"): ContextViolation[] {
  const violations: ContextViolation[] = [];
  if (value === null || value === undefined) return violations;

  if (typeof value === "string") {
    if (SECRET_FIELD_PATTERN.test(path) && value.length > 0) {
      violations.push({
        code: "SECRET_DETECTED",
        message: `Sensitive field detected at ${path}`,
        field: path,
      });
    }
    return violations;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      violations.push(...collectSecretViolations(item, `${path}[${index}]`));
    });
    return violations;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = `${path}.${key}`;
      if (SECRET_FIELD_PATTERN.test(key)) {
        violations.push({
          code: "SECRET_DETECTED",
          message: `Sensitive field detected at ${childPath}`,
          field: childPath,
        });
      }
      violations.push(...collectSecretViolations(child, childPath));
    }
  }

  return violations;
}

function buildDiagnostics(input: AgentContextBuildInput): AgentDiagnosticContext {
  const pipelineId = input.pipelineId ?? input.diagnostics?.pipelineId ?? "pipeline";
  const base =
    input.diagnostics?.pipelineId !== undefined
      ? (input.diagnostics as AgentDiagnosticContext)
      : createDiagnosticContext({
          pipelineId,
          blueprintRevision: input.blueprint.meta.revision ?? 0,
          currentStage: input.blueprint.lifecycle.stage,
          sessionId: input.diagnostics?.sessionId ?? `session-${pipelineId}`,
        });

  return {
    ...base,
    stageId: input.diagnostics?.stageId ?? base.currentStage,
    executionNumber: input.diagnostics?.executionNumber ?? 1,
    retryCount: input.diagnostics?.retryCount ?? input.blueprint.meta.retry ?? 0,
    agentVersion: input.diagnostics?.agentVersion ?? input.agentVersion,
    buildVersion: input.diagnostics?.buildVersion ?? AGENT_CONTEXT_VERSION,
  };
}

function isolatedBlueprint(blueprint: RenderBlueprint): RenderBlueprint {
  try {
    return structuredClone(blueprint);
  } catch {
    return JSON.parse(JSON.stringify(blueprint)) as RenderBlueprint;
  }
}

function isolatedSnapshot(snapshot?: import("./snapshot-types").BlueprintSnapshot) {
  if (!snapshot) return undefined;
  try {
    return structuredClone(snapshot);
  } catch {
    return JSON.parse(JSON.stringify(snapshot)) as import("./snapshot-types").BlueprintSnapshot;
  }
}

/** Build isolated read-only Agent Context immediately before agent execution */
export function buildAgentContextPackage(input: AgentContextBuildInput): AgentContextPackage {
  const blueprint = isolatedBlueprint(input.blueprint);
  const snapshot = isolatedSnapshot(input.snapshot);
  const configuration = input.configuration ?? defaultPipelineConfiguration();
  const diagnostics = buildDiagnostics(input);
  const runtime: RuntimeContext = { ...DEFAULT_RUNTIME, ...input.runtime };

  const pkg: AgentContextPackage = {
    blueprint,
    snapshot,
    configuration,
    diagnostics,
    runtime,
  };

  return deepFreeze(pkg);
}

/** Ch 4.1 bridge — pipeline identity subset from configuration + diagnostics */
export function bridgePipelineConfig(
  pkg: AgentContextPackage,
  overrides: Partial<PipelineConfig> = {},
): PipelineConfig {
  return {
    pipelineId: overrides.pipelineId ?? pkg.diagnostics.pipelineId,
    marketplace: overrides.marketplace ?? pkg.blueprint.creative.marketplace,
    debug:
      overrides.debug ??
      (pkg.runtime.featureFlags?.debug === true || pkg.configuration.enableExperimental === true),
    seed: overrides.seed ?? pkg.blueprint.meta.seed,
  };
}

export function validateAgentContextPackage(
  pkg: AgentContextPackage,
  options: { expectedRevision?: number; verifySnapshot?: boolean } = {},
): ContextValidationReport {
  const violations: ContextViolation[] = [];

  if (!pkg.blueprint?.meta?.id) {
    violations.push({
      code: "BLUEPRINT_MISSING",
      message: "RenderBlueprint meta.id is required",
      field: "blueprint",
    });
  }

  if (options.expectedRevision !== undefined && pkg.blueprint.meta.revision !== options.expectedRevision) {
    violations.push({
      code: "BLUEPRINT_REVISION_MISMATCH",
      message: `Expected revision ${options.expectedRevision}, got ${pkg.blueprint.meta.revision}`,
      field: "blueprint.meta.revision",
    });
  }

  if (!pkg.configuration?.mode) {
    violations.push({
      code: "CONFIGURATION_MISSING",
      message: "Pipeline configuration.mode is required",
      field: "configuration",
    });
  }

  if (!pkg.diagnostics?.pipelineId) {
    violations.push({
      code: "DIAGNOSTICS_MISSING",
      message: "Diagnostic context pipelineId is required",
      field: "diagnostics",
    });
  }

  if (!pkg.runtime) {
    violations.push({ code: "RUNTIME_MISSING", message: "Runtime context is required", field: "runtime" });
  }

  if (pkg.snapshot && options.verifySnapshot !== false) {
    try {
      new SnapshotManager().verifyIntegrity(pkg.snapshot as import("./snapshot-types").BlueprintSnapshot);
    } catch (err) {
      violations.push({
        code: "SNAPSHOT_CORRUPT",
        message: err instanceof Error ? err.message : "Snapshot integrity check failed",
        field: "snapshot",
      });
    }
    if (pkg.snapshot.revision !== pkg.blueprint.meta.revision) {
      violations.push({
        code: "SNAPSHOT_REVISION_MISMATCH",
        message: `Snapshot revision ${pkg.snapshot.revision} does not match blueprint revision ${pkg.blueprint.meta.revision}`,
        field: "snapshot.revision",
      });
    }
  }

  const serializable = validateSerializable({
    blueprint: pkg.blueprint,
    configuration: pkg.configuration,
    diagnostics: pkg.diagnostics,
    runtime: pkg.runtime,
  });
  if (!serializable.ok) {
    for (const issue of serializable.issues) {
      violations.push({
        code: "NON_SERIALIZABLE",
        message: issue.message,
        field: "context",
      });
    }
  }

  violations.push(...scanContextSecurity(pkg));

  return { valid: violations.length === 0, violations };
}

export function scanContextSecurity(pkg: AgentContextPackage): ContextViolation[] {
  return collectSecretViolations({
    blueprint: pkg.blueprint,
    configuration: pkg.configuration,
    diagnostics: pkg.diagnostics,
    runtime: pkg.runtime,
  });
}

/** Context projection — lightweight blueprint view with only sections the agent may read */
export function projectAgentContext(
  pkg: AgentContextPackage,
  agentId: AgentContractId,
): ContextProjection {
  const dep = getAgentDependency(agentId);
  const matrixSections = AGENT_READ_MATRIX[agentId] ?? [];
  const sections = [...new Set([...matrixSections, ...dep.consumes, ...dep.optional])].filter(
    (s) => s !== "meta",
  );

  const projected: Record<string, unknown> = {
    meta: pkg.blueprint.meta,
    lifecycle: pkg.blueprint.lifecycle,
  };

  for (const section of sections) {
    projected[section] = (pkg.blueprint as Record<string, unknown>)[section];
  }

  const fullBytes = estimateBytes(pkg.blueprint);
  const projectedBytes = estimateBytes(projected);

  return {
    agentId,
    sections,
    blueprint: deepFreeze(projected as RenderBlueprint),
    fullBlueprintBytes: fullBytes,
    projectedBlueprintBytes: projectedBytes,
  };
}

export function explainContextUsage(
  agentId: AgentContractId,
  pkg: AgentContextPackage,
): ContextExplainabilityReport {
  const dep = getAgentDependency(agentId);
  const projection = projectAgentContext(pkg, agentId);
  const required = dep.consumes.filter((s) => s !== "meta");
  const optional = dep.optional;

  const entries: ContextExplainabilityEntry[] = [];
  const allSections = [...new Set([...required, ...optional, ...projection.sections])] as BlueprintSection[];

  for (const section of allSections) {
    if (section === "meta") continue;
    const value = (pkg.blueprint as Record<string, unknown>)[section];
    const available =
      value !== undefined &&
      value !== null &&
      !(typeof value === "object" && Object.keys(value as object).length === 0);
    const used = required.includes(section) || optional.includes(section);
    entries.push({
      section,
      label: SECTION_LABELS[section] ?? section,
      used,
      available,
    });
  }

  const missingRequired = required.filter((section) => {
    const entry = entries.find((e) => e.section === section);
    return !entry?.available;
  });

  const unusedAvailable = entries
    .filter((e) => e.available && !e.used)
    .map((e) => e.section);

  return { agentId, entries, unusedAvailable, missingRequired };
}

export function serializeAgentContext(pkg: AgentContextPackage): string {
  const payload: SerializedAgentContext = {
    version: CONTEXT_SERIALIZATION_VERSION,
    blueprint: structuredClone(pkg.blueprint) as RenderBlueprint,
    snapshot: pkg.snapshot ? structuredClone(pkg.snapshot as import("./snapshot-types").BlueprintSnapshot) : undefined,
    configuration: structuredClone(pkg.configuration),
    diagnostics: structuredClone(pkg.diagnostics) as AgentDiagnosticContext,
    runtime: structuredClone(pkg.runtime) as RuntimeContext,
  };

  const validation = validateSerializable(payload);
  if (!validation.ok) {
    throw new Error(`Agent Context is not serializable: ${validation.issues.map((i) => i.message).join("; ")}`);
  }

  return JSON.stringify(payload);
}

export function deserializeAgentContext(json: string): AgentContextPackage {
  const parsed = JSON.parse(json) as SerializedAgentContext;
  if (!parsed.version || !parsed.blueprint) {
    throw new Error("Invalid serialized Agent Context");
  }

  return buildAgentContextPackage({
    blueprint: parsed.blueprint,
    snapshot: parsed.snapshot,
    configuration: parsed.configuration,
    diagnostics: parsed.diagnostics,
    runtime: parsed.runtime,
  });
}

/** Detect mutation of frozen context — read-only policy enforcement */
export function detectContextMutation(
  before: AgentContextPackage,
  after: AgentContextPackage,
): ContextViolation[] {
  const violations: ContextViolation[] = [];
  if (before.blueprint.meta.revision !== after.blueprint.meta.revision) {
    violations.push({
      code: "CONTEXT_MUTATED",
      message: "Blueprint revision changed inside Agent Context",
      field: "blueprint.meta.revision",
    });
  }
  if (JSON.stringify(before.configuration) !== JSON.stringify(after.configuration)) {
    violations.push({
      code: "CONTEXT_MUTATED",
      message: "Pipeline configuration mutated inside Agent Context",
      field: "configuration",
    });
  }
  return violations;
}

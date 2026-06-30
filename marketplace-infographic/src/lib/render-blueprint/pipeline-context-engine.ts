/**
 * Chapter 6.2 — Pipeline Context engine.
 * Single source of truth working memory for every generation across Design Pipeline.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { retrieveKnowledgePackage } from "./knowledge-retrieval-engine";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import { createOrchestratorPipelineContext } from "./pipeline-orchestrator-engine";
import {
  PipelineContextLifecycle,
  PipelineContextSection,
  type AgentContextView,
  type GenerationPipelineContext,
  type PipelineContextAuditEntry,
  type PipelineContextConsistencyReport,
  type PipelineContextFailureCode,
  type PipelineContextLifecycleId,
  type PipelineContextOptions,
  type PipelineContextPatch,
  type PipelineContextSectionId,
  type PipelineContextSnapshot,
  type PipelineContextSystemReport,
  type PipelineContextViolation,
} from "./pipeline-context-types";

export {
  PipelineContextSection,
  PipelineContextLifecycle,
  type PipelineContextSectionId,
  type PipelineContextLifecycleId,
  type ProductContext,
  type MarketplaceContext,
  type BusinessGoalContext,
  type BrandProfile,
  type CommercialBusinessModelContext,
  type AudienceProfile,
  type BusinessContextSection,
  type KnowledgeContextSection,
  type CreativeContextSection,
  type TechnicalContextSection,
  type RenderContextSection,
  type ValidationContextSection,
  type LearningContextSection,
  type PipelineMetadata,
  type GenerationPipelineContext,
  type PipelineContextPatch,
  type PipelineContextSnapshot,
  type PipelineContextAuditEntry,
  type AgentContextView,
  type PipelineContextViolation,
  type PipelineContextConsistencyReport,
  type PipelineContextSystemReport,
  type PipelineContextOptions,
  type PipelineContextFailureCode,
} from "./pipeline-context-types";

export const PIPELINE_CONTEXT_VERSION = "6.2.0";

export const PIPELINE_CONTEXT_GOLDEN_RULE =
  "Pipeline Context is not just a data object — it is the unified working memory of Design AI Platform. " +
  "While all agents use the same Context they work as one team. Different versions of truth turn the system " +
  "into independent algorithms. Pipeline Context is the foundation of coherent Agent Ecosystem collaboration.";

export const CONTEXT_LIFECYCLE: readonly PipelineContextLifecycleId[] = [
  PipelineContextLifecycle.CREATED,
  PipelineContextLifecycle.ENRICHED,
  PipelineContextLifecycle.CREATIVE_READY,
  PipelineContextLifecycle.TECHNICAL_READY,
  PipelineContextLifecycle.RENDER_READY,
  PipelineContextLifecycle.VALIDATED,
  PipelineContextLifecycle.LEARNING_READY,
  PipelineContextLifecycle.ARCHIVED,
] as const;

export const CONTEXT_SECTION_OWNERS: Record<PipelineContextSectionId, AgentContractId[]> = {
  [PipelineContextSection.BUSINESS]: ["product-analyzer"],
  [PipelineContextSection.KNOWLEDGE]: [],
  [PipelineContextSection.CREATIVE]: ["visual-story-director", "scene-director"],
  [PipelineContextSection.TECHNICAL]: [
    "composition-director",
    "lighting-director",
    "camera-director",
    "material-director",
    "commercial-photo-director",
  ],
  [PipelineContextSection.RENDER]: ["flux-adapter"],
  [PipelineContextSection.VALIDATION]: ["chief-design-director", "vision-quality-director", "consensus-engine"],
  [PipelineContextSection.LEARNING]: ["design-memory"],
};

export const STANDARD_CONTEXT_SNAPSHOTS = [
  "business_ready",
  "creative_ready",
  "render_ready",
] as const;

const LIFECYCLE_TRANSITIONS: Record<PipelineContextLifecycleId, PipelineContextLifecycleId[]> = {
  [PipelineContextLifecycle.CREATED]: [PipelineContextLifecycle.ENRICHED],
  [PipelineContextLifecycle.ENRICHED]: [PipelineContextLifecycle.CREATIVE_READY],
  [PipelineContextLifecycle.CREATIVE_READY]: [PipelineContextLifecycle.TECHNICAL_READY],
  [PipelineContextLifecycle.TECHNICAL_READY]: [PipelineContextLifecycle.RENDER_READY],
  [PipelineContextLifecycle.RENDER_READY]: [PipelineContextLifecycle.VALIDATED],
  [PipelineContextLifecycle.VALIDATED]: [PipelineContextLifecycle.LEARNING_READY],
  [PipelineContextLifecycle.LEARNING_READY]: [PipelineContextLifecycle.ARCHIVED],
  [PipelineContextLifecycle.ARCHIVED]: [],
};

const AGENT_SECTION_ACCESS: Partial<Record<AgentContractId, PipelineContextSectionId[]>> = {
  "lighting-director": [
    PipelineContextSection.BUSINESS,
    PipelineContextSection.KNOWLEDGE,
    PipelineContextSection.CREATIVE,
    PipelineContextSection.TECHNICAL,
  ],
  "design-memory": [
    PipelineContextSection.BUSINESS,
    PipelineContextSection.VALIDATION,
    PipelineContextSection.LEARNING,
  ],
};

let auditCounter = 0;
let snapshotCounter = 0;

function violation(
  code: PipelineContextFailureCode,
  message: string,
  agentId?: AgentContractId,
  section?: PipelineContextSectionId,
): PipelineContextViolation {
  return { code, message, agentId, section };
}

export function createGenerationPipelineContext(
  overrides: Partial<GenerationPipelineContext> = {},
): GenerationPipelineContext {
  const input = buildDefaultPipelineInput();
  const pipelineId = overrides.pipelineId ?? `ctx-${input.category}-${Date.now()}`;
  const knowledge = retrieveKnowledgePackage({
    context: {
      category: input.category,
      marketplace: input.marketplace,
      businessGoal: input.businessGoal,
      semanticQuery: `${input.category} ${input.businessGoal}`,
    },
    limit: 8,
    useCache: false,
  });

  const blueprint =
    overrides.blueprint ?? createEmptyRenderBlueprint({ seed: 42, category: input.category });
  const now = Date.now();

  return {
    pipelineId,
    projectId: overrides.projectId ?? `project-${input.category}`,
    business: {
      product: {
        imageRef: input.productImageRef,
        category: input.category,
        name: input.brand,
      },
      marketplace: { id: input.marketplace, name: input.marketplace },
      businessGoal: { goal: input.businessGoal, priority: "conversion" },
      brand: { name: input.brand ?? "default", tone: "commercial" },
      targetAudience: { segment: input.targetAudience ?? "general", locale: "ru" },
    },
    knowledge: {
      package: knowledge,
      loadedAt: now,
      version: PIPELINE_CONTEXT_VERSION,
    },
    creative: {
      story: { ...(blueprint.story as unknown as Record<string, unknown>) },
      style: { tone: blueprint.creative?.emotionalTone ?? "commercial" },
      scene: { ...(blueprint.scene as unknown as Record<string, unknown>) },
    },
    technical: {
      camera: { ...(blueprint.camera as unknown as Record<string, unknown>) },
      lighting: { ...(blueprint.lighting as unknown as Record<string, unknown>) },
      materials: { ...(blueprint.materials as unknown as Record<string, unknown>) },
      composition: { ...(blueprint.composition as unknown as Record<string, unknown>) },
    },
    render: {
      provider: "flux",
      settings: {},
      status: "pending",
    },
    validation: {
      consensusPassed: false,
      chiefApproved: false,
      violations: [],
    },
    learning: {
      designMemoryUpdated: false,
      feedbackCollected: false,
    },
    blueprint,
    metadata: {
      constraints: input.projectConstraints ?? [],
      revision: 0,
      createdAt: now,
      updatedAt: now,
    },
    lifecycle: PipelineContextLifecycle.CREATED,
    ...overrides,
  };
}

export function createContextFromOrchestrator(
  orchestratorCtx = createOrchestratorPipelineContext(),
): GenerationPipelineContext {
  return createGenerationPipelineContext({
    pipelineId: orchestratorCtx.pipelineId,
    projectId: orchestratorCtx.projectId,
    blueprint: orchestratorCtx.blueprint,
    business: {
      product: {
        imageRef: String(orchestratorCtx.product.imageRef ?? ""),
        category: String(orchestratorCtx.product.category ?? ""),
      },
      marketplace: { id: orchestratorCtx.marketplace, name: orchestratorCtx.marketplace },
      businessGoal: { goal: String(orchestratorCtx.businessGoal.goal ?? "") },
      brand: { name: String(orchestratorCtx.product.brand ?? "default") },
      targetAudience: { segment: String(orchestratorCtx.businessGoal.audience ?? "general") },
    },
    knowledge: {
      package: orchestratorCtx.knowledge,
      loadedAt: Date.now(),
      version: PIPELINE_CONTEXT_VERSION,
    },
    lifecycle: PipelineContextLifecycle.ENRICHED,
  });
}

export function validateContextOwnership(
  agentId: AgentContractId,
  patch: PipelineContextPatch,
): PipelineContextViolation[] {
  const violations: PipelineContextViolation[] = [];
  const owners = CONTEXT_SECTION_OWNERS[patch.section] ?? [];

  if (owners.length > 0 && !owners.includes(agentId)) {
    violations.push(
      violation(
        "OWNERSHIP_VIOLATION",
        `Agent ${agentId} cannot patch ${patch.section} section`,
        agentId,
        patch.section,
      ),
    );
  }

  if (patch.blueprintSection) {
    const allowed = AGENT_WRITE_MATRIX[agentId] ?? [];
    if (!allowed.includes(patch.blueprintSection as (typeof allowed)[number])) {
      violations.push(
        violation(
          "CROSS_SECTION_WRITE",
          `Agent ${agentId} cannot write blueprint section ${patch.blueprintSection}`,
          agentId,
          patch.section,
        ),
      );
    }
  }

  return violations;
}

export function applyContextPatch(
  ctx: GenerationPipelineContext,
  patch: PipelineContextPatch,
  options: PipelineContextOptions = {},
): { context: GenerationPipelineContext; violations: PipelineContextViolation[]; audit?: PipelineContextAuditEntry } {
  const violations = validateContextOwnership(patch.agentId, patch);
  if (options.directMutation) {
    violations.push(violation("DIRECT_MUTATION", "Context cannot be mutated directly — use patches", patch.agentId));
  }
  if (options.crossSectionPatch) {
    violations.push(violation("CROSS_SECTION_WRITE", "Cross-section patch blocked", patch.agentId, patch.section));
  }
  if (violations.length > 0) {
    return { context: ctx, violations };
  }

  const nextRevision = ctx.metadata.revision + 1;
  const updated: GenerationPipelineContext = {
    ...ctx,
    metadata: { ...ctx.metadata, revision: nextRevision, updatedAt: Date.now() },
  };

  if (patch.section === PipelineContextSection.BUSINESS) {
    updated.business = { ...ctx.business, ...patch.changes } as GenerationPipelineContext["business"];
  } else if (patch.section === PipelineContextSection.KNOWLEDGE) {
    updated.knowledge = { ...ctx.knowledge, ...patch.changes } as GenerationPipelineContext["knowledge"];
  } else if (patch.section === PipelineContextSection.CREATIVE) {
    updated.creative = { ...ctx.creative, ...patch.changes } as GenerationPipelineContext["creative"];
  } else if (patch.section === PipelineContextSection.TECHNICAL) {
    updated.technical = { ...ctx.technical, ...patch.changes } as GenerationPipelineContext["technical"];
  } else if (patch.section === PipelineContextSection.VALIDATION) {
    updated.validation = { ...ctx.validation, ...patch.changes } as GenerationPipelineContext["validation"];
  } else if (patch.section === PipelineContextSection.LEARNING) {
    updated.learning = { ...ctx.learning, ...patch.changes } as GenerationPipelineContext["learning"];
  } else if (patch.section === PipelineContextSection.RENDER) {
    updated.render = { ...ctx.render, ...patch.changes } as GenerationPipelineContext["render"];
  }

  const audit = recordContextAudit(patch.agentId, ctx.pipelineId, Object.keys(patch.changes), patch.reason, nextRevision);

  return { context: updated, violations: [], audit };
}

export function mergeContextPatch(
  ctx: GenerationPipelineContext,
  patch: PipelineContextPatch,
): GenerationPipelineContext {
  return applyContextPatch(ctx, patch).context;
}

let auditEntries: PipelineContextAuditEntry[] = [];

export function recordContextAudit(
  agentId: AgentContractId,
  pipelineId: string,
  changedFields: string[],
  reason: string,
  blueprintRevision: number,
): PipelineContextAuditEntry {
  auditCounter += 1;
  const entry: PipelineContextAuditEntry = {
    id: `ctx-audit-${auditCounter}`,
    pipelineId,
    agentId,
    changedFields,
    timestamp: Date.now(),
    reason,
    blueprintRevision,
  };
  auditEntries.push(entry);
  return entry;
}

export function getContextAuditTrail(pipelineId: string): PipelineContextAuditEntry[] {
  return auditEntries.filter((e) => e.pipelineId === pipelineId);
}

export function validateContextConsistency(
  ctx: GenerationPipelineContext,
  options: PipelineContextOptions = {},
): PipelineContextConsistencyReport {
  const violations: PipelineContextViolation[] = [];
  const conflicts: string[] = [];
  const missingRequired: string[] = [];

  if (!ctx.pipelineId) missingRequired.push("pipelineId");
  if (!ctx.business.businessGoal.goal) missingRequired.push("businessGoal");
  if (!ctx.business.product.imageRef) missingRequired.push("product.imageRef");
  if (ctx.knowledge.package.items.length === 0) missingRequired.push("knowledge.package");

  if (options.damagedContext) {
    violations.push(violation("DAMAGED_CONTEXT", "Context integrity check failed"));
  }

  const storySceneConflict =
    ctx.creative.story.storyType &&
    ctx.creative.scene.sceneType &&
    ctx.creative.story.storyType !== ctx.creative.scene.sceneType &&
    ctx.creative.scene.sceneType !== "lifestyle";
  if (storySceneConflict) {
    conflicts.push("story-scene-type-mismatch");
  }

  if (missingRequired.length > 0) {
    violations.push(
      violation("MISSING_REQUIRED_DATA", `Missing required fields: ${missingRequired.join(", ")}`),
    );
  }
  if (conflicts.length > 0) {
    violations.push(violation("CONTEXT_CONFLICT", `Conflicts detected: ${conflicts.join(", ")}`));
  }

  return {
    valid: violations.length === 0 && missingRequired.length === 0,
    violations,
    conflicts,
    missingRequired,
  };
}

export function validateContextBeforeAgentHandoff(
  ctx: GenerationPipelineContext,
  agentId: AgentContractId,
): PipelineContextViolation[] {
  const consistency = validateContextConsistency(ctx);
  if (!consistency.valid) return consistency.violations;

  if (agentId === "composition-director" && ctx.lifecycle === PipelineContextLifecycle.CREATED) {
    return [
      violation(
        "INVALID_LIFECYCLE",
        "Composition director requires creative-ready context",
        agentId,
      ),
    ];
  }

  if (agentId === "flux-adapter" && ctx.lifecycle !== PipelineContextLifecycle.RENDER_READY && ctx.lifecycle !== PipelineContextLifecycle.TECHNICAL_READY) {
    return [
      violation("INVALID_LIFECYCLE", "Render adapter requires technical or render-ready context", agentId),
    ];
  }

  return [];
}

export function canTransitionContextLifecycle(
  from: PipelineContextLifecycleId,
  to: PipelineContextLifecycleId,
): boolean {
  return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionContextLifecycle(
  ctx: GenerationPipelineContext,
  to: PipelineContextLifecycleId,
): { context: GenerationPipelineContext; violations: PipelineContextViolation[] } {
  if (!canTransitionContextLifecycle(ctx.lifecycle, to)) {
    return {
      context: ctx,
      violations: [
        violation("INVALID_LIFECYCLE", `Cannot transition ${ctx.lifecycle} → ${to}`),
      ],
    };
  }
  return { context: { ...ctx, lifecycle: to }, violations: [] };
}

export function createContextSnapshot(
  ctx: GenerationPipelineContext,
  label: string,
): PipelineContextSnapshot {
  snapshotCounter += 1;
  return {
    id: `ctx-snap-${snapshotCounter}`,
    pipelineId: ctx.pipelineId,
    label,
    lifecycle: ctx.lifecycle,
    context: structuredClone(ctx),
    createdAt: Date.now(),
    blueprintRevision: ctx.metadata.revision,
  };
}

const snapshotStore = new Map<string, PipelineContextSnapshot[]>();

export function storeContextSnapshot(snapshot: PipelineContextSnapshot): void {
  const list = snapshotStore.get(snapshot.pipelineId) ?? [];
  list.push(snapshot);
  snapshotStore.set(snapshot.pipelineId, list);
}

export function getContextSnapshots(pipelineId: string): PipelineContextSnapshot[] {
  return snapshotStore.get(pipelineId) ?? [];
}

export function restoreContextFromSnapshot(
  pipelineId: string,
  snapshotId: string,
): { context: GenerationPipelineContext | null; violations: PipelineContextViolation[] } {
  const snapshots = getContextSnapshots(pipelineId);
  const snapshot = snapshots.find((s) => s.id === snapshotId);
  if (!snapshot) {
    return {
      context: null,
      violations: [violation("RECOVERY_FAILED", `Snapshot ${snapshotId} not found`)],
    };
  }
  return { context: structuredClone(snapshot.context), violations: [] };
}

export function recoverContextFromLatestSnapshot(
  pipelineId: string,
): { context: GenerationPipelineContext | null; violations: PipelineContextViolation[] } {
  const snapshots = getContextSnapshots(pipelineId);
  if (snapshots.length === 0) {
    return {
      context: null,
      violations: [violation("RECOVERY_FAILED", "No snapshots available for recovery")],
    };
  }
  const latest = snapshots[snapshots.length - 1];
  return { context: structuredClone(latest.context), violations: [] };
}

export function getAgentContextView(
  agentId: AgentContractId,
  ctx: GenerationPipelineContext,
): AgentContextView {
  const allowed = AGENT_SECTION_ACCESS[agentId] ?? [
    PipelineContextSection.BUSINESS,
    PipelineContextSection.KNOWLEDGE,
    PipelineContextSection.CREATIVE,
    PipelineContextSection.TECHNICAL,
  ];

  return {
    agentId,
    sections: allowed,
    business: allowed.includes(PipelineContextSection.BUSINESS) ? ctx.business : {},
    knowledge: allowed.includes(PipelineContextSection.KNOWLEDGE) ? ctx.knowledge : undefined,
    creative: allowed.includes(PipelineContextSection.CREATIVE) ? ctx.creative : undefined,
    technical: allowed.includes(PipelineContextSection.TECHNICAL) ? ctx.technical : undefined,
    blueprint: ctx.blueprint,
  };
}

export function buildStandardContextSnapshots(
  ctx: GenerationPipelineContext,
): PipelineContextSnapshot[] {
  const snapshots: PipelineContextSnapshot[] = [];

  const enriched = transitionContextLifecycle(ctx, PipelineContextLifecycle.ENRICHED).context;
  snapshots.push(createContextSnapshot(enriched, "business_ready"));
  storeContextSnapshot(snapshots[0]);

  const creative = transitionContextLifecycle(enriched, PipelineContextLifecycle.CREATIVE_READY).context;
  snapshots.push(createContextSnapshot(creative, "creative_ready"));
  storeContextSnapshot(snapshots[1]);

  const technical = transitionContextLifecycle(creative, PipelineContextLifecycle.TECHNICAL_READY).context;
  const renderReady = transitionContextLifecycle(technical, PipelineContextLifecycle.RENDER_READY).context;
  snapshots.push(createContextSnapshot(renderReady, "render_ready"));
  storeContextSnapshot(snapshots[2]);

  return snapshots;
}

export function validatePipelineContext(
  options: PipelineContextOptions = {},
): PipelineContextSystemReport {
  const violations: PipelineContextViolation[] = [];

  if (options.directMutation) {
    violations.push(violation("DIRECT_MUTATION", "Direct context mutation is forbidden"));
  }
  if (options.duplicateContext) {
    violations.push(violation("DUPLICATE_CONTEXT", "Agents must not maintain separate context versions"));
  }
  if (options.noAudit) {
    violations.push(violation("NO_AUDIT_TRAIL", "All context changes must be audited"));
  }

  const ctx = createGenerationPipelineContext();
  const consistency = validateContextConsistency(ctx);
  violations.push(...consistency.violations);

  const lightingPatch: PipelineContextPatch = {
    agentId: "lighting-director",
    section: PipelineContextSection.TECHNICAL,
    blueprintSection: "lighting",
    changes: { lighting: { lightingStyle: "warm-soft" } },
    reason: "Marketplace kitchen warm lighting",
  };
  const { context: patched, audit } = applyContextPatch(ctx, lightingPatch);
  if (!audit) {
    violations.push(violation("NO_AUDIT_TRAIL", "Patch merge must create audit entry"));
  }
  if (patched.metadata.revision <= ctx.metadata.revision) {
    violations.push(violation("DIRECT_MUTATION", "Patch must increment revision immutably"));
  }

  const badPatch = applyContextPatch(ctx, {
    agentId: "visual-story-director",
    section: PipelineContextSection.TECHNICAL,
    blueprintSection: "lighting",
    changes: { lighting: { lightingStyle: "harsh" } },
    reason: "invalid",
  });
  if (badPatch.violations.length === 0) {
    violations.push(violation("OWNERSHIP_VIOLATION", "Story director must not patch technical lighting"));
  }

  const snapshots = buildStandardContextSnapshots(ctx);
  if (options.missingSnapshot || snapshots.length < STANDARD_CONTEXT_SNAPSHOTS.length) {
    if (snapshots.length < STANDARD_CONTEXT_SNAPSHOTS.length) {
      violations.push(violation("MISSING_SNAPSHOT", "Standard snapshots must be created"));
    }
  }

  storeContextSnapshot(snapshots[0]);
  const recovery = recoverContextFromLatestSnapshot(ctx.pipelineId);
  if (!recovery.context) {
    violations.push(violation("RECOVERY_FAILED", "Context recovery from snapshot failed"));
  }

  const lightingView = getAgentContextView("lighting-director", ctx);
  if (lightingView.sections.includes(PipelineContextSection.LEARNING)) {
    violations.push(violation("CONTEXT_INCOMPLETE", "Lighting director must not receive learning state"));
  }

  const orchCtx = createContextFromOrchestrator();
  if (orchCtx.knowledge.package.items.length === 0) {
    violations.push(violation("CONTEXT_INCOMPLETE", "Orchestrator bridge must preserve knowledge package"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    singleSourceOfTruth: !options.duplicateContext,
    snapshotCapable: snapshots.length >= 3,
    recoveryCapable: !!recovery.context,
    auditTrailActive: auditEntries.length > 0 || !!audit,
    scalable: Object.keys(CONTEXT_SECTION_OWNERS).length === 7,
  };
}

export function assertPipelineContext(options?: PipelineContextOptions): PipelineContextSystemReport {
  const report = validatePipelineContext(options);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Pipeline Context validation failed: ${messages}`);
  }
  return report;
}

export function runPipelineContext(options: PipelineContextOptions = {}): PipelineContextSystemReport {
  return validatePipelineContext(options);
}

export function isPipelineContextFailure(code: string): code is PipelineContextFailureCode {
  const codes: PipelineContextFailureCode[] = [
    "DIRECT_MUTATION",
    "DUPLICATE_CONTEXT",
    "OWNERSHIP_VIOLATION",
    "CONTEXT_CONFLICT",
    "MISSING_REQUIRED_DATA",
    "MISSING_SNAPSHOT",
    "NO_AUDIT_TRAIL",
    "DAMAGED_CONTEXT",
    "INVALID_LIFECYCLE",
    "CROSS_SECTION_WRITE",
    "RECOVERY_FAILED",
    "CONTEXT_INCOMPLETE",
  ];
  return codes.includes(code as PipelineContextFailureCode);
}

export function resetPipelineContextStores(): void {
  auditEntries = [];
  snapshotStore.clear();
  auditCounter = 0;
  snapshotCounter = 0;
}

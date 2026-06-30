/**
 * Chapter 4.26 — Explainability Architecture engine.
 * Every design decision must be authored, reasoned, sourced, dependent, and reproducible.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildSectionDependencyEdges } from "./agent-dependency-graph";
import { getSectionOwner } from "./agent-dependency-engine";
import { buildMutationHistory } from "./blueprint-evolution-engine";
import { extractRenderIntent } from "./render-intent";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  type ConfidenceChainEntry,
  type ConfidenceChainResult,
  type DebugTrace,
  type ExplainabilityDecisionGraph,
  type ExplainabilityDecisionGraphEdge,
  type ExplainabilityDecisionGraphNode,
  type DecisionMetadata,
  type ExplainabilityArchitectureContext,
  type ExplainabilityArchitectureReport,
  type ExplainabilityFailureCode,
  type ExplainabilityViolation,
  type ExplainableDecision,
  type HumanReadableEntry,
  type HumanReadableReport,
  type RetryExplainabilityChange,
  type StructuredReason,
  type TraceabilityChain,
} from "./explainability-architecture-types";

export {
  type DecisionMetadata,
  type StructuredReason,
  type ExplainableDecision,
  type ExplainabilityDecisionGraphNode,
  type ExplainabilityDecisionGraphEdge,
  type ExplainabilityDecisionGraph,
  type ConfidenceChainEntry,
  type ConfidenceChainResult,
  type TraceabilityChain,
  type HumanReadableEntry,
  type HumanReadableReport,
  type RetryExplainabilityChange,
  type DebugTrace,
  type ExplainabilityViolation,
  type ExplainabilityArchitectureContext,
  type ExplainabilityArchitectureReport,
  type ExplainabilityFailureCode,
} from "./explainability-architecture-types";

export const EXPLAINABILITY_ARCHITECTURE_VERSION = "4.26.0";

export const EXPLAINABILITY_GOLDEN_RULE =
  "In Design AI there are no decisions that appeared 'just because'. " +
  "Every decision has an author, a reason, knowledge sources, dependencies, and an expected effect. " +
  "If any element is missing, the decision is architecturally invalid.";

export const EXPLAINABILITY_PIPELINE = [
  "agent",
  "decision",
  "reason",
  "blueprint",
  "render-intent",
  "image",
] as const;

/** Creative decision sections tracked by Explainability Architecture */
export const EXPLAINABILITY_DECISION_SECTIONS: BlueprintSection[] = [
  "story",
  "scene",
  "photography",
  "lighting",
  "camera",
  "materials",
  "composition",
];

const SECTION_LABELS: Record<BlueprintSection, string> = {
  meta: "Meta",
  creative: "Creative",
  story: "Story",
  product: "Product",
  scene: "Scene",
  photography: "Photography",
  camera: "Camera",
  lighting: "Lighting",
  materials: "Materials",
  composition: "Composition",
  background: "Background",
  render: "Render",
  constraints: "Constraints",
  validation: "Validation",
};

function violation(
  code: ExplainabilityViolation["code"],
  message: string,
  extras?: Pick<ExplainabilityViolation, "section" | "agentId">,
): ExplainabilityViolation {
  return { code, message, ...extras };
}

function upstreamSections(section: BlueprintSection): BlueprintSection[] {
  const edges = buildSectionDependencyEdges();
  const result = new Set<BlueprintSection>();
  const queue = [section];
  while (queue.length) {
    const node = queue.shift()!;
    for (const edge of edges) {
      if (edge.to === node && !result.has(edge.from)) {
        result.add(edge.from);
        queue.push(edge.from);
      }
    }
  }
  return [...result];
}

function hasPayload(section: BlueprintSection, blueprint: Readonly<RenderBlueprint>): boolean {
  const value = (blueprint as Record<string, unknown>)[section];
  if (value === undefined || value === null) return false;
  if (typeof value === "object" && Object.keys(value as object).length === 0) return false;
  return true;
}

function summarizeDecision(blueprint: Readonly<RenderBlueprint>, section: BlueprintSection): unknown {
  const payload = (blueprint as Record<string, unknown>)[section];
  if (!payload || typeof payload !== "object") return null;

  switch (section) {
    case "story":
      return {
        storyType: (payload as Record<string, unknown>).storyType,
        emotionalTone: (payload as Record<string, unknown>).emotionalTone,
        hook: (payload as Record<string, unknown>).hook,
      };
    case "scene":
      return {
        sceneType: (payload as Record<string, unknown>).sceneType,
        environment: (payload as Record<string, unknown>).environment,
        architecture: (payload as Record<string, unknown>).architecture,
      };
    case "photography":
      return {
        photographyStyle: (payload as Record<string, unknown>).photographyStyle,
        visualMood: (payload as Record<string, unknown>).visualMood,
      };
    case "lighting":
      return {
        lightingStyle: (payload as Record<string, unknown>).lightingStyle,
        lightingScheme: (payload as Record<string, unknown>).lightingScheme,
      };
    case "camera":
      return {
        lens: (payload as Record<string, unknown>).lens,
        cameraStyle: (payload as Record<string, unknown>).cameraStyle,
        aperture: (payload as Record<string, unknown>).aperture,
      };
    case "materials":
      return {
        materialPalette: (payload as Record<string, unknown>).materialPalette,
        surfaceFinish: (payload as Record<string, unknown>).surfaceFinish,
      };
    case "composition":
      return {
        template: (payload as Record<string, unknown>).template,
        heroArea: (payload as Record<string, unknown>).heroArea,
      };
    default:
      return payload;
  }
}

function formatDecisionLabel(decision: unknown): string {
  if (!decision || typeof decision !== "object") return String(decision ?? "unknown");
  const record = decision as Record<string, unknown>;
  const parts = Object.entries(record)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
  return parts.length ? parts.join(" · ") : "defined";
}

function inferReason(
  blueprint: Readonly<RenderBlueprint>,
  section: BlueprintSection,
): { reason: string; structured: StructuredReason } {
  const creative = blueprint.creative;
  const decision = summarizeDecision(blueprint, section);

  switch (section) {
    case "story": {
      const tone = blueprint.story.emotionalTone ?? creative.emotion;
      return {
        reason: `Target audience (${creative.audience}) and ${creative.goal} goal require ${tone} narrative positioning.`,
        structured: {
          summary: `Story aligned to ${creative.goal} commercial goal`,
          commercialGoal: creative.goal,
          audienceFit: creative.audience,
          visualEffect: blueprint.story.visualPromise || blueprint.story.hook,
          knowledgeSources: ["creative-goal", "marketplace-rules", "audience-profile"],
          tags: ["story", tone, creative.priceSegment],
        },
      };
    }
    case "scene":
      return {
        reason: `Scene environment supports story emotion (${blueprint.story.emotionalTone}) and product category context.`,
        structured: {
          summary: `Scene realizes story in a believable commercial environment`,
          commercialGoal: creative.goal,
          audienceFit: creative.audience,
          visualEffect: String(blueprint.scene.environment ?? blueprint.scene.sceneType ?? "context"),
          knowledgeSources: ["story", "product-category", "marketplace-context"],
          tags: ["scene", String(blueprint.scene.sceneType ?? "environment")],
        },
      };
    case "photography":
      return {
        reason: `Photography style harmonizes scene (${blueprint.scene.environment}) with marketplace ${creative.marketplace} standards.`,
        structured: {
          summary: "Photography defines commercial capture intent",
          commercialGoal: creative.goal,
          visualEffect: blueprint.photography.visualMood ?? blueprint.photography.photographyStyle,
          knowledgeSources: ["scene", "story", "marketplace-rules"],
          tags: ["photography", String(blueprint.photography.photographyStyle ?? "commercial")],
        },
      };
    case "lighting":
      return {
        reason: `Luxury and comfort products perform better with natural soft lighting aligned to ${blueprint.story.emotionalTone} story.`,
        structured: {
          summary: "Lighting supports product hero readability and emotional tone",
          commercialGoal: creative.goal,
          visualEffect: `${blueprint.lighting.lightingStyle ?? "soft"} illumination`,
          knowledgeSources: ["story", "photography", "scene", "product-fidelity"],
          tags: ["lighting", String(blueprint.lighting.lightingScheme ?? "soft-light")],
        },
      };
    case "camera":
      return {
        reason: `Lens and framing chosen to preserve product fidelity while matching photography mood (${blueprint.photography.visualMood}).`,
        structured: {
          summary: "Camera geometry supports hero product presentation",
          visualEffect: `lens ${blueprint.camera.lens ?? 50}mm perspective`,
          knowledgeSources: ["photography", "composition", "product-fidelity"],
          tags: ["camera", String(blueprint.camera.cameraStyle ?? "commercial")],
        },
      };
    case "materials":
      return {
        reason: `Material response calibrated for lighting (${blueprint.lighting.lightingScheme}) and truthful product surfaces.`,
        structured: {
          summary: "Materials preserve believable surface behavior under chosen light",
          visualEffect: "accurate surface reflection and texture",
          knowledgeSources: ["lighting", "product", "photography"],
          tags: ["materials", "surface-fidelity"],
        },
      };
    case "composition":
      return {
        reason: `Layout template optimizes marketplace CTR for ${creative.marketplace} while respecting camera and story hierarchy.`,
        structured: {
          summary: "Composition organizes visual hierarchy for commercial conversion",
          commercialGoal: creative.goal,
          audienceFit: creative.audience,
          visualEffect: blueprint.composition.template ?? "hero layout",
          knowledgeSources: ["story", "camera", "marketplace-rules"],
          tags: ["composition", String(blueprint.composition.template ?? "layout")],
        },
      };
    default:
      return {
        reason: `Decision for ${section} derived from upstream blueprint context.`,
        structured: {
          summary: `Section ${section} decision`,
          knowledgeSources: ["blueprint"],
          tags: [section],
        },
      };
  }
}

function sectionVersion(blueprint: Readonly<RenderBlueprint>, section: BlueprintSection): number {
  const history = buildMutationHistory(blueprint).filter((h) => h.section === section);
  return history.at(-1)?.version ?? (hasPayload(section, blueprint) ? 1 : 0);
}

function sectionTimestamp(blueprint: Readonly<RenderBlueprint>, section: BlueprintSection): number {
  const audit = (blueprint.meta.audit ?? []).filter((e) => e.section === section);
  return audit.at(-1)?.at ?? blueprint.meta.createdAt;
}

function resolveConfidence(
  section: BlueprintSection,
  blueprint: Readonly<RenderBlueprint>,
  ctx: ExplainabilityArchitectureContext,
): number {
  const owner = getSectionOwner(section);
  if (owner && ctx.agentConfidences?.[owner] !== undefined) {
    return Math.max(0, Math.min(1, ctx.agentConfidences[owner]));
  }
  return hasPayload(section, blueprint) ? 0.75 : 0;
}

export function buildDecisionOwnershipMap(): Record<BlueprintSection, AgentContractId | null> {
  const map = {} as Record<BlueprintSection, AgentContractId | null>;
  for (const section of EXPLAINABILITY_DECISION_SECTIONS) {
    map[section] = getSectionOwner(section);
  }
  return map;
}

export function buildStructuredReason(
  blueprint: Readonly<RenderBlueprint>,
  section: BlueprintSection,
): StructuredReason {
  return inferReason(blueprint, section).structured;
}

export function buildDecisionMetadata(
  blueprint: Readonly<RenderBlueprint>,
  section: BlueprintSection,
  ctx: ExplainabilityArchitectureContext = {},
): DecisionMetadata {
  const owner = getSectionOwner(section);
  const { reason, structured } = inferReason(blueprint, section);
  return {
    agent: owner ?? "unknown",
    reason,
    confidence: resolveConfidence(section, blueprint, ctx),
    knowledgeSources: structured.knowledgeSources,
    dependencies: upstreamSections(section).filter((s) =>
      EXPLAINABILITY_DECISION_SECTIONS.includes(s),
    ),
    timestamp: sectionTimestamp(blueprint, section),
    version: sectionVersion(blueprint, section),
  };
}

export function buildExplainableDecision(
  blueprint: Readonly<RenderBlueprint>,
  section: BlueprintSection,
  ctx: ExplainabilityArchitectureContext = {},
): ExplainableDecision {
  const decision = summarizeDecision(blueprint, section);
  const { reason, structured } = inferReason(blueprint, section);
  const metadata = buildDecisionMetadata(blueprint, section, ctx);

  return {
    decision,
    reason,
    structuredReason: structured,
    confidence: metadata.confidence,
    dependencies: metadata.dependencies,
    alternatives: [],
    metadata,
  };
}

export function buildExplainabilityDecisionGraph(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ExplainabilityArchitectureContext = {},
): ExplainabilityDecisionGraph {
  const edges: ExplainabilityDecisionGraphEdge[] = buildSectionDependencyEdges()
    .filter(
      (e) =>
        EXPLAINABILITY_DECISION_SECTIONS.includes(e.from) &&
        EXPLAINABILITY_DECISION_SECTIONS.includes(e.to),
    )
    .map((e) => ({ from: e.from, to: e.to, reason: e.reason }));

  const nodes: ExplainabilityDecisionGraphNode[] = EXPLAINABILITY_DECISION_SECTIONS.map((section) => {
    const explainable = buildExplainableDecision(blueprint, section, ctx);
    return {
      section,
      owner: getSectionOwner(section),
      decision: explainable.decision,
      reason: explainable.reason,
      confidence: explainable.confidence,
      dependencies: upstreamSections(section).filter((s) =>
        EXPLAINABILITY_DECISION_SECTIONS.includes(s),
      ),
      version: explainable.metadata.version,
    };
  });

  const topologicalOrder = nodes
    .map((n) => n.section)
    .sort(
      (a, b) =>
        EXPLAINABILITY_DECISION_SECTIONS.indexOf(a) - EXPLAINABILITY_DECISION_SECTIONS.indexOf(b),
    );

  return { nodes, edges, topologicalOrder };
}

export function getDependencyTrace(section: BlueprintSection): BlueprintSection[] {
  return upstreamSections(section).filter((s) => EXPLAINABILITY_DECISION_SECTIONS.includes(s));
}

export function computeConfidenceChain(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ExplainabilityArchitectureContext = {},
): ConfidenceChainResult {
  const entries: ConfidenceChainEntry[] = [];
  let weakestLink: BlueprintSection | null = null;
  let weakestConfidence = 1;

  for (const section of EXPLAINABILITY_DECISION_SECTIONS) {
    const confidence = resolveConfidence(section, blueprint, ctx);
    const deps = getDependencyTrace(section);
    const depConfidences = deps.map((d) => resolveConfidence(d, blueprint, ctx));
    const minUpstream = depConfidences.length ? Math.min(...depConfidences) : 1;
    const propagated = Math.min(confidence, minUpstream);
    const weakestUpstream =
      deps.length > 0
        ? deps.reduce((min, d) =>
            resolveConfidence(d, blueprint, ctx) <
            resolveConfidence(min, blueprint, ctx)
              ? d
              : min,
          deps[0])
        : undefined;

    entries.push({
      section,
      confidence,
      propagatedConfidence: propagated,
      weakestUpstream,
    });

    if (propagated < weakestConfidence) {
      weakestConfidence = propagated;
      weakestLink = section;
    }
  }

  const overallConfidence =
    entries.length > 0 ? Math.min(...entries.map((e) => e.propagatedConfidence)) : 0;

  return { entries, overallConfidence, weakestLink };
}

export function traceElement(
  blueprint: Readonly<RenderBlueprint>,
  section: BlueprintSection = "lighting",
): TraceabilityChain {
  const owner = getSectionOwner(section);
  const decision = summarizeDecision(blueprint, section);
  const element = formatDecisionLabel(decision);

  const upstream = getDependencyTrace(section)
    .reverse()
    .map((dep) => {
      const depDecision = summarizeDecision(blueprint, dep);
      const { reason } = inferReason(blueprint, dep);
      return {
        section: dep,
        decision: formatDecisionLabel(depDecision),
        reason,
      };
    });

  return { element, section, owner, upstream };
}

export function buildHumanReadableReport(
  blueprint: Readonly<RenderBlueprint>,
): HumanReadableReport {
  const entries: HumanReadableEntry[] = [];

  for (const section of EXPLAINABILITY_DECISION_SECTIONS) {
    if (!hasPayload(section, blueprint)) continue;
    const decision = summarizeDecision(blueprint, section);
    const { reason } = inferReason(blueprint, section);
    entries.push({
      label: SECTION_LABELS[section],
      value: formatDecisionLabel(decision),
      reason,
    });
  }

  return {
    title: "Design AI Blueprint Explainability Report",
    entries,
    pipeline: [...EXPLAINABILITY_PIPELINE],
  };
}

export function buildRetryExplainabilityDelta(
  before: Readonly<RenderBlueprint>,
  after: Readonly<RenderBlueprint>,
  change: {
    section: BlueprintSection;
    initiatedBy: string;
    reason: string;
    expectedEffect: string;
  },
): RetryExplainabilityChange {
  return {
    section: change.section,
    owner: getSectionOwner(change.section),
    decisionBefore: summarizeDecision(before, change.section),
    decisionAfter: summarizeDecision(after, change.section),
    reason: change.reason,
    initiatedBy: change.initiatedBy,
    expectedEffect: change.expectedEffect,
  };
}

export function validateRetryExplainability(
  changes: RetryExplainabilityChange[],
): ExplainabilityViolation[] {
  const violations: ExplainabilityViolation[] = [];
  for (const change of changes) {
    if (!change.reason?.trim()) {
      violations.push(
        violation(
          "RETRY_WITHOUT_EXPLANATION",
          `Retry on ${change.section} missing explanation`,
          { section: change.section, agentId: change.initiatedBy },
        ),
      );
    }
    if (!change.initiatedBy?.trim()) {
      violations.push(
        violation(
          "MISSING_OWNER",
          `Retry on ${change.section} missing initiator`,
          { section: change.section },
        ),
      );
    }
    if (!change.expectedEffect?.trim()) {
      violations.push(
        violation(
          "DECISION_WITHOUT_EFFECT",
          `Retry on ${change.section} missing expected effect`,
          { section: change.section },
        ),
      );
    }
  }
  return violations;
}

export function isBlueprintRecoverable(blueprint: Readonly<RenderBlueprint>): boolean {
  const history = buildMutationHistory(blueprint);
  const hasAudit = Boolean(blueprint.meta.audit?.length);
  const hasCreativeSections = EXPLAINABILITY_DECISION_SECTIONS.some((s) => hasPayload(s, blueprint));
  return hasAudit && history.length > 0 && hasCreativeSections;
}

export function buildDebugTrace(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ExplainabilityArchitectureContext = {},
): DebugTrace {
  const graph = buildExplainabilityDecisionGraph(blueprint, ctx);
  const confidenceChain = computeConfidenceChain(blueprint, ctx);
  const decisions = EXPLAINABILITY_DECISION_SECTIONS.map((section) =>
    buildExplainableDecision(blueprint, section, ctx),
  );
  const mutations = (blueprint.meta.audit ?? []).map((entry) => ({
    section: entry.section,
    agentId: entry.agentId,
    action: entry.action,
    timestamp: entry.at,
  }));

  return {
    mode: ctx.mode ?? "debug",
    decisions,
    graph,
    confidenceChain,
    mutations,
    retries: ctx.retryChanges ?? [],
    blueprintRecoverable: isBlueprintRecoverable(blueprint),
  };
}

export function validateDecisionOwnership(
  blueprint: Readonly<RenderBlueprint>,
): ExplainabilityViolation[] {
  const violations: ExplainabilityViolation[] = [];
  for (const section of EXPLAINABILITY_DECISION_SECTIONS) {
    if (!hasPayload(section, blueprint)) continue;
    const owner = getSectionOwner(section);
    if (!owner) {
      violations.push(
        violation("MISSING_OWNER", `No owner for section ${section}`, { section }),
      );
    }
  }
  return violations;
}

export function validateReasonFirst(
  blueprint: Readonly<RenderBlueprint>,
): ExplainabilityViolation[] {
  const violations: ExplainabilityViolation[] = [];
  for (const section of EXPLAINABILITY_DECISION_SECTIONS) {
    if (!hasPayload(section, blueprint)) continue;
    const { reason } = inferReason(blueprint, section);
    if (!reason?.trim()) {
      violations.push(
        violation("MISSING_REASON", `Section ${section} has decision without reason`, { section }),
      );
    }
  }
  return violations;
}

export function validateDependencyTrace(
  blueprint: Readonly<RenderBlueprint>,
): ExplainabilityViolation[] {
  const violations: ExplainabilityViolation[] = [];
  for (const section of EXPLAINABILITY_DECISION_SECTIONS) {
    if (!hasPayload(section, blueprint)) continue;
    const deps = getDependencyTrace(section);
    const missing = deps.filter((dep) => !hasPayload(dep, blueprint));
    if (missing.length > 0 && section !== "story") {
      violations.push(
        violation(
          "MISSING_DEPENDENCIES",
          `Section ${section} depends on unfilled upstream: ${missing.join(", ")}`,
          { section },
        ),
      );
    }
  }
  return violations;
}

export function validateExplainabilityArchitecture(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ExplainabilityArchitectureContext = {},
): ExplainabilityArchitectureReport {
  const violations: ExplainabilityViolation[] = [
    ...validateDecisionOwnership(blueprint),
    ...validateReasonFirst(blueprint),
    ...validateDependencyTrace(blueprint),
    ...(ctx.retryChanges ? validateRetryExplainability(ctx.retryChanges) : []),
  ];

  for (const section of EXPLAINABILITY_DECISION_SECTIONS) {
    if (!hasPayload(section, blueprint)) continue;
    const confidence = resolveConfidence(section, blueprint, ctx);
    if (confidence <= 0) {
      violations.push(
        violation("MISSING_CONFIDENCE", `Section ${section} has zero confidence`, { section }),
      );
    }
    const structured = buildStructuredReason(blueprint, section);
    if (!structured.knowledgeSources.length) {
      violations.push(
        violation(
          "UNEXPLAINABLE_DECISION",
          `Section ${section} lacks knowledge source attribution`,
          { section },
        ),
      );
    }
  }

  if (!isBlueprintRecoverable(blueprint)) {
    violations.push(
      violation(
        "BLUEPRINT_NOT_RECOVERABLE",
        "Blueprint cannot be reconstructed from decision history",
      ),
    );
  }

  let renderIntentOk = false;
  try {
    extractRenderIntent(blueprint);
    renderIntentOk = true;
  } catch {
    renderIntentOk = false;
  }

  if (!renderIntentOk && hasPayload("lighting", blueprint)) {
    violations.push(
      violation(
        "UNEXPLAINABLE_DECISION",
        "Render intent cannot be derived from explainable blueprint decisions",
      ),
    );
  }

  const unique = violations.filter(
    (v, i, arr) =>
      arr.findIndex((x) => x.code === v.code && x.message === v.message && x.section === v.section) ===
      i,
  );

  const graph = buildExplainabilityDecisionGraph(blueprint, ctx);
  const confidenceChain = computeConfidenceChain(blueprint, ctx);
  const humanReport = buildHumanReadableReport(blueprint);
  const ownership = buildDecisionOwnershipMap();
  const goldenRuleSatisfied = unique.length === 0;

  const report: ExplainabilityArchitectureReport = {
    explainable: goldenRuleSatisfied,
    violations: unique,
    ownership,
    graph,
    confidenceChain,
    humanReport,
    goldenRuleSatisfied,
  };

  if (ctx.mode === "debug") {
    report.debugTrace = buildDebugTrace(blueprint, ctx);
  }

  return report;
}

export function assertExplainable(
  blueprint: Readonly<RenderBlueprint>,
  ctx?: ExplainabilityArchitectureContext,
): ExplainabilityArchitectureReport {
  const report = validateExplainabilityArchitecture(blueprint, ctx);
  if (!report.explainable) {
    throw new Error(
      `Explainability violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runExplainabilityArchitecture(input: {
  blueprint: RenderBlueprint;
  ctx?: ExplainabilityArchitectureContext;
}): ExplainabilityArchitectureReport {
  return validateExplainabilityArchitecture(input.blueprint, input.ctx);
}

export function isExplainabilityFailure(code: string): code is ExplainabilityFailureCode {
  return [
    "UNEXPLAINABLE_DECISION",
    "MISSING_OWNER",
    "MISSING_REASON",
    "MISSING_DEPENDENCIES",
    "MISSING_CONFIDENCE",
    "RETRY_WITHOUT_EXPLANATION",
    "BLUEPRINT_NOT_RECOVERABLE",
    "DECISION_WITHOUT_EFFECT",
  ].includes(code);
}

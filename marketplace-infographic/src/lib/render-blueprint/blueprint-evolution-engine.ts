/**
 * Chapter 4.22 — Blueprint Evolution engine.
 * Blueprint grows incrementally — each agent adds knowledge without destroying prior sections.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";
import { getSectionOwner } from "./agent-dependency-engine";
import { DEFAULT_SECTION_CHAIN, detectSectionCycle } from "./agent-dependency-graph";
import { buildSectionVersionHistory } from "./agent-communication-protocol-engine";
import { assertNoPromptStored } from "./constitution";
import { SectionState } from "./lifecycle-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  EvolutionLayer,
  SectionCompletenessState,
  type BlueprintEvolutionReport,
  type ConsistencyValidationReport,
  type EvolutionExplainabilityEntry,
  type EvolutionLayerId,
  type EvolutionSnapshot,
  type EvolutionStage,
  type EvolutionValidationContext,
  type EvolutionViolation,
  type MutationHistoryEntry,
  type RenderReadinessReport,
  type SectionCompleteness,
} from "./blueprint-evolution-types";

export {
  EvolutionLayer,
  SectionCompletenessState,
  type EvolutionLayerId,
  type EvolutionStage,
  type SectionCompletenessStateId,
  type SectionCompleteness,
  type MutationHistoryEntry,
  type EvolutionSnapshot,
  type EvolutionViolation,
  type EvolutionExplainabilityEntry,
  type ConsistencyValidationReport,
  type RenderReadinessReport,
  type BlueprintEvolutionReport,
  type EvolutionValidationContext,
  type EvolutionFailureCode,
} from "./blueprint-evolution-types";

export const BLUEPRINT_EVOLUTION_VERSION = "4.22.0";

export const BLUEPRINT_EVOLUTION_GOLDEN_RULE =
  "Blueprint is never created whole — it evolves incrementally. " +
  "Each agent adds only its own knowledge without destroying the knowledge of other agents. " +
  "Blueprint, not prompt, is the main product of the entire Agent Ecosystem.";

export const EVOLUTION_PIPELINE: EvolutionStage[] = [
  { step: 1, section: "story", layer: EvolutionLayer.BUSINESS, agentId: "visual-story-director" },
  { step: 2, section: "scene", layer: EvolutionLayer.SPATIAL, agentId: "scene-director" },
  { step: 3, section: "composition", layer: EvolutionLayer.LAYOUT, agentId: "composition-director" },
  { step: 4, section: "photography", layer: EvolutionLayer.PHOTOGRAPHY, agentId: "commercial-photo-director" },
  { step: 5, section: "lighting", layer: EvolutionLayer.LIGHTING, agentId: "lighting-director" },
  { step: 6, section: "camera", layer: EvolutionLayer.CAMERA, agentId: "camera-director" },
  { step: 7, section: "materials", layer: EvolutionLayer.MATERIAL, agentId: "material-director" },
  { step: 8, section: "validation", layer: EvolutionLayer.VALIDATION, agentId: "chief-design-director" },
];

const LAYER_SECTIONS: Record<EvolutionLayerId, BlueprintSection[]> = {
  [EvolutionLayer.BUSINESS]: ["product", "creative", "story"],
  [EvolutionLayer.SPATIAL]: ["scene"],
  [EvolutionLayer.LAYOUT]: ["composition", "constraints"],
  [EvolutionLayer.PHOTOGRAPHY]: ["photography"],
  [EvolutionLayer.LIGHTING]: ["lighting"],
  [EvolutionLayer.CAMERA]: ["camera"],
  [EvolutionLayer.MATERIAL]: ["materials"],
  [EvolutionLayer.VALIDATION]: ["validation"],
};

const RENDER_MANDATORY_SECTIONS: BlueprintSection[] = [
  "story",
  "scene",
  "composition",
  "photography",
  "lighting",
  "camera",
  "materials",
  "validation",
];

const SECTION_REQUIRED_FIELDS: Partial<Record<BlueprintSection, string[]>> = {
  story: ["storyType", "emotionalTone"],
  scene: ["sceneType", "environment"],
  composition: ["template"],
  photography: ["photographyStyle"],
  lighting: ["lightingStyle", "lightingScheme"],
  camera: ["cameraStyle", "lens"],
  materials: ["materialWorld"],
};

const FORWARD_DEPENDENCY_ORDER: BlueprintSection[] = DEFAULT_SECTION_CHAIN;

function violation(
  code: EvolutionViolation["code"],
  message: string,
  extras?: Pick<EvolutionViolation, "section" | "agentId">,
): EvolutionViolation {
  return { code, message, ...extras };
}

function sectionIndex(section: BlueprintSection): number {
  return FORWARD_DEPENDENCY_ORDER.indexOf(section);
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

function layerForSection(section: BlueprintSection): EvolutionLayerId {
  for (const [layer, sections] of Object.entries(LAYER_SECTIONS) as [EvolutionLayerId, BlueprintSection[]][]) {
    if (sections.includes(section)) return layer;
  }
  return EvolutionLayer.VALIDATION;
}

export function buildMutationHistory(
  blueprint: Readonly<RenderBlueprint>,
): MutationHistoryEntry[] {
  const counters = new Map<BlueprintSection, number>();
  const history: MutationHistoryEntry[] = [];

  for (const entry of blueprint.meta.audit ?? []) {
    const section = entry.section as BlueprintSection;
    const version = (counters.get(section) ?? 0) + 1;
    counters.set(section, version);
    history.push({
      section,
      version,
      agentId: entry.agentId as AgentContractId,
      action: entry.action,
      timestamp: entry.at,
    });
  }

  return history;
}

export function assessSectionCompleteness(
  blueprint: Readonly<RenderBlueprint>,
  section: BlueprintSection,
): SectionCompleteness {
  const managed = blueprint.lifecycle.sections[section as keyof typeof blueprint.lifecycle.sections];
  const payload = (blueprint as Record<string, unknown>)[section];
  const history = buildMutationHistory(blueprint);
  const versions = history.filter((h) => h.section === section);
  const version = versions.at(-1)?.version ?? 0;
  const owner = getSectionOwner(section) ?? versions.at(-1)?.agentId;

  if (managed === SectionState.EMPTY && !hasValue(payload)) {
    return {
      section,
      layer: layerForSection(section),
      state: SectionCompletenessState.EMPTY,
      version,
      owner,
    };
  }

  const required = SECTION_REQUIRED_FIELDS[section] ?? [];
  const missingRequired = required.filter((field) => !hasValue((payload as Record<string, unknown>)?.[field]));

  if (missingRequired.length > 0) {
    const hasAny = required.some((field) => hasValue((payload as Record<string, unknown>)?.[field]));
    return {
      section,
      layer: layerForSection(section),
      state: hasAny ? SectionCompletenessState.PARTIAL : SectionCompletenessState.EMPTY,
      version,
      owner,
    };
  }

  if (
    typeof payload === "object" &&
    payload &&
    Object.values(payload as Record<string, unknown>).some((v) => v === "unknown")
  ) {
    return {
      section,
      layer: layerForSection(section),
      state: SectionCompletenessState.ERROR,
      version,
      owner,
    };
  }

  return {
    section,
    layer: layerForSection(section),
    state: SectionCompletenessState.FILLED,
    version,
    owner,
  };
}

export function computeEvolutionCompleteness(
  blueprint: Readonly<RenderBlueprint>,
): SectionCompleteness[] {
  return RENDER_MANDATORY_SECTIONS.map((section) => assessSectionCompleteness(blueprint, section));
}

export function computeCompletenessScore(completeness: SectionCompleteness[]): number {
  if (completeness.length === 0) return 0;
  const filled = completeness.filter((c) => c.state === SectionCompletenessState.FILLED).length;
  return Math.round((filled / completeness.length) * 100);
}

export function buildEvolutionSnapshot(blueprint: Readonly<RenderBlueprint>): EvolutionSnapshot {
  const completeness = computeEvolutionCompleteness(blueprint);
  return {
    revision: blueprint.meta.revision,
    completeness: computeCompletenessScore(completeness),
    filledSections: completeness
      .filter((c) => c.state === SectionCompletenessState.FILLED)
      .map((c) => c.section),
    layers: [...new Set(completeness.map((c) => c.layer))],
  };
}

export function validateNoBackwardModification(
  agentId: AgentContractId,
  sections: BlueprintSection[],
  blueprint: Readonly<RenderBlueprint>,
): EvolutionViolation[] {
  const allowedWrites = new Set(AGENT_WRITE_MATRIX[agentId] ?? []);
  const violations: EvolutionViolation[] = [];

  for (const section of sections) {
    if (!allowedWrites.has(section)) {
      const owner = getSectionOwner(section);
      violations.push(
        violation(
          "BACKWARD_MODIFICATION",
          `Agent ${agentId} cannot modify earlier section ${section}${owner ? ` owned by ${owner}` : ""}`,
          { agentId, section },
        ),
      );
      continue;
    }

    const state = blueprint.lifecycle.sections[section as keyof typeof blueprint.lifecycle.sections];
    if (
      (state === SectionState.LOCKED || state === SectionState.VALIDATED) &&
      !allowedWrites.has(section)
    ) {
      violations.push(
        violation(
          "BACKWARD_MODIFICATION",
          `Section ${section} is immutable — create new version instead of backward edit`,
          { agentId, section },
        ),
      );
    }
  }

  return violations;
}

export function validateIncrementalGrowth(
  before: Readonly<RenderBlueprint>,
  after: Readonly<RenderBlueprint>,
): EvolutionViolation[] {
  const violations: EvolutionViolation[] = [];
  const beforeComplete = computeEvolutionCompleteness(before);
  const afterComplete = computeEvolutionCompleteness(after);

  for (const prev of beforeComplete) {
    if (prev.state !== SectionCompletenessState.FILLED) continue;
    const next = afterComplete.find((c) => c.section === prev.section);
    if (!next) continue;

    const beforePayload = JSON.stringify((before as Record<string, unknown>)[prev.section]);
    const afterPayload = JSON.stringify((after as Record<string, unknown>)[prev.section]);
    const locked =
      before.lifecycle.sections[prev.section as keyof typeof before.lifecycle.sections] ===
      SectionState.LOCKED;

    if (locked && beforePayload !== afterPayload) {
      violations.push(
        violation(
          "NON_INCREMENTAL",
          `Locked section ${prev.section} was rewritten instead of versioned`,
          { section: prev.section },
        ),
      );
    }
  }

  const beforeFilled = beforeComplete.filter((c) => c.state === SectionCompletenessState.FILLED).length;
  const afterFilled = afterComplete.filter((c) => c.state === SectionCompletenessState.FILLED).length;
  if (afterFilled < beforeFilled) {
    violations.push(
      violation(
        "NON_INCREMENTAL",
        `Blueprint lost filled sections during evolution (${beforeFilled} → ${afterFilled})`,
      ),
    );
  }

  return violations;
}

export function validateRetryEvolution(
  before: Readonly<RenderBlueprint>,
  after: Readonly<RenderBlueprint>,
  retrySection: BlueprintSection,
): EvolutionViolation[] {
  const violations: EvolutionViolation[] = [];
  const beforeHistory = buildMutationHistory(before);
  const afterHistory = buildMutationHistory(after);

  for (const section of RENDER_MANDATORY_SECTIONS) {
    if (section === retrySection) continue;

    const beforeVersion = beforeHistory.filter((h) => h.section === section).at(-1)?.version ?? 0;
    const afterVersion = afterHistory.filter((h) => h.section === section).at(-1)?.version ?? 0;

    if (beforeVersion > 0 && afterVersion === 0) {
      violations.push(
        violation(
          "RETRY_DESTROYED_SECTION",
          `Retry of ${retrySection} destroyed prior section ${section}`,
          { section },
        ),
      );
    }

    const beforePayload = JSON.stringify((before as Record<string, unknown>)[section]);
    const afterPayload = JSON.stringify((after as Record<string, unknown>)[section]);
    const locked =
      before.lifecycle.sections[section as keyof typeof before.lifecycle.sections] === SectionState.LOCKED;

    if (locked && beforePayload !== afterPayload) {
      violations.push(
        violation(
          "RETRY_DESTROYED_SECTION",
          `Retry modified locked section ${section} — expected only ${retrySection} to evolve`,
          { section },
        ),
      );
    }
  }

  const retryVersions = afterHistory.filter((h) => h.section === retrySection);
  const beforeRetryVersions = beforeHistory.filter((h) => h.section === retrySection);
  if (retryVersions.length <= beforeRetryVersions.length) {
    violations.push(
      violation(
        "RETRY_DESTROYED_SECTION",
        `Retry of ${retrySection} did not create a new section version`,
        { section: retrySection },
      ),
    );
  }

  return violations;
}

export function validateDependencyOrder(
  blueprint: Readonly<RenderBlueprint>,
): EvolutionViolation[] {
  const violations: EvolutionViolation[] = [];

  if (detectSectionCycle()) {
    violations.push(
      violation("CYCLIC_DEPENDENCY", "Blueprint section dependency graph contains a cycle"),
    );
  }

  const completeness = computeEvolutionCompleteness(blueprint);
  for (const item of completeness) {
    if (item.state !== SectionCompletenessState.FILLED) continue;
    const idx = sectionIndex(item.section);
    for (let i = 0; i < idx; i++) {
      const prior = FORWARD_DEPENDENCY_ORDER[i];
      if (!RENDER_MANDATORY_SECTIONS.includes(prior)) continue;
      const priorState = completeness.find((c) => c.section === prior)?.state;
      if (priorState === SectionCompletenessState.EMPTY || priorState === SectionCompletenessState.ERROR) {
        violations.push(
          violation(
            "CONSISTENCY_CONFLICT",
            `Section ${item.section} is filled but dependency ${prior} is not ready`,
            { section: item.section },
          ),
        );
      }
    }
  }

  return violations;
}

export function validateSectionCompleteness(
  blueprint: Readonly<RenderBlueprint>,
): EvolutionViolation[] {
  const violations: EvolutionViolation[] = [];
  const completeness = computeEvolutionCompleteness(blueprint);

  for (const item of completeness) {
    if (item.state === SectionCompletenessState.ERROR) {
      violations.push(
        violation("UNKNOWN_SECTION", `Section ${item.section} contains unknown placeholder values`, {
          section: item.section,
        }),
      );
    }
    if (item.state === SectionCompletenessState.PARTIAL) {
      violations.push(
        violation("INCOMPLETE_SECTION", `Section ${item.section} is partially filled`, {
          section: item.section,
        }),
      );
    }
  }

  return violations;
}

export function validateMutationHistory(
  blueprint: Readonly<RenderBlueprint>,
): EvolutionViolation[] {
  const history = buildMutationHistory(blueprint);
  const violations: EvolutionViolation[] = [];

  const filled = computeEvolutionCompleteness(blueprint).filter(
    (c) => c.state === SectionCompletenessState.FILLED,
  );

  for (const item of filled) {
    const hasHistory = history.some((h) => h.section === item.section);
    if (!hasHistory) {
      violations.push(
        violation(
          "MISSING_HISTORY",
          `Filled section ${item.section} has no mutation history in blueprint audit`,
          { section: item.section },
        ),
      );
    }
  }

  return violations;
}

export function validateProviderIndependence(blueprint: Readonly<RenderBlueprint>): EvolutionViolation[] {
  const violations: EvolutionViolation[] = [];
  try {
    assertNoPromptStored(blueprint);
  } catch {
    violations.push(
      violation("PROVIDER_DEPENDENCY", "Blueprint stores provider prompt — evolution must remain provider-independent"),
    );
  }

  const providerFields = ["flux", "gpt-image", "sdxl", "pollinations", "seedream"];
  for (const section of RENDER_MANDATORY_SECTIONS) {
    const text = JSON.stringify((blueprint as Record<string, unknown>)[section] ?? "").toLowerCase();
    if (providerFields.some((p) => text.includes(p))) {
      violations.push(
        violation(
          "PROVIDER_DEPENDENCY",
          `Section ${section} embeds render provider references`,
          { section },
        ),
      );
    }
  }

  return violations;
}

export function buildEvolutionExplainability(
  blueprint: Readonly<RenderBlueprint>,
): EvolutionExplainabilityEntry[] {
  const history = buildMutationHistory(blueprint);
  const latest = buildSectionVersionHistory(blueprint);

  return history.map((entry) => {
    const current = latest.some(
      (v) => v.section === entry.section && v.version === entry.version && v.publishedAt === entry.timestamp,
    );
    return {
      section: entry.section,
      agentId: entry.agentId,
      version: entry.version,
      timestamp: entry.timestamp,
      reason: `${entry.agentId} ${entry.action} ${entry.section} v${entry.version}`,
      current,
    };
  });
}

export function validateConsistency(
  blueprint: Readonly<RenderBlueprint>,
): ConsistencyValidationReport {
  const violations = [
    ...validateDependencyOrder(blueprint),
    ...validateSectionCompleteness(blueprint),
    ...validateMutationHistory(blueprint),
    ...validateProviderIndependence(blueprint),
  ];

  return {
    valid: violations.length === 0,
    violations,
    completeness: computeEvolutionCompleteness(blueprint),
  };
}

export function validateRenderReadiness(
  blueprint: Readonly<RenderBlueprint>,
): RenderReadinessReport {
  const completeness = computeEvolutionCompleteness(blueprint);
  const missingSections = completeness
    .filter((c) => c.state !== SectionCompletenessState.FILLED)
    .map((c) => c.section);
  const violations: EvolutionViolation[] = [...missingSections.map((section) =>
    violation("NOT_RENDER_READY", `Mandatory section ${section} is not render-ready`, { section }),
  )];

  const consistency = validateConsistency(blueprint);
  violations.push(...consistency.violations);

  if (blueprint.lifecycle.stage !== "FROZEN" && blueprint.lifecycle.stage !== "RENDERING") {
    violations.push(
      violation(
        "NOT_RENDER_READY",
        `Blueprint must reach FROZEN before render adapter — current stage ${blueprint.lifecycle.stage}`,
      ),
    );
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.section === v.section) === i,
  );

  return {
    ready: unique.length === 0,
    violations: unique,
    mandatorySections: RENDER_MANDATORY_SECTIONS,
    missingSections,
    completenessScore: computeCompletenessScore(completeness),
  };
}

export function validateBlueprintEvolution(
  blueprint: Readonly<RenderBlueprint>,
  ctx: EvolutionValidationContext = {},
): BlueprintEvolutionReport {
  const violations: EvolutionViolation[] = [
    ...(ctx.agentId && ctx.mutationSections
      ? validateNoBackwardModification(ctx.agentId, ctx.mutationSections, blueprint)
      : []),
    ...(ctx.previousBlueprint
      ? validateIncrementalGrowth(ctx.previousBlueprint, blueprint)
      : []),
    ...(ctx.previousBlueprint && ctx.retrySection
      ? validateRetryEvolution(ctx.previousBlueprint, blueprint, ctx.retrySection)
      : []),
    ...validateConsistency(blueprint).violations,
  ];

  const uniqueViolations = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  const completeness = computeEvolutionCompleteness(blueprint);
  const renderReadiness = validateRenderReadiness(blueprint);

  return {
    valid: uniqueViolations.length === 0,
    violations: uniqueViolations,
    completeness,
    mutationHistory: buildMutationHistory(blueprint),
    explainability: buildEvolutionExplainability(blueprint),
    snapshot: buildEvolutionSnapshot(blueprint),
    renderReadiness,
    providerIndependent: !uniqueViolations.some((v) => v.code === "PROVIDER_DEPENDENCY"),
  };
}

export function isEvolutionFailure(code: string): code is EvolutionViolation["code"] {
  return [
    "BACKWARD_MODIFICATION",
    "MISSING_HISTORY",
    "RETRY_DESTROYED_SECTION",
    "CYCLIC_DEPENDENCY",
    "INCOMPLETE_SECTION",
    "UNKNOWN_SECTION",
    "CONSISTENCY_CONFLICT",
    "NOT_RENDER_READY",
    "NON_INCREMENTAL",
    "PROVIDER_DEPENDENCY",
  ].includes(code);
}

export function evolutionStageForSection(section: BlueprintSection): EvolutionStage | undefined {
  return EVOLUTION_PIPELINE.find((stage) => stage.section === section);
}

export function layersPresent(blueprint: Readonly<RenderBlueprint>): EvolutionLayerId[] {
  return [...new Set(computeEvolutionCompleteness(blueprint).map((c) => c.layer))];
}

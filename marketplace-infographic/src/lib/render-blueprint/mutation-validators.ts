/**
 * Chapter 3.5 — Mutation validation pipeline
 * Schema → Lifecycle → Revision → Ownership → Lock → Dependency
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { LifecycleManagedSection } from "./lifecycle-types";
import { SectionState } from "./lifecycle-types";
import {
  assertSectionWritable,
  isLifecycleFrozen,
  STAGE_EDITABLE_SECTIONS,
} from "./lifecycle";
import { assertAgentWriteAccess } from "./agent-matrix";
import { assertAgentOutputsClean, assertPhotographyMoodClean } from "./constitution";
import type { DecisionGraph } from "./decision-graph";
import { DECISION_NODE_ID } from "./decision-graph";
import type { BlueprintMutation, MutationValidationError } from "./mutation-types";
import type { SectionPayloadMap } from "./patch";

const MANAGED = new Set<string>([
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
]);

const SECTION_ALLOWED_KEYS: Record<string, readonly string[]> = {
  creative: ["marketplace", "goal", "priceSegment", "audience", "emotion"],
  story: [
    "hook",
    "customerProblem",
    "customerDesire",
    "visualPromise",
    "emotionalTone",
    "narrative",
  ],
  product: ["category", "subCategory", "dominantColor", "materials", "finish", "shape", "cutout"],
  scene: ["environment", "architecture", "timeOfDay", "weather", "depth", "surface"],
  photography: ["style", "shotType", "backgroundBlur", "contrast", "visualMood", "realism"],
  camera: ["lens", "height", "angle", "distance", "perspective"],
  lighting: [
    "preset",
    "temperature",
    "key",
    "fill",
    "rim",
    "back",
    "shadowSoftness",
    "reflectionStrength",
  ],
  materials: ["floor", "walls", "decor", "reflection", "roughness"],
  composition: [
    "template",
    "heroWeight",
    "negativeSpace",
    "balance",
    "eyeFlow",
    "foreground",
    "midground",
    "background",
  ],
  background: [
    "complexity",
    "containsPeople",
    "containsAnimals",
    "containsVehicles",
    "decorDensity",
    "secondaryObjects",
  ],
  constraints: [
    "mustLeaveHeadlineSpace",
    "mustLeaveBadgeSpace",
    "mustLeaveBenefitsSpace",
    "mustAvoidText",
    "mustAvoidDuplicateObjects",
    "mustAvoidHeroOverlap",
    "set",
  ],
  validation: [
    "storyApproved",
    "sceneApproved",
    "photoApproved",
    "layoutApproved",
    "chiefApproved",
    "professionalScore",
    "warnings",
  ],
};

const ENUM_RULES: Record<string, Record<string, readonly string[]>> = {
  scene: {
    environment: [
      "kitchen",
      "bathroom",
      "garage",
      "garden",
      "living_room",
      "studio",
      "workshop",
    ],
  },
};

function fail(
  code: MutationValidationError["code"],
  message: string,
  section?: BlueprintSection,
): MutationValidationError {
  return { code, message, section };
}

function collectStrings(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (!obj || typeof obj !== "object") return [];
  return Object.values(obj).flatMap(collectStrings);
}

export function validateMutationSchema(
  mutation: BlueprintMutation,
): MutationValidationError | null {
  const { section, payload } = mutation;
  if (section === "meta" || section === "render") {
    return fail("SCHEMA", `Section ${section} cannot be mutated by agents`, section);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fail("SCHEMA", `Payload for ${section} must be a non-null object`, section);
  }
  const allowed = SECTION_ALLOWED_KEYS[section];
  if (!allowed) {
    return fail("SECTION_NOT_FOUND", `Unknown section ${section}`, section);
  }
  for (const key of Object.keys(payload)) {
    if (!allowed.includes(key)) {
      return fail("SCHEMA", `Unknown field ${section}.${key}`, section);
    }
    const value = (payload as Record<string, unknown>)[key];
    if (value === null) {
      return fail("SCHEMA", `Null not allowed for ${section}.${key}`, section);
    }
    const enums = ENUM_RULES[section]?.[key];
    if (enums && typeof value === "string" && !enums.includes(value)) {
      return fail("SCHEMA", `Invalid enum ${section}.${key}=${value}`, section);
    }
  }
  try {
    assertAgentOutputsClean(collectStrings(payload), mutation.producer);
    if (
      section === "photography" &&
      typeof payload === "object" &&
      payload &&
      "visualMood" in payload
    ) {
      const mood = (payload as { visualMood?: string }).visualMood;
      if (mood) assertPhotographyMoodClean(mood, mutation.producer);
    }
  } catch (e) {
    return fail("SCHEMA", e instanceof Error ? e.message : "Schema validation failed", section);
  }
  return null;
}

export function validateMutationLifecycle(
  blueprint: RenderBlueprint,
  mutation: BlueprintMutation,
): MutationValidationError | null {
  const { section } = mutation;
  if (section === "meta" || section === "render") {
    return fail("LIFECYCLE", `Section ${section} is not agent-writable`, section);
  }
  if (isLifecycleFrozen(blueprint.lifecycle.stage)) {
    return fail(
      "LIFECYCLE",
      `Blueprint is ${blueprint.lifecycle.stage} — mutation rejected`,
      section,
    );
  }
  if (MANAGED.has(section)) {
    const managed = section as LifecycleManagedSection;
    if (!STAGE_EDITABLE_SECTIONS[blueprint.lifecycle.stage].includes(managed)) {
      return fail(
        "LIFECYCLE",
        `Section ${section} not editable at stage ${blueprint.lifecycle.stage}`,
        section,
      );
    }
    try {
      assertSectionWritable(blueprint, managed);
    } catch (e) {
      return fail("LIFECYCLE", e instanceof Error ? e.message : "Lifecycle blocked", section);
    }
  }
  return null;
}

export function validateMutationRevision(
  blueprint: RenderBlueprint,
  mutation: BlueprintMutation,
): MutationValidationError | null {
  const actual = blueprint.meta.revision ?? 0;
  if (mutation.expectedRevision !== actual) {
    return fail(
      "REVISION",
      `Revision mismatch: expected ${mutation.expectedRevision}, current ${actual}`,
      mutation.section,
    );
  }
  return null;
}

export function validateMutationOwnership(
  mutation: BlueprintMutation,
): MutationValidationError | null {
  try {
    assertAgentWriteAccess(mutation.producer as import("./agent-contracts").AgentContractId, mutation.section);
  } catch {
    return fail(
      "OWNERSHIP",
      `Producer ${mutation.producer} cannot write section ${mutation.section}`,
      mutation.section,
    );
  }
  return null;
}

export function validateMutationLock(
  blueprint: RenderBlueprint,
  mutation: BlueprintMutation,
): MutationValidationError | null {
  const { section } = mutation;
  if (!MANAGED.has(section)) return null;
  if (blueprint.lifecycle.sections[section as LifecycleManagedSection] === SectionState.LOCKED) {
    return fail("LOCK", `Section ${section} is LOCKED`, section);
  }
  return null;
}

export function validateMutationDependency(
  blueprint: RenderBlueprint,
  graph: DecisionGraph,
  mutation: BlueprintMutation,
): MutationValidationError | null {
  const nodeId = mutation.section === "materials" ? "materials" : mutation.section;
  if (!Object.values(DECISION_NODE_ID).includes(nodeId)) return null;

  const node = graph.getNode(nodeId);
  if (!node) return null;

  for (const parentId of node.parents) {
    const parentSection = parentId as LifecycleManagedSection;
    if (!MANAGED.has(parentSection)) continue;
    const state = blueprint.lifecycle.sections[parentSection];
    if (state === SectionState.EMPTY) {
      return fail(
        "DEPENDENCY",
        `Cannot mutate ${mutation.section}: parent ${parentSection} is EMPTY`,
        mutation.section,
      );
    }
  }
  return null;
}

export function validateMutation(
  blueprint: RenderBlueprint,
  graph: DecisionGraph,
  mutation: BlueprintMutation,
): MutationValidationError | null {
  return (
    validateMutationSchema(mutation) ??
    validateMutationLifecycle(blueprint, mutation) ??
    validateMutationRevision(blueprint, mutation) ??
    validateMutationOwnership(mutation) ??
    validateMutationLock(blueprint, mutation) ??
    validateMutationDependency(blueprint, graph, mutation)
  );
}

export function validateBatchConflicts(batch: { mutations: BlueprintMutation[] }): MutationValidationError | null {
  const seen = new Map<BlueprintSection, string>();
  for (const m of batch.mutations) {
    const prev = seen.get(m.section);
    if (prev && prev !== m.producer) {
      return fail(
        "CONFLICT",
        `Conflict on ${m.section}: ${prev} vs ${m.producer}`,
        m.section,
      );
    }
    seen.set(m.section, m.producer);
  }
  return null;
}

export function mergeSectionPayload<S extends keyof SectionPayloadMap>(
  blueprint: RenderBlueprint,
  section: S,
  payload: SectionPayloadMap[S],
): SectionPayloadMap[S] {
  const current = getSectionValue(blueprint, section as BlueprintSection);
  return { ...(current as object), ...(payload as object) } as SectionPayloadMap[S];
}

function getSectionValue(blueprint: RenderBlueprint, section: BlueprintSection): unknown {
  switch (section) {
    case "creative":
      return blueprint.creative;
    case "story":
      return blueprint.story;
    case "product":
      return blueprint.product;
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
      return {};
  }
}

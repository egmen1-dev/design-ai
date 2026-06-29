/**
 * Chapter 3.1 — RenderBlueprint lifecycle engine
 */
import { randomUUID } from "crypto";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  BlueprintLifecycle,
  SectionState,
  LIFECYCLE_MANAGED_SECTIONS,
  type BlueprintLifecycleMeta,
  type LifecycleStageSnapshot,
  type BlueprintSnapshot,
  type LifecycleManagedSection,
  type RollbackResult,
} from "./lifecycle-types";
import { SECTION_VALIDATORS, STAGE_LOCK_SECTIONS } from "./section-validators";

export class BlueprintLockedError extends Error {
  readonly section: LifecycleManagedSection | BlueprintSection;

  constructor(section: LifecycleManagedSection | BlueprintSection, message?: string) {
    super(message ?? `Blueprint section ${section} is LOCKED`);
    this.name = "BlueprintLockedError";
    this.section = section;
  }
}

export class LifecycleTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LifecycleTransitionError";
  }
}

const SECTION_STATE_ORDER: SectionState[] = [
  SectionState.EMPTY,
  SectionState.DIRTY,
  SectionState.READY,
  SectionState.VALIDATED,
  SectionState.LOCKED,
];

export function canTransitionSectionState(from: SectionState, to: SectionState): boolean {
  const fromIdx = SECTION_STATE_ORDER.indexOf(from);
  const toIdx = SECTION_STATE_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
}

export function assertSectionStateTransition(from: SectionState, to: SectionState): void {
  if (!canTransitionSectionState(from, to)) {
    throw new LifecycleTransitionError(`Invalid section state transition: ${from} → ${to}`);
  }
}

export const DEPENDENCY_CHILDREN: Record<LifecycleManagedSection, LifecycleManagedSection[]> = {
  product: [],
  creative: [
    "story",
    "scene",
    "photography",
    "camera",
    "lighting",
    "materials",
    "composition",
    "constraints",
    "validation",
  ],
  story: [
    "scene",
    "photography",
    "camera",
    "lighting",
    "materials",
    "composition",
    "constraints",
    "validation",
  ],
  scene: [
    "photography",
    "camera",
    "lighting",
    "materials",
    "composition",
    "constraints",
    "validation",
  ],
  photography: ["composition", "constraints", "validation"],
  camera: ["composition", "constraints", "validation"],
  lighting: ["composition", "constraints", "validation"],
  materials: ["composition", "constraints", "validation"],
  composition: ["constraints", "validation"],
  constraints: ["validation"],
  validation: [],
};

const LIFECYCLE_ORDER: BlueprintLifecycle[] = [
  BlueprintLifecycle.NEW,
  BlueprintLifecycle.PRODUCT_ANALYZED,
  BlueprintLifecycle.CREATIVE_DEFINED,
  BlueprintLifecycle.STORY_DEFINED,
  BlueprintLifecycle.SCENE_DEFINED,
  BlueprintLifecycle.PHOTO_DEFINED,
  BlueprintLifecycle.COMPOSITION_DEFINED,
  BlueprintLifecycle.CONSTRAINTS_DEFINED,
  BlueprintLifecycle.VALIDATED,
  BlueprintLifecycle.FROZEN,
  BlueprintLifecycle.RENDERING,
  BlueprintLifecycle.COMPOSITING,
  BlueprintLifecycle.VISION_QA,
  BlueprintLifecycle.FINISHED,
];

export const STAGE_EDITABLE_SECTIONS: Record<
  BlueprintLifecycle,
  LifecycleManagedSection[]
> = {
  NEW: [],
  PRODUCT_ANALYZED: ["product"],
  CREATIVE_DEFINED: ["creative"],
  STORY_DEFINED: ["story"],
  SCENE_DEFINED: ["scene"],
  PHOTO_DEFINED: ["photography", "camera", "lighting", "materials"],
  COMPOSITION_DEFINED: ["composition"],
  CONSTRAINTS_DEFINED: ["constraints"],
  VALIDATED: ["validation"],
  FROZEN: [],
  RENDERING: [],
  COMPOSITING: [],
  VISION_QA: [],
  FINISHED: [],
};

export function createInitialLifecycleMeta(): BlueprintLifecycleMeta {
  const sections = Object.fromEntries(
    LIFECYCLE_MANAGED_SECTIONS.map((s) => [s, SectionState.EMPTY]),
  ) as Record<LifecycleManagedSection, SectionState>;

  return { stage: BlueprintLifecycle.NEW, sections, snapshots: [] };
}

export function isLifecycleFrozen(stage: BlueprintLifecycle): boolean {
  const frozenIdx = LIFECYCLE_ORDER.indexOf(BlueprintLifecycle.FROZEN);
  return LIFECYCLE_ORDER.indexOf(stage) >= frozenIdx;
}

export function assertSectionWritable(
  blueprint: RenderBlueprint,
  section: LifecycleManagedSection,
): void {
  if (isLifecycleFrozen(blueprint.lifecycle.stage)) {
    throw new BlueprintLockedError(
      section,
      `Blueprint is ${blueprint.lifecycle.stage} — no agent may mutate data`,
    );
  }

  if (blueprint.lifecycle.sections[section] === SectionState.LOCKED) {
    throw new BlueprintLockedError(section);
  }

  if (!STAGE_EDITABLE_SECTIONS[blueprint.lifecycle.stage].includes(section)) {
    throw new LifecycleTransitionError(
      `Section ${section} is not editable at lifecycle stage ${blueprint.lifecycle.stage}`,
    );
  }
}

function cloneBlueprintShallow(bp: RenderBlueprint): RenderBlueprint {
  return {
    ...bp,
    lifecycle: {
      ...bp.lifecycle,
      sections: { ...bp.lifecycle.sections },
      snapshots: [...bp.lifecycle.snapshots],
    },
    meta: { ...bp.meta, audit: bp.meta.audit ? [...bp.meta.audit] : undefined },
  };
}

function cloneBlueprintForSnapshot(bp: RenderBlueprint): RenderBlueprint {
  return structuredClone({
    ...bp,
    lifecycle: { ...bp.lifecycle, snapshots: [] },
  });
}

export function propagateDirty(
  blueprint: RenderBlueprint,
  source: LifecycleManagedSection,
): RenderBlueprint {
  const next = cloneBlueprintShallow(blueprint);
  const queue: LifecycleManagedSection[] = [source];
  const visited = new Set<LifecycleManagedSection>();

  while (queue.length) {
    const section = queue.shift()!;
    if (visited.has(section)) continue;
    visited.add(section);

    const state = next.lifecycle.sections[section];
    if (state === SectionState.LOCKED) continue;

    if (state !== SectionState.DIRTY) {
      next.lifecycle.sections[section] = SectionState.DIRTY;
    }

    for (const child of DEPENDENCY_CHILDREN[section]) {
      queue.push(child);
    }
  }

  return next;
}

export function markSectionDirtyAfterPatch(
  blueprint: RenderBlueprint,
  section: LifecycleManagedSection,
): RenderBlueprint {
  const next = cloneBlueprintShallow(blueprint);
  const state = next.lifecycle.sections[section];
  if (state === SectionState.LOCKED) {
    throw new BlueprintLockedError(section);
  }
  next.lifecycle.sections[section] = SectionState.DIRTY;
  return propagateDirty(next, section);
}

export function createLifecycleSnapshot(blueprint: RenderBlueprint): LifecycleStageSnapshot {
  return {
    id: randomUUID(),
    stage: blueprint.lifecycle.stage,
    createdAt: Date.now(),
    blueprint: cloneBlueprintForSnapshot(blueprint),
  };
}

function lockSections(meta: BlueprintLifecycleMeta, sections: LifecycleManagedSection[]): void {
  for (const section of sections) {
    meta.sections[section] = SectionState.LOCKED;
  }
}

function validateStageBarrier(blueprint: RenderBlueprint, stage: BlueprintLifecycle): void {
  if (stage === BlueprintLifecycle.NEW) return;

  const sections = STAGE_LOCK_SECTIONS[stage];
  for (const section of sections) {
    const result = SECTION_VALIDATORS[section](blueprint);
    if (!result.ok) {
      throw new LifecycleTransitionError(
        `Validation barrier failed for ${stage} / ${section}: ${result.missing.join(", ")}`,
      );
    }
  }
}

function nextLifecycleStage(current: BlueprintLifecycle): BlueprintLifecycle {
  const idx = LIFECYCLE_ORDER.indexOf(current);
  if (idx === -1 || idx >= LIFECYCLE_ORDER.length - 1) {
    throw new LifecycleTransitionError(`No next stage after ${current}`);
  }
  return LIFECYCLE_ORDER[idx + 1];
}

export function advanceLifecycleStage(blueprint: RenderBlueprint): RenderBlueprint {
  const stage = blueprint.lifecycle.stage;

  if (stage === BlueprintLifecycle.FINISHED) {
    throw new LifecycleTransitionError("Already FINISHED");
  }

  validateStageBarrier(blueprint, stage);

  const next = cloneBlueprintShallow(blueprint);
  lockSections(next.lifecycle, STAGE_LOCK_SECTIONS[stage]);

  next.lifecycle.snapshots.push(createLifecycleSnapshot(next));

  const upcoming = nextLifecycleStage(stage);
  next.lifecycle.stage = upcoming;

  if (upcoming === BlueprintLifecycle.FROZEN) {
    next.lifecycle.frozenAt = Date.now();
    next.meta.locked = true;
  }

  return next;
}

const STAGE_PRIMARY_SECTION: Partial<Record<BlueprintLifecycle, LifecycleManagedSection>> = {
  PRODUCT_ANALYZED: "product",
  CREATIVE_DEFINED: "creative",
  STORY_DEFINED: "story",
  SCENE_DEFINED: "scene",
  PHOTO_DEFINED: "photography",
  COMPOSITION_DEFINED: "composition",
  CONSTRAINTS_DEFINED: "constraints",
  VALIDATED: "validation",
};

/** Chief Design Director — rollback via snapshot, not direct mutation */
export function rollbackToSnapshot(
  blueprint: RenderBlueprint,
  snapshotId: string,
): RollbackResult {
  const snapshot = blueprint.lifecycle.snapshots.find((s) => s.id === snapshotId);
  if (!snapshot) {
    throw new LifecycleTransitionError(`Snapshot not found: ${snapshotId}`);
  }

  const restored = structuredClone(snapshot.blueprint);
  restored.lifecycle.snapshots = [...blueprint.lifecycle.snapshots];
  restored.meta.locked = false;
  restored.lifecycle.frozenAt = undefined;

  const resumeFrom = nextLifecycleStage(snapshot.stage);
  restored.lifecycle.stage = resumeFrom;

  const primary = STAGE_PRIMARY_SECTION[snapshot.stage];
  if (primary) {
    for (const section of DEPENDENCY_CHILDREN[primary]) {
      if (restored.lifecycle.sections[section] === SectionState.LOCKED) {
        restored.lifecycle.sections[section] = SectionState.DIRTY;
      }
    }
  }

  return { blueprint: restored, resumeFrom, snapshotId };
}

export function advanceToRendering(blueprint: RenderBlueprint): RenderBlueprint {
  if (blueprint.lifecycle.stage !== BlueprintLifecycle.FROZEN) {
    throw new LifecycleTransitionError("Render requires FROZEN lifecycle state");
  }
  const next = cloneBlueprintShallow(blueprint);
  next.lifecycle.stage = BlueprintLifecycle.RENDERING;
  return next;
}

export function advancePostRenderStage(
  blueprint: RenderBlueprint,
  target:
    | typeof BlueprintLifecycle.RENDERING
    | typeof BlueprintLifecycle.COMPOSITING
    | typeof BlueprintLifecycle.VISION_QA
    | typeof BlueprintLifecycle.FINISHED,
): RenderBlueprint {
  const next = cloneBlueprintShallow(blueprint);
  next.lifecycle.stage = target;
  if (target === BlueprintLifecycle.FINISHED) {
    next.meta.locked = true;
  }
  return next;
}

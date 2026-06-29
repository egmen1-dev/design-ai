/**
 * Chapter 3.4 — Stage preconditions
 */
import type { RenderBlueprint } from "./types";
import { BlueprintLifecycle, SectionState, type LifecycleManagedSection } from "./lifecycle-types";
import type { StagePrecondition } from "./lifecycle-manager-types";
import { LifecycleTransitionError } from "./lifecycle";

export const STAGE_PRECONDITIONS: Partial<Record<BlueprintLifecycle, StagePrecondition[]>> = {
  [BlueprintLifecycle.PRODUCT_ANALYZED]: [],
  [BlueprintLifecycle.CREATIVE_DEFINED]: [{ section: "product", state: SectionState.LOCKED }],
  [BlueprintLifecycle.STORY_DEFINED]: [
    { section: "product", state: SectionState.LOCKED },
    { section: "creative", state: SectionState.LOCKED },
  ],
  [BlueprintLifecycle.SCENE_DEFINED]: [
    { section: "product", state: SectionState.LOCKED },
    { section: "creative", state: SectionState.LOCKED },
    { section: "story", state: SectionState.LOCKED },
  ],
  [BlueprintLifecycle.PHOTO_DEFINED]: [
    { section: "product", state: SectionState.LOCKED },
    { section: "creative", state: SectionState.LOCKED },
    { section: "story", state: SectionState.LOCKED },
    { section: "scene", state: SectionState.LOCKED },
  ],
  [BlueprintLifecycle.COMPOSITION_DEFINED]: [
    { section: "product", state: SectionState.LOCKED },
    { section: "creative", state: SectionState.LOCKED },
    { section: "story", state: SectionState.LOCKED },
    { section: "scene", state: SectionState.LOCKED },
    { section: "photography", state: SectionState.LOCKED },
    { section: "camera", state: SectionState.LOCKED },
    { section: "lighting", state: SectionState.LOCKED },
    { section: "materials", state: SectionState.LOCKED },
  ],
  [BlueprintLifecycle.CONSTRAINTS_DEFINED]: [
    { section: "composition", state: SectionState.LOCKED },
  ],
  [BlueprintLifecycle.VALIDATED]: [{ section: "constraints", state: SectionState.LOCKED }],
};

export function assertStagePreconditions(
  blueprint: RenderBlueprint,
  stage: BlueprintLifecycle,
): void {
  const rules = STAGE_PRECONDITIONS[stage];
  if (!rules?.length) return;

  for (const rule of rules) {
    const actual = blueprint.lifecycle.sections[rule.section as LifecycleManagedSection];
    if (actual !== rule.state) {
      throw new LifecycleTransitionError(
        `Stage ${stage} precondition failed: ${rule.section} must be ${rule.state}, got ${actual}`,
      );
    }
  }
}

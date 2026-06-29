/**
 * Chapter 3.1 — lifecycle types
 */

export const BlueprintLifecycle = {
  NEW: "NEW",
  PRODUCT_ANALYZED: "PRODUCT_ANALYZED",
  CREATIVE_DEFINED: "CREATIVE_DEFINED",
  STORY_DEFINED: "STORY_DEFINED",
  SCENE_DEFINED: "SCENE_DEFINED",
  PHOTO_DEFINED: "PHOTO_DEFINED",
  COMPOSITION_DEFINED: "COMPOSITION_DEFINED",
  CONSTRAINTS_DEFINED: "CONSTRAINTS_DEFINED",
  VALIDATED: "VALIDATED",
  FROZEN: "FROZEN",
  RENDERING: "RENDERING",
  COMPOSITING: "COMPOSITING",
  VISION_QA: "VISION_QA",
  FINISHED: "FINISHED",
} as const;

export type BlueprintLifecycle =
  (typeof BlueprintLifecycle)[keyof typeof BlueprintLifecycle];

export const SectionState = {
  EMPTY: "EMPTY",
  DIRTY: "DIRTY",
  READY: "READY",
  VALIDATED: "VALIDATED",
  LOCKED: "LOCKED",
} as const;

export type SectionState = (typeof SectionState)[keyof typeof SectionState];

export type LifecycleManagedSection =
  | "product"
  | "creative"
  | "story"
  | "scene"
  | "photography"
  | "camera"
  | "lighting"
  | "materials"
  | "composition"
  | "constraints"
  | "validation";

export const LIFECYCLE_MANAGED_SECTIONS: LifecycleManagedSection[] = [
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
];

export type BlueprintSnapshot = {
  id: string;
  stage: BlueprintLifecycle;
  createdAt: number;
  /** Immutable copy of blueprint at stage completion */
  blueprint: import("./types").RenderBlueprint;
};

export type BlueprintLifecycleMeta = {
  stage: BlueprintLifecycle;
  sections: Record<LifecycleManagedSection, SectionState>;
  snapshots: BlueprintSnapshot[];
  frozenAt?: number;
};

export type RollbackResult = {
  blueprint: import("./types").RenderBlueprint;
  /** Stage to resume pipeline from after rollback */
  resumeFrom: BlueprintLifecycle;
  snapshotId: string;
};

import type {
  BlueprintSection,
  RenderBlueprint,
  CreativeBlueprint,
  StoryBlueprint,
  ProductBlueprint,
  SceneBlueprint,
  PhotographyBlueprint,
  CameraBlueprint,
  LightingBlueprint,
  MaterialBlueprint,
  CompositionBlueprint,
  BackgroundBlueprint,
  ConstraintBlueprint,
  ValidationBlueprint,
} from "./types";
import type { LifecycleManagedSection } from "./lifecycle-types";
import {
  assertAgentMayWriteSection,
  assertAgentOutputsClean,
  assertPhotographyMoodClean,
} from "./constitution";
import {
  assertSectionWritable,
  markSectionDirtyAfterPatch,
} from "./lifecycle";

const MANAGED_SET = new Set<string>([
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

function isManagedSection(section: keyof SectionPayloadMap): section is LifecycleManagedSection {
  return MANAGED_SET.has(section);
}

export type SectionPayloadMap = {
  creative: Partial<CreativeBlueprint>;
  story: Partial<StoryBlueprint>;
  product: Partial<ProductBlueprint>;
  scene: Partial<SceneBlueprint>;
  photography: Partial<PhotographyBlueprint>;
  camera: Partial<CameraBlueprint>;
  lighting: Partial<LightingBlueprint>;
  materials: Partial<MaterialBlueprint>;
  composition: Partial<CompositionBlueprint>;
  background: Partial<BackgroundBlueprint>;
  constraints: Partial<ConstraintBlueprint>;
  validation: Partial<ValidationBlueprint>;
};

export type AgentPatch<S extends keyof SectionPayloadMap = keyof SectionPayloadMap> = {
  agentId: string;
  section: S;
  data: SectionPayloadMap[S];
};

function collectStrings(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (!obj || typeof obj !== "object") return [];
  return Object.values(obj).flatMap(collectStrings);
}

export function applyAgentPatch<S extends keyof SectionPayloadMap>(
  blueprint: RenderBlueprint,
  patch: AgentPatch<S>,
): RenderBlueprint {
  assertAgentMayWriteSection(patch.agentId, patch.section as BlueprintSection);
  if (isManagedSection(patch.section)) {
    assertSectionWritable(blueprint, patch.section);
  }
  assertAgentOutputsClean(collectStrings(patch.data), patch.agentId);

  if (patch.section === "photography" && typeof patch.data === "object" && patch.data && "visualMood" in patch.data) {
    const mood = (patch.data as Partial<PhotographyBlueprint>).visualMood;
    if (mood) assertPhotographyMoodClean(mood, patch.agentId);
  }

  const next: RenderBlueprint = {
    ...blueprint,
    meta: {
      ...blueprint.meta,
      audit: [
        ...(blueprint.meta.audit ?? []),
        {
          agentId: patch.agentId,
          section: patch.section as BlueprintSection,
          action: "patch",
          at: Date.now(),
        },
      ],
    },
  };

  switch (patch.section) {
    case "creative":
      next.creative = { ...next.creative, ...patch.data };
      break;
    case "story":
      next.story = { ...next.story, ...patch.data };
      break;
    case "product":
      next.product = { ...next.product, ...patch.data };
      break;
    case "scene":
      next.scene = { ...next.scene, ...patch.data };
      break;
    case "photography":
      next.photography = { ...next.photography, ...patch.data };
      break;
    case "camera":
      next.camera = { ...next.camera, ...patch.data };
      break;
    case "lighting":
      next.lighting = { ...next.lighting, ...patch.data };
      break;
    case "materials":
      next.materials = { ...next.materials, ...patch.data };
      break;
    case "composition":
      next.composition = { ...next.composition, ...patch.data };
      break;
    case "background":
      next.background = { ...next.background, ...patch.data };
      break;
    case "constraints":
      next.constraints = { ...next.constraints, ...patch.data };
      break;
    case "validation":
      next.validation = { ...next.validation, ...patch.data };
      break;
    default:
      break;
  }

  if (isManagedSection(patch.section)) {
    return markSectionDirtyAfterPatch(next, patch.section);
  }

  return next;
}

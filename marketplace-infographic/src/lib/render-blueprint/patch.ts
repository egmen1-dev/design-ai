import type {
  BlueprintSection,
  RenderBlueprint,
  RenderCameraSection,
  RenderCreativeIntentSection,
  RenderKnowledgeSection,
  RenderLayoutSection,
  RenderLightingSection,
  RenderMaterialsSection,
  RenderPhotographySection,
  RenderSceneSection,
  RenderStorySection,
} from "./types";
import {
  assertAgentMayWriteSection,
  assertAgentOutputsClean,
  assertBlueprintUnlocked,
} from "./constitution";

export type SectionPayloadMap = {
  knowledge: Partial<RenderKnowledgeSection>;
  creativeIntent: Partial<RenderCreativeIntentSection>;
  story: Partial<RenderStorySection>;
  scene: Partial<RenderSceneSection>;
  photography: Partial<RenderPhotographySection>;
  layout: Partial<RenderLayoutSection>;
  lighting: Partial<RenderLightingSection>;
  camera: Partial<RenderCameraSection>;
  materials: Partial<RenderMaterialsSection>;
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

/** Применить патч агента с guard constitution v18 */
export function applyAgentPatch<S extends keyof SectionPayloadMap>(
  blueprint: RenderBlueprint,
  patch: AgentPatch<S>,
): RenderBlueprint {
  assertBlueprintUnlocked(blueprint, patch.agentId);
  assertAgentMayWriteSection(patch.agentId, patch.section as BlueprintSection);
  assertAgentOutputsClean(collectStrings(patch.data), patch.agentId);

  const next: RenderBlueprint = {
    ...blueprint,
    meta: {
      ...blueprint.meta,
      trace: [
        ...blueprint.meta.trace,
        {
          agentId: patch.agentId as RenderBlueprint["meta"]["trace"][0]["agentId"],
          section: patch.section as BlueprintSection,
          action: "patch",
          at: new Date().toISOString(),
        },
      ],
    },
  };

  switch (patch.section) {
    case "knowledge":
      next.knowledge = { ...next.knowledge, ...patch.data };
      break;
    case "creativeIntent":
      next.creativeIntent = { ...next.creativeIntent, ...patch.data };
      break;
    case "story":
      next.story = { ...next.story, ...patch.data };
      break;
    case "scene":
      next.scene = { ...next.scene, ...patch.data };
      break;
    case "photography":
      next.photography = { ...next.photography, ...patch.data };
      break;
    case "layout":
      next.layout = { ...next.layout, ...patch.data };
      break;
    case "lighting":
      next.lighting = { ...next.lighting, ...patch.data };
      break;
    case "camera":
      next.camera = { ...next.camera, ...patch.data };
      break;
    case "materials":
      next.materials = { ...next.materials, ...patch.data };
      break;
    default:
      break;
  }

  return next;
}

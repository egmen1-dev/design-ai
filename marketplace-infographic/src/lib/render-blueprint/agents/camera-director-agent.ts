/**
 * Chapter 3.2 / 4.1 / 4.15 — Camera Director agent
 */
import type { RenderBlueprint } from "../types";
import {
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
} from "../agent-contracts";
import { BlueprintLifecycle } from "../lifecycle-types";
import { AGENT_STAGE_MATRIX } from "../agent-matrix";
import { buildAgentContextPackage } from "../agent-context-engine";
import { denormalizeConfidence } from "../universal-agent-contract";
import { AgentCategory } from "../universal-agent-contract";
import { wrapLegacyBlueprintAgent } from "../universal-agent-bridge";
import {
  directorContextFromBlueprint,
  runCameraDirector,
  CAMERA_DIRECTOR_VERSION,
} from "../camera-director-engine";
import type { CameraSection } from "../camera-director-types";

export type CameraDirectorInput = {
  productCategory: string;
  marketplace: string;
};

export type CameraDirectorResult = AgentResultBase & {
  camera: CameraSection["cameraBlueprint"];
  cameraSection?: CameraSection;
};

export const cameraDirectorAgent: BlueprintAgent<CameraDirectorInput, CameraDirectorResult> = {
  id: "camera-director",
  version: CAMERA_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.PHOTO_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["camera-director"];
  },

  async execute(blueprint, input) {
    const context = buildAgentContextPackage({
      blueprint: blueprint as RenderBlueprint,
      agentId: "camera-director",
    });
    const directorContext = {
      ...directorContextFromBlueprint(blueprint as RenderBlueprint),
      productCategory: input.productCategory,
      marketplace: input.marketplace,
    };

    const result = runCameraDirector({ context, directorContext });

    return {
      camera: result.section.cameraBlueprint,
      cameraSection: result.section,
      confidence: denormalizeConfidence(result.confidence.value),
      decisionTrace: result.decisionSession.toDecisionTraceStrings(),
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { camera: result.camera };
  },
};

/** Chapter 4.1 — Universal Agent Contract wrapper */
export const universalCameraDirectorAgent = wrapLegacyBlueprintAgent(cameraDirectorAgent, {
  category: AgentCategory.TECHNICAL_DIRECTOR,
  consumes: ["story", "scene", "product", "photography"],
  produces: ["camera"],
  buildInput: (context) => ({
    productCategory: context.blueprint.product.category,
    marketplace: context.blueprint.creative.marketplace,
  }),
});

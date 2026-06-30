/**
 * Chapter 3.2 / 4.1 / 4.13 — Commercial Photo Director agent
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
  runCommercialPhotoDirector,
  COMMERCIAL_PHOTO_DIRECTOR_VERSION,
} from "../commercial-photo-director-engine";
import type { PhotographySection } from "../commercial-photo-director-types";

export type CommercialPhotoDirectorInput = {
  productCategory: string;
  marketplace: string;
};

export type CommercialPhotoDirectorResult = AgentResultBase & {
  photography: PhotographySection["photographyBlueprint"];
  photographySection?: PhotographySection;
};

export const commercialPhotoDirectorAgent: BlueprintAgent<
  CommercialPhotoDirectorInput,
  CommercialPhotoDirectorResult
> = {
  id: "commercial-photo-director",
  version: COMMERCIAL_PHOTO_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.PHOTO_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["commercial-photo-director"];
  },

  async execute(blueprint, input) {
    const context = buildAgentContextPackage({
      blueprint: blueprint as RenderBlueprint,
      agentId: "commercial-photo-director",
    });
    const directorContext = {
      ...directorContextFromBlueprint(blueprint as RenderBlueprint),
      productCategory: input.productCategory,
      marketplace: input.marketplace,
    };

    const result = runCommercialPhotoDirector({ context, directorContext });

    return {
      photography: result.section.photographyBlueprint,
      photographySection: result.section,
      confidence: denormalizeConfidence(result.confidence.value),
      decisionTrace: result.decisionSession.toDecisionTraceStrings(),
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { photography: result.photography };
  },
};

/** Chapter 4.1 — Universal Agent Contract wrapper */
export const universalCommercialPhotoDirectorAgent = wrapLegacyBlueprintAgent(
  commercialPhotoDirectorAgent,
  {
    category: AgentCategory.CREATIVE_DIRECTOR,
    consumes: ["story", "scene", "product"],
    produces: ["photography"],
    buildInput: (context) => ({
      productCategory: context.blueprint.product.category,
      marketplace: context.blueprint.creative.marketplace,
    }),
  },
);

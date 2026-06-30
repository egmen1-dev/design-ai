/**
 * Chapter 4.18 — Vision Quality Director agent
 */
import type { RenderBlueprint } from "../types";
import {
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
} from "../agent-contracts";
import { BlueprintLifecycle } from "../lifecycle-types";
import { AGENT_STAGE_MATRIX } from "../agent-matrix";
import {
  runVisionQualityDirector,
  VISION_QUALITY_DIRECTOR_VERSION,
} from "../vision-quality-director-engine";
import type {
  VisionQualityDirectorInput,
  VisionQualityReport,
} from "../vision-quality-director-types";
import type { AdapterRenderIntent } from "../render-adapter-types";
import type { ProviderMetadata } from "../render-pipeline-types";

export type VisionQualityDirectorAgentInput = VisionQualityDirectorInput & {
  renderIntent?: AdapterRenderIntent;
  providerMetadata?: ProviderMetadata;
};

export type VisionQualityDirectorResult = AgentResultBase & {
  visionReport: VisionQualityReport;
};

export const visionQualityDirectorAgent: BlueprintAgent<
  VisionQualityDirectorAgentInput,
  VisionQualityDirectorResult
> = {
  id: "vision-quality-director",
  version: VISION_QUALITY_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.RENDERING,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["vision-quality-director"];
  },

  async execute(blueprint, input) {
    const { report, explainability } = runVisionQualityDirector({
      blueprint: blueprint as RenderBlueprint,
      visionInput: input,
      renderIntent: input.renderIntent,
      providerMetadata: input.providerMetadata,
    });

    return {
      visionReport: report,
      confidence: report.confidence,
      decisionTrace: explainability.reasoning,
      warnings: report.problems.filter((p) => p.critical).map((p) => p.message),
    };
  },

  toUpdates(): AgentSectionUpdates {
    return {};
  },
};

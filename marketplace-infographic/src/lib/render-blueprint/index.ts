export {
  RENDER_BLUEPRINT_VERSION,
  SECTION_OWNERS,
  type RenderBlueprint,
  type RenderBlueprintInput,
  type BlueprintSection,
  type AgentSectionOwner,
  type RenderStorySection,
  type RenderSceneSection,
  type RenderPhotographySection,
  type RenderLayoutSection,
} from "./types";

export {
  type SceneEnvironmentId,
  COVER_CONCEPT_TO_ENVIRONMENT,
  environmentFromCoverConcept,
  coverConceptFromEnvironment,
} from "./environment";

export {
  CONSTITUTION_V18_VERSION,
  CONSTITUTION_V18_RULES,
  BANNED_AGENT_TOKENS,
  ConstitutionV18Error,
  assertAgentMayWriteSection,
  assertAgentOutputsClean,
  assertSingleEnvironmentSource,
} from "./constitution";

export { applyAgentPatch, type AgentPatch, type SectionPayloadMap } from "./patch";

export {
  createEmptyRenderBlueprint,
  renderBlueprintFromVisualPipeline,
  renderBlueprintToVisualSceneBlueprint,
} from "./from-visual-blueprint";

export const USE_RENDER_BLUEPRINT_V18 = process.env.RENDER_BLUEPRINT_V18 === "1";

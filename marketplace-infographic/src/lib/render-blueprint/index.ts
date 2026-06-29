export {
  RENDER_BLUEPRINT_VERSION,
  type RenderBlueprint,
  type RenderBlueprintInput,
  type FluxAdapterOutput,
  type BlueprintSection,
  type MetaBlueprint,
  type CreativeBlueprint,
  type StoryBlueprint,
  type ProductBlueprint,
  type SceneBlueprint,
  type PhotographyBlueprint,
  type CameraBlueprint,
  type LightingBlueprint,
  type MaterialBlueprint,
  type CompositionBlueprint,
  type BackgroundBlueprint,
  type RenderBlueprintSettings,
  type ConstraintBlueprint,
  type ValidationBlueprint,
  type SceneEnvironmentId,
} from "./types";

export {
  COVER_CONCEPT_TO_ENVIRONMENT,
  environmentFromCoverConcept,
  coverConceptFromEnvironment,
} from "./environment";

export { AGENT_WRITE_PERMISSIONS, agentMayWriteSection } from "./ownership";

export {
  CONSTITUTION_V18_VERSION,
  CONSTITUTION_V18_RULES,
  BANNED_AGENT_TOKENS,
  BANNED_PHOTOGRAPHY_MOOD,
  ConstitutionV18Error,
  assertAgentMayWriteSection,
  assertAgentOutputsClean,
  assertSingleEnvironmentSource,
  assertNoPromptStored,
  assertReadyForAdapter,
  assertPhotographyMoodClean,
} from "./constitution";

export { applyAgentPatch, type AgentPatch, type SectionPayloadMap } from "./patch";

export {
  createEmptyRenderBlueprint,
  renderBlueprintFromVisualPipeline,
  renderBlueprintToVisualSceneBlueprint,
} from "./from-visual-blueprint";

export const USE_RENDER_BLUEPRINT_V18 = process.env.RENDER_BLUEPRINT_V18 === "1";

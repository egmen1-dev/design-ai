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

export {
  BlueprintLifecycle,
  SectionState,
  type BlueprintLifecycleMeta,
  type BlueprintSnapshot,
  type LifecycleManagedSection,
  type RollbackResult,
} from "./lifecycle-types";

export {
  BlueprintLockedError,
  LifecycleTransitionError,
  DEPENDENCY_CHILDREN,
  STAGE_EDITABLE_SECTIONS,
  createInitialLifecycleMeta,
  isLifecycleFrozen,
  assertSectionWritable,
  canTransitionSectionState,
  propagateDirty,
  markSectionDirtyAfterPatch,
  createLifecycleSnapshot,
  advanceLifecycleStage,
  rollbackToSnapshot,
  advanceToRendering,
  advancePostRenderStage,
} from "./lifecycle";

export {
  SECTION_VALIDATORS,
  STAGE_LOCK_SECTIONS,
  type SectionValidationResult,
} from "./section-validators";

export {
  type AgentContractId,
  type AgentError,
  type AgentErrorKind,
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
  type BlueprintMutationResult,
  type RetryAdvice,
  AgentContractError,
  assertAgentConfidence,
} from "./agent-contracts";

export {
  AGENT_READ_MATRIX,
  AGENT_WRITE_MATRIX,
  AGENT_STAGE_MATRIX,
  agentMayReadSection,
  agentMayWriteSectionContract,
} from "./agent-matrix";

export { LifecycleManager } from "./lifecycle-manager";

export { storyDirectorAgent, type StoryDirectorInput, type StoryDirectorResult } from "./agents/story-director-agent";

export const USE_RENDER_BLUEPRINT_V18 = process.env.RENDER_BLUEPRINT_V18 === "1";

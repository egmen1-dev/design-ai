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
  type ConstraintSet,
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
  type LifecycleStageSnapshot,
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

export { LifecycleManager, RetryLimitExceededError } from "./lifecycle-manager";

export {
  PipelineState,
  LifecycleEventType,
  RetryKind,
  DEFAULT_RETRY_LIMITS,
  type PipelineStateId,
  type LifecycleEvent,
  type LifecycleEventTypeId,
  type RetryKindId,
  type RetryLimits,
  type StagePrecondition,
  type DecisionNodeSnapshot,
  type StageSnapshot,
  type LifecycleLogEntry,
  type StageExecutionResult,
} from "./lifecycle-manager-types";

export { MutationEngine, MutationEngineError } from "./mutation-engine";
export type {
  BlueprintMutation,
  MutationBatch,
  MutationAppliedEvent,
  MutationAuditEntry,
  MutationApplyResult,
  MutationBatchResult,
} from "./mutation-types";
export { hashSection, hashValue } from "./section-hash";
export { validateMutation, validateBatchConflicts } from "./mutation-validators";

export {
  ValidationEngine,
  ValidationLevel,
  DEFAULT_VALIDATION_RULES,
  VAL_001_BLUEPRINT_STRUCTURE,
  VAL_002_LIFECYCLE,
  VAL_003_DEPENDENCIES,
  VAL_004_CAMERA,
  VAL_005_LIGHTING,
  VAL_006_COMPOSITION,
  VAL_007_BACKGROUND,
  VAL_008_PROFESSIONAL_LAYOUT,
  VAL_009_MARKETPLACE,
  VAL_010_ARCHITECTURE_INVARIANTS,
  VAL_BUSINESS_SCENE_LOGIC,
  type ValidationError,
  type ValidationResult,
  type ValidationRule,
  type ValidationReport,
  type ValidationSeverity,
  type ValidationWarning,
  type ValidationRuleCategory,
  type ValidationEngineOptions,
} from "./validation-engine";

export {
  ConstraintEngine,
  ConstraintEngineError,
  ConstraintCategory,
  ConstraintPriority,
  ConstraintSource,
  ResolutionStrategy,
  SOURCE_RESOLUTION_ORDER,
  DEFAULT_CONSTRAINT_PROVIDERS,
  SAFETY_CONSTRAINT_PROVIDER,
  MARKETPLACE_CONSTRAINT_PROVIDER,
  CREATIVE_CONSTRAINT_PROVIDER,
  STORY_CONSTRAINT_PROVIDER,
  COMPOSITION_CONSTRAINT_PROVIDER,
  GOVERNANCE_CONSTRAINT_PROVIDER,
  PROVIDER_FLUX_CONSTRAINT_PROVIDER,
  ARCHITECTURE_CONSTRAINT_PROVIDER,
  userConstraintsFromFlags,
  constraintsForProviderCapability,
  type Constraint,
  type ConstraintSet,
  type ConstraintConflict,
  type ConstraintReport,
  type ConstraintProvider,
  type ConstraintEngineOptions,
  type ConstraintPayload,
  type ConstraintCategoryId,
  type ResolutionStrategyId,
} from "./constraint-engine";

export {
  RollbackStrategy,
  RecoveryEventType,
  DEFAULT_MAX_RECOVERY_ATTEMPTS,
  DEFAULT_SNAPSHOT_RETENTION,
  type BlueprintSnapshot,
  type SnapshotMetadata,
  type SnapshotDelta,
  type SnapshotComparison,
  type RecoveryEvent,
  type RecoveryResult,
  type SnapshotRecoveryOptions,
  type SnapshotRetentionPolicy,
  type LifecycleStageSnapshot,
} from "./snapshot-types";
export {
  SnapshotManager,
  SnapshotIntegrityError,
  RecoveryLimitExceededError,
  validationResultFromReport,
  type StageSnapshot,
} from "./snapshot-manager";

export {
  EventBus,
  EventBusError,
  DesignEventType,
  EventCategory,
  EVENT_TYPE_CATEGORY,
  LIFECYCLE_TO_DESIGN_EVENT,
  lifecycleEventToPublish,
  mutationEventPayload,
  validationEventPayload,
  type DesignEvent,
  type DesignEventPayload,
  type DesignEventTypeId,
  type EventCategoryId,
  type EventMetadata,
  type EventHandler,
  type EventSubscription,
  type EventBusOptions,
  type EventReplayResult,
  type PublishInput,
} from "./event-bus";
export { RetryEngine, RetryLimitExceededError as RetryEngineLimitError } from "./retry-engine";
export {
  AgentRegistry,
  AgentRegistryError,
  createDefaultAgentRegistry,
  defaultAgentRegistry,
  descriptorFromAgent,
  registrationFromAgent,
  AgentType,
  DEFAULT_DIRECTOR_CAPABILITIES,
  DEFAULT_CRITIC_CAPABILITIES,
  DEFAULT_ADAPTER_CAPABILITIES,
  type AgentDescriptor,
  type AgentCapabilities,
  type AgentMetadata,
  type AgentFactory,
  type AgentRegistration,
  type AgentInstanceRecord,
  type RegistryHealthIssue,
  type RegistryHealthResult,
  type RegistryAgentReport,
  type RegistryReport,
  type RegistryRuntimeOptions,
} from "./agent-registry";
export { STAGE_PRECONDITIONS, assertStagePreconditions } from "./stage-preconditions";
export { canRunAgentsParallel, groupParallelAgents } from "./parallel-execution";

export {
  DecisionGraph,
  DecisionGraphError,
  DecisionType,
  DependencyKind,
  DEFAULT_DECISION_EDGES,
  DECISION_EXECUTION_ORDER,
  DECISION_NODE_ID,
  DECISION_PRODUCERS,
  agentIdToProducer,
  type DecisionConflict,
  type DecisionEdge,
  type DecisionNode,
  type DecisionProducerId,
  type DecisionTypeId,
  type DependencyKindId,
  type GraphValidationIssue,
  type GraphValidationResult,
  type InvalidationResult,
} from "./decision-graph";

export { storyDirectorAgent, type StoryDirectorInput, type StoryDirectorResult } from "./agents/story-director-agent";

export {
  compileFluxAdapterOutput,
  RenderPipeline,
  defaultRenderPipeline,
  extractRenderIntent,
  negotiateCapabilities,
  compileNegativePrompt,
  validateCompiledPrompt,
  validateNegativePrompt,
  compilePromptForProvider,
  getProviderCapabilities,
} from "./render-pipeline";
export {
  RenderPipelineError,
  FluxRenderAdapter,
  GptImageRenderAdapter,
  SdxlRenderAdapter,
  PollinationsRenderAdapter,
  createDefaultAdapters,
  frozenTestBlueprint,
} from "./render-adapters";
export type {
  RenderIntent,
  ProviderRequest,
  ProviderResponse,
  ProviderMetadata,
  ProviderCapabilities,
  ProviderId,
  RenderAdapter,
  CompiledProviderRequest,
  ProviderRenderFn,
  RenderPipelineOptions,
  RenderPipelineResult,
  NegotiatedFields,
} from "./render-pipeline-types";
export { DEFAULT_FALLBACK_CHAIN } from "./render-pipeline-types";

export const USE_RENDER_BLUEPRINT_V18 = process.env.RENDER_BLUEPRINT_V18 === "1";

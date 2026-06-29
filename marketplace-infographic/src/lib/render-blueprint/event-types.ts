/**
 * Chapter 3.9 — Event System types
 */
import type { BlueprintLifecycle } from "./lifecycle-types";

export const EventCategory = {
  LIFECYCLE: "LIFECYCLE",
  AGENT: "AGENT",
  MUTATION: "MUTATION",
  VALIDATION: "VALIDATION",
  RENDER: "RENDER",
  RECOVERY: "RECOVERY",
  DEBUG: "DEBUG",
  SYSTEM: "SYSTEM",
} as const;

export type EventCategoryId = (typeof EventCategory)[keyof typeof EventCategory];

export const DesignEventType = {
  PipelineStarted: "PipelineStarted",
  StageStarted: "StageStarted",
  StageCompleted: "StageCompleted",
  StageFailed: "StageFailed",
  MutationReceived: "MutationReceived",
  MutationValidated: "MutationValidated",
  MutationApplied: "MutationApplied",
  MutationRejected: "MutationRejected",
  ValidationStarted: "ValidationStarted",
  ValidationPassed: "ValidationPassed",
  ValidationWarning: "ValidationWarning",
  ValidationFailed: "ValidationFailed",
  SnapshotCreated: "SnapshotCreated",
  RetryStarted: "RetryStarted",
  RetryCompleted: "RetryCompleted",
  RollbackStarted: "RollbackStarted",
  RollbackCompleted: "RollbackCompleted",
  RenderStarted: "RenderStarted",
  RenderCompleted: "RenderCompleted",
  PromptCompiled: "PromptCompiled",
  PromptTranslated: "PromptTranslated",
  BackgroundRequested: "BackgroundRequested",
  BackgroundGenerated: "BackgroundGenerated",
  BackgroundRejected: "BackgroundRejected",
  CompositeStarted: "CompositeStarted",
  ShadowMatched: "ShadowMatched",
  ReflectionMatched: "ReflectionMatched",
  LightingMatched: "LightingMatched",
  CompositeCompleted: "CompositeCompleted",
  VisionReviewStarted: "VisionReviewStarted",
  VisionApproved: "VisionApproved",
  VisionRejected: "VisionRejected",
  PipelineCompleted: "PipelineCompleted",
  PipelineFailed: "PipelineFailed",
  AgentStarted: "AgentStarted",
  AgentCompleted: "AgentCompleted",
  AgentApproved: "AgentApproved",
  AgentRejected: "AgentRejected",
  ConstraintFailed: "ConstraintFailed",
  EventHandlerFailed: "EventHandlerFailed",
} as const;

export type DesignEventTypeId = (typeof DesignEventType)[keyof typeof DesignEventType];

export type EventMetadata = {
  pipelineId: string;
  blueprintId: string;
  stage: BlueprintLifecycle;
  producer: string;
  version: string;
};

/** Minimal payload — no RenderBlueprint or image blobs */
export type DesignEventPayload = Record<string, string | number | boolean | null | undefined>;

export type DesignEvent = {
  id: string;
  category: EventCategoryId;
  type: DesignEventTypeId | string;
  timestamp: number;
  revision: number;
  metadata: EventMetadata;
  payload: DesignEventPayload;
};

export type EventHandler = (event: Readonly<DesignEvent>) => void | Promise<void>;

export type EventSubscription = {
  id: string;
  type?: DesignEventTypeId | string;
  category?: EventCategoryId;
  handler: EventHandler;
};

export type EventBusOptions = {
  debugMode?: boolean;
  pipelineId?: string;
  version?: string;
};

export type EventReplayResult = {
  pipelineId: string;
  events: readonly DesignEvent[];
  count: number;
};

export const EVENT_TYPE_CATEGORY: Record<string, EventCategoryId> = {
  PipelineStarted: EventCategory.LIFECYCLE,
  StageStarted: EventCategory.LIFECYCLE,
  StageCompleted: EventCategory.LIFECYCLE,
  StageFailed: EventCategory.LIFECYCLE,
  SnapshotCreated: EventCategory.LIFECYCLE,
  RetryStarted: EventCategory.LIFECYCLE,
  RetryCompleted: EventCategory.LIFECYCLE,
  RollbackStarted: EventCategory.RECOVERY,
  RollbackCompleted: EventCategory.RECOVERY,
  PipelineCompleted: EventCategory.LIFECYCLE,
  PipelineFailed: EventCategory.LIFECYCLE,
  ConstraintFailed: EventCategory.VALIDATION,
  AgentStarted: EventCategory.AGENT,
  AgentCompleted: EventCategory.AGENT,
  AgentApproved: EventCategory.AGENT,
  AgentRejected: EventCategory.AGENT,
  MutationReceived: EventCategory.MUTATION,
  MutationValidated: EventCategory.MUTATION,
  MutationApplied: EventCategory.MUTATION,
  MutationRejected: EventCategory.MUTATION,
  ValidationStarted: EventCategory.VALIDATION,
  ValidationPassed: EventCategory.VALIDATION,
  ValidationWarning: EventCategory.VALIDATION,
  ValidationFailed: EventCategory.VALIDATION,
  RenderStarted: EventCategory.RENDER,
  RenderCompleted: EventCategory.RENDER,
  PromptCompiled: EventCategory.RENDER,
  PromptTranslated: EventCategory.RENDER,
  BackgroundRequested: EventCategory.RENDER,
  BackgroundGenerated: EventCategory.RENDER,
  BackgroundRejected: EventCategory.RENDER,
  CompositeStarted: EventCategory.RENDER,
  ShadowMatched: EventCategory.RENDER,
  ReflectionMatched: EventCategory.RENDER,
  LightingMatched: EventCategory.RENDER,
  CompositeCompleted: EventCategory.RENDER,
  VisionReviewStarted: EventCategory.RENDER,
  VisionApproved: EventCategory.RENDER,
  VisionRejected: EventCategory.RENDER,
  EventHandlerFailed: EventCategory.SYSTEM,
};

/** Map Ch 3.4 lifecycle events → Ch 3.9 design events */
export const LIFECYCLE_TO_DESIGN_EVENT: Record<string, DesignEventTypeId> = {
  StageStarted: DesignEventType.StageStarted,
  StageFinished: DesignEventType.StageCompleted,
  MutationApplied: DesignEventType.MutationApplied,
  SnapshotCreated: DesignEventType.SnapshotCreated,
  RetryStarted: DesignEventType.RetryStarted,
  RollbackStarted: DesignEventType.RollbackStarted,
  ValidationFailed: DesignEventType.ValidationFailed,
  ConstraintFailed: DesignEventType.ConstraintFailed,
  PipelineFinished: DesignEventType.PipelineCompleted,
};

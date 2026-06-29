/**
 * Chapter 3.9 — Event Bus
 * Delivery only — no business logic. Ordered, immutable events.
 */
import { randomUUID } from "crypto";
import type { BlueprintLifecycle } from "./lifecycle-types";
import {
  DesignEventType,
  EVENT_TYPE_CATEGORY,
  EventCategory,
  LIFECYCLE_TO_DESIGN_EVENT,
  type DesignEvent,
  type DesignEventPayload,
  type DesignEventTypeId,
  type EventBusOptions,
  type EventCategoryId,
  type EventHandler,
  type EventMetadata,
  type EventReplayResult,
  type EventSubscription,
} from "./event-types";

export {
  EventCategory,
  DesignEventType,
  EVENT_TYPE_CATEGORY,
  LIFECYCLE_TO_DESIGN_EVENT,
  type DesignEvent,
  type DesignEventPayload,
  type DesignEventTypeId,
  type EventCategoryId,
  type EventMetadata,
  type EventHandler,
  type EventSubscription,
  type EventBusOptions,
  type EventReplayResult,
} from "./event-types";

export class EventBusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventBusError";
  }
}

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "blueprint",
  "renderBlueprint",
  "image",
  "imageData",
  "buffer",
  "blob",
  "base64",
]);

function isPlainPayload(value: unknown): value is DesignEventPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const [key, v] of Object.entries(value)) {
    if (FORBIDDEN_PAYLOAD_KEYS.has(key)) return false;
    if (v !== null && typeof v === "object") return false;
    if (
      typeof v !== "string" &&
      typeof v !== "number" &&
      typeof v !== "boolean" &&
      v !== null &&
      v !== undefined
    ) {
      return false;
    }
  }
  return true;
}

function freezeEvent(event: DesignEvent): DesignEvent {
  return Object.freeze({
    ...event,
    metadata: Object.freeze({ ...event.metadata }),
    payload: Object.freeze({ ...event.payload }),
  }) as DesignEvent;
}

export type PublishInput = {
  type: DesignEventTypeId | string;
  category?: EventCategoryId;
  revision: number;
  metadata: Partial<EventMetadata> & Pick<EventMetadata, "blueprintId" | "stage">;
  payload?: DesignEventPayload;
};

export class EventBus {
  private readonly pipelineId: string;
  private readonly version: string;
  private readonly debugMode: boolean;
  private readonly log: DesignEvent[] = [];
  private readonly subscriptions: EventSubscription[] = [];
  private locked = false;
  private sequence = 0;
  private defaultBlueprintId = "";
  private defaultStage: BlueprintLifecycle = "NEW";
  private defaultProducer = "system";

  constructor(options: EventBusOptions = {}) {
    this.pipelineId = options.pipelineId ?? randomUUID();
    this.version = options.version ?? "18.0";
    this.debugMode = options.debugMode ?? false;
  }

  getPipelineId(): string {
    return this.pipelineId;
  }

  isLocked(): boolean {
    return this.locked;
  }

  /** Bind correlation defaults for a pipeline run */
  bindContext(ctx: {
    blueprintId: string;
    stage?: BlueprintLifecycle;
    producer?: string;
  }): void {
    this.defaultBlueprintId = ctx.blueprintId;
    this.defaultStage = ctx.stage ?? this.defaultStage;
    this.defaultProducer = ctx.producer ?? this.defaultProducer;
  }

  /** Lock subscriber registration during pipeline execution */
  lock(): void {
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
  }

  subscribe(
    typeOrCategory: DesignEventTypeId | string | EventCategoryId,
    handler: EventHandler,
  ): () => void {
    if (this.locked) {
      throw new EventBusError("Cannot register subscribers while pipeline is running");
    }
    const isCategory = Object.values(EventCategory).includes(typeOrCategory as EventCategoryId);
    const sub: EventSubscription = {
      id: randomUUID(),
      handler,
      ...(isCategory
        ? { category: typeOrCategory as EventCategoryId }
        : { type: typeOrCategory }),
    };
    this.subscriptions.push(sub);
    return () => {
      const idx = this.subscriptions.findIndex((s) => s.id === sub.id);
      if (idx >= 0) this.subscriptions.splice(idx, 1);
    };
  }

  publish(input: PublishInput): DesignEvent {
    const payload = input.payload ?? {};
    if (!isPlainPayload(payload)) {
      throw new EventBusError(
        "Event payload must be plain metadata — no RenderBlueprint, images, or nested objects",
      );
    }

    const category =
      input.category ?? EVENT_TYPE_CATEGORY[input.type] ?? EventCategory.SYSTEM;

    const metadata: EventMetadata = {
      pipelineId: this.pipelineId,
      blueprintId: input.metadata.blueprintId || this.defaultBlueprintId,
      stage: input.metadata.stage,
      producer: input.metadata.producer ?? this.defaultProducer,
      version: input.metadata.version ?? this.version,
    };

    const event = freezeEvent({
      id: randomUUID(),
      category,
      type: input.type,
      timestamp: Date.now(),
      revision: input.revision,
      metadata,
      payload,
    });

    this.sequence += 1;
    this.log.push(event);

    const handlers = this.matchHandlers(event);
    for (const handler of handlers) {
      try {
        const result = handler(event);
        if (result && typeof (result as Promise<void>).then === "function") {
          void (result as Promise<void>).catch((err) =>
            this.publishHandlerFailure(event, err),
          );
        }
      } catch (err) {
        this.publishHandlerFailure(event, err);
      }
    }

    if (!this.debugMode && this.isTerminalEvent(event.type)) {
      this.trimEphemeralLog();
    }

    return event;
  }

  private publishHandlerFailure(source: DesignEvent, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    const failure = freezeEvent({
      id: randomUUID(),
      category: EventCategory.SYSTEM,
      type: DesignEventType.EventHandlerFailed,
      timestamp: Date.now(),
      revision: source.revision,
      metadata: { ...source.metadata },
      payload: {
        sourceEventId: source.id,
        sourceType: source.type,
        error: message,
      },
    });
    this.log.push(failure);
    const handlers = this.matchHandlers(failure);
    for (const handler of handlers) {
      try {
        handler(failure);
      } catch {
        /* avoid infinite loop */
      }
    }
  }

  private matchHandlers(event: DesignEvent): EventHandler[] {
    return this.subscriptions
      .filter((sub) => {
        if (sub.type) return sub.type === event.type;
        if (sub.category) return sub.category === event.category;
        return true;
      })
      .map((sub) => sub.handler);
  }

  private isTerminalEvent(type: string): boolean {
    return type === DesignEventType.PipelineCompleted || type === DesignEventType.PipelineFailed;
  }

  /** After success — keep final events only unless debug */
  private trimEphemeralLog(): void {
    if (this.debugMode) return;
    const last = this.log.at(-1);
    if (last) this.log.splice(0, this.log.length, last);
  }

  getLog(): readonly DesignEvent[] {
    return this.log;
  }

  getSequence(): number {
    return this.sequence;
  }

  replay(pipelineId?: string): EventReplayResult {
    const events =
      pipelineId && pipelineId !== this.pipelineId
        ? this.log.filter((e) => e.metadata.pipelineId === pipelineId)
        : [...this.log];
    return { pipelineId: pipelineId ?? this.pipelineId, events, count: events.length };
  }

  /** Verify strict timestamp ordering */
  verifyOrdering(): boolean {
    for (let i = 1; i < this.log.length; i++) {
      if (this.log[i]!.timestamp < this.log[i - 1]!.timestamp) return false;
    }
    return true;
  }
}

/** Build minimal mutation event payloads */
export function mutationEventPayload(params: {
  section: string;
  producer: string;
  revision: number;
  durationMs?: number;
  mutationId?: string;
}): DesignEventPayload {
  return {
    section: params.section,
    producer: params.producer,
    revision: params.revision,
    durationMs: params.durationMs ?? 0,
    mutationId: params.mutationId ?? randomUUID(),
  };
}

/** Build minimal validation event payloads */
export function validationEventPayload(params: {
  revision: number;
  passed: boolean;
  score: number;
  errorCount: number;
  warningCount: number;
}): DesignEventPayload {
  return {
    revision: params.revision,
    passed: params.passed,
    score: params.score,
    errorCount: params.errorCount,
    warningCount: params.warningCount,
  };
}

/** Map legacy LifecycleEvent fields to DesignEvent publish input */
export function lifecycleEventToPublish(
  type: string,
  stage: BlueprintLifecycle,
  revision: number,
  blueprintId: string,
  extra?: { agentId?: string; detail?: string },
): PublishInput {
  const designType =
    LIFECYCLE_TO_DESIGN_EVENT[type] ?? (type as DesignEventTypeId);

  return {
    type: designType,
    revision,
    metadata: {
      blueprintId,
      stage,
      producer: extra?.agentId ?? "lifecycle-manager",
    },
    payload: {
      detail: extra?.detail,
      agentId: extra?.agentId,
    },
  };
}

export type KernelEventType =
  | "kernel:initialized"
  | "kernel:ready"
  | "kernel:execute:start"
  | "kernel:execute:complete"
  | "kernel:shutdown"
  | "project:created";

export interface KernelEvent {
  readonly type: KernelEventType;
  readonly timestamp: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

/** Event service — kernel and execution events only. */
export class KernelEvents {
  private readonly events: KernelEvent[] = [];

  emit(type: KernelEventType, payload?: Record<string, unknown>): void {
    this.events.push(
      Object.freeze({
        type,
        timestamp: new Date().toISOString(),
        payload: payload ? Object.freeze({ ...payload }) : undefined,
      }),
    );
  }

  list(): readonly KernelEvent[] {
    return Object.freeze([...this.events]);
  }

  count(): number {
    return this.events.length;
  }

  clear(): void {
    this.events.length = 0;
  }
}

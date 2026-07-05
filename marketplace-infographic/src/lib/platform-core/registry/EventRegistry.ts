export type EventCategory =
  | "project"
  | "platform"
  | "runtime"
  | "provider"
  | "vision"
  | "learning";

export interface RegistryEvent {
  readonly id: string;
  readonly category: EventCategory;
  readonly name: string;
  readonly timestamp: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

/** In-memory event registry for project and platform events. */
export class EventRegistry {
  private readonly events: RegistryEvent[] = [];

  append(event: RegistryEvent): void {
    this.events.push(Object.freeze(structuredClone(event)));
  }

  list(category?: EventCategory): readonly RegistryEvent[] {
    const filtered = category
      ? this.events.filter((e) => e.category === category)
      : this.events;
    return Object.freeze([...filtered]);
  }

  clear(): void {
    this.events.length = 0;
  }
}

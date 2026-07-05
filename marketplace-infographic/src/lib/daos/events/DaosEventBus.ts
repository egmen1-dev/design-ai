export type DaosEventName = string;

export interface DaosEventRecord {
  readonly name: DaosEventName;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly timestamp: string;
}

type DaosEventHandler = (record: DaosEventRecord) => void;

/** In-process event bus for DAOS runtime and adapters. */
export class DaosEventBus {
  private readonly handlers = new Map<DaosEventName, Set<DaosEventHandler>>();
  private readonly store: DaosEventRecord[] = [];

  emit(name: DaosEventName, payload: Readonly<Record<string, unknown>> = {}): void {
    const record: DaosEventRecord = Object.freeze({
      name,
      payload: Object.freeze({ ...payload }),
      timestamp: new Date().toISOString(),
    });
    this.store.push(record);
    const handlers = this.handlers.get(name);
    if (handlers) {
      for (const handler of handlers) {
        handler(record);
      }
    }
    const wildcard = this.handlers.get("*");
    if (wildcard) {
      for (const handler of wildcard) {
        handler(record);
      }
    }
  }

  on(name: DaosEventName, handler: DaosEventHandler): () => void {
    const set = this.handlers.get(name) ?? new Set<DaosEventHandler>();
    set.add(handler);
    this.handlers.set(name, set);
    return () => set.delete(handler);
  }

  count(): number {
    return this.store.length;
  }

  flush(): readonly DaosEventRecord[] {
    const copy = Object.freeze([...this.store]);
    this.store.length = 0;
    return copy;
  }
}

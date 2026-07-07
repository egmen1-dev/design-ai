export type DAOSEvent = {
  id: string;
  type: string;
  source: string;
  projectId?: string;
  runId?: string;
  createdAt: string;
  payload?: unknown;
};

export class DAOSEventBus {
  private events: DAOSEvent[] = [];

  emit(event: Omit<DAOSEvent, "id" | "createdAt">): DAOSEvent {
    const fullEvent: DAOSEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.events.push(fullEvent);
    return fullEvent;
  }

  list() {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}

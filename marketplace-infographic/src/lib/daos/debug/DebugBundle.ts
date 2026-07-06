export interface DebugArtifact {
  readonly kind: string;
  readonly label: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly timestamp: string;
}

/** Per-run debug bundle — specs, blueprints, metrics, trace (Part 46 / Wave 1). */
export class DebugBundle {
  private readonly artifacts: DebugArtifact[] = [];

  record(kind: string, label: string, payload: Readonly<Record<string, unknown>> = {}): void {
    this.artifacts.push(
      Object.freeze({
        kind,
        label,
        payload: Object.freeze({ ...payload }),
        timestamp: new Date().toISOString(),
      }),
    );
  }

  list(): readonly DebugArtifact[] {
    return Object.freeze([...this.artifacts]);
  }

  toJSON(): string {
    return JSON.stringify(this.artifacts, null, 2);
  }

  clear(): void {
    this.artifacts.length = 0;
  }
}

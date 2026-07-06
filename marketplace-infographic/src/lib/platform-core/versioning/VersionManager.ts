export type VersionedObjectKind =
  | "platform"
  | "runtime"
  | "specification"
  | "asset"
  | "blueprint"
  | "knowledge"
  | "genome";

export interface VersionRecord {
  readonly kind: VersionedObjectKind;
  readonly objectId: string;
  readonly version: number;
  readonly updatedAt: string;
}

/** Tracks versions for platforms, specs, assets, and blueprints. */
export class VersionManager {
  private readonly versions = new Map<string, VersionRecord>();

  private key(kind: VersionedObjectKind, objectId: string): string {
    return `${kind}:${objectId}`;
  }

  get(kind: VersionedObjectKind, objectId: string): number {
    return this.versions.get(this.key(kind, objectId))?.version ?? 0;
  }

  increment(kind: VersionedObjectKind, objectId: string): VersionRecord {
    const k = this.key(kind, objectId);
    const current = this.versions.get(k)?.version ?? 0;
    const record: VersionRecord = Object.freeze({
      kind,
      objectId,
      version: current + 1,
      updatedAt: new Date().toISOString(),
    });
    this.versions.set(k, record);
    return record;
  }

  snapshot(): readonly VersionRecord[] {
    return Object.freeze([...this.versions.values()]);
  }
}

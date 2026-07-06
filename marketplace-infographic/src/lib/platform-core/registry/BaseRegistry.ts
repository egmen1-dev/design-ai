import type { IRegistry } from "../interfaces/IRegistry";

/** Generic in-memory registry with O(1) lookup. */
export class BaseRegistry<T> implements IRegistry<T> {
  private readonly entries = new Map<string, T>();

  register(id: string, entry: T): void {
    if (this.entries.has(id)) {
      throw new Error(`Registry entry already exists: ${id}`);
    }
    this.entries.set(id, entry);
  }

  resolve(id: string): T | undefined {
    return this.entries.get(id);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  list(): readonly string[] {
    return Object.freeze([...this.entries.keys()]);
  }
}

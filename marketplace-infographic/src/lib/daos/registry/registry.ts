export type DAOSRegistryItem<T> = {
  id: string;
  version: string;
  item: T;
};

export class DAOSRegistry<T> {
  private items = new Map<string, DAOSRegistryItem<T>>();

  register(entry: DAOSRegistryItem<T>) {
    this.items.set(entry.id, entry);
  }

  get(id: string) {
    return this.items.get(id);
  }

  list() {
    return Array.from(this.items.values());
  }

  has(id: string) {
    return this.items.has(id);
  }
}

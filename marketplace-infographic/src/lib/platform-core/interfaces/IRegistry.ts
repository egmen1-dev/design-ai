/** Registry resolution contract. */
export interface IRegistry<T> {
  register(id: string, entry: T): void;
  resolve(id: string): T | undefined;
  has(id: string): boolean;
  list(): readonly string[];
}

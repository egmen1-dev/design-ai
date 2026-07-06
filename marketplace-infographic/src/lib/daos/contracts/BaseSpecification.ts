/** Immutable specification base — all platform DTOs extend this. */
export interface BaseSpecification {
  readonly specType: string;
  readonly version: string;
  readonly createdAt: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createSpecification<T extends BaseSpecification>(
  spec: T,
): Readonly<T> {
  return Object.freeze(spec);
}

export function serializeSpecification(spec: BaseSpecification): string {
  return JSON.stringify(spec);
}

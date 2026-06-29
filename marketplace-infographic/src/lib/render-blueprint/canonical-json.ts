/**
 * DESIGN AI v18 — Canonical JSON (Chapter 3.12)
 *
 * Sorted keys, no extra whitespace, deterministic number formatting.
 */

export function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Non-finite numbers are not allowed in canonical JSON');
    }
    return value;
  }

  if (typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = canonicalize(record[key]);
    }
    return sorted;
  }

  throw new Error(`Non-serializable value type: ${typeof value}`);
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function canonicalParse(json: string): unknown {
  return canonicalize(JSON.parse(json));
}

import type { GenerationContext, GenerationContextSnapshot } from "./types";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

/** JSON-safe snapshot without buffers or raw image bytes. */
export function serializeGenerationContextSnapshot(
  context: GenerationContext,
): GenerationContextSnapshot {
  const json = JSON.stringify(context, (_key, value) => {
    if (typeof value === "string" && value.startsWith("data:image/")) {
      return "[omitted:data-url]";
    }
    if (value instanceof Buffer) {
      return "[omitted:buffer]";
    }
    return value;
  });
  return JSON.parse(json) as GenerationContextSnapshot;
}

export function resolveGenerationContextPath(projectId: string, runId: string): string {
  return `public/debug/${projectId}/${runId}/generation-context.json`;
}

export function freezeGenerationContext(context: GenerationContext): GenerationContext {
  return deepFreeze(context);
}

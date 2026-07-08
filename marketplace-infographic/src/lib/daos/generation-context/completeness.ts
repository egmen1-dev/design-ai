import type { GenerationContext, GenerationContextBuildInput } from "./types";

const REQUIRED_FIELD_PATHS = [
  "metadata.generationId",
  "metadata.projectId",
  "metadata.runId",
  "product.verified",
  "marketplace.layout",
  "generationMode.mode",
  "operatingMode.mode",
] as const;

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

function getByPath(context: GenerationContext, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, context);
}

export function computeGenerationContextCompleteness(context: GenerationContext): {
  completenessScore: number;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  for (const path of REQUIRED_FIELD_PATHS) {
    const value = getByPath(context, path);
    if (!isPresent(value)) {
      missingFields.push(path);
    }
  }

  const completenessScore = Math.round(
    ((REQUIRED_FIELD_PATHS.length - missingFields.length) / REQUIRED_FIELD_PATHS.length) * 100,
  );

  return { completenessScore, missingFields };
}

export function computeGenerationContextCompletenessFromInput(
  input: GenerationContextBuildInput,
): {
  completenessScore: number;
  missingFields: string[];
} {
  const draft = buildDraftPaths(input);
  const missingFields = REQUIRED_FIELD_PATHS.filter((path) => !isPresent(draft[path]));
  const completenessScore = Math.round(
    ((REQUIRED_FIELD_PATHS.length - missingFields.length) / REQUIRED_FIELD_PATHS.length) * 100,
  );
  return { completenessScore, missingFields };
}

function buildDraftPaths(input: GenerationContextBuildInput): Record<string, unknown> {
  return {
    "metadata.generationId": `${input.projectId}:${input.runId}`,
    "metadata.projectId": input.projectId,
    "metadata.runId": input.runId,
    "product.verified": input.productAnalysis != null,
    "marketplace.layout": input.layout ? (input.layout === "marketplace" ? "marketplace" : "other") : undefined,
    "generationMode.mode": input.generationMode,
    "operatingMode.mode": "production",
  };
}

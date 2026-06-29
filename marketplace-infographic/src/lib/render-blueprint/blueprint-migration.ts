/**
 * Chapter 3.12 — Blueprint schema migrations (before validation)
 */
import type { RenderBlueprint } from "./types";
import { RENDER_BLUEPRINT_VERSION } from "./types";
import { createInitialLifecycleMeta } from "./lifecycle";

const BLUEPRINT_TOP_LEVEL_KEYS = new Set([
  "meta",
  "lifecycle",
  "creative",
  "story",
  "product",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "background",
  "render",
  "constraints",
  "validation",
]);

export function extractUnknownBlueprintFields(
  raw: Record<string, unknown>,
): { blueprint: Record<string, unknown>; unknownFields: Record<string, unknown> } {
  const blueprint: Record<string, unknown> = {};
  const unknownFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (BLUEPRINT_TOP_LEVEL_KEYS.has(key)) {
      blueprint[key] = value;
    } else {
      unknownFields[key] = value;
    }
  }
  return { blueprint, unknownFields };
}

/** Migrate loaded blueprint to current schema version */
export function migrateBlueprint(
  input: Record<string, unknown>,
  unknownFields: Record<string, unknown> = {},
): { blueprint: RenderBlueprint; unknownFields: Record<string, unknown> } {
  let data = { ...input };
  const preserved = { ...unknownFields };

  const version =
    typeof data.meta === "object" && data.meta && "version" in data.meta
      ? Number((data.meta as { version: number }).version)
      : 0;

  if (version < 18) {
    data = migrateToV18(data);
  }

  if (!data.lifecycle) {
    data.lifecycle = createInitialLifecycleMeta();
  }

  const meta = data.meta as RenderBlueprint["meta"] | undefined;
  if (meta) {
    meta.version = RENDER_BLUEPRINT_VERSION;
    if (meta.revision === undefined) meta.revision = 0;
  }

  const constraints = data.constraints as RenderBlueprint["constraints"] | undefined;
  if (constraints && !constraints.set) {
    constraints.set = { constraints: [], revision: meta?.revision ?? 0 };
  }

  const { blueprint: cleaned, unknownFields: extra } = extractUnknownBlueprintFields(data);
  return {
    blueprint: cleaned as RenderBlueprint,
    unknownFields: { ...preserved, ...extra },
  };
}

function migrateToV18(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };

  if (!next.scene && next.environment) {
    next.scene = {
      environment: next.environment,
      architecture: "modern",
      timeOfDay: "day",
      weather: "clear",
      depth: "medium",
      surface: "matte",
    };
    delete next.environment;
  }

  if (next.constraints && typeof next.constraints === "object") {
    const c = next.constraints as Record<string, unknown>;
    if (c.noText !== undefined && c.mustAvoidText === undefined) {
      c.mustAvoidText = c.noText;
    }
    if (!c.set) {
      c.set = { constraints: [], revision: 0 };
    }
  }

  if (!next.meta || typeof next.meta !== "object") {
    next.meta = {
      id: "migrated",
      version: RENDER_BLUEPRINT_VERSION,
      revision: 0,
      generator: "flux",
      createdAt: Date.now(),
      seed: 0,
      retry: 0,
      layout: "marketplace",
    };
  } else {
    (next.meta as Record<string, unknown>).version = RENDER_BLUEPRINT_VERSION;
  }

  return next;
}

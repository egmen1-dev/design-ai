/**
 * Blueprint top-level field classification (Ch 3.12 / 3.13)
 */
import type { RenderBlueprint } from "./types";

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

export function mergeUnknownBlueprintFields(
  blueprint: RenderBlueprint,
  unknownFields: Record<string, unknown>,
): RenderBlueprint {
  return { ...blueprint, ...unknownFields } as RenderBlueprint;
}

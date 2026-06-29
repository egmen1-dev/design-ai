/**
 * Chapter 3.5 — Section content hashing (SHA256)
 */
import { createHash } from "crypto";
import type { BlueprintSection, RenderBlueprint } from "./types";

export function hashValue(value: unknown): string {
  const json = JSON.stringify(value ?? null);
  return createHash("sha256").update(json).digest("hex");
}

export function getSectionValue(
  blueprint: RenderBlueprint,
  section: BlueprintSection,
): unknown {
  switch (section) {
    case "meta":
      return blueprint.meta;
    case "creative":
      return blueprint.creative;
    case "story":
      return blueprint.story;
    case "product":
      return blueprint.product;
    case "scene":
      return blueprint.scene;
    case "photography":
      return blueprint.photography;
    case "camera":
      return blueprint.camera;
    case "lighting":
      return blueprint.lighting;
    case "materials":
      return blueprint.materials;
    case "composition":
      return blueprint.composition;
    case "background":
      return blueprint.background;
    case "constraints":
      return blueprint.constraints;
    case "validation":
      return blueprint.validation;
    case "render":
      return blueprint.render;
    default:
      return null;
  }
}

export function hashSection(blueprint: RenderBlueprint, section: BlueprintSection): string {
  return hashValue(getSectionValue(blueprint, section));
}

/**
 * Chapter 3.11 — Negative Prompt Contract
 */
import type { RenderBlueprint } from "./types";

const BASE_NEGATIVE = [
  "text",
  "logo",
  "watermark",
  "duplicate objects",
  "low quality",
  "artifacts",
  "blurry",
  "people",
  "typography",
];

const PROFILE_EXTRA: Record<string, string[]> = {
  marketplace_backdrop_v1: ["product", "packaging", "letters", "numbers"],
  minimal: ["clutter", "busy background"],
};

export function compileNegativePrompt(blueprint: Readonly<RenderBlueprint>): string {
  const terms = [...BASE_NEGATIVE];
  const profile = blueprint.render.negativePromptProfile;
  if (profile && PROFILE_EXTRA[profile]) {
    terms.push(...PROFILE_EXTRA[profile]);
  }
  if (blueprint.constraints.mustAvoidText) {
    terms.push("words", "captions");
  }
  if (blueprint.background.containsPeople === false) {
    terms.push("person", "human");
  }
  return [...new Set(terms)].join(", ");
}

export function validateNegativePrompt(negative: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (/\b(improve|ctr|composition cleaner|professional design)\b/i.test(negative)) {
    issues.push("negative prompt must not contain logical instructions");
  }
  return { ok: issues.length === 0, issues };
}

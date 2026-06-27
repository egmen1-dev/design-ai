import type {
  CompiledSection,
  PromptCompilerInput,
  PromptSectionId,
  PromptValidationResult,
} from "./types";

const REQUIRED: PromptSectionId[] = [
  "product_identity",
  "scene",
  "environment",
  "composition",
  "lighting",
  "materials",
  "camera",
  "background",
  "visual_hierarchy",
  "typography_safe_zone",
  "rendering_quality",
  "marketplace_constraints",
];

export function validateCompiledPrompt(
  sections: CompiledSection[],
  input: PromptCompilerInput,
  prompt: string,
): PromptValidationResult {
  const issues: string[] = [];
  const present = new Set(sections.map((s) => s.id));
  const missingSections = REQUIRED.filter((id) => !present.has(id));

  if (missingSections.length) {
    issues.push(`Missing sections: ${missingSections.join(", ")}`);
  }
  if (!input.sceneBlueprint && !input.scenePlan.coverConceptId) {
    issues.push("Scene incomplete: no blueprint or scene plan");
  }
  if (!input.layoutSpec?.geometry && !input.layoutSpec?.heroPosition) {
    issues.push("Composition incomplete: no LayoutSpec");
  }
  if (prompt.length < 120) {
    issues.push("Prompt too short");
  }
  if (prompt.length > 3500) {
    issues.push("Prompt too complex");
  }
  if (!/lighting|light/i.test(prompt)) {
    issues.push("Lighting section missing in joined prompt");
  }
  if (!/no text|no letters/i.test(prompt) && !/typography safe/i.test(prompt)) {
    issues.push("Typography/marketplace safety missing");
  }
  const colors = input.layoutSpec?.palette?.length ?? 4;
  if (colors > 4) {
    issues.push("Brand consistency: more than 4 colors");
  }

  return {
    passed: issues.length === 0,
    issues,
    missingSections,
  };
}

export function computeReadabilityScore(sections: CompiledSection[]): number {
  const joined = sections.map((s) => s.content).join(" ");
  const words = joined.split(/\s+/).length;
  const score = 100 - Math.max(0, words - 180) * 0.15 - sections.length * 2;
  return Math.max(40, Math.min(100, Math.round(score)));
}

export function computePromptComplexityScore(prompt: string): number {
  const len = prompt.length;
  if (len < 400) return 95;
  if (len < 900) return 88;
  if (len < 1500) return 75;
  if (len < 2500) return 62;
  return 50;
}

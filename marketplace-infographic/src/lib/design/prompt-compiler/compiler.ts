import type {
  PromptCompilerInput,
  PromptCompilerMetadata,
  PromptCompilerResult,
} from "./types";
import { PROMPT_COMPILER_VERSION } from "./types";
import { DESIGN_CONSTITUTION_RULES } from "@/lib/design/design-constitution";
import { resolveRenderingProfile } from "./profiles";
import { compileAllSections, joinSections } from "./sections";
import { compileNegativePrompt } from "./negative-prompt";
import {
  validateCompiledPrompt,
  computeReadabilityScore,
  computePromptComplexityScore,
} from "./validation";

const MAX_COMPILE_ATTEMPTS = 2;

/**
 * Prompt Compiler — NEVER invents design.
 * Compiles structured decisions into one deterministic rendering prompt.
 */
export function compileRenderingPrompt(input: PromptCompilerInput): PromptCompilerResult {
  const strategy = resolveRenderingProfile({
    category: input.analysis.category,
    priceSegment: input.analysis.priceSegment,
    sceneType: input.sceneBlueprint?.scene.type,
    compositionTemplate: input.layoutSpec?.compositionTemplateId,
  });

  let attempts = 0;
  let sections = compileAllSections(input, strategy.profile);
  let prompt = joinSections(sections);
  let validation = validateCompiledPrompt(sections, input, prompt);

  while (!validation.passed && attempts < MAX_COMPILE_ATTEMPTS - 1) {
    attempts++;
    const strictInput: PromptCompilerInput = {
      ...input,
      layoutSpec: input.layoutSpec
        ? {
            ...input.layoutSpec,
            whitespaceTarget: Math.min(35, (input.layoutSpec.whitespaceTarget ?? 28) + 3),
            maxSecondaryObjects: Math.min(input.layoutSpec.maxSecondaryObjects ?? 2, 2),
            maxDecorativeObjects: 0,
          }
        : input.layoutSpec,
    };
    sections = compileAllSections(strictInput, "minimal");
    prompt = joinSections(sections);
    validation = validateCompiledPrompt(sections, strictInput, prompt);
  }

  const negativePrompt = compileNegativePrompt(input);

  const metadata: PromptCompilerMetadata = {
    version: PROMPT_COMPILER_VERSION,
    profile: strategy.profile,
    sections,
    constitutionRules: [...DESIGN_CONSTITUTION_RULES],
    luxuryScore: input.luxuryScore ?? 75,
    compositionScore: input.compositionScore ?? 78,
    sceneScore: input.sceneScore ?? 80,
    readabilityScore: computeReadabilityScore(sections),
    promptComplexityScore: computePromptComplexityScore(prompt),
    validation,
    attempts: attempts + 1,
  };

  return {
    prompt,
    negativePrompt,
    metadata,
    approved: validation.passed,
  };
}

export { compileNegativePrompt } from "./negative-prompt";
export { validateCompiledPrompt } from "./validation";

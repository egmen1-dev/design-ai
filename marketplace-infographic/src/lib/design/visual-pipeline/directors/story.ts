import type { ProductAnalysis } from "@/lib/product-analysis";
import type { DirectorResult, StoryDecision } from "../types";
import { resolveStoryDecision } from "../catalogs/story";

export type StoryDirectorInput = {
  prompt: string;
  analysis: ProductAnalysis;
};

/** Story Director — commercial narrative selection only, no scene prose */
export function runStoryDirector(input: StoryDirectorInput): DirectorResult<StoryDecision> {
  const decision = resolveStoryDecision(input.analysis.category, input.analysis.priceSegment);
  const score = 85;
  return {
    decision,
    approved: true,
    score,
    agentSnippet: `Story:${decision.storyType} emotion:${decision.targetEmotion}`,
  };
}

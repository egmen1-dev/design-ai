import type { VisualStoryDirectorInput, VisualStoryDirectorResult } from "./types";
import { resolveStoryDecision } from "@/lib/design/visual-pipeline/catalogs/story";

export function evaluateVisualStoryDirectorHeuristic(
  input: VisualStoryDirectorInput,
): VisualStoryDirectorResult {
  const genomeStory = input.genomeContext.storyBlueprint;
  const creative = input.activeCreative;
  const hook = input.designBrief?.designProcess?.visualHook ?? input.designBrief?.visualHook;

  const decision = resolveStoryDecision(
    input.analysis.category,
    input.analysis.priceSegment,
  );

  const customerIntent = genomeStory.customerIntent;
  let score = 78;
  if (hook?.type) score += 6;
  if (input.marketIntelligenceSnippet) score += 4;

  return {
    decision,
    storyBlueprint: {
      ...genomeStory,
      heroConcept: decision.storyType,
      sceneNarrative: decision.usageContext,
      marketingHook: input.prompt.slice(0, 100),
    },
    sceneNarrative: decision.usageContext,
    heroConcept: decision.storyType,
    customerIntent,
    visualHook: hook,
    compositionScenarioId: genomeStory.compositionScenarioId,
    approved: score >= 78,
    score: Math.min(100, score),
    agentSnippet: `Story:${decision.storyType} ${decision.targetEmotion}`,
    source: "structured",
  };
}

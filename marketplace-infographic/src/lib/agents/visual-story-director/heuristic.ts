import type { VisualStoryDirectorInput, VisualStoryDirectorResult } from "./types";

export function evaluateVisualStoryDirectorHeuristic(
  input: VisualStoryDirectorInput,
): VisualStoryDirectorResult {
  const genomeStory = input.genomeContext.storyBlueprint;
  const creative = input.activeCreative;
  const hook = input.designBrief?.designProcess?.visualHook ?? input.designBrief?.visualHook;

  const heroConcept =
    creative?.creativeConcept?.mainIdea ??
    genomeStory.heroConcept ??
    input.designBrief?.designConcept ??
    "Product solves buyer problem";

  const sceneNarrative =
    creative?.sceneNarrative ??
    genomeStory.sceneNarrative ??
    `${heroConcept}. Environment matches ${input.analysis.category.replace(/_/g, " ")}.`;

  const customerIntent = genomeStory.customerIntent;
  let score = 72;
  if (heroConcept.length > 20) score += 8;
  if (sceneNarrative.length > 30) score += 6;
  if (hook?.type) score += 6;
  if (input.marketIntelligenceSnippet) score += 4;

  return {
    storyBlueprint: {
      ...genomeStory,
      heroConcept,
      sceneNarrative,
      marketingHook: input.prompt.slice(0, 100),
    },
    sceneNarrative,
    heroConcept,
    customerIntent,
    visualHook: hook,
    compositionScenarioId: genomeStory.compositionScenarioId,
    approved: score >= 78,
    score: Math.min(100, score),
    agentSnippet: `Story: ${heroConcept.slice(0, 60)}`,
    source: creative ? "merged" : "genome",
  };
}

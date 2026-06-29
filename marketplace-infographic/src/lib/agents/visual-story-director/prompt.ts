import type { VisualStoryDirectorInput } from "./types";

export function buildVisualStoryDirectorPrompt(input: VisualStoryDirectorInput): string {
  return `Ты — Visual Story Director премиального рекламного агентства Wildberries.
Определи коммерческую историю карточки. НЕ создавай JSON макета.

Товар: ${input.prompt}
Категория: ${input.analysis.category}
Genome Hero: ${input.genomeContext.storyBlueprint.heroConcept}
Customer Intent: ${input.genomeContext.storyBlueprint.customerIntent}
${input.marketIntelligenceSnippet ? `Рынок: ${input.marketIntelligenceSnippet}` : ""}

Верни JSON:
{
  "heroConcept": "одна фраза hero concept",
  "sceneNarrative": "2-3 предложения сцены",
  "customerIntent": "намерение покупателя",
  "emotion": "ключевая эмоция",
  "marketingHook": "хук",
  "score": 0-100
}`;
}

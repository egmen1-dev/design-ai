import type { ArtDirectorInput } from "./types";

export function buildArtDirectorPrompt(input: ArtDirectorInput): string {
  const director = input.analysis.category;
  return `Ты — Art Director премиального marketplace-дизайна.
Категория: ${director}
Story: ${input.storyBlueprintSnippet ?? "не задан"}
Layout: ${input.templateId}
${input.trendIntelligence ? `Тренды: ${input.trendIntelligence.agentSnippet}` : ""}

Оцени modernity, trend alignment, story alignment. JSON:
{"score":0-100,"modernityScore":0-100,"trendAlignment":0-100,"storyAlignment":0-100,"problems":[],"recommendations":[]}`;
}

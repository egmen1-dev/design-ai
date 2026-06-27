import { resolveArtDirector } from "@/lib/design-process/category-art-directors";
import { analyzeTrendAlignment } from "@/lib/design/trend-intelligence";
import type { ArtDirectorInput, ArtDirectorReview } from "./types";
import { ART_DIRECTOR_APPROVE_SCORE } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function evaluateArtDirectorHeuristic(input: ArtDirectorInput): ArtDirectorReview {
  const director = resolveArtDirector(input.analysis.category, input.productPrompt);
  const problems: string[] = [];
  const recommendations: string[] = [];

  let modernityScore = 72;
  let storyAlignment = 70;
  let trendAlignment = 68;

  if (input.storyBlueprintSnippet && input.storyBlueprintSnippet.length > 20) {
    storyAlignment += 12;
  } else {
    problems.push("Story Blueprint слабо связан с визуалом");
    recommendations.push("Усилить hero concept в заголовке и сцене");
  }

  const env = input.creative?.sceneNarrative?.toLowerCase() ?? "";
  const forbiddenHit = director.forbiddenScenes.some((f) => env.includes(f.slice(0, 12).toLowerCase()));
  if (forbiddenHit) {
    problems.push("Сцена не соответствует Art Director профилю категории");
    modernityScore -= 15;
  } else {
    modernityScore += 8;
  }

  if (input.trendIntelligence) {
    trendAlignment = analyzeTrendAlignment({
      layoutTemplate: input.templateId,
      badgeStyle: "glass",
      backgroundType: undefined,
      trend: input.trendIntelligence,
    });
    if (trendAlignment < 60) {
      problems.push("Дизайн не соответствует актуальным трендам маркетплейса");
      recommendations.push(`Предпочтительные layout: ${input.trendIntelligence.risingLayouts.join(", ")}`);
    }
  }

  if (input.layout.metrics.whitespacePct < 18) {
    problems.push("Недостаточно воздуха для премиального вида");
    modernityScore -= 8;
  }

  const score = clamp((modernityScore + storyAlignment + trendAlignment) / 3);
  return {
    score,
    approved: score >= ART_DIRECTOR_APPROVE_SCORE && problems.length <= 1,
    modernityScore: clamp(modernityScore),
    trendAlignment: clamp(trendAlignment),
    storyAlignment: clamp(storyAlignment),
    problems,
    recommendations,
    source: "heuristic",
    templateId: input.templateId,
  };
}

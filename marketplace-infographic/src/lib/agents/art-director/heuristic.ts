import { resolveArtDirector } from "@/lib/design-process/category-art-directors";
import { analyzeTrendAlignment } from "@/lib/design/trend-intelligence";
import { buildCorrection } from "@/lib/design/quality-v165/critic-corrections";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec/types";
import type { ArtDirectorInput, ArtDirectorReview } from "./types";
import { ART_DIRECTOR_APPROVE_SCORE } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function evaluateArtDirectorHeuristic(input: ArtDirectorInput): ArtDirectorReview {
  const director = resolveArtDirector(input.analysis.category, input.productPrompt);
  const problems: string[] = [];
  const recommendations: string[] = [];
  const corrections = [];
  const layoutSpecPatch: LayoutSpecPatch = {};

  let modernityScore = 72;
  let storyAlignment = 70;
  let trendAlignment = 68;

  if (input.storyBlueprintSnippet && input.storyBlueprintSnippet.length > 20) {
    storyAlignment += 12;
  } else {
    problems.push("Story Blueprint слабо связан с визуалом");
    recommendations.push("Усилить hero concept в заголовке и сцене");
    corrections.push(
      buildCorrection("story-align", "Усилить hero в заголовке", {
        headlineContrastBoost: 0.1,
        heroScaleDelta: 0.05,
      }),
    );
  }

  const env = input.creative?.sceneNarrative?.toLowerCase() ?? "";
  const forbiddenHit = director.forbiddenScenes.some((f) => env.includes(f.slice(0, 12).toLowerCase()));
  if (forbiddenHit) {
    problems.push("Сцена не соответствует Art Director профилю категории");
    modernityScore -= 15;
    corrections.push(
      buildCorrection("scene-fix", "Сменить фон на clean studio", {
        backgroundStyle: "clean_studio",
        removeDecorations: true,
      }),
    );
    layoutSpecPatch.backgroundStyle = "clean_studio";
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
      corrections.push(
        buildCorrection("trend-layout", "Подтянуть layout к трендам", {
          whitespaceTarget: 28,
          backgroundStyle: "soft_gradient",
        }),
      );
    }
  }

  if (input.layout.metrics.whitespacePct < 18) {
    problems.push("Недостаточно воздуха для премиального вида");
    modernityScore -= 8;
    corrections.push(
      buildCorrection("whitespace", "Увеличить воздух", {
        whitespaceTarget: 30,
        reduceObjectCount: 1,
        removeDecorations: true,
      }),
    );
    layoutSpecPatch.whitespaceTarget = 30;
  }

  if (input.layout.metrics.productAreaPct < 60) {
    corrections.push(
      buildCorrection("hero-scale", "Увеличить hero на 15%", { heroScaleDelta: 0.15 }),
    );
    layoutSpecPatch.heroScaleDelta = 0.15;
  }

  const score = clamp((modernityScore + storyAlignment + trendAlignment) / 3);
  const confidence = clamp(88 - problems.length * 8);

  return {
    score,
    approved: score >= ART_DIRECTOR_APPROVE_SCORE && problems.length <= 1,
    confidence,
    modernityScore: clamp(modernityScore),
    trendAlignment: clamp(trendAlignment),
    storyAlignment: clamp(storyAlignment),
    problems,
    issues: problems,
    recommendations,
    corrections,
    layoutSpecPatch,
    source: "heuristic",
    templateId: input.templateId,
  };
}

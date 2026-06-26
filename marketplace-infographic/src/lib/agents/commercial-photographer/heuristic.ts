import type {
  CommercialPhotographerDimensionScores,
  CommercialPhotographerReview,
} from "./types";
import { PHOTO_BEHANCE_SCORE, PHOTO_PNG_OVERLAY_CAP } from "./types";
import type { CommercialPhotographerInput } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function dimScore(
  validation: CommercialPhotographerInput["qualityValidation"],
  id: string,
  fallback: number,
): number {
  const d = validation?.dimensions.find((x) => x.id === id);
  return clamp(d?.score ?? fallback);
}

/** Строгая оценка фотореализма — PNG overlay cap 60 */
export function evaluateCommercialPhotographerHeuristic(
  input: CommercialPhotographerInput,
): CommercialPhotographerReview {
  const problems: string[] = [];
  const recommendations: string[] = [];

  if (!input.hasComposite) {
    problems.push("Нет фотореалистичного композита — товар выглядит как PNG поверх фона");
    recommendations.push("Включить scene compositor: lighting match, shadows, color match");
  }

  if (input.backgroundSource === "fallback") {
    problems.push("Градиентный fallback вместо реальной сцены — не рекламная фотография");
    recommendations.push("Перегенерировать SD-фон");
  }

  const lightingScore = dimScore(input.qualityValidation, "lighting_consistency", 72);
  const shadowScore = dimScore(input.qualityValidation, "shadow_quality", input.hasShadows ? 80 : 55);
  const colorScore = dimScore(input.qualityValidation, "color_harmony", 75);
  const depthScore = dimScore(input.qualityValidation, "depth_feeling", 78);

  if (input.lighting) {
    const expectedKelvin = Number(input.scene.lightingTemperature.replace(/\D/g, "")) || 5500;
    const kelvinDiff = Math.abs(input.lighting.temperatureKelvin - expectedKelvin);
    if (kelvinDiff > 1500) {
      problems.push("Цветовая температура товара и фона не совпадает");
      recommendations.push("Подстроить lighting matcher под сцену");
    }
  } else if (input.hasComposite) {
    problems.push("Нет профиля освещения сцены");
  }

  if (!input.hasShadows && input.scene.shadowProfile !== "ambient") {
    problems.push("Отсутствует контактная тень — товар «висит» над поверхностью");
    recommendations.push("Добавить contact shadow под товаром");
  }

  const sceneDir = input.scene.lightingDirection.toLowerCase();
  const lightDir = input.lighting?.direction ?? "ambient";
  if (
    input.lighting &&
    sceneDir.includes("left") &&
    lightDir === "right"
  ) {
    problems.push("Направление света на товаре и фоне расходится");
  }

  if (input.scene.reflectionEnabled && !input.hasReflection) {
    problems.push("Сцена предполагает отражение, но оно не применено");
  }

  const perspective = clamp(
    input.scene.cameraAngle.includes("hero") || input.scene.cameraAngle.includes("quarter")
      ? 82
      : 74,
  );

  const integration = clamp(
    (input.hasComposite ? 78 : 42) -
      problems.filter((p) => p.includes("PNG") || p.includes("композит")).length * 15 -
      (lightingScore < 70 ? 12 : 0),
  );

  const scores: CommercialPhotographerDimensionScores = {
    lighting: lightingScore,
    shadows: shadowScore,
    perspective,
    integration,
    colorMatching: colorScore,
    realism: clamp((lightingScore + shadowScore + integration + depthScore) / 4),
  };

  let realism = scores.realism;
  let score = clamp(Object.values(scores).reduce((a, b) => a + b, 0) / 6 - problems.length * 4);

  const pngOverlayFeel =
    !input.hasComposite ||
    integration < 55 ||
    lightingScore < 68 ||
    problems.some((p) => p.includes("PNG"));

  if (pngOverlayFeel) {
    score = Math.min(score, PHOTO_PNG_OVERLAY_CAP);
    realism = Math.min(realism, PHOTO_PNG_OVERLAY_CAP);
    scores.integration = Math.min(scores.integration, PHOTO_PNG_OVERLAY_CAP);
    scores.realism = realism;
  }

  if (score > PHOTO_BEHANCE_SCORE && problems.length > 0) {
    score = PHOTO_BEHANCE_SCORE;
  }

  const looksLikePhoto =
    score >= 82 &&
    realism >= 78 &&
    integration >= 72 &&
    problems.length === 0 &&
    input.hasComposite &&
    input.backgroundSource === "sd" &&
    !pngOverlayFeel;

  if (!looksLikePhoto && recommendations.length < 2) {
    recommendations.push("Усилить contact shadow и color matching для интеграции товара в сцену");
  }

  return {
    score,
    realism,
    looksLikePhoto,
    problems,
    recommendations,
    scores,
    source: "heuristic",
  };
}

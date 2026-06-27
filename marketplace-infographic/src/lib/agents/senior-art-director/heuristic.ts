import { hasWordBreakInsideWord } from "@/lib/layout-engine/headline";
import { getTemplate } from "@/lib/layout-engine/templates";
import { isEnvironmentAllowed } from "@/lib/layout-engine/background-categories";
import { buildCorrection } from "@/lib/design/quality-v165/critic-corrections";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec/types";
import type { SeniorArtDirectorInput, SeniorArtDirectorReview } from "./types";
import { SENIOR_AD_APPROVE_SCORE } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Строгая детерминированная оценка — всегда выполняется */
export function evaluateSeniorArtDirectorHeuristic(
  input: SeniorArtDirectorInput,
): SeniorArtDirectorReview {
  const { layout, meaning, templateId } = input;
  const m = layout.metrics;
  const template = getTemplate(templateId);
  const criticalProblems: string[] = [];
  const recommendations: string[] = [];
  const corrections = [];
  const layoutSpecPatch: LayoutSpecPatch = {};

  if (hasWordBreakInsideWord(meaning.title)) {
    criticalProblems.push("Перенос слова в заголовке");
  }

  if (m.whitespacePct < 20) {
    criticalProblems.push("Недостаточно воздуха (<20%)");
    recommendations.push("Уменьшить количество элементов или увеличить отступы");
    corrections.push(
      buildCorrection("whitespace", "Увеличить whitespace до 28%", {
        whitespaceTarget: 28,
        reduceObjectCount: 1,
      }),
    );
    layoutSpecPatch.whitespaceTarget = 28;
  }

  if (m.overlapPct > 2) {
    criticalProblems.push("Пересечение зон текста и товара");
  }

  if (m.productAreaPct < 55 || m.productAreaPct > 75) {
    criticalProblems.push(`Товар вне диапазона 55–75% (сейчас ${Math.round(m.productAreaPct)}%)`);
    if (m.productAreaPct < 55) {
      corrections.push(
        buildCorrection("hero-up", "Увеличить hero на 15%", { heroScaleDelta: 0.15 }),
      );
      layoutSpecPatch.heroScaleDelta = 0.15;
    }
  }

  if (m.plaqueAreaPct > 10) {
    criticalProblems.push("Слишком крупные плашки");
    recommendations.push("Плашка 6–8% высоты, ширина по контенту");
  }

  if (meaning.feature && template.featureSide === "right" && layout.rightSidebar.width === 0) {
    criticalProblems.push("Характеристика не размещена — шаблон с правой плашкой не реализован");
    recommendations.push("Использовать шаблон с featureSide: left или реализовать rightSidebar");
  }

  if (
    meaning.badge &&
    layout.leftPanel.width === 0 &&
    layout.rightSidebar.width === 0
  ) {
    criticalProblems.push("Бейдж доверия не размещён в композиции");
    recommendations.push("Добавить компактный badge под заголовком или у товара");
  }

  if (!meaning.subtitle && layout.subtitle.height > 0 && layout.subtitle.width > 0) {
    criticalProblems.push("Пустой подзаголовок занимает место в сетке");
  }

  const elementCount =
    (input.elementCount ?? 0) +
    (meaning.title ? 1 : 0) +
    (meaning.feature ? 1 : 0) +
    (meaning.badge ? 1 : 0) +
    (meaning.subtitle ? 1 : 0);

  if (elementCount > 4) {
    criticalProblems.push("Перегруженная композиция — слишком много элементов");
    corrections.push(
      buildCorrection("reduce-objects", "Убрать лишние объекты", {
        reduceObjectCount: elementCount - 3,
        removeDecorations: true,
        maxSecondaryObjects: 1,
      }),
    );
    layoutSpecPatch.reduceObjectCount = elementCount - 3;
  }

  const env = input.creative?.sceneNarrative ?? "";
  if (env && !isEnvironmentAllowed(input.analysis.category, env)) {
    criticalProblems.push("Фон не соответствует категории товара");
  }

  const thirdX = Math.abs(m.visualCenterX - 50) > 12;
  const composition = clamp(
    100 -
      m.overlapPct * 8 -
      (m.whitespacePct < 20 ? 25 : 0) -
      (thirdX ? 8 : 0) -
      criticalProblems.filter((p) => p.includes("Пересечение") || p.includes("вне диапазона")).length * 12,
  );

  const titleLen = meaning.title.length;
  const headlinePx = input.headlineFontPx ?? 60;
  const typography = clamp(
    (titleLen <= 45 ? 92 : titleLen <= 60 ? 78 : 62) -
      (hasWordBreakInsideWord(meaning.title) ? 30 : 0) -
      (headlinePx < 46 || headlinePx > 84 ? 15 : 0),
  );

  const hierarchy = clamp(
    (m.productAreaPct >= m.textAreaPct * 2.5 ? 90 : 65) -
      (meaning.badge && layout.leftPanel.width === 0 ? 12 : 0) -
      (meaning.feature && template.featureSide === "right" ? 20 : 0),
  );

  const balance = clamp(
    100 - Math.abs(m.visualCenterX - 50) * 1.4 - Math.abs(m.visualCenterY - 52) * 0.8,
  );

  const minimalism = clamp(
    (m.textAreaPct < 15 && m.plaqueAreaPct < 9 ? 94 : 72) - (elementCount > 3 ? 15 : 0),
  );

  const modernLook = clamp(
    (template.id === "minimal" || template.id === "premium" || template.id === "glass" ? 88 : 76) -
      criticalProblems.length * 4,
  );

  const scores = { composition, typography, hierarchy, balance, minimalism, modernLook };
  const score = clamp(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length -
      criticalProblems.length * 3,
  );

  if (score < SENIOR_AD_APPROVE_SCORE && recommendations.length === 0) {
    recommendations.push("Попробовать другой layout template с большим воздухом");
  }

  return {
    score,
    approved: score >= SENIOR_AD_APPROVE_SCORE && criticalProblems.length === 0,
    confidence: clamp(90 - criticalProblems.length * 7),
    criticalProblems,
    issues: criticalProblems,
    recommendations,
    corrections,
    layoutSpecPatch,
    scores,
    source: "heuristic",
    templateId,
  };
}

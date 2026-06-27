import { isEnvironmentAllowed } from "@/lib/layout-engine/background-categories";
import { buildCorrection } from "@/lib/design/quality-v165/critic-corrections";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec/types";
import type {
  MarketplaceCtrDimensionScores,
  MarketplaceCtrReview,
} from "./types";
import { CTR_AVERAGE_CAP, CTR_CLICK_SCORE } from "./types";
import type { MarketplaceCtrExpertInput } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Строгая маркетинговая оценка CTR — средняя карточка ≤70 */
export function evaluateMarketplaceCtrHeuristic(
  input: MarketplaceCtrExpertInput,
): MarketplaceCtrReview {
  const { meaning, layout, creative } = input;
  const m = layout.metrics;
  const mainProblems: string[] = [];
  const recommendations: string[] = [];
  const corrections = [];
  const layoutSpecPatch: LayoutSpecPatch = {};

  const titleWords = wordCount(meaning.title);
  if (titleWords > 7) {
    mainProblems.push("Заголовок слишком длинный — не прочитают за 1 секунду");
  }
  if (!meaning.feature?.trim()) {
    mainProblems.push("Нет явного преимущества / цифры — непонятна выгода");
    recommendations.push("Добавить одну главную характеристику (кВт, литры, гарантия)");
  }
  if (!input.storyBlueprintSnippet || input.storyBlueprintSnippet.length < 12) {
    mainProblems.push("История карточки не читается за 0.5 секунды");
    recommendations.push("Усилить hero concept и одну эмоцию в заголовке");
  }
  if (meaning.title.length > 55) {
    mainProblems.push("Слишком много текста в заголовке");
  }

  const elements =
    input.elementCount ??
    (meaning.title ? 1 : 0) +
      (meaning.feature ? 1 : 0) +
      (meaning.badge ? 1 : 0) +
      (meaning.subtitle ? 1 : 0);

  if (elements > 3) {
    mainProblems.push("Перегружена информацией — больше одной мысли на обложке");
    recommendations.push("Оставить заголовок + одну цифру, остальное на следующие слайды");
    corrections.push(
      buildCorrection("ctr-simplify", "Сократить объекты до 3", {
        reduceObjectCount: elements - 3,
        maxSecondaryObjects: 1,
      }),
    );
    layoutSpecPatch.reduceObjectCount = elements - 3;
  }

  if (m.textAreaPct > 16) {
    mainProblems.push("Визуальный шум — слишком много текста на карточке");
  }

  if (m.productAreaPct < 58) {
    mainProblems.push("Товар теряется среди конкурентов — слишком маленький");
    corrections.push(
      buildCorrection("ctr-hero", "Увеличить товар", { heroScaleDelta: 0.12 }),
    );
    layoutSpecPatch.heroScaleDelta = 0.12;
  }

  const env = creative?.sceneNarrative ?? "";
  if (env && !isEnvironmentAllowed(input.analysis.category, env)) {
    mainProblems.push("Сцена не соответствует категории — снижает доверие в выдаче");
  }

  const headlineIsProductName = /генератор|триммер|пылесос|дрель/i.test(meaning.title) &&
    meaning.title.length < 30 &&
    !meaning.feature;
  if (headlineIsProductName) {
    mainProblems.push("Заголовок = название товара, а не выгода — не продаёт");
    recommendations.push("Заменить на выгоду: «Электричество всегда под рукой», не «Генератор 3 кВт»");
  }

  const clarity = clamp(
    (titleWords <= 6 ? 82 : titleWords <= 8 ? 68 : 52) -
      (meaning.title.length > 50 ? 12 : 0) -
      (headlineIsProductName ? 18 : 0),
  );

  const sellingPower = clamp(
    (meaning.feature ? 78 : 48) +
      (meaning.badge ? 6 : 0) -
      (elements > 3 ? 20 : 0) -
      mainProblems.filter((p) => p.includes("выгода") || p.includes("продаёт")).length * 10,
  );

  const attention = clamp(
    (m.productAreaPct >= 60 ? 85 : m.productAreaPct >= 55 ? 72 : 55) -
      (m.overlapPct > 2 ? 15 : 0),
  );

  const emotion = clamp(
    meaning.emotion && meaning.emotion.length > 2 ? 74 : 58,
  );

  const marketplaceFit = clamp(
    80 -
      mainProblems.filter((p) => p.includes("категор") || p.includes("Сцена")).length * 18 -
      (m.whitespacePct < 18 ? 10 : 0),
  );

  const scores: MarketplaceCtrDimensionScores = {
    clarity,
    sellingPower,
    attention,
    emotion,
    marketplaceFit,
  };

  let score = clamp(
    Object.values(scores).reduce((a, b) => a + b, 0) / 5 - mainProblems.length * 4,
  );

  if (score > CTR_AVERAGE_CAP && mainProblems.length > 0) {
    score = Math.min(score, CTR_AVERAGE_CAP);
  }

  const ctrPrediction = clamp(
    score * 0.55 +
      attention * 0.2 +
      sellingPower * 0.15 +
      clarity * 0.1 -
      mainProblems.length * 5,
  );

  const wouldClick =
    score >= CTR_CLICK_SCORE &&
    ctrPrediction >= 72 &&
    mainProblems.length === 0 &&
    sellingPower >= 70 &&
    clarity >= 68;

  if (!wouldClick && recommendations.length === 0) {
    recommendations.push("Усилить одну мысль: короткий заголовок + одна цифра преимущества");
  }

  return {
    score,
    ctrPrediction,
    wouldClick,
    confidence: clamp(85 - mainProblems.length * 6),
    mainProblems,
    issues: mainProblems,
    recommendations,
    corrections,
    layoutSpecPatch,
    scores,
    source: "heuristic",
    templateId: input.templateId,
  };
}

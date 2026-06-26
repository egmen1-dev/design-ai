import type { ProductAnalysis } from "@/lib/product-analysis";
import type { CreativeDirectorResult } from "./creative-concept";
import { resolveArtDirector } from "./category-art-directors";

export type ConceptScoreDimension = {
  id: string;
  label: string;
  score: number;
  weight: number;
};

export type ConceptEvaluation = {
  total: number;
  passed: boolean;
  dimensions: ConceptScoreDimension[];
  issues: string[];
};

const PASS_THRESHOLD = 90;

function scoreIdeaClarity(c: CreativeDirectorResult): number {
  const cc = c.creativeConcept;
  let score = 70;
  if (cc.mainIdea.length >= 20) score += 10;
  if (cc.whatToSayInOneSecond && cc.whatToSayInOneSecond.length <= 60) score += 12;
  if (cc.reason.length >= 30) score += 8;
  return Math.min(100, score);
}

function scoreVisualHook(c: CreativeDirectorResult): number {
  const hook = c.creativeConcept.visualHook;
  let score = 65;
  if (hook.length >= 40) score += 15;
  if (hook.length >= 80) score += 10;
  if (/70%|60%|крупн|огромн|доминир/i.test(hook)) score += 8;
  if (/закат|свет|сцен|фон/i.test(hook)) score += 5;
  return Math.min(100, score);
}

function scoreInstantRead(c: CreativeDirectorResult): number {
  const ot = c.oneThought;
  let score = 70;
  if (ot.headline.length <= 45) score += 15;
  if (ot.answer.length <= 8) score += 10;
  if (ot.badge && ot.badge.length <= 12) score += 5;
  if (ot.deferredSpecs.length >= 1) score += 5;
  return Math.min(100, score);
}

function scoreOneThoughtRule(c: CreativeDirectorResult): number {
  const ot = c.oneThought;
  const hasSingleHero = ot.answer.length > 0 && ot.headline.length > 0;
  const notOverloaded = ot.deferredSpecs.length <= 6;
  return hasSingleHero && notOverloaded ? 95 : 60;
}

function scoreCategoryFit(c: CreativeDirectorResult, analysis: ProductAnalysis, prompt: string): number {
  const director = resolveArtDirector(analysis.category, prompt);
  const text = `${c.sceneNarrative} ${c.creativeConcept.visualHook}`.toLowerCase();
  let score = 80;

  for (const forbidden of director.forbiddenScenes) {
    const key = forbidden.split(" ")[0]?.toLowerCase();
    if (key && text.includes(key)) score -= 25;
  }

  const envMatch = director.sceneEnvironments.some((env) => {
    const token = env.split(" ")[0]?.toLowerCase();
    return token && text.includes(token);
  });
  if (envMatch) score += 12;

  const keywordHits = director.styleKeywords.filter((kw) =>
    text.includes(kw.toLowerCase().split(" ")[0] ?? ""),
  ).length;
  score += Math.min(10, keywordHits * 3);

  return Math.max(40, Math.min(100, score));
}

function scorePremiumFeel(c: CreativeDirectorResult): number {
  const cc = c.creativeConcept;
  const premiumWords = /премиум|premium|люкс|профессион|editorial|дорог/i;
  let score = 82;
  if (premiumWords.test(cc.emotion + cc.toneOfVoice + cc.visualHook)) score += 10;
  if (cc.styleKeywords.length >= 3) score += 5;
  return Math.min(100, score);
}

function scoreProductHeroPotential(c: CreativeDirectorResult): number {
  const hook = c.creativeConcept.visualHook.toLowerCase();
  if (/70%|75%|крупн|огромн|доминир|герой/i.test(hook)) return 96;
  if (/60%|больш/i.test(hook)) return 90;
  if (/минимум текста.*максимум/i.test(hook)) return 92;
  return 75;
}

function scoreScenarioFit(c: CreativeDirectorResult): number {
  return c.compositionScenarioId ? 92 : 78;
}

/** Оценка концепта 0–100 до генерации изображения */
export function evaluateConcept(
  concept: CreativeDirectorResult,
  analysis: ProductAnalysis,
  productPrompt: string,
): ConceptEvaluation {
  const dimensions: ConceptScoreDimension[] = [
    { id: "idea_clarity", label: "Ясность идеи", score: scoreIdeaClarity(concept), weight: 0.14 },
    { id: "visual_hook", label: "Сила визуального хука", score: scoreVisualHook(concept), weight: 0.16 },
    { id: "instant_read", label: "Понятность за 1–2 сек", score: scoreInstantRead(concept), weight: 0.14 },
    { id: "one_thought", label: "Правило одной мысли", score: scoreOneThoughtRule(concept), weight: 0.12 },
    { id: "category_fit", label: "Соответствие категории", score: scoreCategoryFit(concept, analysis, productPrompt), weight: 0.12 },
    { id: "premium_feel", label: "Ощущение «дорого»", score: scorePremiumFeel(concept), weight: 0.08 },
    { id: "product_hero", label: "Потенциал героя-кадра", score: scoreProductHeroPotential(concept), weight: 0.14 },
    { id: "scenario_fit", label: "Композиционный сценарий", score: scoreScenarioFit(concept), weight: 0.1 },
  ];

  const weightSum = dimensions.reduce((s, d) => s + d.weight, 0);
  const total = Math.round(
    dimensions.reduce((s, d) => s + d.score * d.weight, 0) / weightSum,
  );

  const issues: string[] = [];
  for (const d of dimensions) {
    if (d.score < PASS_THRESHOLD) issues.push(`${d.id}:${d.score}`);
  }

  return {
    total,
    passed: total >= PASS_THRESHOLD && dimensions.every((d) => d.score >= 70),
    dimensions,
    issues,
  };
}

export { PASS_THRESHOLD as CONCEPT_PASS_THRESHOLD };

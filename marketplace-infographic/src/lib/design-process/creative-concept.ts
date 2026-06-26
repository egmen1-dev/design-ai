import type { CompositionScenarioId } from "@/lib/design/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { resolveArtDirector } from "./category-art-directors";
import { evaluateConcept } from "./concept-evaluator";

/** Рекламная идея карточки — до любой вёрстки (Engine 2.0) */
export type CreativeConcept = {
  title: string;
  mainIdea: string;
  visualHook: string;
  emotion: string;
  marketingGoal: string;
  reason: string;
  targetAudience: string;
  toneOfVoice: string;
  styleKeywords: string[];
  whatToSayInOneSecond: string;
};

export type OneThought = {
  question: string;
  answer: string;
  answerLabel: string;
  headline: string;
  badge?: string;
  deferredSpecs: string[];
};

export type CreativeDirectorResult = {
  creativeConcept: CreativeConcept;
  oneThought: OneThought;
  sceneNarrative: string;
  compositionScenarioId?: CompositionScenarioId;
  conceptScore?: number;
};

export type ScoredConcept = {
  concept: CreativeDirectorResult;
  evaluation: import("./concept-evaluator").ConceptEvaluation;
};

function extractSpecs(prompt: string): string[] {
  const parts = prompt
    .split(/[.!?\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
  return parts.slice(0, 8);
}

function pickHeroSpec(prompt: string, specs: string[]): { value: string; label: string } {
  const kw = prompt.toLowerCase();
  const kwt = specs.find((s) => /\d[\d.,]*\s*квт/i.test(s));
  if (kwt) {
    const m = kwt.match(/(\d[\d.,]*)\s*кВт/i);
    return { value: m?.[1] ?? "3", label: "кВт" };
  }
  const db = specs.find((s) => /\d+\s*дБ/i.test(s));
  if (db) {
    const m = db.match(/(\d+)\s*дБ/i);
    return { value: m?.[1] ?? "65", label: "дБ" };
  }
  const warranty = specs.find((s) => /гарант|месяц/i.test(s));
  if (warranty) {
    const m = warranty.match(/(\d+)\s*месяц/i);
    return { value: m?.[1] ?? "12", label: "мес. гарантии" };
  }
  const liters = specs.find((s) => /\d+\s*л(?:итр)?/i.test(s));
  if (liters) {
    const m = liters.match(/(\d+)\s*л/i);
    return { value: m?.[1] ?? "15", label: "литров" };
  }
  if (/генератор|generator/i.test(kw)) {
    return { value: "3", label: "кВт" };
  }
  const spf = specs.find((s) => /spf\s*\d+/i.test(s));
  if (spf) {
    const m = spf.match(/spf\s*(\d+)/i);
    return { value: m?.[1] ?? "30", label: "SPF" };
  }
  const hours = specs.find((s) => /\d+\s*час/i.test(s));
  if (hours) {
    const m = hours.match(/(\d+)\s*час/i);
    return { value: m?.[1] ?? "30", label: "часов" };
  }
  const first = specs.find((s) => /\d/.test(s));
  if (first) {
    const m = first.match(/(\d+(?:[.,]\d+)?)/);
    return { value: m?.[1] ?? "1", label: first.replace(/\d+(?:[.,]\d+)?\s*/, "").slice(0, 20) || "параметр" };
  }
  return { value: "★", label: "премиум" };
}

function buildConceptBase(
  analysis: ProductAnalysis,
  prompt: string,
  scenarioId: CompositionScenarioId,
  variantIndex: number,
): CreativeDirectorResult {
  const director = resolveArtDirector(analysis.category, prompt);
  const specs = extractSpecs(prompt);
  const hero = pickHeroSpec(prompt, specs);
  const deferred = specs
    .filter(
      (s) =>
        !s.includes(hero.value) ||
        !s.toLowerCase().includes(hero.label.toLowerCase().slice(0, 3)),
    )
    .slice(0, 5);

  const env =
    director.sceneEnvironments[variantIndex % director.sceneEnvironments.length] ??
    director.sceneEnvironments[0];

  const headlines = [
    "Электричество всегда под рукой",
    "Надёжность в любой ситуации",
    "Сила, на которую можно положиться",
    "Всегда включён",
    "Тишина и мощность",
    "Резерв, который не подведёт",
    "Профессиональный выбор",
    "Создан для вашего комфорта",
  ];

  const isGenerator = /генератор|generator/i.test(prompt);

  const headline = isGenerator
    ? headlines[variantIndex % 3]
    : variantIndex % 2 === 0
      ? "Профессиональный выбор"
      : "Создан для вашего комфорта";

  const mainIdea = isGenerator
    ? "Генератор, который всегда выручит в загородном доме"
    : `${director.label}: ${director.visualStyle.split(",")[0]}`;

  const visualHook = isGenerator
    ? `Огромный генератор на 70% кадра, ${env}, тёплый свет — ощущение надёжности`
    : `Крупный товар 65–70% кадра, ${env}, ${director.visualStyle}`;

  return {
    creativeConcept: {
      title: headline,
      mainIdea,
      visualHook,
      emotion: director.defaultEmotion,
      marketingGoal: "остановить взгляд и продать одну ключевую мысль",
      reason: "Первая карточка продаёт внимание через эмоцию и визуальный хук, не таблицу характеристик",
      targetAudience: director.targetAudience,
      toneOfVoice: director.toneOfVoice,
      styleKeywords: director.styleKeywords,
      whatToSayInOneSecond: isGenerator
        ? "Электричество всегда под рукой"
        : `${hero.value} ${hero.label}`.trim(),
    },
    oneThought: {
      question: variantIndex % 2 === 0 ? "Почему этот товар?" : "Главное преимущество?",
      answer: hero.value,
      answerLabel: hero.label,
      headline,
      badge: `${hero.value} ${hero.label}`.trim(),
      deferredSpecs: deferred.length ? deferred : ["гарантия", "качество", "новинка"],
    },
    sceneNarrative: `${env}, товар на переднем плане, рекламная постановка`,
    compositionScenarioId: scenarioId,
  };
}

/** 6–8 детерминированных концептов по категории и сценариям */
export function buildConceptVariants(
  prompt: string,
  analysis?: ProductAnalysis,
): CreativeDirectorResult[] {
  const a = analysis ?? analyzeProductPrompt(prompt);
  const director = resolveArtDirector(a.category, prompt);
  const scenarios = director.preferredScenarios;
  const count = Math.min(8, Math.max(6, scenarios.length + 2));

  const variants: CreativeDirectorResult[] = [];
  for (let i = 0; i < count; i++) {
    const scenarioId = scenarios[i % scenarios.length] ?? "hero_product";
    variants.push(buildConceptBase(a, prompt, scenarioId, i));
  }
  return variants;
}

/** Детерминированный fallback — лучший вариант из набора */
export function buildMockCreativeDirector(
  prompt: string,
  analysis?: ProductAnalysis,
): CreativeDirectorResult {
  const a = analysis ?? analyzeProductPrompt(prompt);
  const variants = buildConceptVariants(prompt, a);
  const scored = variants
    .map((concept) => ({ concept, evaluation: evaluateConcept(concept, a, prompt) }))
    .sort((x, y) => y.evaluation.total - x.evaluation.total);

  const best = scored[0]?.concept ?? variants[0];
  return {
    ...best,
    conceptScore: scored[0]?.evaluation.total,
  };
}

export function sanitizeCreativeConcept(raw: unknown, fallback: CreativeConcept): CreativeConcept {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const cc = (o.creativeConcept ?? o) as Record<string, unknown>;
  const keywords = Array.isArray(cc.styleKeywords)
    ? cc.styleKeywords.map((s) => String(s).slice(0, 30)).slice(0, 8)
    : fallback.styleKeywords;
  return {
    title: String(cc.title ?? fallback.title).slice(0, 80),
    mainIdea: String(cc.mainIdea ?? fallback.mainIdea).slice(0, 200),
    visualHook: String(cc.visualHook ?? fallback.visualHook).slice(0, 300),
    emotion: String(cc.emotion ?? fallback.emotion).slice(0, 80),
    marketingGoal: String(cc.marketingGoal ?? fallback.marketingGoal).slice(0, 120),
    reason: String(cc.reason ?? fallback.reason).slice(0, 300),
    targetAudience: String(cc.targetAudience ?? fallback.targetAudience).slice(0, 120),
    toneOfVoice: String(cc.toneOfVoice ?? fallback.toneOfVoice).slice(0, 80),
    styleKeywords: keywords.length ? keywords : fallback.styleKeywords,
    whatToSayInOneSecond: String(cc.whatToSayInOneSecond ?? fallback.whatToSayInOneSecond).slice(0, 80),
  };
}

export function sanitizeOneThought(raw: unknown, fallback: OneThought): OneThought {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const ot = (o.oneThought ?? o) as Record<string, unknown>;
  const deferred = Array.isArray(ot.deferredSpecs)
    ? ot.deferredSpecs.map((s) => String(s).slice(0, 80)).slice(0, 6)
    : fallback.deferredSpecs;
  return {
    question: String(ot.question ?? fallback.question).slice(0, 100),
    answer: String(ot.answer ?? fallback.answer).slice(0, 20),
    answerLabel: String(ot.answerLabel ?? fallback.answerLabel).slice(0, 40),
    headline: String(ot.headline ?? fallback.headline).slice(0, 60),
    badge: ot.badge ? String(ot.badge).slice(0, 24) : fallback.badge,
    deferredSpecs: deferred,
  };
}

export function sanitizeCreativeDirectorResult(
  raw: unknown,
  fallback: CreativeDirectorResult,
): CreativeDirectorResult {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const scenarioRaw = o.compositionScenarioId ?? o.scenarioId;
  const validScenarios = [
    "hero_product", "lifestyle", "tech_showcase", "minimal_premium",
    "dynamic_diagonal", "focus_frame", "commercial_studio", "luxury_advertising",
    "editorial", "floating_product", "split_layout", "asymmetric",
  ] as const;
  const scenarioId = validScenarios.includes(scenarioRaw as (typeof validScenarios)[number])
    ? (scenarioRaw as CompositionScenarioId)
    : fallback.compositionScenarioId;

  return {
    creativeConcept: sanitizeCreativeConcept(raw, fallback.creativeConcept),
    oneThought: sanitizeOneThought(raw, fallback.oneThought),
    sceneNarrative: String(o.sceneNarrative ?? fallback.sceneNarrative).slice(0, 400),
    compositionScenarioId: scenarioId,
  };
}

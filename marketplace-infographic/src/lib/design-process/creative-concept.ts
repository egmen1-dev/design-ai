import type { CompositionScenarioId } from "@/lib/design/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import {
  buildEightMultiConcepts,
  multiConceptToCreativeDirector,
  type MultiConcept,
} from "./multi-concept";
import type { ArtDirectorModeId } from "./art-director-modes";
import { evaluateConcept } from "./concept-evaluator";
import type { ConceptEvaluation } from "./concept-evaluator";
import type { ConceptArchetypeId } from "./concept-archetypes";

/** Рекламная идея карточки — до любой вёрстки */
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
  archetypeId?: ConceptArchetypeId;
  multiConcept?: MultiConcept;
};

export type ScoredConcept = {
  concept: CreativeDirectorResult;
  evaluation: ConceptEvaluation;
};

/** 8 архетипов → CreativeDirectorResult */
export function buildConceptVariants(
  prompt: string,
  analysis?: ProductAnalysis,
  modeId: ArtDirectorModeId = "marketplace_ctr",
): CreativeDirectorResult[] {
  const a = analysis ?? analyzeProductPrompt(prompt);
  return buildEightMultiConcepts(prompt, a, modeId).map((mc) =>
    multiConceptToCreativeDirector(mc, prompt, a, modeId),
  );
}

export function buildMockCreativeDirector(
  prompt: string,
  analysis?: ProductAnalysis,
  modeId: ArtDirectorModeId = "marketplace_ctr",
): CreativeDirectorResult {
  const a = analysis ?? analyzeProductPrompt(prompt);
  const variants = buildConceptVariants(prompt, a, modeId);
  const scored = variants
    .map((concept, i) => ({
      concept,
      evaluation: evaluateConcept(concept, a, prompt, { modeId, archetypeIndex: i }),
    }))
    .sort((x, y) => y.evaluation.finalScore - x.evaluation.finalScore);

  const best = scored[0]?.concept ?? variants[0];
  return {
    ...best,
    conceptScore: scored[0]?.evaluation.finalScore,
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
    archetypeId: (o.archetypeId as ConceptArchetypeId) ?? fallback.archetypeId,
  };
}

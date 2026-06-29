import type { ProductAnalysis } from "@/lib/product-analysis";
import type { CreativeDirectorResult } from "./creative-concept";
import { resolveArtDirector } from "./category-art-directors";
import { resolveArtDirectorMode, type ArtDirectorModeId } from "./art-director-modes";

export type ConceptScoreDimension = {
  id: string;
  label: string;
  score: number;
};

export type ConceptEvaluation = {
  total: number;
  passed: boolean;
  dimensions: ConceptScoreDimension[];
  issues: string[];
  /** Взвешенный итог по формуле Multi Concept Engine */
  finalScore: number;
};

const PASS_THRESHOLD = 90;

const FINAL_WEIGHTS = {
  visualImpact: 0.3,
  commercialAppeal: 0.2,
  readability: 0.15,
  professionalLook: 0.15,
  categoryMatch: 0.1,
  realism: 0.1,
} as const;

function modeBias(modeId: ArtDirectorModeId | undefined, key: string): number {
  const bias = resolveArtDirectorMode(modeId).scoringBias as Record<string, number>;
  return bias[key] ?? 1;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreVisualImpact(c: CreativeDirectorResult): number {
  const hook = c.creativeConcept.visualHook;
  let s = 65;
  if (hook.length >= 50) s += 12;
  if (/70%|крупн|огромн|доминир|hero/i.test(hook)) s += 15;
  if (c.archetypeId === "hero_product" || c.archetypeId === "outdoor_advertising") s += 8;
  return clamp(s);
}

function scoreReadability(c: CreativeDirectorResult): number {
  const ot = c.oneThought;
  let s = 70;
  if (ot.headline.length <= 40) s += 15;
  if (ot.answer.length <= 8) s += 10;
  if (ot.badge && ot.badge.length <= 14) s += 5;
  return clamp(s);
}

function scoreCommercialAppeal(c: CreativeDirectorResult, modeId?: ArtDirectorModeId): number {
  let s = 72;
  if (c.creativeConcept.whatToSayInOneSecond.length <= 50) s += 10;
  if (/реклам|story|lifestyle|outdoor/i.test(c.creativeConcept.visualHook)) s += 8;
  s *= modeBias(modeId, "commercialAppeal");
  return clamp(s);
}

function scoreProfessionalLook(c: CreativeDirectorResult): number {
  const premium = /premium|премиум|studio|commercial|professional/i;
  let s = 78;
  if (premium.test(c.creativeConcept.visualHook + c.multiConcept?.environment)) s += 12;
  if (c.archetypeId === "premium_studio" || c.archetypeId === "commercial_photography") s += 8;
  return clamp(s);
}

function scoreCtrPrediction(c: CreativeDirectorResult): number {
  const ot = c.oneThought;
  let s = 70;
  if (ot.headline.length <= 35) s += 12;
  if (/\d/.test(ot.answer)) s += 10;
  if (c.archetypeId === "hero_product" || c.archetypeId === "outdoor_advertising") s += 8;
  return clamp(s);
}

function scoreCompositionBalance(c: CreativeDirectorResult): number {
  const mc = c.multiConcept;
  if (!mc) return 80;
  let s = 75;
  if (mc.composition.includes("70%") || mc.composition.includes("воздух")) s += 10;
  if (c.compositionScenarioId) s += 8;
  return clamp(s);
}

function scoreCategoryMatch(
  c: CreativeDirectorResult,
  analysis: ProductAnalysis,
  prompt: string,
): number {
  const director = resolveArtDirector(analysis.category, prompt);
  const text = `${c.sceneNarrative} ${c.multiConcept?.environment ?? ""}`.toLowerCase();
  let s = 80;
  for (const forbidden of director.forbiddenScenes) {
    const key = forbidden.split(" ")[0]?.toLowerCase();
    if (key && text.includes(key)) s -= 30;
  }
  const envOk = director.sceneEnvironments.some((e) =>
    text.includes((e.split(" ")[0] ?? "").toLowerCase()),
  );
  if (envOk) s += 12;
  return clamp(s);
}

function scoreOriginality(c: CreativeDirectorResult, archetypeIndex: number): number {
  return clamp(88 - archetypeIndex * 2 + (c.archetypeId === "emotional_story" ? 5 : 0));
}

function scoreRealism(c: CreativeDirectorResult): number {
  const mc = c.multiConcept;
  let s = 78;
  if (mc?.lighting.includes("натураль") || mc?.lighting.includes("студий")) s += 10;
  if (c.archetypeId === "lifestyle" || c.archetypeId === "outdoor_advertising") s += 8;
  return clamp(s);
}

function computeFinalScore(dims: Record<keyof typeof FINAL_WEIGHTS, number>): number {
  return clamp(
    dims.visualImpact * FINAL_WEIGHTS.visualImpact +
      dims.commercialAppeal * FINAL_WEIGHTS.commercialAppeal +
      dims.readability * FINAL_WEIGHTS.readability +
      dims.professionalLook * FINAL_WEIGHTS.professionalLook +
      dims.categoryMatch * FINAL_WEIGHTS.categoryMatch +
      dims.realism * FINAL_WEIGHTS.realism,
  );
}

export function evaluateConcept(
  concept: CreativeDirectorResult,
  analysis: ProductAnalysis,
  productPrompt: string,
  options?: { modeId?: ArtDirectorModeId; archetypeIndex?: number },
): ConceptEvaluation {
  const modeId = options?.modeId;
  const idx = options?.archetypeIndex ?? 0;

  const visualImpact = clamp(scoreVisualImpact(concept) * modeBias(modeId, "visualImpact"));
  const readability = scoreReadability(concept);
  const commercialAppeal = scoreCommercialAppeal(concept, modeId);
  const professionalLook = clamp(scoreProfessionalLook(concept) * modeBias(modeId, "professionalLook"));
  const marketplaceCtr = scoreCtrPrediction(concept);
  const compositionBalance = scoreCompositionBalance(concept);
  const categoryMatch = scoreCategoryMatch(concept, analysis, productPrompt);
  const originality = scoreOriginality(concept, idx);
  const realism = clamp(scoreRealism(concept) * modeBias(modeId, "realism"));

  const dims = {
    visualImpact: clamp(visualImpact),
    commercialAppeal: clamp(commercialAppeal),
    readability: clamp(readability),
    professionalLook: clamp(professionalLook),
    categoryMatch: clamp(categoryMatch),
    realism: clamp(realism),
  };

  const finalScore = computeFinalScore(dims);

  const dimensions: ConceptScoreDimension[] = [
    { id: "visual_impact", label: "Visual Impact", score: dims.visualImpact },
    { id: "readability", label: "Readability", score: dims.readability },
    { id: "commercial_appeal", label: "Commercial Appeal", score: dims.commercialAppeal },
    { id: "professional_look", label: "Professional Look", score: dims.professionalLook },
    { id: "marketplace_ctr", label: "Marketplace CTR", score: marketplaceCtr },
    { id: "composition_balance", label: "Composition Balance", score: compositionBalance },
    { id: "category_match", label: "Category Match", score: dims.categoryMatch },
    { id: "originality", label: "Originality", score: originality },
    { id: "realism", label: "Realism", score: dims.realism },
  ];

  const issues = dimensions.filter((d) => d.score < PASS_THRESHOLD).map((d) => `${d.id}:${d.score}`);

  return {
    total: finalScore,
    finalScore,
    passed: finalScore >= PASS_THRESHOLD,
    dimensions,
    issues,
  };
}

export { PASS_THRESHOLD as CONCEPT_PASS_THRESHOLD, FINAL_WEIGHTS };

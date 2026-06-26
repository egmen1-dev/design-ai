import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ai-status";
import { getOllamaStatus } from "@/lib/ai-status";
import type { InfographicStyle } from "@/lib/design-trends";
import type { DesignLibrary } from "@/lib/design-library";
import type { DesignExampleRecord } from "@/lib/select-relevant-examples";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { ResolvedReferenceContext } from "@/lib/reference-style-resolver";
import { sanitizeDesignBrief } from "@/lib/design-brief/sanitize";
import type { DesignBrief } from "@/lib/design-brief/schema";
import {
  buildQualityRetryHint,
  evaluateDesignBrief,
  evaluateDesignProcessReview,
} from "@/lib/design-brief/quality-gate";
import type { DesignProcessFoundation } from "./types";
import { buildDesignStagePrompt } from "./prompts";
import type { CreativeDirectorResult } from "./creative-concept";
import { generateAndSelectConcept } from "./concept-generator";
import { CONCEPT_PASS_THRESHOLD } from "./concept-evaluator";
import { loadRecentConceptFingerprints } from "./recent-concepts";
import type { ArtDirectorModeId } from "./art-director-modes";
import { OLLAMA_NUM_PREDICT, OLLAMA_TIMEOUT_MS, SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import { buildMockFoundation } from "./mock";
import {
  creativeConceptToCardMeaning,
  generateCardMeaning,
} from "./card-meaning";
import type { ProductCategory } from "@/lib/product-analysis";
import type { CardMeaning } from "@/lib/layout-engine/types";
import { pickAllowedEnvironment } from "@/lib/layout-engine/background-categories";

export type DesignProcessContext = {
  productPrompt: string;
  style?: InfographicStyle;
  analysis: ProductAnalysis;
  library?: DesignLibrary;
  examples?: DesignExampleRecord[];
  referenceContext?: ResolvedReferenceContext;
  retryHint?: string;
  artDirectorMode?: ArtDirectorModeId;
  userId?: string;
};

export type DesignProcessResult = {
  brief: DesignBrief;
  foundation: DesignProcessFoundation;
  creativeDirector: CreativeDirectorResult;
  cardMeaning: CardMeaning;
  conceptCandidates?: number;
  conceptRenderQueue?: CreativeDirectorResult[];
};

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ollama не вернула валидный JSON");
  }
  return text.slice(start, end + 1);
}

async function callOllamaJson<T>(prompt: string, temperature = 0.32): Promise<T> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature, num_predict: OLLAMA_NUM_PREDICT },
    }),
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Ollama недоступна: ${response.status}`);

  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Пустой ответ от Ollama");

  return JSON.parse(extractJson(data.response)) as T;
}

function foundationFromCreative(
  creative: CreativeDirectorResult,
  analysis: ProductAnalysis,
): DesignProcessFoundation {
  const fallback = buildMockFoundation("", analysis.category);
  return {
    stage1: { ...fallback.stage1, category: analysis.category },
    visualHook: {
      type: creative.archetypeId ?? "oversized_product",
      reason: creative.creativeConcept.visualHook,
      confidence: creative.conceptScore ?? 92,
    },
    stage2: {
      concept: creative.creativeConcept.title,
      creativeDirection: creative.creativeConcept.mainIdea,
      mood: creative.creativeConcept.emotion,
      references: creative.creativeConcept.styleKeywords ?? [],
      whyThisConcept: creative.creativeConcept.reason,
    },
  };
}

export function applyPosterRules(
  brief: DesignBrief,
  creative: CreativeDirectorResult,
  cardMeaning?: CardMeaning,
  category: ProductCategory = "generic",
): DesignBrief {
  const meaning = cardMeaning ?? creativeConceptToCardMeaning(creative, brief);
  const ot = creative.oneThought;
  const heroBullet = meaning.feature || `${ot.answer} ${ot.answerLabel}`.trim();
  const allowedEnv = pickAllowedEnvironment(category, creative.sceneNarrative, creative.archetypeId ?? "seed");
  const narrative = creative.sceneNarrative || allowedEnv;
  const bg =
    creative.multiConcept?.backgroundPrompt ??
    `${allowedEnv}, ${narrative}, ultra realistic, no text, no product`;

  return {
    ...brief,
    designConcept: creative.creativeConcept.title,
    headline: meaning.title,
    subHeadline: meaning.feature || meaning.badge || brief.subHeadline,
    title: meaning.title,
    subtitle: meaning.subtitle || meaning.badge,
    bullets: heroBullet ? [heroBullet] : brief.bullets,
    benefits: heroBullet ? [heroBullet] : brief.benefits,
    cardMeaning: meaning,
    sceneNarrative: narrative,
    backgroundPrompt: bg.slice(0, 480),
    decorations: [],
    glassEffects: true,
    creativeConcept: creative.creativeConcept,
    oneThought: {
      ...ot,
      headline: meaning.title,
      badge: meaning.feature || meaning.badge || ot.badge,
    },
    deferredBullets: ot.deferredSpecs,
    selectedArchetypeId: creative.archetypeId,
    designDnaOverride: creative.multiConcept?.designDNA,
  };
}

export async function runCreativeDirectorStage(
  ctx: DesignProcessContext,
): Promise<{
  creative: CreativeDirectorResult;
  evaluatedCount: number;
  renderQueue: CreativeDirectorResult[];
}> {
  const recentFingerprints = ctx.userId
    ? await loadRecentConceptFingerprints(ctx.userId)
    : [];

  const result = await generateAndSelectConcept({
    productPrompt: ctx.productPrompt,
    category: ctx.analysis.category,
    priceSegment: ctx.analysis.priceSegment,
    style: ctx.style ?? "auto",
    analysis: ctx.analysis,
    artDirectorMode: ctx.artDirectorMode,
    recentFingerprints,
  });

  if (result.selected.conceptScore && result.selected.conceptScore < CONCEPT_PASS_THRESHOLD) {
    const alt = result.candidates.find((c) => c.evaluation.finalScore >= CONCEPT_PASS_THRESHOLD);
    if (alt) {
      return {
        creative: alt.concept,
        evaluatedCount: result.evaluatedCount,
        renderQueue: result.renderQueue,
      };
    }
  }

  return {
    creative: result.selected,
    evaluatedCount: result.evaluatedCount,
    renderQueue: result.renderQueue,
  };
}

async function runDesignStage(
  ctx: DesignProcessContext,
  foundation: DesignProcessFoundation,
  creative: CreativeDirectorResult,
  cardMeaning: CardMeaning,
  retryHint?: string,
): Promise<DesignBrief> {
  const prompt = buildDesignStagePrompt({
    productPrompt: ctx.productPrompt,
    category: ctx.analysis.category,
    priceSegment: ctx.analysis.priceSegment,
    style: ctx.style ?? "auto",
    foundation,
    creativeDirector: creative,
    referenceHint: ctx.referenceContext?.compositionHint ?? undefined,
    retryHint: retryHint ?? ctx.retryHint,
  });

  const raw = await callOllamaJson<unknown>(prompt, 0.28);
  let brief = sanitizeDesignBrief(raw, ctx.analysis.category, ctx.productPrompt);
  brief = applyPosterRules(brief, creative, cardMeaning, ctx.analysis.category);
  return {
    ...brief,
    designProcess: {
      ...(brief.designProcess ?? {}),
      stage1: foundation.stage1,
      visualHook: foundation.visualHook,
      stage2: foundation.stage2,
    },
  };
}

export async function runDesignProcessPipeline(
  ctx: DesignProcessContext,
): Promise<DesignProcessResult> {
  const { creative, evaluatedCount, renderQueue } = await runCreativeDirectorStage(ctx);
  const foundation = foundationFromCreative(creative, ctx.analysis);

  const stubBrief = sanitizeDesignBrief(
    { layout: "marketplace", backgroundPrompt: creative.sceneNarrative } as DesignBrief,
    ctx.analysis.category,
    ctx.productPrompt,
  );
  let cardMeaning = creativeConceptToCardMeaning(creative, stubBrief);

  let brief: DesignBrief;
  const status = await getOllamaStatus();

  if (status.mockMode || !status.available) {
    brief = applyPosterRules(
      sanitizeDesignBrief(
        {
          layout: "marketplace",
          glassEffects: true,
          artDirectorMode: ctx.artDirectorMode,
        } as DesignBrief,
        ctx.analysis.category,
        ctx.productPrompt,
      ),
      creative,
      cardMeaning,
      ctx.analysis.category,
    );
  } else {
    try {
      cardMeaning = await generateCardMeaning(stubBrief, creative);
    } catch {
      cardMeaning = creativeConceptToCardMeaning(creative, stubBrief);
    }
    brief = await runDesignStage(ctx, foundation, creative, cardMeaning);
    brief = applyPosterRules(brief, creative, cardMeaning, ctx.analysis.category);
  }

  brief = {
    ...brief,
    cardMeaning,
    artDirectorMode: ctx.artDirectorMode,
    conceptRenderQueue: renderQueue.map((c) => c.archetypeId).filter(Boolean) as string[],
  };

  const quality = evaluateDesignBrief(brief);
  const processReview = evaluateDesignProcessReview(brief);

  if (
    !SKIP_OLLAMA_QUALITY_RETRY &&
    ((!quality.passed && quality.score < 70) || processReview.overallScore < 90)
  ) {
    const issues = [...quality.issues, ...processReview.issues];
    const retryHint = buildQualityRetryHint(issues);
    try {
      brief = await runDesignStage(ctx, foundation, creative, cardMeaning, retryHint);
    } catch {
      // keep first
    }
  }

  return {
    brief,
    foundation,
    creativeDirector: creative,
    cardMeaning,
    conceptCandidates: evaluatedCount,
    conceptRenderQueue: renderQueue,
  };
}

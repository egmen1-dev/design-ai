import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ai-status";
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
import { buildCreativeDirectorPrompt } from "./creative-director-prompt";
import {
  buildMockCreativeDirector,
  sanitizeCreativeConcept,
  sanitizeOneThought,
  type CreativeDirectorResult,
} from "./creative-concept";
import { OLLAMA_NUM_PREDICT, OLLAMA_TIMEOUT_MS, SKIP_OLLAMA_QUALITY_RETRY } from "@/lib/pipeline-config";
import { buildMockFoundation } from "./mock";

export type DesignProcessContext = {
  productPrompt: string;
  style?: InfographicStyle;
  analysis: ProductAnalysis;
  library?: DesignLibrary;
  examples?: DesignExampleRecord[];
  referenceContext?: ResolvedReferenceContext;
  retryHint?: string;
};

export type DesignProcessResult = {
  brief: DesignBrief;
  foundation: DesignProcessFoundation;
  creativeDirector: CreativeDirectorResult;
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

  if (!response.ok) {
    throw new Error(`Ollama недоступна: ${response.status}`);
  }

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
      type: "oversized_product",
      reason: creative.creativeConcept.visualHook,
      confidence: 92,
    },
    stage2: {
      concept: creative.creativeConcept.title,
      creativeDirection: creative.creativeConcept.mainIdea,
      mood: creative.creativeConcept.emotion,
      references: [],
      whyThisConcept: creative.creativeConcept.reason,
    },
  };
}

/** Применяет правила постера: одна мысль, минимум элементов */
export function applyPosterRules(
  brief: DesignBrief,
  creative: CreativeDirectorResult,
): DesignBrief {
  const ot = creative.oneThought;
  const heroBullet = `${ot.answer} ${ot.answerLabel}`.trim();

  return {
    ...brief,
    designConcept: creative.creativeConcept.title,
    headline: ot.headline,
    subHeadline: ot.badge ?? brief.subHeadline,
    title: ot.headline,
    subtitle: ot.badge,
    bullets: [heroBullet, ...ot.deferredSpecs],
    benefits: [heroBullet, ...ot.deferredSpecs],
    objectScale: Math.max(0.68, brief.objectScale ?? 0.72),
    backgroundPrompt: `${creative.sceneNarrative}, ${brief.backgroundPrompt ?? ""}`.slice(0, 480),
    decorations: [],
    glassEffects: true,
    creativeConcept: creative.creativeConcept,
    oneThought: ot,
    deferredBullets: ot.deferredSpecs,
  };
}

export async function runCreativeDirectorStage(
  ctx: DesignProcessContext,
): Promise<CreativeDirectorResult> {
  const fallback = buildMockCreativeDirector(ctx.productPrompt, ctx.analysis);
  const prompt = buildCreativeDirectorPrompt({
    productPrompt: ctx.productPrompt,
    category: ctx.analysis.category,
    priceSegment: ctx.analysis.priceSegment,
    style: ctx.style ?? "auto",
  });

  try {
    const raw = await callOllamaJson<Record<string, unknown>>(prompt, 0.42);
    return {
      creativeConcept: sanitizeCreativeConcept(raw, fallback.creativeConcept),
      oneThought: sanitizeOneThought(raw, fallback.oneThought),
      sceneNarrative: String(raw.sceneNarrative ?? fallback.sceneNarrative).slice(0, 400),
    };
  } catch {
    return fallback;
  }
}

async function runDesignStage(
  ctx: DesignProcessContext,
  foundation: DesignProcessFoundation,
  creative: CreativeDirectorResult,
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
  brief = applyPosterRules(brief, creative);

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
  const creative = await runCreativeDirectorStage(ctx);
  const foundation = foundationFromCreative(creative, ctx.analysis);
  let brief = await runDesignStage(ctx, foundation, creative);

  const quality = evaluateDesignBrief(brief);
  const processReview = evaluateDesignProcessReview(brief);

  if (
    !SKIP_OLLAMA_QUALITY_RETRY &&
    ((!quality.passed && quality.score < 70) || processReview.overallScore < 90)
  ) {
    const issues = [...quality.issues, ...processReview.issues];
    const retryHint = buildQualityRetryHint(issues);
    try {
      brief = await runDesignStage(ctx, foundation, creative, retryHint);
    } catch {
      // keep first result
    }
  }

  return { brief, foundation, creativeDirector: creative };
}

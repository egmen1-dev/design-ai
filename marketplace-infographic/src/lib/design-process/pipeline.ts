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
import { buildFoundationStagePrompt, buildDesignStagePrompt } from "./prompts";
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

function sanitizeFoundation(raw: unknown, fallback: DesignProcessFoundation): DesignProcessFoundation {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const stage1 = (obj.stage1 ?? fallback.stage1) as DesignProcessFoundation["stage1"];
  const stage2 = (obj.stage2 ?? fallback.stage2) as DesignProcessFoundation["stage2"];
  const hookRaw = (obj.visualHook ?? fallback.visualHook) as Record<string, unknown>;

  return {
    stage1: {
      ...fallback.stage1,
      ...stage1,
      category: String(stage1?.category ?? fallback.stage1.category),
    },
    visualHook: {
      type: String(hookRaw?.type ?? fallback.visualHook.type),
      reason: String(hookRaw?.reason ?? fallback.visualHook.reason).slice(0, 300),
      confidence: Math.min(100, Math.max(0, Number(hookRaw?.confidence ?? 85))),
    },
    stage2: {
      ...fallback.stage2,
      ...stage2,
      concept: String(stage2?.concept ?? fallback.stage2.concept).slice(0, 200),
      creativeDirection: String(stage2?.creativeDirection ?? fallback.stage2.creativeDirection).slice(0, 400),
    },
  };
}

export async function runFoundationStage(
  ctx: DesignProcessContext,
): Promise<DesignProcessFoundation> {
  const fallback = buildMockFoundation(ctx.productPrompt, ctx.analysis.category);
  const prompt = buildFoundationStagePrompt({
    productPrompt: ctx.productPrompt,
    category: ctx.analysis.category,
    priceSegment: ctx.analysis.priceSegment,
    style: ctx.style ?? "auto",
  });

  const raw = await callOllamaJson<unknown>(prompt, 0.38);
  return sanitizeFoundation(raw, fallback);
}

async function runDesignStage(
  ctx: DesignProcessContext,
  foundation: DesignProcessFoundation,
  retryHint?: string,
): Promise<DesignBrief> {
  const prompt = buildDesignStagePrompt({
    productPrompt: ctx.productPrompt,
    category: ctx.analysis.category,
    priceSegment: ctx.analysis.priceSegment,
    style: ctx.style ?? "auto",
    foundation,
    referenceHint: ctx.referenceContext?.compositionHint ?? undefined,
    retryHint: retryHint ?? ctx.retryHint,
  });

  const raw = await callOllamaJson<unknown>(prompt, 0.3);
  const brief = sanitizeDesignBrief(raw, ctx.analysis.category, ctx.productPrompt);

  return {
    ...brief,
    designConcept: brief.designConcept ?? foundation.stage2.concept,
    designProcess: brief.designProcess ?? {
      stage1: foundation.stage1,
      visualHook: foundation.visualHook,
      stage2: foundation.stage2,
    },
  };
}

export async function runDesignProcessPipeline(
  ctx: DesignProcessContext,
): Promise<{ brief: DesignBrief; foundation: DesignProcessFoundation }> {
  const foundation = await runFoundationStage(ctx);
  let brief = await runDesignStage(ctx, foundation);

  let quality = evaluateDesignBrief(brief);
  let processReview = evaluateDesignProcessReview(brief);

  if (
    !SKIP_OLLAMA_QUALITY_RETRY &&
    ((!quality.passed && quality.score < 70) || processReview.overallScore < 90)
  ) {
    const issues = [...quality.issues, ...processReview.issues];
    const retryHint = buildQualityRetryHint(issues);
    try {
      brief = await runDesignStage(ctx, foundation, retryHint);
    } catch {
      // keep first design stage result
    }
  }

  return { brief, foundation };
}

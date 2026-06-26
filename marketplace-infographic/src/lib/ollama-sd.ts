import { createHash } from "crypto";
import {
  DEFAULT_STYLE,
  type InfographicStyle,
} from "@/lib/design-trends";
import type { DesignLibrary } from "@/lib/design-library";
import { pickBestBadgeId, pickBestFontId } from "@/lib/asset-selection";
import {
  briefToCompositingHints,
  briefToSdInput,
  type CompositingHints,
  type DesignBrief,
} from "@/lib/design-brief/schema";
import {
  buildQualityRetryHint,
  evaluateDesignBrief,
} from "@/lib/design-brief/quality-gate";
import { sanitizeDesignBrief } from "@/lib/design-brief/sanitize";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache/generation-cache";
import { assembleDesignBriefPrompt } from "@/lib/prompt/assemble";
import {
  filterConsistentBullets,
  gardenTrimmerBatteryBullets,
} from "@/lib/bullet-consistency";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import {
  applyReferenceToSdData,
  defaultMarketplaceColors,
  resolveReferenceContext,
  type ResolvedReferenceContext,
} from "@/lib/reference-style-resolver";
import { selectRelevantExamples } from "@/lib/select-relevant-examples";
import type { InfographicSdInput } from "@/lib/validations";
import { applyStyleToSdColors } from "@/lib/sd-style-theme";
import { getOllamaStatus, OLLAMA_BASE_URL, OLLAMA_MODEL } from "./ai-status";

export type InfographicSdData = InfographicSdInput;

export type OllamaSdContext = {
  library?: DesignLibrary;
  examples?: Awaited<ReturnType<typeof selectRelevantExamples>>;
  referenceContext?: ResolvedReferenceContext;
};

export type GenerationResult = {
  data: InfographicSdData;
  brief: DesignBrief;
  compositingHints: CompositingHints;
  source: "ollama" | "mock";
  qualityScore: number;
};

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ollama не вернула валидный JSON");
  }
  return text.slice(start, end + 1);
}

function applyAssetSelection(
  brief: DesignBrief,
  library: DesignLibrary | undefined,
  analysis: ReturnType<typeof analyzeProductPrompt>,
  style: InfographicStyle,
): DesignBrief {
  if (!library) return brief;
  const accent = brief.colorPalette?.[0] ?? defaultMarketplaceColors()[0];

  const fontId = pickBestFontId(library.fonts, analysis, style, brief.fontId);
  const badgeId = pickBestBadgeId(library.badges, analysis, style, accent, brief.badgeId);

  return { ...brief, fontId, badgeId };
}

function buildMockBrief(
  prompt: string,
  style: InfographicStyle,
  library?: DesignLibrary,
  referenceContext?: ResolvedReferenceContext,
): DesignBrief {
  const analysis = analyzeProductPrompt(prompt);
  const isTrimmer = analysis.category === "garden_tools";
  const isBattery = /аккумулятор|акб|battery/i.test(prompt);
  const colors = referenceContext?.colors?.length
    ? referenceContext.colors
    : defaultMarketplaceColors();

  const trimmerBullets = isBattery
    ? gardenTrimmerBatteryBullets()
    : ["1300 Вт мощность", "65 дБ тихая работа", "3 мощных АКБ", "8 насадок", "лёгкий и компактный"];

  const raw = sanitizeDesignBrief(
    {
      designConcept: isTrimmer
        ? "Премиальная садовая карточка с акцентом на мощность"
        : "Коммерческая карточка WB/Ozon",
      layout: "marketplace",
      headline: isTrimmer ? "Садовый триммер" : "Товар",
      subHeadline: isTrimmer ? (isBattery ? "аккумуляторный" : "мощный") : "новинка",
      bullets: isTrimmer
        ? trimmerBullets
        : ["Премиум качество", "Быстрая доставка", "Гарантия 12 месяцев"],
      colorPalette: colors,
      badge: "Brand",
      backgroundPrompt:
        "sunny suburban lawn garden path, wooden fence blurred, golden hour daylight, clear empty grass foreground, ultra realistic, no objects, no text",
      fontId: null,
      badgeId: null,
      objectScale: 0.72,
      lightDirection: "top-left",
      lightTemperature: "5500K",
      shadowType: "contact-soft",
    },
    analysis.category,
  );

  return applyAssetSelection(raw, library, analysis, style);
}

async function callOllamaDesignBrief(
  prompt: string,
  style: InfographicStyle,
  context: OllamaSdContext,
  retryHint?: string,
): Promise<DesignBrief> {
  const analysis = analyzeProductPrompt(prompt);
  const ref =
    context.referenceContext ??
    resolveReferenceContext(prompt, style, context.examples ?? []);

  const systemPrompt = assembleDesignBriefPrompt({
    productPrompt: prompt,
    style,
    analysis,
    library: context.library ?? { fonts: [], badges: [] },
    examples: context.examples ?? [],
    referenceContext: ref,
    retryHint,
  });

  const ollamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 120_000);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: { temperature: 0.32, num_predict: 2048 },
    }),
    signal: AbortSignal.timeout(ollamaTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Ollama недоступна: ${response.status}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Пустой ответ от Ollama");

  const parsed = JSON.parse(extractJson(data.response)) as unknown;
  const brief = sanitizeDesignBrief(parsed, analysis.category);
  return applyAssetSelection(brief, context.library, analysis, style);
}

function clampLibraryIds(
  data: InfographicSdData,
  library?: DesignLibrary,
): InfographicSdData {
  if (!library) return data;
  const fontIds = new Set(library.fonts.map((f) => f.id));
  const badgeIds = new Set(library.badges.map((b) => b.id));
  return {
    ...data,
    fontId: data.fontId && fontIds.has(data.fontId) ? data.fontId : null,
    badgeId: data.badgeId && badgeIds.has(data.badgeId) ? data.badgeId : null,
  };
}

export async function generateSdInfographicData(
  prompt: string,
  style: InfographicStyle = DEFAULT_STYLE,
  context: OllamaSdContext = {},
): Promise<GenerationResult> {
  const referenceContext =
    context.referenceContext ??
    resolveReferenceContext(prompt, style, context.examples ?? []);

  const enrichedContext: OllamaSdContext = { ...context, referenceContext };
  const cacheId = cacheKey([
    "brief",
    createHash("sha256").update(prompt).digest("hex").slice(0, 16),
    style,
    referenceContext.topExample?.id ?? "none",
  ]);

  const cached = cacheGet<GenerationResult>(cacheId);
  if (cached) return cached;

  const status = await getOllamaStatus();

  const finalize = (brief: DesignBrief, source: "ollama" | "mock"): GenerationResult => {
    let sd = briefToSdInput(brief, prompt);
    sd = applyReferenceToSdData(sd, referenceContext);
    if (!referenceContext.hasStrongReference) {
      sd = applyStyleToSdColors(sd, style);
    }
    sd = clampLibraryIds(sd, context.library);

    const result: GenerationResult = {
      data: sd,
      brief,
      compositingHints: briefToCompositingHints(brief),
      source,
      qualityScore: evaluateDesignBrief(brief).score,
    };
    cacheSet(cacheId, result);
    return result;
  };

  if (status.mockMode || !status.available) {
    const brief = buildMockBrief(prompt, style, context.library, referenceContext);
    return finalize(brief, "mock");
  }

  try {
    let brief = await callOllamaDesignBrief(prompt, style, enrichedContext);
    let quality = evaluateDesignBrief(brief);

    if (!quality.passed && quality.score < 70) {
      const retryHint = buildQualityRetryHint(quality.issues);
      try {
        brief = await callOllamaDesignBrief(prompt, style, enrichedContext, retryHint);
        quality = evaluateDesignBrief(brief);
      } catch {
        // keep first attempt
      }
    }

    const result = finalize(brief, "ollama");
    result.qualityScore = quality.score;
    cacheSet(cacheId, result);
    return result;
  } catch (error) {
    console.warn("Ollama design brief failed, mock fallback:", error);
    const brief = buildMockBrief(prompt, style, context.library, referenceContext);
    return finalize(brief, "mock");
  }
}

export async function buildOllamaSdContext(
  prompt: string,
  library?: DesignLibrary,
): Promise<OllamaSdContext> {
  const [loadedLibrary, examples] = await Promise.all([
    library ? Promise.resolve(library) : import("@/lib/design-library").then((m) => m.loadDesignLibrary()),
    selectRelevantExamples(prompt, 5),
  ]);

  return {
    library: loadedLibrary,
    examples,
    referenceContext: resolveReferenceContext(prompt, DEFAULT_STYLE, examples),
  };
}

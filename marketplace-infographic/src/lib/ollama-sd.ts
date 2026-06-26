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
import { buildMockFoundation } from "@/lib/design-process/mock";
import { runDesignProcessPipeline } from "@/lib/design-process/pipeline";
import { objectScaleFromHook } from "@/lib/design-process/visual-hook";
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
import { getOllamaStatus } from "./ai-status";

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
  const foundation = buildMockFoundation(prompt, analysis.category);
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
      designConcept: foundation.stage2.concept,
      designProcess: {
        stage1: foundation.stage1,
        visualHook: foundation.visualHook,
        stage2: foundation.stage2,
        stage3: {
          mainSubject: "товар",
          eyeFlow: "заголовок → товар → УТП",
          textPlacement: "слева",
          plaquePlacement: "компактные плашки слева и справа",
          negativeSpace: "20–30%",
          balance: "правило третей",
          depth: "передний план — товар",
          perspective: "three-quarter",
        },
        stage7: {
          visualBalance: 94,
          readability: 95,
          professionalism: 93,
          categoryFit: 92,
          premiumFeel: 91,
          conversionPotential: 94,
          overallScore: 93,
        },
      },
      visualHook: foundation.visualHook,
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
      objectScale: objectScaleFromHook(foundation.visualHook, 0.78),
      lightDirection: "top-left",
      lightTemperature: "5500K",
      shadowType: "contact-soft",
    },
    analysis.category,
  );

  return applyAssetSelection(raw, library, analysis, style);
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
  style?: InfographicStyle,
  context: OllamaSdContext = {},
): Promise<GenerationResult> {
  const referenceContext =
    context.referenceContext ??
    resolveReferenceContext(prompt, style ?? DEFAULT_STYLE, context.examples ?? []);

  const enrichedContext: OllamaSdContext = { ...context, referenceContext };
  const analysis = analyzeProductPrompt(prompt);
  const cacheId = cacheKey([
    "brief-v9",
    prompt.slice(0, 80),
    style ?? "auto",
    referenceContext.topExample?.id ?? "none",
  ]);

  const cached = cacheGet<GenerationResult>(cacheId);
  if (cached) return cached;

  const status = await getOllamaStatus();

  const finalize = (brief: DesignBrief, source: "ollama" | "mock"): GenerationResult => {
    let sd = briefToSdInput(brief, prompt);
    sd = applyReferenceToSdData(sd, referenceContext);
    if (!referenceContext.hasStrongReference && style) {
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
    const brief = buildMockBrief(prompt, style ?? DEFAULT_STYLE, context.library, referenceContext);
    return finalize(brief, "mock");
  }

  try {
    const { brief } = await runDesignProcessPipeline({
      productPrompt: prompt,
      style,
      analysis,
      library: context.library,
      examples: context.examples,
      referenceContext,
    });

    const withAssets = applyAssetSelection(
      brief,
      context.library,
      analysis,
      style ?? DEFAULT_STYLE,
    );
    const result = finalize(withAssets, "ollama");
    cacheSet(cacheId, result);
    return result;
  } catch (error) {
    console.warn("Ollama design process failed, mock fallback:", error);
    const brief = buildMockBrief(prompt, style ?? DEFAULT_STYLE, context.library, referenceContext);
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

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
import {
  applyPosterRules,
  runDesignProcessPipeline,
} from "@/lib/design-process/pipeline";
import { buildMockCreativeDirector } from "@/lib/design-process/creative-concept";
import { buildConceptVariants } from "@/lib/design-process/creative-concept";
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

import type { ArtDirectorModeId } from "@/lib/design-process/art-director-modes";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";

export type InfographicSdData = InfographicSdInput;

export type OllamaSdContext = {
  library?: DesignLibrary;
  examples?: Awaited<ReturnType<typeof selectRelevantExamples>>;
  referenceContext?: ResolvedReferenceContext;
  userId?: string;
  artDirectorMode?: ArtDirectorModeId;
};

export type GenerationResult = {
  data: InfographicSdData;
  brief: DesignBrief;
  compositingHints: CompositingHints;
  source: "ollama" | "mock";
  qualityScore: number;
  conceptRenderQueue?: CreativeDirectorResult[];
  conceptCandidates?: number;
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
  artDirectorMode?: ArtDirectorModeId,
): DesignBrief {
  const analysis = analyzeProductPrompt(prompt);
  const creative = buildMockCreativeDirector(prompt, analysis, artDirectorMode ?? "marketplace_ctr");
  const foundation = buildMockFoundation(prompt, analysis.category);
  const isTrimmer = analysis.category === "garden_tools";
  const isGenerator = /генератор|generator/i.test(prompt);
  const isBattery = /аккумулятор|акб|battery/i.test(prompt);
  const colors = referenceContext?.colors?.length
    ? referenceContext.colors
    : defaultMarketplaceColors();

  const trimmerBullets = isBattery
    ? gardenTrimmerBatteryBullets()
    : ["1300 Вт мощность", "65 дБ тихая работа", "3 мощных АКБ", "8 насадок", "лёгкий и компактный"];

  const raw = sanitizeDesignBrief(
    applyPosterRules(
      {
        designConcept: creative.creativeConcept.title,
        creativeConcept: creative.creativeConcept,
        oneThought: creative.oneThought,
        designProcess: {
          stage1: foundation.stage1,
          visualHook: foundation.visualHook,
          stage2: foundation.stage2,
        },
        visualHook: foundation.visualHook,
        layout: "marketplace",
        headline: creative.oneThought.headline,
        subHeadline: creative.oneThought.badge ?? "новинка",
        bullets: [`${creative.oneThought.answer} ${creative.oneThought.answerLabel}`.trim()],
        deferredBullets: creative.oneThought.deferredSpecs,
        colorPalette: colors,
        badge: "Brand",
        backgroundPrompt: `${creative.sceneNarrative}, ultra realistic, no text, no product`,
        fontId: null,
        badgeId: null,
        objectScale: 0.72,
        lightDirection: "top-left",
        lightTemperature: "5500K",
        shadowType: "contact-soft",
        glassEffects: true,
      } as DesignBrief,
      creative,
    ),
    analysis.category,
    prompt,
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
    "brief-v15-layout",
    prompt.slice(0, 80),
    style ?? "auto",
    context.artDirectorMode ?? "marketplace_ctr",
    context.userId?.slice(0, 8) ?? "anon",
    referenceContext.topExample?.id ?? "none",
  ]);

  const cached = cacheGet<GenerationResult>(cacheId);
  if (cached) return cached;

  const status = await getOllamaStatus();

  const finalize = (
    brief: DesignBrief,
    source: "ollama" | "mock",
    extras?: Pick<GenerationResult, "conceptRenderQueue" | "conceptCandidates">,
  ): GenerationResult => {
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
      conceptRenderQueue: extras?.conceptRenderQueue,
      conceptCandidates: extras?.conceptCandidates,
    };
    cacheSet(cacheId, result);
    return result;
  };

  if (status.mockMode || !status.available) {
    const brief = buildMockBrief(
      prompt,
      style ?? DEFAULT_STYLE,
      context.library,
      referenceContext,
      context.artDirectorMode,
    );
    const variants = buildConceptVariants(prompt, analysis, context.artDirectorMode ?? "marketplace_ctr");
    return finalize(brief, "mock", {
      conceptRenderQueue: variants,
      conceptCandidates: variants.length,
    });
  }

  try {
    const pipelineResult = await runDesignProcessPipeline({
      productPrompt: prompt,
      style,
      analysis,
      library: context.library,
      examples: context.examples,
      referenceContext,
      artDirectorMode: context.artDirectorMode,
      userId: context.userId,
    });
    const { brief } = pipelineResult;

    const withAssets = applyAssetSelection(
      brief,
      context.library,
      analysis,
      style ?? DEFAULT_STYLE,
    );
    const result = finalize(withAssets, "ollama", {
      conceptRenderQueue: pipelineResult.conceptRenderQueue,
      conceptCandidates: pipelineResult.conceptCandidates,
    });
    cacheSet(cacheId, result);
    return result;
  } catch (error) {
    console.warn("Ollama design process failed, mock fallback:", error);
    const brief = buildMockBrief(
      prompt,
      style ?? DEFAULT_STYLE,
      context.library,
      referenceContext,
      context.artDirectorMode,
    );
    const variants = buildConceptVariants(prompt, analysis, context.artDirectorMode ?? "marketplace_ctr");
    return finalize(brief, "mock", {
      conceptRenderQueue: variants,
      conceptCandidates: variants.length,
    });
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

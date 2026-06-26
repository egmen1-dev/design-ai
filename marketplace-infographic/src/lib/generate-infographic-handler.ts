import { readFile } from "fs/promises";
import path from "path";
import { consumeGenerationSlot } from "@/lib/credits";
import { resolveLibraryAssets } from "@/lib/design-library";
import { generateSdInfographicData, type OllamaSdContext } from "@/lib/ollama-sd";
import {
  backgroundToDataUrl,
  buildFallbackGradient,
  generateBackground,
} from "@/lib/stable-diffusion";
import { renderInfographicHtml } from "@/lib/infographic-template";
import { sdDataToInfographic } from "@/lib/sd-to-infographic";
import { packSdPayload, unpackSdPayload } from "@/lib/sd-stored-payload";
import { DEFAULT_STYLE, TRENDS, type InfographicStyle } from "@/lib/design-trends";
import { renderHtmlToImage } from "@/lib/puppeteer";
import { bufferToDataUrl } from "@/lib/background-removal";
import {
  parseProductImageDataUrl,
  processProductImageForCover,
  processProductImageForGeneration,
} from "@/lib/product-image-sd";
import type { CompositingHints, DesignBrief } from "@/lib/design-brief/schema";
import { briefToSdInput } from "@/lib/design-brief/schema";
import type { InfographicSdInput } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  resolveReferenceContext,
  type ResolvedReferenceContext,
} from "@/lib/reference-style-resolver";
import { mergedToDataUrl } from "@/lib/image-compositor";
import { compositeProductIntoScene } from "@/lib/compositing/scene-compositor";
import { analyzeProductVisual } from "@/lib/compositing/product-visual-analysis";
import { resolveMarketplaceAccent } from "@/lib/accent-color";
import {
  planScene,
  buildSceneBackgroundPrompt,
  validateQuality,
  QUALITY_PASS_THRESHOLD,
  retrieveKnowledgeContext,
  collectGenerationPattern,
  preloadKnowledgeAnalysis,
} from "@/lib/design";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import type { CompositionResult } from "@/lib/design/types";
import {
  computeProfessionalLayout,
  toCompositionResult,
} from "@/lib/layout-engine";
import type { CardMeaning, LayoutTemplateId, ProductShapeHint } from "@/lib/layout-engine/types";
import { runSeniorArtDirector, runMarketplaceCtrExpert, runCommercialPhotographer, runChiefDesignDirector, runDesignMemory, loadDesignMemoryStore, deriveFixApplicationHints, type SeniorArtDirectorReview, type MarketplaceCtrReview, type CommercialPhotographerReview, type ChiefDesignDirectorPlan, type DesignMemoryUpdateResult } from "@/lib/agents";
import { creativeConceptToCardMeaning } from "@/lib/design-process/card-meaning";
import type { ProductVisualProfile } from "@/lib/design/scene-planner";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { QualityValidationResult } from "@/lib/design/quality-validator";
import type { ArtDirectorModeId } from "@/lib/design-process/art-director-modes";
import { PIPELINE_VERSION } from "@/lib/pipeline-version";
import { USE_FAST_CUTOUT, MAX_CONCEPT_RENDER_RETRIES, MAX_SENIOR_AD_LAYOUT_RETRIES, MAX_PHOTO_BG_RETRIES, MAX_CHIEF_FIX_RETRIES } from "@/lib/pipeline-config";
import type { CoverConceptId } from "@/lib/cover-concepts";
import { evaluateFinalQuality } from "@/lib/design/final-quality-validator";
import { applyPosterRules } from "@/lib/design-process/pipeline";

export type GenerateInfographicInput = {
  userId: string;
  prompt: string;
  productImage?: string;
  style?: InfographicStyle;
  regenerateBackgroundOnly?: boolean;
  existingImageId?: string;
  backgroundSeed?: string;
  ollamaContext?: OllamaSdContext;
  coverConcept?: CoverConceptId;
  artDirectorMode?: ArtDirectorModeId;
};

export type GenerateInfographicResult = {
  id: string;
  imagePath: string;
  backgroundUrl: string | null;
  freeRemaining: number;
  credits: number;
  unlimited: boolean;
  aiSource: string;
  backgroundSource: "sd" | "fallback";
  appliedStyle?: InfographicStyle;
  designConcept?: string;
  creativeMainIdea?: string;
  oneThoughtHeadline?: string;
  visualHook?: { type: string; reason: string; confidence?: number };
  pipelineVersion: string;
  qualityScore?: number;
  selectedArchetypeId?: string;
  conceptCandidates?: number;
  layoutTemplateId?: string;
  designScore?: number;
  seniorAdScore?: number;
  seniorAdApproved?: boolean;
  ctrScore?: number;
  ctrPrediction?: number;
  wouldClick?: boolean;
  photoScore?: number;
  photoRealism?: number;
  looksLikePhoto?: boolean;
  chiefApproved?: boolean;
  estimatedScoreAfterFix?: number;
  designMemoryUpdate?: boolean;
  designMemoryAdvice?: string[];
  knowledgeCategory?: string;
  knowledgePatternsUsed?: number;
  knowledgeAnalysisTriggered?: boolean;
};

function briefMeta(brief?: DesignBrief) {
  const hook = brief?.designProcess?.visualHook ?? brief?.visualHook;
  return {
    designConcept: brief?.creativeConcept?.title ?? brief?.designConcept ?? brief?.designProcess?.stage2?.concept,
    creativeMainIdea: brief?.creativeConcept?.mainIdea,
    oneThoughtHeadline: brief?.oneThought?.headline,
    selectedArchetypeId: brief?.selectedArchetypeId,
    conceptCandidates: brief?.conceptRenderQueue?.length,
    visualHook: hook
      ? { type: hook.type, reason: brief?.creativeConcept?.visualHook ?? hook.reason, confidence: hook.confidence }
      : brief?.creativeConcept
        ? { type: "creative_story", reason: brief.creativeConcept.visualHook, confidence: 92 }
        : undefined,
  };
}

function creativeFromBrief(brief?: DesignBrief): CreativeDirectorResult | undefined {
  if (!brief?.creativeConcept || !brief.oneThought) return undefined;
  const cc = brief.creativeConcept;
  return {
    creativeConcept: {
      title: cc.title,
      mainIdea: cc.mainIdea,
      visualHook: cc.visualHook,
      emotion: cc.emotion,
      marketingGoal: cc.marketingGoal,
      reason: cc.reason,
      targetAudience: cc.targetAudience ?? "покупатели маркетплейса",
      toneOfVoice: cc.toneOfVoice ?? "уверенный",
      styleKeywords: cc.styleKeywords ?? [],
      whatToSayInOneSecond: cc.whatToSayInOneSecond ?? cc.title,
    },
    oneThought: brief.oneThought,
    sceneNarrative: brief.sceneNarrative ?? brief.backgroundPrompt?.slice(0, 400) ?? "",
    compositionScenarioId: brief.compositionScenarioId as CreativeDirectorResult["compositionScenarioId"],
    archetypeId: brief.selectedArchetypeId as CreativeDirectorResult["archetypeId"],
  };
}

function sceneToCompositingHints(scene: ScenePlan, objectScale: number): CompositingHints {
  return {
    lightDirection: scene.lightingDirection,
    lightTemperature: Number(scene.lightingTemperature.replace(/\D/g, "")) || 5500,
    shadowType:
      scene.shadowProfile === "ambient"
        ? "ambient-soft"
        : scene.shadowProfile === "contact"
          ? "contact-hard"
          : "contact-soft",
    reflection: scene.reflectionEnabled,
    objectScale,
  };
}

function toProductShapeHint(visual?: ProductVisualProfile): ProductShapeHint {
  if (!visual) return "standard";
  if (visual.shape === "wide") return "wide";
  if (visual.shape === "tall") return "tall";
  return "standard";
}

function layoutObjectScale(areaPct?: number): number {
  const pct = areaPct ?? 65;
  return Math.min(0.75, Math.max(0.55, pct / 100));
}

function normalizeCardMeaning(
  partial: DesignBrief["cardMeaning"] | CardMeaning,
): CardMeaning {
  return {
    title: partial?.title ?? "Товар",
    subtitle: partial?.subtitle ?? "",
    feature: partial?.feature ?? "",
    badge: partial?.badge ?? "",
    emotion: partial?.emotion ?? "Надёжность",
    style: partial?.style ?? "Premium Lifestyle",
    priority: partial?.priority ?? "product",
  };
}

function buildProfessionalComposition(input: {
  designBrief?: DesignBrief;
  activeCreative?: CreativeDirectorResult;
  category: import("@/lib/product-analysis").ProductCategory;
  productVisual?: ProductVisualProfile;
  seed: string;
  excludeTemplateIds?: LayoutTemplateId[];
  templateId?: LayoutTemplateId;
  knowledgeCategory?: KnowledgeCategory;
}): {
  compositionResult: CompositionResult;
  cardMeaning: CardMeaning;
  headlineFontPx: number;
  templateId: LayoutTemplateId;
} {
  const cardMeaning = normalizeCardMeaning(
    input.designBrief?.cardMeaning ??
      (input.activeCreative && input.designBrief
        ? creativeConceptToCardMeaning(input.activeCreative, input.designBrief)
        : {
            title: input.designBrief?.headline ?? "Товар",
            subtitle: input.designBrief?.subtitle ?? "",
            feature: input.designBrief?.subHeadline ?? "",
            badge: input.designBrief?.badge ?? "",
            emotion: "Надёжность",
            style: "Premium Lifestyle",
            priority: "product" as const,
          }),
  );

  const pro = computeProfessionalLayout({
    meaning: cardMeaning,
    category: input.category,
    productShape: toProductShapeHint(input.productVisual),
    seed: input.seed,
    backgroundHint: input.designBrief?.backgroundPrompt,
    excludeTemplateIds: input.excludeTemplateIds,
    templateId: input.templateId,
    knowledgeCategory: input.knowledgeCategory,
  });

  return {
    compositionResult: toCompositionResult(pro, input.category),
    cardMeaning,
    headlineFontPx: pro.headlineFontPx,
    templateId: pro.templateId,
  };
}

async function buildLayoutWithAgentReview(input: {
  designBrief?: DesignBrief;
  activeCreative?: CreativeDirectorResult;
  analysis: import("@/lib/product-analysis").ProductAnalysis;
  productVisual?: ProductVisualProfile;
  productPrompt: string;
  seed: string;
  knowledgeCategory?: KnowledgeCategory;
}): Promise<{
  compositionResult: CompositionResult;
  cardMeaning: CardMeaning;
  seniorAdReview: SeniorArtDirectorReview;
  ctrReview: MarketplaceCtrReview;
  headlineFontPx: number;
  templateId: LayoutTemplateId;
}> {
  const excluded: LayoutTemplateId[] = [];
  let last:
    | {
        compositionResult: CompositionResult;
        cardMeaning: CardMeaning;
        seniorAdReview: SeniorArtDirectorReview;
        ctrReview: MarketplaceCtrReview;
        headlineFontPx: number;
        templateId: LayoutTemplateId;
      }
    | undefined;

  for (let attempt = 0; attempt <= MAX_SENIOR_AD_LAYOUT_RETRIES; attempt++) {
    const built = buildProfessionalComposition({
      designBrief: input.designBrief,
      activeCreative: input.activeCreative,
      category: input.analysis.category,
      productVisual: input.productVisual,
      seed: attempt === 0 ? input.seed : `${input.seed}:agent-${attempt}`,
      excludeTemplateIds: excluded,
      knowledgeCategory: input.knowledgeCategory,
    });

    const elementCount =
      (built.cardMeaning.feature ? 1 : 0) +
      (built.cardMeaning.badge ? 1 : 0) +
      (built.cardMeaning.subtitle ? 1 : 0) +
      1;

    const agentBase = {
      meaning: built.cardMeaning,
      layout: built.compositionResult.layout,
      templateId: built.templateId,
      creative: input.activeCreative,
      analysis: input.analysis,
      productPrompt: input.productPrompt,
      elementCount,
    };

    const [seniorAdReview, ctrReview] = await Promise.all([
      runSeniorArtDirector({ ...agentBase, headlineFontPx: built.headlineFontPx }),
      runMarketplaceCtrExpert(agentBase),
    ]);

    last = { ...built, seniorAdReview, ctrReview };

    const layoutApproved = seniorAdReview.approved && ctrReview.wouldClick;
    if (layoutApproved) {
      if (attempt > 0) {
        console.info(
          `[agents] approved on retry ${attempt}: ${built.templateId} (ad=${seniorAdReview.score}, ctr=${ctrReview.score})`,
        );
      }
      return last;
    }

    console.warn(
      `[agents] rejected template ${built.templateId} ad=${seniorAdReview.score} ctr=${ctrReview.score} wouldClick=${ctrReview.wouldClick}`,
      [...seniorAdReview.criticalProblems, ...ctrReview.mainProblems],
    );
    excluded.push(built.templateId);
  }

  return last!;
}

async function loadProductCutout(
  productImage: string | undefined,
  userId: string,
  existingPath?: string | null,
): Promise<{ renderSrc: string; absPath: string; webPath: string; cutout: boolean }> {
  if (existingPath) {
    const webPath = existingPath.startsWith("/")
      ? existingPath
      : `/${existingPath.replace(/^\/+/, "")}`;
    const absPath = path.isAbsolute(existingPath)
      ? existingPath
      : path.join(process.cwd(), "public", webPath.replace(/^\//, ""));
    try {
      const buffer = await readFile(absPath);
      return {
        renderSrc: bufferToDataUrl(buffer),
        absPath,
        webPath,
        cutout: true,
      };
    } catch {
      // fall through
    }
  }

  if (!productImage) {
    throw new Error("PRODUCT_IMAGE_REQUIRED");
  }

  const { buffer } = parseProductImageDataUrl(productImage);
  if (USE_FAST_CUTOUT) {
    return processProductImageForGeneration(buffer, userId);
  }
  return processProductImageForCover(buffer, userId);
}

async function cutoutFromBuffer(
  buffer: Buffer,
  userId: string,
): Promise<{ renderSrc: string; absPath: string; webPath: string; cutout: boolean }> {
  if (USE_FAST_CUTOUT) {
    return processProductImageForGeneration(buffer, userId);
  }
  return processProductImageForCover(buffer, userId);
}

export async function handleGenerateInfographic(
  input: GenerateInfographicInput,
): Promise<GenerateInfographicResult> {
  const slot = await consumeGenerationSlot(input.userId);

  try {
    await loadDesignMemoryStore().catch((error) => {
      console.warn("[design-memory] preload failed:", error);
    });
    await preloadKnowledgeAnalysis().catch((error) => {
      console.warn("[knowledge-engine] preload failed:", error);
    });

    let sdData: InfographicSdInput;
    let appliedStyle: InfographicStyle = input.style ?? DEFAULT_STYLE;
    let aiSource = "mock";
    let productCutoutPath: string | null = null;
    let compositingHints: CompositingHints | undefined;
    let qualityScore: number | undefined;
    let designBrief: DesignBrief | undefined;
    let referenceContext: ResolvedReferenceContext | undefined;
    let storedScenePlan: ScenePlan | undefined;
    let preloadedProductVisual: Awaited<ReturnType<typeof analyzeProductVisual>> | undefined;
    let preloadedCutout: Awaited<ReturnType<typeof loadProductCutout>> | undefined;
    let conceptRenderQueue: CreativeDirectorResult[] = [];
    let knowledgeCategory: KnowledgeCategory | undefined;
    let knowledgePatternsUsed = 0;

    const variationSeed =
      input.backgroundSeed ??
      `gen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (input.regenerateBackgroundOnly && input.existingImageId) {
      const existing = await prisma.generatedImage.findUnique({
        where: { id: input.existingImageId },
      });
      if (!existing || existing.userId !== input.userId) {
        throw new Error("IMAGE_NOT_FOUND");
      }

      appliedStyle = input.style ?? DEFAULT_STYLE;

      if (existing.generatedJson) {
        const stored = unpackSdPayload(existing.generatedJson);
        sdData = stored.data;
        appliedStyle = input.style ?? stored.style ?? DEFAULT_STYLE;
        compositingHints = stored.compositingHints;
        qualityScore = stored.qualityScore;
        designBrief = stored.brief;
        storedScenePlan = stored.scenePlan;
        productCutoutPath = existing.productCutout;
        aiSource = "regen";
      } else {
        const ollama = await generateSdInfographicData(
          existing.prompt,
          appliedStyle,
          input.ollamaContext,
        );
        sdData = ollama.data;
        compositingHints = ollama.compositingHints;
        qualityScore = ollama.qualityScore;
        designBrief = ollama.brief;
        aiSource = "regen-rebuild";
      }
    } else {
      if (!input.productImage) {
        throw new Error("PRODUCT_IMAGE_REQUIRED");
      }

      appliedStyle = input.style ?? DEFAULT_STYLE;
      referenceContext = resolveReferenceContext(
        input.prompt,
        appliedStyle,
        input.ollamaContext?.examples ?? [],
      );
      const styleHint =
        input.style ??
        (referenceContext.hasStrongReference ? referenceContext.style : undefined);
      if (referenceContext.hasStrongReference && !input.style) {
        appliedStyle = referenceContext.style;
      }

      const { buffer: productBuffer } = parseProductImageDataUrl(input.productImage);
      const earlyAnalysis = analyzeProductPrompt(input.prompt);
      const knowledge = await retrieveKnowledgeContext(input.prompt, earlyAnalysis.category);
      knowledgeCategory = knowledge.category;
      knowledgePatternsUsed = knowledge.patterns.length;

      // Ollama + анализ фото + вырезка товара — параллельно (~2–3 мин экономии)
      const [ollama, productVisual, earlyCutout] = await Promise.all([
        generateSdInfographicData(input.prompt, styleHint, {
          ...input.ollamaContext,
          referenceContext,
          userId: input.userId,
          artDirectorMode: input.artDirectorMode,
          knowledgeBlock: knowledge.promptBlock || undefined,
        }),
        analyzeProductVisual(productBuffer),
        cutoutFromBuffer(productBuffer, input.userId),
      ]);

      sdData = ollama.data;
      compositingHints = ollama.compositingHints;
      qualityScore = ollama.qualityScore;
      designBrief = ollama.brief;
      conceptRenderQueue = ollama.conceptRenderQueue ?? [];
      aiSource = ollama.source;

      preloadedProductVisual = productVisual;
      preloadedCutout = earlyCutout;
    }

    // ── 1. Анализ товара + Scene Planner ──────────────────────────────
    let productVisual = preloadedProductVisual;
    if (!productVisual && input.productImage) {
      const { buffer } = parseProductImageDataUrl(input.productImage);
      productVisual = await analyzeProductVisual(buffer);
    }

    const visualHook = designBrief?.designProcess?.visualHook ?? designBrief?.visualHook;

    let activeCreative = creativeFromBrief(designBrief);
    const sceneNarrative = activeCreative?.sceneNarrative;

    const { analysis, scene: plannedScene } = planScene({
      prompt: input.prompt,
      coverConceptId: input.coverConcept ?? storedScenePlan?.coverConceptId,
      visualHook,
      styleHint: input.style ?? (referenceContext?.hasStrongReference ? referenceContext.style : undefined),
      seed: variationSeed,
      productVisual,
      sceneNarrative,
      compositionScenarioId: designBrief?.compositionScenarioId as
        | import("@/lib/design/types").CompositionScenarioId
        | undefined,
    });

    const scenePlan = storedScenePlan ?? plannedScene;

    // ── 2. Layout Engine + Senior Art Director ───────────────────────
    let compositionResult: CompositionResult | null = null;
    let cardMeaning: CardMeaning | undefined;
    let seniorAdReview: SeniorArtDirectorReview | undefined;
    let ctrReview: MarketplaceCtrReview | undefined;

    if (sdData.layout === "marketplace") {
      const built = await buildLayoutWithAgentReview({
        designBrief,
        activeCreative,
        analysis,
        productVisual,
        productPrompt: input.prompt,
        seed: variationSeed,
        knowledgeCategory,
      });
      compositionResult = built.compositionResult;
      cardMeaning = built.cardMeaning;
      seniorAdReview = built.seniorAdReview;
      ctrReview = built.ctrReview;
      if (designBrief && !designBrief.cardMeaning) {
        designBrief = { ...designBrief, cardMeaning };
      }
    }

    let compositionLayout = compositionResult?.layout;
    let objectScale = layoutObjectScale(compositionLayout?.metrics?.productAreaPct);
    compositingHints = sceneToCompositingHints(scenePlan, objectScale);

    // ── 3. Prompt Builder → SD фон ────────────────────────────────────
    const scenePrompt = buildSceneBackgroundPrompt(scenePlan, analysis, {
      dominantColors: productVisual?.dominantColors,
      shape: productVisual?.shape,
      sceneNarrative: activeCreative?.sceneNarrative,
      visualHookStory: activeCreative?.creativeConcept.visualHook,
    });
    sdData.backgroundPrompt = scenePrompt;

    let backgroundUrl: string | null = null;
    let backgroundSource: "sd" | "fallback" = "sd";
    let backgroundDataUrl: string | undefined;
    let compositeResult: Awaited<ReturnType<typeof compositeProductIntoScene>> | undefined;
    let qualityValidation: QualityValidationResult | undefined;
    let photoReview: CommercialPhotographerReview | undefined;
    let mergedImageDataUrl: string | undefined;
    let productRender: Awaited<ReturnType<typeof loadProductCutout>> | undefined =
      preloadedCutout;

    const usePhotorealMerge =
      sdData.layout === "marketplace" && process.env.MARKETPLACE_HTML_PRODUCT !== "1";

    // SD фон + вырезка (если ещё нет) — параллельно
    const cutoutPromise =
      productRender
        ? Promise.resolve(productRender)
        : loadProductCutout(
            input.productImage,
            input.userId,
            input.regenerateBackgroundOnly ? productCutoutPath ?? undefined : undefined,
          );

    const bgPromise = (async () => {
      if (!process.env.HF_API_KEY) throw new Error("HF_API_KEY missing");
      const url = await generateBackground(sdData.backgroundPrompt, {
        seedSuffix: variationSeed,
        style: appliedStyle,
      });
      return { url, dataUrl: await backgroundToDataUrl(url) };
    })();

    try {
      const [bg, cutout] = await Promise.all([bgPromise, cutoutPromise]);
      backgroundUrl = bg.url;
      backgroundDataUrl = bg.dataUrl;
      backgroundSource = "sd";
      productRender = cutout;
      productCutoutPath = cutout.webPath;
    } catch (error) {
      console.warn("SD background failed, gradient fallback:", error);
      backgroundSource = "fallback";
      try {
        productRender = await cutoutPromise;
        productCutoutPath = productRender.webPath;
      } catch (cutoutError) {
        console.warn("Cutout failed:", cutoutError);
      }
    }

    const runPhotoReview = async () => {
      photoReview = await runCommercialPhotographer({
        scene: scenePlan,
        lighting: compositeResult?.lighting,
        qualityValidation,
        hasComposite: !!compositeResult,
        hasReflection: scenePlan.reflectionEnabled,
        hasShadows: !!compositeResult,
        backgroundSource,
        productPrompt: input.prompt,
      });
    };

    if (
      usePhotorealMerge &&
      productRender?.cutout &&
      productCutoutPath &&
      backgroundUrl &&
      backgroundSource === "sd"
    ) {
      let photoBgRetry = 0;
      while (photoBgRetry <= MAX_PHOTO_BG_RETRIES) {
        try {
          if (photoBgRetry > 0) {
            if (!process.env.HF_API_KEY) break;
            const url = await generateBackground(sdData.backgroundPrompt, {
              seedSuffix: `${variationSeed}:photo-${photoBgRetry}`,
              style: appliedStyle,
            });
            backgroundUrl = url;
            backgroundDataUrl = await backgroundToDataUrl(url);
          }

          compositeResult = await compositeProductIntoScene(backgroundUrl, productCutoutPath, {
            layout: "marketplace",
            scene: scenePlan,
            compositionLayout,
            objectScale,
          });

          qualityValidation = validateQuality({
            compositionLayout,
            compositionScore: compositionResult?.score,
            dna: compositionResult?.dna,
            scene: scenePlan,
            lighting: compositeResult.lighting,
            productAreaPct: compositionLayout?.metrics?.productAreaPct,
            hasReflection: scenePlan.reflectionEnabled,
            hasShadows: true,
          });
          qualityScore = qualityValidation.total;

          await runPhotoReview();

          if (photoReview?.looksLikePhoto || photoBgRetry >= MAX_PHOTO_BG_RETRIES) {
            if (photoBgRetry > 0 && photoReview?.looksLikePhoto) {
              console.info(`[commercial-photographer] passed after bg retry ${photoBgRetry}`);
            }
            break;
          }

          console.warn(
            `[commercial-photographer] score ${photoReview?.score} realism ${photoReview?.realism}`,
            photoReview?.problems,
          );
          photoBgRetry++;
        } catch (error) {
          console.warn("Scene composite failed:", error);
          break;
        }
      }

      if (qualityValidation && !qualityValidation.passed) {
        console.warn(
          `[quality] score ${qualityValidation.total}/${QUALITY_PASS_THRESHOLD}`,
          qualityValidation.issues,
        );
      }
    } else {
      await runPhotoReview();
    }

    let chiefPlan: ChiefDesignDirectorPlan | undefined;
    if (cardMeaning && compositionLayout && seniorAdReview && ctrReview && photoReview) {
      chiefPlan = await runChiefDesignDirector({
        cardMeaning,
        layout: compositionLayout,
        designScore: compositionResult?.score?.total,
        templateId: compositionResult?.layout?.scenarioId,
        seniorArtDirector: seniorAdReview,
        marketplaceExpert: ctrReview,
        commercialPhotographer: photoReview,
        productPrompt: input.prompt,
      });

      if (!chiefPlan.approved && MAX_CHIEF_FIX_RETRIES > 0) {
        const hints = deriveFixApplicationHints(
          chiefPlan,
          analysis.category,
          input.prompt,
          `${variationSeed}:chief`,
        );

        if (hints.simplifyCardMeaning && cardMeaning) {
          cardMeaning = { ...cardMeaning, subtitle: "", badge: "" };
          if (designBrief) {
            designBrief = { ...designBrief, cardMeaning };
          }
        }

        if (hints.needsLayoutRetry && sdData.layout === "marketplace") {
          const currentTemplate = compositionResult?.layout?.scenarioId as LayoutTemplateId | undefined;
          const fixed = buildProfessionalComposition({
            designBrief,
            activeCreative,
            category: analysis.category,
            productVisual,
            seed: `${variationSeed}:chief-layout`,
            templateId: hints.preferTemplateId,
            excludeTemplateIds: currentTemplate ? [currentTemplate] : undefined,
            knowledgeCategory,
          });
          compositionResult = fixed.compositionResult;
          compositionLayout = compositionResult.layout;
          objectScale = layoutObjectScale(compositionLayout.metrics?.productAreaPct);
          cardMeaning = fixed.cardMeaning;
        }

        if (
          hints.needsBackgroundRetry &&
          hints.backgroundEnvironment &&
          productCutoutPath &&
          backgroundUrl &&
          usePhotorealMerge
        ) {
          const bgPrompt = `${hints.backgroundEnvironment}, ultra realistic commercial photography, no text, no product`;
          if (designBrief) {
            designBrief = { ...designBrief, backgroundPrompt: bgPrompt.slice(0, 480) };
          }
          sdData.backgroundPrompt = bgPrompt;
          try {
            if (!process.env.HF_API_KEY) throw new Error("HF_API_KEY missing");
            const url = await generateBackground(bgPrompt, {
              seedSuffix: `${variationSeed}:chief-bg`,
              style: appliedStyle,
            });
            backgroundUrl = url;
            backgroundDataUrl = await backgroundToDataUrl(url);
            compositeResult = await compositeProductIntoScene(url, productCutoutPath, {
              layout: "marketplace",
              scene: scenePlan,
              compositionLayout,
              objectScale,
            });
            mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
            qualityValidation = validateQuality({
              compositionLayout,
              compositionScore: compositionResult?.score,
              dna: compositionResult?.dna,
              scene: scenePlan,
              lighting: compositeResult.lighting,
              productAreaPct: compositionLayout?.metrics?.productAreaPct,
              hasReflection: scenePlan.reflectionEnabled,
              hasShadows: true,
            });
            await runPhotoReview();
            chiefPlan = await runChiefDesignDirector({
              cardMeaning,
              layout: compositionLayout,
              designScore: compositionResult?.score?.total,
              templateId: compositionResult?.layout?.scenarioId,
              seniorArtDirector: seniorAdReview!,
              marketplaceExpert: ctrReview!,
              commercialPhotographer: photoReview!,
              productPrompt: input.prompt,
            });
            console.info(`[chief-design-director] fix retry → approved=${chiefPlan.approved} est=${chiefPlan.estimatedScoreAfterFix}`);
          } catch (error) {
            console.warn("[chief-design-director] fix retry failed:", error);
          }
        }
      }
    }

    let finalQuality = activeCreative
      ? evaluateFinalQuality({
          creative: activeCreative,
          analysis,
          productPrompt: input.prompt,
          compositionLayout,
          qualityValidation,
          hasComposite: !!compositeResult,
        })
      : undefined;

    let conceptRetryIndex = 0;
    while (
      finalQuality &&
      !finalQuality.passed &&
      conceptRetryIndex < MAX_CONCEPT_RENDER_RETRIES &&
      conceptRenderQueue[conceptRetryIndex + 1]
    ) {
      conceptRetryIndex++;
      const nextConcept = conceptRenderQueue[conceptRetryIndex];
      activeCreative = nextConcept;
      if (designBrief) {
        const retryMeaning = creativeConceptToCardMeaning(nextConcept, designBrief);
        designBrief = applyPosterRules(designBrief, nextConcept, retryMeaning, analysis.category);
        sdData = briefToSdInput(designBrief, input.prompt);
        cardMeaning = retryMeaning;
      }

      if (sdData.layout === "marketplace") {
        const rebuilt = await buildLayoutWithAgentReview({
          designBrief,
          activeCreative: nextConcept,
          analysis,
          productVisual,
          productPrompt: input.prompt,
          seed: `${variationSeed}:concept-${conceptRetryIndex}`,
          knowledgeCategory,
        });
        compositionResult = rebuilt.compositionResult;
        compositionLayout = compositionResult.layout;
        objectScale = layoutObjectScale(compositionLayout.metrics?.productAreaPct);
        seniorAdReview = rebuilt.seniorAdReview;
        ctrReview = rebuilt.ctrReview;
      }

      const retryScene = planScene({
        prompt: input.prompt,
        coverConceptId: input.coverConcept,
        visualHook,
        styleHint: input.style,
        seed: `${variationSeed}:concept-${conceptRetryIndex}`,
        productVisual,
        sceneNarrative: nextConcept.sceneNarrative,
        compositionScenarioId: nextConcept.compositionScenarioId,
      }).scene;

      const retryPrompt = buildSceneBackgroundPrompt(retryScene, analysis, {
        dominantColors: productVisual?.dominantColors,
        shape: productVisual?.shape,
        sceneNarrative: nextConcept.sceneNarrative,
        visualHookStory: nextConcept.creativeConcept.visualHook,
      });
      sdData.backgroundPrompt = retryPrompt;

      try {
        if (!process.env.HF_API_KEY) throw new Error("HF_API_KEY missing");
        const url = await generateBackground(sdData.backgroundPrompt, {
          seedSuffix: `${variationSeed}:c${conceptRetryIndex}`,
          style: appliedStyle,
        });
        backgroundUrl = url;
        backgroundDataUrl = await backgroundToDataUrl(url);
        backgroundSource = "sd";

        if (productCutoutPath && usePhotorealMerge) {
          compositeResult = await compositeProductIntoScene(url, productCutoutPath, {
            layout: "marketplace",
            scene: retryScene,
            compositionLayout,
            objectScale,
          });
          mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
          qualityValidation = validateQuality({
            compositionLayout,
            compositionScore: compositionResult?.score,
            dna: compositionResult?.dna,
            scene: retryScene,
            lighting: compositeResult.lighting,
            productAreaPct: compositionLayout?.metrics?.productAreaPct,
            hasReflection: retryScene.reflectionEnabled,
            hasShadows: true,
          });
          photoReview = await runCommercialPhotographer({
            scene: retryScene,
            lighting: compositeResult.lighting,
            qualityValidation,
            hasComposite: true,
            hasReflection: retryScene.reflectionEnabled,
            hasShadows: true,
            backgroundSource: "sd",
            productPrompt: input.prompt,
          });
        }
      } catch (error) {
        console.warn(`[concept-retry] ${nextConcept.archetypeId} failed:`, error);
        break;
      }

      finalQuality = evaluateFinalQuality({
        creative: nextConcept,
        analysis,
        productPrompt: input.prompt,
        compositionLayout,
        qualityValidation,
        hasComposite: !!compositeResult,
      });
      if (finalQuality.passed) {
        console.info(`[concept-retry] passed with ${nextConcept.archetypeId}`);
      }
    }

    if (finalQuality && !finalQuality.passed) {
      console.warn(`[final-quality] ${finalQuality.total}/100`, finalQuality.issues);
    }

    const infographicData = sdDataToInfographic(sdData, input.prompt);
    const { font: libraryFont, badge: libraryBadge } = await resolveLibraryAssets(
      sdData.fontId,
      sdData.badgeId,
    );
    const fallbackBg =
      backgroundSource === "fallback"
        ? TRENDS[appliedStyle].background
        : buildFallbackGradient(sdData.colors);

    if (!mergedImageDataUrl && compositeResult) {
      mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
    } else if (
      sdData.layout !== "marketplace" &&
      backgroundUrl &&
      backgroundSource === "sd" &&
      productRender?.cutout &&
      productCutoutPath
    ) {
      try {
        compositeResult = await compositeProductIntoScene(backgroundUrl, productCutoutPath, {
          layout: "center",
          scene: scenePlan,
          objectScale,
        });
        mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
      } catch (error) {
        console.warn("Non-marketplace composite failed:", error);
      }
    }

    const accentHex = resolveMarketplaceAccent(sdData.colors, analysis.category);

    const compositionMeta = compositionResult
      ? {
          dna: compositionResult.dna,
          scenarioId: compositionResult.scenarioId,
          score: compositionResult.score,
          seed: compositionResult.seed,
          attempts: compositionResult.attempts,
        }
      : undefined;

    // ── 10. Layout Renderer ───────────────────────────────────────────
    const html = renderInfographicHtml(infographicData, {
      style: appliedStyle,
      layout: sdData.layout,
      mergedImageDataUrl,
      backgroundDataUrl: mergedImageDataUrl ? undefined : backgroundDataUrl,
      backgroundCss: !backgroundDataUrl && !mergedImageDataUrl ? fallbackBg : undefined,
      productImageSrc: mergedImageDataUrl ? undefined : productRender?.renderSrc,
      productImageCutout: productRender?.cutout ?? false,
      libraryFont,
      libraryBadge,
      accentHex,
      compositionLayout,
    });

    const filename = `${input.userId}-${Date.now()}.png`;
    const imagePath = await renderHtmlToImage(html, filename);

    const balance = slot.usedFreeQuota
      ? { ...slot.balance, freeRemaining: slot.balance.freeRemaining - 1 }
      : slot.balance;

    const payloadExtras = {
      brief: designBrief,
      compositingHints,
      qualityScore: qualityValidation?.total ?? qualityScore,
      composition: compositionMeta,
      scenePlan,
      qualityValidation,
      seniorArtDirector: seniorAdReview,
      marketplaceCtrExpert: ctrReview,
      commercialPhotographer: photoReview,
      chiefDesignDirector: chiefPlan,
      designMemory: undefined as DesignMemoryUpdateResult | undefined,
    };

    let designMemory: DesignMemoryUpdateResult | undefined;
    let knowledgeAnalysisTriggered = false;
    if (sdData.layout === "marketplace") {
      try {
        designMemory = await runDesignMemory({
          productPrompt: input.prompt,
          category: analysis.category,
          templateId: compositionResult?.layout?.scenarioId as LayoutTemplateId | undefined,
          fontId: sdData.fontId,
          badgeId: sdData.badgeId,
          scenePlan,
          designScore: compositionResult?.score?.total,
          cardMeaning,
          seniorAdReview,
          ctrReview,
          photoReview,
          chiefPlan,
        });
        payloadExtras.designMemory = designMemory;
      } catch (error) {
        console.warn("[design-memory] learn failed:", error);
      }

      try {
        const collected = await collectGenerationPattern({
          prompt: input.prompt,
          productCategory: analysis.category,
          sdData,
          scenePlan,
          compositionResult,
          fontName: libraryFont?.name ?? libraryFont?.fontFamily ?? null,
          badgeName: libraryBadge?.name ?? null,
          imagePath,
          seniorAdReview,
          ctrReview,
          photoReview,
        });
        knowledgeAnalysisTriggered = collected.analysisTriggered;
        if (!knowledgeCategory) knowledgeCategory = collected.category;
      } catch (error) {
        console.warn("[knowledge-engine] collect failed:", error);
      }
    }

    if (input.regenerateBackgroundOnly && input.existingImageId) {
      await prisma.generatedImage.update({
        where: { id: input.existingImageId },
        data: {
          imagePath,
          backgroundUrl,
          productCutout: productCutoutPath,
          generatedJson: packSdPayload(sdData, appliedStyle, payloadExtras),
        },
      });

      return {
        id: input.existingImageId,
        imagePath,
        backgroundUrl,
        freeRemaining: balance.unlimited ? -1 : balance.freeRemaining,
        credits: balance.credits,
        unlimited: balance.unlimited,
        aiSource,
        backgroundSource,
        pipelineVersion: PIPELINE_VERSION,
        qualityScore: qualityValidation?.total,
        layoutTemplateId: compositionResult?.layout?.scenarioId,
        designScore: compositionResult?.score?.total,
        seniorAdScore: seniorAdReview?.score,
        seniorAdApproved: seniorAdReview?.approved,
        ctrScore: ctrReview?.score,
        ctrPrediction: ctrReview?.ctrPrediction,
        wouldClick: ctrReview?.wouldClick,
        photoScore: photoReview?.score,
        photoRealism: photoReview?.realism,
        looksLikePhoto: photoReview?.looksLikePhoto,
        chiefApproved: chiefPlan?.approved,
        estimatedScoreAfterFix: chiefPlan?.estimatedScoreAfterFix,
        designMemoryUpdate: designMemory?.memoryUpdate,
        designMemoryAdvice: designMemory?.nextGenerationAdvice,
        knowledgeCategory,
        knowledgePatternsUsed,
        knowledgeAnalysisTriggered,
        ...briefMeta(designBrief),
      };
    }

    const image = await prisma.generatedImage.create({
      data: {
        userId: input.userId,
        prompt: input.prompt,
        htmlContent: "[SCENE_PIPELINE]",
        imagePath,
        generatedJson: packSdPayload(sdData, appliedStyle, payloadExtras),
        backgroundUrl,
        productCutout: productCutoutPath,
        usedFreeQuota: slot.usedFreeQuota,
      },
    });

    if (sdData.layout === "marketplace") {
      try {
        await prisma.generationHistory.updateMany({
          where: { generatedImage: imagePath },
          data: { generatedImageId: image.id },
        });
      } catch {
        // non-blocking
      }
    }

    return {
      id: image.id,
      imagePath,
      backgroundUrl,
      freeRemaining: balance.unlimited ? -1 : balance.freeRemaining,
      credits: balance.credits,
      unlimited: balance.unlimited,
      aiSource,
      backgroundSource,
      pipelineVersion: PIPELINE_VERSION,
      qualityScore: qualityValidation?.total,
      layoutTemplateId: compositionResult?.layout?.scenarioId,
      designScore: compositionResult?.score?.total,
      seniorAdScore: seniorAdReview?.score,
      seniorAdApproved: seniorAdReview?.approved,
      ctrScore: ctrReview?.score,
      ctrPrediction: ctrReview?.ctrPrediction,
      wouldClick: ctrReview?.wouldClick,
      photoScore: photoReview?.score,
      photoRealism: photoReview?.realism,
      looksLikePhoto: photoReview?.looksLikePhoto,
      chiefApproved: chiefPlan?.approved,
      estimatedScoreAfterFix: chiefPlan?.estimatedScoreAfterFix,
      designMemoryUpdate: designMemory?.memoryUpdate,
      designMemoryAdvice: designMemory?.nextGenerationAdvice,
      knowledgeCategory,
      knowledgePatternsUsed,
      knowledgeAnalysisTriggered,
      ...briefMeta(designBrief),
    };
  } catch (error) {
    if (!slot.usedFreeQuota && !slot.balance.unlimited) {
      await prisma.user.update({
        where: { id: input.userId },
        data: { credits: { increment: 1 } },
      });
    }
    throw error;
  }
}

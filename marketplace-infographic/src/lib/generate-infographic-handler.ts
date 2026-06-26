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
  generateComposition,
  planScene,
  buildSceneBackgroundPrompt,
  validateQuality,
  QUALITY_PASS_THRESHOLD,
} from "@/lib/design";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { QualityValidationResult } from "@/lib/design/quality-validator";
import { objectScaleFromHook } from "@/lib/design-process/visual-hook";
import type { CoverConceptId } from "@/lib/cover-concepts";
import { PIPELINE_VERSION } from "@/lib/pipeline-version";
import { USE_FAST_CUTOUT } from "@/lib/pipeline-config";

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
  visualHook?: { type: string; reason: string; confidence?: number };
  pipelineVersion: string;
  qualityScore?: number;
};

function briefMeta(brief?: DesignBrief) {
  const hook = brief?.designProcess?.visualHook ?? brief?.visualHook;
  return {
    designConcept: brief?.designConcept ?? brief?.designProcess?.stage2?.concept,
    visualHook: hook
      ? { type: hook.type, reason: hook.reason, confidence: hook.confidence }
      : undefined,
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

      // Ollama + анализ фото + вырезка товара — параллельно (~2–3 мин экономии)
      const [ollama, productVisual, earlyCutout] = await Promise.all([
        generateSdInfographicData(input.prompt, styleHint, {
          ...input.ollamaContext,
          referenceContext,
        }),
        analyzeProductVisual(productBuffer),
        cutoutFromBuffer(productBuffer, input.userId),
      ]);

      sdData = ollama.data;
      compositingHints = ollama.compositingHints;
      qualityScore = ollama.qualityScore;
      designBrief = ollama.brief;
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

    const { analysis, scene: plannedScene } = planScene({
      prompt: input.prompt,
      coverConceptId: input.coverConcept ?? storedScenePlan?.coverConceptId,
      visualHook,
      styleHint: input.style ?? (referenceContext?.hasStrongReference ? referenceContext.style : undefined),
      seed: variationSeed,
      productVisual,
    });

    const scenePlan = storedScenePlan ?? plannedScene;
    const objectScale = objectScaleFromHook(
      visualHook,
      compositingHints?.objectScale ?? designBrief?.objectScale ?? 0.78,
    );
    compositingHints = sceneToCompositingHints(scenePlan, objectScale);

    // ── 2. Composition Engine (диапазоны из Scene Planner) ──────────
    const compositionResult =
      sdData.layout === "marketplace"
        ? generateComposition({
            category: analysis.category,
            layout: "marketplace",
            bulletCount: sdData.bullets.length,
            hasLeftPanel: true,
            hasRightSidebar: true,
            objectScale,
            styleHint:
              input.style ??
              (referenceContext?.hasStrongReference ? referenceContext.style : undefined),
            seed: variationSeed,
            visualHook,
            scenarioId: scenePlan.compositionScenario,
            productSafeZone: scenePlan.productSafeZone,
          })
        : null;

    const compositionLayout = compositionResult?.layout;

    // ── 3. Prompt Builder → SD фон ────────────────────────────────────
    const scenePrompt = buildSceneBackgroundPrompt(scenePlan, analysis, {
      dominantColors: productVisual?.dominantColors,
      shape: productVisual?.shape,
    });
    sdData.backgroundPrompt = scenePrompt;

    let backgroundUrl: string | null = null;
    let backgroundSource: "sd" | "fallback" = "sd";
    let backgroundDataUrl: string | undefined;
    let compositeResult: Awaited<ReturnType<typeof compositeProductIntoScene>> | undefined;
    let qualityValidation: QualityValidationResult | undefined;
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

    if (
      usePhotorealMerge &&
      productRender?.cutout &&
      productCutoutPath &&
      backgroundUrl &&
      backgroundSource === "sd"
    ) {
      try {
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

        if (!qualityValidation.passed) {
          console.warn(
            `[quality] score ${qualityValidation.total}/${QUALITY_PASS_THRESHOLD} (no retry in fast mode)`,
            qualityValidation.issues,
          );
        }
      } catch (error) {
        console.warn("Scene composite failed:", error);
      }
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

    let mergedImageDataUrl: string | undefined;
    if (compositeResult) {
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
    };

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

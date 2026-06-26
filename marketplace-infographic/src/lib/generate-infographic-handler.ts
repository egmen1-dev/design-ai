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
import {
  renderInfographicHtml,
} from "@/lib/infographic-template";
import { sdDataToInfographic } from "@/lib/sd-to-infographic";
import { packSdPayload, unpackSdPayload } from "@/lib/sd-stored-payload";
import { DEFAULT_STYLE, TRENDS, type InfographicStyle } from "@/lib/design-trends";
import { renderHtmlToImage } from "@/lib/puppeteer";
import { bufferToDataUrl } from "@/lib/background-removal";
import {
  parseProductImageDataUrl,
  processProductImageForGeneration,
} from "@/lib/product-image-sd";
import type { CompositingHints, DesignBrief } from "@/lib/design-brief/schema";
import type { InfographicSdInput } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { resolveReferenceContext } from "@/lib/reference-style-resolver";
import {
  mergeProductWithBackground,
  mergedToDataUrl,
} from "@/lib/image-compositor";
import { resolveMarketplaceAccent } from "@/lib/accent-color";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { PIPELINE_VERSION } from "@/lib/pipeline-version";

export type GenerateInfographicInput = {
  userId: string;
  prompt: string;
  productImage?: string;
  style?: InfographicStyle;
  regenerateBackgroundOnly?: boolean;
  existingImageId?: string;
  backgroundSeed?: string;
  ollamaContext?: OllamaSdContext;
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
  appliedStyle: InfographicStyle;
  pipelineVersion: string;
};

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
      // fall through to re-process if file missing
    }
  }

  if (!productImage) {
    throw new Error("PRODUCT_IMAGE_REQUIRED");
  }

  const { buffer } = parseProductImageDataUrl(productImage);
  return processProductImageForGeneration(buffer, userId);
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
    let productRender: Awaited<ReturnType<typeof loadProductCutout>>;
    let compositingHints: CompositingHints | undefined;
    let qualityScore: number | undefined;
    let designBrief: DesignBrief | undefined;

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
        appliedStyle = input.style ?? stored.style;
        compositingHints = stored.compositingHints;
        qualityScore = stored.qualityScore;
        designBrief = stored.brief;
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

      productRender = await loadProductCutout(
        input.productImage,
        input.userId,
        existing.productCutout,
      );
      productCutoutPath = productRender.webPath;
    } else {
      if (!input.productImage) {
        throw new Error("PRODUCT_IMAGE_REQUIRED");
      }
      appliedStyle = input.style ?? DEFAULT_STYLE;

      const referenceContext = resolveReferenceContext(
        input.prompt,
        appliedStyle,
        input.ollamaContext?.examples ?? [],
      );
      if (referenceContext.hasStrongReference) {
        appliedStyle = referenceContext.style;
      }

      productRender = await loadProductCutout(input.productImage, input.userId);
      productCutoutPath = productRender.webPath;

      const ollama = await generateSdInfographicData(
        input.prompt,
        appliedStyle,
        { ...input.ollamaContext, referenceContext },
      );
      sdData = ollama.data;
      compositingHints = ollama.compositingHints;
      qualityScore = ollama.qualityScore;
      designBrief = ollama.brief;
      aiSource = ollama.source;
    }

    let backgroundUrl: string | null = null;
    let backgroundSource: "sd" | "fallback" = "sd";
    let backgroundDataUrl: string | undefined;

    const variationSeed =
      input.backgroundSeed ??
      `gen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      if (!process.env.HF_API_KEY) {
        throw new Error("HF_API_KEY missing");
      }
      backgroundUrl = await generateBackground(sdData.backgroundPrompt, {
        seedSuffix: variationSeed,
        style: appliedStyle,
      });
      backgroundDataUrl = await backgroundToDataUrl(backgroundUrl);
    } catch (error) {
      console.warn("SD background failed, gradient fallback:", error);
      backgroundSource = "fallback";
    }

    // Товар вшивается в фон через sharp (тень + без ореола), текст — поверх в HTML
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
    const useHtmlProduct = sdData.layout === "marketplace";

    if (
      !useHtmlProduct &&
      backgroundUrl &&
      backgroundSource === "sd" &&
      productRender.cutout &&
      productCutoutPath
    ) {
      try {
        const mergedUrl = await mergeProductWithBackground(
          backgroundUrl,
          productCutoutPath,
          {
            layout: sdData.layout === "marketplace" ? "marketplace" : "center",
            compositingHints,
            reflection: compositingHints?.reflection,
          },
        );
        mergedImageDataUrl = await mergedToDataUrl(mergedUrl);
      } catch (error) {
        console.warn("Product merge failed, HTML overlay fallback:", error);
      }
    }

    const analysis = analyzeProductPrompt(input.prompt);
    const accentHex = resolveMarketplaceAccent(sdData.colors, analysis.category);

    const html = renderInfographicHtml(infographicData, {
      style: appliedStyle,
      layout: sdData.layout,
      mergedImageDataUrl,
      backgroundDataUrl: mergedImageDataUrl ? undefined : backgroundDataUrl,
      backgroundCss: !backgroundDataUrl && !mergedImageDataUrl ? fallbackBg : undefined,
      productImageSrc: mergedImageDataUrl ? undefined : productRender.renderSrc,
      productImageCutout: productRender.cutout,
      libraryFont,
      libraryBadge,
      accentHex,
    });

    const filename = `${input.userId}-${Date.now()}.png`;
    const imagePath = await renderHtmlToImage(html, filename);

    const balance = slot.usedFreeQuota
      ? { ...slot.balance, freeRemaining: slot.balance.freeRemaining - 1 }
      : slot.balance;

    if (input.regenerateBackgroundOnly && input.existingImageId) {
      await prisma.generatedImage.update({
        where: { id: input.existingImageId },
        data: {
          imagePath,
          backgroundUrl,
          productCutout: productCutoutPath,
          generatedJson: packSdPayload(sdData, appliedStyle, {
            brief: designBrief,
            compositingHints,
            qualityScore,
          }),
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
        appliedStyle,
        pipelineVersion: PIPELINE_VERSION,
      };
    }

    const image = await prisma.generatedImage.create({
      data: {
        userId: input.userId,
        prompt: input.prompt,
        htmlContent: "[SD_PIPELINE]",
        imagePath,
        generatedJson: packSdPayload(sdData, appliedStyle, {
          brief: designBrief,
          compositingHints,
          qualityScore,
        }),
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
      appliedStyle,
      pipelineVersion: PIPELINE_VERSION,
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

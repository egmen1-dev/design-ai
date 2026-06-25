import { readFile } from "fs/promises";
import path from "path";
import { consumeGenerationSlot } from "@/lib/credits";
import { generateSdInfographicData } from "@/lib/ollama-sd";
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
  processProductImageWithImgly,
} from "@/lib/product-image-sd";
import type { InfographicSdInput } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  mergeProductWithBackground,
  mergedToDataUrl,
} from "@/lib/image-compositor";

export type GenerateInfographicInput = {
  userId: string;
  prompt: string;
  productImage?: string;
  style?: InfographicStyle;
  regenerateBackgroundOnly?: boolean;
  existingImageId?: string;
  backgroundSeed?: string;
};

export const PIPELINE_VERSION = "v3-styles";

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
  return processProductImageWithImgly(buffer, userId);
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
        aiSource = "regen";
      } else {
        const ollama = await generateSdInfographicData(existing.prompt, appliedStyle);
        sdData = ollama.data;
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
      const ollama = await generateSdInfographicData(input.prompt, appliedStyle);
      sdData = ollama.data;
      aiSource = ollama.source;
      productRender = await loadProductCutout(input.productImage, input.userId);
      productCutoutPath = productRender.webPath;
    }

    let backgroundUrl: string | null = null;
    let backgroundSource: "sd" | "fallback" = "sd";
    let mergedImageDataUrl: string | undefined;
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

    if (backgroundUrl) {
      try {
        const productPath = productRender.absPath || productRender.webPath;
        const mergedPath = await mergeProductWithBackground(
          backgroundUrl,
          productPath,
          { reflection: sdData.layout === "cards" },
        );
        mergedImageDataUrl = await mergedToDataUrl(mergedPath);
      } catch (error) {
        console.warn("Image compositing failed, using SD background layer:", error);
      }
    }

    const infographicData = sdDataToInfographic(sdData, input.prompt);
    const fallbackBg =
      backgroundSource === "fallback"
        ? TRENDS[appliedStyle].background
        : buildFallbackGradient(sdData.colors);

    const html = renderInfographicHtml(infographicData, {
      style: appliedStyle,
      mergedImageDataUrl,
      backgroundDataUrl: mergedImageDataUrl ? undefined : backgroundDataUrl,
      backgroundCss: !mergedImageDataUrl && !backgroundDataUrl ? fallbackBg : undefined,
      productImageSrc:
        mergedImageDataUrl ? undefined : productRender.renderSrc,
      productImageCutout: productRender.cutout,
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
          generatedJson: packSdPayload(sdData, appliedStyle),
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
        generatedJson: packSdPayload(sdData, appliedStyle),
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

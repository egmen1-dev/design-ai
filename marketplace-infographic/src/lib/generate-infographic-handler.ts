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
  renderSdInfographicHtml,
  type InfographicSdData,
} from "@/lib/sd-infographic-template";
import { renderHtmlToImage } from "@/lib/puppeteer";
import { bufferToDataUrl } from "@/lib/background-removal";
import {
  parseProductImageDataUrl,
  processProductImageWithImgly,
} from "@/lib/product-image-sd";
import { prisma } from "@/lib/prisma";
import {
  mergeProductWithBackground,
  mergedToDataUrl,
} from "@/lib/image-compositor";

export type GenerateInfographicInput = {
  userId: string;
  prompt: string;
  productImage?: string;
  regenerateBackgroundOnly?: boolean;
  existingImageId?: string;
  backgroundSeed?: string;
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
    let sdData: InfographicSdData;
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
      if (!existing.generatedJson) {
        throw new Error("NO_JSON_FOR_REGEN");
      }
      sdData = JSON.parse(existing.generatedJson) as InfographicSdData;
      productRender = await loadProductCutout(
        undefined,
        input.userId,
        existing.productCutout,
      );
      productCutoutPath = existing.productCutout;
      aiSource = "regen";
    } else {
      if (!input.productImage) {
        throw new Error("PRODUCT_IMAGE_REQUIRED");
      }
      const ollama = await generateSdInfographicData(input.prompt);
      sdData = ollama.data;
      aiSource = ollama.source;
      productRender = await loadProductCutout(input.productImage, input.userId);
      productCutoutPath = productRender.webPath;
    }

    let backgroundUrl: string | null = null;
    let backgroundSource: "sd" | "fallback" = "sd";
    let backgroundDataUrl: string | undefined;
    let mergedImageDataUrl: string | undefined;

    try {
      if (!process.env.HF_API_KEY) {
        throw new Error("HF_API_KEY missing");
      }
      backgroundUrl = await generateBackground(sdData.backgroundPrompt, {
        skipCache: Boolean(input.backgroundSeed),
        seedSuffix: input.backgroundSeed,
      });
      backgroundDataUrl = await backgroundToDataUrl(backgroundUrl);
    } catch (error) {
      console.warn("SD background failed, gradient fallback:", error);
      backgroundSource = "fallback";
    }

    if (backgroundUrl) {
      try {
        const mergedPath = await mergeProductWithBackground(
          backgroundUrl,
          productRender.webPath,
          { reflection: sdData.layout === "cards" },
        );
        mergedImageDataUrl = await mergedToDataUrl(mergedPath);
      } catch (error) {
        console.warn("Image compositing failed, CSS fallback:", error);
      }
    }

    const html = renderSdInfographicHtml(sdData, {
      mergedImageDataUrl,
      backgroundDataUrl: mergedImageDataUrl ? undefined : backgroundDataUrl,
      backgroundCss: buildFallbackGradient(sdData.colors),
      productImageSrc: mergedImageDataUrl ? undefined : productRender.renderSrc,
      productCutout: productRender.cutout,
    });

    const filename = `${input.userId}-${Date.now()}.png`;
    const imagePath = await renderHtmlToImage(html, filename);

    const balance = slot.usedFreeQuota
      ? { ...slot.balance, freeRemaining: slot.balance.freeRemaining - 1 }
      : slot.balance;

    if (input.regenerateBackgroundOnly && input.existingImageId) {
      await prisma.generatedImage.update({
        where: { id: input.existingImageId },
        data: { imagePath, backgroundUrl },
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
      };
    }

    const image = await prisma.generatedImage.create({
      data: {
        userId: input.userId,
        prompt: input.prompt,
        htmlContent: "[SD_PIPELINE]",
        imagePath,
        generatedJson: JSON.stringify(sdData),
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

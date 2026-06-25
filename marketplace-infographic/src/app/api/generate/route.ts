import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeGenerationSlot } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { generateInfographicHtml } from "@/lib/ollama";
import { renderHtmlToImage } from "@/lib/puppeteer";
import {
  parseProductImageDataUrl,
  processProductImage,
  saveProductImage,
  stripProductImageFromHtml,
} from "@/lib/product-image";
import { generateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" },
      { status: 400 },
    );
  }

  let slot: Awaited<ReturnType<typeof consumeGenerationSlot>>;
  try {
    slot = await consumeGenerationSlot(session.user.id);
  } catch {
    return NextResponse.json(
      {
        error: "Лимит исчерпан. Бесплатно — 5 в день. Купите пакет 20 генераций за 500 ₽.",
        code: "NO_GENERATIONS_LEFT",
      },
      { status: 402 },
    );
  }

  try {
    let productImageSrc: string | undefined;
    let productImageCutout = false;

    if (parsed.data.productImage) {
      try {
        const { buffer, ext } = parseProductImageDataUrl(parsed.data.productImage);
        await saveProductImage(buffer, session.user.id, ext);
        const processed = await processProductImage(buffer, session.user.id);
        productImageSrc = processed.renderSrc;
        productImageCutout = processed.cutout;
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "IMAGE_TOO_LARGE") {
          return NextResponse.json(
            { error: "Фото слишком большое. Максимум 4 МБ." },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { error: "Некорректный формат фото. Используйте JPG, PNG или WebP." },
          { status: 400 },
        );
      }
    }

    const { html, source, appliedStyle } = await generateInfographicHtml(parsed.data.prompt, {
      productImageSrc,
      productImageCutout,
      style: parsed.data.style,
    });
    const filename = `${session.user.id}-${Date.now()}.png`;
    const imagePath = await renderHtmlToImage(html, filename);
    const htmlForDb = productImageSrc
      ? stripProductImageFromHtml(html, productImageSrc)
      : html;

    const image = await prisma.generatedImage.create({
      data: {
        userId: session.user.id,
        prompt: parsed.data.prompt,
        htmlContent: htmlForDb,
        imagePath,
        usedFreeQuota: slot.usedFreeQuota,
      },
    });

    const balance = slot.usedFreeQuota
      ? {
          ...slot.balance,
          freeRemaining: slot.balance.freeRemaining - 1,
        }
      : slot.balance;

    return NextResponse.json({
      id: image.id,
      imagePath: image.imagePath,
      freeRemaining: balance.unlimited ? -1 : balance.freeRemaining,
      credits: balance.credits,
      unlimited: balance.unlimited,
      usedFreeQuota: slot.usedFreeQuota,
      aiSource: source,
      appliedStyle,
    });
  } catch (error) {
    if (!slot.usedFreeQuota && !slot.balance.unlimited) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { increment: 1 } },
      });
    }
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Ошибка генерации" }, { status: 500 });
  }
}

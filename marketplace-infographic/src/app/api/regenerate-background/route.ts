import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleGenerateInfographic } from "@/lib/generate-infographic-handler";
import { prisma } from "@/lib/prisma";
import { regenerateBackgroundSchema } from "@/lib/validations";

export const maxDuration = 720;

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

  const parsed = regenerateBackgroundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" },
      { status: 400 },
    );
  }

  const existing = await prisma.generatedImage.findUnique({
    where: { id: parsed.data.imageId },
  });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    const seed =
      parsed.data.backgroundSeed ?? `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const result = await handleGenerateInfographic({
      userId: session.user.id,
      prompt: existing.prompt,
      regenerateBackgroundOnly: true,
      existingImageId: parsed.data.imageId,
      backgroundSeed: seed,
      style: parsed.data.style,
      productImage: parsed.data.productImage,
      renderModel: parsed.data.renderModel,
    });

    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "NO_GENERATIONS_LEFT") {
      return NextResponse.json(
        {
          error:
            "Лимит исчерпан. Бесплатно — 5 в день. Купите пакет 20 генераций за 500 ₽.",
          code: "NO_GENERATIONS_LEFT",
        },
        { status: 402 },
      );
    }
    if (code === "PRODUCT_IMAGE_REQUIRED") {
      return NextResponse.json(
        {
          error:
            "Не найдено фото товара. Загрузите фото снова и повторите перегенерацию.",
          code: "PRODUCT_IMAGE_REQUIRED",
        },
        { status: 400 },
      );
    }
    if (code === "IMAGE_NOT_FOUND") {
      return NextResponse.json({ error: "Изображение не найдено" }, { status: 404 });
    }
    console.error("regenerate-background error:", error);
    return NextResponse.json({ error: "Не удалось перегенерировать фон" }, { status: 500 });
  }
}

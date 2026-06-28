import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unpackSdPayload } from "@/lib/sd-stored-payload";
import { generatedImageFilePath } from "@/lib/image-url";

/** Последняя генерация текущего пользователя с диагностикой */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const image = await prisma.generatedImage.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!image) {
    return NextResponse.json({ error: "Генераций пока нет" }, { status: 404 });
  }

  const stored = image.generatedJson ? unpackSdPayload(image.generatedJson) : null;
  const diagnostic = stored?.generationDiagnostic;

  return NextResponse.json({
    id: image.id,
    prompt: image.prompt,
    createdAt: image.createdAt,
    diagnosticsUrl: `/api/images/${image.id}/diagnostics`,
    diagnostic: diagnostic ?? null,
    renderReport: diagnostic?.renderReport ?? stored?.renderEngine ?? null,
    steps: diagnostic?.steps ?? [],
    artifacts: {
      finalImage: `/api/generated/${generatedImageFilePath(image.imagePath)}`,
      background: image.backgroundUrl,
      productCutout: image.productCutout,
    },
    legacy: !diagnostic,
    message: diagnostic
      ? undefined
      : "Диагностика доступна только для генераций после обновления. Сгенерируйте карточку ещё раз.",
  });
}

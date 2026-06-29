import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { unpackSdPayload } from "@/lib/sd-stored-payload";
import { generatedImageFilePath } from "@/lib/image-url";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const image = await prisma.generatedImage.findUnique({ where: { id } });

  if (!image) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const isOwner = image.userId === session.user.id;
  const isAdmin = isAdminEmail(session.user.email);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const stored = image.generatedJson ? unpackSdPayload(image.generatedJson) : null;
  const diagnostic = stored?.generationDiagnostic;

  return NextResponse.json({
    id: image.id,
    prompt: image.prompt,
    createdAt: image.createdAt,
    pipelineVersion: diagnostic?.pipelineVersion,
    diagnostic: diagnostic ?? null,
    renderReport: diagnostic?.renderReport ?? stored?.renderEngine ?? null,
    governance: stored?.governanceBlueprint ?? null,
    decisionTrace: stored?.decisionTrace ?? null,
    renderReportJson: stored?.renderReportJson ?? null,
    scorecard: stored?.governanceScorecard ?? null,
    constitution: stored?.designConstitution ?? null,
    promptCompiler: stored?.promptCompiler ?? null,
    qualityValidation: stored?.qualityValidation ?? null,
    artifacts: {
      finalImage: `/api/generated/${generatedImageFilePath(image.imagePath)}`,
      background: image.backgroundUrl,
      productCutout: image.productCutout,
    },
    legacy: !diagnostic,
  });
}

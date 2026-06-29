import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approveTrainingSchema } from "@/lib/library-validations";
import { requireAdmin, validationError } from "@/lib/require-admin";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError("Некорректный JSON");
  }

  const parsed = approveTrainingSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Ошибка валидации");
  }

  if (parsed.data.fontId) {
    const font = await prisma.libraryFont.findUnique({ where: { id: parsed.data.fontId } });
    if (!font) return validationError("Шрифт не найден");
  }

  if (parsed.data.badgeId) {
    const badge = await prisma.libraryBadge.findUnique({ where: { id: parsed.data.badgeId } });
    if (!badge) return validationError("Плашка не найдена");
  }

  const resultJson =
    typeof parsed.data.generatedJson === "string"
      ? parsed.data.generatedJson
      : JSON.stringify(parsed.data.generatedJson);

  const example = await prisma.designExample.create({
    data: {
      prompt: parsed.data.prompt,
      resultJson,
      fontId: parsed.data.fontId ?? null,
      badgeId: parsed.data.badgeId ?? null,
      appliedStyle: parsed.data.appliedStyle,
      tags: parsed.data.tags ?? [],
    },
    include: {
      font: { select: { id: true, name: true } },
      badge: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    {
      example: {
        id: example.id,
        prompt: example.prompt,
        resultJson: example.resultJson,
        fontId: example.fontId,
        badgeId: example.badgeId,
        appliedStyle: example.appliedStyle,
        tags: example.tags,
        createdAt: example.createdAt.toISOString(),
        font: example.font,
        badge: example.badge,
      },
    },
    { status: 201 },
  );
}

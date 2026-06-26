import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createDesignExampleSchema } from "@/lib/library-validations";
import { requireAdmin, validationError } from "@/lib/require-admin";

function serializeExample(example: {
  id: string;
  prompt: string;
  resultJson: string;
  fontId: string | null;
  badgeId: string | null;
  appliedStyle: string;
  tags: string[];
  createdAt: Date;
  font: { id: string; name: string } | null;
  badge: { id: string; name: string } | null;
}) {
  return {
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
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const tagsParam = request.nextUrl.searchParams.get("tags");
  const filterTags = tagsParam
    ? tagsParam
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const where: Prisma.DesignExampleWhereInput =
    filterTags.length > 0
      ? {
          tags: {
            hasSome: filterTags,
          },
        }
      : {};

  const examples = await prisma.designExample.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      font: { select: { id: true, name: true } },
      badge: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ examples: examples.map(serializeExample) });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError("Некорректный JSON");
  }

  const parsed = createDesignExampleSchema.safeParse(body);
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

  const example = await prisma.designExample.create({
    data: {
      prompt: parsed.data.prompt,
      resultJson: parsed.data.resultJson,
      fontId: parsed.data.fontId ?? null,
      badgeId: parsed.data.badgeId ?? null,
      appliedStyle: parsed.data.appliedStyle,
      tags: parsed.data.tags,
    },
    include: {
      font: { select: { id: true, name: true } },
      badge: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ example: serializeExample(example) }, { status: 201 });
}

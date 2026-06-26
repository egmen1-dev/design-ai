import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createLibraryBadgeSchema } from "@/lib/library-validations";
import { requireAdmin, validationError } from "@/lib/require-admin";

function serializeBadge(badge: {
  id: string;
  name: string;
  htmlTemplate: string;
  svgTemplate: string | null;
  pngUrl: string | null;
  styleTags: string[];
  createdAt: Date;
}) {
  return {
    id: badge.id,
    name: badge.name,
    htmlTemplate: badge.htmlTemplate,
    svgTemplate: badge.svgTemplate,
    pngUrl: badge.pngUrl,
    styleTags: badge.styleTags,
    createdAt: badge.createdAt.toISOString(),
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const badges = await prisma.libraryBadge.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ badges: badges.map(serializeBadge) });
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

  const parsed = createLibraryBadgeSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Ошибка валидации");
  }

  const data: Prisma.LibraryBadgeCreateInput = {
    name: parsed.data.name,
    htmlTemplate: parsed.data.htmlTemplate,
    svgTemplate: parsed.data.svgTemplate ?? null,
    pngUrl: parsed.data.pngUrl ?? null,
    styleTags: parsed.data.styleTags,
  };

  const badge = await prisma.libraryBadge.create({ data });

  return NextResponse.json({ badge: serializeBadge(badge) }, { status: 201 });
}

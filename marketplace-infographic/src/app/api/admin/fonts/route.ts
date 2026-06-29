import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createLibraryFontSchema,
  fontCategoryFromPrisma,
  fontCategoryToPrisma,
} from "@/lib/library-validations";
import { requireAdmin, validationError } from "@/lib/require-admin";

function serializeFont(font: {
  id: string;
  name: string;
  cssImport: string;
  fontFamily: string;
  category: Parameters<typeof fontCategoryFromPrisma>[0];
  styleTags: string[];
  createdAt: Date;
}) {
  return {
    id: font.id,
    name: font.name,
    cssImport: font.cssImport,
    fontFamily: font.fontFamily,
    category: fontCategoryFromPrisma(font.category),
    styleTags: font.styleTags,
    createdAt: font.createdAt.toISOString(),
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const fonts = await prisma.libraryFont.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ fonts: fonts.map(serializeFont) });
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

  const parsed = createLibraryFontSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Ошибка валидации");
  }

  const data: Prisma.LibraryFontCreateInput = {
    name: parsed.data.name,
    cssImport: parsed.data.cssImport,
    fontFamily: parsed.data.fontFamily,
    category: fontCategoryToPrisma(parsed.data.category),
    styleTags: parsed.data.styleTags,
  };

  const font = await prisma.libraryFont.create({ data });

  return NextResponse.json({ font: serializeFont(font) }, { status: 201 });
}

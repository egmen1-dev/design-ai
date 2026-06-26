import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Не указан id" }, { status: 400 });
  }

  const existing = await prisma.libraryFont.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Шрифт не найден" }, { status: 404 });
  }

  await prisma.libraryFont.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

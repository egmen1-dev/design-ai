import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { grantCreditsSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = grantCreditsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Пользователь с таким email не найден" },
      { status: 404 },
    );
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: parsed.data.credits } },
      select: { id: true, email: true, credits: true },
    }),
    prisma.creditPurchase.create({
      data: {
        userId: user.id,
        credits: parsed.data.credits,
        provider: parsed.data.reason
          ? `admin:${parsed.data.reason}`
          : "admin",
        status: "completed",
      },
    }),
  ]);

  return NextResponse.json({ success: true, user: updatedUser });
}

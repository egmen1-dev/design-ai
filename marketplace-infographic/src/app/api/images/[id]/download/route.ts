import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { generatedImageFilePath } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const image = await prisma.generatedImage.findUnique({ where: { id } });

  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = image.userId === session.user.id;
  const isAdmin = isAdminEmail(session.user.email);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "generated",
    generatedImageFilePath(image.imagePath),
  );

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="infographic-${id.slice(0, 8)}.png"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

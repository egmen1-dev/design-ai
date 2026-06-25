import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { GENERATED_IMAGES_DIR } from "@/lib/puppeteer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const safeFilename = path.basename(decodeURIComponent(filename));

  if (!safeFilename.endsWith(".png")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const image = await readFile(path.join(GENERATED_IMAGES_DIR, safeFilename));
    return new NextResponse(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  parseProductImageDataUrl,
  processProductImageWithImgly,
} from "@/lib/product-image-sd";
import { uploadImageSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = uploadImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" },
      { status: 400 },
    );
  }

  try {
    const { buffer } = parseProductImageDataUrl(parsed.data.image);
    const processed = await processProductImageWithImgly(buffer, session.user.id);

    return NextResponse.json({
      cutout: processed.cutout,
      method: processed.method,
      renderSrc: processed.renderSrc,
      path: processed.webPath,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "IMAGE_TOO_LARGE") {
      return NextResponse.json({ error: "Фото слишком большое" }, { status: 400 });
    }
    console.error("upload error:", error);
    return NextResponse.json({ error: "Не удалось обработать фото" }, { status: 500 });
  }
}

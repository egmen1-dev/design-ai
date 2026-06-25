import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleGenerateInfographic } from "@/lib/generate-infographic-handler";
import { generateInfographicSchema } from "@/lib/validations";

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

  const parsed = generateInfographicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" },
      { status: 400 },
    );
  }

  try {
    const result = await handleGenerateInfographic({
      userId: session.user.id,
      prompt: parsed.data.prompt,
      productImage: parsed.data.productImage,
    });

    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "NO_GENERATIONS_LEFT") {
      return NextResponse.json(
        {
          error:
            "Лимит исчерпан. Бесплатно — 5 в день. Купите пакет 20 генераций за 500 ₽.",
          code: "NO_GENERATIONS_LEFT",
        },
        { status: 402 },
      );
    }
    if (code === "PRODUCT_IMAGE_REQUIRED") {
      return NextResponse.json({ error: "Загрузите фото товара" }, { status: 400 });
    }
    console.error("generate-infographic error:", error);
    return NextResponse.json({ error: "Ошибка генерации" }, { status: 500 });
  }
}

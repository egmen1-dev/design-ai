import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInfographicHtml } from "@/lib/ollama";
import { renderHtmlToImage } from "@/lib/puppeteer";
import { rateLimit } from "@/lib/rate-limit";
import { isActiveSubscription } from "@/lib/stripe";
import { generateSchema } from "@/lib/validations";

const FREE_LIMIT = 3;
const PRO_LIMIT = 30;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hasPro = isActiveSubscription(user.subscription?.status);
  const limit = hasPro ? PRO_LIMIT : FREE_LIMIT;
  const rateKey = `generate:${user.id}:${ip}`;
  const rate = rateLimit(rateKey, limit, 86_400_000);

  if (!rate.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        resetAt: rate.resetAt,
        limit: rate.limit,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rate.limit),
          "X-RateLimit-Remaining": String(rate.remaining),
          "X-RateLimit-Reset": String(rate.resetAt),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const html = await generateInfographicHtml(parsed.data.prompt);
    const filename = `${user.id}-${Date.now()}.png`;
    const imagePath = await renderHtmlToImage(html, filename);

    const image = await prisma.generatedImage.create({
      data: {
        userId: user.id,
        prompt: parsed.data.prompt,
        htmlContent: html,
        imagePath,
      },
    });

    return NextResponse.json(
      {
        id: image.id,
        imagePath: image.imagePath,
        remaining: rate.remaining,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rate.limit),
          "X-RateLimit-Remaining": String(rate.remaining),
          "X-RateLimit-Reset": String(rate.resetAt),
        },
      },
    );
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate infographic" },
      { status: 500 },
    );
  }
}

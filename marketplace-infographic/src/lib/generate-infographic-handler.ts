import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateInfographicJson, renderInfographicHtml } from "@/lib/ollama";
import { renderHtmlToImage } from "@/lib/puppeteer";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { isActiveSubscription } from "@/lib/stripe";
import { generateSchema } from "@/lib/validations";

const FREE_LIMIT = 3;
const PRO_LIMIT = 30;

export async function handleGenerateInfographic(request: NextRequest) {
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
  if (!hasPro && user.credits <= 0) {
    return NextResponse.json(
      { error: "Недостаточно кредитов", credits: user.credits },
      { status: 402 },
    );
  }

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
        headers: rateHeaders(rate),
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
    const trainingSamples = await prisma.trainingSample.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const fewShotExamples = trainingSamples
      .map(
        (sample) =>
          `Описание: "${sample.prompt}" -> ${JSON.stringify(sample.correctedJson)}`,
      )
      .join("\n");

    const generatedJson = await generateInfographicJson({
      prompt: parsed.data.prompt,
      style: parsed.data.style,
      fewShotExamples,
    });
    const html = renderInfographicHtml(generatedJson);
    const filename = `${user.id}-${Date.now()}.png`;
    const imageUrl = await renderHtmlToImage(html, filename);

    const image = await prisma.generatedImage.create({
      data: {
        userId: user.id,
        prompt: parsed.data.prompt,
        htmlContent: html,
        imagePath: imageUrl,
      },
    });

    const credits = hasPro
      ? user.credits
      : (
          await prisma.user.update({
            where: { id: user.id },
            data: { credits: { decrement: 1 } },
            select: { credits: true },
          })
        ).credits;

    return NextResponse.json(
      {
        id: image.id,
        imageUrl,
        imagePath: imageUrl,
        generatedJson,
        appliedStyle: generatedJson.style,
        remaining: rate.remaining,
        credits,
      },
      { headers: rateHeaders(rate) },
    );
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate infographic" },
      { status: 500 },
    );
  }
}

function rateHeaders(rate: ReturnType<typeof rateLimit>) {
  return {
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
    "X-RateLimit-Reset": String(rate.resetAt),
  };
}

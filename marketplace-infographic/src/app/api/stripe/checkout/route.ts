import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREDIT_PACKAGE_AMOUNT, CREDIT_PACKAGE_PRICE_RUB } from "@/lib/pricing";
import { isStripeConfigured } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации" }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Оплата будет доступна после запуска сайта и настройки Stripe" },
      { status: 503 },
    );
  }

  const priceId = parsed.data.priceId ?? process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Stripe не настроен" }, { status: 500 });
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  if (!user.stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: session.user.email,
      name: session.user.name ?? undefined,
      metadata: { userId: user.id },
    });

    user = await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL;

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: user.stripeCustomerId!,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: {
      userId: user.id,
      credits: String(CREDIT_PACKAGE_AMOUNT),
      priceRub: String(CREDIT_PACKAGE_PRICE_RUB),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

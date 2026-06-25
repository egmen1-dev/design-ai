import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { CREDIT_PACKAGE_AMOUNT, CREDIT_PACKAGE_PRICE_RUB } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "payment" && session.payment_status === "paid") {
        const userId = session.metadata?.userId;
        if (!userId) return NextResponse.json({ received: true });

        const existing = await prisma.creditPurchase.findUnique({
          where: { stripeSessionId: session.id },
        });
        if (existing) return NextResponse.json({ received: true });

        const credits =
          Number(session.metadata?.credits) || CREDIT_PACKAGE_AMOUNT;
        const priceRub =
          Number(session.metadata?.priceRub) || CREDIT_PACKAGE_PRICE_RUB;

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: credits } },
          }),
          prisma.creditPurchase.create({
            data: {
              userId,
              credits,
              priceRub,
              stripeSessionId: session.id,
            },
          }),
        ]);
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

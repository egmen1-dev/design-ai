import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, PRO_PLAN } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured yet" },
      { status: 503 },
    );
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        const userId = session.metadata?.userId;
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id ?? "";
        const periodEnd = new Date(subscription.current_period_end * 1000);

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: subscription.status,
            plan: PRO_PLAN,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: subscription.status,
            plan: PRO_PLAN,
            currentPeriodEnd: periodEnd,
          },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!existing) break;

        const periodEnd = new Date(subscription.current_period_end * 1000);
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodEnd: periodEnd,
          },
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

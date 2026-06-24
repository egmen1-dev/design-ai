import Stripe from "stripe";

export const PRO_PLAN = "pro";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export function isActiveSubscription(status: string | undefined): boolean {
  return status === "active" || status === "trialing";
}

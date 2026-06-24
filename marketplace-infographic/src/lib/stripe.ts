import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const PRO_PLAN = "pro";

export function isActiveSubscription(status: string | undefined): boolean {
  return status === "active" || status === "trialing";
}

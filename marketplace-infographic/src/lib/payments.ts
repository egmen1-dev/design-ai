/** Платежи доступны только после настройки Stripe на продакшене */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PRICE_ID?.trim(),
  );
}

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Оплата будет доступна после запуска сайта на VPS и настройки Stripe";

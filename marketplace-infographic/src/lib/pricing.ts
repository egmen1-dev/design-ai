export const FREE_DAILY_LIMIT = 5;
export const CREDIT_PACKAGE_AMOUNT = 20;
export const CREDIT_PACKAGE_PRICE_RUB = 500;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

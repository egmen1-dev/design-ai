import type { Prisma } from "@prisma/client";

const BUILTIN_ADMIN_EMAILS = ["maksim00i@mail.ru"];

export function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set([...BUILTIN_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv])];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function hasUnlimitedGenerations(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}

/** Исключить админов из аналитики — только реальные пользователи */
export function adminUserFilter(): Prisma.UserWhereInput {
  return { email: { notIn: getAdminEmails() } };
}

export function adminActivityFilter(
  adminUserIds: string[],
): Prisma.GeneratedImageWhereInput {
  if (adminUserIds.length === 0) return {};
  return { userId: { notIn: adminUserIds } };
}

export function adminPurchaseFilter(
  adminUserIds: string[],
): Prisma.CreditPurchaseWhereInput {
  if (adminUserIds.length === 0) return {};
  return { userId: { notIn: adminUserIds } };
}

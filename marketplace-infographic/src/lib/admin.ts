import type { Session } from "next-auth";

const DEFAULT_ADMIN_EMAILS = ["maksim00i@mail.ru"];

export function getAdminEmails(): string[] {
  const envEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails]));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function isAdminSession(session: Session | null): boolean {
  return isAdminEmail(session?.user?.email);
}

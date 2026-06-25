export function getSiteUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export const SITE_NAME = "design-ai";

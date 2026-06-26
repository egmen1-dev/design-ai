import { designBriefSchema, type DesignBrief } from "./schema";
import { enrichBriefBackgroundPrompt } from "@/lib/prompt/background";
import type { ProductCategory } from "@/lib/product-analysis";
import { normalizeMarketplacePalette } from "@/lib/accent-color";
import { stripProductFromBackgroundPrompt } from "@/lib/product-render-policy";

function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeHex(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`;
  return fallback;
}

function normalizeBullets(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const bullets = value
    .map((item) => clip(String(item).replace(/\bитра\b/gi, "литра"), 80))
    .filter(Boolean);
  while (bullets.length < 2) bullets.push("Премиум качество");
  return bullets.slice(0, 5);
}

export function sanitizeDesignBrief(
  raw: unknown,
  category: ProductCategory,
): DesignBrief {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const colorsRaw = Array.isArray(obj.colorPalette)
    ? obj.colorPalette
    : Array.isArray(obj.colors)
      ? obj.colors
      : ["#00a8b5", "#ffffff", "#0f172a"];

  const [accent, light, dark] = normalizeMarketplacePalette(
    colorsRaw.map((c) => String(c)),
    category,
  );
  const normalizedPalette = [accent, light, dark];

  const bgRaw = clip(obj.backgroundPrompt, 500);
  const backgroundPrompt = enrichBriefBackgroundPrompt(
    stripProductFromBackgroundPrompt(bgRaw),
    category,
  );

  const candidate = {
    ...obj,
    layout: obj.layout ?? "marketplace",
    designProcess: obj.designProcess ?? undefined,
    visualHook:
      obj.visualHook ??
      (obj.designProcess &&
      typeof obj.designProcess === "object" &&
      "visualHook" in (obj.designProcess as object)
        ? (obj.designProcess as { visualHook: unknown }).visualHook
        : undefined),
    headline: clip(obj.headline ?? obj.title ?? "Товар", 60),
    title: clip(obj.title ?? obj.headline ?? "Товар", 60),
    subtitle: clip(obj.subtitle ?? obj.subHeadline ?? "новинка", 80),
    subHeadline: clip(obj.subHeadline ?? obj.subtitle, 80),
    bullets: normalizeBullets(obj.bullets ?? obj.benefits),
    benefits: normalizeBullets(obj.benefits ?? obj.bullets),
    colorPalette: normalizedPalette,
    colors: normalizedPalette,
    backgroundPrompt,
    badge: clip(obj.badge ?? "Brand", 40),
    fontId: obj.fontId === null ? null : typeof obj.fontId === "string" ? obj.fontId : null,
    badgeId: obj.badgeId === null ? null : typeof obj.badgeId === "string" ? obj.badgeId : null,
    objectScale:
      typeof obj.objectScale === "number"
        ? Math.min(0.9, Math.max(0.3, obj.objectScale))
        : 0.78,
    reflection: Boolean(obj.reflection),
  };

  return designBriefSchema.parse(candidate);
}

import { stripProductFromBackgroundPrompt } from "@/lib/product-render-policy";
import { infographicSdSchema, type InfographicSdInput } from "@/lib/validations";

function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeHex(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) {
    return raw.length <= 7 ? raw : raw.slice(0, 7);
  }
  if (/^[0-9a-fA-F]{3,6}$/.test(raw)) {
    return `#${raw.slice(0, 6)}`;
  }
  return fallback;
}

function normalizeLayout(value: unknown): InfographicSdInput["layout"] {
  const layouts = ["hero", "cards", "split", "minimal", "marketplace"] as const;
  return layouts.includes(value as (typeof layouts)[number])
    ? (value as InfographicSdInput["layout"])
    : "marketplace";
}

function normalizeUuidOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "null" || value === "") {
    return null;
  }
  const raw = String(value).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }
  return null;
}

/** Приводит ответ Ollama к валидной схеме SD (без падения на длинном промпте) */
export function sanitizeSdInput(raw: unknown): InfographicSdInput {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const bullets = Array.isArray(obj.bullets)
    ? obj.bullets
        .map((item) =>
          clip(String(item).replace(/\bитра\b/gi, "литра"), 80),
        )
        .filter((item) => item.length > 0)
        .slice(0, 1)
    : [];

  if (bullets.length === 0) {
    bullets.push("Премиум качество");
  }

  const deferredBullets = Array.isArray(obj.deferredBullets)
    ? obj.deferredBullets.map((item) => clip(String(item), 80)).filter(Boolean).slice(0, 6)
    : undefined;

  const heroMetricRaw = obj.heroMetric as Record<string, unknown> | undefined;
  const heroMetric =
    heroMetricRaw && heroMetricRaw.value
      ? { value: clip(heroMetricRaw.value, 20), label: clip(heroMetricRaw.label, 40) || "параметр" }
      : undefined;

  const colors = Array.isArray(obj.colors)
    ? obj.colors.map((c, i) =>
        normalizeHex(c, ["#e31e24", "#2563eb", "#0f172a"][i] ?? "#0f172a"),
      )
    : ["#e31e24", "#2563eb", "#0f172a"];

  const candidate = {
    layout: normalizeLayout(obj.layout),
    title: clip(obj.title || "ТОВАР", 60) || "ТОВАР",
    subtitle: clip(obj.subtitle || "новинка", 80) || "новинка",
    bullets,
    deferredBullets,
    colors: colors.slice(0, 5),
    badge: clip(obj.badge || "Brand", 40) || "Brand",
    creativeHeadline: clip(obj.creativeHeadline, 60) || undefined,
    heroMetric,
    backgroundPrompt: stripProductFromBackgroundPrompt(
      clip(
        obj.backgroundPrompt ||
          "professional garden lawn path, suburban backyard, wooden fence blurred, sunny daylight, clear empty grass foreground, photorealistic, no text",
        400,
      ),
    ) || "sunny garden lawn, clear empty grass foreground, blurred fence, photorealistic, no text, no objects",
    fontId: normalizeUuidOrNull(obj.fontId),
    badgeId: normalizeUuidOrNull(obj.badgeId),
  };

  return infographicSdSchema.parse(candidate);
}

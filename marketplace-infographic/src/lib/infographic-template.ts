import { z } from "zod";
import type { CompositionLayout } from "@/lib/composition/types";
import {
  type InfographicStyle,
} from "./design-trends";
import type { InfographicSdInput } from "./validations";
import {
  renderLayoutHtml,
  renderProductPhotoHtml,
} from "./infographic-html-templates";

const backgroundSceneSchema = z.enum([
  "outdoor_home",
  "kitchen",
  "bathroom",
  "office",
  "nature",
  "studio",
]);

const calloutPositionSchema = z.enum([
  "bottom-left",
  "bottom-right",
  "middle-left",
  "middle-right",
]);

const productVisualSchema = z.enum([
  "generator",
  "appliance",
  "cosmetic",
  "generic",
]);

export const infographicDataSchema = z.object({
  /** Одно слово КАПСОМ — тип товара: ГЕНЕРАТОР, КРЕМ, НАУШНИКИ */
  headline: z.string().min(1).max(60),
  productName: z.string().min(1).max(80),
  categoryPill: z.string().min(1).max(30).optional(),
  brandName: z.string().min(1).max(40).optional(),
  productEmoji: z.string().min(1).max(8).optional(),
  productVisual: productVisualSchema.optional(),
  backgroundScene: backgroundSceneSchema,
  specBlocks: z
    .array(
      z.object({
        value: z.string().min(1).max(30),
        label: z.string().min(1).max(40),
        hint: z.string().max(80).optional(),
      }),
    )
    .min(1)
    .max(2),
  mainBanner: z
    .object({
      icon: z.string().max(4).optional(),
      title: z.string().min(1).max(60),
      description: z.string().min(1).max(120),
    })
    .optional(),
  callouts: z
    .array(
      z.object({
        text: z.string().min(1).max(80),
        position: calloutPositionSchema,
      }),
    )
    .max(4)
    .optional()
    .default([]),
  posterMode: z.boolean().optional(),
  accentColor: z.enum(["red", "blue", "purple", "green"]).optional(),
  /** Зоны marketplace-шаблона (без дублирования текста) */
  marketplaceGift: z.string().max(80).optional(),
  marketplaceSidebar: z
    .array(
      z.object({
        value: z.string().max(12),
        label: z.string().max(50),
      }),
    )
    .max(3)
    .optional(),
  marketplaceFooter: z.string().max(60).optional(),
  marketplaceBottom: z.string().max(60).optional(),
});

export type InfographicData = z.infer<typeof infographicDataSchema>;

const ACCENT = {
  red: { primary: "#e31e24", dark: "#b91c1c", badge: "#2563eb" },
  blue: { primary: "#2563eb", dark: "#1d4ed8", badge: "#2563eb" },
  purple: { primary: "#7c3aed", dark: "#6d28d9", badge: "#6366f1" },
  green: { primary: "#16a34a", dark: "#15803d", badge: "#2563eb" },
} as const;

export type RenderInfographicOptions = {
  productImageSrc?: string;
  productImageCutout?: boolean;
  style?: InfographicStyle;
  layout?: InfographicSdInput["layout"];
  /** Готовый композит фон+товар (sharp) */
  mergedImageDataUrl?: string;
  /** SD-фон без композита — товар накладывается в HTML */
  backgroundDataUrl?: string;
  backgroundCss?: string;
  libraryFont?: {
    cssImport: string;
    fontFamily: string;
  } | null;
  libraryBadge?: {
    htmlTemplate: string;
  } | null;
  /** Параметрическая SVG-плашка из Design Assets Intelligence */
  parametricBadgeHtml?: string | null;
  /** Точный hex акцента (из референса / Ollama colors[0]) */
  accentHex?: string;
  /** Design Composition Engine — размеры в % от холста WB */
  compositionLayout?: CompositionLayout;
  /** Исходный промпт товара — для фактологичного заголовка marketplace */
  productPrompt?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detectProductVisual(data: InfographicData): z.infer<typeof productVisualSchema> {
  if (data.productVisual) return data.productVisual;
  const text = `${data.productName} ${data.headline}`.toLowerCase();
  if (/генератор|бензин|квт|инвертор/.test(text)) return "generator";
  if (/крем|сыворот|космет|spf|шампун/.test(text)) return "cosmetic";
  if (/пылесос|чайник|робот|техник/.test(text)) return "appliance";
  return "generic";
}

function renderProductVisual(
  visual: z.infer<typeof productVisualSchema>,
  accent: string,
  productName: string,
): string {
  if (visual === "generator") {
    return `
      <div class="product-generator">
        <div class="gen-top" style="background:${accent}"></div>
        <div class="gen-body">
          <div class="gen-side-vent"></div>
          <div class="gen-panel">
            <div class="gen-panel-line"></div>
            <div class="gen-panel-line short"></div>
            <div class="gen-panel-dot"></div>
          </div>
          <div class="gen-handle" style="background:${accent}"></div>
        </div>
        <div class="gen-wheel gen-wheel-l"></div>
        <div class="gen-wheel gen-wheel-r"></div>
      </div>`;
  }

  if (visual === "appliance") {
    return `
      <div class="product-appliance">
        <div class="appl-body">
          <div class="appl-screen"></div>
          <div class="appl-btn" style="background:${accent}"></div>
        </div>
      </div>`;
  }

  if (visual === "cosmetic") {
    return `
      <div class="product-cosmetic">
        <div class="cosm-cap" style="background:${accent}"></div>
        <div class="cosm-tube"></div>
      </div>`;
  }

  return `
    <div class="product-generic">
      <div class="generic-box" style="border-color:${accent}">
        <div class="generic-shine"></div>
      </div>
    </div>`;
}

export function renderInfographicHtml(
  data: InfographicData,
  options?: RenderInfographicOptions,
): string {
  const useMerged = Boolean(options?.mergedImageDataUrl);
  const useSdBg = !useMerged && Boolean(options?.backgroundDataUrl);
  const cutout = Boolean(options?.productImageCutout);
  const visual = detectProductVisual(data);
  const accent = ACCENT[data.accentColor ?? "red"];

  const productStageHtml =
    !useMerged && options?.productImageSrc
      ? renderProductPhotoHtml(options.productImageSrc, data.productName, cutout)
      : !useMerged && !useSdBg
        ? renderProductVisual(visual, accent.primary, data.productName)
        : useSdBg && options?.productImageSrc
          ? renderProductPhotoHtml(options.productImageSrc, data.productName, cutout)
          : "";

  return renderLayoutHtml(data, {
    ...options,
    layout: options?.layout ?? "hero",
    productStageHtml,
    hasPhoto: useMerged || useSdBg || Boolean(options?.productImageSrc),
  });
}

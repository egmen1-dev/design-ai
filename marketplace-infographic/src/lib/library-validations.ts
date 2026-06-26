import { z } from "zod";
import type { FontCategory } from "@prisma/client";
import { STYLE_KEYS } from "@/lib/design-trends";

export const styleTagsSchema = z
  .array(z.enum(STYLE_KEYS))
  .min(1, "Укажите хотя бы один стиль");

export const fontCategoryApiSchema = z.enum([
  "sans-serif",
  "serif",
  "display",
  "monospace",
]);

export type FontCategoryApi = z.infer<typeof fontCategoryApiSchema>;

const FONT_CATEGORY_TO_PRISMA: Record<FontCategoryApi, FontCategory> = {
  "sans-serif": "sans_serif",
  serif: "serif",
  display: "display",
  monospace: "monospace",
};

const FONT_CATEGORY_FROM_PRISMA: Record<FontCategory, FontCategoryApi> = {
  sans_serif: "sans-serif",
  serif: "serif",
  display: "display",
  monospace: "monospace",
};

export function fontCategoryToPrisma(category: FontCategoryApi): FontCategory {
  return FONT_CATEGORY_TO_PRISMA[category];
}

export function fontCategoryFromPrisma(category: FontCategory): FontCategoryApi {
  return FONT_CATEGORY_FROM_PRISMA[category];
}

export const createLibraryFontSchema = z.object({
  name: z.string().min(1, "Укажите название").max(120),
  cssImport: z
    .string()
    .min(1, "Укажите CSS import")
    .max(2000)
    .refine(
      (value) => value.includes("fonts.googleapis.com") || value.includes("<link"),
      "cssImport должен содержать ссылку Google Fonts или тег <link>",
    ),
  fontFamily: z.string().min(1, "Укажите font-family").max(200),
  category: fontCategoryApiSchema,
  styleTags: styleTagsSchema,
});

export const createLibraryBadgeSchema = z.object({
  name: z.string().min(1, "Укажите название").max(120),
  htmlTemplate: z
    .string()
    .min(1, "Укажите HTML-шаблон")
    .max(20_000)
    .refine(
      (value) => value.includes("{{text}}"),
      "htmlTemplate должен содержать плейсхолдер {{text}}",
    ),
  svgTemplate: z.string().max(50_000).optional().nullable(),
  pngUrl: z
    .string()
    .max(2000)
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
      "Некорректный URL",
    )
    .optional()
    .nullable(),
  styleTags: styleTagsSchema,
});

export type CreateLibraryFontInput = z.infer<typeof createLibraryFontSchema>;
export type CreateLibraryBadgeInput = z.infer<typeof createLibraryBadgeSchema>;

export const createDesignExampleSchema = z.object({
  prompt: z.string().min(1).max(5000),
  resultJson: z.string().min(2).max(100_000),
  fontId: z.string().uuid().nullable().optional(),
  badgeId: z.string().uuid().nullable().optional(),
  appliedStyle: z.enum(STYLE_KEYS),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const approveTrainingSchema = z.object({
  prompt: z.string().min(1).max(5000),
  generatedJson: z.union([z.string().min(2).max(100_000), z.record(z.string(), z.unknown())]),
  fontId: z.string().uuid().nullable().optional(),
  badgeId: z.string().uuid().nullable().optional(),
  appliedStyle: z.enum(STYLE_KEYS),
  tags: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
});

export type CreateDesignExampleInput = z.infer<typeof createDesignExampleSchema>;
export type ApproveTrainingInput = z.infer<typeof approveTrainingSchema>;

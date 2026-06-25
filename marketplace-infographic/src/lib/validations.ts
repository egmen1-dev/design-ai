import { z } from "zod";
import { DEFAULT_STYLE, STYLE_KEYS } from "./design-trends";

export const infographicSdSchema = z.object({
  layout: z.enum(["hero", "cards", "split", "minimal"]).default("hero"),
  title: z.string().min(1).max(60),
  subtitle: z.string().min(1).max(80),
  bullets: z.array(z.string().min(1).max(80)).min(2).max(5),
  colors: z.array(z.string().min(4).max(7)).min(2).max(5),
  badge: z.string().min(1).max(40),
  backgroundPrompt: z.string().min(10).max(200),
});

export type InfographicSdInput = z.infer<typeof infographicSdSchema>;

export const generateInfographicSchema = z.object({
  prompt: z
    .string()
    .min(10, "Описание должно быть не короче 10 символов")
    .max(2000, "Описание слишком длинное"),
  productImage: z
    .string()
    .trim()
    .min(1, "Загрузите фото товара")
    .refine(
      (value) => /^data:image\/(?:jpeg|png|webp);base64,/i.test(value),
      "Загрузите JPG, PNG или WebP",
    )
    .refine((value) => value.length <= 6_000_000, "Фото слишком большое (макс. 4 МБ)"),
  style: z.enum(STYLE_KEYS).optional().default(DEFAULT_STYLE),
});

export const regenerateBackgroundSchema = z.object({
  imageId: z.string().min(1),
  backgroundSeed: z.string().max(64).optional(),
});

export const uploadImageSchema = z.object({
  image: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => /^data:image\/(?:jpeg|png|webp);base64,/i.test(value),
      "Загрузите JPG, PNG или WebP",
    )
    .refine((value) => value.length <= 6_000_000, "Фото слишком большое"),
});

export const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, "Описание должно быть не короче 10 символов")
    .max(2000, "Описание слишком длинное"),
  style: z.enum(STYLE_KEYS).optional().default(DEFAULT_STYLE),
  productImage: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value ||
        /^data:image\/(?:jpeg|png|webp);base64,/i.test(value),
      "Загрузите JPG, PNG или WebP",
    )
    .refine(
      (value) => !value || value.length <= 6_000_000,
      "Фото слишком большое (макс. 4 МБ)",
    ),
});

export const checkoutSchema = z.object({
  priceId: z.string().min(1).optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().max(80, "Имя должно быть короче 80 символов").optional(),
  email: z.string().trim().email("Введите корректный email").toLowerCase(),
  password: z
    .string()
    .min(8, "Пароль должен быть не короче 8 символов")
    .max(128, "Пароль должен быть короче 128 символов"),
});

export const loginSchema = registerSchema.pick({
  email: true,
  password: true,
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type GenerateInfographicInput = z.infer<typeof generateInfographicSchema>;
export type RegenerateBackgroundInput = z.infer<typeof regenerateBackgroundSchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

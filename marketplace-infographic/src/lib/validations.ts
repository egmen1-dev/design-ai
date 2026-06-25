import { z } from "zod";
import { STYLE_KEYS } from "./design-trends";

export const colorSchemeSchema = z.enum(["light", "dark", "gradient"]);
export const styleSchema = z.enum(STYLE_KEYS);

export const infographicResultSchema = z
  .object({
    title: z.string().trim().min(1).max(60),
    subtitle: z.string().trim().min(1).max(180),
    bullets: z.array(z.string().trim().min(1).max(140)).min(1).max(5),
    colorScheme: colorSchemeSchema,
    style: styleSchema,
    colors: z
      .array(z.string().trim().min(1).max(32))
      .min(1)
      .max(8)
      .optional(),
    layout: z
      .enum(["hero", "cards", "timeline", "split", "radial", "comparison"])
      .optional(),
  })
  .strict();

export const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be at most 2000 characters"),
  style: styleSchema.optional(),
});

export const approveTrainingSchema = z
  .object({
    prompt: z.string().trim().min(10).max(2000),
    result: infographicResultSchema,
  })
  .strict();

export const grantCreditsSchema = z
  .object({
    email: z.string().trim().email("Введите корректный email").toLowerCase(),
    credits: z.coerce
      .number()
      .int("Кредиты должны быть целым числом")
      .min(1, "Минимум 1 кредит")
      .max(10_000, "Слишком много кредитов за одну операцию"),
    reason: z.string().trim().max(160).optional(),
  })
  .strict();

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
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InfographicResult = z.infer<typeof infographicResultSchema>;
export type ApproveTrainingInput = z.infer<typeof approveTrainingSchema>;
export type GrantCreditsInput = z.infer<typeof grantCreditsSchema>;
